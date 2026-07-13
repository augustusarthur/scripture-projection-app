import { Suspense } from "react";
import { ScriptureProjector } from "@/components/scripture/ScriptureProjector";
import "../scripture.css";

export const metadata = {
  title: "Scripture Projection — Screen",
  description: "Fullscreen scripture projection display.",
};

export default function ScriptureProjectPage() {
  return (
    <Suspense
      fallback={
        <div className="projectionWrap" style={{ minHeight: "100vh" }}>
          <p className="idle mono">Loading...</p>
        </div>
      }
    >
      <ScriptureProjector />
    </Suspense>
  );
}
