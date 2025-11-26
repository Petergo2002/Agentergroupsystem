import crypto from "crypto";
import { type NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

// HMAC helper
function timingSafeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

function sha256Hex(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

type VerifiedContext = {
  userId: string;
  keyId: string;
  prefix: string;
  secret: string;
  scopes: string[];
  rateLimitMax?: number;
  rateLimitWindowS?: number;
  webhookUrl?: string | null;
};

async function verifyRequest(
  rawBody: string,
  req: NextRequest,
): Promise<VerifiedContext> {
  const apiKey = req.headers.get("x-api-key") || req.headers.get("X-API-Key");
  const timestamp =
    req.headers.get("x-timestamp") || req.headers.get("X-Timestamp");
  const signature =
    req.headers.get("x-signature") || req.headers.get("X-Signature");

  if (!apiKey) throw new Error("Saknar X-API-Key");
  if (!timestamp) throw new Error("Saknar X-Timestamp");
  if (!signature) throw new Error("Saknar X-Signature");

  const parts = apiKey.split(".");
  if (parts.length !== 2) throw new Error("Felaktigt API-nyckelformat");
  const [prefix, secret] = parts as [string, string];

  // basic timestamp check (5 min window)
  const ts = new Date(timestamp);
  if (isNaN(ts.getTime())) throw new Error("Ogiltig timestamp");
  const now = new Date();
  const diffMs = Math.abs(now.getTime() - ts.getTime());
  if (diffMs > 5 * 60 * 1000)
    throw new Error("Request timestamp ligger utanför 5-minutersfönster");

  // Verify API key against DB
  const admin = createServiceClient();
  const { data: keyRow, error } = await admin
    .from("api_keys")
    .select(
      "id, user_id, prefix, secret_hash, salt, scopes, revoked_at, rl_max, rl_window_s, webhook_url",
    )
    .eq("prefix", prefix)
    .limit(1)
    .single();

  if (error || !keyRow) throw new Error("API-nyckel ogiltig");
  if (keyRow.revoked_at) throw new Error("API-nyckel är spärrad");

  const computedHash = sha256Hex(`${keyRow.salt}.${secret}`);
  if (!timingSafeEqual(computedHash, keyRow.secret_hash)) {
    throw new Error("API-nyckel kunde inte verifieras");
  }

  // Verify HMAC over `${timestamp}.${rawBody}` with user's secret
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");
  if (!timingSafeEqual(expected, signature)) {
    throw new Error("Signatur ogiltig");
  }

  // Update last_used_at (best-effort)
  await admin
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", keyRow.id);

  return {
    userId: keyRow.user_id as string,
    keyId: keyRow.id as string,
    prefix,
    secret,
    scopes: (keyRow.scopes || []) as string[],
    rateLimitMax: keyRow.rl_max as number | undefined,
    rateLimitWindowS: keyRow.rl_window_s as number | undefined,
    webhookUrl: (keyRow.webhook_url as string | null) ?? null,
  };
}

// Helpers
async function sendWebhook(
  webhookUrl: string | null | undefined,
  secret: string,
  keyPrefix: string,
  userId: string,
  event: string,
  payload: any,
) {
  try {
    if (!webhookUrl) return;
    const timestamp = new Date().toISOString();
    const body = JSON.stringify({
      event,
      payload,
      meta: { key_prefix: keyPrefix, user_id: userId },
    });
    const signature = crypto
      .createHmac("sha256", secret)
      .update(`${timestamp}.${body}`)
      .digest("hex");
    await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Timestamp": timestamp,
        "X-Signature": signature,
        "X-Key-Prefix": keyPrefix,
      },
      body,
    });
  } catch (err) {
    console.error("Webhook error", err);
  }
}
async function findOrCreateContact(admin: any, userId: string, payload: any) {
  const { name, email, phone, company, notes } = payload || {};
  let contactId: string | null = null;

  if (email) {
    const { data: existingByEmail } = await admin
      .from("contacts")
      .select("id")
      .eq("user_id", userId)
      .eq("email", email)
      .limit(1)
      .maybeSingle();
    if (existingByEmail) return existingByEmail.id;
  }

  if (phone) {
    const { data: existingByPhone } = await admin
      .from("contacts")
      .select("id")
      .eq("user_id", userId)
      .eq("phone", phone)
      .limit(1)
      .maybeSingle();
    if (existingByPhone) return existingByPhone.id;
  }

  if (name) {
    const { data: existingByName } = await admin
      .from("contacts")
      .select("id")
      .eq("user_id", userId)
      .ilike("name", name)
      .limit(1)
      .maybeSingle();
    if (existingByName) return existingByName.id;
  }

  // Create new
  const { data: created, error: insertErr } = await admin
    .from("contacts")
    .insert([
      {
        user_id: userId,
        name: name || "Okänd",
        email: email || null,
        phone: phone || null,
        company: company || null,
        notes: notes || null,
      },
    ])
    .select("id")
    .single();
  if (insertErr) throw insertErr;
  contactId = created.id;
  return contactId;
}

