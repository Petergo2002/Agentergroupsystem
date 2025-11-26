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

// POST: rotate secret for a key; returns the new full key one time
export async function POST(
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

    // Fetch key to get prefix and user ownership
    const { data: key, error: fetchErr } = await supabase
      .from("api_keys")
      .select("id, prefix")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchErr || !key)
      return NextResponse.json(
        { error: fetchErr?.message || "Nyckel saknas" },
        { status: 404 },
      );

    const secret = randomString(48);
    const salt = randomString(16);
    const secret_hash = sha256Hex(`${salt}.${secret}`);
    const last4 = secret.slice(-4);

    const { data: updated, error } = await supabase
      .from("api_keys")
      .update({ salt, secret_hash, last4 })
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id, prefix, last4, scopes, rl_window_s, rl_max, webhook_url")
      .single();

    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });

    const apiKey = `${updated.prefix}.${secret}`;
    // Best-effort webhook
    try {
      await sendToUserWebhooks(user.id, "api_key.rotated", {
        id: updated.id,
        prefix: updated.prefix,
        last4: updated.last4,
        scopes: updated.scopes,
        rl_window_s: updated.rl_window_s,
        rl_max: updated.rl_max,
        webhook_url: updated.webhook_url,
      });
    } catch (e) {
      console.error("webhook api_key.rotated failed", e);
    }

    return NextResponse.json({ apiKey, key: updated });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Okänt fel" },
      { status: 500 },
    );
  }
}
