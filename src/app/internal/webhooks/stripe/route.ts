import { readStripeWebhook } from "@ingram-tech/nk-billing";

import { localeFromMetadata, sendDatasetEmail } from "@/lib/dataset/email";
import { downloadLinksFor } from "@/lib/dataset/links";
import { isPaidDatasetSession } from "@/lib/dataset/stripe";

export const dynamic = "force-dynamic";

/**
 * Stripe → us. The one event that matters is a completed, paid dataset
 * checkout: email the buyer their download links. Everything else on this
 * (shared) account is acknowledged and ignored.
 *
 * There is no purchase table, so nothing dedupes retries: Stripe only retries
 * on a non-2xx, so a second email can only follow a failed first send, which
 * is the retry we want.
 */
export async function POST(request: Request) {
	const res = await readStripeWebhook(
		request,
		process.env.STRIPE_WEBHOOK_SECRET ?? "",
	);
	if (!res.ok) return new Response(res.message, { status: res.status });

	const { event } = res;
	if (
		event.type !== "checkout.session.completed" &&
		event.type !== "checkout.session.async_payment_succeeded"
	) {
		return Response.json({ received: true });
	}

	const session = event.data.object;
	if (!isPaidDatasetSession(session)) return Response.json({ received: true });

	const email = session.customer_details?.email;
	if (!email) {
		console.error("paid dataset session without an email", session.id);
		return Response.json({ received: true });
	}

	await sendDatasetEmail({
		to: email,
		locale: localeFromMetadata(session.metadata?.locale),
		links: downloadLinksFor(session.id),
	});
	return Response.json({ received: true });
}
