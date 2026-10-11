import { defineI18nScope } from "@/lib/i18n/core";
import de from "@/lib/i18n/messages/site.de.json";
import fr from "@/lib/i18n/messages/site.fr.json";
import nl from "@/lib/i18n/messages/site.nl.json";

/**
 * Site-wide UI strings. English is the source: pass the English text to `t(...)`
 * and these catalogs supply the nl/fr/de translations.
 */
export const siteScope = defineI18nScope({
	name: "site",
	messages: { nl, fr, de },
});
