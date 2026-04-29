import { Buffer } from "buffer";
import { EmotionThemeProvider } from "@notesnook/theme";
import { createRoot } from "react-dom/client";
import "./styles.css";

globalThis.Buffer ??= Buffer;

void import("./App").then(({ App }) => {
  createRoot(document.getElementById("root")!).render(
    <EmotionThemeProvider scope="base">
      <App />
    </EmotionThemeProvider>
  );
});
