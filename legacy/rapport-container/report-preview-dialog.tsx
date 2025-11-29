/**
 * LEGACY STUB - Report Preview Dialog
 *
 * This is a stub file to satisfy TypeScript compilation.
 * The actual component was moved or deprecated.
 */

"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ReportPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewHtml?: string;
}

export function ReportPreviewDialog({
  open,
  onOpenChange,
  previewHtml,
}: ReportPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Förhandsvisning (Legacy)</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto">
          {previewHtml ? (
            <iframe
              srcDoc={previewHtml}
              className="w-full h-[70vh] border-0"
              title="Report Preview"
            />
          ) : (
            <p className="text-gray-500 text-center py-8">
              Ingen förhandsvisning tillgänglig
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ReportPreviewDialog;
