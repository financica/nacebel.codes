/**
 * Minimal client-side XLSX writer — no dependencies.
 *
 * An .xlsx file is a zip archive of a handful of XML parts. We emit the
 * smallest useful set (content types, package rels, workbook, workbook rels,
 * styles, one worksheet) with inline strings, and pack them into a *stored*
 * (uncompressed) zip, which only needs a CRC-32 — no deflate implementation.
 * Fine for the few thousand rows this site exports.
 */

export type XlsxCell = string | number | null | undefined;

export interface XlsxSheet {
	name: string;
	headers: string[];
	rows: XlsxCell[][];
}

const XML_ESCAPES: Record<string, string> = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': "&quot;",
};

// XML 1.0 forbids control characters outright, except tab / LF / CR.
function isXmlInvalid(ch: string): boolean {
	const cp = ch.charCodeAt(0);
	return cp < 0x20 && cp !== 0x09 && cp !== 0x0a && cp !== 0x0d;
}

function escapeXml(value: string): string {
	let out = "";
	for (const ch of value) {
		if (isXmlInvalid(ch)) continue;
		out += XML_ESCAPES[ch] ?? ch;
	}
	return out;
}

/** Excel sheet names: ≤31 chars, none of  \ / ? * [ ] : */
function sanitizeSheetName(name: string): string {
	const cleaned = name.replace(/[\\/?*[\]:]/g, " ").trim();
	return (cleaned || "Sheet1").slice(0, 31);
}

function columnLetter(index: number): string {
	let n = index + 1;
	let letters = "";
	while (n > 0) {
		const rem = (n - 1) % 26;
		letters = String.fromCharCode(65 + rem) + letters;
		n = Math.floor((n - 1) / 26);
	}
	return letters;
}

function cellXml(ref: string, value: XlsxCell, bold: boolean): string {
	const style = bold ? ' s="1"' : "";
	if (value === null || value === undefined || value === "") return "";
	if (typeof value === "number" && Number.isFinite(value)) {
		return `<c r="${ref}"${style}><v>${value}</v></c>`;
	}
	const text = escapeXml(String(value));
	// xml:space="preserve" keeps leading/trailing whitespace intact.
	return `<c r="${ref}"${style} t="inlineStr"><is><t xml:space="preserve">${text}</t></is></c>`;
}

function rowXml(rowIndex: number, cells: XlsxCell[], bold = false): string {
	const parts = cells.map((cell, i) =>
		cellXml(`${columnLetter(i)}${rowIndex}`, cell, bold),
	);
	return `<row r="${rowIndex}">${parts.join("")}</row>`;
}

function sheetXml(sheet: XlsxSheet): string {
	const columnCount = Math.max(
		sheet.headers.length,
		...sheet.rows.map((row) => row.length),
	);
	// Size each column to its longest value (capped) so the sheet opens readable.
	const widths = Array.from({ length: columnCount }, (_, i) => {
		let max = sheet.headers[i]?.length ?? 0;
		for (const row of sheet.rows) {
			const len = String(row[i] ?? "").length;
			if (len > max) max = len;
		}
		return Math.min(Math.max(max + 2, 8), 80);
	});
	const cols = widths
		.map(
			(width, i) =>
				`<col min="${i + 1}" max="${i + 1}" width="${width}" customWidth="1"/>`,
		)
		.join("");

	const rows = [
		rowXml(1, sheet.headers, true),
		...sheet.rows.map((row, i) => rowXml(i + 2, row)),
	].join("");

	const lastRef = `${columnLetter(Math.max(columnCount - 1, 0))}${sheet.rows.length + 1}`;

	return (
		'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
		'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
		`<dimension ref="A1:${lastRef}"/>` +
		'<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' +
		`<cols>${cols}</cols>` +
		`<sheetData>${rows}</sheetData>` +
		"</worksheet>"
	);
}

const CONTENT_TYPES =
	'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
	'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
	'<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
	'<Default Extension="xml" ContentType="application/xml"/>' +
	'<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
	'<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
	'<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
	"</Types>";

const ROOT_RELS =
	'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
	'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
	'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
	"</Relationships>";

const WORKBOOK_RELS =
	'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
	'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
	'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
	'<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
	"</Relationships>";

// Two cell styles: 0 = default, 1 = bold (header row).
const STYLES =
	'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
	'<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
	'<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
	'<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>' +
	'<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
	'<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
	'<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>' +
	'<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
	"</styleSheet>";

function workbookXml(sheetName: string): string {
	return (
		'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
		'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
		`<sheets><sheet name="${escapeXml(sheetName)}" sheetId="1" r:id="rId1"/></sheets>` +
		"</workbook>"
	);
}

// ---------------------------------------------------------------------------
// Stored zip (no compression)
// ---------------------------------------------------------------------------

