"use client";

import { IconCheck } from "@tabler/icons-react";
import type { Report, ReportSectionDefinition } from "@/lib/types/rapport";

interface ReportViewProps {
  report: Report;
  sectionDefinitions?: ReportSectionDefinition[];
  readOnly?: boolean;
}

export function ReportView({ report, sectionDefinitions = [], readOnly = false }: ReportViewProps) {
  const getSectionDefinition = (sectionId: string) => {
    return sectionDefinitions.find((def) => def.id === sectionId);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 bg-white p-8 shadow-sm">
      {/* Header */}
      <div className="border-b pb-6">
        <h1 className="text-3xl font-bold text-gray-900">{report.title}</h1>
        <div className="mt-4 grid gap-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span className="font-medium">Klient:</span>
            <span>{report.metadata.client}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Plats:</span>
            <span>{report.metadata.location}</span>
          </div>
          {report.metadata.projectReference && (
            <div className="flex justify-between">
              <span className="font-medium">Projektreferens:</span>
              <span>{report.metadata.projectReference}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="font-medium">Status:</span>
            <span className="capitalize">{report.status}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Prioritet:</span>
            <span className="capitalize">{report.metadata.priority}</span>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-8">
        {report.sections.map((section) => {
          const definition = getSectionDefinition(section.id);
          const sectionType = definition?.type || "text";

          return (
            <div key={section.id} className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900">
                {section.title}
              </h2>
              
              {section.hint && (
                <p className="text-sm text-gray-500 italic">{section.hint}</p>
              )}

              {sectionType === "image" && definition?.imageUrl ? (
                <div className="rounded-lg border overflow-hidden">
                  <img
                    src={definition.imageUrl}
                    alt={definition.imageAltText || section.title}
                    className="w-full h-auto"
                  />
                  {definition.imageAltText && (
                    <p className="p-2 text-xs text-gray-500 bg-gray-50">
                      {definition.imageAltText}
                    </p>
                  )}
                </div>
              ) : (
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap text-gray-700">
                    {section.content || (
                      <span className="text-gray-400 italic">
                        Inget innehåll ännu
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Checklist */}
      {report.checklist && report.checklist.length > 0 && (
        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Checklista
          </h2>
          <div className="space-y-2">
            {report.checklist.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 rounded-lg border p-3"
              >
                <div
                  className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded ${
                    item.completed
                      ? "bg-green-500 text-white"
                      : "border-2 border-gray-300"
                  }`}
                >
                  {item.completed && <IconCheck className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <p
                    className={`text-sm ${
                      item.completed
                        ? "text-gray-500 line-through"
                        : "text-gray-900"
                    }`}
                  >
                    {item.label}
                    {item.required && (
                      <span className="ml-1 text-red-500">*</span>
                    )}
                  </p>
                  {item.notes && (
                    <p className="mt-1 text-xs text-gray-500">{item.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assets */}
      {report.assets && report.assets.length > 0 && (
        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Bilagor</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {report.assets.map((asset) => (
              <div
                key={asset.id}
                className="rounded-lg border overflow-hidden"
              >
                <img
                  src={asset.url}
                  alt={asset.label}
                  className="w-full h-48 object-cover"
                />
                <div className="p-3 bg-gray-50">
                  <p className="text-sm font-medium text-gray-900">
                    {asset.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(asset.capturedAt).toLocaleString("sv-SE")}
                  </p>
                  {asset.tags && asset.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {asset.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-block rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t pt-6 text-xs text-gray-500">
        <p>
          Senast uppdaterad:{" "}
          {new Date(report.updatedAt).toLocaleString("sv-SE")}
        </p>
      </div>
    </div>
  );
}
