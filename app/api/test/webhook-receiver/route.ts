import crypto from "crypto";
import { type NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

function timingSafeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export async function POST(req: NextRequest) {
  try {
    const timestamp =
      req.headers.get("x-timestamp") || req.headers.get("X-Timestamp");
    const signature =
      req.headers.get("x-signature") || req.headers.get("X-Signature");
    const event =
      req.headers.get("x-event") || req.headers.get("X-Event") || "unknown";

    if (!timestamp || !signature) {
      return NextResponse.json(
        { ok: false, error: "Missing signature headers" },
        { status: 400 },
      );
    }

    const rawBody = await req.text();

    // basic timestamp freshness check (5 min)
    const ts = new Date(timestamp);
    if (isNaN(ts.getTime()))
      return NextResponse.json(
        { ok: false, error: "Invalid timestamp" },
        { status: 400 },
      );
    const now = new Date();
    const ageMs = Math.abs(now.getTime() - ts.getTime());
    if (ageMs > 5 * 60 * 1000)
      return NextResponse.json(
        { ok: false, error: "Stale timestamp" },
        { status: 401 },
      );

    const secret = process.env.WEBHOOK_SIGNING_SECRET;
    if (!secret)
      return NextResponse.json(
        { ok: false, error: "Server not configured: WEBHOOK_SIGNING_SECRET" },
        { status: 500 },
      );

    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${timestamp}.${rawBody}`)
      .digest("hex");
    if (!timingSafeEqual(expected, signature)) {
      return NextResponse.json(
        { ok: false, error: "Signature mismatch" },
        { status: 401 },
      );
    }

    // Log for local dev
    logger.debug("Webhook OK", { event, bodySnippet: rawBody.slice(0, 200) });
    return NextResponse.json({ ok: true, event });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unknown error" },
      { status: 500 },
    );
  }
}
