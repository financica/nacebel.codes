import { getNacebelCodeDetails } from "@/lib/nacebelData";
import { NextResponse } from "next/server";

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface RouteContext {
	params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
	try {
		const { id } = await params;

		if (!id) {
			return NextResponse.json(
				{ error: "Code ID is required." },
				{ status: 400, headers: corsHeaders },
			);
		}

		const codeDetails = await getNacebelCodeDetails(id);

		if (!codeDetails) {
			return NextResponse.json(
				{ error: "NACEBEL code not found." },
				{ status: 404, headers: corsHeaders },
			);
		}

		return NextResponse.json(codeDetails, { headers: corsHeaders });
	} catch (error) {
		console.error("API Error:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500, headers: corsHeaders },
		);
	}
}

export async function OPTIONS() {
	return new Response(null, { status: 200, headers: corsHeaders });
}
