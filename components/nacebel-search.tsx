"use client";

import { useLocale } from "@/contexts/locale-context";
import { EXPORT_FORMAT_LABELS, type ExportFormat, exportCodes } from "@/lib/export";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { siteScope } from "@/lib/i18n/scopes/site";
import { slugify } from "@/lib/slug";
import type { NacebelCode } from "@/types";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ExportMenu } from "./export-menu";
import { NacebelCodeList } from "./nacebel-code-list";
import { PageFooter } from "./page-footer";
import { PaginationControls } from "./pagination-controls";
import { SearchInput } from "./search-input";

const ITEMS_PER_PAGE = 100;
const COPY_FEEDBACK_MS = 2000;
const URL_SYNC_DEBOUNCE_MS = 250;
const EXAMPLE_SEARCHES = ["software", "62.10", "consulting"];
const CODE_LIKE_RE = /^[\d.\s]+$/;
const PUNCTUATION_RE = /[^\p{L}\p{N}\s]/gu;

function normalizePunctuation(text: string): string {
	return text.replace(PUNCTUATION_RE, " ").toLowerCase();
}

function normalizeCodeSearch(text: string): string {
	return text.replace(/[\s.]+/g, "").toLowerCase();
}

function isCodeLikeSearch(searchTerm: string): boolean {
	return searchTerm.length > 0 && CODE_LIKE_RE.test(searchTerm);
}

function getSearchTokens(searchTerm: string): string[][] {
	return normalizePunctuation(searchTerm)
		.split(/\s+/)
		.filter(Boolean)
		.map((token) => {
			const variants = new Set<string>([token]);
			if (token.endsWith("ing") && token.length > 5) {
				variants.add(token.slice(0, -3));
			}
			if (token.endsWith("ies") && token.length > 4) {
				variants.add(`${token.slice(0, -3)}y`);
			}
			if (token.endsWith("s") && token.length > 4) {
				variants.add(token.slice(0, -1));
			}
			return Array.from(variants);
		});
}

function getSearchableText(code: NacebelCode): string {
	return normalizePunctuation(
		[
			code.code,
			...Object.values(code.titles),
			...Object.values(code.description),
		].join(" "),
	);
}

function getCodeSearchRank(code: NacebelCode, searchTerm: string): number {
	const codeValue = code.code.toLowerCase();
	const normalizedCodeValue = normalizeCodeSearch(code.code);
	const normalizedSearch = normalizeCodeSearch(searchTerm);

	if (codeValue === searchTerm || normalizedCodeValue === normalizedSearch) {
		return 0;
	}
	if (
		codeValue.startsWith(searchTerm) ||
		normalizedCodeValue.startsWith(normalizedSearch)
	) {
		return 1;
	}
	if (
		codeValue.includes(searchTerm) ||
		normalizedCodeValue.includes(normalizedSearch)
	) {
		return 2;
	}
	return 3;
}

function filterCodes(codes: NacebelCode[], searchTerm: string): NacebelCode[] {
	const trimmed = searchTerm.trim();
	if (trimmed.length === 0) return codes;

	if (isCodeLikeSearch(trimmed)) {
		const lowered = trimmed.toLowerCase();
		const normalizedQuery = normalizeCodeSearch(trimmed);
		return codes
			.filter((code) => {
				const normalizedCodeValue = normalizeCodeSearch(code.code);
				return (
					code.code.toLowerCase().startsWith(lowered) ||
					normalizedCodeValue.startsWith(normalizedQuery)
				);
			})
			.sort((a, b) => {
				const rankDiff =
					getCodeSearchRank(a, lowered) - getCodeSearchRank(b, lowered);
				if (rankDiff !== 0) return rankDiff;
				return a.code.length - b.code.length || a.code.localeCompare(b.code);
			});
	}

	const tokens = getSearchTokens(trimmed);
	return codes.filter((code) => {
		const text = getSearchableText(code);
		return tokens.every((tokenGroup) =>
			tokenGroup.some((token) => text.includes(token)),
		);
	});
}

interface NacebelSearchClientProps {
	initialCodes: NacebelCode[];
}

