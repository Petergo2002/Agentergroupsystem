/**
 * LEGACY STUB - Image Annotation Canvas
 *
 * This is a stub file to satisfy TypeScript compilation.
 * The actual component was moved or deprecated.
 */

"use client";

import type { AnnotationShape } from "@/lib/types/rapport";

interface ImageAnnotationCanvasProps {
  imageUrl?: string;
  annotations?: any[];
  shapes?: AnnotationShape[];
  onAnnotationsChange?: (annotations: any[]) => void;
  onChange?: (shapes: AnnotationShape[]) => void;
  readOnly?: boolean;
}

export function ImageAnnotationCanvas({
  imageUrl,
  annotations = [],
  shapes = [],
  onAnnotationsChange,
  onChange,
  readOnly,
}: ImageAnnotationCanvasProps) {
  return (
    <div className="p-4 border border-dashed border-gray-300 rounded-lg">
      <p className="text-gray-500 text-center">
        Legacy Image Annotation Canvas
      </p>
      {imageUrl && (
        <img
          src={imageUrl}
          alt="Annotation"
          className="max-w-full h-auto mt-2"
        />
      )}
    </div>
  );
}

export default ImageAnnotationCanvas;
