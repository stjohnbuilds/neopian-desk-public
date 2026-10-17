import { Component, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { getState } from "./persistence/store";
import { exportText } from "./core/bridge";
class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: string }
> {
  state = { error: "" };
  static getDerivedStateFromError(error: Error) {
    return { error: error.message };
  }
  render() {
    return this.state.error ? (
      <main>
        <h1>The screen could not load</h1>
        <p>Your saved data has not been cleared.</p>
        <pre>{this.state.error}</pre>
        <button
          onClick={() =>
            void exportText(
              JSON.stringify(getState(), null, 2),
              "neopian-desk-2-recovery.json",
            )
          }
        >
          Export recovery copy
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
