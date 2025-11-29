/**
 * LEGACY STUB - Image Gallery Section
 *
 * This is a stub file to satisfy TypeScript compilation.
 * The actual component was moved or deprecated.
 */

"use client";

import type { ReportAsset } from "@/lib/types/rapport";

interface ImageGallerySectionProps {
  images?: string[];
  assets?: ReportAsset[];
  onImagesChange?: (images: string[]) => void;
  onAssetsChange?: (assets: ReportAsset[]) => void;
  readOnly?: boolean;
}

export function ImageGallerySection({
  images = [],
  assets = [],
  onImagesChange,
  onAssetsChange,
  readOnly,
}: ImageGallerySectionProps) {
  const count = assets.length || images.length;
  return (
    <div className="p-4 border border-dashed border-gray-300 rounded-lg">
      <p className="text-gray-500 text-center">
        Legacy Image Gallery - {count} bilder
      </p>
    </div>
  );
}

export default ImageGallerySection;
