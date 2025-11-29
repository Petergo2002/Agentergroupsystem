"use client";

import { IconPhoto, IconTrash, IconUpload, IconX } from "@tabler/icons-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ReportAsset } from "@/lib/types/rapport";

interface ImageGallerySectionProps {
  assets: ReportAsset[];
  onAssetsChange: (assets: ReportAsset[]) => void;
  maxImages?: number;
  readOnly?: boolean;
}

export function ImageGallerySection({
  assets,
  onAssetsChange,
  maxImages = 10,
  readOnly = false,
}: ImageGallerySectionProps) {
  const [uploading, setUploading] = useState(false);
  const inputId = `gallery-upload-${Math.random().toString(36).slice(2)}`;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxImages - assets.length;
    if (remainingSlots <= 0) {
      alert(`Max ${maxImages} bilder tillåtna`);
      return;
    }

    setUploading(true);

    try {
      const newAssets: ReportAsset[] = [];

      for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
        const file = files[i];
        if (!file) continue;

        // Här skulle du normalt ladda upp till Supabase Storage
        // För nu skapar vi en lokal URL
        const url = URL.createObjectURL(file);

        const asset: ReportAsset = {
          id: `asset-${Date.now()}-${i}`,
          label: file.name,
          url: url,
          capturedAt: new Date().toISOString(),
          capturedBy: "Användare", // Skulle komma från auth
          tags: [],
        };

        newAssets.push(asset);
      }

      onAssetsChange([...assets, ...newAssets]);
    } catch (error) {
      console.error("Failed to upload images", error);
      alert("Kunde inte ladda upp bilder");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAsset = (assetId: string) => {
    onAssetsChange(assets.filter((a) => a.id !== assetId));
  };

  const handleUpdateLabel = (assetId: string, newLabel: string) => {
    onAssetsChange(
      assets.map((a) => (a.id === assetId ? { ...a, label: newLabel } : a)),
    );
  };

  const handleAddTag = (assetId: string, tag: string) => {
    if (!tag.trim()) return;
    onAssetsChange(
      assets.map((a) =>
        a.id === assetId ? { ...a, tags: [...a.tags, tag.trim()] } : a,
      ),
    );
  };

  const handleRemoveTag = (assetId: string, tagIndex: number) => {
    onAssetsChange(
      assets.map((a) =>
        a.id === assetId
          ? { ...a, tags: a.tags.filter((_, i) => i !== tagIndex) }
          : a,
      ),
    );
  };

  return (
    <div className="space-y-4">
      {!readOnly && (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">
              Bilder ({assets.length}/{maxImages})
            </p>
            <p className="text-xs text-muted-foreground">
              Ladda upp flera bilder för denna sektion
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={uploading || assets.length >= maxImages}
            className="gap-2"
            onClick={() => document.getElementById(inputId)?.click()}
          >
            <IconUpload className="size-4" />
            {uploading ? "Laddar upp..." : "Ladda upp bilder"}
          </Button>
          <input
            id={inputId}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      )}

      {assets.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
          <div className="text-center">
            <IconPhoto className="mx-auto size-12 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              {readOnly
                ? "Inga bilder uppladdade"
                : "Inga bilder ännu. Klicka på 'Ladda upp bilder' för att börja."}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="group relative overflow-hidden rounded-lg border bg-muted/30"
            >
              <div className="aspect-video w-full overflow-hidden bg-muted">
                {asset.url ? (
                  <img
                    src={asset.url}
                    alt={asset.label}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <IconPhoto className="size-12 text-muted-foreground" />
                  </div>
                )}
              </div>

              {!readOnly && (
                <button
                  type="button"
                  onClick={() => handleRemoveAsset(asset.id)}
                  className="absolute right-2 top-2 rounded-full bg-destructive p-1.5 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <IconTrash className="size-4" />
                </button>
              )}

              <div className="space-y-2 p-3">
                {readOnly ? (
                  <p className="text-sm font-medium">{asset.label}</p>
                ) : (
                  <Input
                    value={asset.label}
                    onChange={(e) =>
                      handleUpdateLabel(asset.id, e.target.value)
                    }
                    placeholder="Bildtext..."
                    className="h-8 text-sm"
                  />
                )}

                <div className="flex flex-wrap gap-1">
                  {asset.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="gap-1 text-xs"
                    >
                      {tag}
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(asset.id, index)}
                          className="ml-1 hover:text-destructive"
                        >
                          <IconX className="size-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => {
                        const tag = prompt("Lägg till tagg:");
                        if (tag) handleAddTag(asset.id, tag);
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      + Lägg till tagg
                    </button>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  {new Date(asset.capturedAt).toLocaleDateString("sv-SE")}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
