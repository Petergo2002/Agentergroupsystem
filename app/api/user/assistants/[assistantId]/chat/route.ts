import { type NextRequest, NextResponse } from "next/server";
import { Vapi } from "@/lib/analytics/vapi";
import { createServerClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ assistantId: string }>;
  },
) {
  try {
    const resolvedParams = await params;
    const assistantId = resolvedParams.assistantId;

    if (!assistantId) {
      return NextResponse.json(
        { error: "Assistant ID is required" },
        { status: 400 },
      );
    }

    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use service client to bypass RLS
    const serviceClient = createServiceClient();

    // Get user's organization
    const { data: userProfile } = await serviceClient
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!userProfile?.organization_id) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 404 },
      );
    }

    // Get organization's VAPI config
    const { data: org, error: orgError } = await serviceClient
      .from("organizations")
      .select("vapi_api_key, vapi_base_url, vapi_org_id, vapi_enabled")
      .eq("id", userProfile.organization_id)
      .single();

    if (orgError) {
      console.error("Failed to load organization", orgError);
      return NextResponse.json(
        { error: "Failed to load organization" },
        { status: 500 },
      );
    }

    if (!org?.vapi_enabled || !org.vapi_api_key) {
      return NextResponse.json(
        { error: "VAPI integration not configured" },
        { status: 400 },
      );
    }

    // All assistants from the organization's VAPI are accessible
    // No need to check specific assistant access

    const body = await req.json();
    const message = body?.message?.trim();
    const conversationId = body?.conversationId?.trim();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    const vapi = new Vapi({
      apiKey: org.vapi_api_key,
      baseUrl: org.vapi_base_url || "https://api.vapi.ai",
      orgId: org.vapi_org_id || undefined,
    });

    const result = await vapi.sendAssistantMessage({
      assistantId,
      message,
      conversationId,
      source: "user-dashboard",
      metadata: {
        requestedBy: user.id,
        requestedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      assistantId,
      reply: result.reply,
      sessionId: result.sessionId,
      raw: result.raw,
    });
  } catch (error: any) {
    console.error("Error testing assistant:", error);
    const status =
      typeof error?.status === "number" && error.status >= 400
        ? error.status
        : 500;
    return NextResponse.json(
      { error: error?.message || "Failed to test assistant" },
      { status },
    );
  }
}
