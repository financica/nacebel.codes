import { NacebelCodeDetail } from "@/components/nacebel-code-detail";
import {
	codeBarePathFor,
	codeCanonicalUrl,
	codeHrefFor,
	codeTitleFor,
	loadAncestors,
	loadCodeData,
} from "@/lib/code-page";
import { createT } from "@/lib/i18n/core";
import { getUrlLocale, resolveLocale } from "@/lib/i18n/locale";
import { DEFAULT_LOCALE, HTML_LANG, OG_LOCALE } from "@/lib/i18n/locales";
import { canonicalUrl, hreflangLanguages, SITE_ORIGIN } from "@/lib/i18n/routing";
import { siteScope } from "@/lib/i18n/scopes/site";
import { ogImagesFor, pageMetadata } from "@/lib/site-metadata";
import { breadcrumbList, definedTerm } from "@ingram-tech/nk-seo";
import { JsonLd } from "@ingram-tech/nk-seo/components";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

interface PageProps {
	params: Promise<{ code: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const [{ code }, locale, urlLocale] = await Promise.all([
		params,
		resolveLocale(),
		getUrlLocale(),
	]);

	const data = await loadCodeData(code.replace(/\./g, ""));
	if (!data) return {};

	const t = createT(locale, siteScope);
	const title = codeTitleFor(data, locale);
	const heading = `${data.code} ${title}`;

	return {
		...pageMetadata({
			title: heading,
			description: t(
				"NACE-BEL 2025 code {code} — {title}. Activity classification used by Belgian businesses for registration, tax, and statistics.",
				{ code: data.code, title },
			),
			// The path a code page occupies is spelled differently in each
			// language, so the cluster is handed in rather than derived from this
			// one path — see `hreflangLanguages`.
			path: codeBarePathFor(data, urlLocale ?? DEFAULT_LOCALE),
			urlLocale,
			alternates: {
				languages: hreflangLanguages((loc) => codeBarePathFor(data, loc)),
			},
			locale: OG_LOCALE[locale],
			type: "article",
			openGraph: { images: ogImagesFor(locale) },
			twitter: { card: "summary" },
		}),
		// The code and its title already name the page; the site-name template
		// would land after a heading that carries its own suffix.
		title: { absolute: `${heading} | NACE-BEL 2025` },
	};
}

export default async function CodePage({ params }: PageProps) {
	const [{ code }, locale, urlLocale] = await Promise.all([
		params,
		resolveLocale(),
		getUrlLocale(),
	]);

	const data = await loadCodeData(code.replace(/\./g, ""));
	if (!data) notFound();

	const canonical = codeCanonicalUrl(data, urlLocale);
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
		{ name: t("NACE-BEL 2025 Codes"), url: canonicalUrl("/", urlLocale) },
		...ancestors.map((ancestor) => ({
			name: `${ancestor.code} ${codeTitleFor(ancestor, locale)}`,
			url: codeCanonicalUrl(ancestor, urlLocale),
		})),
		{ name: `${data.code} ${title}`, url: canonical },
	]);

	const definedTermJsonLd = definedTerm({
		name: title,
		termCode: data.code,
		url: canonical,
		inLanguage: HTML_LANG[locale],
		inDefinedTermSet: {
			name: "NACE-BEL 2025",
			url: SITE_ORIGIN,
			version: "2025",
		},
		extra: {
			"@id": canonical,
			alternateName: data.code,
		},
	});

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
