import { type NextRequest, NextResponse } from "next/server";
import type { OutboundCallRequest } from "@/lib/analytics/vapi";
import { recordCallSession } from "@/lib/server/ai-logging";
import { getOrganizationVapiConfig } from "@/lib/server/vapi-org-config";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // Get Vapi config from user's organization (server-side only)
    const { vapi, config, organizationId, userId, error } =
      await getOrganizationVapiConfig();

    if (error || !vapi) {
      return NextResponse.json(
        {
          error: error || "AI integration not configured for your organization",
        },
        { status: 400 },
      );
    }

    const body = (await req.json()) as OutboundCallRequest;

    // Validate required fields
    if (!body?.to) {
      return NextResponse.json(
        { error: "Missing required field: to (phone number)" },
        { status: 400 },
      );
    }

    // Use default call assistant if no assistantId provided
    if (!body.assistantId && config?.default_call_assistant_id) {
      body.assistantId = config.default_call_assistant_id;
    }

    // Create outbound call using organization's Vapi config
    const res = await vapi.createOutboundCall(body);
    if (organizationId) {
      await recordCallSession({
        organizationId,
        assistantId: body.assistantId,
        userId: userId || undefined,
        source: "ai-assistants-dashboard",
        direction: "outbound",
        status: res.status,
        toNumber: body.to,
        fromNumber: body.from,
        providerCallId: res.id,
        metadata: body.metadata,
      });
    }
    return NextResponse.json(res);
  } catch (e: any) {
    console.error("Error creating outbound call:", e);
    const msg = e?.message || "Failed to create outbound call";
    const status = /401|403|404|400/.test(String(e?.status))
      ? Number(e.status)
      : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
