"use client";

import { HoneypotInput, useBotProtection } from "@ingram-tech/nk-forms/react";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/contexts/locale-context";
import { useT } from "@/lib/i18n";
import { siteScope } from "@/lib/i18n/scopes/site";

const ENDPOINT = "/api/dataset/resend";

/** "Lost your links?" — one field, uniform confirmation whatever the outcome. */
export function ResendLinksForm() {
	const locale = useLocale();
	const t = useT(siteScope);
	const { honeypotRef, botFields, ready } = useBotProtection(ENDPOINT);
	const [email, setEmail] = useState("");
	const [state, setState] = useState<"idle" | "sending" | "sent">("idle");

	async function onSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (state === "sending") return;
		setState("sending");
		try {
			await fetch(ENDPOINT, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ email, locale, ...botFields() }),
			});
		} finally {
			setState("sent");
		}
	}

	if (state === "sent") {
		return (
			<p className="text-sm text-muted-foreground">
				{t(
					"If a purchase exists for that address, the download links are on their way.",
				)}
			</p>
		);
	}

	return (
		<form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
			<label className="sr-only" htmlFor="resend-email">
				{t("Email address")}
			</label>
			<input
				id="resend-email"
				type="email"
				required
				autoComplete="email"
				value={email}
				onChange={(event) => setEmail(event.target.value)}
				placeholder="alex@example.com"
				className="h-9 flex-1 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
			/>
			<HoneypotInput inputRef={honeypotRef} />
			<Button
				type="submit"
				variant="outline"
				className="h-9"
				disabled={!ready || state === "sending"}
			>
				{t("Resend my links")}
			</Button>
		</form>
	);
}
