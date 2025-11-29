import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  try {
    const resolvedParams = await params;
    const { orgId } = resolvedParams;

    const serviceClient = createServiceClient();

    // Get widget config (public endpoint)
    const { data: widgetConfig, error } = await serviceClient
      .from("chat_widget_configs")
      .select("*")
      .eq("org_id", orgId)
      .maybeSingle();

    if (error || !widgetConfig) {
      return NextResponse.json({ error: "Widget not found" }, { status: 404 });
    }

    // IMPORTANT: Never expose API keys to the client!
    return NextResponse.json({
      organization_id: widgetConfig.org_id,
      assistant_id: widgetConfig.vapi_agent_id,
      primary_color: widgetConfig.primary_color || "#3b82f6",
      text_color: widgetConfig.text_color || "#ffffff",
      position: widgetConfig.position || "bottom-right",
      welcome_message:
        widgetConfig.welcome_message || "Hej! Hur kan jag hjälpa dig idag?",
      placeholder_text:
        widgetConfig.placeholder_text || "Skriv ditt meddelande...",
      button_text: widgetConfig.button_text || "Chatta med oss",
      logo_url: widgetConfig.logo_url || null,
      widget_mode: widgetConfig.widget_mode || "chat",
    });
  } catch (error: any) {
    console.error("Error fetching widget config:", error);
    return NextResponse.json(
      { error: "Failed to fetch widget config" },
      { status: 500 },
    );
  }
}
