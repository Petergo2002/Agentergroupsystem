import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { Vapi } from "@/lib/analytics/vapi";

export async function POST(
  req: NextRequest,
  {
    params,
  }: {
    params: { assistantId: string } | Promise<{ assistantId: string }>;
  },
) {
  try {
    const resolvedParams = await Promise.resolve(params);
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

    const { data: currentUser } = await supabase
      .from("users")
      .select("is_super_admin")
      .eq("id", user.id)
      .single();

    if (!currentUser?.is_super_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const message = body?.message?.trim();
    const conversationId = body?.conversationId?.trim();
    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    const vapiApiKey = process.env.VAPI_API_KEY;
    const vapiBaseUrl = process.env.VAPI_BASE_URL || "https://api.vapi.ai";
    const vapiOrgId = process.env.VAPI_ORG_ID;

    if (!vapiApiKey) {
      return NextResponse.json(
        { error: "VAPI_API_KEY not configured" },
        { status: 500 },
      );
    }

    const vapi = new Vapi({
      apiKey: vapiApiKey,
      baseUrl: vapiBaseUrl,
      orgId: vapiOrgId || undefined,
    });

    const result = await vapi.sendAssistantMessage({
      assistantId,
      message,
      conversationId,
      source: "admin-assistant-test",
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
