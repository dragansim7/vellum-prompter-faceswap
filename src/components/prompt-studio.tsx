import { useEffect, useRef, useState } from "react";
import { Aperture, Check, Copy, ImagePlus, Loader2 } from "lucide-react";
import { analyzeImage } from "@/lib/prompts/analyze.functions";
import {
  BLOCKS,
  DIALECTS,
  packAsText,
  type Density,
  type DialectId,
  type PromptPack,
  type Register,
} from "@/lib/prompts/pack";

const HISTORY_KEY = "vellum.history.v1";
const SETTINGS_KEY = "vellum.settings.v1";

type HistoryItem = {
  id: string;
  title: string;
  thumb: string;
  pack: PromptPack;
  at: number;
};

type Prepared = {
  dataUrl: string;
  thumb: string;
  width: number;
  height: number;
  aspect: string;
  name: string;
};

const ASPECTS: [number, string][] = [
  [1, "1:1"],
  [0.8, "4:5"],
  [0.75, "3:4"],
  [0.667, "2:3"],
  [0.5625, "9:16"],
  [1.25, "5:4"],
  [1.333, "4:3"],
  [1.5, "3:2"],
  [1.778, "16:9"],
  [2.333, "21:9"],
];

function nearestAspect(width: number, height: number): string {
  const ratio = width / height;
  let best = ASPECTS[0][1];
  let bestDiff = Infinity;
  for (const [value, label] of ASPECTS) {
    const diff = Math.abs(Math.log(ratio) - Math.log(value));
    if (diff < bestDiff) {
      best = label;
      bestDiff = diff;
    }
  }
  return best;
}

function loadImage(file: File): Promise<ImageBitmap> {
  return createImageBitmap(file);
}

async function prepareFile(file: File): Promise<Prepared> {
  const bitmap = await loadImage(file);
  const longEdge = Math.max(bitmap.width, bitmap.height);
  const scale = Math.min(1, 1280 / longEdge);
  let width = Math.max(1, Math.round(bitmap.width * scale));
  let height = Math.max(1, Math.round(bitmap.height * scale));
  if (width * height < 512) {
    const boost = Math.sqrt(640 / (width * height));
    width = Math.max(28, Math.round(width * boost));
    height = Math.max(28, Math.round(height * boost));
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser can't read that image.");
  ctx.fillStyle = "#f4f1ea";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.82);

  const thumbEdge = 160;
  const thumbScale = thumbEdge / Math.max(width, height);
  const thumb = document.createElement("canvas");
  thumb.width = Math.max(1, Math.round(width * thumbScale));
  thumb.height = Math.max(1, Math.round(height * thumbScale));
  const tctx = thumb.getContext("2d");
  if (!tctx) throw new Error("This browser can't read that image.");
  tctx.drawImage(canvas, 0, 0, thumb.width, thumb.height);
  bitmap.close();

  return {
    dataUrl,
    thumb: thumb.toDataURL("image/jpeg", 0.7),
    width,
    height,
    aspect: nearestAspect(width, height),
    name: file.name || "still",
  };
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "true");
    area.style.position = "fixed";
    area.style.left = "-9999px";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}

