import { useEffect, useRef, useState } from "react";
import { Check, ClipboardPaste, ImageUp, LoaderCircle, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const MAX_IMAGE_SIZE = 4 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface AttendanceCounts {
  attended: number;
  total: number;
}

interface AttendanceScreenshotImportProps {
  onApply: (counts: AttendanceCounts) => void;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not read the selected image."));
    };
    reader.onerror = () => reject(new Error("Could not read the selected image."));
    reader.readAsDataURL(file);
  });
}

function validateImage(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return "Choose a PNG, JPEG, or WebP image.";
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return "The image must be 4 MB or smaller.";
  }
  return null;
}

async function getAnalysisErrorMessage(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError && error.context instanceof Response) {
    const response = error.context;
    try {
      const body: unknown = await response.clone().json();
      if (
        typeof body === "object" &&
        body !== null &&
        "error" in body &&
        typeof body.error === "string"
      ) {
        return body.error;
      }
      if (response.status === 404) {
        return "The attendance screenshot function is not deployed to this Supabase project. Deploy attendance-screenshot and verify the project's VITE_SUPABASE_URL.";
      }
    } catch {
      return `Screenshot analysis failed (HTTP ${response.status}). Please try again.`;
    }
    return `Screenshot analysis failed (HTTP ${response.status}). Please try again.`;
  }
  return error instanceof Error ? error.message : "Could not analyze the screenshot. Please try again.";
}

export function AttendanceScreenshotImport({ onApply }: AttendanceScreenshotImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<{ file: File; previewUrl: string } | null>(null);
  const [counts, setCounts] = useState<AttendanceCounts | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => () => {
    if (image) URL.revokeObjectURL(image.previewUrl);
  }, [image]);

  const selectImage = (file: File) => {
    const validationError = validateImage(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setImage({ file, previewUrl: URL.createObjectURL(file) });
    setCounts(null);
    setError("");
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const imageItem = Array.from(event.clipboardData.items).find(
      (item) => item.kind === "file" && item.type.startsWith("image/"),
    );
    const file = imageItem?.getAsFile();
    if (!file) return;
    event.preventDefault();
    selectImage(file);
  };

  const analyzeImage = async () => {
    if (!image) return;
    setLoading(true);
    setCounts(null);
    setError("");

    try {
      const imageData = await readAsDataUrl(image.file);
      const { data, error: invokeError } = await supabase.functions.invoke("attendance-screenshot", {
        body: { image: imageData },
      });

      if (invokeError) throw invokeError;
      if (
        !Number.isSafeInteger(data?.attended) ||
        !Number.isSafeInteger(data?.total) ||
        data.attended < 0 ||
        data.total <= 0 ||
        data.attended > data.total
      ) {
        throw new Error("The screenshot did not contain clear attendance totals. Try a sharper image.");
      }

      setCounts({ attended: data.attended, total: data.total });
    } catch (analysisError) {
      console.error("Attendance screenshot analysis failed", analysisError);
      setError(await getAnalysisErrorMessage(analysisError));
    } finally {
      setLoading(false);
    }
  };

  const clearImage = () => {
    setImage(null);
    setCounts(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Card className="border-primary/30 bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg text-card-foreground">
          <Sparkles className="h-5 w-5 text-primary" />
          Import from screenshot
        </CardTitle>
        <CardDescription>
          Let AI add up the present and total classes shown in your attendance screenshot.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          tabIndex={0}
          role="group"
          aria-label="Attendance screenshot upload area. Drop or paste an image here."
          onPaste={handlePaste}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            const file = Array.from(event.dataTransfer.files).find((item) => item.type.startsWith("image/"));
            if (file) selectImage(file);
            else setError("Drop an image file to continue.");
          }}
          className={`rounded-xl border-2 border-dashed p-5 text-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
            dragging ? "border-primary bg-primary/10" : "border-border bg-muted/30"
          }`}
        >
          {image ? (
            <div className="flex flex-col items-center gap-3">
              <img
                src={image.previewUrl}
                alt="Selected attendance screenshot preview"
                className="max-h-56 max-w-full rounded-lg border border-border object-contain"
              />
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button type="button" onClick={analyzeImage} disabled={loading}>
                  {loading ? (
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  {loading ? "Analyzing..." : "Analyze screenshot"}
                </Button>
                <Button type="button" variant="outline" onClick={clearImage} disabled={loading}>
                  <X className="mr-2 h-4 w-4" />
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <ImageUp className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm font-medium text-foreground">
                Drop an image here, or focus this area and paste a screenshot
              </p>
              <p className="text-xs text-muted-foreground">PNG, JPEG, or WebP · up to 4 MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                aria-label="Choose an attendance screenshot"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) selectImage(file);
                }}
              />
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                <ImageUp className="mr-2 h-4 w-4" />
                Choose image
              </Button>
              <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <ClipboardPaste className="h-3.5 w-3.5" />
                You can also paste while this area is focused
              </p>
            </div>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {counts && (
          <Alert className="border-primary/30 bg-primary/5">
            <Check className="h-4 w-4 text-primary" />
            <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
              <span>
                Found <strong>{counts.attended}</strong> present out of <strong>{counts.total}</strong> classes.
                Review the result before applying.
              </span>
              <Button type="button" size="sm" onClick={() => onApply(counts)}>
                Use these totals
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <p className="text-xs text-muted-foreground">
          Your image is sent to the AI service for analysis. Avoid uploading screenshots with information you do not want processed.
        </p>
      </CardContent>
    </Card>
  );
}
