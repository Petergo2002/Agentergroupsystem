/**
 * LEGACY STUB - Document Designer
 *
 * This is a stub file to satisfy TypeScript compilation.
 * The actual component was moved or deprecated.
 */

"use client";

interface DocumentDesignerProps {
  template?: any;
  onTemplateChange?: (template: any) => void;
}

export function DocumentDesigner({
  template,
  onTemplateChange,
}: DocumentDesignerProps) {
  return (
    <div className="p-4 border border-dashed border-gray-300 rounded-lg">
      <p className="text-gray-500 text-center">Legacy Document Designer</p>
    </div>
  );
}

export default DocumentDesigner;
