import { NextResponse } from "next/server";

import { checkoutBodySchema } from "@/lib/dataset/schemas";
import { createDatasetCheckout } from "@/lib/dataset/stripe";

export const dynamic = "force-dynamic";

/** Opens an embedded Checkout Session for the full dataset. */
export async function POST(request: Request) {
	const parsed = checkoutBodySchema.safeParse(await request.json().catch(() => null));
	if (!parsed.success) {
		return NextResponse.json({ error: "Invalid request" }, { status: 400 });
	}
	try {
		const session = await createDatasetCheckout(parsed.data.locale);
		return NextResponse.json(session);
	} catch (error) {
		console.error("dataset checkout failed", error);
		return NextResponse.json({ error: "Checkout unavailable" }, { status: 503 });
	}
}
