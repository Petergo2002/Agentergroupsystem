import { NextResponse } from "next/server";
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

/**
 * GET /api/public/widget/[publicId]/vapi-config
 * Returns Vapi public key for voice widget
 * Public endpoint - no auth required
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ publicId: string }> }
) {
  try {
    const { publicId } = await params;

    const serviceClient = createServiceClient();

    // Get widget config
    const { data: widgetConfig, error: widgetError } = await serviceClient
      .from("chat_widget_configs")
      .select("org_id, enabled, widget_mode")
      .eq("public_id", publicId)
      .maybeSingle();

    if (widgetError || !widgetConfig || !widgetConfig.enabled) {
      return NextResponse.json(
        { error: "Widget not found or disabled" },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    // Only return Vapi config for voice widgets
    if (widgetConfig.widget_mode !== "voice") {
      return NextResponse.json(
        { error: "Not a voice widget" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Get organization's Vapi public key
    const { data: org, error: orgError } = await serviceClient
      .from("organizations")
      .select("vapi_public_api_key, vapi_base_url")
      .eq("id", widgetConfig.org_id)
      .single();

    if (orgError || !org || !org.vapi_public_api_key) {
      return NextResponse.json(
        { error: "Vapi not configured for this widget" },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    // Return only public key - NEVER the private key!
    return NextResponse.json(
      {
        publicKey: org.vapi_public_api_key,
        baseUrl: org.vapi_base_url || "https://api.vapi.ai",
      },
      { headers: CORS_HEADERS }
    );
  } catch (error: any) {
    console.error("Error fetching widget Vapi config:", error);
    return NextResponse.json(
      { error: "Failed to fetch Vapi config" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
