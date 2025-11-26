import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function PATCH(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { userId, isSuperAdmin } = body;

    if (!userId || typeof isSuperAdmin !== "boolean") {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Use service client to bypass RLS for admin operations
    const serviceClient = createServiceClient();

    // Update user's super admin status
    const { data: updatedUser, error } = await serviceClient
      .from("users")
      .update({ is_super_admin: isSuperAdmin })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating super admin status:", error);
      return NextResponse.json(
        {
          error: "Failed to update super admin status",
          details: error.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error in PATCH /api/admin/users/super-admin:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
