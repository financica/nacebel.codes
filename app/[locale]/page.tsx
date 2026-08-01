import NacebelSearchClient from "@/components/nacebel-search";
import { createT } from "@/lib/i18n/core";
import { hreflangLanguages, SITE_ORIGIN } from "@/lib/i18n/hreflang";
import { SUPPORTED_LOCALES, type Locale } from "@/lib/i18n/locales";
import { siteScope } from "@/lib/i18n/scopes/site";
import { getPaginatedNacebelCodes } from "@/lib/nacebelData";
import { dataset, website } from "@ingram-tech/nk-seo";
import { JsonLd } from "@ingram-tech/nk-seo/components";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface PageProps {
	params: Promise<{ locale: string }>;
}

function isLocale(value: string): value is Locale {
	return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

const homePathFor = (loc: Locale) => `/${loc}`;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const { locale } = await params;
	if (!isLocale(locale)) return {};

	const t = createT(locale, siteScope);
	const metaTitle = t("NACE-BEL 2025 Codes — Search the Belgian classification");
	const metaDescription = t(
		"Search the full NACE-BEL 2025 classification of Belgian economic activity codes in Dutch, French, English, and German. Browse the directory, copy codes, or use the free public API.",
	);

	return {
		title: { absolute: metaTitle },
		description: metaDescription,
		alternates: {
			canonical: homePathFor(locale),
			languages: hreflangLanguages(homePathFor),
		},
		openGraph: {
			title: metaTitle,
			description: metaDescription,
			url: `${SITE_ORIGIN}${homePathFor(locale)}`,
			type: "website",
		},
		twitter: {
			card: "summary_large_image",
			title: metaTitle,
			description: metaDescription,
		},
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
	license: `${SITE_ORIGIN}/en/about`,
	creator: publisher,
	distribution: [
		{
			encodingFormat: "application/json",
			contentUrl: `${SITE_ORIGIN}/api/v1/nacebel-codes/2025`,
		},
	],
	extra: { alternateName: ["NACE-BEL 2025", "NACEBEL 2025"] },
});

export default async function Home({ params }: PageProps) {
	const { locale } = await params;
	if (!isLocale(locale)) notFound();

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
