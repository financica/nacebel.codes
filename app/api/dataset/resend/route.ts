import { handleFormSubmission, mintFormToken } from "@ingram-tech/nk-forms";

import { sendDatasetEmail } from "@/lib/dataset/email";
import { downloadLinksFor } from "@/lib/dataset/links";
import { resendBodySchema } from "@/lib/dataset/schemas";
import { findPaidDatasetSessionsByEmail } from "@/lib/dataset/stripe";

// The bot-protection token is a signed timestamp: it must be minted per
// request, never cached with the page.
export const dynamic = "force-dynamic";

export { mintFormToken as GET };

/**
 * "Lost your links?" — re-sends the download email for every paid purchase
 * made with this address. Delivery failures are swallowed so the reply is the
 * same whatever happened: the form must not become a way to probe which
 * emails have bought.
 */
export const POST = (request: Request) =>
	handleFormSubmission(request, {
		schema: resendBodySchema,
		label: "dataset-resend",
		logger: console,
		onSubmit: async ({ email, locale }) => {
			try {
				const sessions = await findPaidDatasetSessionsByEmail(email);
				// One email per purchase is what the buyer expects if they bought
				// twice; in practice it's one.
				for (const session of sessions) {
					await sendDatasetEmail({
						to: email,
						locale,
						links: downloadLinksFor(session.id),
					});
				}
			} catch (error) {
				console.error("dataset resend failed", error);
			}
		},
	});
