import { createFormToken, verifyHuman } from "@ingram-tech/bot-protection";
import { NextResponse } from "next/server";

import { sendDatasetEmail } from "@/lib/dataset/email";
import { downloadLinksFor } from "@/lib/dataset/links";
import { resendBodySchema } from "@/lib/dataset/schemas";
import { findPaidDatasetSessionsByEmail } from "@/lib/dataset/stripe";

// The bot-protection token is a signed timestamp: it must be minted per
// request, never cached with the page.
export const dynamic = "force-dynamic";

export const GET = () => Response.json({ token: createFormToken() });

/**
 * "Lost your links?" — re-sends the download email for every paid purchase
 * made with this address. Always answers 200 so the form can't be used to
 * probe which emails have bought.
 */
export async function POST(request: Request) {
	const body: unknown = await request.json().catch(() => null);
	const parsed = resendBodySchema.safeParse(body);
	if (!parsed.success) return NextResponse.json({ ok: true });

	const human = await verifyHuman({ formData: parsed.data });
	if (!human.ok) return NextResponse.json({ ok: true });

	const { email, locale } = parsed.data;
	try {
		const sessions = await findPaidDatasetSessionsByEmail(email);
		// One email per purchase is what the buyer expects if they bought twice;
		// in practice it's one.
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
	return NextResponse.json({ ok: true });
}
