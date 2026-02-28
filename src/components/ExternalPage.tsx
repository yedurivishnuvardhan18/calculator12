import { useState } from "react";
import { Loader2 } from "lucide-react";

interface ExternalPageProps {
  url: string;
}

export function ExternalPage({ url }: ExternalPageProps) {
  const [loading, setLoading] = useState(true);

  return (
    <div className="relative w-full" style={{ height: "calc(100dvh - 3.5rem - 4rem)" }}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      )}
      <iframe
        src={url}
        className="w-full h-full border-0"
        title="External content"
        allow="payment"
        onLoad={() => setLoading(false)}
      />
    </div>
  );
}
