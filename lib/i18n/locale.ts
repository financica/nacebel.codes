import {
	createLocaleResolver,
	getUrlLocale as nkGetUrlLocale,
} from "@ingram-tech/nk-i18n/next";
import { cache } from "react";
import type { Locale } from "./locales";
import { routing } from "./routing";

/**
 * The locale this request renders in, by nk-i18n's fixed precedence: the URL
 * first (a shared `/fr/…` link must show the recipient French), then the
 * remembered-choice cookie, then `Accept-Language`, then country, then `en`.
 * There is no account here — the site has no sign-in.
 */
export const resolveLocale: () => Promise<Locale> = cache(
	createLocaleResolver(routing),
);

/**
 * The locale the URL *names*, or `undefined` on the bare negotiating path.
 * This — not {@link resolveLocale} — is what canonicals and hreflang follow.
 */
export const getUrlLocale = (): Promise<Locale | undefined> => nkGetUrlLocale(routing);
