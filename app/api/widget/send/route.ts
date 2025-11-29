import { type NextRequest, NextResponse } from "next/server";
import {
  checkRateLimitForRequest,
  getRateLimitHeaders,
  widgetRateLimit,
} from "@/lib/rate-limit";
import { recordChatInteraction } from "@/lib/server/ai-logging";
import {
  isUuid,
  resolveVapiAssistantIdentifiers,
} from "@/lib/server/vapi-assistant";
import { createServiceClient } from "@/lib/supabase/service";

const DEFAULT_VAPI_BASE = "https://api.vapi.ai";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function POST(request: NextRequest) {
  let persistInteraction:
    | ((details: {
        reply?: string | null;
        status?: "active" | "completed" | "error";
        metadata?: Record<string, any>;
      }) => Promise<void>)
    | null = null;
  try {
    // Rate limiting by IP
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "anonymous";
    const rateLimitResult = await checkRateLimitForRequest(
      `widget:${ip}`,
      widgetRateLimit,
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: { ...CORS_HEADERS, ...getRateLimitHeaders(rateLimitResult) },
        },
      );
    }

    const body = await request.json();
    const publicId: string | undefined = body?.publicId;
    const message: string | undefined = body?.message;
    const conversationId: string | undefined = body?.conversationId;

    if (!publicId || !message) {
      return NextResponse.json(
        { error: "publicId and message are required" },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const supabase = createServiceClient();
    const { data: config, error: configError } = await supabase
      .from("chat_widget_configs")
      .select("org_id, vapi_agent_id, vapi_agent_uuid, enabled")
      .eq("public_id", publicId)
      .single();

    if (configError) {
      console.error("Failed to load widget config", configError);
      return NextResponse.json(
        { error: "Widget not found" },
        { status: 404, headers: CORS_HEADERS },
      );
    }

    if (!config || !config.enabled || !config.vapi_agent_id) {
      return NextResponse.json(
        { error: "Widget is inactive" },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    // Resolve Vapi credentials, preferring organization-level config and
    // falling back to the legacy per-user key if needed.
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("vapi_enabled, vapi_api_key, vapi_base_url, vapi_org_id")
      .eq("id", config.org_id)
      .maybeSingle();

    if (orgError) {
      console.error("Failed to resolve organization VAPI config", orgError);
    }

    let vapiKey: string | null = null;
    let baseUrl = (process.env.VAPI_BASE_URL || DEFAULT_VAPI_BASE).replace(
      /\/$/,
      "",
    );

    if (org?.vapi_enabled && org.vapi_api_key) {
      vapiKey = org.vapi_api_key;
      if (org.vapi_base_url) {
        baseUrl = org.vapi_base_url.replace(/\/$/, "");
      }
    } else {
      const { data: owner, error: ownerError } = await supabase
        .from("users")
        .select("vapi_api_key")
        .eq("organization_id", config.org_id)
        .not("vapi_api_key", "is", null)
        .limit(1)
        .maybeSingle();

      if (ownerError) {
        console.error("Failed to resolve VAPI key from users", ownerError);
      }

      vapiKey = owner?.vapi_api_key ?? null;
    }

    if (!vapiKey) {
      return NextResponse.json(
        { error: "Ingen VAPI-nyckel hittades" },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const assistantUuid = await (async () => {
      if (!config?.vapi_agent_id && !config?.vapi_agent_uuid) return null;
      if (config?.vapi_agent_uuid) return config.vapi_agent_uuid;
      const candidate = config?.vapi_agent_id;
      if (candidate && isUuid(candidate)) {
        // Best-effort backfill - don't block on errors
        supabase
          .from("chat_widget_configs")
          .update({ vapi_agent_uuid: candidate })
          .eq("org_id", config.org_id)
          .then(({ error }) => {
            if (error)
              console.warn("Failed to backfill widget assistant UUID", error);
          });
        return candidate;
      }
      if (!candidate || !vapiKey) return null;
      try {
        const identifiers = await resolveVapiAssistantIdentifiers({
          identifier: candidate,
          apiKey: vapiKey,
          baseUrl,
          orgId: org?.vapi_org_id,
        });
        const { error: updateError } = await supabase
          .from("chat_widget_configs")
          .update({
            vapi_agent_id: identifiers.shortId,
            vapi_agent_uuid: identifiers.uuid,
          })
          .eq("org_id", config.org_id);
        if (updateError) {
          console.warn("Failed to sync widget assistant UUID", updateError);
        }
        return identifiers.uuid;
      } catch (resolverError) {
        console.error("Unable to resolve widget assistant UUID", resolverError);
        return null;
      }
    })();

    if (!assistantUuid) {
      return NextResponse.json(
        {
          error: "Widget assistant saknar ett giltigt Vapi UUID",
          details:
            "Spara om widget-inställningarna eller kontrollera att assistenten finns i Vapi.",
        },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    persistInteraction = async (details: {
      reply?: string | null;
      status?: "active" | "completed" | "error";
      metadata?: Record<string, any>;
    }) => {
      if (!config?.org_id) return;
      await recordChatInteraction({
        organizationId: config.org_id,
        assistantId: assistantUuid,
        source: "chat-widget",
        externalSessionId: conversationId,
        userMessage: { content: message, metadata: { publicId } },
        assistantMessage: details.reply
          ? { content: details.reply, metadata: details.metadata ?? {} }
          : undefined,
        status: details.status ?? "active",
        metadata: details.metadata,
      });
    };

    const endpoint = `${baseUrl}/chat`;

    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${vapiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        assistantId: assistantUuid,
        input: message,
        ...(conversationId ? { previousChatId: conversationId } : {}),
      }),
    });

    if (!upstream.ok) {
      const errorBody = await upstream.text().catch(() => upstream.statusText);
      console.error("VAPI ERROR:", errorBody);
      if (persistInteraction) {
        await persistInteraction({
          status: "error",
          metadata: {
            upstreamStatus: upstream.status,
            upstreamBody: errorBody,
          },
        });
      }
      let parsed: any = null;
      try {
        parsed = errorBody ? JSON.parse(errorBody) : null;
      } catch (_parseError) {
        parsed = null;
      }
      return NextResponse.json(
        {
          error:
            parsed?.error || parsed?.message || "VAPI responded with an error",
          details: parsed ?? errorBody ?? upstream.statusText,
        },
        { status: upstream.status, headers: CORS_HEADERS },
      );
    }

    const contentType = upstream.headers.get("content-type") ?? "";

    if (
      contentType.includes("text/event-stream") ||
      contentType.includes("text/plain")
    ) {
      const body = upstream.body;
      if (!body) {
        return NextResponse.json(
          { error: "VAPI stream unavailable" },
          { status: 502, headers: CORS_HEADERS },
        );
      }

      const decoder = new TextDecoder();
      const stream = new ReadableStream({
        async start(controller) {
          const reader = body.getReader();
          let transcript = "";
          try {
            while (true) {
              const { value, done } = await reader.read();
              if (done) break;
              transcript += decoder.decode(value, { stream: true });
              controller.enqueue(value);
            }
            transcript += decoder.decode(new Uint8Array(), { stream: false });
            controller.close();
            if (persistInteraction) {
              await persistInteraction({
                reply: transcript.trim() || null,
                status: "active",
              });
            }
          } catch (error) {
            if (persistInteraction) {
              await persistInteraction({
                status: "error",
                metadata: { streaming: true },
              });
            }
            controller.error(error);
          } finally {
            reader.releaseLock();
          }
        },
      });

      return new Response(stream, {
        headers: {
          ...CORS_HEADERS,
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    }

    const json = await upstream.json().catch(async () => {
      const text = await upstream.text().catch(() => "");
      return text ? { message: text } : null;
    });

    // VAPI chat API returns { output: [{ role: "assistant", content: "..." }], id: "chat_xxx" }
    let reply = "";
    if (json && Array.isArray(json.output) && json.output.length > 0) {
      const lastOutput = json.output[json.output.length - 1];
      reply = lastOutput?.content ?? "";
    } else {
      // Fallback for other response formats
      reply =
        (typeof json === "string"
          ? json
          : (json?.message ?? json?.response ?? json?.text ?? json?.content)) ||
        "";
    }

    if (!reply) {
      return NextResponse.json(
        { error: "Tomt svar från VAPI" },
        { status: 502, headers: CORS_HEADERS },
      );
    }

    if (persistInteraction) {
      await persistInteraction({
        reply,
        status: "active",
        metadata: typeof json === "object" ? json : undefined,
      });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(reply));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Widget send error", error);
    if (persistInteraction) {
      await persistInteraction({ status: "error" });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}
