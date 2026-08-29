"use client";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocale } from "@/contexts/locale-context";
import {
	HTML_LANG,
	LOCALE_NAMES,
	type Locale,
	SUPPORTED_LOCALES,
} from "@/lib/i18n/locales";
import { ChevronDownIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const LOCALE_PREFIX_RE = /^\/(en|nl|fr|de)(?=\/|$)/;

export function LanguageSwitcher() {
	const locale = useLocale();
	const pathname = usePathname();
	const [altHrefs, setAltHrefs] = useState<Partial<Record<Locale, string>>>({});

	// Prefer each page's declared hreflang alternate (the canonical per-locale
	// URL, including its localized slug). Read after mount; SSR uses the fallback.
	useEffect(() => {
		const next: Partial<Record<Locale, string>> = {};
		for (const loc of SUPPORTED_LOCALES) {
			const link = document.querySelector<HTMLLinkElement>(
				`link[rel="alternate"][hreflang="${HTML_LANG[loc]}"]`,
			);
			if (link?.href) {
				try {
					const url = new URL(link.href);
					next[loc] = url.pathname + url.search;
				} catch {
					// ignore malformed hrefs
				}
			}
		}
		setAltHrefs(next);
	}, []);

	// Fallback: swap the leading /<locale> segment (never prepend to it).
	const fallbackHref = (loc: Locale) => {
		const rest = pathname.replace(LOCALE_PREFIX_RE, "");
		return rest === "" || rest === "/" ? `/${loc}` : `/${loc}${rest}`;
	};
	const hrefFor = (loc: Locale) => altHrefs[loc] ?? fallbackHref(loc);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						variant="outline"
						className="flex items-center gap-1.5 rounded-md px-3"
					/>
				}
			>
				<span>{LOCALE_NAMES[locale]}</span>
				<ChevronDownIcon className="h-4 w-4 opacity-60" />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="min-w-40">
				{SUPPORTED_LOCALES.map((loc: Locale) => (
					<DropdownMenuItem
						key={loc}
						data-current={loc === locale ? "" : undefined}
						className="data-current:font-medium data-current:text-primary"
						nativeButton={false}
						render={<a href={hrefFor(loc)}>{LOCALE_NAMES[loc]}</a>}
					/>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
