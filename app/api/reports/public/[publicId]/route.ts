import { type NextRequest, NextResponse } from "next/server";
import { mapReportRow } from "@/lib/store";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ publicId: string }> },
) {
  try {
    const { publicId } = await params;
    // Use service client for public endpoints - bypasses RLS for public_id lookup
    const supabase = createServiceClient();

    // Hämta rapport via public_id (ingen auth krävs)
    const { data: reportData, error: reportError } = await supabase
      .from("reports")
      .select("*")
      .eq("public_id", publicId)
      .single();

    if (reportError || !reportData) {
      return NextResponse.json(
        { error: "Rapport hittades inte" },
        { status: 404 },
      );
    }

    const reportRow = reportData as any;

    // Hämta template
    const { data: templateData } = await supabase
      .from("report_templates")
      .select("*")
      .eq("id", reportRow.template_id)
      .single();

    const templateRow = templateData as any;

    // Normalisera rapport med samma logik som mapReportRow, men exponera bara publika fält
    const fullReport = mapReportRow(reportRow);

    const mappedReport = {
      id: fullReport.id,
      title: fullReport.title,
      status: fullReport.status,
      type: fullReport.type,
      templateId: fullReport.templateId,
      metadata: fullReport.metadata,
      sections: fullReport.sections,
      checklist: fullReport.checklist,
      assets: fullReport.assets,
      updatedAt: fullReport.updatedAt,
      exportedAt: fullReport.exportedAt,
      publicId: fullReport.publicId,
      customerEmail: fullReport.customerEmail,
      customerApprovedAt: fullReport.customerApprovedAt,
      customerApprovedBy: fullReport.customerApprovedBy,
    };

    const mappedTemplate = templateRow
      ? {
          id: templateRow.id,
          name: templateRow.name,
          description: templateRow.description,
          trade: templateRow.trade,
          sections: templateRow.sections,
          checklist: templateRow.checklist,
        }
      : null;

    return NextResponse.json({
      report: mappedReport,
      template: mappedTemplate,
    });
  } catch (error) {
    console.error("Error fetching public report:", error);
    return NextResponse.json({ error: "Internt serverfel" }, { status: 500 });
  }
}
