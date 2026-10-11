import { defineI18nConfig, type MissingKeysPolicy } from "@ingram-tech/nk-i18n";

export type { MissingKeysPolicy };

export const i18nConfig = defineI18nConfig({
	baseLocale: "en",
	locales: {
		en: {
			label: "English",
			missingKeys: "ignore",
			htmlLang: "en",
			ogLocale: "en_US",
		},
		nl: {
			label: "Nederlands",
			missingKeys: "error",
			htmlLang: "nl-BE",
			ogLocale: "nl_BE",
		},
		fr: {
			label: "Français",
			missingKeys: "error",
			htmlLang: "fr-BE",
			ogLocale: "fr_BE",
		},
		de: {
			label: "Deutsch",
			missingKeys: "error",
			htmlLang: "de",
			ogLocale: "de_DE",
		},
	},
});
