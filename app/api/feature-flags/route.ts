import { type NextRequest, NextResponse } from "next/server";
import { DEFAULT_FEATURE_FLAGS } from "@/lib/feature-flags/types";
import { createServerClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const serviceClient = createServiceClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json(DEFAULT_FEATURE_FLAGS);

    const url = new URL(request.url);
    const orgParam = url.searchParams.get("org");

    let orgId: string | null = null;

    if (orgParam) {
      // For super admin impersonation
      const { data: profile } = await serviceClient
        .from("users")
        .select("is_super_admin")
        .eq("id", user.id)
        .single();

      if (profile?.is_super_admin) {
        orgId = orgParam;
      }
    }

    if (!orgId) {
      // Normal user flow
      const { data: profile } = await serviceClient
        .from("users")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      orgId = profile?.organization_id || null;
    }

    if (!orgId) {
      return NextResponse.json(DEFAULT_FEATURE_FLAGS);
    }

    const { data: flagsRow } = await serviceClient
      .from("feature_flags")
      .select("*")
      .eq("organization_id", orgId)
      .maybeSingle();

    return NextResponse.json({
      ...DEFAULT_FEATURE_FLAGS,
      ...(flagsRow || {}),
    });
  } catch (error) {
    console.error("Error in GET /api/feature-flags:", error);
    return NextResponse.json(DEFAULT_FEATURE_FLAGS);
  }
}
