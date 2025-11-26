import { type NextRequest, NextResponse } from "next/server";

import { resolveOrgId } from "@/app/api/chat-widget/route";

type BrandingPayload = {
  name?: string | null;
  logo_url?: string | null;
};

export async function GET() {
  const context = await resolveOrgId();
  if ("error" in context) return context.error;

  const { serviceClient, orgId } = context;

  const { data: organization, error: orgError } = await serviceClient
    .from("organizations")
    .select("name")
    .eq("id", orgId)
    .maybeSingle();

  if (orgError) {
    console.error("Failed to load organization branding", orgError);
    return NextResponse.json(
      { error: "Failed to load organization branding" },
      { status: 500 },
    );
  }

  const { data: widgetConfig, error: widgetError } = await serviceClient
    .from("chat_widget_configs")
    .select("logo_url")
    .eq("org_id", orgId)
    .maybeSingle();

  if (widgetError) {
    console.error("Failed to load widget branding", widgetError);
  }

  return NextResponse.json({
    data: {
      name: (organization as any)?.name ?? null,
      logo_url: (widgetConfig as any)?.logo_url ?? null,
    },
  });
}

export async function PUT(request: NextRequest) {
  const context = await resolveOrgId();
  if ("error" in context) return context.error;

  const { serviceClient, orgId } = context;
  const body = (await request.json()) as BrandingPayload;

  let updatedName: string | null = null;
  let updatedLogoUrl: string | null = null;

  if (typeof body.name !== "undefined") {
    const { data: updatedOrg, error: updateOrgError } = await serviceClient
      .from("organizations")
      .update({
        name: body.name ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orgId)
      .select("name")
      .maybeSingle();

    if (updateOrgError) {
      console.error("Failed to update organization name", updateOrgError);
      return NextResponse.json(
        { error: "Failed to update organization name" },
        { status: 500 },
      );
    }

    updatedName = (updatedOrg as any)?.name ?? null;
  }

  if (typeof body.logo_url !== "undefined") {
    const payload = {
      logo_url: body.logo_url ?? null,
    };

    const { data: existing, error: existingError } = await serviceClient
      .from("chat_widget_configs")
      .select("id")
      .eq("org_id", orgId)
      .maybeSingle();

    if (existingError) {
      console.error("Failed to read existing widget branding", existingError);
      return NextResponse.json(
        { error: "Failed to update logo" },
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

    const { data: updatedWidget, error: widgetError } = await query
      .select("logo_url")
      .maybeSingle();

    if (widgetError) {
      console.error("Failed to save widget branding", widgetError);
      return NextResponse.json(
        { error: "Failed to save logo" },
        { status: 500 },
      );
    }

    updatedLogoUrl = (updatedWidget as any)?.logo_url ?? null;
  }

  return NextResponse.json({
    data: {
      name: updatedName,
      logo_url: updatedLogoUrl,
    },
  });
}
