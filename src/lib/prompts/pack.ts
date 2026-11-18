export const DIALECTS = [
  { id: "universal", label: "Universal" },
  { id: "midjourney", label: "Midjourney" },
  { id: "flux", label: "Flux" },
  { id: "sdxl", label: "SDXL" },
  { id: "grok", label: "Grok Imagine" },
] as const;

export type DialectId = (typeof DIALECTS)[number]["id"];

export const BLOCKS = [
  { id: "subject", label: "Subject" },
  { id: "body", label: "Body & surface" },
  { id: "pose", label: "Pose & action" },
  { id: "setting", label: "Setting" },
  { id: "light", label: "Light" },
  { id: "camera", label: "Camera" },
  { id: "palette", label: "Palette" },
  { id: "medium", label: "Medium" },
] as const;

export type BlockId = (typeof BLOCKS)[number]["id"];

export type Register = "open" | "measured";
export type Density = "tight" | "standard" | "full";

export type PromptPack = {
  title: string;
  read: string;
  blocks: Record<BlockId, string>;
  negative: string;
  prompts: Record<DialectId, string>;
};

export type AnalyzeInput = {
  imageDataUrl: string;
  register: Register;
  density: Density;
  note: string;
  aspect: string;
};

const EMPTY_BLOCKS = Object.fromEntries(BLOCKS.map((b) => [b.id, ""])) as Record<BlockId, string>;
const EMPTY_PROMPTS = Object.fromEntries(DIALECTS.map((d) => [d.id, ""])) as Record<DialectId, string>;

function asText(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+\n/g, "\n").trim().slice(0, max);
}

export function parsePack(raw: string): PromptPack | { refused: true; message: string } | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;
  if (record.refused === true) {
    return {
      refused: true,
      message: asText(record.message, 240) || "This image can't be written up.",
    };
  }
  const blocksIn = (record.blocks ?? {}) as Record<string, unknown>;
  const promptsIn = (record.prompts ?? {}) as Record<string, unknown>;
  const blocks = { ...EMPTY_BLOCKS };
  const prompts = { ...EMPTY_PROMPTS };
  for (const block of BLOCKS) blocks[block.id] = asText(blocksIn[block.id], 1800);
  for (const dialect of DIALECTS) prompts[dialect.id] = asText(promptsIn[dialect.id], 6000);
  if (!prompts.universal && !prompts.grok && !prompts.flux) return null;
  if (!prompts.universal) {
    prompts.universal = prompts.grok || prompts.flux || prompts.midjourney || prompts.sdxl;
  }
  return {
    title: asText(record.title, 80) || "Untitled still",
    read: asText(record.read, 800),
    blocks,
    negative: asText(record.negative, 1500),
    prompts,
  };
}

export function packAsText(pack: PromptPack): string {
  const lines = [
    pack.title,
    "",
    pack.read,
    "",
    ...DIALECTS.flatMap((d) => [d.label.toUpperCase(), pack.prompts[d.id], ""]),
    "NEGATIVE",
    pack.negative,
  ];
  return lines.join("\n").trim();
}
