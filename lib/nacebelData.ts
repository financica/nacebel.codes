import { NACEBEL, type NACEBELCode } from "@financica/nace-codes/nacebel";
import de from "@financica/nace-codes/lang/de";
import fr from "@financica/nace-codes/lang/fr";
import nl from "@financica/nace-codes/lang/nl";
import deNotes from "@financica/nace-codes/nacebel/lang/de";
import frNotes from "@financica/nace-codes/nacebel/lang/fr";
import nlNotes from "@financica/nace-codes/nacebel/lang/nl";

let nacebelInstance: NACEBEL | null = null;

function getNacebelInstance(): NACEBEL {
	if (!nacebelInstance) {
		// Since 3.0.0 only English ships in the bundle. This site renders and
		// searches all four languages server-side, so every pack is loaded
		// eagerly: `lang/*` carries the EU headings (`description`), and
		// `nacebel/lang/*` the Belgian explanatory notes. `nationalTitles` need
		// no pack.
		nacebelInstance = new NACEBEL({
			preload: true,
			languages: [de, fr, nl, deNotes, frNotes, nlNotes],
		});
	}
	return nacebelInstance;
}

interface PublicNacebelCode {
	level: number;
	code: string;
	titles: {
		en: string;
		de: string;
		fr: string;
		nl: string;
	};
	description: {
		en: string;
		de: string;
		fr: string;
		nl: string;
	};
	/**
	 * Full explanatory note (KBO "Explication" / "Toelichting"), as Markdown with
	 * `[[code]]` wikilinks. Present only for codes that have one.
	 */
	explanatoryNote?: {
		en: string;
		de: string;
		fr: string;
		nl: string;
	};
	childrenCodes?: string[];
}

function formatCodeForDisplay(code: string): string {
	if (code.length <= 2) return code;
	return `${code.slice(0, 2)}.${code.slice(2)}`;
}

/**
 * Direct children of a code. The library resolves children by code prefix,
 * which can't connect a section (a letter) to its divisions (numbers) — resolve
 * those via the `parent` field instead.
 */
function childrenOf(code: NACEBELCode): NACEBELCode[] {
	const nacebel = getNacebelInstance();
	if (code.level === 1) {
		return nacebel
			.getAllCodes(2)
			.filter((child) => child.parent === code.code)
			.sort((a, b) => a.code.localeCompare(b.code));
	}
	return nacebel.getChildren(code.code);
}

function mapToPublicNacebelCode(
	code: NACEBELCode,
	includeChildren = false,
): PublicNacebelCode {
	const publicCode: PublicNacebelCode = {
		level: code.level,
		code: formatCodeForDisplay(code.code),
		titles: {
			en: code.nationalTitles?.en || code.description.en || "",
			de: code.nationalTitles?.de || code.description.de || "",
			fr: code.nationalTitles?.fr || code.description.fr || "",
			nl: code.nationalTitles?.nl || code.description.nl || "",
		},
		description: {
			en: code.description.en || "",
			de: code.description.de || "",
			fr: code.description.fr || "",
			nl: code.description.nl || "",
		},
		explanatoryNote: code.explanatoryNote
			? {
					en: code.explanatoryNote.en || "",
					de: code.explanatoryNote.de || "",
					fr: code.explanatoryNote.fr || "",
					nl: code.explanatoryNote.nl || "",
				}
			: undefined,
	};

	if (includeChildren) {
		publicCode.childrenCodes = childrenOf(code).map((c) =>
			formatCodeForDisplay(c.code),
		);
	}

	return publicCode;
}

/**
 * Sort key that groups every code under its top-level section (`A`–`U`) and
 * places the section header before its divisions. The `parent` field is only
 * populated for levels 1–4, so we resolve the section via the division (the
 * first two digits of the normalized code), whose `parent` is the section.
 */
function sectionSortKey(code: NACEBELCode): string {
	if (code.level === 1) return `${code.code}|`;
	const division = getNacebelInstance().getCode(code.code.slice(0, 2));
	const section = division?.parent ?? "~"; // unknown → sort last
	return `${section}|${code.code}`;
}

