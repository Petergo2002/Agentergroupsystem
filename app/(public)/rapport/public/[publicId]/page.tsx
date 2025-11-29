"use client";

import { IconAlertCircle, IconCheck, IconLoader2 } from "@tabler/icons-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generatePdfHtml } from "@/lib/rapport/pdfGenerator";
import type { Report, ReportTemplate } from "@/lib/types/rapport";

export default function PublicReportPage() {
  const params = useParams();
  const publicId = params.publicId as string;

  const [report, setReport] = useState<Report | null>(null);
  const [template, setTemplate] = useState<ReportTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [approvalName, setApprovalName] = useState("");

  useEffect(() => {
    const loadPublicReport = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/reports/public/${publicId}`);

        if (!response.ok) {
          throw new Error("Rapport hittades inte");
        }

        const data = await response.json();
        setReport(data.report);
        setTemplate(data.template);
      } catch (err) {
        console.error("Failed to load public report", err);
        setError(
          err instanceof Error ? err.message : "Kunde inte ladda rapport",
        );
      } finally {
        setLoading(false);
      }
    };

    if (publicId) {
      loadPublicReport();
    }
  }, [publicId]);

  const handleApprove = async () => {
    if (!approvalName.trim()) {
      toast.error("Ange ditt namn för att godkänna");
      return;
    }

    try {
      setApproving(true);
      const response = await fetch(`/api/reports/public/${publicId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvedBy: approvalName.trim() }),
      });

      if (!response.ok) {
        throw new Error("Kunde inte godkänna rapport");
      }

      const data = await response.json();
      setReport(data.report);
      toast.success("Rapport godkänd!");
    } catch (err) {
      console.error("Failed to approve report", err);
      toast.error("Kunde inte godkänna rapport");
    } finally {
      setApproving(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!report) return;

    const html = generatePdfHtml({ report, template });
    const win = window.open("", "_blank");
    if (!win) {
      toast.error("Kunde inte öppna PDF-fönster");
      return;
    }
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex flex-col items-center gap-3">
          <IconLoader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Laddar rapport...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <IconAlertCircle className="size-5" />
              Rapport hittades inte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {error || "Denna rapport finns inte eller har tagits bort."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isApproved = !!report.customerApprovedAt;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{report.title}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {report.metadata.client} · {report.metadata.location}
                </p>
              </div>
              {isApproved && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-emerald-700">
                  <IconCheck className="size-4" />
                  <span className="text-sm font-medium">Godkänd</span>
                </div>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Rapportinformation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Kund</p>
                <p className="font-medium">{report.metadata.client}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Plats</p>
                <p className="font-medium">{report.metadata.location}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Projektreferens</p>
                <p className="font-medium">
                  {report.metadata.projectReference || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Datum</p>
                <p className="font-medium">
                  {new Date(report.updatedAt).toLocaleDateString("sv-SE")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sektioner */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Innehåll</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {report.sections.map((section) => (
              <div key={section.id} className="space-y-2">
                <h3 className="font-semibold">{section.title}</h3>
                {section.hint && (
                  <p className="text-xs text-muted-foreground italic">
                    {section.hint}
                  </p>
                )}
                <p className="whitespace-pre-wrap text-sm">
                  {section.content || "Ej ifyllt"}
                </p>
                {section.assetIds && section.assetIds.length > 0 && (
                  <div className="grid gap-4 md:grid-cols-2 mt-4">
                    {section.assetIds.map((assetId) => {
                      const asset = report.assets.find((a) => a.id === assetId);
                      return asset ? (
                        <img
                          key={assetId}
                          src={asset.url}
                          alt={asset.label}
                          className="rounded-lg border"
                        />
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Godkännande */}
        {!isApproved ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Godkänn rapport</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Genom att godkänna denna rapport bekräftar du att du har
                granskat innehållet.
              </p>
              <div className="grid gap-2">
                <Label htmlFor="approval-name">Ditt namn</Label>
                <Input
                  id="approval-name"
                  placeholder="För- och efternamn"
                  value={approvalName}
                  onChange={(e) => setApprovalName(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleApprove}
                  disabled={approving || !approvalName.trim()}
                  className="flex-1"
                >
                  {approving ? (
                    <>
                      <IconLoader2 className="mr-2 size-4 animate-spin" />
                      Godkänner...
                    </>
                  ) : (
                    <>
                      <IconCheck className="mr-2 size-4" />
                      Godkänn rapport
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleDownloadPDF}>
                  Ladda ner PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <IconCheck className="size-5 text-emerald-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-emerald-900">
                    Rapporten godkändes av {report.customerApprovedBy}
                  </p>
                  <p className="text-sm text-emerald-700 mt-1">
                    {new Date(report.customerApprovedAt!).toLocaleString(
                      "sv-SE",
                    )}
                  </p>
                </div>
                <Button variant="outline" onClick={handleDownloadPDF}>
                  Ladda ner PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
