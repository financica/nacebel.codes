import NacebelSearchClient from "@/components/nacebel-search";
import { createT } from "@/lib/i18n/core";
import { getUrlLocale, resolveLocale } from "@/lib/i18n/locale";
import { OG_LOCALE } from "@/lib/i18n/locales";
import { SITE_ORIGIN } from "@/lib/i18n/routing";
import { siteScope } from "@/lib/i18n/scopes/site";
import { getPaginatedNacebelCodes } from "@/lib/nacebelData";
import { ogImagesFor, pageMetadata } from "@/lib/site-metadata";
import { dataset, website } from "@ingram-tech/nk-seo";
import { JsonLd } from "@ingram-tech/nk-seo/components";
import type { Metadata } from "next";
import { Suspense } from "react";

export async function generateMetadata(): Promise<Metadata> {
	const [locale, urlLocale] = await Promise.all([resolveLocale(), getUrlLocale()]);
	const t = createT(locale, siteScope);
	const metaTitle = t("NACE-BEL 2025 Codes — Search the Belgian classification");

	return {
		...pageMetadata({
			title: metaTitle,
			description: t(
				"Search the full NACE-BEL 2025 classification of Belgian economic activity codes in Dutch, French, English, and German. Browse the directory, copy codes, or use the free public API.",
			),
			path: "/",
			urlLocale,
			locale: OG_LOCALE[locale],
			openGraph: { images: ogImagesFor(locale) },
		}),
		// The home page's title is the whole sentence; the "| NACE-BEL 2025 Codes"
		// template would repeat the site name it already ends with.
		title: { absolute: metaTitle },
	};
}

const publisher = {
	name: "Ingram Technologies",
	url: "https://ingram.tech",
};

const websiteJsonLd = website({
	name: "NACE-BEL 2025 Codes",
	url: SITE_ORIGIN,
	publisher,
	extra: {
		alternateName: "NACEBEL 2025",
		inLanguage: ["en", "nl", "fr", "de"],
		potentialAction: {
			"@type": "SearchAction",
			target: {
				"@type": "EntryPoint",
				urlTemplate: `${SITE_ORIGIN}/?q={search_term_string}`,
			},
			"query-input": "required name=search_term_string",
		},
	},
});

const datasetJsonLd = dataset({
	name: "NACE-BEL 2025 — Belgian economic activity classification",
	description:
		"The full NACE-BEL 2025 classification of Belgian economic activity codes, in Dutch, French, English and German.",
	url: SITE_ORIGIN,
	inLanguage: ["nl", "fr", "en", "de"],
	keywords: ["NACE-BEL", "NACE", "economic activity", "Belgium", "classification"],
	isAccessibleForFree: true,
	license: `${SITE_ORIGIN}/about`,
	creator: publisher,
	distribution: [
		{
			encodingFormat: "application/json",
			contentUrl: `${SITE_ORIGIN}/api/v1/nacebel-codes/2025`,
		},
	],
	extra: { alternateName: ["NACE-BEL 2025", "NACEBEL 2025"] },
});

export default async function Home() {
	const { data: initialCodes } = await getPaginatedNacebelCodes(1, 100000);

	return (
		<div className="min-h-screen bg-background">
			<JsonLd data={[websiteJsonLd, datasetJsonLd]} />
			<Suspense>
				<NacebelSearchClient initialCodes={initialCodes} />
			</Suspense>
		</div>
	);
}
