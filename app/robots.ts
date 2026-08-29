import { SITE_ORIGIN } from "@/lib/i18n/routing";
import { createRobots } from "@ingram-tech/nk-seo";
import type { MetadataRoute } from "next";

/**
 * True only on the canonical production host. `VERCEL_ENV` is authoritative
 * when present — preview and branch deployments must serve a blanket
 * `Disallow: /` so they never compete with nacebel.codes for the same 1600
 * code pages. On a non-Vercel deploy, where that variable is absent, fall back
 * to `NODE_ENV` so a real production build still advertises itself.
 */
const isProduction = process.env.VERCEL_ENV
	? process.env.VERCEL_ENV === "production"
	: process.env.NODE_ENV === "production";

export default function robots(): MetadataRoute.Robots {
	return createRobots({
		baseUrl: SITE_ORIGIN,
		isProduction,
		disallow: ["/api/v1/"],
	});
}
