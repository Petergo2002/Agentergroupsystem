import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

// PATCH - Update user (toggle super admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: userId } = await params;
    const supabase = await createServerClient();

    // Check if user is super admin
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

    // Prevent user from modifying themselves
    if (userId === user.id) {
      return NextResponse.json(
        { error: "Cannot modify your own user" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { is_super_admin } = body;

    // Use service client to bypass RLS
    const serviceClient = createServiceClient();

    const { error } = await serviceClient
      .from("users")
      .update({ is_super_admin })
      .eq("id", userId);

    if (error) {
      console.error("Error updating user:", error);
      return NextResponse.json(
        { error: "Failed to update user" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in PATCH /api/admin/users/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE - Delete user
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: userId } = await params;
    const supabase = await createServerClient();

    // Check if user is super admin
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

    // Prevent user from deleting themselves
    if (userId === user.id) {
      return NextResponse.json(
        { error: "Cannot delete your own user" },
        { status: 400 },
      );
    }

    // Use service client to bypass RLS
    const serviceClient = createServiceClient();

    // Delete from auth.users (this will cascade to public.users due to foreign key)
    const { error: authError } =
      await serviceClient.auth.admin.deleteUser(userId);

    if (authError) {
      console.error("Error deleting auth user:", authError);
      return NextResponse.json(
        { error: "Failed to delete user from auth" },
        { status: 500 },
      );
    }

    // Also delete from public.users table (in case cascade didn't work)
    const { error: dbError } = await serviceClient
      .from("users")
      .delete()
      .eq("id", userId);

    if (dbError) {
      console.error("Error deleting user from database:", dbError);
      // Don't fail the request if this fails, auth deletion is more important
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/admin/users/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
