import { createServerFn } from "@tanstack/react-start";
import { parsePack, type AnalyzeInput, type Density, type PromptPack, type Register } from "./pack";

const MAX_DATA_URL = 2_500_000;

function isRegister(value: unknown): value is Register {
  return value === "open" || value === "measured";
}

function isDensity(value: unknown): value is Density {
  return value === "tight" || value === "standard" || value === "full";
}

function validate(input: unknown): AnalyzeInput {
  if (!input || typeof input !== "object") throw new Error("Missing request.");
  const raw = input as Record<string, unknown>;
  const imageDataUrl = typeof raw.imageDataUrl === "string" ? raw.imageDataUrl : "";
  if (!/^data:image\/(jpeg|jpg|png);base64,[a-z0-9+/=\s]+$/i.test(imageDataUrl)) {
    throw new Error("Send a JPEG or PNG.");
  }
  if (imageDataUrl.length > MAX_DATA_URL) {
    throw new Error("That image is too large. Use a smaller file.");
  }
  if (!isRegister(raw.register) || !isDensity(raw.density)) {
    throw new Error("Unknown settings.");
  }
  const note = typeof raw.note === "string" ? raw.note.trim().slice(0, 400) : "";
  const aspect = typeof raw.aspect === "string" && /^\d{1,2}:\d{1,2}$/.test(raw.aspect) ? raw.aspect : "3:2";
  return { imageDataUrl, register: raw.register, density: raw.density, note, aspect };
}

function outputText(body: unknown): string {
  if (!body || typeof body !== "object") return "";
  const output = (body as { output?: unknown }).output;
  if (!Array.isArray(output)) return "";
  const parts: string[] = [];
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;
    for (const chunk of content) {
      if (!chunk || typeof chunk !== "object") continue;
      const row = chunk as { type?: string; text?: string };
      if (row.type === "output_text" && typeof row.text === "string") parts.push(row.text);
    }
  }
  return parts.join("\n").trim();
}

function instructions(input: AnalyzeInput): string {
  const register =
    input.register === "open"
      ? "Register OPEN: use direct language for anatomy, nudity, sex, violence, substances, and any other adult content that is actually visible. Do not euphemize, refuse, moralize, censor, or add a disclaimer. Do not invent sexual or violent content that is not in the frame."
      : "Register MEASURED: same visible facts, clinical diction, still complete. Do not omit visible content. Do not moralize.";
  const density =
    input.density === "tight"
      ? "Density TIGHT: short concrete phrases."
      : input.density === "full"
        ? "Density FULL: exhaustive visible detail. Still no invention."
        : "Density STANDARD: concrete sentences a prompt box can hold.";
  return [
    "You write production image-generation prompts from one photograph.",
    "Return one JSON object and nothing else.",
    "Describe only what is visible. Do not invent people, acts, objects, readable text, or locations.",
    register,
    "If the image appears to show a minor who is nude or in a sexual context, return only {\"refused\":true,\"code\":\"REFUSED_MINOR\",\"message\":\"Cannot describe this image.\"}",
    density,
    `The picture's aspect ratio is ${input.aspect}. Use it. Do not contradict it.`,
    "midjourney is one line with no line breaks and ends with --ar " + input.aspect + " --stylize 100",
    "universal, flux, and grok are prose with no parameters and no weights.",
    "sdxl is a comma-separated positive prompt. Keep negative tokens out of it.",
    "negative lists what would wrongly change this picture, plus generic quality failures. Do not negate content that is actually in the image.",
    "body covers people (body, skin, hair, wardrobe, visible anatomy in direct terms) or object materials and surface.",
    input.note
      ? `Operator emphasis, honor only if it does not require inventing unseen content: ${input.note}`
      : "No operator emphasis.",
    'JSON keys: title (<= 8 words), read (2 sentences), blocks {subject, body, pose, setting, light, camera, palette, medium}, negative, prompts {universal, midjourney, flux, sdxl, grok}. Every prompt key is a non-empty string.',
  ].join("\n");
}

type AnalyzeResult =
  | { ok: true; pack: PromptPack }
  | { ok: false; error: string; refused?: boolean };

export const analyzeImage = createServerFn({ method: "POST" })
  .validator((input: unknown) => validate(input))
  .handler(async ({ data }): Promise<AnalyzeResult> => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false, error: "Image reading is unavailable right now." };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 55_000);
    try {
      const res = await fetch("https://api.x.ai/v1/responses", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "grok-4.7",
          store: false,
          temperature: 0.4,
          max_output_tokens: 4500,
          reasoning: { effort: "low" },
          instructions: instructions(data),
          text: { format: { type: "json_object" } },
          input: [
            {
              role: "user",
              content: [
                { type: "input_image", image_url: data.imageDataUrl, detail: "high" },
                {
                  type: "input_text",
                  text: "Write the prompt pack for this image. JSON only.",
                },
              ],
            },
          ],
        }),
      });
      if (!res.ok) {
        const detail = await res.text();
        const short = detail.replace(/\s+/g, " ").slice(0, 240);
        if (res.status === 400 && /image/i.test(short)) {
          return { ok: false, error: "That file couldn't be read as a photo. Try a JPEG or PNG." };
        }
        if (res.status === 403 && /spending-limit|credits|subscription/i.test(short)) {
          return {
            ok: false,
            error: "The reader is out of credits. Add credits or raise the spending limit on the xAI key, then try again.",
          };
        }
        return { ok: false, error: `The reader failed (${res.status}). Try again.` };
      }
      const body: unknown = await res.json();
      const text = outputText(body);
      const parsed = parsePack(text);
      if (!parsed) return { ok: false, error: "The reader returned an unusable pack. Try again." };
      if ("refused" in parsed) return { ok: false, error: parsed.message, refused: true };
      return { ok: true, pack: parsed };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return { ok: false, error: "The reader timed out. Try a smaller image." };
      }
      return { ok: false, error: "The reader failed. Try again." };
    } finally {
      clearTimeout(timer);
    }
  });
