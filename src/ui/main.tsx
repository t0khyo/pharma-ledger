import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { DirectionProvider } from "@radix-ui/react-direction";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DirectionProvider dir="rtl">
      <App />
    </DirectionProvider>
  </StrictMode>
);
