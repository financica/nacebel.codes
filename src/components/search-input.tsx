"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { SearchIcon } from "lucide-react";

interface SearchInputProps {
	searchTerm: string;
	setSearchTerm: (term: string) => void;
	placeholder: string;
	className?: string;
	autoFocus?: boolean;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
	({ searchTerm, setSearchTerm, placeholder, className, autoFocus }, ref) => {
		return (
			<div className={cn("group relative w-full", className)}>
				<SearchIcon
					className="pointer-events-none absolute inset-y-0 left-4 my-auto h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary"
					aria-hidden
				/>
				<input
					ref={ref}
					type="search"
					placeholder={placeholder}
					autoFocus={autoFocus}
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					aria-label={placeholder}
					enterKeyHint="search"
					className="h-14 w-full rounded-lg border border-border-strong bg-card pr-14 pl-12 text-base text-foreground shadow-sm transition-[border-color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15 [&::-webkit-search-cancel-button]:hidden"
				/>
				<kbd className="pointer-events-none absolute inset-y-0 right-4 my-auto hidden h-6 items-center rounded border border-border bg-muted px-2 font-mono text-xs font-medium text-muted-foreground sm:inline-flex">
					/
				</kbd>
			</div>
		);
	},
);

SearchInput.displayName = "SearchInput";
