import { type NextRequest, NextResponse } from "next/server";

/**
 * API Route för att generera PDF från rapport
 *
 * GET /api/rapport/[id]/pdf?profile=customer|internal
 *
 * Returnerar HTML som kan skrivas ut som PDF
 * I framtiden kan detta utökas med Puppeteer/Playwright för server-side PDF
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const profile = searchParams.get("profile") || "customer";

    // Redirect till print-sidan
    const printUrl = new URL(`/rapport/${id}/print`, request.url);
    printUrl.searchParams.set("profile", profile);

    return NextResponse.redirect(printUrl);
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "Kunde inte generera PDF" },
      { status: 500 },
    );
  }
}
