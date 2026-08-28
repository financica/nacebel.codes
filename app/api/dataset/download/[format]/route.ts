import { NextResponse } from "next/server";

import { buildDatasetFile } from "@/lib/dataset/build";
import { isDatasetFormat } from "@/lib/dataset/constants";
import { isPaidDatasetSessionId } from "@/lib/dataset/stripe";
import { verifyDownloadToken } from "@/lib/dataset/token";

export const dynamic = "force-dynamic";

/** Serves one format of the full dataset against a signed purchase token. */
export async function GET(
	request: Request,
	{ params }: { params: Promise<{ format: string }> },
) {
	const { format } = await params;
	if (!isDatasetFormat(format)) {
		return NextResponse.json({ error: "Unknown format" }, { status: 404 });
	}

	const token = new URL(request.url).searchParams.get("t") ?? "";
	const grant = verifyDownloadToken(token);
	if (!grant) {
		return NextResponse.json(
			{ error: "This download link is invalid or has expired" },
			{ status: 403 },
		);
	}
	// The token proves we minted the link; Stripe proves the purchase is real
	// (a refunded or abandoned session never becomes "paid").
	if (!(await isPaidDatasetSessionId(grant.sessionId))) {
		return NextResponse.json({ error: "Purchase not found" }, { status: 403 });
	}

	const file = buildDatasetFile(format);
	return new Response(file.body, {
		headers: {
			"Content-Type": file.contentType,
			"Content-Disposition": `attachment; filename="${file.filename}"`,
			"Cache-Control": "private, no-store",
		},
	});
}
