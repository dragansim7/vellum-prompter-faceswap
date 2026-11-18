import { i as __toESM } from "../_runtime.mjs";
import { b as require_jsx_runtime, q as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { n as DIALECTS, r as packAsText, t as BLOCKS } from "./pack-BH6K97PM.mjs";
import { a as Copy, i as Download, n as LoaderCircle, o as Check, r as ImagePlus, s as Aperture } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DuFhKAVL.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var MAX_DATA_URL$1 = 25e5;
function isRegister(value) {
	return value === "open" || value === "measured";
}
function isDensity(value) {
	return value === "tight" || value === "standard" || value === "full";
}
function validate$1(input) {
	if (!input || typeof input !== "object") throw new Error("Missing request.");
	const raw = input;
	const imageDataUrl = typeof raw.imageDataUrl === "string" ? raw.imageDataUrl : "";
	if (!/^data:image\/(jpeg|jpg|png);base64,[a-z0-9+/=\s]+$/i.test(imageDataUrl)) throw new Error("Send a JPEG or PNG.");
	if (imageDataUrl.length > MAX_DATA_URL$1) throw new Error("That image is too large. Use a smaller file.");
	if (!isRegister(raw.register) || !isDensity(raw.density)) throw new Error("Unknown settings.");
	const note = typeof raw.note === "string" ? raw.note.trim().slice(0, 400) : "";
	const aspect = typeof raw.aspect === "string" && /^\d{1,2}:\d{1,2}$/.test(raw.aspect) ? raw.aspect : "3:2";
	return {
		imageDataUrl,
		register: raw.register,
		density: raw.density,
		note,
		aspect
	};
}
var analyzeImage = createServerFn({ method: "POST" }).validator((input) => validate$1(input)).handler(createSsrRpc("c4707668071d02511a54a35bc76bcc4b2dc07a443e75385583592f6ce2c77e71"));
var HISTORY_KEY = "vellum.history.v1";
var SETTINGS_KEY = "vellum.settings.v1";
var ASPECTS = [
	[1, "1:1"],
	[.8, "4:5"],
	[.75, "3:4"],
	[.667, "2:3"],
	[.5625, "9:16"],
	[1.25, "5:4"],
	[1.333, "4:3"],
	[1.5, "3:2"],
	[1.778, "16:9"],
	[2.333, "21:9"]
];
function nearestAspect(width, height) {
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
function loadImage(file) {
	return createImageBitmap(file);
}
async function prepareFile(file) {
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
	const dataUrl = canvas.toDataURL("image/jpeg", .82);
	const thumbScale = 160 / Math.max(width, height);
	const thumb = document.createElement("canvas");
	thumb.width = Math.max(1, Math.round(width * thumbScale));
	thumb.height = Math.max(1, Math.round(height * thumbScale));
	const tctx = thumb.getContext("2d");
	if (!tctx) throw new Error("This browser can't read that image.");
	tctx.drawImage(canvas, 0, 0, thumb.width, thumb.height);
	bitmap.close();
	return {
		dataUrl,
		thumb: thumb.toDataURL("image/jpeg", .7),
		width,
		height,
		aspect: nearestAspect(width, height),
		name: file.name || "still"
	};
}
async function copyText(text) {
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
function Segment({ label, value, options, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "mb-2 text-xs font-medium uppercase tracking-widest text-faint",
		children: label
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex flex-wrap gap-2",
		children: options.map((option) => {
			const active = option.id === value;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				"aria-pressed": active,
				onClick: () => onChange(option.id),
				className: "min-h-11 rounded-full px-4 text-sm font-medium transition-shadow duration-150 " + (active ? "bg-brass text-brass-ink shadow-panel-strong" : "bg-surface-2 text-fg shadow-panel hover:text-brass"),
				children: option.label
			}, option.id);
		})
	})] });
}
function PromptStudio() {
	const inputRef = (0, import_react.useRef)(null);
	const requestRef = (0, import_react.useRef)(0);
	const [prepared, setPrepared] = (0, import_react.useState)(null);
	const [previewUrl, setPreviewUrl] = (0, import_react.useState)(null);
	const [dragOver, setDragOver] = (0, import_react.useState)(false);
	const [register, setRegister] = (0, import_react.useState)("open");
	const [density, setDensity] = (0, import_react.useState)("standard");
	const [note, setNote] = (0, import_react.useState)("");
	const [dialect, setDialect] = (0, import_react.useState)("universal");
	const [pack, setPack] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const [copied, setCopied] = (0, import_react.useState)(null);
	const [history, setHistory] = (0, import_react.useState)([]);
	const [hydrated, setHydrated] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		try {
			const stored = localStorage.getItem(HISTORY_KEY);
			if (stored) {
				const parsed = JSON.parse(stored);
				if (Array.isArray(parsed)) setHistory(parsed.slice(0, 12));
			}
			const settings = localStorage.getItem(SETTINGS_KEY);
			if (settings) {
				const parsed = JSON.parse(settings);
				if (parsed.register === "open" || parsed.register === "measured") setRegister(parsed.register);
				if (parsed.density === "tight" || parsed.density === "standard" || parsed.density === "full") setDensity(parsed.density);
			}
		} catch {}
		setHydrated(true);
	}, []);
	(0, import_react.useEffect)(() => {
		if (!hydrated) return;
		localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 12)));
	}, [history, hydrated]);
	(0, import_react.useEffect)(() => {
		if (!hydrated) return;
		localStorage.setItem(SETTINGS_KEY, JSON.stringify({
			register,
			density
		}));
	}, [
		register,
		density,
		hydrated
	]);
	(0, import_react.useEffect)(() => {
		return () => {
			if (previewUrl) URL.revokeObjectURL(previewUrl);
		};
	}, [previewUrl]);
	async function takeFile(file) {
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
			const result = await analyzeImage({ data: {
				imageDataUrl: prepared.dataUrl,
				register,
				density,
				note,
				aspect: prepared.aspect
			} });
			if (requestId !== requestRef.current) return;
			if (!result.ok) {
				setError(result.error);
				return;
			}
			setPack(result.pack);
			setDialect("universal");
			setHistory((current) => [{
				id: crypto.randomUUID(),
				title: result.pack.title,
				thumb: prepared.thumb,
				pack: result.pack,
				at: Date.now()
			}, ...current].slice(0, 12));
		} catch (caught) {
			if (requestId !== requestRef.current) return;
			const message = caught instanceof Error ? caught.message : "The reader failed. Try again.";
			setError(message.replace(/\s+/g, " ").slice(0, 180));
		} finally {
			if (requestId === requestRef.current) setBusy(false);
		}
	}
	async function onCopy(id, text) {
		if (!text) return;
		if (!await copyText(text)) {
			setError("Copy was blocked. Select the prompt and copy it from there.");
			return;
		}
		setCopied(id);
		window.setTimeout(() => setCopied((current) => current === id ? null : current), 1600);
	}
	const activePrompt = pack?.prompts[dialect] ?? "";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-bg text-fg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-medium uppercase tracking-widest text-brass",
				children: "Still to prompt"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-4xl tracking-tight text-fg sm:text-5xl",
				children: "Vellum"
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-sm text-sm text-pretty text-muted sm:text-right",
				children: "A local still becomes a structured prompt you can paste. Open register writes what is in the frame, without euphemism."
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
			className: "mx-auto grid max-w-6xl gap-4 px-4 pb-12 sm:px-6 lg:grid-cols-12 lg:gap-5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "panel flex flex-col gap-4 p-3 lg:col-span-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						onDragOver: (event) => {
							event.preventDefault();
							setDragOver(true);
						},
						onDragLeave: () => setDragOver(false),
						onDrop: (event) => {
							event.preventDefault();
							setDragOver(false);
							takeFile(event.dataTransfer.files[0]);
						},
						className: "well relative flex min-h-72 cursor-pointer flex-col items-center justify-center overflow-hidden " + (dragOver ? "shadow-panel-strong" : ""),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							ref: inputRef,
							type: "file",
							accept: "image/jpeg,image/png,image/webp,image/gif",
							className: "sr-only",
							onChange: (event) => {
								takeFile(event.target.files?.[0]);
								event.target.value = "";
							}
						}), previewUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: previewUrl,
							alt: "Selected still",
							className: "max-h-96 w-full object-contain outline outline-1 -outline-offset-1 outline-fg/10"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex flex-col items-center gap-3 px-6 py-16 text-center",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, {
									className: "size-8 text-brass",
									"aria-hidden": "true"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-display text-2xl tracking-tight text-fg",
									children: "Drop a still"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "max-w-xs text-sm text-pretty text-muted",
									children: "JPEG, PNG, WebP, or GIF from this device. Nothing is read until you ask."
								})
							]
						})]
					}),
					prepared ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "flex items-baseline justify-between gap-3 px-2 text-sm text-muted",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "truncate",
							children: prepared.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "shrink-0 tabular-nums",
							children: [
								prepared.width,
								"×",
								prepared.height,
								" · ",
								prepared.aspect
							]
						})]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-4 px-2 pb-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segment, {
								label: "Register",
								value: register,
								onChange: setRegister,
								options: [{
									id: "open",
									label: "Open"
								}, {
									id: "measured",
									label: "Measured"
								}]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segment, {
								label: "Density",
								value: density,
								onChange: setDensity,
								options: [
									{
										id: "tight",
										label: "Tight"
									},
									{
										id: "standard",
										label: "Standard"
									},
									{
										id: "full",
										label: "Full"
									}
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "block",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mb-2 block text-xs font-medium uppercase tracking-widest text-faint",
									children: "Emphasis"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
									value: note,
									onChange: (event) => setNote(event.target.value.slice(0, 400)),
									rows: 3,
									placeholder: "Optional. What to hold onto — the car, the weather, the face.",
									className: "well w-full resize-none px-3 py-3 text-sm text-fg outline-none placeholder:text-faint focus:shadow-panel-strong"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								disabled: !prepared || busy,
								onClick: () => void writePrompt(),
								className: "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-brass px-5 text-sm font-semibold text-brass-ink disabled:opacity-40",
								children: [busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
									className: "size-4 animate-spin",
									"aria-hidden": "true"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Aperture, {
									className: "size-4",
									"aria-hidden": "true"
								}), busy ? "Reading the frame" : "Write the prompt"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-center text-xs text-faint",
								children: "One read per press. The still is not kept on the server."
							}),
							error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								role: "alert",
								className: "text-sm text-pretty text-danger",
								children: error
							}) : null
						]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "panel flex min-h-[28rem] flex-col gap-4 p-4 lg:col-span-7 lg:p-5",
				children: [
					!pack && !busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-1 flex-col gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-3xl tracking-tight text-fg",
							children: "What you get"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
							className: "max-w-md space-y-2 text-sm text-pretty text-muted",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "A short read of the frame, so you can see what was actually noticed." }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Paste-ready lines for Universal, Midjourney, Flux, SDXL, and Grok Imagine." }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Subject, surface, light, camera, palette, and a negative that does not fight the picture." })
							]
						})]
					}) : null,
					busy && !pack ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-1 flex-col gap-3",
						"aria-busy": "true",
						"aria-live": "polite",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted",
								children: "Reading the frame and writing the pack."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "well h-8 w-2/3" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "well h-40 w-full" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "well h-20" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "well h-20" })]
							})
						]
					}) : null,
					pack ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: busy ? "opacity-60" : "",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "font-display text-3xl tracking-tight text-fg",
									children: pack.title
								}), pack.read ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 max-w-xl text-sm text-pretty text-muted",
									children: pack.read
								}) : null] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => void onCopy("all", packAsText(pack)),
									className: "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-surface-2 px-4 text-sm font-medium text-fg shadow-panel",
									children: [copied === "all" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4 text-brass" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-4" }), copied === "all" ? "Copied" : "Copy pack"]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-5",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Segment, {
									label: "Dialect",
									value: dialect,
									onChange: setDialect,
									options: DIALECTS.map((item) => ({
										id: item.id,
										label: item.label
									}))
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "well mt-4 p-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mb-3 flex items-center justify-between gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs font-medium uppercase tracking-widest text-faint",
										children: "Prompt"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: () => void onCopy("prompt", activePrompt),
										className: "inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-medium text-brass",
										children: [copied === "prompt" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-4" }), copied === "prompt" ? "Copied" : "Copy"]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm leading-relaxed text-pretty whitespace-pre-wrap text-fg",
									children: activePrompt
								})]
							}),
							pack.negative ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 well p-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mb-3 flex items-center justify-between gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs font-medium uppercase tracking-widest text-faint",
										children: "Negative"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: () => void onCopy("negative", pack.negative),
										className: "inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-medium text-brass",
										children: [copied === "negative" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-4" }), copied === "negative" ? "Copied" : "Copy"]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm leading-relaxed text-pretty text-muted",
									children: pack.negative
								})]
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-4 grid gap-3 sm:grid-cols-2",
								children: BLOCKS.map((block) => {
									const text = pack.blocks[block.id];
									if (!text) return null;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
										className: "well p-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mb-1 flex items-center justify-between gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
												className: "text-xs font-medium uppercase tracking-widest text-faint",
												children: block.label
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												"aria-label": `Copy ${block.label}`,
												onClick: () => void onCopy(block.id, text),
												className: "inline-flex size-11 items-center justify-center text-muted",
												children: copied === block.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4 text-brass" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-4" })
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm text-pretty text-fg",
											children: text
										})]
									}, block.id);
								})
							})
						]
					}) : null,
					history.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-auto pt-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mb-2 text-xs font-medium uppercase tracking-widest text-faint",
							children: "This session"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex gap-2 overflow-x-auto pb-1",
							children: history.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => {
									setPack(item.pack);
									setDialect("universal");
									setError(null);
								},
								className: "well flex w-28 shrink-0 flex-col overflow-hidden text-left",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: item.thumb,
									alt: "",
									className: "h-16 w-full object-cover"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "truncate px-2 py-2 text-xs text-muted",
									children: item.title
								})]
							}, item.id))
						})]
					}) : null
				]
			})]
		})]
	});
}
var MAX_DATA_URL = 12e5;
var DATA_URL = /^data:image\/(jpeg|jpg|png|webp);base64,[a-z0-9+/=\s]+$/i;
function validate(input) {
	if (!input || typeof input !== "object") throw new Error("Missing request.");
	const raw = input;
	const targetDataUrl = typeof raw.targetDataUrl === "string" ? raw.targetDataUrl : "";
	const sourceDataUrl = typeof raw.sourceDataUrl === "string" ? raw.sourceDataUrl : "";
	if (!DATA_URL.test(targetDataUrl) || !DATA_URL.test(sourceDataUrl)) throw new Error("Send a JPEG, PNG, or WebP for both frames.");
	if (targetDataUrl.length > MAX_DATA_URL || sourceDataUrl.length > MAX_DATA_URL) throw new Error("Those photos are too large. Use a smaller crop.");
	return {
		targetDataUrl,
		sourceDataUrl
	};
}
var swapFaces = createServerFn({ method: "POST" }).validator((input) => validate(input)).handler(createSsrRpc("938e1e7de03d710fb2ec8235cf85621b83966313972350ccff6215a2f15ca1c9"));
async function prepare(file) {
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
		dataUrl: canvas.toDataURL("image/jpeg", .72),
		preview: URL.createObjectURL(file),
		name: file.name
	};
}
function FaceLab() {
	const sourceRef = (0, import_react.useRef)(null);
	const targetRef = (0, import_react.useRef)(null);
	const [source, setSource] = (0, import_react.useState)(null);
	const [target, setTarget] = (0, import_react.useState)(null);
	const [resultUrl, setResultUrl] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const [saved, setSaved] = (0, import_react.useState)(false);
	async function take(which, file) {
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
	async function exportImage(url) {
		setError(null);
		try {
			const blob = await (await fetch(url)).blob();
			const name = `vellum-face-swap-${Date.now()}.jpg`;
			const file = new File([blob], name, { type: blob.type || "image/jpeg" });
			if (navigator.canShare?.({ files: [file] })) try {
				await navigator.share({
					files: [file],
					title: "Vellum face swap"
				});
				setSaved(true);
				window.setTimeout(() => setSaved(false), 1600);
				return;
			} catch (shareError) {
				if (shareError instanceof Error && shareError.name === "AbortError") return;
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
			const result = await swapFaces({ data: {
				targetDataUrl: target.dataUrl,
				sourceDataUrl: source.dataUrl
			} });
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
	const Slot = ({ label, hint, value, inputRef, onPick }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "well relative flex min-h-48 cursor-pointer flex-col items-center justify-center overflow-hidden",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			ref: inputRef,
			type: "file",
			accept: "image/jpeg,image/png,image/webp",
			className: "sr-only",
			onChange: (event) => {
				onPick(event.target.files?.[0]);
				event.target.value = "";
			}
		}), value ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src: value.preview,
			alt: label,
			className: "max-h-64 w-full object-contain"
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "flex flex-col items-center gap-2 px-4 py-10 text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, { className: "size-7 text-brass" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-display text-xl tracking-tight text-fg",
					children: label
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs text-muted",
					children: hint
				})
			]
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-bg text-fg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-medium uppercase tracking-widest text-brass",
				children: "Face Lab"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-4xl tracking-tight text-fg sm:text-5xl",
				children: "Vellum"
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-sm text-sm text-pretty text-muted sm:text-right",
				children: "The source face is placed onto the target frame. Pose, clothes, and background stay."
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
			className: "mx-auto grid max-w-6xl gap-4 px-4 pb-12 sm:px-6 lg:grid-cols-12 lg:gap-5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "panel flex flex-col gap-4 p-3 lg:col-span-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slot, {
						label: "Source face",
						hint: "The face to use",
						value: source,
						inputRef: sourceRef,
						onPick: (file) => void take("source", file)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Slot, {
						label: "Target frame",
						hint: "The picture to keep",
						value: target,
						inputRef: targetRef,
						onPick: (file) => void take("target", file)
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-3 px-2 pb-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							disabled: !source || !target || busy,
							onClick: () => void swap(),
							className: "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-brass px-5 text-sm font-semibold text-brass-ink disabled:opacity-40",
							children: [busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Aperture, { className: "size-4" }), busy ? "Swapping the face" : "Swap the face"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-center text-xs text-faint",
							children: "Adult photos pass. A clear child in either frame stops the edit."
						}),
						error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							role: "alert",
							className: "text-sm text-pretty text-danger",
							children: error
						}) : null
					]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "panel flex min-h-96 flex-col gap-4 p-4 lg:col-span-7 lg:p-5",
				children: [
					!resultUrl && !busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-1 flex-col gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-3xl tracking-tight text-fg",
							children: "The swapped frame"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "max-w-md text-sm text-pretty text-muted",
							children: "You get the target picture back, with the source face on the main person. Export saves it on this device."
						})]
					}) : null,
					busy && !resultUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-1 flex-col gap-3",
						"aria-busy": "true",
						"aria-live": "polite",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted",
							children: "Placing the face into the frame."
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "well h-72 w-full" })]
					}) : null,
					resultUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: busy ? "opacity-60" : "",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-3 flex items-center justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-display text-3xl tracking-tight text-fg",
								children: "Face edit complete"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => void exportImage(resultUrl),
								className: "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-brass px-4 text-sm font-semibold text-brass-ink",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-4" }), saved ? "Saved" : "Export"]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: resultUrl,
							alt: "Face swapped result",
							className: "well max-h-96 w-full object-contain"
						})]
					}) : null
				]
			})]
		})]
	});
}
function Home() {
	const [mode, setMode] = (0, import_react.useState)("prompt");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex max-w-6xl justify-end gap-2 px-4 pt-4 sm:px-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: () => setMode("prompt"),
			className: "min-h-10 rounded-full px-4 text-sm font-medium " + (mode === "prompt" ? "bg-brass text-brass-ink" : "bg-surface-2 text-fg"),
			children: "Prompt"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: () => setMode("face"),
			className: "min-h-10 rounded-full px-4 text-sm font-medium " + (mode === "face" ? "bg-brass text-brass-ink" : "bg-surface-2 text-fg"),
			children: "Face Lab"
		})]
	}), mode === "prompt" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PromptStudio, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FaceLab, {})] });
}
//#endregion
export { Home as component };
