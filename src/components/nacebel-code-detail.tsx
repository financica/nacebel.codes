import { ArrowLeftIcon, ChevronRightIcon, ExternalLinkIcon } from "lucide-react";
import { ExplanatoryNote } from "@/components/explanatory-note";
import { Button } from "@/components/ui/button";
import { PageFooter } from "@/components/page-footer";
import { type CodeData, codeHrefFor, codeTitleFor } from "@/lib/code-page";
import { createT } from "@/lib/i18n/core";
import type { Locale } from "@/lib/i18n/locales";
import { siteScope } from "@/lib/i18n/scopes/site";

function levelVar(level: number): string {
	return `var(--color-level-${Math.min(Math.max(level, 2), 6)})`;
}

interface CodeDetailProps {
	data: CodeData;
	locale: Locale;
	ancestors: CodeData[];
	childCodes: CodeData[];
	/** Explanatory note body (Markdown with `[[code]]` wikilinks), or "". */
	note: string;
	/** Resolved hrefs for codes referenced by the note's wikilinks. */
	noteLinks: Record<string, string>;
}

export function NacebelCodeDetail({
	data,
	locale,
	ancestors,
	childCodes,
	note,
	noteLinks,
}: CodeDetailProps) {
	const t = createT(locale, siteScope);
	const title = codeTitleFor(data, locale);
	const description = data.description[locale] || data.description.en || "";
	const kboLink = `https://kbopub.economie.fgov.be/kbopub/naceToelichting.html?lang=${locale}&nace.code=${data.code.replace(/\./g, "")}&nace.version=2025`;
	const parent = ancestors.length > 0 ? ancestors[ancestors.length - 1] : null;
	const color = levelVar(data.level);

	return (
		<>
			<main className="container py-8 sm:py-12">
				<nav
					aria-label={t("Breadcrumb")}
					className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground"
				>
					<a
						href={`/${locale}`}
						className="transition-colors hover:text-foreground"
					>
						{t("NACE-BEL 2025 Codes")}
					</a>
					{ancestors.map((ancestor) => (
						<span key={ancestor.code} className="flex items-center gap-2">
							<ChevronRightIcon
								className="h-3.5 w-3.5 opacity-40"
								aria-hidden
							/>
							<a
								href={codeHrefFor(ancestor, locale)}
								className="transition-colors hover:text-foreground"
							>
								<span data-code className="text-foreground/70">
									{ancestor.code}
								</span>{" "}
								<span className="hidden sm:inline">
									{codeTitleFor(ancestor, locale)}
								</span>
							</a>
						</span>
					))}
					<span className="flex items-center gap-2">
						<ChevronRightIcon
							className="h-3.5 w-3.5 opacity-40"
							aria-hidden
						/>
						<span data-code className="font-medium text-foreground">
							{data.code}
						</span>
					</span>
				</nav>

				<header className="mt-8 border-b border-border pb-8">
					<div className="flex flex-wrap items-center gap-3">
						<span
							data-code
							className="text-2xl leading-none font-bold sm:text-3xl"
							style={{ color }}
						>
							{data.code}
						</span>
						<span
							className="inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-xs font-medium"
							style={{ color, borderColor: color }}
						>
							{t("Level")} {data.level}
						</span>
					</div>
					<h1 className="mt-4 max-w-4xl text-[1.75rem] leading-tight font-extrabold tracking-tight sm:text-4xl">
						{title}
					</h1>
					{description && description !== title ? (
						<p className="measure mt-4 text-lg leading-8 text-muted-foreground">
							{description}
						</p>
					) : null}
					<div className="mt-6 flex flex-wrap gap-3">
						<Button
							variant="outline"
							size="sm"
							nativeButton={false}
							render={
								<a href={`/${locale}`}>
									<ArrowLeftIcon className="mr-1.5 h-4 w-4" />
									{t("Back to directory")}
								</a>
							}
						/>
						<Button
							variant="outline"
							size="sm"
							nativeButton={false}
							render={
								<a
									href={kboLink}
									target="_blank"
									rel="noopener noreferrer"
								>
									<ExternalLinkIcon className="mr-1.5 h-4 w-4" />
									{t("View on KBO (Crossroads Bank for Enterprises)")}
								</a>
							}
						/>
					</div>
				</header>

				{note ? (
					<section className="mt-8">
						<h2 className="text-sm font-semibold tracking-tight">
							{t("Explanatory note")}
						</h2>
						<div className="mt-3">
							<ExplanatoryNote text={note} links={noteLinks} />
						</div>
					</section>
				) : null}

				{parent ? (
					<section className="mt-8">
						<h2 className="text-sm font-semibold tracking-tight">
							{t("Parent code")}
						</h2>
						<a
							href={codeHrefFor(parent, locale)}
							className="group mt-3 flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-border-strong hover:bg-muted/50"
						>
							<span
								data-code
								className="font-semibold"
								style={{ color: levelVar(parent.level) }}
							>
								{parent.code}
							</span>
							<span className="min-w-0 flex-1 truncate text-foreground">
								{codeTitleFor(parent, locale)}
							</span>
							<ChevronRightIcon
								className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
								aria-hidden
							/>
						</a>
					</section>
				) : null}

				{childCodes.length > 0 ? (
					<section className="mt-8">
						<h2 className="flex items-baseline gap-2 text-sm font-semibold tracking-tight">
							{t("Child codes")}
							<span className="font-mono text-xs font-normal text-muted-foreground">
								{childCodes.length}
							</span>
						</h2>
						<div className="mt-3 divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
							{childCodes.map((child) => (
								<a
									key={child.code}
									href={codeHrefFor(child, locale)}
									className="group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/60"
								>
									<span
										data-code
										className="shrink-0 font-semibold"
										style={{
											color: levelVar(child.level),
											minWidth: "5ch",
										}}
									>
										{child.code}
									</span>
									<span className="min-w-0 flex-1 truncate text-[0.95rem] text-foreground">
										{codeTitleFor(child, locale)}
									</span>
									<ChevronRightIcon
										className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
										aria-hidden
									/>
								</a>
							))}
						</div>
					</section>
				) : null}
			</main>

			<PageFooter />
		</>
	);
}
