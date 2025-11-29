"use client";

import { IconCheck, IconCircle } from "@tabler/icons-react";
import { Progress } from "@/components/ui/progress";
import type { Report } from "@/lib/types/rapport";

interface ReportProgressProps {
  report: Report;
}

export function ReportProgress({ report }: ReportProgressProps) {
  const completedSections = report.sections.filter(
    (s) => s.status === "completed",
  ).length;
  const totalSections = report.sections.length;
  const sectionProgress =
    totalSections > 0 ? (completedSections / totalSections) * 100 : 0;

  const completedChecklist = report.checklist.filter((c) => c.completed).length;
  const requiredChecklist = report.checklist.filter((c) => c.required).length;
  const totalChecklist = report.checklist.length;
  const checklistProgress =
    totalChecklist > 0 ? (completedChecklist / totalChecklist) * 100 : 0;

  const allRequiredChecklistDone = report.checklist
    .filter((c) => c.required)
    .every((c) => c.completed);

  return (
    <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium">Sektioner</p>
          <p className="text-xs text-muted-foreground">
            {completedSections} / {totalSections} klara
          </p>
        </div>
        <Progress value={sectionProgress} className="h-2" />
      </div>

      {totalChecklist > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Checklista</p>
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">
                {completedChecklist} / {totalChecklist}
              </p>
              {requiredChecklist > 0 && (
                <span
                  className={`text-xs ${allRequiredChecklistDone ? "text-emerald-600" : "text-amber-600"}`}
                >
                  {allRequiredChecklistDone ? (
                    <span className="flex items-center gap-1">
                      <IconCheck className="size-3" />
                      Alla obligatoriska klara
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <IconCircle className="size-3" />
                      {requiredChecklist -
                        report.checklist.filter(
                          (c) => c.required && c.completed,
                        ).length}{" "}
                      obligatoriska kvar
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>
          <Progress value={checklistProgress} className="h-2" />
        </div>
      )}

      <div className="pt-2 border-t">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Övergripande status</span>
          <span
            className={`font-medium ${sectionProgress === 100 && checklistProgress === 100 ? "text-emerald-600" : "text-amber-600"}`}
          >
            {sectionProgress === 100 && checklistProgress === 100
              ? "Klar för export"
              : "Pågående"}
          </span>
        </div>
      </div>
    </div>
  );
}
