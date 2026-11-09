import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ALLOWED_ORIGINS = new Set(["https://calculator.teamdino.in"]);
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_REQUEST_BYTES = 6 * 1024 * 1024;
const MAX_REQUESTS_PER_MINUTE = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;
const rateLimit = new Map<string, number[]>();

function corsHeaders(origin: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin ?? "https://calculator.teamdino.in",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  headers: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return true;
  if (ALLOWED_ORIGINS.has(origin)) return true;
  try {
    const url = new URL(origin);
    return ["localhost", "127.0.0.1"].includes(url.hostname) &&
      ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (rateLimit.get(ip) ?? []).filter((time) => now - time < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= MAX_REQUESTS_PER_MINUTE) {
    rateLimit.set(ip, recent);
    return true;
  }
  recent.push(now);
  rateLimit.set(ip, recent);

  if (rateLimit.size > 1000) {
    for (const [key, timestamps] of rateLimit) {
      if (timestamps.every((time) => now - time >= RATE_LIMIT_WINDOW_MS)) rateLimit.delete(key);
    }
  }
  return false;
}

function parseCounts(content: unknown): { attended: number; total: number } | null {
  if (typeof content !== "string") return null;
  const normalized = content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  try {
    const result = JSON.parse(normalized);
    if (
      !Number.isSafeInteger(result?.attended) ||
      !Number.isSafeInteger(result?.total) ||
      result.attended < 0 ||
      result.total <= 0 ||
      result.attended > result.total
    ) return null;
    return { attended: result.attended, total: result.total };
  } catch {
    return null;
  }
}

serve(async (req) => {
  const origin = req.headers.get("Origin");
  const headers = corsHeaders(origin);

  if (!isAllowedOrigin(origin)) {
    return jsonResponse({ error: "Origin not allowed." }, 403, headers);
  }
  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405, headers);
  }

  const forwardedFor = req.headers.get("x-forwarded-for");
  const clientIp = forwardedFor?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(clientIp)) {
    return jsonResponse({ error: "Too many requests. Please wait a minute and try again." }, 429, headers);
  }

  try {
    const contentLength = Number(req.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
      return jsonResponse({ error: "The image must be 4 MB or smaller." }, 413, headers);
    }

    const requestBody = await req.text();
    if (new TextEncoder().encode(requestBody).length > MAX_REQUEST_BYTES) {
      return jsonResponse({ error: "The image must be 4 MB or smaller." }, 413, headers);
    }
    const body = JSON.parse(requestBody);
    if (typeof body?.image !== "string") {
      return jsonResponse({ error: "An image is required." }, 400, headers);
    }

    const match = body.image.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/);
    if (!match || !ALLOWED_IMAGE_TYPES.has(match[1])) {
      return jsonResponse({ error: "Upload a valid PNG, JPEG, or WebP image." }, 400, headers);
    }
    const paddingBytes = match[2].endsWith("==") ? 2 : match[2].endsWith("=") ? 1 : 0;
    if (Math.floor(match[2].length * 3 / 4) - paddingBytes > MAX_IMAGE_BYTES) {
      return jsonResponse({ error: "The image must be 4 MB or smaller." }, 413, headers);
    }

    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!apiKey) {
      console.error("OPENROUTER_API_KEY is not configured for attendance-screenshot");
      return jsonResponse({ error: "Screenshot analysis is not configured yet." }, 503, headers);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    let response: Response;
    try {
      response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://calculator.teamdino.in",
          "X-Title": "TeamDino Attendance Calculator",
        },
        body: JSON.stringify({
          model: Deno.env.get("OPENROUTER_MODEL") || "google/gemini-2.5-flash",
          temperature: 0,
          max_tokens: 200,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: "Extract class attendance counts from a student attendance screenshot. Return only a JSON object with integer fields attended and total. Sum the subject rows for classes attended/present and total classes conducted/held. Ignore percentages, absent counts, and summary or grand-total rows when subject rows are visible. If the image is not an attendance record or either count cannot be read clearly, return {\"attended\":null,\"total\":null}. Never guess.",
            },
            {
              role: "user",
              content: [
                { type: "text", text: "Read the total classes attended/present and the total classes conducted/held from this screenshot." },
                { type: "image_url", image_url: { url: body.image } },
              ],
            },
          ],
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      console.error("OpenRouter attendance request failed with status", response.status);
      if (response.status === 429) {
        return jsonResponse({ error: "AI rate limit reached. Please try again shortly." }, 429, headers);
      }
      if (response.status === 402) {
        return jsonResponse({ error: "AI service credits are unavailable right now." }, 503, headers);
      }
      return jsonResponse({ error: "AI could not analyze the screenshot. Please try again." }, 502, headers);
    }

    const result = await response.json();
    const counts = parseCounts(result?.choices?.[0]?.message?.content);
    if (!counts) {
      return jsonResponse(
        { error: "Could not read clear attendance totals. Try a sharper screenshot with subject rows visible." },
        422,
        headers,
      );
    }
    return jsonResponse(counts, 200, headers);
  } catch (error) {
    console.error("Attendance screenshot analysis failed", error);
    const timedOut = error instanceof DOMException && error.name === "AbortError";
    return jsonResponse(
      { error: timedOut ? "Screenshot analysis timed out. Please try again." : "Could not analyze the screenshot." },
      timedOut ? 504 : 500,
      headers,
    );
  }
});
