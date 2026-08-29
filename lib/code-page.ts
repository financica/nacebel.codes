import { cache } from "react";
import { DEFAULT_LOCALE, type Locale } from "./i18n/locales";
import { canonicalUrl } from "./i18n/routing";
import { getNacebelAncestors, getNacebelCodeDetails } from "./nacebelData";
import { slugify } from "./slug";

export type CodeData = NonNullable<Awaited<ReturnType<typeof getNacebelCodeDetails>>>;

export const loadCodeData = cache(async (codeWithoutDots: string) => {
	return getNacebelCodeDetails(codeWithoutDots);
});

export const loadAncestors = cache(async (codeWithoutDots: string) => {
	return getNacebelAncestors(codeWithoutDots);
});

export function codeTitleFor(data: CodeData, locale: Locale): string {
	return data.titles[locale] || data.titles.en || data.code;
}

export function codeSlugFor(data: CodeData, locale: Locale): string {
	return slugify(codeTitleFor(data, locale)) || "code";
}

/**
 * The locale-free path of a code page: `/62.01/computer-programming`.
 *
 * A code page's slug is its localized title, so this path is not the same
 * string in every language — which is why the hreflang cluster for these pages
 * is assembled from `hreflangLanguages` rather than left to nk-seo's
 * path-is-locale-invariant default. The bare address, being `x-default`, still
 * has to pick one spelling: the default locale's.
 */
export function codeBarePathFor(data: CodeData, locale: Locale): string {
	return `/${data.code}/${codeSlugFor(data, locale)}`;
}

/** The locale-prefixed path of a code page: `/fr/62.01/programmation-…`. */
export function codeHrefFor(data: CodeData, locale: Locale): string {
	return `/${locale}${codeBarePathFor(data, locale)}`;
}

/**
 * The absolute address a code page claims for itself — the locale-prefixed one
 * when the URL named a locale, the bare `x-default` one otherwise. Canonicals
 * and JSON-LD follow the address, never the language that rendered.
 */
export function codeCanonicalUrl(
	data: CodeData,
	urlLocale: Locale | undefined,
): string {
	return canonicalUrl(codeBarePathFor(data, urlLocale ?? DEFAULT_LOCALE), urlLocale);
}
