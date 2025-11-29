import { type NextRequest, NextResponse } from "next/server";

import { createServiceClient } from "@/lib/supabase/service";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ publicId: string }> },
) {
  const { publicId } = await context.params;

  if (!publicId) {
    return NextResponse.json(
      { error: "Missing widget id" },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("chat_widget_configs")
      .select(
        "public_id, logo_url, primary_color, text_color, position, welcome_message, placeholder_text, button_text, vapi_agent_id, widget_mode, enabled",
      )
      .eq("public_id", publicId)
      .maybeSingle();

    if (error) {
      console.error("Failed to load public widget config:", error);
      return NextResponse.json(
        { error: "Failed to load widget" },
        { status: 500, headers: CORS_HEADERS },
      );
    }

    if (!data || !data.enabled) {
      return NextResponse.json(
        { error: "Widget not found" },
        { status: 404, headers: CORS_HEADERS },
      );
    }

    return NextResponse.json({ data }, { status: 200, headers: CORS_HEADERS });
  } catch (error) {
    console.error("Unexpected widget lookup error", error);
    return NextResponse.json(
      { error: "Unexpected error" },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}
