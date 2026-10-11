import { deriveLocaleConstants, localeMap } from "@ingram-tech/nk-i18n";
import { i18nConfig } from "./config";

export type Locale = keyof typeof i18nConfig.locales & string;

export const { SUPPORTED_LOCALES, DEFAULT_LOCALE, LOCALE_NAMES } =
	deriveLocaleConstants(i18nConfig);

export const HTML_LANG = localeMap(i18nConfig, (def) => def.htmlLang);
export const OG_LOCALE = localeMap(i18nConfig, (def) => def.ogLocale);
