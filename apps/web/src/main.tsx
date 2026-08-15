import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./styles/app.css";
import "./styles/refresh.css";
import "./styles/seo.css";
import "./styles/evidence.css";
import "./styles/transit.css";
import "./styles/handoff.css";
import "./styles/sponsor.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);