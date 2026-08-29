import { CodeBlock } from "@/components/code-block";
import { PageFooter } from "@/components/page-footer";
import { Badge } from "@/components/ui/badge";
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

const apiDescription =
	"Free public REST API for the NACE-BEL 2025 classification system. List, search, and look up Belgian economic activity codes in JSON across four languages.";

const apiDocsPathFor = (loc: Locale) => `/${loc}/api/docs`;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const { locale } = await params;
	if (!isLocale(locale)) return {};

	const t = createT(locale, siteScope);
	const title = t("NACE-BEL 2025 API Documentation");
	const description = t(apiDescription);

	return {
		title,
		description,
		alternates: {
			canonical: apiDocsPathFor(locale),
			languages: hreflangLanguages(apiDocsPathFor),
		},
		openGraph: {
			title,
			description,
			url: `${SITE_ORIGIN}${apiDocsPathFor(locale)}`,
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
	const url = `${SITE_ORIGIN}${apiDocsPathFor(locale)}`;
	const title = t("NACE-BEL 2025 API Documentation");

	const breadcrumbJsonLd = breadcrumbList([
		{ name: t("NACE-BEL 2025 Codes"), url: `${SITE_ORIGIN}/${locale}` },
		{ name: title, url },
	]);

	const apiJsonLd = article({
		type: "TechArticle",
		headline: title,
		description: t(apiDescription),
		url,
		publisher: { name: "Ingram Technologies", url: "https://ingram.tech" },
		extra: {
			inLanguage: HTML_LANG[locale],
			proficiencyLevel: "Beginner",
			about: {
				"@type": "WebAPI",
				name: "NACE-BEL 2025 API",
				documentation: url,
				url: `${SITE_ORIGIN}/api/v1/nacebel-codes/2025`,
			},
		},
	});

	return { breadcrumbJsonLd, apiJsonLd };
}

const listResponseExample = `{
  "data": [
    {
      "level": 2,
      "code": "01.1",
      "titles": {
        "en": "Growing of non-perennial crops",
        "de": "Anbau von einjahrigen Pflanzen",
        "fr": "Cultures non permanentes",
        "nl": "Teelt van eenjarige gewassen"
      },
      "description": { "en": "", "de": "", "fr": "", "nl": "" }
    }
  ],
  "totalPages": 25,
  "totalItems": 2458
}`;

const detailResponseExample = `{
  "level": 4,
  "code": "01.11",
  "titles": {
    "en": "Growing of cereals (except rice), leguminous crops and oil seeds",
    "de": "Anbau von Getreide (ohne Reis), Hulsenfruchten und Olsaaten",
    "fr": "Culture de cereales (a l'exception du riz), de legumineuses et de graines oleagineuses",
    "nl": "Teelt van granen (met uitzondering van rijst), peulgewassen en oliehoudende zaden"
  },
  "description": { "en": "", "de": "", "fr": "", "nl": "" },
  "childrenCodes": [
    "01.111",
    "01.112",
    "01.113",
    "01.119"
  ]
}`;

const notFoundResponseExample = `{
  "error": "NACEBEL code not found."
}`;

const queryParameters = defineMessages([
	{
		name: "q",
		type: "string",
		description: "Search query for a code or title. Omit it to list the directory.",
	},
	{
		name: "page",
		type: "number",
		description: "Page number for pagination. Default: 1.",
	},
	{
		name: "limit",
		type: "number",
		description: "Items per page. Default: 100. Maximum: 500.",
	},
	{
		name: "level",
		type: "number",
		description: "Minimum NACE-BEL level to include, from 2 to 5.",
	},
] as const);

const endpointCards = defineMessages([
	{
		title: "List and search codes",
		path: "/api/v1/nacebel-codes/2025",
		description:
			"Retrieve paginated codes or search titles and code numbers across the public directory.",
		request: `curl "https://nacebel.codes/api/v1/nacebel-codes/2025?q=software&level=4"`,
		response: listResponseExample,
	},
	{
		title: "Get code details",
		path: "/api/v1/nacebel-codes/2025/{id}",
		description:
			"Fetch one code by its dot-less identifier and include its direct children.",
		request: `curl "https://nacebel.codes/api/v1/nacebel-codes/2025/0111"`,
		response: detailResponseExample,
	},
] as const);

export default async function ApiDocsPage({ params }: PageProps) {
	const { locale } = await params;
	if (!isLocale(locale)) notFound();
	const t = createT(locale, siteScope);
	const { breadcrumbJsonLd, apiJsonLd } = buildJsonLd(locale, t);

	return (
		<div className="bg-background text-foreground">
			<JsonLd data={[breadcrumbJsonLd, apiJsonLd]} />
			<div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:py-12">
				<header className="border-b border-border pb-8">
					<h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
						{t("NACE-BEL 2025 API")}
					</h1>
					<p className="measure mt-3 text-lg text-muted-foreground">
						{t(
							"Public API documentation for search and lookup across the NACE-BEL 2025 directory.",
						)}
					</p>
				</header>

				<section className="grid gap-3 sm:grid-cols-3">
					<div className="rounded-lg border border-border bg-muted/40 p-4">
						<p className="text-sm text-muted-foreground">
							{t("Endpoints")}
						</p>
						<p className="mt-2 text-2xl font-semibold">2</p>
						<p className="mt-1 text-sm text-muted-foreground">
							{t("List/search and detail lookup")}
						</p>
					</div>
					<div className="rounded-lg border border-border bg-muted/40 p-4">
						<p className="text-sm text-muted-foreground">
							{t("Max page size")}
						</p>
						<p className="mt-2 text-2xl font-semibold">500</p>
						<p className="mt-1 text-sm text-muted-foreground">
							{t("Good for bulk reads and exports")}
						</p>
					</div>
					<div className="rounded-lg border border-border bg-muted/40 p-4">
						<p className="text-sm text-muted-foreground">
							{t("Authentication")}
						</p>
						<p className="mt-2 text-2xl font-semibold">{t("None")}</p>
						<p className="mt-1 text-sm text-muted-foreground">
							{t("Contact us for higher limits and support")}
						</p>
					</div>
				</section>

				<section className="rounded-lg border border-border bg-card p-6 sm:p-8">
					<div className="space-y-4">
						<h2 className="font-bold text-3xl tracking-tight">
							{t("Base URL and authentication")}
						</h2>
						<p className="text-muted-foreground">
							{t(
								"Requests are public, so you do not need to send a header such as",
							)}{" "}
							<code className="rounded bg-muted px-1.5 py-0.5 text-sm">
								Authorization
							</code>
							.
						</p>
						<CodeBlock>{`https://nacebel.codes/api/v1/nacebel-codes/2025`}</CodeBlock>
					</div>
				</section>

				<section className="space-y-6 rounded-lg border border-border bg-card p-6 sm:p-8">
					<div className="space-y-2">
						<h2 className="font-bold text-3xl tracking-tight">
							{t("Query parameters")}
						</h2>
						<p className="text-muted-foreground">
							{t(
								"The list endpoint supports paging, search, and level filtering.",
							)}
						</p>
					</div>
					<div className="overflow-hidden rounded-lg border border-border">
						<table className="w-full text-left text-sm">
							<thead className="bg-muted/70">
								<tr>
									<th className="px-4 py-3 font-semibold">
										{t("Parameter")}
									</th>
									<th className="px-4 py-3 font-semibold">
										{t("Type")}
									</th>
									<th className="px-4 py-3 font-semibold">
										{t("Description")}
									</th>
								</tr>
							</thead>
							<tbody className="bg-card">
								{queryParameters.map((parameter) => (
									<tr
										key={parameter.name}
										className="border-t border-border"
									>
										<td className="px-4 py-3 font-mono text-sm">
											{parameter.name}
										</td>
										<td className="px-4 py-3 font-mono text-sm">
											{parameter.type}
										</td>
										<td className="px-4 py-3 text-muted-foreground">
											{t(parameter.description)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</section>

				<section className="space-y-6">
					{endpointCards.map((endpoint) => (
						<div
							key={endpoint.path}
							className="rounded-lg border border-border bg-card p-6 sm:p-8"
						>
							<div className="space-y-4">
								<div className="flex flex-wrap items-center gap-3">
									<Badge className="border-emerald-600/20 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-200">
										GET
									</Badge>
									<code className="rounded-full border border-border bg-card px-4 py-2 text-sm">
										{endpoint.path}
									</code>
								</div>
								<div>
									<h3 className="text-2xl font-semibold tracking-tight">
										{t(endpoint.title)}
									</h3>
									<p className="mt-2 text-muted-foreground">
										{t(endpoint.description)}
									</p>
								</div>
								<div className="space-y-3">
									<p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
										{t("Example request")}
									</p>
									<CodeBlock>{endpoint.request}</CodeBlock>
								</div>
								<div className="space-y-3">
									<p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
										{t("Example response")}
									</p>
									<CodeBlock>{endpoint.response}</CodeBlock>
								</div>
							</div>
						</div>
					))}
				</section>

				<section className="rounded-lg border border-border bg-card p-6 sm:p-8">
					<div className="space-y-4">
						<h2 className="font-bold text-3xl tracking-tight">
							{t("Errors and throttling")}
						</h2>
						<p className="text-muted-foreground">
							{t(
								"The API returns standard HTTP status codes. If you request a missing code, you receive a response with status",
							)}{" "}
							<code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-sm">
								404
							</code>
							.
						</p>
						<CodeBlock>{notFoundResponseExample}</CodeBlock>
						<p className="text-muted-foreground">
							{t(
								"Public traffic is served on shared infrastructure. To protect the service, excessive usage may be throttled with",
							)}{" "}
							<code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-sm">
								429 Too Many Requests
							</code>
							.
						</p>
					</div>
				</section>

				<section className="rounded-lg border border-primary/20 bg-primary/5 p-6 sm:p-8">
					<div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
						<div className="space-y-4">
							<h2 className="font-bold text-3xl tracking-tight text-primary">
								{t("Need higher rate limits or support?")}
							</h2>
							<p className="max-w-2xl text-primary/80">
								{t(
									"The public API is available as-is. If you need heavier sustained usage, operational support, or a more tailored integration path, email us and we can work out a setup.",
								)}
							</p>
							<div className="flex flex-wrap gap-3">
								<Button
									nativeButton={false}
									render={
										<a href="mailto:contact@nacebel.codes?subject=NACE-BEL%20API">
											{t("Contact us")}
										</a>
									}
								/>
								<Button
									variant="outline"
									nativeButton={false}
									render={
										<a href={`/${locale}`}>
											{t("Try the search UI")}
										</a>
									}
								/>
							</div>
						</div>
						<div className="rounded-lg border border-primary/15 bg-card p-5 shadow-sm">
							<p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
								{t("Typical reasons to reach out")}
							</p>
							<ul className="mt-4 space-y-3 text-sm text-muted-foreground">
								<li>{t("Higher sustained request volume")}</li>
								<li>{t("Priority issue resolution")}</li>
								<li>{t("Integration guidance for production use")}</li>
								<li>
									{t("Commercial or custom data access questions")}
								</li>
							</ul>
						</div>
					</div>
				</section>
			</div>

			<PageFooter />
		</div>
	);
}
