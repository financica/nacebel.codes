import { defineLocaleRouting } from "@ingram-tech/nk-i18n";
import { DEFAULT_LOCALE, HTML_LANG, type Locale, SUPPORTED_LOCALES } from "./locales";

export const SITE_ORIGIN = "https://nacebel.codes";

/**
 * The one definition of how a locale is encoded in this site's URLs, shared by
 * the code that *serves* a language (the proxy, `resolveLocale`) and the code
 * that *advertises* it (canonicals, hreflang, the sitemap). One object, so the
 * served URL and the advertised URL cannot drift apart.
 *
 * The cluster's shape is nk-i18n's and is not ours to bend: every locale has
 * its own address — `/en/…`, `/nl/…`, `/fr/…`, `/de/…`, the default included —
 * and the bare path belongs to none of them. Bare negotiates (cookie →
 * Accept-Language → country) and is `x-default`. All of them answer 200;
 * nothing redirects on a perceived language.
 *
 * `hrefLangTags` doubles as `<html lang>` (via `routing.htmlLang`) and keeps the
 * regional tags this site has always advertised: NACE-BEL is a *Belgian*
 * classification, so `nl-BE`/`fr-BE` are the honest tags for the content. `en`
 * and `de` stay unqualified — those translations exist to be read from anywhere.
 */
export const routing = defineLocaleRouting({
	baseUrl: SITE_ORIGIN,
	locales: SUPPORTED_LOCALES,
	defaultLocale: DEFAULT_LOCALE,
	strategy: "prefix",
	// Last-resort signal only, and Belgium is deliberately absent: geography
	// cannot tell you whether a Belgian visitor reads Dutch or French, so BE
	// falls through to Accept-Language rather than guessing.
	countryLocales: { FR: "fr", NL: "nl", DE: "de", AT: "de", GB: "en", IE: "en" },
	hrefLangTags: HTML_LANG,
});

/**
 * The absolute address of `path` as this request should claim it: the
 * locale-prefixed one when the URL named a locale, the bare (`x-default`) one
 * otherwise. A canonical is a statement about an address, so it follows the URL
 * and never the language that happened to render.
 */
export function canonicalUrl(path: string, urlLocale: Locale | undefined): string {
	return urlLocale ? routing.urlForLocale(path, urlLocale) : routing.bareUrl(path);
}

/**
 * The `alternates.languages` map for a page whose path differs per locale.
 *
 * `createMetadata({ hreflang: routing })` covers every page whose path is the
 * same string in every language; code pages are not those pages — their slug is
 * the localized title — so they hand the same cluster in explicitly. `pathFor`
 * returns the *bare* path for a locale; the prefix is this function's to add,
 * so the two halves still come from `routing`.
 */
export function hreflangLanguages(
	pathFor: (locale: Locale) => string,
): Record<string, string> {
	const languages: Record<string, string> = {};
	for (const locale of SUPPORTED_LOCALES) {
		languages[routing.htmlLang(locale)] = routing.urlForLocale(
			pathFor(locale),
			locale,
		);
	}
	// x-default is the bare, negotiating address. It belongs to no locale, but a
	// URL still has to pick one spelling of the slug: the default locale's.
	languages["x-default"] = routing.bareUrl(pathFor(DEFAULT_LOCALE));
	return languages;
}
