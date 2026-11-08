//#region node_modules/.nitro/vite/services/ssr/assets/pack-BiQa4ZfJ.js
var DIALECTS = [
	{
		id: "universal",
		label: "Universal"
	},
	{
		id: "midjourney",
		label: "Midjourney"
	},
	{
		id: "flux",
		label: "Flux"
	},
	{
		id: "sdxl",
		label: "SDXL"
	},
	{
		id: "grok",
		label: "Grok Imagine"
	}
];
var BLOCKS = [
	{
		id: "subject",
		label: "Subject"
	},
	{
		id: "body",
		label: "Body & surface"
	},
	{
		id: "pose",
		label: "Pose & action"
	},
	{
		id: "setting",
		label: "Setting"
	},
	{
		id: "light",
		label: "Light"
	},
	{
		id: "camera",
		label: "Camera"
	},
	{
		id: "palette",
		label: "Palette"
	},
	{
		id: "medium",
		label: "Medium"
	}
];
var EMPTY_BLOCKS = Object.fromEntries(BLOCKS.map((b) => [b.id, ""]));
var EMPTY_PROMPTS = Object.fromEntries(DIALECTS.map((d) => [d.id, ""]));
function asText(value, max) {
	if (typeof value !== "string") return "";
	return value.replace(/\s+\n/g, "\n").trim().slice(0, max);
}
function parsePack(raw) {
	const start = raw.indexOf("{");
	const end = raw.lastIndexOf("}");
	if (start < 0 || end <= start) return null;
	let data;
	try {
		data = JSON.parse(raw.slice(start, end + 1));
	} catch {
		return null;
	}
	if (!data || typeof data !== "object") return null;
	const record = data;
	if (record.refused === true) return {
		refused: true,
		message: asText(record.message, 240) || "This image can't be written up."
	};
	const blocksIn = record.blocks ?? {};
	const promptsIn = record.prompts ?? {};
	const blocks = { ...EMPTY_BLOCKS };
	const prompts = { ...EMPTY_PROMPTS };
	for (const block of BLOCKS) blocks[block.id] = asText(blocksIn[block.id], 1200);
	for (const dialect of DIALECTS) prompts[dialect.id] = asText(promptsIn[dialect.id], 4e3);
	if (!prompts.universal && !prompts.grok && !prompts.flux) return null;
	if (!prompts.universal) prompts.universal = prompts.grok || prompts.flux || prompts.midjourney || prompts.sdxl;
	return {
		title: asText(record.title, 80) || "Untitled still",
		read: asText(record.read, 800),
		blocks,
		negative: asText(record.negative, 1500),
		prompts
	};
}
function packAsText(pack) {
	return [
		pack.title,
		"",
		pack.read,
		"",
		...DIALECTS.flatMap((d) => [
			d.label.toUpperCase(),
			pack.prompts[d.id],
			""
		]),
		"NEGATIVE",
		pack.negative
	].join("\n").trim();
}
//#endregion
export { parsePack as i, DIALECTS as n, packAsText as r, BLOCKS as t };
