import { NacebelCodeDetail } from "@/components/nacebel-code-detail";
import {
	codeHrefFor,
	codeSlugFor,
	codeTitleFor,
	loadAncestors,
	loadCodeData,
} from "@/lib/code-page";
import { createT } from "@/lib/i18n/core";
import { hreflangLanguages, SITE_ORIGIN } from "@/lib/i18n/hreflang";
import {
	HTML_LANG,
	OG_LOCALE,
	SUPPORTED_LOCALES,
	type Locale,
} from "@/lib/i18n/locales";
import { siteScope } from "@/lib/i18n/scopes/site";
import { getPaginatedNacebelCodes } from "@/lib/nacebelData";
import { ogImagesFor } from "@/lib/site-metadata";
import { breadcrumbList } from "@ingram-tech/nk-seo";
import { JsonLd } from "@ingram-tech/nk-seo/components";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

interface PageProps {
	params: Promise<{ locale: string; code: string; slug: string }>;
}

function isLocale(value: string): value is Locale {
	return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

// On-demand static generation (ISR). Prerendering all ~13k pages × 4 locales at
// build time emits ~140k output files / 2.2 GB (Next 16 writes ~11 prefetch/RSC
// segments per page), which exceeds Vercel's deployment limits. Instead we
// prerender only the shallow top of the tree (sections/divisions/groups) at
// build time and let `dynamicParams` generate the rest on first request; those
// are then cached as static HTML at the edge (no `revalidate` → cached until the
// next deploy). Net result: still static/CDN-served, but a deployable build.
export const dynamicParams = true;

export async function generateStaticParams({
	params,
}: {
	params: { locale: string };
}): Promise<{ code: string; slug: string }[]> {
	if (!isLocale(params.locale)) return [];
	const { locale } = params;
	const { data } = await getPaginatedNacebelCodes(1, 100000);
	return data
		.filter((code) => code.level <= 3)
		.map((code) => ({ code: code.code, slug: codeSlugFor(code, locale) }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const { locale, code } = await params;
	if (!isLocale(locale)) return {};

	const data = await loadCodeData(code.replace(/\./g, ""));
	if (!data) return {};

	const t = createT(locale, siteScope);
	const title = codeTitleFor(data, locale);
	const description = t(
		"NACE-BEL 2025 code {code} — {title}. Activity classification used by Belgian businesses for registration, tax, and statistics.",
		{ code: data.code, title },
	);
	const canonicalPath = codeHrefFor(data, locale);

	return {
		title: { absolute: `${data.code} ${title} | NACE-BEL 2025` },
		description,
		alternates: {
			canonical: canonicalPath,
			languages: hreflangLanguages((loc) => codeHrefFor(data, loc)),
		},
		openGraph: {
			title: `${data.code} ${title}`,
			description,
			url: `${SITE_ORIGIN}${canonicalPath}`,
			locale: OG_LOCALE[locale],
			type: "article",
			images: ogImagesFor(locale),
		},
		twitter: {
			card: "summary",
			title: `${data.code} ${title}`,
			description,
		},
	};
}

export default async function CodePage({ params }: PageProps) {
	const { locale, code } = await params;
	if (!isLocale(locale)) notFound();

	const data = await loadCodeData(code.replace(/\./g, ""));
	if (!data) notFound();

	const canonicalPath = codeHrefFor(data, locale);
	const codeWithoutDots = data.code.replace(/\./g, "");
	const [ancestors, childrenData] = await Promise.all([
		loadAncestors(codeWithoutDots),
		Promise.all(
			(data.childrenCodes ?? []).map((c) => loadCodeData(c.replace(/\./g, ""))),
		),
	]);
	const childCodes = childrenData.filter(
		(c): c is NonNullable<typeof c> => c !== null,
	);

	const note = data.explanatoryNote?.[locale] || data.explanatoryNote?.en || "";
	const referencedCodes = [
		...new Set(
			[...note.matchAll(/\[\[([^\]]+)\]\]/g)]
				.map((m) => m[1])
				.filter((c): c is string => c !== undefined),
		),
	];
	const resolvedLinks = await Promise.all(
		referencedCodes.map(async (ref) => {
			const target = await loadCodeData(ref.replace(/\./g, ""));
			return target ? ([ref, codeHrefFor(target, locale)] as const) : null;
		}),
	);
	const noteLinks = Object.fromEntries(
		resolvedLinks.filter(
			(entry): entry is NonNullable<typeof entry> => entry !== null,
		),
	);

	const t = createT(locale, siteScope);
	const title = codeTitleFor(data, locale);
	const breadcrumbJsonLd = breadcrumbList([
		{ name: t("NACE-BEL 2025 Codes"), url: `${SITE_ORIGIN}/${locale}` },
		...ancestors.map((ancestor) => ({
			name: `${ancestor.code} ${codeTitleFor(ancestor, locale)}`,
			url: `${SITE_ORIGIN}${codeHrefFor(ancestor, locale)}`,
		})),
		{ name: `${data.code} ${title}`, url: `${SITE_ORIGIN}${canonicalPath}` },
	]);

	// No nk-seo builder covers DefinedTerm, so this node stays hand-built —
	// <JsonLd> still serializes it with `<` escaped, which matters here because
	// the title comes from the NACE-BEL dataset rather than from our own source.
	const definedTermJsonLd = {
		"@context": "https://schema.org",
		"@type": "DefinedTerm",
		"@id": `${SITE_ORIGIN}${canonicalPath}`,
		name: title,
		alternateName: data.code,
		termCode: data.code,
		url: `${SITE_ORIGIN}${canonicalPath}`,
		inLanguage: HTML_LANG[locale],
		inDefinedTermSet: {
			"@type": "DefinedTermSet",
			name: "NACE-BEL 2025",
			url: `${SITE_ORIGIN}/`,
		},
	};

	return (
		<>
			<JsonLd data={[breadcrumbJsonLd, definedTermJsonLd]} />
			<NacebelCodeDetail
				data={data}
				locale={locale}
				ancestors={ancestors}
				childCodes={childCodes}
				note={note}
				noteLinks={noteLinks}
			/>
		</>
	);
}
