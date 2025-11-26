import { type NextRequest, NextResponse } from "next/server";

import {
  isUuid,
  resolveVapiAssistantIdentifiers,
} from "@/lib/server/vapi-assistant";
import { createServerClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

type WidgetPayload = {
  logo_url?: string | null;
  primary_color?: string | null;
  welcome_message?: string | null;
  vapi_agent_id?: string | null;
  enabled?: boolean;
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export async function resolveOrgId() {
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

  const { data: profile, error: profileError } = await serviceClient
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Failed to load user profile", profileError);
    return {
      error: NextResponse.json(
        { error: "Failed to resolve organization" },
        { status: 500 },
      ),
    };
  }

  let orgId = profile?.organization_id ?? null;
  let hasMembership = false;

  if (orgId) {
    const { data: membershipRow } = await serviceClient
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .eq("organization_id", orgId)
      .maybeSingle();
    hasMembership = Boolean(membershipRow);
  }

  if (!orgId) {
    const { data: membership, error: membershipError } = await serviceClient
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (membershipError) {
      console.error(
        "Failed to resolve organization membership",
        membershipError,
      );
      return {
        error: NextResponse.json(
          { error: "Failed to resolve organization" },
          { status: 500 },
        ),
      };
    }

    if (membership?.organization_id) {
      orgId = membership.organization_id;
      hasMembership = true;
    }
  }

  if (!orgId) {
    const { data: ownedOrg, error: ownerError } = await serviceClient
      .from("organizations")
      .select("id")
      .eq("owner_id", user.id)
      .limit(1)
      .maybeSingle();

    if (ownerError) {
      console.error("Failed to resolve owned organization", ownerError);
      return {
        error: NextResponse.json(
          { error: "Failed to resolve organization" },
          { status: 500 },
        ),
      };
    }

    if (ownedOrg?.id) {
      orgId = ownedOrg.id;
    }
  }

  if (!orgId && user.email) {
    const { data: contactOrg, error: contactOrgError } = await serviceClient
      .from("organizations")
      .select("id")
      .eq("contact_email", user.email)
      .limit(1)
      .maybeSingle();

    if (contactOrgError) {
      console.error("Failed to resolve contact organization", contactOrgError);
    } else if (contactOrg?.id) {
      orgId = contactOrg.id;
    }
  }

  if (!orgId) {
    return {
      error: NextResponse.json(
        { error: "Ingen organisation kopplad till användaren" },
        { status: 400 },
      ),
    };
  }

  if (!profile?.organization_id) {
    try {
      await serviceClient
        .from("users")
        .update({ organization_id: orgId })
        .eq("id", user.id);
    } catch (error: any) {
      console.error("Failed to backfill user organization", error);
    }
  }

  if (!hasMembership) {
    try {
      await serviceClient.from("organization_members").upsert(
        {
          organization_id: orgId,
          user_id: user.id,
          role: "owner",
        },
        { onConflict: "organization_id,user_id" },
      );
    } catch (error: any) {
      console.error("Failed to backfill membership", error);
    }
  }

  return { supabase, serviceClient, userId: user.id, orgId };
}

export async function GET() {
  const context = await resolveOrgId();
  if ("error" in context) return context.error;

  const { serviceClient, orgId } = context;

  const { data, error } = await serviceClient
    .from("chat_widget_configs")
    .select("*")
    .eq("org_id", orgId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load widget config", error);
    return NextResponse.json(
      { error: "Failed to load widget config" },
      { status: 500 },
    );
  }

  return NextResponse.json({ data });
}

export async function PUT(request: NextRequest) {
  const context = await resolveOrgId();
  if ("error" in context) return context.error;

  const { serviceClient, orgId, userId } = context;
  const body = (await request.json()) as WidgetPayload;

  const rawAssistantId = body.vapi_agent_id?.trim() || null;
  let resolvedAssistantId = rawAssistantId;
  let resolvedAssistantUuid: string | null = null;

  if (rawAssistantId) {
    if (isUuid(rawAssistantId)) {
      resolvedAssistantUuid = rawAssistantId;
    } else {
      const { data: orgVapi, error: orgVapiError } = await serviceClient
        .from("organizations")
        .select("vapi_api_key, vapi_base_url, vapi_org_id, vapi_enabled")
        .eq("id", orgId)
        .single();

      if (orgVapiError) {
        console.error("Failed to load organization Vapi config", orgVapiError);
        return NextResponse.json(
          { error: "Failed to load Vapi configuration" },
          { status: 500 },
        );
      }

      if (!orgVapi?.vapi_enabled || !orgVapi.vapi_api_key) {
        return NextResponse.json(
          {
            error:
              "Vapi integration must be configured before assigning an assistant",
          },
          { status: 400 },
        );
      }

      try {
        const identifiers = await resolveVapiAssistantIdentifiers({
          identifier: rawAssistantId,
          apiKey: orgVapi.vapi_api_key,
          baseUrl: orgVapi.vapi_base_url,
          orgId: orgVapi.vapi_org_id,
        });
        resolvedAssistantId = identifiers.shortId;
        resolvedAssistantUuid = identifiers.uuid;
      } catch (resolverError: any) {
        console.error("Failed to resolve Vapi assistant UUID", resolverError);
        return NextResponse.json(
          {
            error: "Invalid Vapi assistant",
            details: resolverError?.message,
          },
          { status: 400 },
        );
      }
    }
  }

  const payload = {
    logo_url: body.logo_url ?? null,
    primary_color: body.primary_color ?? "#0ea5e9",
    welcome_message: body.welcome_message ?? null,
    vapi_agent_id: resolvedAssistantId,
    vapi_agent_uuid: resolvedAssistantUuid,
    enabled: typeof body.enabled === "boolean" ? body.enabled : false,
  };

  const { data: existing, error: existingError } = await serviceClient
    .from("chat_widget_configs")
    .select("id")
    .eq("org_id", orgId)
    .maybeSingle();

  if (existingError) {
    console.error("Failed to read existing widget config", existingError);
    return NextResponse.json(
      { error: "Failed to update widget config" },
      { status: 500 },
    );
  }

  const query = existing
    ? serviceClient
        .from("chat_widget_configs")
        .update(payload)
        .eq("org_id", orgId)
    : serviceClient
        .from("chat_widget_configs")
        .insert({ org_id: orgId, ...payload });

  const { data, error } = await query.select().single();

  if (error) {
    console.error("Failed to save widget config", error);
    return NextResponse.json(
      { error: `Failed to save widget config: ${error.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ data });
}
