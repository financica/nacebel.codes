import { PageFooter } from "@/components/page-footer";
import { Button } from "@/components/ui/button";
import { createT, defineMessages, type Translator } from "@/lib/i18n/core";
import { hreflangLanguages, SITE_ORIGIN } from "@/lib/i18n/hreflang";
import { HTML_LANG, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n/locales";
import { siteScope } from "@/lib/i18n/scopes/site";
import { ogImagesFor } from "@/lib/site-metadata";
import { article, breadcrumbList } from "@ingram-tech/nk-seo";
import { JsonLd } from "@ingram-tech/nk-seo/components";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

interface PageProps {
	params: Promise<{ locale: string }>;
}

function isLocale(value: string): value is Locale {
	return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

const aboutDescription =
	"Learn how NACE and NACE-BEL classify economic activities in Belgium and across Europe — the hierarchy, the 2003/2008/2025 versions, and where the codes are used.";

const aboutPathFor = (loc: Locale) => `/${loc}/about`;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const { locale } = await params;
	if (!isLocale(locale)) return {};

	const t = createT(locale, siteScope);
	const title = t("About NACE-BEL Codes");
	const description = t(aboutDescription);

	return {
		title,
		description,
		alternates: {
			canonical: aboutPathFor(locale),
			languages: hreflangLanguages(aboutPathFor),
		},
		openGraph: {
			title,
			description,
			url: `${SITE_ORIGIN}${aboutPathFor(locale)}`,
			type: "article",
			images: ogImagesFor(locale),
		},
		twitter: {
			card: "summary",
			title,
			description,
		},
	};
}

function buildJsonLd(locale: Locale, t: Translator<typeof siteScope>) {
	const url = `${SITE_ORIGIN}${aboutPathFor(locale)}`;
	const title = t("About NACE-BEL Codes");

	const breadcrumbJsonLd = breadcrumbList([
		{ name: t("NACE-BEL 2025 Codes"), url: `${SITE_ORIGIN}/${locale}` },
		{ name: title, url },
	]);

	const articleJsonLd = article({
		headline: title,
		description: t(aboutDescription),
		url,
		publisher: { name: "Ingram Technologies", url: "https://ingram.tech" },
		extra: {
			inLanguage: HTML_LANG[locale],
			about: [
				{ "@type": "Thing", name: "NACE" },
				{ "@type": "Thing", name: "NACE-BEL" },
				{ "@type": "Thing", name: "Belgian economic activity classification" },
			],
		},
	});

	return { breadcrumbJsonLd, articleJsonLd };
}

const levels = defineMessages([
	{
		depth: 2,
		level: "Level 2",
		code: "01",
		title: "Section",
		description: "The broadest practical grouping used in the public directory.",
	},
	{
		depth: 3,
		level: "Level 3",
		code: "01.1",
		title: "Division",
		description: "Adds a more specific economic branch within the section.",
	},
	{
		depth: 4,
		level: "Level 4",
		code: "01.11",
		title: "Group",
		description: "Narrows the activity into a more precise operational category.",
	},
	{
		depth: 5,
		level: "Level 5",
		code: "01.111",
		title: "Class",
		description: "The most specific level published in this directory.",
	},
] as const);

const versions = defineMessages([
	{
		title: "NACE-BEL 2003",
		description:
			"Based on NACE Rev. 1.1 and used earlier in the 2000s to reflect the economy of that period.",
	},
	{
		title: "NACE-BEL 2008",
		description:
			"Aligned with NACE Rev. 2 and introduced important updates for services and digital activity.",
	},
	{
		title: "NACE-BEL 2025",
		description:
			"The current version, updated for newer economic realities while staying aligned with European standards.",
	},
] as const);

const applications = defineMessages([
	{
		title: "Business registration",
		description:
			"Belgian companies use NACE-BEL codes when incorporating and updating official records.",
	},
	{
		title: "Tax and compliance",
		description:
			"Authorities use classifications to segment businesses for administrative and regulatory work.",
	},
	{
		title: "Statistics and reporting",
		description:
			"Economic data can be collected and compared consistently across sectors and countries.",
	},
	{
		title: "Procurement and tenders",
		description:
			"Public and private tender flows often rely on activity codes to define scope.",
	},
] as const);

export default async function AboutPage({ params }: PageProps) {
	const { locale } = await params;
	if (!isLocale(locale)) notFound();
	const t = createT(locale, siteScope);
	const { breadcrumbJsonLd, articleJsonLd } = buildJsonLd(locale, t);

	return (
		<div className="bg-background text-foreground">
			<JsonLd data={[breadcrumbJsonLd, articleJsonLd]} />
			<div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:py-12">
				<header className="border-b border-border pb-8">
					<h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
						{t("About NACE-BEL Codes")}
					</h1>
					<p className="measure mt-3 text-lg text-muted-foreground">
						{t(
							"NACE and NACE-BEL classify economic activity in Belgium and across Europe.",
						)}
					</p>
				</header>

				<section className="grid gap-6 lg:grid-cols-2">
					<article className="rounded-lg border border-border bg-card p-6 sm:p-8">
						<h2 className="font-bold text-3xl tracking-tight">
							{t("What is NACE?")}
						</h2>
						<p className="mt-4 leading-8 text-muted-foreground">
							{t(
								"NACE, short for the European statistical classification of economic activities, is used across the European Union to group business activity into a consistent hierarchy.",
							)}
						</p>
						<p className="mt-4 leading-8 text-muted-foreground">
							{t(
								"It is the backbone for comparable statistics, business registers, and a range of administrative processes that depend on describing what an organization actually does.",
							)}
						</p>
					</article>
					<article className="rounded-lg border border-border bg-card p-6 sm:p-8">
						<h2 className="font-bold text-3xl tracking-tight">
							{t("What is NACE-BEL?")}
						</h2>
						<p className="mt-4 leading-8 text-muted-foreground">
							{t(
								"NACE-BEL is Belgium's national implementation of NACE. It keeps the European structure but adds the specificity needed for Belgian administrative and economic use.",
							)}
						</p>
						<p className="mt-4 leading-8 text-muted-foreground">
							{t(
								"Belgian businesses rely on NACE-BEL codes for registration, compliance, tax-related workflows, and official reporting.",
							)}
						</p>
					</article>
				</section>

				<section className="rounded-lg border border-border bg-card p-6 sm:p-8">
					<div className="space-y-3">
						<h2 className="font-bold text-3xl tracking-tight">
							{t("Code structure")}
						</h2>
						<p className="max-w-3xl text-muted-foreground">
							{t(
								"The codes form a hierarchy from broader sectors down to more specific classes. That lets businesses classify themselves at the right degree of detail.",
							)}
						</p>
					</div>
					<div className="mt-6 grid gap-4 md:grid-cols-2">
						{levels.map((item) => (
							<div
								key={item.level}
								className="rounded-lg border border-border bg-muted/40 p-5"
							>
								<div className="flex items-center justify-between gap-4">
									<span
										className="inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-xs font-medium"
										style={{
											color: `var(--color-level-${item.depth})`,
											borderColor: `var(--color-level-${item.depth})`,
										}}
									>
										{t(item.level)}
									</span>
									<code className="rounded border border-border bg-muted px-2 py-0.5 text-sm">
										{item.code}
									</code>
								</div>
								<h3 className="mt-4 text-xl font-semibold">
									{t(item.title)}
								</h3>
								<p className="mt-2 text-sm leading-7 text-muted-foreground">
									{t(item.description)}
								</p>
							</div>
						))}
					</div>
				</section>

				<section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
					<article className="rounded-lg border border-border bg-card p-6 sm:p-8">
						<h2 className="font-bold text-3xl tracking-tight">
							{t("NACE-BEL versions")}
						</h2>
						<div className="mt-6 space-y-4">
							{versions.map((version) => (
								<div
									key={version.title}
									className="rounded-lg border border-border bg-muted/40 p-5"
								>
									<h3 className="text-xl font-semibold">
										{t(version.title)}
									</h3>
									<p className="mt-2 leading-7 text-muted-foreground">
										{t(version.description)}
									</p>
								</div>
							))}
						</div>
					</article>
					<article className="rounded-lg border border-border bg-card p-6 sm:p-8">
						<h2 className="font-bold text-3xl tracking-tight">
							{t("International context")}
						</h2>
						<p className="mt-4 leading-8 text-muted-foreground">
							{t(
								"NACE is derived from the United Nations ISIC framework, which means European activity data can still be compared in a broader international context.",
							)}
						</p>
						<p className="mt-4 leading-8 text-muted-foreground">
							{t(
								"Eurostat and national statistical offices periodically review the classification so it keeps pace with how the economy changes.",
							)}
						</p>
						<div className="mt-6 rounded-lg border border-primary/20 bg-primary/5 p-5">
							<p className="text-sm leading-7 text-primary/80">
								{t(
									"The main idea is simple: everyone uses the same structure, so analysis, reporting, and administration stay consistent.",
								)}
							</p>
						</div>
					</article>
				</section>

				<section className="rounded-lg border border-border bg-card p-6 sm:p-8">
					<div className="space-y-3">
						<h2 className="font-bold text-3xl tracking-tight">
							{t("Applications and uses")}
						</h2>
						<p className="max-w-3xl text-muted-foreground">
							{t(
								"NACE-BEL codes matter well beyond statistics. They appear across the practical machinery of running and regulating businesses.",
							)}
						</p>
					</div>
					<div className="mt-6 grid gap-4 md:grid-cols-2">
						{applications.map((application) => (
							<div
								key={application.title}
								className="rounded-lg border border-border bg-muted/40 p-5"
							>
								<h3 className="text-xl font-semibold">
									{t(application.title)}
								</h3>
								<p className="mt-2 leading-7 text-muted-foreground">
									{t(application.description)}
								</p>
							</div>
						))}
					</div>
				</section>

				<section className="rounded-lg border border-primary/20 bg-primary/5 p-6 sm:p-8">
					<div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
						<div className="space-y-4">
							<h2 className="font-bold text-3xl tracking-tight text-primary">
								{t("Finding the right code")}
							</h2>
							<p className="text-primary/80">
								{t(
									"The best code is the one that reflects the main activity of the business. If you are unsure, use the search directory to explore related activities and cross-check against official Belgian guidance.",
								)}
							</p>
							<div className="flex flex-wrap gap-3">
								<Button
									render={
										<a href={`/${locale}`}>
											{t("Start searching")}
										</a>
									}
								/>
								<Button
									variant="outline"
									render={
										<a href="mailto:contact@nacebel.codes">
											{t("Contact us")}
										</a>
									}
								/>
							</div>
						</div>
						<div className="rounded-lg border border-primary/15 bg-card p-5 shadow-sm">
							<p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
								{t("Practical advice")}
							</p>
							<p className="mt-3 text-sm leading-7 text-muted-foreground">
								{t(
									"If the classification affects a formal filing or legal obligation, confirm the final choice with a professional advisor or the relevant Belgian authority.",
								)}
							</p>
						</div>
					</div>
				</section>
			</div>

			<PageFooter />
		</div>
	);
}
