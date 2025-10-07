import React from "react";
import ReactDOM from "react-dom/client";
import { HeroUIProvider } from "@heroui/react";

import App from "./App";
import { ThemeProvider } from "./contexts/ThemeContext";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <HeroUIProvider>
        <App />
      </HeroUIProvider>
    </ThemeProvider>
  </React.StrictMode>
);
