import type { Language, NacebelCode } from "@/types";

import { buildCsvText } from "./csv";
import { buildXlsx } from "./xlsx";

export type ExportFormat = "csv" | "json" | "xlsx";

export const EXPORT_FORMATS: readonly ExportFormat[] = ["csv", "json", "xlsx"];

export const EXPORT_FORMAT_LABELS: Record<ExportFormat, string> = {
	csv: "CSV",
	json: "JSON",
	xlsx: "Excel (XLSX)",
};

/** Column headers, already translated by the caller. */
export interface ExportColumns {
	level: string;
	code: string;
	title: string;
}

interface ExportInput {
	codes: NacebelCode[];
	locale: Language;
	columns: ExportColumns;
}

function toRows({ codes, locale }: ExportInput): [number, string, string][] {
	return codes.map((code) => [code.level, code.code, code.titles[locale] || ""]);
}

function buildCsv(input: ExportInput): Blob {
	const { columns } = input;
	const text = buildCsvText(
		[columns.level, columns.code, columns.title],
		toRows(input),
	);
	return new Blob([text], { type: "text/csv;charset=utf-8;" });
}

function buildJson({ codes }: ExportInput): Blob {
	// JSON gets the full record — every locale's title and description — since
	// it's the format someone reaches for to feed another program.
	const payload = codes.map(({ level, code, titles, description }) => ({
		level,
		code,
		titles,
		description,
	}));
	return new Blob([JSON.stringify(payload, null, "\t")], {
		type: "application/json;charset=utf-8;",
	});
}

function buildXlsxBlob(input: ExportInput): Blob {
	const { columns } = input;
	return buildXlsx({
		name: `NACE-BEL 2025 (${input.locale.toUpperCase()})`,
		headers: [columns.level, columns.code, columns.title],
		rows: toRows(input),
	});
}

const BUILDERS: Record<ExportFormat, (input: ExportInput) => Blob> = {
	csv: buildCsv,
	json: buildJson,
	xlsx: buildXlsxBlob,
};

function downloadBlob(blob: Blob, filename: string): void {
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

/** Build the export entirely in the browser and trigger a download. */
export function exportCodes(format: ExportFormat, input: ExportInput): void {
	const blob = BUILDERS[format](input);
	downloadBlob(blob, `nacebel_codes_${input.locale}.${format}`);
}
