import { NextResponse } from "next/server";

import { downloadLinksFor } from "@/lib/dataset/links";
import { claimBodySchema } from "@/lib/dataset/schemas";
import { retrievePaidDatasetSession } from "@/lib/dataset/stripe";

export const dynamic = "force-dynamic";

/**
 * Called by the page right after embedded Checkout reports completion: turns
 * a paid session into download links on the spot, so the buyer never waits
 * for the email. The webhook sends the same links by email independently.
 */
export async function POST(request: Request) {
	const parsed = claimBodySchema.safeParse(await request.json().catch(() => null));
	if (!parsed.success) {
		return NextResponse.json({ error: "Invalid request" }, { status: 400 });
	}
	const session = await retrievePaidDatasetSession(parsed.data.sessionId);
	if (!session) {
		return NextResponse.json({ error: "Payment not confirmed" }, { status: 402 });
	}
	return NextResponse.json({
		email: session.customer_details?.email ?? null,
		links: downloadLinksFor(session.id, new URL(request.url).origin),
	});
}
