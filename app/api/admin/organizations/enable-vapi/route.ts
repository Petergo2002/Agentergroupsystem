import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(req: NextRequest) {
  try {
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

    const body = await req.json();
    const { organizationId } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 },
      );
    }

    // Get VAPI API key from environment
    const vapiApiKey = process.env.VAPI_API_KEY;
    if (!vapiApiKey) {
      return NextResponse.json(
        { error: "VAPI_API_KEY not configured in environment" },
        { status: 500 },
      );
    }

    // Use service client to bypass RLS
    const serviceClient = createServiceClient();

    // Enable VAPI for the organization
    const { data: updatedOrg, error } = await serviceClient
      .from("organizations")
      .update({
        vapi_enabled: true,
        vapi_api_key: vapiApiKey,
        vapi_base_url: process.env.VAPI_BASE_URL || "https://api.vapi.ai",
        vapi_org_id: process.env.VAPI_ORG_ID || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", organizationId)
      .select("id, name")
      .single();

    if (error) {
      console.error("Error enabling VAPI:", error);
      return NextResponse.json(
        { error: "Failed to enable VAPI", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      organization: updatedOrg,
    });
  } catch (error: any) {
    console.error("Error in POST /api/admin/organizations/enable-vapi:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
