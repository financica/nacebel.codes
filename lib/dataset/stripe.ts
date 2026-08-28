/**
 * The purchase lives entirely in Stripe: a paid Checkout Session *is* the
 * record. Everything here is a thin layer over nk-billing's client + lookup-key
 * resolution; the embedded-UI session shape is spelled out locally because
 * nk-billing's `createCheckoutSession` only models the hosted redirect flow.
 */

import { getStripe, priceByLookupKey } from "@ingram-tech/nk-billing";
import type Stripe from "stripe";

import type { Locale } from "@/lib/i18n/locales";

import { DATASET_PRICE_LOOKUP_KEY, DATASET_PRODUCT_NAME } from "./constants";

/** Tag every dataset session so the webhook can tell it from anything else
 *  this Stripe account (shared with other Ingram sites) emits. */
export const SESSION_PRODUCT_TAG = { nacebel_product: "dataset" } as const;

export async function createDatasetCheckout(
	locale: Locale,
): Promise<{ clientSecret: string; sessionId: string }> {
	const stripe = getStripe();
	const price = await priceByLookupKey(DATASET_PRICE_LOOKUP_KEY, stripe);

	const session = await stripe.checkout.sessions.create({
		ui_mode: "embedded_page",
		// The page handles completion itself (`onComplete`), no round-trip to
		// a success URL — that's what keeps the whole flow on one page.
		redirect_on_completion: "never",
		mode: "payment",
		locale,
		line_items: [{ price: price.id, quantity: 1 }],
		// Quoted excl. VAT; the price carries tax_behavior "exclusive" so Stripe
		// Tax adds 21% for a Belgian buyer, reverse-charges an EU business with a
		// valid VAT number, and charges nothing outside the EU.
		automatic_tax: { enabled: true },
		billing_address_collection: "required",
		// A VAT number is optional at checkout; giving one is what turns the
		// receipt into a reverse-charge invoice. Payment mode needs a real
		// Customer for tax-id collection, hence `customer_creation: "always"`.
		tax_id_collection: { enabled: true },
		customer_creation: "always",
		// Stripe issues a proper invoice (PDF + hosted page) once paid, so the
		// buyer's bookkeeping needs nothing from us.
		invoice_creation: {
			enabled: true,
			invoice_data: {
				description: DATASET_PRODUCT_NAME,
				metadata: { ...SESSION_PRODUCT_TAG, locale },
			},
		},
		payment_intent_data: { description: DATASET_PRODUCT_NAME },
		allow_promotion_codes: false,
		metadata: { ...SESSION_PRODUCT_TAG, locale },
	});

	if (!session.client_secret) {
		throw new Error("Stripe did not return a checkout client secret");
	}
	return { clientSecret: session.client_secret, sessionId: session.id };
}

export function isPaidDatasetSession(session: Stripe.Checkout.Session): boolean {
	return (
		session.payment_status === "paid" &&
		session.metadata?.nacebel_product === SESSION_PRODUCT_TAG.nacebel_product
	);
}

// Paid is a terminal state, so a positive answer is safe to cache for the
// life of the instance; a negative one is re-asked (the buyer may still be
// mid-payment).
const paidSessions = new Set<string>();

/** The session, if it exists and is a paid dataset purchase. */
export async function retrievePaidDatasetSession(
	sessionId: string,
): Promise<Stripe.Checkout.Session | null> {
	const stripe = getStripe();
	try {
		const session = await stripe.checkout.sessions.retrieve(sessionId);
		if (!isPaidDatasetSession(session)) return null;
		paidSessions.add(sessionId);
		return session;
	} catch (error) {
		if ((error as { code?: string }).code === "resource_missing") return null;
		throw error;
	}
}

export async function isPaidDatasetSessionId(sessionId: string): Promise<boolean> {
	if (paidSessions.has(sessionId)) return true;
	return (await retrievePaidDatasetSession(sessionId)) !== null;
}

/** Every paid dataset purchase made with this email, newest first. */
export async function findPaidDatasetSessionsByEmail(
	email: string,
): Promise<Stripe.Checkout.Session[]> {
	const stripe = getStripe();
	const sessions = await stripe.checkout.sessions.list({
		customer_details: { email },
		status: "complete",
		limit: 20,
	});
	return sessions.data.filter(isPaidDatasetSession);
}
