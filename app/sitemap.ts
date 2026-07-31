import { codeHrefFor } from "@/lib/code-page";
import { hreflangLanguages, SITE_ORIGIN } from "@/lib/i18n/hreflang";
import type { Locale } from "@/lib/i18n/locales";
import { getPaginatedNacebelCodes } from "@/lib/nacebelData";
import { createSitemap, type SitemapRoute } from "@ingram-tech/nk-seo";
import type { MetadataRoute } from "next";

const canonicalRoutes = [
	{
		pathFor: (loc: Locale) => `/${loc}`,
		changeFrequency: "weekly" as const,
		priority: 1,
	},
	{
		pathFor: (loc: Locale) => `/${loc}/about`,
		changeFrequency: "monthly" as const,
		priority: 0.7,
	},
	{
		pathFor: (loc: Locale) => `/${loc}/api/docs`,
		changeFrequency: "monthly" as const,
		priority: 0.6,
	},
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const { data: allCodes } = await getPaginatedNacebelCodes(1, 100000);

	// The bare paths redirect to a locale prefix, so every sitemap URL — and its
	// hreflang set — points at the resolvable per-locale pages (English primary).
	const routes: SitemapRoute[] = [
		...canonicalRoutes.map((route) => ({
			path: route.pathFor("en"),
			changeFrequency: route.changeFrequency,
			priority: route.priority,
			languages: hreflangLanguages(route.pathFor),
		})),
		...allCodes.map((code) => ({
			path: codeHrefFor(code, "en"),
			changeFrequency: "yearly" as const,
			priority: 0.5,
			languages: hreflangLanguages((loc) => codeHrefFor(code, loc)),
		})),
	];

	return createSitemap({
		baseUrl: SITE_ORIGIN,
		lastModified: new Date(),
		routes,
	});
}
