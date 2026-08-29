import { codeBarePathFor } from "@/lib/code-page";
import { DEFAULT_LOCALE } from "@/lib/i18n/locales";
import { hreflangLanguages, SITE_ORIGIN } from "@/lib/i18n/routing";
import { getPaginatedNacebelCodes } from "@/lib/nacebelData";
import { createSitemap, type SitemapRoute } from "@ingram-tech/nk-seo";
import type { MetadataRoute } from "next";

const canonicalRoutes = [
	{ path: "/", changeFrequency: "weekly" as const, priority: 1 },
	{ path: "/about", changeFrequency: "monthly" as const, priority: 0.7 },
	{ path: "/dataset", changeFrequency: "monthly" as const, priority: 0.8 },
	{ path: "/api/docs", changeFrequency: "monthly" as const, priority: 0.6 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const { data: allCodes } = await getPaginatedNacebelCodes(1, 100000);

	// Each entry is listed at its bare address — the negotiating `x-default`
	// entry point, which belongs to no locale — and carries the whole cluster as
	// its alternates, so every one of the four localized URLs is discoverable
	// from it. All of them answer 200; none of them redirects.
	const routes: SitemapRoute[] = [
		...canonicalRoutes.map((route) => ({
			path: route.path,
			changeFrequency: route.changeFrequency,
			priority: route.priority,
			languages: hreflangLanguages(() => route.path),
		})),
		...allCodes.map((code) => ({
			path: codeBarePathFor(code, DEFAULT_LOCALE),
			changeFrequency: "yearly" as const,
			priority: 0.5,
			languages: hreflangLanguages((loc) => codeBarePathFor(code, loc)),
		})),
	];

	return createSitemap({
		baseUrl: SITE_ORIGIN,
		lastModified: new Date(),
		routes,
	});
}
