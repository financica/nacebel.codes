/**
 * Download links are signed, expiring tokens over the Stripe Checkout Session
 * id — no purchase table. The signature keeps a link from being forged; the
 * download route still confirms the session is paid against Stripe, so the
 * token is a capability with an expiry, not the source of truth.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

import { DATASET_LINK_TTL_DAYS } from "./constants";

function secret(): string {
	const value = process.env.DATASET_TOKEN_SECRET;
	if (!value) throw new Error("DATASET_TOKEN_SECRET is not set");
	return value;
}

function sign(payload: string): string {
	return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export interface DownloadGrant {
	sessionId: string;
	/** Unix seconds. */
	expiresAt: number;
}

export function mintDownloadToken(sessionId: string, now = Date.now()): string {
	const expiresAt = Math.floor(now / 1000) + DATASET_LINK_TTL_DAYS * 24 * 60 * 60;
	const payload = `${sessionId}.${expiresAt}`;
	return `${payload}.${sign(payload)}`;
}

export function verifyDownloadToken(
	token: string,
	now = Date.now(),
): DownloadGrant | null {
	const parts = token.split(".");
	if (parts.length !== 3) return null;
	const [sessionId, exp, sig] = parts as [string, string, string];
	if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) return null;
	const expiresAt = Number(exp);
	if (!Number.isInteger(expiresAt) || expiresAt * 1000 < now) return null;

	const expected = Buffer.from(sign(`${sessionId}.${exp}`));
	const given = Buffer.from(sig);
	if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
		return null;
	}
	return { sessionId, expiresAt };
}
