import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ publicId: string }> }
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
        { status: 404 }
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

    // Mappa till frontend-format
    const mappedReport = {
      id: reportRow.id,
      title: reportRow.title,
      status: reportRow.status,
      type: reportRow.type,
      templateId: reportRow.template_id,
      metadata: reportRow.metadata,
      sections: reportRow.sections,
      checklist: reportRow.checklist,
      assets: reportRow.assets,
      updatedAt: reportRow.updated_at,
      exportedAt: reportRow.exported_at,
      publicId: reportRow.public_id,
      customerEmail: reportRow.customer_email,
      customerApprovedAt: reportRow.customer_approved_at,
      customerApprovedBy: reportRow.customer_approved_by,
    };

    const mappedTemplate = templateRow ? {
      id: templateRow.id,
      name: templateRow.name,
      description: templateRow.description,
      trade: templateRow.trade,
      sections: templateRow.sections,
      checklist: templateRow.checklist,
    } : null;

    return NextResponse.json({ report: mappedReport, template: mappedTemplate });
  } catch (error) {
    console.error("Error fetching public report:", error);
    return NextResponse.json(
      { error: "Internt serverfel" },
      { status: 500 }
    );
  }
}
