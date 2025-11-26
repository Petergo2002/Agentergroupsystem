import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();

    // Check if user is super admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from("users")
      .select("is_super_admin")
      .eq("id", user.id)
      .single();

    if (!userData?.is_super_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const serviceClient = createServiceClient();

    const payload = {
      organization_id: id,
      calendar_enabled: body.calendar_enabled,
      customers_enabled: body.customers_enabled,
      leads_enabled: body.leads_enabled,
      jobs_enabled: body.jobs_enabled,
      quotes_enabled: body.quotes_enabled,
      invoices_enabled: body.invoices_enabled,
      tasks_enabled: body.tasks_enabled,
      analytics_enabled: body.analytics_enabled,
      campaigns_enabled: body.campaigns_enabled,
      ai_assistant_enabled: body.ai_assistant_enabled,
      // Separated analytics flags
      reports_enabled: body.reports_enabled,
      chat_analytics_enabled: body.chat_analytics_enabled,
      call_analytics_enabled: body.call_analytics_enabled,
      // Integrations
      voice_calls_enabled: body.voice_calls_enabled,
      email_integration_enabled: body.email_integration_enabled,
      sms_integration_enabled: body.sms_integration_enabled,
      api_access_enabled: body.api_access_enabled,
      webhooks_enabled: body.webhooks_enabled,
      custom_branding_enabled: body.custom_branding_enabled,
      white_label_enabled: body.white_label_enabled,
    };

    const { data, error } = await serviceClient
      .from("feature_flags")
      .upsert(payload, { onConflict: "organization_id" })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error(
      "Error in PUT /api/admin/organizations/[id]/features:",
      error,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