async function isTimeAvailable(
  admin: any,
  userId: string,
  start: string,
  end: string,
  excludeEventId?: string,
) {
  const q = admin
    .from("events")
    .select("id, start_time, end_time, status")
    .eq("user_id", userId)
    .eq("status", "busy")
    .lt("start_time", end)
    .gt("end_time", start);
  const { data, error } = excludeEventId
    ? await q.neq("id", excludeEventId)
    : await q;
  if (error) throw error;
  return (data?.length || 0) === 0;
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text(); // must be raw for HMAC
    let body: any = {};
    try {
      body = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      return NextResponse.json(
        { error: "Kunde inte parsa JSON-body" },
        { status: 400 },
      );
    }

    const { userId, scopes, keyId, rateLimitMax, webhookUrl, secret, prefix } =
      await verifyRequest(rawBody, req);

    const admin = createServiceClient();
    const action: string = body?.action;
    const payload: any = body?.payload || {};

    if (!action)
      return NextResponse.json({ error: "action saknas" }, { status: 400 });

    // Rate limit check (after auth)
    let rlHeaders: Headers | undefined;
    try {
      const { data: rlData, error: rlErr } = await admin.rpc(
        "api_key_rate_check",
        { p_key_id: keyId },
      );
      if (rlErr) {
        console.error("rate_limit rpc error", rlErr);
      }
      const rlRow = Array.isArray(rlData) ? rlData[0] : undefined;
      if (rlRow) {
        const resetIso = rlRow.reset_at
          ? new Date(rlRow.reset_at).toISOString()
          : undefined;
        rlHeaders = new Headers();
        if (rateLimitMax != null)
          rlHeaders.set("X-RateLimit-Limit", String(rateLimitMax));
        if (rlRow.remaining != null)
          rlHeaders.set("X-RateLimit-Remaining", String(rlRow.remaining));
        if (resetIso) rlHeaders.set("X-RateLimit-Reset", resetIso);
        if (rlRow.allowed === false) {
          return NextResponse.json(
            { error: "Rate limit överskriden" },
            { status: 429, headers: rlHeaders },
          );
        }
      }
    } catch (e) {
      console.error("rate_limit exception", e);
    }

    const respond = (json: any, status = 200) =>
      NextResponse.json(json, { status, headers: rlHeaders });

    // Actions
    const requireScope = (scope: string) => {
      if (!scopes?.includes(scope)) {
        return respond(
          { error: `API-nyckeln saknar behörighet: ${scope}` },
          403,
        );
      }
      return null;
    };

    if (action === "check_availability") {
      const denied = requireScope("events:read");
      if (denied) return denied;
      const { start_time, end_time } = payload;
      if (!start_time || !end_time)
        return respond({ error: "start_time och end_time krävs" }, 400);
      const available = await isTimeAvailable(
        admin,
        userId,
        start_time,
        end_time,
      );
      return respond({
        available,
        message: available ? "Tiden är ledig" : "Tiden är inte tillgänglig",
      });
    }

    if (action === "create_event") {
      const denied = requireScope("events:create");
      if (denied) return denied;
      const { title, description, start_time, end_time, contact } = payload;
      if (!title || !start_time || !end_time)
        return respond({ error: "title, start_time, end_time krävs" }, 400);

      const available = await isTimeAvailable(
        admin,
        userId,
        start_time,
        end_time,
      );
      if (!available) {
        return respond(
          { created: false, message: "Denna tid är ej tillgänglig" },
          409,
        );
      }

      let contactId: string | null = null;
      if (contact && (contact.name || contact.email || contact.phone)) {
        contactId = await findOrCreateContact(admin, userId, contact);
      }

      const { data: ev, error: evErr } = await admin
        .from("events")
        .insert([
          {
            user_id: userId,
            title,
            description: description || null,
            start_time,
            end_time,
            contact_id: contactId,
          },
        ])
        .select("id, title, start_time, end_time, contact_id")
        .single();
      if (evErr) return respond({ error: evErr.message }, 400);
      // webhook
      await sendWebhook(webhookUrl, secret, prefix, userId, "event.created", {
        event: ev,
      });
      return respond({ created: true, event: ev, message: "Möte bokat" });
    }

    if (action === "update_event") {
      const denied = requireScope("events:update");
      if (denied) return denied;
      const { id, title, description, start_time, end_time, status } = payload;
      if (!id) return respond({ error: "id krävs" }, 400);

      if (start_time && end_time) {
        const available = await isTimeAvailable(
          admin,
          userId,
          start_time,
          end_time,
          id,
        );
        if (!available)
          return respond(
            { updated: false, message: "Ny tid är ej tillgänglig" },
            409,
          );
      }

      const update: any = {};
      if (title !== undefined) update.title = title;
      if (description !== undefined) update.description = description;
      if (start_time !== undefined) update.start_time = start_time;
      if (end_time !== undefined) update.end_time = end_time;
      if (status !== undefined) update.status = status;

      const { data: ev, error: evErr } = await admin
        .from("events")
        .update(update)
        .eq("user_id", userId)
        .eq("id", id)
        .select("id, title, start_time, end_time, status")
        .single();
      if (evErr) return respond({ error: evErr.message }, 400);
      await sendWebhook(webhookUrl, secret, prefix, userId, "event.updated", {
        event: ev,
      });
      return respond({ updated: true, event: ev, message: "Möte uppdaterat" });
    }

    if (action === "delete_event") {
      const denied = requireScope("events:delete");
      if (denied) return denied;
      const { id } = payload;
      if (!id) return respond({ error: "id krävs" }, 400);

      const { error: delErr } = await admin
        .from("events")
        .delete()
        .eq("user_id", userId)
        .eq("id", id);
      if (delErr) return respond({ error: delErr.message }, 400);
      await sendWebhook(webhookUrl, secret, prefix, userId, "event.deleted", {
        id,
      });
      return respond({ deleted: true, message: "Möte borttaget" });
    }

    if (action === "create_contact") {
      const denied = requireScope("contacts:create");
      if (denied) return denied;
      const { name, email, phone, company, notes } = payload;
      if (!name && !email && !phone)
        return respond(
          { error: "Minst namn eller email eller telefon krävs" },
          400,
        );
      const contactId = await findOrCreateContact(admin, userId, {
        name,
        email,
        phone,
        company,
        notes,
      });
      await sendWebhook(webhookUrl, secret, prefix, userId, "contact.created", {
        contact_id: contactId,
      });
      return respond({
        created: true,
        contact_id: contactId,
        message: "Kontakt skapad/återanvänd",
      });
    }

    if (action === "get_upcoming_events") {
      const denied = requireScope("events:read");
      if (denied) return denied;
      const days: number = Math.max(
        1,
        Math.min(60, Number(payload?.days || 7)),
      );
      const start = new Date().toISOString();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);
      const end = endDate.toISOString();

      const { data: events, error } = await admin
        .from("events")
        .select("id, title, start_time, end_time, status, contact_id")
        .eq("user_id", userId)
        .gte("start_time", start)
        .lte("start_time", end)
        .order("start_time", { ascending: true });
      if (error) return respond({ error: error.message }, 400);
      return respond({ events });
    }

    return respond({ error: `Okänd action: ${action}` }, 400);
  } catch (e: any) {
    const message = e?.message || "Okänt fel";
    const status =
      /saknar|ogiltig|spärrad|kunde inte verifieras|timestamp/i.test(message)
        ? 401
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
