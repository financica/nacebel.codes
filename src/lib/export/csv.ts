export type CsvCell = string | number | null | undefined;

function csvCell(value: CsvCell): string {
	if (value === null || value === undefined) return "";
	const text = String(value);
	return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * RFC 4180 CSV text with a UTF-8 BOM so Excel detects the encoding on
 * double-click. CRLF line endings for the same reason.
 */
export function buildCsvText(headers: string[], rows: CsvCell[][]): string {
	const lines = [headers, ...rows].map((row) => row.map(csvCell).join(","));
	return `﻿${lines.join("\r\n")}`;
}
