/**
 * LEGACY STUB - PDF Structure Builder
 *
 * This is a stub file to satisfy TypeScript compilation.
 * The actual component was moved or deprecated.
 */

"use client";

interface PDFStructureBuilderProps {
  template?: any;
  onTemplateChange?: (template: any) => void;
}

export function PDFStructureBuilder({
  template,
  onTemplateChange,
}: PDFStructureBuilderProps) {
  return (
    <div className="p-4 border border-dashed border-gray-300 rounded-lg">
      <p className="text-gray-500 text-center">Legacy PDF Structure Builder</p>
    </div>
  );
}

export default PDFStructureBuilder;
