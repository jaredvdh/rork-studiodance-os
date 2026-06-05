import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, ImagePlus, Trash2, Upload, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface CostumeImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  bucket?: string;
  storagePath?: string;
}

export default function CostumeImageUpload({
  images,
  onChange,
  maxImages = 5,
  bucket = "costume-images",
  storagePath = "costumes",
}: CostumeImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const remaining = maxImages - images.length;
      if (remaining <= 0) {
        toast.error(`Maximum ${maxImages} images allowed`);
        return;
      }

      const toUpload = Array.from(files).slice(0, remaining);
      setUploading(true);

      try {
        const newUrls: string[] = [];
        for (const file of toUpload) {
          if (!file.type.startsWith("image/")) {
            toast.error(`${file.name} is not an image`);
            continue;
          }
          if (file.size > 5 * 1024 * 1024) {
            toast.error(`${file.name} is too large (max 5MB)`);
            continue;
          }

          const fileExt = file.name.split(".").pop() ?? "jpg";
          const fileName = `${storagePath}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${fileExt}`;

          try {
            const { data, error } = await supabase.storage
              .from(bucket)
              .upload(fileName, file, { upsert: true });

            if (error) {
              // Supabase upload failed — use local object URL for demo
              const localUrl = URL.createObjectURL(file);
              newUrls.push(localUrl);
            } else if (data) {
              const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
              newUrls.push(urlData.publicUrl);
            }
          } catch {
            // Fallback: create local object URL
            const localUrl = URL.createObjectURL(file);
            newUrls.push(localUrl);
          }
        }

        onChange([...images, ...newUrls]);
        toast.success(`${newUrls.length} image${newUrls.length !== 1 ? "s" : ""} added`);
      } catch {
        toast.error("Failed to upload images");
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [images, maxImages, onChange, bucket, storagePath],
  );

  const handleRemove = useCallback(
    (index: number) => {
      const updated = images.filter((_, i) => i !== index);
      onChange(updated);
    },
    [images, onChange],
  );

  const handleAddUrl = useCallback(() => {
    const url = prompt("Enter image URL:");
    if (url && url.trim()) {
      onChange([...images, url.trim()]);
    }
  }, [images, onChange]);

  return (
    <div className="space-y-3">
      {/* Current images grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {images.map((url, idx) => (
            <div
              key={idx}
              className="group relative aspect-square rounded-xl border border-border/70 overflow-hidden bg-secondary/30"
            >
              <img
                src={url}
                alt={`Costume image ${idx + 1}`}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect fill='%23f0eae5' width='100' height='100'/><text x='50' y='55' text-anchor='middle' fill='%23c4b5a5' font-size='12'>No Image</text></svg>";
                }}
              />
              <button
                onClick={() => handleRemove(idx)}
                className="absolute top-2 right-2 grid h-7 w-7 place-items-center rounded-full bg-background/80 text-rose opacity-0 group-hover:opacity-100 transition hover:bg-rose hover:text-white backdrop-blur-sm"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <span className="absolute bottom-2 left-2 rounded bg-background/80 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground backdrop-blur-sm">
                {idx + 1}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Upload actions */}
      {images.length < maxImages && (
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground cursor-pointer">
            <Upload className={cn("h-4 w-4", uploading && "animate-pulse")} />
            {uploading ? "Uploading..." : "Upload Images"}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
          <button
            onClick={handleAddUrl}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          >
            <ImagePlus className="h-4 w-4" />
            Add URL
          </button>
          <span className="text-xs text-muted-foreground">
            {images.length}/{maxImages}
          </span>
        </div>
      )}

      {images.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Add up to {maxImages} images of the costume.
        </p>
      )}
    </div>
  );
}
