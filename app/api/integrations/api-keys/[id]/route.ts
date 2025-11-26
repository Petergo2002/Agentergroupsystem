import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { sendToUserWebhooks } from "@/lib/webhooks";

export const runtime = "nodejs";

// PATCH: update fields (scopes, rl_window_s, rl_max, webhook_url)
// DELETE: revoke (set revoked_at)
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Inte inloggad" }, { status: 401 });

    const { id } = await context.params;
    const body = await req.json().catch(() => ({}) as any);
    const update: any = {};

    if (Array.isArray(body.scopes)) update.scopes = body.scopes;
    if (Number.isFinite(body.rl_window_s))
      update.rl_window_s = Number(body.rl_window_s);
    if (Number.isFinite(body.rl_max)) update.rl_max = Number(body.rl_max);
    if (typeof body.webhook_url === "string")
      update.webhook_url = body.webhook_url.trim() || null;

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { error: "Inga fält att uppdatera" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("api_keys")
      .update(update)
      .eq("id", id)
      .eq("user_id", user.id)
      .select(
        "id, prefix, last4, scopes, created_at, last_used_at, revoked_at, rl_window_s, rl_max, webhook_url",
      )
      .single();

    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });

    // Best-effort webhook
    try {
      await sendToUserWebhooks(user.id, "api_key.updated", {
        id: data.id,
        prefix: data.prefix,
        last4: data.last4,
        scopes: data.scopes,
        rl_window_s: data.rl_window_s,
        rl_max: data.rl_max,
        webhook_url: data.webhook_url,
        revoked_at: data.revoked_at,
        last_used_at: data.last_used_at,
      });
    } catch (e) {
      console.error("webhook api_key.updated failed", e);
    }

    return NextResponse.json({ key: data });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Okänt fel" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Inte inloggad" }, { status: 401 });

    const { id } = await context.params;

    const { data, error } = await supabase
      .from("api_keys")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id, revoked_at")
      .single();

    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });

    // Best-effort webhook
    try {
      await sendToUserWebhooks(user.id, "api_key.revoked", {
        id: data.id,
        revoked_at: data.revoked_at,
      });
    } catch (e) {
      console.error("webhook api_key.revoked failed", e);
    }

    return NextResponse.json({ revoked: true, key: data });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Okänt fel" },
      { status: 500 },
    );
  }
}
