import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { FeedbackToast } from "./components/FeedbackToast";
import "./styles/app.css";
import "./styles/refresh.css";
import "./styles/seo.css";
import "./styles/evidence.css";
import "./styles/transit.css";
import "./styles/handoff.css";
import "./styles/sponsor.css";
import "./styles/liuren-beta.css";
import "./styles/liuren-complete.css";
import "./styles/product-v3.css";
import "./styles/product-v3-fixes.css";
import "./styles/agent-access.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
    <FeedbackToast />
  </React.StrictMode>
);
