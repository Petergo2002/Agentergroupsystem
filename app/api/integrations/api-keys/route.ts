import crypto from "crypto";
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { sendToUserWebhooks } from "@/lib/webhooks";

export const runtime = "nodejs";

function randomString(len: number) {
  return crypto
    .randomBytes(Math.ceil(len / 2))
    .toString("hex")
    .slice(0, len);
}

function sha256Hex(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

// POST: create a new API key for the current logged-in company (user)
// GET: list existing keys (prefix, last4, scopes, timestamps)
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Inte inloggad" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const scopes: string[] =
      Array.isArray(body?.scopes) && body.scopes.length > 0
        ? body.scopes
        : [
            "contacts:create",
            "events:read",
            "events:create",
            "events:update",
            "events:delete",
          ];

    const rl_window_s = Number.isFinite(body?.rl_window_s)
      ? Number(body.rl_window_s)
      : 60;
    const rl_max = Number.isFinite(body?.rl_max) ? Number(body.rl_max) : 60;
    const webhook_url =
      typeof body?.webhook_url === "string" && body.webhook_url.trim() !== ""
        ? body.webhook_url.trim()
        : null;

    const prefixCore = randomString(12);
    const prefix = `crm_live_${prefixCore}`;
    const secret = randomString(48);
    const salt = randomString(16);
    const secret_hash = sha256Hex(`${salt}.${secret}`);
    const last4 = secret.slice(-4);

    const { data, error } = await supabase
      .from("api_keys")
      .insert([
        {
          user_id: user.id,
          prefix,
          secret_hash,
          salt,
          last4,
          scopes,
          rl_window_s,
          rl_max,
          webhook_url,
        },
      ])
      .select(
        "id, prefix, last4, scopes, created_at, rl_window_s, rl_max, webhook_url",
      )
      .single();

    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });

    const apiKey = `${prefix}.${secret}`;

    // Best-effort webhook (signed with global secret)
    try {
      await sendToUserWebhooks(user.id, "api_key.created", {
        id: data.id,
        prefix: data.prefix,
        last4: data.last4,
        scopes: data.scopes,
        rl_window_s: data.rl_window_s,
        rl_max: data.rl_max,
        webhook_url: data.webhook_url,
        created_at: data.created_at,
      });
    } catch (e) {
      console.error("webhook api_key.created failed", e);
    }

    return NextResponse.json({
      apiKey, // visa bara en gång
      key: { ...data },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Okänt fel" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Inte inloggad" }, { status: 401 });

    const { data, error } = await supabase
      .from("api_keys")
      .select(
        "id, prefix, last4, scopes, created_at, last_used_at, revoked_at, rl_window_s, rl_max, webhook_url",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ keys: data });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Okänt fel" },
      { status: 500 },
    );
  }
}
