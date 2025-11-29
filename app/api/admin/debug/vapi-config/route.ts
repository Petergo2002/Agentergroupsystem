import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * DEBUG API - Endast för superadmin
 * Visar faktisk Vapi-konfiguration för alla organisationer
 * Använd detta för att verifiera att nycklar sparas korrekt i databasen
 */
export async function GET() {
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
      return NextResponse.json(
        { error: "Forbidden - Super admin only" },
        { status: 403 },
      );
    }

    // Use service client to bypass RLS
    const serviceClient = createServiceClient();

    const { data: organizations, error } = await serviceClient
      .from("organizations")
      .select(`
        id,
        name,
        vapi_enabled,
        vapi_api_key,
        vapi_public_api_key,
        vapi_base_url,
        vapi_org_id,
        default_chat_assistant_id,
        default_call_assistant_id
      `)
      .order("name");

    if (error) {
      console.error("Error fetching organizations:", error);
      return NextResponse.json(
        { error: "Failed to fetch organizations", details: error.message },
        { status: 500 },
      );
    }

    // Return debug info with partially masked keys
    const debugInfo = organizations?.map((org) => ({
      id: org.id,
      name: org.name,
      vapi_enabled: org.vapi_enabled,
      vapi_api_key: org.vapi_api_key
        ? {
            exists: true,
            length: org.vapi_api_key.length,
            preview: `${org.vapi_api_key.substring(0, 10)}...${org.vapi_api_key.slice(-4)}`,
            starts_with: org.vapi_api_key.substring(0, 3),
          }
        : { exists: false },
      vapi_public_api_key: org.vapi_public_api_key
        ? {
            exists: true,
            length: org.vapi_public_api_key.length,
            preview: `${org.vapi_public_api_key.substring(0, 10)}...${org.vapi_public_api_key.slice(-4)}`,
            starts_with: org.vapi_public_api_key.substring(0, 3),
          }
        : { exists: false },
      vapi_base_url: org.vapi_base_url,
      vapi_org_id: org.vapi_org_id,
      default_chat_assistant_id: org.default_chat_assistant_id,
      default_call_assistant_id: org.default_call_assistant_id,
    }));

    return NextResponse.json({
      message: "Debug info for Vapi configuration",
      total_organizations: organizations?.length || 0,
      organizations: debugInfo,
    });
  } catch (error: any) {
    console.error("Error in debug API:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    );
  }
}
