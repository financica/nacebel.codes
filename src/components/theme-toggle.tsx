"use client";

import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { siteScope } from "@/lib/i18n/scopes/site";
import type { Theme } from "@/types";
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";

interface ThemeToggleProps {
	theme: Theme;
	setTheme: (theme: Theme) => void;
}

const THEME_LABEL = {
	light: "Light",
	dark: "Dark",
	system: "System",
} as const satisfies Record<Theme, string>;

const THEME_ICON = {
	light: SunIcon,
	dark: MoonIcon,
	system: MonitorIcon,
} as const;

export function ThemeToggle({ theme, setTheme }: ThemeToggleProps) {
	const t = useT(siteScope);
	return (
		<div className="flex items-center space-x-1 rounded-full border border-border bg-card p-1 shadow-sm">
			{(["light", "dark", "system"] as const).map((mode) => {
				const Icon = THEME_ICON[mode];
				const label = t(THEME_LABEL[mode]);
				return (
					<Button
						key={mode}
						variant="ghost"
						size="icon"
						onClick={() => setTheme(mode)}
						className={`h-9 w-9 rounded-full p-2 ${
							theme === mode
								? "bg-primary text-primary-foreground shadow-[0_14px_30px_-22px_hsl(var(--primary))]"
								: "text-muted-foreground hover:bg-accent/80 hover:text-foreground"
						}`}
						aria-label={t("Set theme to {theme}", { theme: label })}
					>
						<Icon className="h-4 w-4" />
					</Button>
				);
			})}
		</div>
	);
}
