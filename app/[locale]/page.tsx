import NacebelSearchClient from "@/components/nacebel-search";
import { createT } from "@/lib/i18n/core";
import { hreflangLanguages, SITE_ORIGIN } from "@/lib/i18n/hreflang";
import { SUPPORTED_LOCALES, type Locale } from "@/lib/i18n/locales";
import { siteScope } from "@/lib/i18n/scopes/site";
import { getPaginatedNacebelCodes } from "@/lib/nacebelData";
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

// Both nodes stay hand-built: nk-seo's `website` builder takes only
// name/url/publisher (no `alternateName`, `inLanguage` or the SearchAction),
// and it ships no Dataset builder at all. <JsonLd> still does the serializing.
const websiteJsonLd = {
	"@context": "https://schema.org",
	"@type": "WebSite",
	name: "NACE-BEL 2025 Codes",
	alternateName: "NACEBEL 2025",
	url: "https://nacebel.codes",
	inLanguage: ["en", "nl", "fr", "de"],
	publisher: {
		"@type": "Organization",
		name: "Ingram Technologies",
		url: "https://ingram.tech",
	},
	potentialAction: {
		"@type": "SearchAction",
		target: {
			"@type": "EntryPoint",
			urlTemplate: "https://nacebel.codes/?q={search_term_string}",
		},
		"query-input": "required name=search_term_string",
	},
};

const datasetJsonLd = {
	"@context": "https://schema.org",
	"@type": "Dataset",
	name: "NACE-BEL 2025 — Belgian economic activity classification",
	alternateName: ["NACE-BEL 2025", "NACEBEL 2025"],
	url: "https://nacebel.codes",
	inLanguage: ["nl", "fr", "en", "de"],
	keywords: ["NACE-BEL", "NACE", "economic activity", "Belgium", "classification"],
	isAccessibleForFree: true,
	license: "https://nacebel.codes/about",
	creator: {
		"@type": "Organization",
		name: "Ingram Technologies",
		url: "https://ingram.tech",
	},
	distribution: [
		{
			"@type": "DataDownload",
			encodingFormat: "application/json",
			contentUrl: "https://nacebel.codes/api/v1/nacebel-codes/2025",
		},
	],
};

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
