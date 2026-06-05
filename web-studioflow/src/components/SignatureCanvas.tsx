import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { Check, Eraser, Pen, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignatureCanvasProps {
  onSave: (dataUrl: string) => void;
  onClose: () => void;
  title?: string;
}

export default function SignatureCanvas({ onSave, onClose, title = "Sign here" }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  const getCanvasPoint = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      const touch = e.touches[0];
      if (!touch) return null;
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const point = getCanvasPoint(e);
    if (!point) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    setIsDrawing(true);
    lastPoint.current = point;
  }, [getCanvasPoint]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const point = getCanvasPoint(e);
    if (!point) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1a1423";
    ctx.beginPath();
    if (lastPoint.current) {
      ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    }
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    lastPoint.current = point;
    setHasSignature(true);
  }, [isDrawing, getCanvasPoint]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    lastPoint.current = null;
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  }, []);

  const handleSave = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!hasSignature) {
      toast.error("Please provide a signature first");
      return;
    }
    const dataUrl = canvas.toDataURL("image/png");
    onSave(dataUrl);
  }, [hasSignature, onSave]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border/70 bg-card shadow-2xl overflow-hidden animate-float-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-display text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Canvas */}
        <div className="p-6">
          <div className="rounded-xl border-2 border-dashed border-border/70 bg-background overflow-hidden">
            <canvas
              ref={canvasRef}
              width={600}
              height={200}
              className="w-full touch-none cursor-crosshair"
              style={{ aspectRatio: "3 / 1" }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground text-center">
            Draw your signature above using your mouse, finger, or stylus
          </p>

          {/* Actions */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <button
                onClick={clearCanvas}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              >
                <Eraser className="h-3.5 w-3.5" />
                Clear
              </button>
              <button
                onClick={clearCanvas}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
            </div>
            <button
              onClick={handleSave}
              disabled={!hasSignature}
              className="inline-flex items-center gap-2 rounded-full bg-rose px-5 py-2.5 text-sm font-semibold text-white shadow-lift transition hover:opacity-90 disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              Save Signature
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
