import { createFileRoute } from "@tanstack/react-router";
import { PromptStudio } from "@/components/prompt-studio";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <PromptStudio />;
}
