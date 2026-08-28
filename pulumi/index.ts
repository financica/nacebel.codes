/**
 * nacebel.codes — Stripe dataset catalogue + app-owned Vercel env. See
 * Pulumi.yaml for the split with the infra repo.
 *
 *   set -a && source ~/src/infra/.env && set +a   # backend creds + passphrase
 *   pulumi stack select prod|dev
 *   pulumi preview --diff && pulumi up
 */
import { createStripeCatalogue } from "./stripe-catalogue";
import { createVercelEnv } from "./vercel-env";

const catalogue = createStripeCatalogue();
export const stripeProductId = catalogue.productId;
export const stripePriceId = catalogue.priceId;
export const stripeWebhookSecret = catalogue.webhookSecret;

createVercelEnv({ webhookSecret: catalogue.webhookSecret });
