import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/reports/[id]/pdf
 * Server-side route som hämtar en rapport (med användarens session)
 * och renderar enkel HTML som kan skrivas ut till PDF i browsern.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Server-side Supabase client med cookies/session
    const supabase = await createServerClient();

    // Hämta rapport
    const { data: report, error: reportError } = await supabase
      .from("reports")
      .select("*")
      .eq("id", id)
      .single();

    if (reportError || !report) {
      console.error("[reports/[id]/pdf] Report fetch error", reportError);
      return new NextResponse(
        `<html><body><h1>Rapport hittades inte</h1><p>ID: ${id}</p></body></html>`,
        {
          status: 404,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        },
      );
    }

    // Enkel HTML för PDF
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Rapport - ${report.title || "Untitled"}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      line-height: 1.6;
    }
    h1 { color: #0f172a; margin-bottom: 10px; }
    h2 { color: #475569; margin-top: 30px; border-bottom: 2px solid #22c55e; padding-bottom: 5px; }
    .metadata { background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .metadata p { margin: 5px 0; }
    .section { margin: 20px 0; }
    @media print {
      body { margin: 0; padding: 20px; }
    }
  </style>
</head>
<body>
  <h1>${report.title || "Rapport"}</h1>
  
  <div class="metadata">
    <p><strong>Rapportnummer:</strong> ${report.report_number || "-"}</p>
    <p><strong>Datum:</strong> ${report.date || "-"}</p>
    <p><strong>Kund:</strong> ${report.company_name || report.customer_name || "-"}</p>
    <p><strong>Plats:</strong> ${report.location || "-"}</p>
    <p><strong>Utredare:</strong> ${report.inspector_name || "-"}</p>
  </div>

  ${
    report.introduction
      ? `
  <div class="section">
    <h2>Inledning</h2>
    <p>${report.introduction}</p>
  </div>
  `
      : ""
  }

  ${
    report.background
      ? `
  <div class="section">
    <h2>Bakgrund</h2>
    <p>${report.background}</p>
  </div>
  `
      : ""
  }

  ${
    report.methods
      ? `
  <div class="section">
    <h2>Mätmetoder</h2>
    <p>${report.methods}</p>
  </div>
  `
      : ""
  }

  ${
    report.conclusion
      ? `
  <div class="section">
    <h2>Slutsats</h2>
    <p>${report.conclusion}</p>
  </div>
  `
      : ""
  }

  <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
    <p>Genererad: ${new Date().toLocaleDateString("sv-SE")}</p>
  </div>
</body>
</html>
    `;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("[reports/[id]/pdf] Unexpected error", error);
    return new NextResponse(
      `<html><body><h1>Fel vid generering</h1><p>${error instanceof Error ? error.message : "Okänt fel"}</p></body></html>`,
      {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      },
    );
  }
}
