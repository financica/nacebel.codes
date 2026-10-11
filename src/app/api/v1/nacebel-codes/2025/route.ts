// src/app/api/v1/nacebel-codes/2025/route.ts
import { getPaginatedNacebelCodes, searchNacebelCodes } from "@/lib/nacebelData";
import { NextResponse } from "next/server";

// CORS headers
const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const query = searchParams.get("q"); // Changed from 'query' to 'q'
		const page = Number.parseInt(searchParams.get("page") || "1", 10);
		const limit = Number.parseInt(searchParams.get("limit") || "100", 10);
		const levelParam = searchParams.get("level");
		const minLevel = levelParam ? Number.parseInt(levelParam, 10) : undefined;

		if (Number.isNaN(page) || page < 1) {
			return NextResponse.json(
				{ error: "Invalid 'page' parameter. Must be a positive number." },
				{ status: 400, headers: corsHeaders },
			);
		}
		if (Number.isNaN(limit) || limit < 1 || limit > 500) {
			return NextResponse.json(
				{
					error: "Invalid 'limit' parameter. Must be a positive number up to 500.",
				},
				{ status: 400, headers: corsHeaders },
			);
		}
		if (
			minLevel !== undefined &&
			(Number.isNaN(minLevel) || minLevel < 2 || minLevel > 5)
		) {
			return NextResponse.json(
				{
					error: "Invalid 'level' parameter. Must be a number between 2 and 5.",
				},
				{ status: 400, headers: corsHeaders },
			);
		}

		let result;
		if (query) {
			result = await searchNacebelCodes(query, page, limit, minLevel);
		} else {
			result = await getPaginatedNacebelCodes(page, limit, minLevel);
		}

		return NextResponse.json(result, { headers: corsHeaders });
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
