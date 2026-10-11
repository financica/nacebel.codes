"use client";

import { useLocale as useLocaleGeneric } from "@ingram-tech/nk-i18n/client";
import type { Locale } from "@/lib/i18n/locales";

export type { Locale };
export { LocaleContext } from "@ingram-tech/nk-i18n/client";

/** The active locale, narrowed to this site's `Locale` union. */
export const useLocale = (): Locale => useLocaleGeneric<Locale>();
