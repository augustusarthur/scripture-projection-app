import { ScriptureController } from "@/components/scripture/ScriptureController";

export const metadata = {
  title: "Scripture Projector",
  description: "Speak or type a reference to display scripture on the projection screen.",
};

export default function ScripturePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-100 to-stone-200 px-4 py-10">
      <ScriptureController />
    </div>
  );
}
