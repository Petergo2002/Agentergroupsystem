import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { createServerClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Check if user is super admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from("users")
      .select("is_super_admin")
      .eq("id", user.id)
      .single();

    if (!userData?.is_super_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const {
      name,
      slug,
      plan_type,
      contact_email,
      monthly_price,
      user_first_name,
      user_last_name,
      user_email,
      user_password,
    } = body;

    // Validate required fields
    if (!name || !slug || !contact_email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Validate user fields if provided
    if (user_email && (!user_first_name || !user_last_name || !user_password)) {
      return NextResponse.json(
        { error: "All user fields are required when creating a user" },
        { status: 400 },
      );
    }

    // Set plan limits based on plan type
    const planLimits: Record<
      string,
      {
        max_users: number;
        max_contacts: number;
        max_leads: number;
        max_jobs: number;
        max_storage_gb: number;
      }
    > = {
      free: {
        max_users: 1,
        max_contacts: 100,
        max_leads: 200,
        max_jobs: 50,
        max_storage_gb: 1,
      },
      starter: {
        max_users: 5,
        max_contacts: 1000,
        max_leads: 2000,
        max_jobs: 300,
        max_storage_gb: 10,
      },
      professional: {
        max_users: 20,
        max_contacts: 10000,
        max_leads: 15000,
        max_jobs: 3000,
        max_storage_gb: 50,
      },
      enterprise: {
        max_users: 999,
        max_contacts: 999999,
        max_leads: 999999,
        max_jobs: 999999,
        max_storage_gb: 500,
      },
    };

    const limits = planLimits[plan_type] || planLimits.free;

    // Use service client to bypass RLS for all admin operations
    const serviceClient = createServiceClient();

    // Create organization
    const { data: organization, error: orgError } = await serviceClient
      .from("organizations")
      .insert({
        name,
        slug,
        plan_type,
        contact_email,
        monthly_price: parseFloat(monthly_price) || 0,
        subscription_status: "active",
        trial_ends_at: null,
        ...limits,
      })
      .select()
      .single();

    if (orgError) {
      logger.error("Error creating organization", { error: orgError });
      return NextResponse.json(
        {
          error: orgError.message || "Failed to create organization",
          details: orgError,
        },
        { status: 500 },
      );
    }

    // Create default feature flags for the organization
    const { error: flagsError } = await serviceClient
      .from("feature_flags")
      .insert({
        organization_id: organization.id,
        calendar_enabled: true,
        customers_enabled: true,
        leads_enabled: true,
        jobs_enabled: true,
        quotes_enabled: true,
        invoices_enabled: true,
        tasks_enabled: true,
        analytics_enabled: false,
        campaigns_enabled: true,
        ai_assistant_enabled: false,
        // Separated analytics flags
        reports_enabled: true,
        chat_analytics_enabled: true,
        call_analytics_enabled: true,
        // Integrations
        voice_calls_enabled: false,
        email_integration_enabled: false,
        sms_integration_enabled: false,
        api_access_enabled: false,
        webhooks_enabled: false,
        custom_branding_enabled: false,
        white_label_enabled: false,
      });

    if (flagsError) {
      logger.error("Error creating feature flags", {
        error: flagsError,
        organizationId: organization.id,
      });
      // Don't fail the whole request, just log it
    }

    // Create user if user details provided
    if (user_email && user_first_name && user_last_name && user_password) {
      try {
        logger.info("Creating auth user", { email: user_email });

        // Use service role client for admin operations
        const serviceClient = createServiceClient();

        const fullName = `${user_first_name} ${user_last_name}`.trim();
        // Create auth user using Supabase Admin API
        const { data: authUser, error: authError } =
          await serviceClient.auth.admin.createUser({
            email: user_email,
            password: user_password,
            email_confirm: true,
            user_metadata: {
              name: fullName,
              first_name: user_first_name,
              last_name: user_last_name,
            },
          });

        if (authError) {
          logger.error("Error creating auth user", { error: authError });
          return NextResponse.json(
            {
              error: "Organization created but user creation failed",
              details: authError.message,
              organization_id: organization.id,
            },
            { status: 500 },
          );
        }

        logger.info("Auth user created successfully", {
          userId: authUser.user.id,
        });

        // Create user record in users table (use service client to bypass RLS)
        const { error: userError } = await serviceClient.from("users").upsert(
          {
            id: authUser.user.id,
            email: user_email,
            name: fullName,
            organization_id: organization.id,
            is_super_admin: false,
            is_first_login: true,
          },
          { onConflict: "id" },
        );

        if (userError) {
          logger.error("Error creating user record", { error: userError });
          return NextResponse.json(
            {
              error: "Auth user created but database record failed",
              details: userError.message,
              organization_id: organization.id,
              auth_user_id: authUser.user.id,
            },
            { status: 500 },
          );
        }

        logger.info("User record created successfully", {
          userId: authUser.user.id,
        });

        // Create organization member record (use service client to bypass RLS)
        const { error: memberError } = await serviceClient
          .from("organization_members")
          .insert({
            organization_id: organization.id,
            user_id: authUser.user.id,
            role: "owner",
          });

        if (memberError) {
          logger.error("Error creating organization member", {
            error: memberError,
          });
          return NextResponse.json(
            {
              error: "User created but organization member record failed",
              details: memberError.message,
              organization_id: organization.id,
              user_id: authUser.user.id,
            },
            { status: 500 },
          );
        }

        logger.info("Organization member record created successfully", {
          organizationId: organization.id,
          userId: authUser.user.id,
        });

        // Update organization owner_id (use service client to bypass RLS)
        const { error: ownerError } = await serviceClient
          .from("organizations")
          .update({ owner_id: authUser.user.id })
          .eq("id", organization.id);

        if (ownerError) {
          logger.error("Error updating organization owner", {
            error: ownerError,
          });
        }

        logger.info("Organization setup complete; user can now login", {
          email: user_email,
          organizationId: organization.id,
        });
      } catch (userCreationError: any) {
        logger.error("Error in user creation process", {
          error: userCreationError,
        });
        return NextResponse.json(
          {
            error: "User creation failed",
            details: userCreationError.message,
            organization_id: organization.id,
          },
          { status: 500 },
        );
      }
    }

    // Revalidate the customers page to show the new customer
    revalidatePath("/admin/customers");
    revalidatePath("/admin");

    return NextResponse.json(organization, { status: 201 });
  } catch (error) {
    logger.error("Error in POST /api/admin/customers", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Check if user is super admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from("users")
      .select("is_super_admin")
      .eq("id", user.id)
      .single();

    if (!userData?.is_super_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Use service client to bypass RLS
    const serviceClient = createServiceClient();

    // Fetch all customers
    const { data: organizations, error } = await serviceClient
      .from("organizations")
      .select(`
        *,
        owner:users!organizations_owner_id_fkey(name, email),
        organization_members(count)
      `)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error fetching customers", { error });
      return NextResponse.json(
        { error: "Failed to fetch customers" },
        { status: 500 },
      );
    }

    return NextResponse.json(organizations);
  } catch (error) {
    logger.error("Error in GET /api/admin/customers", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
