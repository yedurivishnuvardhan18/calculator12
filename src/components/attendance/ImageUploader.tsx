import { useCallback, useState, useRef } from "react";
import { Upload, Image, FileText, Loader2, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export type FileUploadResult =
  | { type: "image"; base64: string; mimeType: string }
  | { type: "text"; textContent: string };

interface ImageUploaderProps {
  label: string;
  description: string;
  onFileSelected: (result: FileUploadResult) => void;
  isLoading?: boolean;
  preview?: string | null;
  previewText?: string | null;
  onClear?: () => void;
}

const MAX_DIMENSION = 1024;
const JPEG_QUALITY = 0.6;
const MAX_BASE64_LENGTH = 1.5 * 1024 * 1024;

export const RETRY_MAX_DIMENSION = 800;
export const RETRY_JPEG_QUALITY = 0.4;

export function compressImageFromBase64(base64: string, maxDim: number, quality: number): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      const mimeType = "image/jpeg";
      const dataUrl = canvas.toDataURL(mimeType, quality);
      const b64 = dataUrl.split(",")[1];
      resolve({ base64: b64, mimeType });
    };
    img.onerror = () => reject(new Error("Could not re-compress image."));
    img.src = `data:image/jpeg;base64,${base64}`;
  });
}

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

function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read text file."));
    reader.readAsText(file);
  });
}

export function ImageUploader({ label, description, onFileSelected, isLoading, preview, previewText, onClear }: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    if (file.name.endsWith(".txt") || file.type === "text/plain") {
      try {
        const text = await readTextFile(file);
        if (!text.trim()) {
          toast({ title: "Empty file", description: "The text file appears to be empty.", variant: "destructive" });
          return;
        }
        onFileSelected({ type: "text", textContent: text });
      } catch (e: any) {
        toast({ title: "File error", description: e.message, variant: "destructive" });
      }
      return;
    }
    if (file.type.startsWith("image/")) {
      try {
        const result = await compressImage(file);
        onFileSelected({ type: "image", base64: result.base64, mimeType: result.mimeType });
      } catch (e: any) {
        toast({ title: "Image error", description: e.message, variant: "destructive" });
      }
      return;
    }
    toast({ title: "Unsupported file", description: "Please upload an image or .txt file.", variant: "destructive" });
  }, [onFileSelected]);

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

  // Show image preview
  if (preview) {
    return (
      <Card className="border-2 border-accent pop-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {isLoading ? <Loader2 className="w-4 h-4 text-primary animate-spin" /> : null}
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

  // Show text preview
  if (previewText) {
    return (
      <Card className="border-2 border-accent pop-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {isLoading ? <Loader2 className="w-4 h-4 text-primary animate-spin" /> : null}
              <FileText className="w-4 h-4 text-accent" />
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
          <pre className="text-xs text-muted-foreground bg-muted rounded-lg p-3 max-h-48 overflow-auto whitespace-pre-wrap">
            {previewText.slice(0, 500)}{previewText.length > 500 ? "..." : ""}
          </pre>
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
              <Image className="w-4 h-4 mr-1" /> Choose File
            </Button>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.txt,text/plain"
          className="hidden"
          onChange={handleChange}
        />
      </CardContent>
    </Card>
  );
}
