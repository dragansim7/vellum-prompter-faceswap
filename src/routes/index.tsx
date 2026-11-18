import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PromptStudio } from "@/components/prompt-studio";
import { FaceLab } from "@/components/face-lab";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [mode, setMode] = useState<"prompt" | "face">("prompt");
  return (
    <div>
      <div className="mx-auto flex max-w-6xl justify-end gap-2 px-4 pt-4 sm:px-6">
        <button
          type="button"
          onClick={() => setMode("prompt")}
          className={"min-h-10 rounded-full px-4 text-sm font-medium " + (mode === "prompt" ? "bg-brass text-brass-ink" : "bg-surface-2 text-fg")}
        >
          Prompt
        </button>
        <button
          type="button"
          onClick={() => setMode("face")}
          className={"min-h-10 rounded-full px-4 text-sm font-medium " + (mode === "face" ? "bg-brass text-brass-ink" : "bg-surface-2 text-fg")}
        >
          Face Lab
        </button>
      </div>
      {mode === "prompt" ? <PromptStudio /> : <FaceLab />}
    </div>
  );
}