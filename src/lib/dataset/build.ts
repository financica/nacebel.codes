/**
 * Server-side builders for the paid full dataset. Unlike the free in-browser
 * export (lib/export), these carry every language side by side plus the
 * parent code and the full explanatory note.
 */

import { buildCsvText, type CsvCell } from "@/lib/export/csv";
import { buildXlsx } from "@/lib/export/xlsx";
import { type DatasetRecord, getFullDataset } from "@/lib/nacebelData";
import type { Language } from "@/types";

import type { DatasetFormat } from "./constants";

const LANGUAGES: readonly Language[] = ["en", "nl", "fr", "de"];

const HEADERS = [
	"level",
	"code",
	"parent",
	...LANGUAGES.map((l) => `title_${l}`),
	...LANGUAGES.map((l) => `description_${l}`),
	...LANGUAGES.map((l) => `explanatory_note_${l}`),
];

function toRow(record: DatasetRecord): CsvCell[] {
	return [
		record.level,
		record.code,
		record.parent ?? "",
		...LANGUAGES.map((l) => record.titles[l]),
		...LANGUAGES.map((l) => record.description[l]),
		...LANGUAGES.map((l) => record.explanatoryNote?.[l] ?? ""),
	];
}

export interface DatasetFile {
	body: string | Blob;
	contentType: string;
	filename: string;
}

let cache: Partial<Record<DatasetFormat, DatasetFile>> = {};

/** The dataset is static per deploy, so each format is built once per instance. */
export function buildDatasetFile(format: DatasetFormat): DatasetFile {
	const cached = cache[format];
	if (cached) return cached;

	const records = getFullDataset();
	let file: DatasetFile;
	switch (format) {
		case "csv":
			file = {
				body: buildCsvText(HEADERS, records.map(toRow)),
				contentType: "text/csv; charset=utf-8",
				filename: "nacebel-2025.csv",
			};
			break;
		case "json":
			file = {
				body: JSON.stringify(
					{
						classification: "NACE-BEL 2025",
						source: "https://nacebel.codes",
						generatedAt: new Date().toISOString(),
						count: records.length,
						codes: records,
					},
					null,
					"\t",
				),
				contentType: "application/json; charset=utf-8",
				filename: "nacebel-2025.json",
			};
			break;
		case "xlsx":
			file = {
				body: buildXlsx({
					name: "NACE-BEL 2025",
					headers: HEADERS,
					rows: records.map(toRow),
				}),
				contentType:
					"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
				filename: "nacebel-2025.xlsx",
			};
			break;
	}
	cache = { ...cache, [format]: file };
	return file;
}
