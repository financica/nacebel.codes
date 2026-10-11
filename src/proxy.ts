import { codeBarePathFor, codeHrefFor, loadCodeData } from "@/lib/code-page";
import { routing } from "@/lib/i18n/routing";
import { localeProxy } from "@ingram-tech/nk-i18n/next";
import { type NextRequest, NextResponse } from "next/server";

// Codes are numeric (e.g. 01.11) or a single section letter (e.g. A), matched
// against the path with any locale prefix already stripped. Multi-letter first
// segments — /about, /dataset, /api/docs — never match.
const CODE_PATH_RE = /^\/([A-Za-z]|[\d.]+)(?:\/([^/]*))?\/?$/;

const COOKIE_OPTIONS = {
	path: "/",
	maxAge: 60 * 60 * 24 * 365,
	sameSite: "lax" as const,
};

/**
 * Locale routing plus this site's one bespoke rule.
 *
 * `localeProxy` does the locale half: it rewrites `/fr/62.01/…` onto the bare
 * route tree, forwards the pathname and the locale the URL named as request
 * headers, and remembers an explicit choice in the cookie. It never redirects —
 * `/en/about` is a real 200 English page and `/about` is the negotiating
 * `x-default` entry point, because every URL the site advertises to Google has
 * to answer directly.
 *
 * The site half is the canonical slug. A code page's slug is its localized
 * title, so one code has a different address in each language and a stale or
 * hand-typed slug has to be corrected before the page renders. That correction
 * is a 308 to a *different address*, which is a different thing from redirecting
 * a URL away from the language it names: the locale the URL carried is the
 * locale the target carries. On the bare path there is no locale to carry, so
 * the default locale's slug is the canonical one — the bare address is
 * `x-default` and has to be a single stable URL.
 */
export async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;
	const urlLocale = routing.localeFromUrl(request.nextUrl);
	const codeMatch = routing.stripLocale(pathname).match(CODE_PATH_RE);
	const code = codeMatch?.[1];

	if (code) {
		const data = await loadCodeData(code.replace(/\./g, ""));
		if (!data) {
			return new NextResponse("Not Found", {
				status: 404,
				headers: { "Content-Type": "text/plain; charset=utf-8" },
			});
		}

		const canonical = urlLocale
			? codeHrefFor(data, urlLocale)
			: codeBarePathFor(data, routing.defaultLocale);
		if (pathname !== canonical) {
			const url = request.nextUrl.clone();
			url.pathname = canonical;
			const redirect = NextResponse.redirect(url, 308);
			if (urlLocale) {
				redirect.cookies.set(routing.cookieName, urlLocale, COOKIE_OPTIONS);
			}
			return redirect;
		}
	}

	return localeProxy(routing, request);
}

export const config = {
	matcher: [
		"/((?!api/v1|api/dataset|internal/|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|opensearch.xml|images|static).*)",
	],
};
