import { Suspense } from "react";
import { ScriptureProjector } from "@/components/scripture/ScriptureProjector";

export const metadata = {
  title: "Scripture Display",
  description: "Fullscreen scripture projection display.",
};

export default function ScriptureProjectPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-black text-white">
          Loading...
        </div>
      }
    >
      <ScriptureProjector />
    </Suspense>
  );
}
