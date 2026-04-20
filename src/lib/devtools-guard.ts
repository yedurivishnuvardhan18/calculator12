// ─── DevTools Deterrent ───
// Lightweight client-side discouragement only. NOT real security.
// Real security lives in RLS, edge function auth, and input validation.

let installed = false;

export function installDevtoolsGuard() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  // Skip in dev so the developer experience isn't broken.
  if (import.meta.env.DEV) return;

  const block = (e: Event) => e.preventDefault();

  // Right-click
  document.addEventListener("contextmenu", block);

  // Common inspect shortcuts
  document.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if (k === "f12") return block(e);
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && ["i", "j", "c"].includes(k)) return block(e);
    if ((e.ctrlKey || e.metaKey) && k === "u") return block(e);
    if ((e.ctrlKey || e.metaKey) && k === "s") return block(e);
  });

  // Window-size based DevTools detection (heuristic)
  const THRESHOLD = 160;
  let warned = false;
  const check = () => {
    const widthGap = window.outerWidth - window.innerWidth > THRESHOLD;
    const heightGap = window.outerHeight - window.innerHeight > THRESHOLD;
    if ((widthGap || heightGap) && !warned) {
      warned = true;
      // Soft pause: dim the app and show notice. Avoid hard redirect that
      // would punish legitimate users with side panels (translate, etc.).
      const overlay = document.createElement("div");
      overlay.setAttribute(
        "style",
        [
          "position:fixed",
          "inset:0",
          "z-index:2147483647",
          "background:hsl(var(--background, 240 10% 4%))",
          "color:hsl(var(--foreground, 0 0% 98%))",
          "display:flex",
          "align-items:center",
          "justify-content:center",
          "text-align:center",
          "padding:24px",
          "font-family:system-ui,sans-serif",
          "font-size:16px",
        ].join(";")
      );
      overlay.id = "__devtools_overlay";
      const msg = document.createElement("div");
      msg.textContent = "Developer tools detected. Please close them to continue using GradeGuru.";
      overlay.appendChild(msg);
      document.body.appendChild(overlay);
    } else if (!widthGap && !heightGap && warned) {
      warned = false;
      document.getElementById("__devtools_overlay")?.remove();
    }
  };
  setInterval(check, 1000);
}
