import { type NextRequest, NextResponse } from "next/server";
import { generateApiKey } from "@/lib/mcp/auth";
import { createServerClient } from "@/lib/supabase/server";

/**
 * Create a new API key for the authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { description } = await request.json();

    if (!description) {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 },
      );
    }

    // Generate new API key
    const { apiKey, prefix } = await generateApiKey(user.id, description);

    return NextResponse.json({ apiKey, prefix });
  } catch (error: any) {
    console.error("Error creating API key:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create API key" },
      { status: 500 },
    );
  }
}
