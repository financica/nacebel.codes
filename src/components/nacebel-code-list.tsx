"use client";

import type { Language, NacebelCode } from "@/types";
import { NacebelCodeItem } from "./nacebel-code-item";

interface NacebelCodeListProps {
	codes: NacebelCode[];
	language: Language;
	searchTerm: string;
	copiedCode: string | null;
	onCopyCode: (code: string) => void;
	onCopy: (code: string, description: string) => void;
	getExternalLink: (code: string) => string;
	getDetailLink: (code: NacebelCode) => string;
}

export function NacebelCodeList({
	codes,
	language,
	searchTerm,
	copiedCode,
	onCopyCode,
	onCopy,
	getExternalLink,
	getDetailLink,
}: NacebelCodeListProps) {
	return (
		<div className="divide-y divide-border">
			{codes.map((code) => (
				<NacebelCodeItem
					key={code.code}
					code={code}
					language={language}
					searchTerm={searchTerm}
					copiedCode={copiedCode}
					onCopyCode={onCopyCode}
					onCopy={onCopy}
					getExternalLink={getExternalLink}
					getDetailLink={getDetailLink}
				/>
			))}
		</div>
	);
}
