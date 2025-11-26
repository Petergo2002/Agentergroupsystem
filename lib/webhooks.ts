import crypto from "crypto";
import { createServerClient } from "@/lib/supabase/server";

export type WebhookEvent =
  | "api_key.created"
  | "api_key.updated"
  | "api_key.rotated"
  | "api_key.revoked";

function getSecret(): string {
  const secret = process.env.WEBHOOK_SIGNING_SECRET;
  if (!secret)
    throw new Error("WEBHOOK_SIGNING_SECRET saknas i miljövariablerna");
  return secret;
}

export function signPayload(timestamp: string, body: string): string {
  const key = getSecret();
  return crypto
    .createHmac("sha256", key)
    .update(`${timestamp}.${body}`)
    .digest("hex");
}

export async function sendToUserWebhooks(
  userId: string,
  event: WebhookEvent,
  payload: Record<string, any>,
) {
  const supabase = await createServerClient();
  const { data: keys, error } = await supabase
    .from("api_keys")
    .select("webhook_url, revoked_at")
    .eq("user_id", userId)
    .is("revoked_at", null)
    .not("webhook_url", "is", null);

  if (error) throw new Error(error.message);
  const targets = (keys || [])
    .map((k) => k.webhook_url as string)
    .filter(Boolean);
  if (targets.length === 0) return;

  const body = JSON.stringify({ event, payload });
  const ts = new Date().toISOString();
  const sig = signPayload(ts, body);

  await Promise.all(
    targets.map(async (url) => {
      try {
        await fetch(url, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "X-Timestamp": ts,
            "X-Signature": sig,
            "X-Event": event,
            "X-Webhook-Source": "crm",
          },
          body,
        });
      } catch (_e) {
        // swallow for now; TODO: add outbox/logging
      }
    }),
  );
}
