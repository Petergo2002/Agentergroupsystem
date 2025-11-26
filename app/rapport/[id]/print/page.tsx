"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { IconLoader2, IconPrinter, IconDownload } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { generatePdfHtml, type PdfViewMode } from "@/lib/rapport/pdfGenerator";
import { usePdfProfileStore } from "@/lib/pdf-profile-store";
import { fetchReportSections, fetchReportTemplates } from "@/lib/store";
import type { Report, ReportTemplate, ReportSectionDefinition } from "@/lib/types/rapport";

// Mock fetch report - i produktion hämtas detta från API/Supabase
async function fetchReport(id: string): Promise<Report | null> {
  // Försök hämta från localStorage (demo)
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(`rapport-${id}`);
    if (stored) {
      return JSON.parse(stored);
    }
  }
  return null;
}

export default function PrintReportPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const reportId = params.id as string;
  const viewMode = (searchParams.get("profile") || "customer") as PdfViewMode;

  const [report, setReport] = useState<Report | null>(null);
  const [template, setTemplate] = useState<ReportTemplate | null>(null);
  const [sections, setSections] = useState<ReportSectionDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile: pdfProfile, loadProfile } = usePdfProfileStore();

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        // Ladda rapport
        const reportData = await fetchReport(reportId);
        if (!reportData) {
          setError("Rapporten kunde inte hittas");
          setLoading(false);
          return;
        }
        setReport(reportData);

        // Ladda mallar och sektioner
        const [templates, sectionDefs] = await Promise.all([
          fetchReportTemplates(),
          fetchReportSections(),
        ]);

        if (reportData.templateId) {
          const tpl = templates.find((t) => t.id === reportData.templateId);
          setTemplate(tpl || null);
        }
        setSections(sectionDefs);
      } catch (err) {
        console.error("Failed to load report data", err);
        setError("Kunde inte ladda rapportdata");
      } finally {
        setLoading(false);
      }
    }

    if (reportId) {
      loadData();
    }
  }, [reportId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!report) return;

    // Generera HTML
    const html = generatePdfHtml({
      report,
      template,
      sectionDefinitions: sections,
      pdfProfile,
      viewMode,
    });

    // Skapa blob och ladda ner
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.title.replace(/[^a-zA-Z0-9åäöÅÄÖ\s-]/g, "")}_${new Date().toISOString().split("T")[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <IconLoader2 className="mx-auto size-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Laddar rapport...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">{error || "Rapporten kunde inte hittas"}</p>
          <Button variant="outline" className="mt-4" onClick={() => window.history.back()}>
            Gå tillbaka
          </Button>
        </div>
      </div>
    );
  }

  // Generera PDF HTML
  const pdfHtml = generatePdfHtml({
    report,
    template,
    sectionDefinitions: sections,
    pdfProfile,
    viewMode,
  });

  return (
    <>
      {/* Toolbar - döljs vid utskrift */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b p-4 print:hidden">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-semibold">{report.title}</h1>
            <p className="text-sm text-muted-foreground">
              {viewMode === "internal" ? "Intern rapport" : "Kundrapport"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownload}>
              <IconDownload className="mr-2 size-4" />
              Ladda ner HTML
            </Button>
            <Button onClick={handlePrint}>
              <IconPrinter className="mr-2 size-4" />
              Skriv ut / Spara PDF
            </Button>
          </div>
        </div>
      </div>

      {/* PDF Content */}
      <div className="pt-20 print:pt-0">
        <div
          className="print-content"
          dangerouslySetInnerHTML={{ __html: pdfHtml }}
        />
      </div>

      <style jsx global>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .print-content {
            margin: 0;
            padding: 0;
          }
        }
      `}</style>
    </>
  );
}
