import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { Vapi } from "@/lib/analytics/vapi";

/**
 * GET /api/admin/organizations/[id]/assistants
 * Fetch assistants for a specific organization using their stored API key
 * Super admin only
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
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

    // Use service client to get organization's Vapi config
    const serviceClient = createServiceClient();

    const { data: org, error: orgError } = await serviceClient
      .from("organizations")
      .select("id, name, vapi_enabled, vapi_api_key, vapi_base_url, vapi_org_id")
      .eq("id", id)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    if (!org.vapi_enabled || !org.vapi_api_key) {
      return NextResponse.json({
        assistants: [],
        message: "Vapi not enabled or configured for this organization",
      });
    }

    // Fetch assistants using organization's API key
    const vapi = new Vapi({
      apiKey: org.vapi_api_key,
      baseUrl: org.vapi_base_url || "https://api.vapi.ai",
      orgId: org.vapi_org_id || undefined,
    });

    try {
      const assistants = await vapi.getAssistants();

      return NextResponse.json({
        assistants: assistants.map((assistant) => ({
          id: assistant.id,
          name: assistant.name,
          description: assistant.description,
          status: assistant.status,
          createdAt: assistant.createdAt,
          updatedAt: assistant.updatedAt,
        })),
      });
    } catch (vapiError: any) {
      console.error("Error fetching assistants from Vapi:", vapiError);
      return NextResponse.json(
        {
          error: "Failed to fetch assistants from Vapi",
          details: vapiError.message,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error in GET /api/admin/organizations/[id]/assistants:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
