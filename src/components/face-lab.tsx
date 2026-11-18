import { useRef, useState, type RefObject } from "react";
import { Aperture, Download, ImagePlus, Loader2 } from "lucide-react";
import { swapFaces } from "@/lib/prompts/swap.functions";

type Prepared = {
  dataUrl: string;
  preview: string;
  name: string;
};

async function prepare(file: File): Promise<Prepared> {
  const bitmap = await createImageBitmap(file);
  const long = Math.max(bitmap.width, bitmap.height);
  const scale = Math.min(1, 768 / long);
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Cannot read image");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return {
    dataUrl: canvas.toDataURL("image/jpeg", 0.72),
    preview: URL.createObjectURL(file),
    name: file.name,
  };
}

export function FaceLab() {
  const sourceRef = useRef<HTMLInputElement>(null);
  const targetRef = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState<Prepared | null>(null);
  const [target, setTarget] = useState<Prepared | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function take(which: "source" | "target", file: File | undefined) {
    if (!file) return;
    setError(null);
    try {
      const next = await prepare(file);
      if (which === "source") {
        if (source) URL.revokeObjectURL(source.preview);
        setSource(next);
      } else {
        if (target) URL.revokeObjectURL(target.preview);
        setTarget(next);
      }
      setResultUrl(null);
    } catch {
      setError("That file couldn't be opened as an image.");
    }
  }

  async function exportImage(url: string) {
    setError(null);
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const name = `vellum-face-swap-${Date.now()}.jpg`;
      const file = new File([blob], name, { type: blob.type || "image/jpeg" });
      const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
      if (nav.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: "Vellum face swap" });
          setSaved(true);
          window.setTimeout(() => setSaved(false), 1600);
          return;
        } catch (shareError) {
          if (shareError instanceof Error && shareError.name === "AbortError") return;
        }
      }
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1600);
    } catch {
      setError("Couldn't save that image on this device.");
    }
  }

  async function swap() {
    if (!source || !target || busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await swapFaces({
        data: { targetDataUrl: target.dataUrl, sourceDataUrl: source.dataUrl },
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setResultUrl(result.imageUrl);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "The editor failed. Try again.";
      setError(message.replace(/\s+/g, " ").slice(0, 180));
    } finally {
      setBusy(false);
    }
  }

  const Slot = ({
    label,
    hint,
    value,
    inputRef,
    onPick,
  }: {
    label: string;
    hint: string;
    value: Prepared | null;
    inputRef: RefObject<HTMLInputElement | null>;
    onPick: (file: File | undefined) => void;
  }) => (
    <label className="well relative flex min-h-48 cursor-pointer flex-col items-center justify-center overflow-hidden">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => {
          onPick(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      {value ? (
        <img src={value.preview} alt={label} className="max-h-64 w-full object-contain" />
      ) : (
        <span className="flex flex-col items-center gap-2 px-4 py-10 text-center">
          <ImagePlus className="size-7 text-brass" />
          <span className="font-display text-xl tracking-tight text-fg">{label}</span>
          <span className="text-xs text-muted">{hint}</span>
        </span>
      )}
    </label>
  );

  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-brass">Face Lab</p>
          <h1 className="font-display text-4xl tracking-tight text-fg sm:text-5xl">Vellum</h1>
        </div>
        <p className="max-w-sm text-sm text-pretty text-muted sm:text-right">
          The source face is placed onto the target frame. Pose, clothes, and background stay.
        </p>
      </header>

      <main className="mx-auto grid max-w-6xl gap-4 px-4 pb-12 sm:px-6 lg:grid-cols-12 lg:gap-5">
        <section className="panel flex flex-col gap-4 p-3 lg:col-span-5">
          <div className="grid grid-cols-2 gap-3">
            <Slot
              label="Source face"
              hint="The face to use"
              value={source}
              inputRef={sourceRef}
              onPick={(file) => void take("source", file)}
            />
            <Slot
              label="Target frame"
              hint="The picture to keep"
              value={target}
              inputRef={targetRef}
              onPick={(file) => void take("target", file)}
            />
          </div>
          <div className="flex flex-col gap-3 px-2 pb-2">
            <button
              type="button"
              disabled={!source || !target || busy}
              onClick={() => void swap()}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-brass px-5 text-sm font-semibold text-brass-ink disabled:opacity-40"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Aperture className="size-4" />}
              {busy ? "Swapping the face" : "Swap the face"}
            </button>
            <p className="text-center text-xs text-faint">Adult photos pass. A clear child in either frame stops the edit.</p>
            {error ? (
              <p role="alert" className="text-sm text-pretty text-danger">
                {error}
              </p>
            ) : null}
          </div>
        </section>

        <section className="panel flex min-h-96 flex-col gap-4 p-4 lg:col-span-7 lg:p-5">
          {!resultUrl && !busy ? (
            <div className="flex flex-1 flex-col gap-3">
              <p className="font-display text-3xl tracking-tight text-fg">The swapped frame</p>
              <p className="max-w-md text-sm text-pretty text-muted">
                You get the target picture back, with the source face on the main person. Export saves it on this device.
              </p>
            </div>
          ) : null}
          {busy && !resultUrl ? (
            <div className="flex flex-1 flex-col gap-3" aria-busy="true" aria-live="polite">
              <p className="text-sm text-muted">Placing the face into the frame.</p>
              <div className="well h-72 w-full" />
            </div>
          ) : null}
          {resultUrl ? (
            <div className={busy ? "opacity-60" : ""}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="font-display text-3xl tracking-tight text-fg">Face edit complete</h2>
                <button
                  type="button"
                  onClick={() => void exportImage(resultUrl)}
                  className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-brass px-4 text-sm font-semibold text-brass-ink"
                >
                  <Download className="size-4" />
                  {saved ? "Saved" : "Export"}
                </button>
              </div>
              <img
                src={resultUrl}
                alt="Face swapped result"
                className="well max-h-96 w-full object-contain"
              />
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
