"use client";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EXPORT_FORMAT_LABELS, EXPORT_FORMATS, type ExportFormat } from "@/lib/export";
import { cn } from "@/lib/utils";
import { ChevronDownIcon, DownloadIcon } from "lucide-react";

interface ExportMenuProps {
	label: string;
	disabled?: boolean;
	onExport: (format: ExportFormat) => void;
	className?: string;
}

export function ExportMenu({ label, disabled, onExport, className }: ExportMenuProps) {
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
				<ChevronDownIcon className="h-4 w-4 opacity-60" />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="min-w-40">
				{EXPORT_FORMATS.map((format) => (
					<DropdownMenuItem key={format} onClick={() => onExport(format)}>
						{EXPORT_FORMAT_LABELS[format]}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
