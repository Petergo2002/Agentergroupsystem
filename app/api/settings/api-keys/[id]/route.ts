import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

/**
 * Revoke an API key
 */
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createServerClient();
    const { id } = await context.params;

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Revoke the key (soft delete by setting revoked_at and is_active)
    const { error } = await supabase
      .from("api_keys")
      .update({
        revoked_at: new Date().toISOString(),
        is_active: false,
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error revoking API key:", error);
    return NextResponse.json(
      { error: error.message || "Failed to revoke API key" },
      { status: 500 },
    );
  }
}
