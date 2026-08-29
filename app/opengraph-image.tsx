import { createT } from "@/lib/i18n/core";
import { resolveLocale } from "@/lib/i18n/locale";
import { siteScope } from "@/lib/i18n/scopes/site";
import { ogImageResponse } from "@ingram-tech/nk-seo/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "NACE-BEL 2025 Codes — search the Belgian classification";

// The card is localized like the page it belongs to, and every page advertises
// it at a locale-named address (`/fr/opengraph-image`) that the proxy rewrites
// here — so the locale arrives the same way it does on a page, in the header
// the proxy set, and a crawler fetching the French card gets the French card.
//
// Colours are the light theme's primary/background/foreground, converted from
// the oklch values in globals.css — Satori resolves no CSS variables.
export default async function OpengraphImage() {
	const t = createT(await resolveLocale(), siteScope);

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
