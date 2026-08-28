import { dataset } from "@ingram-tech/nk-seo";
import { JsonLd } from "@ingram-tech/nk-seo/components";
import { CheckIcon } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BuyDatasetButton } from "@/components/dataset/buy-dataset-button";
import { ResendLinksForm } from "@/components/dataset/resend-links-form";
import { PageFooter } from "@/components/page-footer";
import {
	DATASET_PRICE_EUR_CENTS,
	DATASET_PRODUCT_NAME,
	formatPriceEur,
} from "@/lib/dataset/constants";
import { createT, defineMessages } from "@/lib/i18n/core";
import { hreflangLanguages, SITE_ORIGIN } from "@/lib/i18n/hreflang";
import { type Locale, SUPPORTED_LOCALES } from "@/lib/i18n/locales";
import { siteScope } from "@/lib/i18n/scopes/site";
import { ogImagesFor } from "@/lib/site-metadata";

interface PageProps {
	params: Promise<{ locale: string }>;
}

function isLocale(value: string): value is Locale {
	return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

const datasetPathFor = (loc: Locale) => `/${loc}/dataset`;

const pageDescription =
	"Every NACE-BEL 2025 code with its explanatory note, in four languages, as CSV, JSON and Excel. One row per code.";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const { locale } = await params;
	if (!isLocale(locale)) return {};
	const t = createT(locale, siteScope);
	const title = t("Download the full NACE-BEL 2025 dataset");
	const description = t(pageDescription);
	return {
		title,
		description,
		alternates: {
			canonical: datasetPathFor(locale),
			languages: hreflangLanguages(datasetPathFor),
		},
		openGraph: {
			title,
			description,
			url: `${SITE_ORIGIN}${datasetPathFor(locale)}`,
			type: "website",
			images: ogImagesFor(locale),
		},
		twitter: { card: "summary_large_image", title, description },
	};
}

const included = defineMessages([
	"Every code from section (A–U) to the 5-digit Belgian subclass",
	"Belgian title and EU heading in Dutch, French, German and English",
	"The explanatory note for each code in all four languages",
	"A parent column on every row",
	"The same rows as CSV, JSON and Excel",
	"Download links valid for one year; they serve the current revision",
] as const);

const faq = defineMessages([
	{
		q: "Do I get an invoice?",
		a: "Yes, as soon as the payment goes through. Belgian buyers pay 21% VAT; VAT-registered businesses elsewhere in the EU can enter their VAT number at checkout for reverse charge.",
	},
	{
		q: "What happens when NACE-BEL changes?",
		a: "Your links serve the current revision for a year after purchase. Download again to get it.",
	},
] as const);

export default async function DatasetPage({ params }: PageProps) {
	const { locale } = await params;
	if (!isLocale(locale)) notFound();
	const t = createT(locale, siteScope);
	const price = formatPriceEur(DATASET_PRICE_EUR_CENTS, locale);
	const url = `${SITE_ORIGIN}${datasetPathFor(locale)}`;

	const datasetJsonLd = dataset({
		name: DATASET_PRODUCT_NAME,
		description: t(pageDescription),
		url,
		inLanguage: ["nl", "fr", "en", "de"],
		keywords: [
			"NACE-BEL",
			"NACE",
			"economic activity",
			"Belgium",
			"classification",
		],
		isAccessibleForFree: false,
		creator: { name: "Ingram Technologies", url: "https://ingram.tech" },
		extra: {
			offers: {
				"@type": "Offer",
				price: (DATASET_PRICE_EUR_CENTS / 100).toFixed(2),
				priceCurrency: "EUR",
				url,
				availability: "https://schema.org/InStock",
			},
		},
	});

	return (
		<div className="bg-background text-foreground">
			<JsonLd data={[datasetJsonLd]} />
			<section className="border-b border-border bg-board text-board-foreground">
				<div className="container py-10 sm:py-14">
					<p className="font-mono text-xs tracking-wider text-board-muted uppercase">
						NACE-BEL 2025 · {t("Full dataset")}
					</p>
					<h1 className="mt-3 max-w-3xl text-3xl leading-[1.05] font-extrabold tracking-tight sm:text-5xl">
						{t("Every NACE-BEL 2025 code, with notes, in four languages.")}
					</h1>
					<p className="mt-4 max-w-xl leading-relaxed text-board-muted">
						{t(pageDescription)}
					</p>
					<div className="mt-7 flex flex-wrap items-center gap-4">
						<BuyDatasetButton variant="default" size="lg" />
						<p className="text-sm text-board-muted">
							{t(
								"{price} excl. VAT · one-time payment · invoice included",
								{
									price,
								},
							)}
						</p>
					</div>
				</div>
			</section>

			<main className="container py-10">
				<div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
					<section className="rounded-lg border border-border bg-card p-6 sm:p-8">
						<h2 className="text-2xl font-bold tracking-tight">
							{t("What you get")}
						</h2>
						<ul className="mt-5 space-y-3">
							{included.map((item) => (
								<li
									key={item}
									className="flex gap-3 text-sm leading-relaxed"
								>
									<CheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
									<span>{t(item)}</span>
								</li>
							))}
						</ul>
						<div className="mt-6 overflow-x-auto rounded-md border border-border bg-muted/40 p-4 font-mono text-xs leading-relaxed text-muted-foreground">
							level,code,parent,title_en,title_nl,title_fr,title_de,description_en,…,explanatory_note_de
							<br />
							5,62.010,62.01,Computer programming activities,Ontwikkelen…
						</div>
					</section>

					<section className="space-y-6">
						<div className="rounded-lg border border-border bg-card p-6 sm:p-8">
							<h2 className="text-2xl font-bold tracking-tight">
								{t("Lost your links?")}
							</h2>
							<p className="mt-2 text-sm text-muted-foreground">
								{t(
									"Enter the email address you used at checkout and we will resend them.",
								)}
							</p>
							<div className="mt-4">
								<ResendLinksForm />
							</div>
						</div>
					</section>
				</div>

				<section className="mt-10 rounded-lg border border-border bg-card p-6 sm:p-8">
					<h2 className="text-2xl font-bold tracking-tight">
						{t("Questions")}
					</h2>
					<dl className="mt-5 grid gap-6 md:grid-cols-2">
						{faq.map((item) => (
							<div key={item.q}>
								<dt className="font-semibold">{t(item.q)}</dt>
								<dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
									{t(item.a)}
								</dd>
							</div>
						))}
					</dl>
				</section>
			</main>
			<PageFooter />
		</div>
	);
}
