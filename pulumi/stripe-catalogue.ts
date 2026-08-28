/**
 * The Stripe catalogue for the dataset purchase, declared from the same
 * constants the app resolves against at runtime (../lib/dataset/constants):
 * one source of truth, so a price change is a code review, not a Dashboard
 * click. Same shape as financica's pulumi/stripe-catalogue.ts.
 *
 * The key comes from this stack's own encrypted config:
 *   pulumi config set --secret stripeSecretKey <sk_…>
 * Its mode decides which catalogue is touched: the sandbox key provisions the
 * sandbox, the live key provisions production, off the identical program.
 *
 * This is the shared Ingram Stripe account (financica's): Stripe Tax's head
 * office and BE registration are already configured per mode, which is what
 * lets Checkout run automatic_tax. Nothing here touches those settings.
 *
 * Stripe prices are IMMUTABLE: changing the amount makes Pulumi replace the
 * Price, and `transferLookupKey` moves the stable lookup_key onto the
 * replacement so checkout keeps resolving it.
 */
import * as pulumi from "@pulumi/pulumi";
import { Price, Product, Provider, WebhookEndpoint } from "pulumi-stripe";
import {
	DATASET_PRICE_EUR_CENTS,
	DATASET_PRICE_LOOKUP_KEY,
	DATASET_PRODUCT_DESCRIPTION,
	DATASET_PRODUCT_NAME,
} from "../lib/dataset/constants";

// The events app/internal/webhooks/stripe/route.ts acts on: a paid checkout
// (card: `completed` already carries payment_status=paid; bank debit: the
// async event lands when the money does).
const WEBHOOK_EVENTS = [
	"checkout.session.completed",
	"checkout.session.async_payment_succeeded",
];

export function createStripeCatalogue(): {
	productId: pulumi.Output<string>;
	priceId: pulumi.Output<string>;
	webhookSecret: pulumi.Output<string> | undefined;
} {
	const cfg = new pulumi.Config();
	const provider = new Provider("stripe", {
		apiKey: cfg.requireSecret("stripeSecretKey"),
	});
	const onStripe = { provider };

	const product = new Product(
		"nacebel-dataset-2025",
		{
			name: DATASET_PRODUCT_NAME,
			description: DATASET_PRODUCT_DESCRIPTION,
			// Stripe Tax category: a downloadable data file is an electronically
			// supplied service — 21% for a Belgian buyer, reverse charge for an EU
			// business with a VAT number, out of scope outside the EU.
			taxCode: "txcd_10000000",
			metadata: { nacebel_product: "dataset" },
		},
		onStripe,
	);

	const price = new Price(
		DATASET_PRICE_LOOKUP_KEY,
		{
			product: product.id,
			currency: "eur",
			unitAmount: DATASET_PRICE_EUR_CENTS,
			lookupKey: DATASET_PRICE_LOOKUP_KEY,
			transferLookupKey: true,
			// Checkout runs automatic_tax and rejects prices whose tax_behavior is
			// "unspecified"; it can only be set once.
			taxBehavior: "exclusive",
			metadata: { nacebel_product: "dataset" },
		},
		onStripe,
	);

	// Only a stack with a public URL gets an endpoint (prod). Local dev uses
	// `stripe listen --forward-to localhost:3000/internal/webhooks/stripe` and
	// hand-sets STRIPE_WEBHOOK_SECRET in .env.local from its output.
	const webhookUrl = cfg.get("webhookUrl");
	const webhook = webhookUrl
		? new WebhookEndpoint(
				"dataset-webhook",
				{
					url: webhookUrl,
					enabledEvents: WEBHOOK_EVENTS,
					description: "nacebel.codes dataset purchase webhook",
					metadata: { created_by: "nacebel-codes-pulumi" },
				},
				onStripe,
			)
		: undefined;

	return {
		productId: product.id,
		priceId: price.id,
		webhookSecret: webhook ? pulumi.secret(webhook.secret) : undefined,
	};
}
