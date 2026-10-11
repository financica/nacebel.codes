import { SITE_ORIGIN } from "@/lib/i18n/routing";

import { DATASET_FORMATS, type DatasetFormat } from "./constants";
import { mintDownloadToken } from "./token";

export type DownloadLinks = Record<DatasetFormat, string>;

/** The public origin links are minted against. Overridable for local dev. */
export function appOrigin(): string {
	return process.env.APP_URL?.replace(/\/$/, "") || SITE_ORIGIN;
}

export function downloadLinksFor(
	sessionId: string,
	origin = appOrigin(),
): DownloadLinks {
	const token = encodeURIComponent(mintDownloadToken(sessionId));
	const links = {} as DownloadLinks;
	for (const format of DATASET_FORMATS) {
		links[format] = `${origin}/api/dataset/download/${format}?t=${token}`;
	}
	return links;
}
