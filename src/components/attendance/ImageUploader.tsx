import { useCallback, useState, useRef } from "react";
import { Upload, Image, Loader2, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  label: string;
  description: string;
  onImageSelected: (base64: string) => void;
  isLoading?: boolean;
  preview?: string | null;
  onClear?: () => void;
}

export function ImageUploader({ label, description, onImageSelected, isLoading, preview, onClear }: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      onImageSelected(base64);
    };
    reader.readAsDataURL(file);
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
          <img src={`data:image/png;base64,${preview}`} alt={label} className="w-full rounded-lg max-h-48 object-contain bg-muted" />
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
