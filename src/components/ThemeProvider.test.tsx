import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { THEMES, ThemeProvider, useTheme } from "./ThemeProvider";

function createStorageMock(): Storage {
  const entries = new Map<string, string>();
  return {
    get length() {
      return entries.size;
    },
    clear: () => entries.clear(),
    getItem: (key) => entries.get(key) ?? null,
    key: (index) => Array.from(entries.keys())[index] ?? null,
    removeItem: (key) => entries.delete(key),
    setItem: (key, value) => entries.set(key, String(value)),
  };
}

function ThemeControls() {
  const { theme, preference, setTheme } = useTheme();
  return (
    <div>
      <output data-testid="active-theme">{theme}</output>
      <output data-testid="theme-preference">{preference}</output>
      {THEMES.map(({ id, name }) => (
        <button key={id} type="button" onClick={() => setTheme(id)}>
          {name}
        </button>
      ))}
      <button type="button" onClick={() => setTheme("system")}>System</button>
    </div>
  );
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: createStorageMock(),
    });
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    document.documentElement.classList.remove(...THEMES.map(({ id }) => `theme-${id}`), "dark");
    delete document.documentElement.dataset.theme;
  });

  it("restores and applies a saved theme", async () => {
    window.localStorage.setItem("gg_theme", "ocean-blue");
    render(
      <ThemeProvider>
        <ThemeControls />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("active-theme")).toHaveTextContent("ocean-blue");
    await waitFor(() => expect(document.documentElement).toHaveClass("theme-ocean-blue"));
    expect(window.localStorage.getItem("gg_theme")).toBe("ocean-blue");
  });

  it("supports all eight themes and persists changes immediately", async () => {
    render(
      <ThemeProvider>
        <ThemeControls />
      </ThemeProvider>,
    );

    expect(THEMES).toHaveLength(8);
    for (const { id, name } of THEMES) {
      fireEvent.click(screen.getByRole("button", { name }));
      expect(screen.getByTestId("active-theme")).toHaveTextContent(id);
      await waitFor(() => expect(window.localStorage.getItem("gg_theme")).toBe(id));
    }
  });

  it("defaults to Pure Light even when the system prefers dark mode", async () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });

    render(
      <ThemeProvider>
        <ThemeControls />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("active-theme")).toHaveTextContent("pure-light");
    expect(screen.getByTestId("theme-preference")).toHaveTextContent("pure-light");
    await waitFor(() => expect(window.localStorage.getItem("gg_theme")).toBe("pure-light"));
  });

  it("follows system color preference and stores the system selection", async () => {
    let onSystemChange: ((event: MediaQueryListEvent) => void) | undefined;
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn(() => ({
        matches: false,
        addEventListener: (_event: string, listener: (event: MediaQueryListEvent) => void) => {
          onSystemChange = listener;
        },
        removeEventListener: vi.fn(),
      })),
    });

    render(
      <ThemeProvider>
        <ThemeControls />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("active-theme")).toHaveTextContent("pure-light");
    fireEvent.click(screen.getByRole("button", { name: "System" }));
    await waitFor(() => expect(window.localStorage.getItem("gg_theme")).toBe("system"));

    act(() => onSystemChange?.({ matches: true } as MediaQueryListEvent));
    expect(screen.getByTestId("active-theme")).toHaveTextContent("midnight-dark");
    expect(screen.getByTestId("theme-preference")).toHaveTextContent("system");
  });

  it("migrates a previously saved theme to its closest replacement", async () => {
    window.localStorage.setItem("gg_theme", "cosmic-violet");
    render(
      <ThemeProvider>
        <ThemeControls />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("active-theme")).toHaveTextContent("lavender-dream");
    await waitFor(() => expect(window.localStorage.getItem("gg_theme")).toBe("lavender-dream"));
  });
});
