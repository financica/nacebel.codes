"use client";

import { useTheme } from "@ingram-tech/nk-themes/client";

import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { useLocale } from "@/contexts/locale-context";
import { useT } from "@/lib/i18n";
import { siteScope } from "@/lib/i18n/scopes/site";

export function SiteHeader() {
	const locale = useLocale();
	const t = useT(siteScope);
	const { theme, setTheme } = useTheme();

	return (
		<header className="sticky top-0 z-[1100] border-b border-border bg-card">
			<div className="container flex h-14 items-center justify-between gap-4">
				<a
					href={`/${locale}`}
					className="group inline-flex items-center gap-2 text-[1.05rem] leading-none font-bold tracking-tight"
					aria-label={t("nacebel.codes — home")}
				>
					<span
						aria-hidden
						className="grid size-6 place-items-center rounded bg-primary font-mono text-[0.7rem] font-bold text-primary-foreground"
					>
						NB
					</span>
					<span>
						nacebel<span className="text-primary">.codes</span>
					</span>
				</a>

				<nav className="flex items-center gap-1 sm:gap-2">
					<a
						href={`/${locale}/about`}
						className="rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:px-3"
					>
						{t("About")}
					</a>
					<a
						href={`/${locale}/api/docs`}
						className="rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:px-3"
					>
						{t("API")}
					</a>
					<a
						href={`/${locale}/dataset`}
						className="hidden rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:block sm:px-3"
					>
						{t("Dataset")}
					</a>
					<span className="mx-1 hidden h-5 w-px bg-border sm:block" />
					<ThemeToggle theme={theme ?? "system"} setTheme={setTheme} />
					<LanguageSwitcher />
				</nav>
			</div>
		</header>
	);
}
