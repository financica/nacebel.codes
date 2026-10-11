"use client";

import { useT } from "@/lib/i18n";
import { siteScope } from "@/lib/i18n/scopes/site";
import { cn } from "@/lib/utils";
import type { Language, NacebelCode } from "@/types";
import { CheckIcon, CopyIcon, ExternalLinkIcon } from "lucide-react";
import { memo, type ReactNode } from "react";

function levelVar(level: number): string {
	// Sections (L1) sit above the coloured level scale — mark them with the brand
	// accent so they read as top-of-hierarchy headers, not another level.
	if (level === 1) return "var(--color-primary)";
	return `var(--color-level-${Math.min(Math.max(level, 2), 6)})`;
}

const REGEX_ESCAPE_RE = /[.*+?^${}()|[\]\\]/g;
const PUNCTUATION_RE = /[^\p{L}\p{N}\s]/gu;
const CODE_LIKE_RE = /^[\d.\s]+$/;

function escapeRegExp(value: string): string {
	return value.replace(REGEX_ESCAPE_RE, "\\$&");
}

function buildSearchPatterns(searchTerm: string): string[] {
	const trimmed = searchTerm.trim();
	if (trimmed.length === 0) return [];
	const patterns = new Set<string>();

	if (CODE_LIKE_RE.test(trimmed)) {
		if (trimmed.length >= 2) patterns.add(trimmed);
		return Array.from(patterns);
	}

	for (const token of trimmed.split(/\s+/)) {
		if (token.length >= 2) patterns.add(token);
	}
	for (const token of trimmed
		.replace(PUNCTUATION_RE, " ")
		.toLowerCase()
		.split(/\s+/)
		.filter(Boolean)) {
		if (token.length >= 2) patterns.add(token);
		if (token.endsWith("ing") && token.length > 5) {
			patterns.add(token.slice(0, -3));
		}
		if (token.endsWith("ies") && token.length > 4) {
			patterns.add(`${token.slice(0, -3)}y`);
		}
		if (token.endsWith("s") && token.length > 4) {
			patterns.add(token.slice(0, -1));
		}
	}

	return Array.from(patterns).sort((a, b) => b.length - a.length);
}

function renderHighlightedText(text: string, searchTerm: string): ReactNode {
	const patterns = buildSearchPatterns(searchTerm);
	if (patterns.length === 0) return text;

	const ranges: Array<{ start: number; end: number }> = [];
	for (const pattern of patterns) {
		const regex = new RegExp(escapeRegExp(pattern), "gi");
		for (const match of text.matchAll(regex)) {
			if (match.index !== undefined) {
				ranges.push({ start: match.index, end: match.index + match[0].length });
			}
		}
	}
	if (ranges.length === 0) return text;

	ranges.sort((a, b) => a.start - b.start || b.end - a.end);

	const merged: Array<{ start: number; end: number }> = [];
	for (const range of ranges) {
		const previous = merged[merged.length - 1];
		if (!previous || range.start > previous.end) {
			merged.push({ ...range });
		} else if (range.end > previous.end) {
			previous.end = range.end;
		}
	}

	const out: ReactNode[] = [];
	let cursor = 0;
	for (const range of merged) {
		if (range.start > cursor) out.push(text.slice(cursor, range.start));
		out.push(
			<strong key={`${range.start}-${range.end}`} className="font-semibold">
				{text.slice(range.start, range.end)}
			</strong>,
		);
		cursor = range.end;
	}
	if (cursor < text.length) out.push(text.slice(cursor));
	return out;
}

interface NacebelCodeItemProps {
	code: NacebelCode;
	language: Language;
	searchTerm: string;
	copiedCode: string | null;
	onCopyCode: (code: string) => void;
	onCopy: (code: string, description: string) => void;
	getExternalLink: (code: string) => string;
	getDetailLink: (code: NacebelCode) => string;
}

function NacebelCodeItemImpl({
	code,
	language,
	searchTerm,
	copiedCode,
	onCopyCode,
	onCopy,
	getExternalLink,
	getDetailLink,
}: NacebelCodeItemProps) {
	const t = useT(siteScope);
	const isCopied = copiedCode === code.code;
	const isSection = code.level === 1;
	const color = levelVar(code.level);
	const depth = Math.min(Math.max(code.level, 2), 6) - 2;

	return (
		<div
			data-section={isSection || undefined}
			className={cn(
				"group relative flex items-center gap-3 pr-1 transition-colors hover:bg-muted/70 sm:gap-4",
				isSection ? "bg-muted/60 py-3 hover:bg-muted" : "py-2.5",
			)}
			style={{ paddingInlineStart: `calc(0.25rem + ${depth} * 0.85rem)` }}
		>
			{/* depth tick — a quiet wayfinding marker in the accent-family;
			    a bolder full bar marks a section header */}
			<span
				aria-hidden
				className={cn(
					"w-[3px] shrink-0 rounded-full",
					isSection ? "h-6 opacity-100" : "h-4 opacity-70",
				)}
				style={{ background: color }}
			/>
			<button
				type="button"
				onClick={() => onCopyCode(code.code)}
				aria-label={t("Copy code {code}", { code: code.code })}
				title={t("Copy {code}", { code: code.code })}
				data-code
				className={cn(
					"shrink-0 rounded-sm px-1 py-0.5 font-semibold tabular-nums hover:bg-primary/10 focus-visible:bg-primary/10",
					isSection ? "text-base" : "text-sm",
				)}
				style={{ color, minWidth: "5.5ch" }}
			>
				{renderHighlightedText(code.code, searchTerm)}
			</button>
			<a
				href={getDetailLink(code)}
				className={cn(
					"min-w-0 flex-1 transition-colors hover:text-primary",
					isSection
						? "text-[0.95rem] font-bold tracking-wide text-foreground uppercase sm:text-base"
						: "text-[0.95rem] leading-6 text-foreground",
				)}
			>
				{renderHighlightedText(code.titles[language], searchTerm)}
			</a>
			{isSection ? (
				<span
					className="hidden shrink-0 rounded-full border px-2 py-0.5 font-mono text-[0.65rem] font-medium tracking-wide uppercase sm:inline"
					style={{ color, borderColor: color }}
				>
					{t("Section")}
				</span>
			) : (
				<span className="hidden shrink-0 font-mono text-xs text-muted-foreground sm:inline">
					L{code.level}
				</span>
			)}
			<div className="flex shrink-0 items-center gap-0.5 opacity-70 transition-opacity group-hover:opacity-100">
				<button
					type="button"
					onClick={() => onCopy(code.code, code.titles[language])}
					className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:bg-muted"
					aria-label={t("Copy code and description")}
				>
					{isCopied ? (
						<CheckIcon className="h-4 w-4 text-primary" />
					) : (
						<CopyIcon className="h-4 w-4" />
					)}
				</button>
				<a
					href={getExternalLink(code.code)}
					target="_blank"
					rel="noopener noreferrer"
					aria-label={t("Open {code} on the KBO register", {
						code: code.code,
					})}
					className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:bg-muted"
				>
					<ExternalLinkIcon className="h-4 w-4" />
				</a>
			</div>
		</div>
	);
}

export const NacebelCodeItem = memo(NacebelCodeItemImpl);
