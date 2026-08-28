"use client";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EXPORT_FORMAT_LABELS, EXPORT_FORMATS, type ExportFormat } from "@/lib/export";
import { cn } from "@/lib/utils";
import { ChevronDownIcon, DownloadIcon, LockIcon, SparklesIcon } from "lucide-react";

interface ExportMenuProps {
	label: string;
	/** When set, the formats are greyed out and this unlock entry is offered instead. */
	locked?: { label: string; onUnlock: () => void };
	disabled?: boolean;
	onExport: (format: ExportFormat) => void;
	className?: string;
}

export function ExportMenu({
	label,
	locked,
	disabled,
	onExport,
	className,
}: ExportMenuProps) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				disabled={disabled}
				render={
					<Button
						variant="outline"
						size="sm"
						className={cn("h-9 gap-2 px-3", className)}
					/>
				}
			>
				<DownloadIcon className="h-4 w-4" />
				<span>{label}</span>
				{locked ? (
					<SparklesIcon className="h-3.5 w-3.5 text-primary" aria-hidden />
				) : null}
				<ChevronDownIcon className="h-4 w-4 opacity-60" />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="min-w-40">
				{EXPORT_FORMATS.map((format) => (
					<DropdownMenuItem
						key={format}
						disabled={Boolean(locked)}
						onClick={() => onExport(format)}
					>
						{EXPORT_FORMAT_LABELS[format]}
					</DropdownMenuItem>
				))}
				{locked ? (
					<>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={locked.onUnlock}
							className="font-semibold text-primary data-[highlighted]:text-primary"
						>
							<LockIcon className="h-3.5 w-3.5" />
							{locked.label}
						</DropdownMenuItem>
					</>
				) : null}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