function Segment<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (id: T) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-widest text-faint">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = option.id === value;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option.id)}
              className={
                "min-h-11 rounded-full px-4 text-sm font-medium transition-shadow duration-150 " +
                (active
                  ? "bg-brass text-brass-ink shadow-panel-strong"
                  : "bg-surface-2 text-fg shadow-panel hover:text-brass")
              }
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function PromptStudio() {
  const inputRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef(0);
  const [prepared, setPrepared] = useState<Prepared | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [register, setRegister] = useState<Register>("open");
  const [density, setDensity] = useState<Density>("standard");
  const [note, setNote] = useState("");
  const [dialect, setDialect] = useState<DialectId>("universal");
  const [pack, setPack] = useState<PromptPack | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as HistoryItem[];
        if (Array.isArray(parsed)) setHistory(parsed.slice(0, 12));
      }
      const settings = localStorage.getItem(SETTINGS_KEY);
      if (settings) {
        const parsed = JSON.parse(settings) as { register?: Register; density?: Density };
        if (parsed.register === "open" || parsed.register === "measured") setRegister(parsed.register);
        if (parsed.density === "tight" || parsed.density === "standard" || parsed.density === "full") {
          setDensity(parsed.density);
        }
      }
    } catch {
      /* ignore broken local storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 12)));
  }, [history, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ register, density }));
  }, [register, density, hydrated]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function takeFile(file: File | undefined) {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type) && !/\.(jpe?g|png|webp|gif)$/i.test(file.name)) {
      setError("Use a JPEG, PNG, WebP, or GIF.");
      return;
    }
    setError(null);
    requestRef.current += 1;
    setBusy(false);
    try {
      const next = await prepareFile(file);
      setPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return URL.createObjectURL(file);
      });
      setPrepared(next);
      setPack(null);
    } catch {
      setError("That file couldn't be opened as an image.");
    }
  }

  async function writePrompt() {
    if (!prepared || busy) return;
    const requestId = ++requestRef.current;
    setBusy(true);
    setError(null);
    try {
      const result = await analyzeImage({
        data: {
          imageDataUrl: prepared.dataUrl,
          register,
          density,
          note,
          aspect: prepared.aspect,
        },
      });
      if (requestId !== requestRef.current) return;
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPack(result.pack);
      setDialect("universal");
      setHistory((current) => [
        {
          id: crypto.randomUUID(),
          title: result.pack.title,
          thumb: prepared.thumb,
          pack: result.pack,
          at: Date.now(),
        },
        ...current,
      ].slice(0, 12));
    } catch (caught) {
      if (requestId !== requestRef.current) return;
      const message = caught instanceof Error ? caught.message : "The reader failed. Try again.";
      setError(message.replace(/\s+/g, " ").slice(0, 180));
    } finally {
      if (requestId === requestRef.current) setBusy(false);
    }
  }

  async function onCopy(id: string, text: string) {
    if (!text) return;
    const ok = await copyText(text);
    if (!ok) {
      setError("Copy was blocked. Select the prompt and copy it from there.");
      return;
    }
    setCopied(id);
    window.setTimeout(() => setCopied((current) => (current === id ? null : current)), 1600);
  }

  const activePrompt = pack?.prompts[dialect] ?? "";

  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-brass">Still to prompt</p>
          <h1 className="font-display text-4xl italic leading-none text-fg sm:text-5xl">Vellum</h1>
        </div>
        <p className="max-w-sm text-sm text-pretty text-muted sm:text-right">
          A local still becomes a structured prompt you can paste. Open register writes what is in the frame,
          without euphemism.
        </p>
      </header>

      <main className="mx-auto grid max-w-6xl gap-4 px-4 pb-12 sm:px-6 lg:grid-cols-12 lg:gap-5">
        <section className="panel flex flex-col gap-4 p-3 lg:col-span-5">
          <label
            onDragOver={(event) => {
              event.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragOver(false);
              void takeFile(event.dataTransfer.files[0]);
            }}
            className={
              "well relative flex min-h-72 cursor-pointer flex-col items-center justify-center overflow-hidden " +
              (dragOver ? "shadow-panel-strong" : "")
            }
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              onChange={(event) => {
                void takeFile(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Selected still"
                className="max-h-96 w-full object-contain outline outline-1 -outline-offset-1 outline-fg/10"
              />
            ) : (
              <span className="flex flex-col items-center gap-3 px-6 py-16 text-center">
                <ImagePlus className="size-8 text-brass" aria-hidden="true" />
                <span className="font-display text-2xl italic text-fg">Drop a still</span>
                <span className="max-w-xs text-sm text-pretty text-muted">
                  JPEG, PNG, WebP, or GIF from this device. Nothing is read until you ask.
                </span>
              </span>
            )}
          </label>

          {prepared ? (
            <p className="flex items-baseline justify-between gap-3 px-2 text-sm text-muted">
              <span className="truncate">{prepared.name}</span>
              <span className="shrink-0 tabular-nums">
                {prepared.width}×{prepared.height} · {prepared.aspect}
              </span>
            </p>
          ) : null}

          <div className="flex flex-col gap-4 px-2 pb-2">
            <Segment
              label="Register"
              value={register}
              onChange={setRegister}
              options={[
                { id: "open", label: "Open" },
                { id: "measured", label: "Measured" },
              ]}
            />
            <Segment
              label="Density"
              value={density}
              onChange={setDensity}
              options={[
                { id: "tight", label: "Tight" },
                { id: "standard", label: "Standard" },
                { id: "full", label: "Full" },
              ]}
            />
            <label className="block">
              <span className="mb-2 block text-xs font-medium uppercase tracking-widest text-faint">
                Emphasis
              </span>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value.slice(0, 400))}
                rows={3}
                placeholder="Optional. What to hold onto — the car, the weather, the face."
                className="well w-full resize-none px-3 py-3 text-sm text-fg outline-none placeholder:text-faint focus:shadow-panel-strong"
              />
            </label>
            <button
              type="button"
              disabled={!prepared || busy}
              onClick={() => void writePrompt()}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-brass px-5 text-sm font-semibold text-brass-ink disabled:opacity-40"
            >
              {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Aperture className="size-4" aria-hidden="true" />}
              {busy ? "Reading the frame" : "Write the prompt"}
            </button>
            <p className="text-center text-xs text-faint">One read per press. The still is not kept on the server.</p>
            {error ? (
              <p role="alert" className="text-sm text-pretty text-danger">
                {error}
              </p>
            ) : null}
          </div>
        </section>

        <section className="panel flex min-h-[28rem] flex-col gap-4 p-4 lg:col-span-7 lg:p-5">
          {!pack && !busy ? (
            <div className="flex flex-1 flex-col gap-3">
              <p className="font-display text-3xl italic text-fg">What you get</p>
              <ul className="max-w-md space-y-2 text-sm text-pretty text-muted">
                <li>A short read of the frame, so you can see what was actually noticed.</li>
                <li>Paste-ready lines for Universal, Midjourney, Flux, SDXL, and Grok Imagine.</li>
                <li>Subject, surface, light, camera, palette, and a negative that does not fight the picture.</li>
              </ul>
            </div>
          ) : null}

          {busy && !pack ? (
            <div className="flex flex-1 flex-col gap-3" aria-busy="true" aria-live="polite">
              <p className="text-sm text-muted">Reading the frame and writing the pack.</p>
              <div className="well h-8 w-2/3" />
              <div className="well h-40 w-full" />
              <div className="grid grid-cols-2 gap-3">
                <div className="well h-20" />
                <div className="well h-20" />
              </div>
            </div>
          ) : null}

          {pack ? (
            <div className={busy ? "opacity-60" : ""}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-3xl italic text-fg">{pack.title}</h2>
                  {pack.read ? <p className="mt-2 max-w-xl text-sm text-pretty text-muted">{pack.read}</p> : null}
                </div>
                <button
                  type="button"
                  onClick={() => void onCopy("all", packAsText(pack))}
                  className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-surface-2 px-4 text-sm font-medium text-fg shadow-panel"
                >
                  {copied === "all" ? <Check className="size-4 text-brass" /> : <Copy className="size-4" />}
                  {copied === "all" ? "Copied" : "Copy pack"}
                </button>
              </div>

              <div className="mt-5">
                <Segment
                  label="Dialect"
                  value={dialect}
                  onChange={setDialect}
                  options={DIALECTS.map((item) => ({ id: item.id, label: item.label }))}
                />
              </div>

              <div className="well mt-4 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-xs font-medium uppercase tracking-widest text-faint">Prompt</p>
                  <button
                    type="button"
                    onClick={() => void onCopy("prompt", activePrompt)}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-medium text-brass"
                  >
                    {copied === "prompt" ? <Check className="size-4" /> : <Copy className="size-4" />}
                    {copied === "prompt" ? "Copied" : "Copy"}
                  </button>
                </div>
                <p className="text-sm leading-relaxed text-pretty whitespace-pre-wrap text-fg">{activePrompt}</p>
              </div>

              {pack.negative ? (
                <div className="mt-3 well p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-xs font-medium uppercase tracking-widest text-faint">Negative</p>
                    <button
                      type="button"
                      onClick={() => void onCopy("negative", pack.negative)}
                      className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-medium text-brass"
                    >
                      {copied === "negative" ? <Check className="size-4" /> : <Copy className="size-4" />}
                      {copied === "negative" ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <p className="text-sm leading-relaxed text-pretty text-muted">{pack.negative}</p>
                </div>
              ) : null}

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {BLOCKS.map((block) => {
                  const text = pack.blocks[block.id];
                  if (!text) return null;
                  return (
                    <article key={block.id} className="well p-3">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <h3 className="text-xs font-medium uppercase tracking-widest text-faint">{block.label}</h3>
                        <button
                          type="button"
                          aria-label={`Copy ${block.label}`}
                          onClick={() => void onCopy(block.id, text)}
                          className="inline-flex size-11 items-center justify-center text-muted"
                        >
                          {copied === block.id ? <Check className="size-4 text-brass" /> : <Copy className="size-4" />}
                        </button>
                      </div>
                      <p className="text-sm text-pretty text-fg">{text}</p>
                    </article>
                  );
                })}
              </div>
            </div>
          ) : null}

          {history.length > 0 ? (
            <div className="mt-auto pt-2">
              <p className="mb-2 text-xs font-medium uppercase tracking-widest text-faint">This session</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {history.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setPack(item.pack);
                      setDialect("universal");
                      setError(null);
                    }}
                    className="well flex w-28 shrink-0 flex-col overflow-hidden text-left"
                  >
                    <img src={item.thumb} alt="" className="h-16 w-full object-cover" />
                    <span className="truncate px-2 py-2 text-xs text-muted">{item.title}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