export default function NacebelSearchClient({
	initialCodes,
}: NacebelSearchClientProps) {
	const locale = useLocale();
	const t = useT(siteScope);

	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const [searchTerm, setSearchTerm] = useState(() => searchParams.get("q") ?? "");
	const [copiedCode, setCopiedCode] = useState<string | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const searchInputRef = useRef<HTMLInputElement>(null);
	const isFirstUrlSync = useRef(true);

	useEffect(() => {
		if (isFirstUrlSync.current) {
			isFirstUrlSync.current = false;
			return;
		}
		const handle = setTimeout(() => {
			const trimmed = searchTerm.trim();
			const url = trimmed
				? `${pathname}?q=${encodeURIComponent(trimmed)}`
				: pathname;
			router.replace(url, { scroll: false });
		}, URL_SYNC_DEBOUNCE_MS);
		return () => clearTimeout(handle);
	}, [searchTerm, router, pathname]);

	const filteredCodes = useMemo(
		() => filterCodes(initialCodes, searchTerm),
		[initialCodes, searchTerm],
	);

	useEffect(() => {
		setCurrentPage(1);
	}, [searchTerm]);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			const target = event.target as HTMLElement | null;
			const isTextInput =
				target instanceof HTMLInputElement ||
				target instanceof HTMLTextAreaElement ||
				target?.isContentEditable === true;
			const isSlashShortcut =
				event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey;
			const isCommandShortcut =
				(event.metaKey || event.ctrlKey) &&
				event.key.toLowerCase() === "k" &&
				!event.altKey;

			if (!isSlashShortcut && !isCommandShortcut) return;
			if (
				isTextInput &&
				target !== searchInputRef.current &&
				!isCommandShortcut
			) {
				return;
			}

			event.preventDefault();
			searchInputRef.current?.focus();
			searchInputRef.current?.select();
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	const totalPages = Math.ceil(filteredCodes.length / ITEMS_PER_PAGE);
	const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
	const endIndex = startIndex + ITEMS_PER_PAGE;
	const paginatedCodes = useMemo(
		() => filteredCodes.slice(startIndex, endIndex),
		[filteredCodes, startIndex, endIndex],
	);

	const flashCopied = useCallback(
		(code: string) => {
			setCopiedCode(code);
			toast(t("Copied to clipboard"), {
				duration: COPY_FEEDBACK_MS,
			});
			setTimeout(() => setCopiedCode(null), COPY_FEEDBACK_MS);
		},
		[t],
	);

	const copyCodeOnly = useCallback(
		(code: string) => {
			navigator.clipboard.writeText(code).then(() => flashCopied(code));
		},
		[flashCopied],
	);

	const copyToClipboard = useCallback(
		(code: string, description: string) => {
			navigator.clipboard
				.writeText(`${code} - ${description}`)
				.then(() => flashCopied(code));
		},
		[flashCopied],
	);

	const getExternalLink = useCallback(
		(code: string) =>
			`https://kbopub.economie.fgov.be/kbopub/naceToelichting.html?lang=${locale}&nace.code=${code.replace(/\./g, "")}&nace.version=2025`,
		[locale],
	);

	const getDetailLink = useCallback(
		(code: NacebelCode) => {
			const title = code.titles[locale] || code.titles.en || code.code;
			const slug = slugify(title) || "code";
			return `/${locale}/${code.code}/${slug}`;
		},
		[locale],
	);

	const handleExport = useCallback(
		(format: ExportFormat) => {
			exportCodes(format, {
				codes: filteredCodes,
				locale,
				columns: {
					level: t("Level"),
					code: t("Code"),
					title: `${t("Description")} (${locale.toUpperCase()})`,
				},
			});
			toast(
				t("Exported {count} codes as {format}", {
					count: filteredCodes.length,
					format: EXPORT_FORMAT_LABELS[format],
				}),
				{ duration: 3000 },
			);
		},
		[filteredCodes, locale, t],
	);

	if (initialCodes.length === 0) {
		return (
			<div className="text-center text-red-500 dark:text-red-400">
				{t("Could not load NACEBEL codes.")}
			</div>
		);
	}

	const resultsHeading = searchTerm
		? t('Results for "{query}"', { query: searchTerm })
		: t("All codes");
	const total = initialCodes.length;

	return (
		<>
			{/* Board hero — the committed surface. */}
			<section className="border-b border-border bg-board text-board-foreground">
				<div className="container py-10 sm:py-14">
					<p className="font-mono text-xs tracking-wider text-board-muted uppercase">
						NACE-BEL 2025 · Belgium
					</p>
					<h1 className="mt-3 max-w-4xl text-3xl leading-[1.03] font-extrabold tracking-tight sm:text-5xl">
						{t("NACE-BEL 2025 Codes")}
					</h1>
					<p className="mt-4 max-w-xl leading-relaxed text-board-muted">
						{t(
							"Search the official directory and export the current results.",
						)}
					</p>

					<div className="mt-7 max-w-2xl">
						<SearchInput
							ref={searchInputRef}
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
							placeholder={t("Search by code number or description...")}
							autoFocus
						/>
						<div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-board-muted">
							<span>{t("Try:")}</span>
							{EXAMPLE_SEARCHES.map((example) => (
								<button
									key={example}
									type="button"
									onClick={() => setSearchTerm(example)}
									data-code
									className="rounded-md border border-white/15 bg-white/5 px-2 py-0.5 text-board-foreground transition-colors hover:border-primary/60 hover:bg-white/10"
								>
									{example}
								</button>
							))}
						</div>
					</div>
				</div>
			</section>

			<main className="container py-6 sm:py-8">
				{/* Results header — the index masthead row. */}
				<div className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-end sm:justify-between">
					<div className="min-w-0">
						<h2 className="truncate text-lg font-bold tracking-tight">
							{resultsHeading}
						</h2>
						<p className="mt-0.5 font-mono text-xs text-muted-foreground">
							{t("Showing {from}-{to} of {total, number} codes", {
								from: filteredCodes.length > 0 ? startIndex + 1 : 0,
								to: Math.min(endIndex, filteredCodes.length),
								total: filteredCodes.length,
							})}
							{searchTerm
								? ` · ${t("{total, number} indexed", { total })}`
								: null}
						</p>
					</div>
					<ExportMenu
						label={t("Export")}
						disabled={filteredCodes.length === 0}
						onExport={handleExport}
						className="shrink-0 self-start sm:self-auto"
					/>
				</div>

				{/* The ruled directory index. */}
				<div className="rounded-lg border border-border bg-card">
					{paginatedCodes.length > 0 ? (
						<NacebelCodeList
							codes={paginatedCodes}
							language={locale}
							searchTerm={searchTerm}
							copiedCode={copiedCode}
							onCopyCode={copyCodeOnly}
							onCopy={copyToClipboard}
							getExternalLink={getExternalLink}
							getDetailLink={getDetailLink}
						/>
					) : (
						<div className="px-4 py-16 text-center">
							<p className="font-medium text-foreground">
								{t(
									"No NACEBEL codes found matching your search criteria",
								)}
							</p>
						</div>
					)}
				</div>

				{totalPages > 1 ? (
					<PaginationControls
						currentPage={currentPage}
						totalPages={totalPages}
						setCurrentPage={setCurrentPage}
						className="mt-6 justify-center"
					/>
				) : null}
			</main>

			<PageFooter />
		</>
	);
}
