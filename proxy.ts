import { codeHrefFor, loadCodeData } from "@/lib/code-page";
import { DEFAULT_LOCALE, type Locale, SUPPORTED_LOCALES } from "@/lib/i18n/locales";
import { negotiateAcceptLanguage } from "@ingram-tech/nk-i18n";
import { type NextRequest, NextResponse } from "next/server";

const LOCALE_PREFIX_RE = /^\/(en|nl|fr|de)(?:\/|$)/;
// Codes are numeric (e.g. 01.11) or a single section letter (e.g. A).
const CODE_PATH_RE = /^\/(en|nl|fr|de)\/([A-Za-z]|[\d.]+)(?:\/([^/]*))?\/?$/;

const COOKIE_OPTIONS = {
	path: "/",
	maxAge: 60 * 60 * 24 * 365,
	sameSite: "lax" as const,
};

function isLocale(value: string): value is Locale {
	return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

function negotiateLocale(request: NextRequest): Locale {
	const cookieLocale = request.cookies.get("locale")?.value;
	if (cookieLocale && isLocale(cookieLocale)) return cookieLocale;

	const negotiated = negotiateAcceptLanguage(
		request.headers.get("accept-language"),
		SUPPORTED_LOCALES,
	);
	return negotiated && isLocale(negotiated) ? negotiated : DEFAULT_LOCALE;
}

export async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	const localeMatch = pathname.match(LOCALE_PREFIX_RE);

	// No locale prefix — send the visitor to their negotiated locale, preserving
	// the rest of the path and the query string. This is what makes `/`, `/about`,
	// `/api/docs`, and any shared link consistently resolve to `/fr`, `/en`, …
	if (!localeMatch) {
		const locale = negotiateLocale(request);
		const url = request.nextUrl.clone();
		url.pathname = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
		return NextResponse.redirect(url, 307);
	}

	const locale = localeMatch[1] as Locale;

	// Enforce the canonical localized slug on code pages.
	const codeMatch = pathname.match(CODE_PATH_RE);
	if (codeMatch) {
		const code = codeMatch[2];
		if (code) {
			const data = await loadCodeData(code.replace(/\./g, ""));
			if (!data) {
				return new NextResponse("Not Found", {
					status: 404,
					headers: { "Content-Type": "text/plain; charset=utf-8" },
				});
			}
			const canonical = codeHrefFor(data, locale);
			if (pathname !== canonical) {
				const url = request.nextUrl.clone();
				url.pathname = canonical;
				const redirect = NextResponse.redirect(url, 308);
				redirect.cookies.set("locale", locale, COOKIE_OPTIONS);
				return redirect;
			}
		}
	}

	// Remember the locale carried by the URL so `/` negotiation stays sticky and
	// the language switcher's choice persists across visits.
	const response = NextResponse.next();
	response.cookies.set("locale", locale, COOKIE_OPTIONS);
	return response;
}

export const config = {
	matcher: [
		"/((?!api/v1|api/dataset|internal/|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|opensearch.xml|images|static).*)",
	],
};
