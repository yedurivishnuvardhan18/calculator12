import { useCallback, useState, useRef } from "react";
import { Upload, Image, Loader2, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface ImageUploaderProps {
  label: string;
  description: string;
  onImageSelected: (image: { base64: string; mimeType: string }) => void;
  isLoading?: boolean;
  preview?: string | null;
  onClear?: () => void;
}

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.8;
const MAX_BASE64_LENGTH = 4 * 1024 * 1024; // ~3MB decoded

function compressImage(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const scale = MAX_DIMENSION / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      const mimeType = "image/jpeg";
      const dataUrl = canvas.toDataURL(mimeType, JPEG_QUALITY);
      const base64 = dataUrl.split(",")[1];
      if (base64.length > MAX_BASE64_LENGTH) {
        reject(new Error("Image is still too large after compression. Please use a smaller or cropped image."));
        return;
      }
      resolve({ base64, mimeType });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image file."));
    };
    img.src = url;
  });
}

export function ImageUploader({ label, description, onImageSelected, isLoading, preview, onClear }: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    try {
      const result = await compressImage(file);
      onImageSelected(result);
    } catch (e: any) {
      toast({ title: "Image error", description: e.message, variant: "destructive" });
    }
  }, [onImageSelected]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  if (preview) {
    return (
      <Card className="border-2 border-accent pop-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {isLoading ? (
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
              ) : null}
              <span className="font-display font-semibold text-sm text-accent">
                {isLoading ? "Extracting data..." : `${label} ✓`}
              </span>
            </div>
            {onClear && !isLoading && (
              <Button variant="ghost" size="icon" onClick={onClear} className="h-7 w-7">
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          <img src={`data:image/jpeg;base64,${preview}`} alt={label} className="w-full rounded-lg max-h-48 object-contain bg-muted" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "border-2 border-dashed transition-all cursor-pointer hover-lift",
        dragActive ? "border-primary bg-primary/5" : "border-border",
        isLoading && "pointer-events-none opacity-70"
      )}
      onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <CardContent className="flex flex-col items-center justify-center gap-3 p-8 text-center">
        {isLoading ? (
          <>
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="font-display font-semibold text-sm">Extracting data with AI...</p>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Upload className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="font-display font-semibold text-sm">{label}</p>
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            </div>
            <Button variant="outline" size="sm" className="mt-1">
              <Image className="w-4 h-4 mr-1" /> Choose Image
            </Button>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleChange}
        />
      </CardContent>
    </Card>
  );
}
