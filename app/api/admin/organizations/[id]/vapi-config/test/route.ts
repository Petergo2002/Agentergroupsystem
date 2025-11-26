import { type NextRequest, NextResponse } from "next/server";
import { Vapi } from "@/lib/analytics/vapi";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: _orgId } = await params; // Available for future use
    const supabase = await createServerClient();

    // Check if current user is super admin
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

    // Parse request body
    const body = await request.json();
    const { vapi_api_key, vapi_base_url, vapi_org_id } = body;

    if (!vapi_api_key) {
      return NextResponse.json(
        { error: "API key is required for testing" },
        { status: 400 },
      );
    }

    try {
      // Test Vapi connection by fetching assistants
      const vapi = new Vapi({
        apiKey: vapi_api_key,
        baseUrl: vapi_base_url || "https://api.vapi.ai",
        orgId: vapi_org_id || undefined,
      });

      const assistants = await vapi.getAssistants();

      return NextResponse.json({
        success: true,
        message: "Connection successful",
        assistants: assistants.map((a) => ({
          id: a.id,
          name: a.name,
          description: a.description,
          status: a.status,
        })),
      });
    } catch (vapiError: any) {
      console.error("Vapi connection test failed:", vapiError);

      // Parse common Vapi errors
      let errorMessage = "Connection failed";
      if (vapiError.message?.includes("401")) {
        errorMessage = "Invalid API key";
      } else if (vapiError.message?.includes("403")) {
        errorMessage = "API key lacks required permissions";
      } else if (vapiError.message?.includes("404")) {
        errorMessage = "Invalid base URL or endpoint not found";
      } else if (vapiError.message?.includes("timeout")) {
        errorMessage = "Connection timeout - check base URL";
      } else if (vapiError.message) {
        errorMessage = vapiError.message;
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          details: vapiError.message,
        },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error(
      "Error in POST /api/admin/organizations/[id]/vapi-config/test:",
      error,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
