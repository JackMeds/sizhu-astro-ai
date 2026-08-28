import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { FeedbackToast } from "./components/FeedbackToast";
import { LocaleProvider } from "./lib/i18n";
import { WorkspaceProvider } from "./lib/workspace";
import "./styles/app.css";
import "./styles/refresh.css";
import "./styles/seo.css";
import "./styles/evidence.css";
import "./styles/transit.css";
import "./styles/handoff.css";
import "./styles/liuren-beta.css";
import "./styles/liuren-complete.css";
import "./styles/product-v3.css";
import "./styles/product-v3-fixes.css";
import "./styles/agent-access.css";
import "./styles/workspace.css";
import "./styles/ziwei-custom.css";
import "./styles/i18n.css";
import "./styles/workbench-redesign.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <LocaleProvider>
      <WorkspaceProvider>
        <App />
        <FeedbackToast />
      </WorkspaceProvider>
    </LocaleProvider>
  </React.StrictMode>
);
