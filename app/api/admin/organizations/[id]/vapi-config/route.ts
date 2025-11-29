import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { VapiConfigSchema, validateInput } from "@/lib/validation";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
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

    // Get organization Vapi config
    const { data: organization, error } = await supabase
      .from("organizations")
      .select(`
        id,
        name,
        vapi_enabled,
        vapi_api_key,
        vapi_public_api_key,
        vapi_base_url,
        vapi_org_id,
        default_chat_assistant_id,
        default_call_assistant_id
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching organization:", error);

      // Check if it's a column missing error
      if (
        error.message?.includes("column") &&
        error.message?.includes("vapi_")
      ) {
        return NextResponse.json(
          {
            error: "Vapi integration not set up",
            details:
              "Database schema needs to be updated. Please run the Vapi migration first.",
            needsMigration: true,
          },
          { status: 400 },
        );
      }

      return NextResponse.json(
        { error: "Organization not found", details: error.message },
        { status: 404 },
      );
    }

    // Don't expose full API keys to frontend
    const sanitized = {
      ...organization,
      vapi_api_key: organization.vapi_api_key
        ? `****${organization.vapi_api_key.slice(-4)}`
        : null,
      vapi_public_api_key: organization.vapi_public_api_key
        ? `****${organization.vapi_public_api_key.slice(-4)}`
        : null,
    };

    return NextResponse.json(sanitized);
  } catch (error) {
    console.error(
      "Error in GET /api/admin/organizations/[id]/vapi-config:",
      error,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
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

    // Parse and validate request body
    const body = await request.json();
    const validation = validateInput(VapiConfigSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error },
        { status: 400 },
      );
    }

    const {
      vapi_enabled,
      vapi_api_key,
      vapi_public_api_key,
      vapi_base_url,
      vapi_org_id,
    } = validation.data;

    // Use service client to bypass RLS for admin operations
    const serviceClient = createServiceClient();

    // Get current organization state
    const { data: currentOrg } = await serviceClient
      .from("organizations")
      .select("vapi_enabled, vapi_api_key, vapi_base_url, vapi_org_id")
      .eq("id", id)
      .single();

    // Determine if VAPI should be enabled
    const shouldEnableVapi =
      vapi_enabled !== undefined
        ? Boolean(vapi_enabled)
        : currentOrg?.vapi_enabled;

    // Validate required fields if enabling Vapi
    if (
      shouldEnableVapi &&
      vapi_enabled !== undefined &&
      !vapi_api_key &&
      !currentOrg?.vapi_api_key
    ) {
      return NextResponse.json(
        { error: "API key is required when enabling Vapi integration" },
        { status: 400 },
      );
    }

    // Build update object - only include fields that are provided
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (vapi_enabled !== undefined) {
      updateData.vapi_enabled = Boolean(vapi_enabled);
    }
    if (vapi_api_key !== undefined) {
      updateData.vapi_api_key = shouldEnableVapi ? vapi_api_key : null;
    }
    if (vapi_public_api_key !== undefined) {
      updateData.vapi_public_api_key = shouldEnableVapi
        ? vapi_public_api_key
        : null;
    }
    if (vapi_base_url !== undefined) {
      updateData.vapi_base_url = shouldEnableVapi
        ? vapi_base_url || "https://api.vapi.ai"
        : null;
    }
    if (vapi_org_id !== undefined) {
      updateData.vapi_org_id = shouldEnableVapi ? vapi_org_id : null;
    }

    // Debug logging
    console.log("🔧 VAPI Config Update Debug:", {
      orgId: id,
      receivedData: {
        vapi_enabled,
        hasPrivateKey: !!vapi_api_key,
        hasPublicKey: !!vapi_public_api_key,
        privateKeyLength: vapi_api_key?.length,
        publicKeyLength: vapi_public_api_key?.length,
      },
      updateData: {
        ...updateData,
        vapi_api_key: updateData.vapi_api_key
          ? `${updateData.vapi_api_key.substring(0, 10)}...`
          : null,
        vapi_public_api_key: updateData.vapi_public_api_key
          ? `${updateData.vapi_public_api_key.substring(0, 10)}...`
          : null,
      },
    });

    // Update organization Vapi config
    const { data: updatedOrg, error } = await serviceClient
      .from("organizations")
      .update(updateData)
      .eq("id", id)
      .select(`
        id,
        name,
        vapi_enabled,
        vapi_api_key,
        vapi_public_api_key,
        vapi_base_url,
        vapi_org_id
      `)
      .single();

    if (error) {
      console.error("❌ Error updating organization Vapi config:", error);
      return NextResponse.json(
        {
          error: "Failed to update Vapi configuration",
          details: error.message,
        },
        { status: 500 },
      );
    }

    // Debug: Log what was actually saved
    console.log("✅ VAPI Config Updated Successfully:", {
      orgId: updatedOrg.id,
      orgName: updatedOrg.name,
      vapi_enabled: updatedOrg.vapi_enabled,
      hasPrivateKey: !!updatedOrg.vapi_api_key,
      hasPublicKey: !!updatedOrg.vapi_public_api_key,
      privateKeyPreview: updatedOrg.vapi_api_key
        ? `${updatedOrg.vapi_api_key.substring(0, 10)}...`
        : null,
      publicKeyPreview: updatedOrg.vapi_public_api_key
        ? `${updatedOrg.vapi_public_api_key.substring(0, 10)}...`
        : null,
    });

    // Don't expose full API keys to frontend
    const sanitized = {
      ...updatedOrg,
      vapi_api_key: updatedOrg.vapi_api_key
        ? `****${updatedOrg.vapi_api_key.slice(-4)}`
        : null,
      vapi_public_api_key: updatedOrg.vapi_public_api_key
        ? `****${updatedOrg.vapi_public_api_key.slice(-4)}`
        : null,
    };

    return NextResponse.json(sanitized);
  } catch (error) {
    console.error(
      "Error in PATCH /api/admin/organizations/[id]/vapi-config:",
      error,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
