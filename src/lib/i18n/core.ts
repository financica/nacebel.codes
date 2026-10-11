// The i18n engine now lives in @ingram-tech/nk-i18n. This re-export keeps the
// local `@/lib/i18n/core` import path stable for scopes and server components.
export {
	createT,
	defineI18nScope,
	defineMessages,
	type I18nScope,
	type Messages,
	type MessageSource,
	type TranslationKey,
	type Translator,
} from "@ingram-tech/nk-i18n";
