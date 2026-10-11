import { escapeHtml, fromAddress, sendEmail } from "@ingram-tech/nk-email";

import { createT } from "@/lib/i18n/core";
import { type Locale, SUPPORTED_LOCALES } from "@/lib/i18n/locales";
import { siteScope } from "@/lib/i18n/scopes/site";

import { DATASET_FORMATS, DATASET_LINK_TTL_DAYS } from "./constants";
import { appOrigin, type DownloadLinks } from "./links";

const FORMAT_LABELS: Record<(typeof DATASET_FORMATS)[number], string> = {
	csv: "CSV",
	json: "JSON",
	xlsx: "Excel (XLSX)",
};

export function localeFromMetadata(value: string | undefined): Locale {
	return value && (SUPPORTED_LOCALES as readonly string[]).includes(value)
		? (value as Locale)
		: "en";
}

export async function sendDatasetEmail(opts: {
	to: string;
	locale: Locale;
	links: DownloadLinks;
}): Promise<void> {
	const t = createT(opts.locale, siteScope);
	const origin = appOrigin();
	const datasetUrl = `${origin}/${opts.locale}/dataset`;

	const subject = t("Your NACE-BEL 2025 dataset");
	const intro = t(
		"Thanks for your purchase. Your download links are below — they stay valid for one year and always serve the latest revision of the dataset.",
	);
	const invoiceNote = t("Your invoice was sent separately by Stripe.");
	const resendNote = t(
		"Lost this email? Enter your email address on the dataset page and we will resend your links.",
	);

	const linkLines = DATASET_FORMATS.map(
		(format) => `${FORMAT_LABELS[format]}: ${opts.links[format]}`,
	);
	const text = [
		intro,
		"",
		...linkLines,
		"",
		invoiceNote,
		resendNote,
		datasetUrl,
		"",
		"nacebel.codes",
	].join("\n");

	const linkItems = DATASET_FORMATS.map(
		(format) =>
			`<li style="margin:0 0 8px"><a href="${escapeHtml(opts.links[format])}" style="color:#c2410c;font-weight:600">${escapeHtml(FORMAT_LABELS[format])}</a></li>`,
	).join("");
	const html = `<!doctype html>
<html><body style="margin:0;padding:24px;background:#f8fafc;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2937">
<div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:28px">
<p style="margin:0 0 4px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#6b7280">nacebel.codes</p>
<h1 style="margin:0 0 16px;font-size:20px">${escapeHtml(subject)}</h1>
<p style="margin:0 0 16px;line-height:1.55">${escapeHtml(intro)}</p>
<ul style="margin:0 0 20px;padding-left:20px;line-height:1.5">${linkItems}</ul>
<p style="margin:0 0 8px;font-size:13px;color:#6b7280;line-height:1.5">${escapeHtml(invoiceNote)}</p>
<p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5">${escapeHtml(resendNote)} <a href="${escapeHtml(datasetUrl)}" style="color:#c2410c">${escapeHtml(datasetUrl)}</a></p>
</div>
<p style="max-width:560px;margin:16px auto 0;font-size:12px;color:#9ca3af">${escapeHtml(
		t("Links expire {days} days after purchase.", { days: DATASET_LINK_TTL_DAYS }),
	)}</p>
</body></html>`;

	await sendEmail({
		to: opts.to,
		from: fromAddress("nacebel.codes", "nacebel"),
		replyTo: "contact@nacebel.codes",
		subject,
		html,
		text,
	});
}
