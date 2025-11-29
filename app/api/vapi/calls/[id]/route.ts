import { type NextRequest, NextResponse } from "next/server";
import { Vapi } from "@/lib/analytics/vapi";

function getKey(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  const keyHeader = req.headers.get("x-vapi-key");
  if (keyHeader?.trim()) return keyHeader.trim();
  if (auth?.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  return null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const apiKey = getKey(req);
    if (!apiKey)
      return NextResponse.json(
        { error: "Missing VAPI API key" },
        { status: 401 },
      );
    const { id } = await params;
    if (!id)
      return NextResponse.json({ error: "Missing call id" }, { status: 400 });

    const { searchParams } = new URL(req.url);
    const baseUrl = searchParams.get("baseUrl") || undefined;
    const orgId =
      req.headers.get("x-vapi-org-id") ||
      searchParams.get("orgId") ||
      undefined;

    const vapi = new Vapi({ apiKey, baseUrl, orgId });
    const status = await vapi.getCallStatus(id);
    return NextResponse.json(status);
  } catch (e: any) {
    const msg = e?.message || "VAPI request failed";
    const status = /401|403|404|400/.test(String(e?.status))
      ? Number(e.status)
      : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
