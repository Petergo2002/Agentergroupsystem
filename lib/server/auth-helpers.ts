/**
 * Server-side authentication and authorization helpers
 *
 * These helpers centralize common auth patterns for API routes that use
 * the service-role client. They ensure consistent security checks.
 */

import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";

import { createServerClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

// ============================================
// Types
// ============================================

export type AuthResult =
  | { user: User; error?: never }
  | { user?: never; error: NextResponse };

export type SuperAdminResult =
  | { user: User; isSuperAdmin: true; error?: never }
  | { user?: never; isSuperAdmin?: never; error: NextResponse };

export type OrgMemberResult =
  | {
      user: User;
      organizationId: string;
      role: "owner" | "admin" | "member";
      error?: never;
    }
  | { user?: never; organizationId?: never; role?: never; error: NextResponse };

// ============================================
// Authentication Helpers
// ============================================

/**
 * Get the current authenticated user.
 * Returns an error response if not authenticated.
 */
export async function requireAuth(): Promise<AuthResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { user };
}

/**
 * Require the current user to be a super admin.
 * Returns an error response if not authenticated or not a super admin.
 */
export async function requireSuperAdmin(): Promise<SuperAdminResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { data: userData } = await supabase
    .from("users")
    .select("is_super_admin")
    .eq("id", user.id)
    .single();

  if (!userData?.is_super_admin) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { user, isSuperAdmin: true };
}

/**
 * Require the current user to be a member of a specific organization.
 * Returns the user, organization ID, and role if authorized.
 */
export async function requireOrgMember(
  organizationId?: string
): Promise<OrgMemberResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const serviceClient = createServiceClient();

  // If no org ID provided, get user's primary organization
  let orgId = organizationId;
  if (!orgId) {
    const { data: profile } = await serviceClient
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    orgId = profile?.organization_id ?? undefined;
  }

  if (!orgId) {
    // Try to find via organization_members
    const { data: membership } = await serviceClient
      .from("organization_members")
      .select("organization_id, role")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    if (membership) {
      return {
        user,
        organizationId: membership.organization_id,
        role: membership.role as "owner" | "admin" | "member",
      };
    }

    return {
      error: NextResponse.json(
        { error: "No organization found for user" },
        { status: 400 }
      ),
    };
  }

  // Verify membership in the specified org
  const { data: membership } = await serviceClient
    .from("organization_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("organization_id", orgId)
    .single();

  if (!membership) {
    return {
      error: NextResponse.json(
        { error: "Not a member of this organization" },
        { status: 403 }
      ),
    };
  }

  return {
    user,
    organizationId: orgId,
    role: membership.role as "owner" | "admin" | "member",
  };
}

/**
 * Require the current user to be an admin or owner of a specific organization.
 */
export async function requireOrgAdmin(
  organizationId?: string
): Promise<OrgMemberResult> {
  const result = await requireOrgMember(organizationId);

  if ("error" in result) {
    return result;
  }

  if (result.role !== "admin" && result.role !== "owner") {
    return {
      error: NextResponse.json(
        { error: "Admin or owner role required" },
        { status: 403 }
      ),
    };
  }

  return result;
}

// ============================================
// Organization Resolution Helpers
// ============================================

/**
 * Get the organization ID for a user.
 * Uses service client to bypass RLS.
 * Returns null if no organization found.
 */
export async function getUserOrganizationId(
  userId: string
): Promise<string | null> {
  const serviceClient = createServiceClient();

  // Check users.organization_id first
  const { data: profile } = await serviceClient
    .from("users")
    .select("organization_id")
    .eq("id", userId)
    .single();

  if (profile?.organization_id) {
    return profile.organization_id;
  }

  // Fallback to organization_members
  const { data: membership } = await serviceClient
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .limit(1)
    .single();

  return membership?.organization_id ?? null;
}

/**
 * Get all organization IDs a user belongs to.
 */
export async function getUserOrganizationIds(
  userId: string
): Promise<string[]> {
  const serviceClient = createServiceClient();

  const { data: memberships } = await serviceClient
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId);

  if (!memberships || memberships.length === 0) {
    // Fallback to users.organization_id
    const { data: profile } = await serviceClient
      .from("users")
      .select("organization_id")
      .eq("id", userId)
      .single();

    return profile?.organization_id ? [profile.organization_id] : [];
  }

  return memberships.map((m) => m.organization_id);
}

/**
 * Check if a user is a super admin.
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  const serviceClient = createServiceClient();

  const { data } = await serviceClient
    .from("users")
    .select("is_super_admin")
    .eq("id", userId)
    .single();

  return data?.is_super_admin === true;
}
