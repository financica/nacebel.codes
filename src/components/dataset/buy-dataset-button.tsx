"use client";

import { DatabaseIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/contexts/locale-context";
import { DATASET_PRICE_EUR_CENTS, formatPriceEur } from "@/lib/dataset/constants";
import { useT } from "@/lib/i18n";
import { siteScope } from "@/lib/i18n/scopes/site";
import { cn } from "@/lib/utils";

import { BuyDatasetDialog } from "./buy-dataset-dialog";

interface BuyDatasetButtonProps {
	variant?: "default" | "outline";
	size?: "sm" | "lg";
	className?: string;
}

/** The one call to action for the paid dataset: opens checkout in place. */
export function BuyDatasetButton({
	variant = "outline",
	size = "sm",
	className,
}: BuyDatasetButtonProps) {
	const locale = useLocale();
	const t = useT(siteScope);
	const [open, setOpen] = useState(false);
	const price = formatPriceEur(DATASET_PRICE_EUR_CENTS, locale);

	return (
		<>
			<Button
				variant={variant}
				size={size}
				className={cn(
					size === "sm" ? "h-9 gap-2 px-3" : "h-11 gap-2 px-5 text-base",
					className,
				)}
				onClick={() => setOpen(true)}
			>
				<DatabaseIcon className={size === "sm" ? "size-4" : "size-5"} />
				<span>{t("Full dataset · {price}", { price })}</span>
			</Button>
			<BuyDatasetDialog open={open} onOpenChange={setOpen} />
		</>
	);
}
