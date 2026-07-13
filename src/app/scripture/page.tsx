import { ScriptureListener } from "@/components/scripture/ScriptureListener";
import "./scripture.css";

export const metadata = {
  title: "Scripture Projection",
  description: "Listen for scripture references and project them on screen.",
};

export default function ScripturePage() {
  return (
    <div className="listenPage min-h-screen">
      <ScriptureListener />
    </div>
  );
}
