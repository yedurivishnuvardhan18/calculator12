import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { AttendanceScreenshotImport } from "./AttendanceScreenshotImport";
import { supabase } from "@/integrations/supabase/client";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke: vi.fn() } },
}));

const invoke = vi.mocked(supabase.functions.invoke);

beforeEach(() => {
  invoke.mockReset();
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: vi.fn(() => "blob:attendance-preview"),
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: vi.fn(),
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  Reflect.deleteProperty(URL, "createObjectURL");
  Reflect.deleteProperty(URL, "revokeObjectURL");
});

describe("AttendanceScreenshotImport", () => {
  it("analyzes an uploaded image and applies the extracted totals", async () => {
    const onApply = vi.fn();
    invoke.mockResolvedValue({ data: { attended: 42, total: 56 }, error: null } as never);
    render(<AttendanceScreenshotImport onApply={onApply} />);

    const file = new File(["screenshot"], "attendance.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Choose an attendance screenshot"), {
      target: { files: [file] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Analyze screenshot" }));

    expect(await screen.findByText(
      (_, element) => element?.tagName === "SPAN" && element.textContent?.includes("Found 42 present out of 56 classes") === true,
    )).toBeInTheDocument();
    expect(invoke).toHaveBeenCalledWith(
      "attendance-screenshot",
      expect.objectContaining({ body: expect.objectContaining({ image: expect.stringMatching(/^data:image\/png;base64,/) }) }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Use these totals" }));
    expect(onApply).toHaveBeenCalledWith({ attended: 42, total: 56 });
  });

  it("rejects unsupported image types", async () => {
    render(<AttendanceScreenshotImport onApply={vi.fn()} />);
    const file = new File(["not an image"], "notes.txt", { type: "text/plain" });

    fireEvent.change(screen.getByLabelText("Choose an attendance screenshot"), {
      target: { files: [file] },
    });

    expect(await screen.findByText("Choose a PNG, JPEG, or WebP image.")).toBeInTheDocument();
    expect(invoke).not.toHaveBeenCalled();
  });

  it("accepts a pasted screenshot", () => {
    render(<AttendanceScreenshotImport onApply={vi.fn()} />);
    const file = new File(["screenshot"], "pasted.png", { type: "image/png" });
    const uploadArea = screen.getByRole("group", {
      name: "Attendance screenshot upload area. Drop or paste an image here.",
    });

    fireEvent.paste(uploadArea, {
      clipboardData: {
        items: [{ kind: "file", type: "image/png", getAsFile: () => file }],
      },
    });

    expect(screen.getByAltText("Selected attendance screenshot preview")).toBeInTheDocument();
  });

  it("accepts a dropped screenshot", () => {
    render(<AttendanceScreenshotImport onApply={vi.fn()} />);
    const file = new File(["screenshot"], "dropped.png", { type: "image/png" });
    const uploadArea = screen.getByRole("group", {
      name: "Attendance screenshot upload area. Drop or paste an image here.",
    });

    fireEvent.drop(uploadArea, { dataTransfer: { files: [file] } });

    expect(screen.getByAltText("Selected attendance screenshot preview")).toBeInTheDocument();
  });

  it("does not apply invalid model counts", async () => {
    invoke.mockResolvedValue({ data: { attended: 57, total: 56 }, error: null } as never);
    render(<AttendanceScreenshotImport onApply={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Choose an attendance screenshot"), {
      target: { files: [new File(["screenshot"], "attendance.png", { type: "image/png" })] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Analyze screenshot" }));

    await waitFor(() => {
      expect(screen.getByText("The screenshot did not contain clear attendance totals. Try a sharper image.")).toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: "Use these totals" })).not.toBeInTheDocument();
  });

  it("shows the Edge Function error response instead of the generic status message", async () => {
    const response = new Response(
      JSON.stringify({ error: "Screenshot analysis is not configured yet." }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
    invoke.mockResolvedValue({
      data: null,
      error: new FunctionsHttpError(response),
    } as never);
    render(<AttendanceScreenshotImport onApply={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Choose an attendance screenshot"), {
      target: { files: [new File(["screenshot"], "attendance.png", { type: "image/png" })] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Analyze screenshot" }));

    expect(await screen.findByText("Screenshot analysis is not configured yet.")).toBeInTheDocument();
  });

  it("explains when the screenshot Edge Function is missing from the project", async () => {
    invoke.mockResolvedValue({
      data: null,
      error: new FunctionsHttpError(
        new Response(JSON.stringify({ code: "NOT_FOUND", message: "Requested function was not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    } as never);
    render(<AttendanceScreenshotImport onApply={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Choose an attendance screenshot"), {
      target: { files: [new File(["screenshot"], "attendance.png", { type: "image/png" })] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Analyze screenshot" }));

    expect(await screen.findByText(/not deployed to this Supabase project/)).toBeInTheDocument();
  });
});
