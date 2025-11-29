import { type NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ publicId: string }> },
) {
  try {
    const { publicId } = await params;
    const body = await request.json();
    const { approvedBy } = body;

    if (!approvedBy || typeof approvedBy !== "string") {
      return NextResponse.json(
        { error: "Namn krävs för godkännande" },
        { status: 400 },
      );
    }

    // Use service client for public endpoints - bypasses RLS for public_id lookup
    const supabase = createServiceClient();
    const now = new Date().toISOString();

    // Uppdatera rapport med godkännande
    const { data: reportData, error: updateError } = await supabase
      .from("reports")
      .update({
        customer_approved_at: now,
        customer_approved_by: approvedBy.trim(),
      })
      .eq("public_id", publicId)
      .select("*")
      .single();

    if (updateError || !reportData) {
      return NextResponse.json(
        { error: "Kunde inte godkänna rapport" },
        { status: 500 },
      );
    }

    const reportRow = reportData as any;

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

    return NextResponse.json({ report: mappedReport });
  } catch (error) {
    console.error("Error approving report:", error);
    return NextResponse.json({ error: "Internt serverfel" }, { status: 500 });
  }
}
