import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/themes.css";
import { installDevtoolsGuard } from "./lib/devtools-guard";

installDevtoolsGuard();

createRoot(document.getElementById("root")!).render(<App />);
