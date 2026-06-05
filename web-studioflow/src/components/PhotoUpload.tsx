import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhotoUploadProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  maxPhotos?: number;
  label?: string;
  compact?: boolean;
}

/**
 * Simple photo upload for alterations, notes, and cost management.
 * Works with local object URLs (demo mode) and Supabase Storage.
 */
export default function PhotoUpload({
  photos,
  onChange,
  maxPhotos = 4,
  label = "Photos",
  compact = false,
}: PhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAdd = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const remaining = maxPhotos - photos.length;
      if (remaining <= 0) return;

      const toAdd = Array.from(files).slice(0, remaining);
      const newUrls = toAdd.map((file) => URL.createObjectURL(file));
      onChange([...photos, ...newUrls]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [photos, maxPhotos, onChange],
  );

  const handleRemove = useCallback(
    (idx: number) => {
      onChange(photos.filter((_, i) => i !== idx));
    },
    [photos, onChange],
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold">{label}</span>
        {photos.length > 0 && (
          <span className="text-[10px] text-muted-foreground">
            {photos.length}/{maxPhotos}
          </span>
        )}
      </div>

      <div className={cn(
        "flex gap-2",
        compact ? "flex-row" : "flex-wrap",
      )}>
        {photos.map((url, idx) => (
          <div
            key={idx}
            className={cn(
              "group relative rounded-lg border border-border/70 overflow-hidden bg-secondary/30 shrink-0",
              compact ? "h-16 w-16" : "h-24 w-24",
            )}
          >
            <img
              src={url}
              alt={`Photo ${idx + 1}`}
              className="h-full w-full object-cover"
            />
            <button
              onClick={() => handleRemove(idx)}
              className="absolute top-1 right-1 grid h-5 w-5 place-items-center rounded-full bg-background/80 text-rose opacity-0 group-hover:opacity-100 transition hover:bg-rose hover:text-white"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {photos.length < maxPhotos && (
          <label
            className={cn(
              "grid place-items-center rounded-lg border-2 border-dashed border-border/70 bg-secondary/20 cursor-pointer transition hover:border-rose/50 hover:bg-rose/5 shrink-0",
              compact ? "h-16 w-16" : "h-24 w-24",
            )}
          >
            <Camera className="h-5 w-5 text-muted-foreground" />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAdd}
              className="hidden"
            />
          </label>
        )}
      </div>
    </div>
  );
}