const CRC_TABLE = (() => {
	const table = new Uint32Array(256);
	for (let n = 0; n < 256; n++) {
		let c = n;
		for (let k = 0; k < 8; k++) {
			c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
		}
		table[n] = c >>> 0;
	}
	return table;
})();

function crc32(bytes: Uint8Array): number {
	let crc = 0xffffffff;
	for (const byte of bytes) {
		crc = (CRC_TABLE[(crc ^ byte) & 0xff] as number) ^ (crc >>> 8);
	}
	return (crc ^ 0xffffffff) >>> 0;
}

/** MS-DOS date/time pair as stored in zip headers. */
function dosDateTime(date: Date): { time: number; date: number } {
	const year = Math.max(date.getFullYear(), 1980);
	return {
		time:
			(date.getHours() << 11) |
			(date.getMinutes() << 5) |
			Math.floor(date.getSeconds() / 2),
		date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
	};
}

interface ZipEntry {
	name: string;
	data: Uint8Array;
}

function buildStoredZip(entries: ZipEntry[]): Uint8Array<ArrayBuffer> {
	const encoder = new TextEncoder();
	const stamp = dosDateTime(new Date());
	const locals: Uint8Array[] = [];
	const centrals: Uint8Array[] = [];
	let offset = 0;

	for (const entry of entries) {
		const name = encoder.encode(entry.name);
		const crc = crc32(entry.data);
		const size = entry.data.length;

		const local = new Uint8Array(30 + name.length + size);
		const lv = new DataView(local.buffer);
		lv.setUint32(0, 0x04034b50, true); // local file header signature
		lv.setUint16(4, 20, true); // version needed
		lv.setUint16(6, 0x0800, true); // flags: UTF-8 names
		lv.setUint16(8, 0, true); // method: stored
		lv.setUint16(10, stamp.time, true);
		lv.setUint16(12, stamp.date, true);
		lv.setUint32(14, crc, true);
		lv.setUint32(18, size, true);
		lv.setUint32(22, size, true);
		lv.setUint16(26, name.length, true);
		lv.setUint16(28, 0, true); // extra length
		local.set(name, 30);
		local.set(entry.data, 30 + name.length);
		locals.push(local);

		const central = new Uint8Array(46 + name.length);
		const cv = new DataView(central.buffer);
		cv.setUint32(0, 0x02014b50, true); // central directory signature
		cv.setUint16(4, 20, true); // version made by
		cv.setUint16(6, 20, true); // version needed
		cv.setUint16(8, 0x0800, true);
		cv.setUint16(10, 0, true);
		cv.setUint16(12, stamp.time, true);
		cv.setUint16(14, stamp.date, true);
		cv.setUint32(16, crc, true);
		cv.setUint32(20, size, true);
		cv.setUint32(24, size, true);
		cv.setUint16(28, name.length, true);
		cv.setUint16(30, 0, true); // extra length
		cv.setUint16(32, 0, true); // comment length
		cv.setUint16(34, 0, true); // disk number start
		cv.setUint16(36, 0, true); // internal attrs
		cv.setUint32(38, 0, true); // external attrs
		cv.setUint32(42, offset, true); // local header offset
		central.set(name, 46);
		centrals.push(central);

		offset += local.length;
	}

	const centralSize = centrals.reduce((sum, c) => sum + c.length, 0);
	const eocd = new Uint8Array(22);
	const ev = new DataView(eocd.buffer);
	ev.setUint32(0, 0x06054b50, true); // end of central directory signature
	ev.setUint16(4, 0, true);
	ev.setUint16(6, 0, true);
	ev.setUint16(8, entries.length, true);
	ev.setUint16(10, entries.length, true);
	ev.setUint32(12, centralSize, true);
	ev.setUint32(16, offset, true);
	ev.setUint16(20, 0, true);

	const out = new Uint8Array(new ArrayBuffer(offset + centralSize + eocd.length));
	let pos = 0;
	for (const chunk of [...locals, ...centrals, eocd]) {
		out.set(chunk, pos);
		pos += chunk.length;
	}
	return out;
}

/** Build a single-sheet .xlsx workbook as a Blob. */
export function buildXlsx(sheet: XlsxSheet): Blob {
	const encoder = new TextEncoder();
	const sheetName = sanitizeSheetName(sheet.name);
	const zip = buildStoredZip([
		{ name: "[Content_Types].xml", data: encoder.encode(CONTENT_TYPES) },
		{ name: "_rels/.rels", data: encoder.encode(ROOT_RELS) },
		{ name: "xl/workbook.xml", data: encoder.encode(workbookXml(sheetName)) },
		{ name: "xl/_rels/workbook.xml.rels", data: encoder.encode(WORKBOOK_RELS) },
		{ name: "xl/styles.xml", data: encoder.encode(STYLES) },
		{ name: "xl/worksheets/sheet1.xml", data: encoder.encode(sheetXml(sheet)) },
	]);
	return new Blob([zip], {
		type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	});
}
