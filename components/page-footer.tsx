"use client";

import { useLocale } from "@/contexts/locale-context";
import { useT } from "@/lib/i18n";
import { siteScope } from "@/lib/i18n/scopes/site";
import { ArrowUpRightIcon } from "lucide-react";

export function PageFooter() {
	const locale = useLocale();
	const t = useT(siteScope);

	return (
		<footer className="mt-14 border-t border-border">
			{/* Sponsor — a quiet strip, not the lead. */}
			<div className="border-b border-border bg-muted/40">
				<div className="container flex flex-col gap-2 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
					<p className="text-muted-foreground">
						{t("Incorporating a Belgian company?")}{" "}
						<span className="text-foreground">
							{t("Beldoc handles it online, with less friction.")}
						</span>
					</p>
					<a
						href="https://beldoc.be"
						target="_blank"
						rel="noopener"
						className="inline-flex w-fit items-center gap-1 font-medium text-primary hover:underline"
					>
						beldoc.be
						<ArrowUpRightIcon className="h-3.5 w-3.5" />
					</a>
				</div>
			</div>

			<div className="container flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
				<div className="space-y-1 text-sm text-muted-foreground">
					<p className="font-semibold text-foreground">
						nacebel<span className="text-primary">.codes</span>
					</p>
					<p>
						{t("NACE-BEL 2025 directory and API")} · ©{" "}
						{new Date().getFullYear()}{" "}
						<a
							href="https://ingram.tech"
							target="_blank"
							rel="noopener noreferrer"
							className="font-medium text-foreground transition-colors hover:text-primary"
						>
							Ingram Technologies
						</a>
					</p>
				</div>
				<nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
					<a
						href={`/${locale}`}
						className="transition-colors hover:text-foreground"
					>
						{t("Search")}
					</a>
					<a
						href={`/${locale}/about`}
						className="transition-colors hover:text-foreground"
					>
						{t("About")}
					</a>
					<a
						href={`/${locale}/api/docs`}
						className="transition-colors hover:text-foreground"
					>
						{t("API")}
					</a>
					<a
						href={`/${locale}/dataset`}
						className="transition-colors hover:text-foreground"
					>
						{t("Dataset")}
					</a>
					<a
						href="mailto:contact@nacebel.codes"
						className="font-medium text-foreground transition-colors hover:text-primary"
					>
						contact@nacebel.codes
					</a>
				</nav>
			</div>
		</footer>
	);
}
