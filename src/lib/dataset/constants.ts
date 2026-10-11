/**
 * The paid full-dataset download — one source of truth shared by the app and
 * the Pulumi program that declares the Stripe catalogue (pulumi/).
 *
 * The app never hardcodes a Stripe price id: checkout resolves the price at
 * runtime by {@link DATASET_PRICE_LOOKUP_KEY}, so the same code path works in
 * the sandbox and live. The amount is kept here only so the UI can show the
 * price without a Stripe round-trip on a static page; the Stripe price is what
 * the customer is actually charged and Pulumi keeps the two in step.
 */

export const DATASET_PRICE_LOOKUP_KEY = "nacebel_dataset_2025";

/** Cents, excl. VAT — Stripe Tax adds the customer's VAT at checkout. */
export const DATASET_PRICE_EUR_CENTS = 1900;

export const DATASET_PRODUCT_NAME = "NACE-BEL 2025 — full dataset";

export const DATASET_PRODUCT_DESCRIPTION =
	"The complete NACE-BEL 2025 classification (all levels, all four languages, explanatory notes) as CSV, JSON and Excel. Download links stay valid for one year and always serve the latest revision.";

/** How long a purchase's download links stay valid. */
export const DATASET_LINK_TTL_DAYS = 365;

export const DATASET_FORMATS = ["csv", "json", "xlsx"] as const;
export type DatasetFormat = (typeof DATASET_FORMATS)[number];

export function isDatasetFormat(value: string): value is DatasetFormat {
	return (DATASET_FORMATS as readonly string[]).includes(value);
}

export function formatPriceEur(cents: number, locale: string): string {
	return new Intl.NumberFormat(locale, {
		style: "currency",
		currency: "EUR",
		minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
	}).format(cents / 100);
}
