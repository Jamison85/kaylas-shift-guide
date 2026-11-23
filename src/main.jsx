import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
const preview = new URLSearchParams(window.location.search).get("till-preview") === "1";

if (preview) {
  document.title = "Hello? Is Somebody Up There? · Before the Rush";
  root.render(<p role="status" style={{ color: "white", padding: "1rem" }}>Opening Till’s office…</p>);
  import("./till-preview/TillPreview").then(({ default: TillPreview }) => {
    root.render(<React.StrictMode><TillPreview /></React.StrictMode>);
  }).catch(() => {
    root.render(<p style={{ color: "white", padding: "1rem" }}>The preview couldn’t load. <a style={{ color: "inherit" }} href="./">Open Before the Rush</a></p>);
  });
} else {
  root.render(<React.StrictMode><App /></React.StrictMode>);
}

if (!preview && "serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, {
        scope: import.meta.env.BASE_URL,
      });
    } catch (error) {
      console.warn("Before the Rush could not enable offline mode.", error);
    }
  });
}
