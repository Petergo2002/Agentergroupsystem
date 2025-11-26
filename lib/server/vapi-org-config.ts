import { Vapi } from "@/lib/analytics/vapi";
import { createServerClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export interface OrganizationVapiConfig {
  vapi_enabled: boolean;
  vapi_api_key: string | null;
  vapi_public_api_key?: string | null;
  vapi_base_url: string | null;
  vapi_org_id: string | null;
  default_chat_assistant_id: string | null;
  default_call_assistant_id: string | null;
}

/**
 * Get Vapi configuration for the current user's organization
 * This is used by API routes to create Vapi clients without exposing keys to the client
 */
export async function getOrganizationVapiConfig(): Promise<{
  config: OrganizationVapiConfig | null;
  vapi: Vapi | null;
  organizationId: string | null;
  userId: string | null;
  error: string | null;
}> {
  try {
    const supabase = await createServerClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return {
        config: null,
        vapi: null,
        organizationId: null,
        userId: null,
        error: "User not authenticated",
      };
    }

    // Get user's organization
    const { data: userData, error: userDataError } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (userDataError || !userData?.organization_id) {
      return {
        config: null,
        vapi: null,
        organizationId: null,
        userId: user.id,
        error: "User organization not found",
      };
    }

    const organizationId = userData.organization_id;

    // Get organization's Vapi configuration
    const serviceClient = createServiceClient();

    const { data: orgConfig, error: orgError } = await serviceClient
      .from("organizations")
      .select(`
        vapi_enabled,
        vapi_api_key,
        vapi_public_api_key,
        vapi_base_url,
        vapi_org_id
      `)
      .eq("id", userData.organization_id)
      .single();

    if (orgError) {
      console.error("❌ Error loading organization config:", {
        organizationId,
        userId: user.id,
        error: orgError,
        errorMessage: orgError.message,
        errorDetails: orgError.details,
        errorHint: orgError.hint,
      });
      return {
        config: null,
        vapi: null,
        organizationId,
        userId: user.id,
        error: `Failed to load organization config: ${orgError.message}`,
      };
    }

    console.log("✅ Organization config loaded:", {
      organizationId,
      vapi_enabled: orgConfig.vapi_enabled,
      hasPrivateKey: !!orgConfig.vapi_api_key,
      hasPublicKey: !!orgConfig.vapi_public_api_key,
    });

    const config: OrganizationVapiConfig = {
      vapi_enabled: orgConfig.vapi_enabled || false,
      vapi_api_key: orgConfig.vapi_api_key,
      vapi_public_api_key: orgConfig.vapi_public_api_key,
      vapi_base_url: orgConfig.vapi_base_url,
      vapi_org_id: orgConfig.vapi_org_id,
      default_chat_assistant_id: null, // Column doesn't exist in DB yet
      default_call_assistant_id: null, // Column doesn't exist in DB yet
    };

    // Check if Vapi is enabled and configured
    if (!config.vapi_enabled || !config.vapi_api_key) {
      return {
        config,
        vapi: null,
        organizationId,
        userId: user.id,
        error: "AI integration not enabled or configured for this organization",
      };
    }

    // Create Vapi client
    const vapi = new Vapi({
      apiKey: config.vapi_api_key,
      baseUrl: config.vapi_base_url || "https://api.vapi.ai",
      orgId: config.vapi_org_id || undefined,
    });

    return { config, vapi, organizationId, userId: user.id, error: null };
  } catch (error: any) {
    console.error("Error getting organization Vapi config:", error);
    return {
      config: null,
      vapi: null,
      organizationId: null,
      userId: null,
      error: error.message || "Internal server error",
    };
  }
}

/**
 * Get Vapi configuration for a specific organization (admin use)
 */
export async function getOrganizationVapiConfigById(
  organizationId: string,
): Promise<{
  config: OrganizationVapiConfig | null;
  vapi: Vapi | null;
  error: string | null;
}> {
  try {
    const supabase = await createServerClient();

    // Verify user is super admin
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { config: null, vapi: null, error: "User not authenticated" };
    }

    const { data: currentUser } = await supabase
      .from("users")
      .select("is_super_admin")
      .eq("id", user.id)
      .single();

    if (!currentUser?.is_super_admin) {
      return {
        config: null,
        vapi: null,
        error: "Unauthorized - super admin required",
      };
    }

    // Get organization's Vapi configuration
    const serviceClient = createServiceClient();

    const { data: orgConfig, error: orgError } = await serviceClient
      .from("organizations")
      .select(`
        vapi_enabled,
        vapi_api_key,
        vapi_public_api_key,
        vapi_base_url,
        vapi_org_id
      `)
      .eq("id", organizationId)
      .single();

    if (orgError) {
      return { config: null, vapi: null, error: "Organization not found" };
    }

    const config: OrganizationVapiConfig = {
      vapi_enabled: orgConfig.vapi_enabled || false,
      vapi_api_key: orgConfig.vapi_api_key,
      vapi_public_api_key: orgConfig.vapi_public_api_key,
      vapi_base_url: orgConfig.vapi_base_url,
      vapi_org_id: orgConfig.vapi_org_id,
      default_chat_assistant_id: null, // Column doesn't exist in DB yet
      default_call_assistant_id: null, // Column doesn't exist in DB yet
    };

    // Create Vapi client if configured
    let vapi: Vapi | null = null;
    if (config.vapi_enabled && config.vapi_api_key) {
      vapi = new Vapi({
        apiKey: config.vapi_api_key,
        baseUrl: config.vapi_base_url || "https://api.vapi.ai",
        orgId: config.vapi_org_id || undefined,
      });
    }

    return { config, vapi, error: null };
  } catch (error: any) {
    console.error("Error getting organization Vapi config by ID:", error);
    return {
      config: null,
      vapi: null,
      error: error.message || "Internal server error",
    };
  }
}
