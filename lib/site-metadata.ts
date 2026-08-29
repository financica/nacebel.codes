import { createMetadata, ogImageMetadata } from "@ingram-tech/nk-seo";
import type { Metadata, Viewport } from "next";
import { createT } from "@/lib/i18n/core";
import { type Locale, OG_LOCALE } from "@/lib/i18n/locales";
import { routing, SITE_ORIGIN } from "@/lib/i18n/routing";
import { siteScope } from "@/lib/i18n/scopes/site";

const siteName = "NACE-BEL 2025 Codes";

/**
 * The page-metadata factory. Handing it `routing` is what makes every page emit
 * the whole locale cluster — one `alternates.languages` entry per locale plus
 * the bare `x-default` — and a canonical that follows the address rather than
 * the language that rendered. One config, so what the site advertises and what
 * it serves are the same strings by construction.
 */
export const pageMetadata = createMetadata({
	baseUrl: SITE_ORIGIN,
	siteName,
	titleTemplate: "%s | NACE-BEL 2025 Codes",
	hreflang: routing,
});

/**
 * The locale's share card, from `app/opengraph-image.tsx`.
 *
 * Next attaches that file automatically only to the segment that declares it,
 * and a page returning its own `openGraph` object replaces the inherited one
 * rather than merging into it — so every page names the card explicitly. The
 * address it names carries a locale prefix, which the proxy rewrites onto the
 * bare image route, so a crawler fetching the French card gets the French card.
 */
export function ogImagesFor(locale: Locale) {
	const t = createT(locale, siteScope);
	return ogImageMetadata({
		baseUrl: SITE_ORIGIN,
		path: `/${locale}/opengraph-image`,
		alt: t("NACE-BEL 2025 Codes — Search the Belgian classification"),
	});
}

/** Base site metadata for the root layout, in the resolved locale. */
export function buildRootMetadata(locale: Locale): Metadata {
	const t = createT(locale, siteScope);
	const description = t(
		"Search the full NACE-BEL 2025 classification of Belgian economic activity codes in Dutch, French, English, and German. Browse the directory, copy codes, or use the free public API.",
	);

	return {
		metadataBase: new URL("https://nacebel.codes"),
		title: {
			default: siteName,
			template: "%s | NACE-BEL 2025 Codes",
		},
		description,
		applicationName: siteName,
		keywords: [
			"NACE-BEL",
			"NACE-BEL 2025",
			"NACEBEL",
			"NACE codes",
			"Belgian economic activity codes",
			"NACE Rev. 2.1",
			"KBO NACE",
			"Belgium business classification",
			"economic activity codes",
		],
		category: "reference",
		authors: [{ name: "Ingram Technologies", url: "https://ingram.tech" }],
		creator: "Ingram Technologies",
		publisher: "Ingram Technologies",
		formatDetection: {
			email: false,
			telephone: false,
			address: false,
		},
		openGraph: {
			title: siteName,
			description,
			url: "https://nacebel.codes",
			siteName,
			locale: OG_LOCALE[locale],
			type: "website",
		},
		twitter: {
			card: "summary_large_image",
			title: siteName,
			description,
		},
		robots: {
			index: true,
			follow: true,
			googleBot: {
				index: true,
				follow: true,
				"max-snippet": -1,
				"max-image-preview": "large",
			},
		},
	};
}

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#ffffff" },
		{ media: "(prefers-color-scheme: dark)", color: "#0b1120" },
	],
	colorScheme: "light dark",
};
