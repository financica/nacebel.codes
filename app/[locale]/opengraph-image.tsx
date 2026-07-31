import { createT } from "@/lib/i18n/core";
import { SUPPORTED_LOCALES, type Locale } from "@/lib/i18n/locales";
import { siteScope } from "@/lib/i18n/scopes/site";
import { ogImageResponse } from "@ingram-tech/nk-seo/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "NACE-BEL 2025 Codes — search the Belgian classification";

// The card lives under [locale] rather than at the app root for two reasons:
// its URL then carries a locale prefix, so the proxy serves it instead of
// redirecting it to one; and the share card is localized like the page it
// belongs to. Both strings are already in the site catalog.
//
// Colours are the light theme's primary/background/foreground, converted from
// the oklch values in globals.css — Satori resolves no CSS variables.
export default async function OpengraphImage({
	params,
}: {
	params: Promise<{ locale: Locale }>;
}) {
	const { locale } = await params;
	const t = createT(locale, siteScope);

	return ogImageResponse({
		title: t("NACE-BEL 2025 Codes — Search the Belgian classification"),
		// The long meta description runs to four lines here and pushes the footer
		// off the safe area, so the card uses the short tagline instead. The
		// wordmark carries the domain, so there is no footer to duplicate it.
		subtitle: t(
			"NACE and NACE-BEL classify economic activity in Belgium and across Europe.",
		),
		wordmark: "nacebel.codes",
		accent: "#d62c16",
		background: "#121720",
		ink: "#f9fafc",
		size,
	});
}

export function generateStaticParams(): { locale: string }[] {
	return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}
