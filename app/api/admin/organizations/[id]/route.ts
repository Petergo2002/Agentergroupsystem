import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function PATCH(
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

    // Use service client to bypass RLS for admin operations
    const serviceClient = createServiceClient();

    // Update organization
    const { data: organization, error } = await serviceClient
      .from("organizations")
      .update({
        name: body.name,
        contact_email: body.contact_email,
        plan_type: body.plan_type,
        subscription_status: body.subscription_status,
        monthly_price: parseFloat(body.monthly_price),
        max_users: parseInt(body.max_users),
        max_contacts: parseInt(body.max_contacts),
        max_leads: parseInt(body.max_leads),
        max_jobs: parseInt(body.max_jobs),
        max_storage_gb: parseInt(body.max_storage_gb),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating organization:", error);
      return NextResponse.json(
        { error: "Failed to update organization" },
        { status: 500 },
      );
    }

    return NextResponse.json(organization);
  } catch (error) {
    console.error("Error in PATCH /api/admin/organizations/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
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

    // Use service client to bypass RLS for admin operations
    const serviceClient = createServiceClient();

    // Soft delete organization
    const { error } = await serviceClient
      .from("organizations")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error("Error deleting organization:", error);
      return NextResponse.json(
        { error: "Failed to delete organization", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/admin/organizations/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
