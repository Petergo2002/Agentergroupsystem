import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServerClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ data: { session: null } }, { status: 200 });
    }

    // Get user data including first login flag
    const { data: userData } = await supabase
      .from("users")
      .select(
        "id, email, name, organization_id, is_super_admin, is_first_login",
      )
      .eq("id", session.user.id)
      .single();

    return NextResponse.json({
      data: { session },
      ...userData,
    });
  } catch (error) {
    console.error("Error getting session:", error);
    return NextResponse.json(
      { error: "Kunde inte hämta session" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const body = await request.json();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update user data
    const { error } = await supabase
      .from("users")
      .update({ is_first_login: body.is_first_login })
      .eq("id", user.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating session:", error);
    return NextResponse.json(
      { error: "Kunde inte uppdatera session" },
      { status: 500 },
    );
  }
}
