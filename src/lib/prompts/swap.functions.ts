import { createServerFn } from "@tanstack/react-start";

const MAX_DATA_URL = 1_200_000;
const DATA_URL = /^data:image\/(jpeg|jpg|png|webp);base64,[a-z0-9+/=\s]+$/i;

type SwapInput = {
  targetDataUrl: string;
  sourceDataUrl: string;
};

type SwapResult = { ok: true; imageUrl: string } | { ok: false; error: string };

function validate(input: unknown): SwapInput {
  if (!input || typeof input !== "object") throw new Error("Missing request.");
  const raw = input as Record<string, unknown>;
  const targetDataUrl = typeof raw.targetDataUrl === "string" ? raw.targetDataUrl : "";
  const sourceDataUrl = typeof raw.sourceDataUrl === "string" ? raw.sourceDataUrl : "";
  if (!DATA_URL.test(targetDataUrl) || !DATA_URL.test(sourceDataUrl)) {
    throw new Error("Send a JPEG, PNG, or WebP for both frames.");
  }
  if (targetDataUrl.length > MAX_DATA_URL || sourceDataUrl.length > MAX_DATA_URL) {
    throw new Error("Those photos are too large. Use a smaller crop.");
  }
  return { targetDataUrl, sourceDataUrl };
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

function imageUrlFrom(body: unknown): string {
  if (!body || typeof body !== "object") return "";
  const data = (body as { data?: unknown }).data;
  if (!Array.isArray(data) || !data[0] || typeof data[0] !== "object") return "";
  const url = (data[0] as { url?: unknown }).url;
  return typeof url === "string" ? url : "";
}

function editorError(status: number, detail: string): string {
  let message = detail;
  try {
    const parsed = JSON.parse(detail) as { error?: unknown; message?: unknown };
    const err = parsed.error;
    if (typeof err === "string") message = err;
    else if (err && typeof err === "object" && typeof (err as { message?: string }).message === "string") {
      message = (err as { message: string }).message;
    } else if (typeof parsed.message === "string") message = parsed.message;
  } catch {
    /* keep the raw body */
  }
  const short = message.replace(/\s+/g, " ").slice(0, 180);
  if (status === 403 && /spending-limit|credits|subscription/i.test(short)) {
    return "The editor is out of credits. Add credits or raise the spending limit, then try again.";
  }
  if (/minor|child|underage|under 18/i.test(short)) {
    return "A minor is in one of these photos. Face Lab only runs on adults.";
  }
  if (/safety|policy|refus|moderat|blocked|violat|disallow/i.test(short)) {
    return "The editor refused this pair. It will not alter some photos.";
  }
  if (/invalid image|unsupported|format|decode/i.test(short)) {
    return "That file couldn't be used. Try a different JPEG or PNG.";
  }
  if (/too large|too big|payload|entity/i.test(short)) {
    return "Those photos are too large. Use a smaller crop.";
  }
  return short || `The editor failed (${status}). Try again.`;
}

async function pairHasMinor(
  apiKey: string,
  targetDataUrl: string,
  sourceDataUrl: string,
  signal: AbortSignal,
): Promise<boolean | null> {
  const res = await fetch("https://api.x.ai/v1/responses", {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-4.7",
      store: false,
      temperature: 0,
      max_output_tokens: 80,
      reasoning: { effort: "low" },
      text: { format: { type: "json_object" } },
      instructions: [
        "Age gate for a face swap of adults. Look at both photos.",
        "Return JSON only: {\"minor\":true} or {\"minor\":false}.",
        "Set minor to true only when a person is clearly a child.",
        "Set minor to false for adults, including young adults, whether or not the photo is sexual.",
        "Nudity, lingerie, or sexual content is not a reason to set minor to true.",
        "If a person looks like an adult, or you are unsure and they are not clearly a child, set minor to false.",
      ].join(" "),
      input: [
        {
          role: "user",
          content: [
            { type: "input_image", image_url: targetDataUrl, detail: "high" },
            { type: "input_image", image_url: sourceDataUrl, detail: "high" },
            { type: "input_text", text: "Are any of these people under 18? JSON only." },
          ],
        },
      ],
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    if (/minor|child|underage|under 18/i.test(detail)) return true;
    return null;
  }
  const text = outputText(await res.json());
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const parsed = JSON.parse(text.slice(start, end + 1)) as { minor?: unknown };
    if (parsed.minor === true) return true;
    if (parsed.minor === false) return false;
  } catch {
    return null;
  }
  return null;
}

export const swapFaces = createServerFn({ method: "POST" })
  .validator((input: unknown) => validate(input))
  .handler(async ({ data }): Promise<SwapResult> => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false, error: "Face swap is unavailable right now." };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 90_000);
    try {
      const minor = await pairHasMinor(apiKey, data.targetDataUrl, data.sourceDataUrl, controller.signal);
      if (minor === true) {
        return { ok: false, error: "A minor is in one of these photos. Face Lab only runs on adults." };
      }

      const res = await fetch("https://api.x.ai/v1/images/edits", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "grok-imagine-image-2.0",
          prompt:
            "Both people are adults. The first image is the frame to keep. The second image is only a face reference. Replace the face of the main adult in the first image with the adult face from the second image. Do not change anyone's age. Keep the first image's pose, body, clothing, background, lighting, camera, and framing. Blend the new face into the existing light. Do not add people, text, or a new background. Photoreal.",
          images: [
            { type: "image_url", url: data.targetDataUrl },
            { type: "image_url", url: data.sourceDataUrl },
          ],
        }),
      });
      if (!res.ok) {
        const detail = await res.text();
        return { ok: false, error: editorError(res.status, detail) };
      }
      const remote = imageUrlFrom(await res.json());
      if (!remote) return { ok: false, error: "The editor returned no image. Try again." };

      const image = await fetch(remote);
      if (!image.ok) return { ok: true, imageUrl: remote };
      const mime = image.headers.get("content-type")?.split(";")[0] || "image/jpeg";
      const bytes = Buffer.from(await image.arrayBuffer());
      return { ok: true, imageUrl: `data:${mime};base64,${bytes.toString("base64")}` };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return { ok: false, error: "The editor timed out. Try smaller images." };
      }
      return { ok: false, error: "The editor failed. Try again." };
    } finally {
      clearTimeout(timer);
    }
  });
