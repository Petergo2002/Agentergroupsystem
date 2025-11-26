import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { Vapi } from "@/lib/analytics/vapi";

export async function GET() {
  try {
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
    const { data: userProfile, error: profileError } = await serviceClient
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Failed to load user profile:", profileError);
      return NextResponse.json({
        assistants: [],
        message: "Could not load user profile",
      });
    }

    if (!userProfile?.organization_id) {
      return NextResponse.json({
        assistants: [],
        message: "No organization assigned to user",
      });
    }

    // Get organization's VAPI config using service client
    const { data: org, error: orgError } = await serviceClient
      .from("organizations")
      .select("vapi_api_key, vapi_base_url, vapi_org_id, vapi_enabled")
      .eq("id", userProfile.organization_id)
      .single();

    if (orgError) {
      console.error("Failed to load organization:", orgError);
      return NextResponse.json({
        assistants: [],
        message: "Could not load organization settings",
      });
    }

    if (!org?.vapi_enabled || !org.vapi_api_key) {
      return NextResponse.json({
        assistants: [],
        message: "VAPI integration not configured for your organization",
      });
    }

    // Fetch ALL assistants from VAPI
    const vapi = new Vapi({
      apiKey: org.vapi_api_key,
      baseUrl: org.vapi_base_url || "https://api.vapi.ai",
      orgId: org.vapi_org_id || undefined,
    });

    const allAssistants = await vapi.getAssistants();

    if (!allAssistants || allAssistants.length === 0) {
      return NextResponse.json({
        assistants: [],
        message: "No assistants found in your VAPI organization",
      });
    }

    return NextResponse.json({
      assistants: allAssistants,
    });
  } catch (error: any) {
    console.error("Error fetching user assistants:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch assistants" },
      { status: 500 }
    );
  }
}
