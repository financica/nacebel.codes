"use client";

import { CheckCircle2Icon, DownloadIcon } from "lucide-react";

import { useT } from "@/lib/i18n";
import { siteScope } from "@/lib/i18n/scopes/site";
import { DATASET_FORMATS, type DatasetFormat } from "@/lib/dataset/constants";

export const DATASET_FORMAT_LABELS: Record<DatasetFormat, string> = {
	csv: "CSV",
	json: "JSON",
	xlsx: "Excel (XLSX)",
};

const FORMAT_HINTS: Record<DatasetFormat, string> = {
	csv: "nacebel-2025.csv",
	json: "nacebel-2025.json",
	xlsx: "nacebel-2025.xlsx",
};

export function DownloadLinks({
	links,
	email,
}: {
	links: Record<DatasetFormat, string>;
	email: string | null;
}) {
	const t = useT(siteScope);
	return (
		<div className="space-y-4">
			<div className="flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
				<CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
				<div>
					<p className="font-semibold">
						{t("Payment received — thank you.")}
					</p>
					<p className="text-muted-foreground">
						{email
							? t("We also emailed these links to {email}.", { email })
							: t("We also emailed these links to you.")}
					</p>
				</div>
			</div>
			<ul className="divide-y divide-border rounded-lg border border-border">
				{DATASET_FORMATS.map((format) => (
					<li key={format}>
						<a
							href={links[format]}
							className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted"
						>
							<span>
								<span className="font-semibold">
									{DATASET_FORMAT_LABELS[format]}
								</span>
								<span className="ml-2 font-mono text-xs text-muted-foreground">
									{FORMAT_HINTS[format]}
								</span>
							</span>
							<DownloadIcon className="size-4 text-primary" />
						</a>
					</li>
				))}
			</ul>
			<p className="text-xs text-muted-foreground">
				{t(
					"Links stay valid for one year and always serve the latest revision. Your invoice arrives separately from Stripe.",
				)}
			</p>
		</div>
	);
}
