"use client";

import { IconPhoto, IconTrash, IconUpload } from "@tabler/icons-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createSupabaseClient } from "@/lib/supabase";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  bucket?: string;
  maxSizeMB?: number;
  aspectRatio?: string;
  className?: string;
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  bucket = "images",
  maxSizeMB = 5,
  aspectRatio,
  className = "",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | undefined>(value);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validera filtyp
    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ];
    if (!validTypes.includes(file.type)) {
      toast.error("Ogiltig filtyp. Använd JPEG, PNG, GIF, WebP eller SVG.");
      return;
    }

    // Validera filstorlek
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`Filen är för stor. Max ${maxSizeMB}MB.`);
      return;
    }

    setUploading(true);

    try {
      const supabase = createSupabaseClient();

      // Skapa unikt filnamn
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Ladda upp till Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Upload error:", error);
        toast.error("Kunde inte ladda upp bilden");
        return;
      }

      // Hämta public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      setPreview(publicUrl);
      onChange(publicUrl);
      toast.success("Bild uppladdad!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Ett fel uppstod vid uppladdning");
    } finally {
      setUploading(false);
      // Återställ input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = async () => {
    if (!preview) return;

    try {
      // Extrahera filnamn från URL
      const url = new URL(preview);
      const pathParts = url.pathname.split("/");
      const fileName = pathParts[pathParts.length - 1];

      const supabase = createSupabaseClient();

      // Ta bort från storage
      const { error } = await supabase.storage.from(bucket).remove([fileName]);

      if (error) {
        console.error("Delete error:", error);
        // Fortsätt ändå med att ta bort från UI
      }

      setPreview(undefined);
      if (onRemove) {
        onRemove();
      } else {
        onChange("");
      }
      toast.success("Bild borttagen");
    } catch (error) {
      console.error("Remove error:", error);
      toast.error("Kunde inte ta bort bilden");
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {preview ? (
        <div className="relative">
          <div
            className="relative overflow-hidden rounded-lg border bg-gray-50"
            style={aspectRatio ? { aspectRatio } : {}}
          >
            <img
              src={preview}
              alt="Uppladdad bild"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="mt-2 flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex-1"
            >
              <IconUpload className="mr-2 h-4 w-4" />
              Byt bild
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemove}
              disabled={uploading}
            >
              <IconTrash className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 transition-colors hover:border-gray-400 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading ? (
            <>
              <div className="mb-3 h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-500" />
              <p className="text-sm text-gray-600">Laddar upp...</p>
            </>
          ) : (
            <>
              <IconPhoto className="mb-3 h-12 w-12 text-gray-400" />
              <p className="mb-1 text-sm font-medium text-gray-700">
                Klicka för att ladda upp bild
              </p>
              <p className="text-xs text-gray-500">
                JPEG, PNG, GIF, WebP eller SVG (max {maxSizeMB}MB)
              </p>
            </>
          )}
        </button>
      )}
    </div>
  );
}
