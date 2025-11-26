import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { Vapi } from "@/lib/analytics/vapi";
import { adminRateLimit, checkRateLimitForRequest, getRateLimitHeaders } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Check if current user is super admin
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting
    const rateLimitResult = await checkRateLimitForRequest(
      `admin:${user.id}`,
      adminRateLimit
    );
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests" },
        { 
          status: 429,
          headers: getRateLimitHeaders(rateLimitResult)
        }
      );
    }

    const { data: currentUser } = await supabase
      .from("users")
      .select("is_super_admin")
      .eq("id", user.id)
      .single();

    if (!currentUser?.is_super_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get Vapi key from header (for custom key lookup)
    const customApiKey = req.headers.get("X-VAPI-API-KEY");
    
    // We no longer need a global VAPI_API_KEY since each organization has their own
    // If a custom key is provided via header, use it to fetch assistants for that org
    let assistants: any[] = [];
    
    if (customApiKey) {
      const vapiBaseUrl = process.env.VAPI_BASE_URL || "https://api.vapi.ai";
      const vapiOrgId = process.env.VAPI_ORG_ID;
      
      const vapi = new Vapi({
        apiKey: customApiKey,
        baseUrl: vapiBaseUrl,
        orgId: vapiOrgId || undefined,
      });
      
      try {
        assistants = await vapi.getAssistants();
      } catch (error) {
        console.error("Error fetching assistants with custom key:", error);
        // Continue without assistants - we'll still show organizations
      }
    }

    // Use service client to bypass RLS when fetching organizations
    const serviceClient = createServiceClient();

    // Also fetch organizations for display
    const { data: organizations, error: orgError } = await serviceClient
      .from("organizations")
      .select(
        `
          id,
          name,
          slug,
          vapi_enabled,
          vapi_api_key,
          vapi_public_api_key,
          owner:users!organizations_owner_id_fkey(role, is_super_admin),
          organization_members:organization_members(
            role,
            user:users!organization_members_user_id_fkey(is_super_admin, role)
          )
        `,
      )
      .is("deleted_at", null)
      .order("name");

    if (orgError) {
      console.error("Error fetching organizations:", orgError);
      // Continue without org data
    }

    const allowedUserRoles = new Set(["user", "admin"]);
    const allowedMemberRoles = new Set(["owner", "admin", "member"]);
    const registeredOrganizations =
      organizations?.filter((org) => {
        const owner = Array.isArray(org.owner) ? org.owner[0] : org.owner;
        const ownerRole = owner?.role?.toLowerCase();
        const isSuperAdminOwner = Boolean(owner?.is_super_admin);
        const hasValidOwner =
          Boolean(owner) &&
          (isSuperAdminOwner || (ownerRole && allowedUserRoles.has(ownerRole)));

        const hasValidMember =
          org.organization_members?.some((member: any) => {
            const memberRole = member.role?.toLowerCase();
            const memberIsSuperAdmin = Boolean(member.user?.is_super_admin);
            const memberUserRole = member.user?.role?.toLowerCase();
            return (
              memberIsSuperAdmin ||
              (memberUserRole && allowedUserRoles.has(memberUserRole)) ||
              (memberRole && allowedMemberRoles.has(memberRole))
            );
          }) ?? false;

        return hasValidOwner || hasValidMember;
      }) ?? [];

    return NextResponse.json({
      assistants: assistants.map((assistant) => ({
        id: assistant.id,
        name: assistant.name,
        description: assistant.description,
        status: assistant.status,
        createdAt: assistant.createdAt,
        updatedAt: assistant.updatedAt,
      })),
      organizations: registeredOrganizations.map(
        ({ owner, organization_members, vapi_api_key, vapi_public_api_key, ...rest }) => ({
          ...rest,
          has_vapi_key: !!vapi_api_key,
          vapi_key_last4: vapi_api_key ? vapi_api_key.slice(-4) : null,
          has_vapi_public_key: !!vapi_public_api_key,
          vapi_public_key_last4: vapi_public_api_key ? vapi_public_api_key.slice(-4) : null,
        }),
      ),
    });
  } catch (e: any) {
    console.error("Error fetching global Vapi assistants:", e);
    const msg = e?.message || "Failed to fetch AI assistants";
    const status = /401|403|404/.test(String(e?.status))
      ? Number(e.status)
      : 500;
    return NextResponse.json({ error: msg }, { status: status || 500 });
  }
}
