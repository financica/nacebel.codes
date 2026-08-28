import { z } from "zod";

import { SUPPORTED_LOCALES } from "@/lib/i18n/locales";

export const localeSchema = z.enum(SUPPORTED_LOCALES);

export const checkoutBodySchema = z.object({ locale: localeSchema });

export const claimBodySchema = z.object({
	sessionId: z.string().regex(/^cs_(test|live)_[A-Za-z0-9]+$/),
});

export const resendBodySchema = z
	.object({
		email: z.string().trim().email().max(254),
		locale: localeSchema,
	})
	// The bot-protection fields ride along; verifyHuman reads them from the
	// same object, so they must survive parsing.
	.passthrough();
