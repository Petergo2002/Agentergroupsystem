import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // Get widget config
    const { data: widgetConfig } = await serviceClient
      .from("chat_widget_configs")
      .select("*")
      .eq("org_id", userProfile.organization_id)
      .maybeSingle();

    if (!widgetConfig) {
      return NextResponse.json({ config: null });
    }

    return NextResponse.json({
      config: {
        organization_id: widgetConfig.org_id,
        public_id: widgetConfig.public_id,
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
      },
    });
  } catch (error: any) {
    console.error("Error fetching widget config:", error);
    return NextResponse.json(
      { error: "Failed to fetch widget config" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const body = await req.json();
    const {
      assistant_id,
      primary_color,
      text_color,
      position,
      welcome_message,
      placeholder_text,
      button_text,
      logo_url,
      widget_mode,
    } = body;

    // Check if widget config exists
    const { data: existingConfig } = await serviceClient
      .from("chat_widget_configs")
      .select("id")
      .eq("org_id", userProfile.organization_id)
      .maybeSingle();

    // Only include columns that exist in the database
    const widgetData = {
      org_id: userProfile.organization_id,
      vapi_agent_id: assistant_id,
      primary_color: primary_color || "#3b82f6",
      text_color: text_color || "#ffffff",
      position: position || "bottom-right",
      welcome_message: welcome_message || "Hej! Hur kan jag hjälpa dig idag?",
      placeholder_text: placeholder_text || "Skriv ditt meddelande...",
      button_text: button_text || "Chatta med oss",
      logo_url: logo_url !== undefined ? logo_url : null,
      widget_mode: widget_mode || "chat",
      enabled: true,
    };

    if (existingConfig) {
      // Update existing config
      const { error } = await serviceClient
        .from("chat_widget_configs")
        .update(widgetData)
        .eq("id", existingConfig.id);

      if (error) throw error;
    } else {
      // Create new config
      const { error } = await serviceClient
        .from("chat_widget_configs")
        .insert(widgetData);

      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error saving widget config:", error);
    return NextResponse.json(
      {
        error: "Failed to save widget config",
        details: error?.message || error,
      },
      { status: 500 },
    );
  }
}
