import { createRoot } from "react-dom/client";
import { Component, type ReactNode } from "react";
import App from "./App";
import "./index.css";

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      const err = this.state.error as Error;
      return (
        <div style={{ padding: 32, fontFamily: "monospace", background: "#fff1f0", minHeight: "100vh" }}>
          <h2 style={{ color: "#cf1322" }}>앱 로딩 에러</h2>
          <pre style={{ color: "#cf1322", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
            {err.message}
          </pre>
          <pre style={{ color: "#555", fontSize: 12, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
            {err.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