export async function getPaginatedNacebelCodes(
	page: number,
	limit: number,
	minLevel?: number,
): Promise<{ data: PublicNacebelCode[]; totalPages: number; totalItems: number }> {
	const nacebel = getNacebelInstance();
	const effectiveMinLevel = minLevel && minLevel > 1 ? minLevel : 1;

	const allCodes = nacebel
		.getAllCodes()
		.filter((code) => code.level >= effectiveMinLevel)
		.sort((a, b) => {
			const ka = sectionSortKey(a);
			const kb = sectionSortKey(b);
			return ka < kb ? -1 : ka > kb ? 1 : 0;
		});

	const totalItems = allCodes.length;
	const totalPages = Math.ceil(totalItems / limit);
	const startIndex = (page - 1) * limit;

	const data = allCodes
		.slice(startIndex, startIndex + limit)
		.map((code) => mapToPublicNacebelCode(code, false));

	return { data, totalPages, totalItems };
}

const SEARCH_LANGUAGES = ["nl", "fr", "en", "de"] as const;

export async function searchNacebelCodes(
	query: string,
	page: number,
	limit: number,
	minLevel?: number,
): Promise<{ data: PublicNacebelCode[]; totalPages: number; totalItems: number }> {
	const nacebel = getNacebelInstance();
	const cleanQuery = query.trim().toLowerCase();
	const normalizedQuery = query.replace(/\./g, "");

	let results: NACEBELCode[] = [];

	const exactCode = nacebel.getCode(normalizedQuery);
	if (exactCode) {
		results = [exactCode];
	} else {
		const seen = new Map<string, NACEBELCode>();
		for (const language of SEARCH_LANGUAGES) {
			const matches = nacebel.search(cleanQuery, {
				language,
				limit: 100,
				fuzzy: true,
			});
			for (const match of matches) {
				if (!seen.has(match.code)) {
					seen.set(match.code, match);
				}
			}
		}
		results = Array.from(seen.values());
	}

	if (minLevel !== undefined && minLevel > 1) {
		results = results.filter((code) => code.level >= minLevel);
	}

	results.sort((a, b) => {
		const aCodeMatch = a.code.toLowerCase() === normalizedQuery;
		const bCodeMatch = b.code.toLowerCase() === normalizedQuery;
		if (aCodeMatch !== bCodeMatch) return aCodeMatch ? -1 : 1;
		if (a.level !== b.level) return a.level - b.level;
		return a.code.localeCompare(b.code);
	});

	const totalItems = results.length;
	const totalPages = Math.ceil(totalItems / limit);
	const startIndex = (page - 1) * limit;

	const data = results
		.slice(startIndex, startIndex + limit)
		.map((code) => mapToPublicNacebelCode(code, false));

	return { data, totalPages, totalItems };
}

export async function getNacebelCodeDetails(
	idWithoutDots: string,
): Promise<PublicNacebelCode | null> {
	const code = getNacebelInstance().getCode(idWithoutDots);
	if (!code) return null;
	return mapToPublicNacebelCode(code, true);
}

export async function getNacebelAncestors(
	idWithoutDots: string,
): Promise<PublicNacebelCode[]> {
	const ancestors = getNacebelInstance().getAncestors(idWithoutDots);
	return ancestors.map((code) => mapToPublicNacebelCode(code, false)).reverse();
}

export interface DatasetRecord {
	level: number;
	code: string;
	/** Parent code in the hierarchy (section letter for a division), absent for a section. */
	parent?: string;
	titles: PublicNacebelCode["titles"];
	description: PublicNacebelCode["description"];
	explanatoryNote?: PublicNacebelCode["explanatoryNote"];
}

/**
 * Every code with its parent and full explanatory note — the paid dataset.
 * Sorted by section then code, like the directory.
 */
export function getFullDataset(): DatasetRecord[] {
	const nacebel = getNacebelInstance();
	return nacebel
		.getAllCodes()
		.sort((a, b) => {
			const ka = sectionSortKey(a);
			const kb = sectionSortKey(b);
			return ka < kb ? -1 : ka > kb ? 1 : 0;
		})
		.map((code) => {
			const {
				level,
				code: displayCode,
				titles,
				description,
				explanatoryNote,
			} = mapToPublicNacebelCode(code, false);
			// `parent` is only populated for levels 1–4 in the source; deeper
			// levels nest by code prefix.
			const parent =
				code.level === 1
					? undefined
					: code.level === 2
						? code.parent
						: formatCodeForDisplay(code.code.slice(0, -1));
			return {
				level,
				code: displayCode,
				...(parent ? { parent } : {}),
				titles,
				description,
				...(explanatoryNote ? { explanatoryNote } : {}),
			};
		});
}
