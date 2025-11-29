import { type NextRequest, NextResponse } from "next/server";
import { Vapi } from "@/lib/analytics/vapi";
import {
  checkRateLimitForRequest,
  getRateLimitHeaders,
  widgetRateLimit,
} from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
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
          headers: getRateLimitHeaders(rateLimitResult),
        },
      );
    }

    const body = await req.json();
    const { organizationId, assistantId, message, conversationId } = body;

    if (!organizationId || !assistantId || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const serviceClient = createServiceClient();

    // Get organization's VAPI config (server-side, secure!)
    const { data: org, error: orgError } = await serviceClient
      .from("organizations")
      .select("vapi_api_key, vapi_base_url, vapi_org_id, vapi_enabled")
      .eq("id", organizationId)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    if (!org.vapi_enabled || !org.vapi_api_key) {
      return NextResponse.json(
        { error: "VAPI not configured for this organization" },
        { status: 400 },
      );
    }

    // Use VAPI with organization's API key (server-side only!)
    const vapi = new Vapi({
      apiKey: org.vapi_api_key,
      baseUrl: org.vapi_base_url || "https://api.vapi.ai",
      orgId: org.vapi_org_id || undefined,
    });

    // Send message to VAPI
    const result = await vapi.sendAssistantMessage({
      assistantId,
      message,
      conversationId,
    });

    return NextResponse.json(
      {
        reply: result.reply,
        sessionId: result.sessionId,
      },
      {
        headers: getRateLimitHeaders(rateLimitResult),
      },
    );
  } catch (error: any) {
    console.error("Widget chat error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send message" },
      { status: 500 },
    );
  }
}
