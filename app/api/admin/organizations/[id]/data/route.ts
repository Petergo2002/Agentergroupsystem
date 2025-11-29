import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: orgId } = await params;
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

    // Use service client to bypass RLS and fetch organization data
    const serviceClient = createServiceClient();

    // Fetch all data for the organization
    const [customers, leads, jobs, quotes, invoices, events, tasks] =
      await Promise.all([
        serviceClient
          .from("customers")
          .select("*")
          .eq("organization_id", orgId)
          .order("created_at", { ascending: false }),
        serviceClient
          .from("leads")
          .select("*")
          .eq("organization_id", orgId)
          .order("created_at", { ascending: false }),
        serviceClient
          .from("jobs")
          .select("*")
          .eq("organization_id", orgId)
          .order("created_at", { ascending: false }),
        serviceClient
          .from("quotes")
          .select("*")
          .eq("organization_id", orgId)
          .order("created_at", { ascending: false }),
        serviceClient
          .from("invoices")
          .select("*")
          .eq("organization_id", orgId)
          .order("created_at", { ascending: false }),
        serviceClient
          .from("events")
          .select("*")
          .eq("organization_id", orgId)
          .order("start_time", { ascending: true }),
        serviceClient
          .from("tasks")
          .select("*")
          .eq("organization_id", orgId)
          .order("created_at", { ascending: false }),
      ]);

    return NextResponse.json({
      customers: customers.data || [],
      leads: leads.data || [],
      jobs: jobs.data || [],
      quotes: quotes.data || [],
      invoices: invoices.data || [],
      events: events.data || [],
      tasks: tasks.data || [],
    });
  } catch (error) {
    console.error("Error fetching organization data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
