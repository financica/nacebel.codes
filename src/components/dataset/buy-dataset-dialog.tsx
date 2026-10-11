"use client";

import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { useCallback, useMemo, useRef, useState } from "react";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@/components/ui/dialog";
import { useLocale } from "@/contexts/locale-context";
import {
	DATASET_FORMATS,
	DATASET_PRICE_EUR_CENTS,
	formatPriceEur,
} from "@/lib/dataset/constants";
import {
	type DatasetPurchase,
	saveDatasetPurchase,
	useDatasetPurchase,
} from "@/lib/dataset/purchase-store";
import { useT } from "@/lib/i18n";
import { siteScope } from "@/lib/i18n/scopes/site";

import { DownloadLinks } from "./download-links";

let stripePromise: Promise<Stripe | null> | null = null;
function getStripePromise(): Promise<Stripe | null> {
	if (!stripePromise) {
		const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
		stripePromise = key ? loadStripe(key) : Promise.resolve(null);
	}
	return stripePromise;
}

type Purchase = Pick<DatasetPurchase, "email" | "links">;

type Stage =
	| { kind: "checkout" }
	| { kind: "confirming" }
	| { kind: "done"; purchase: Purchase }
	| { kind: "pending" }
	| { kind: "error"; message: string };

const CLAIM_ATTEMPTS = 4;
const CLAIM_RETRY_MS = 1500;

interface BuyDatasetDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Fires once, right after a payment is confirmed and the links are in hand. */
	onPurchased?: (purchase: DatasetPurchase) => void;
	/** Why the dialog opened — shown under the title while checkout is up. */
	intro?: string;
}

export function BuyDatasetDialog({
	open,
	onOpenChange,
	onPurchased,
	intro,
}: BuyDatasetDialogProps) {
	const locale = useLocale();
	const t = useT(siteScope);
	const existing = useDatasetPurchase();
	const [stage, setStage] = useState<Stage>({ kind: "checkout" });
	const sessionIdRef = useRef<string | null>(null);
	// A browser that already paid never sees checkout again — straight to links.
	const effectiveStage: Stage =
		stage.kind === "checkout" && existing
			? { kind: "done", purchase: existing }
			: stage;

	const fetchClientSecret = useCallback(async () => {
		const res = await fetch("/api/dataset/checkout", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ locale }),
		});
		if (!res.ok) throw new Error("checkout unavailable");
		const data = (await res.json()) as { clientSecret: string; sessionId: string };
		sessionIdRef.current = data.sessionId;
		return data.clientSecret;
	}, [locale]);

	const onComplete = useCallback(async () => {
		setStage({ kind: "confirming" });
		const sessionId = sessionIdRef.current;
		for (let attempt = 0; attempt < CLAIM_ATTEMPTS; attempt++) {
			const res = await fetch("/api/dataset/claim", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ sessionId }),
			});
			if (res.ok) {
				const claimed = (await res.json()) as Purchase;
				const purchase: DatasetPurchase = {
					...claimed,
					sessionId: sessionId ?? "",
					purchasedAt: Date.now(),
				};
				saveDatasetPurchase(purchase);
				setStage({ kind: "done", purchase });
				onPurchased?.(purchase);
				return;
			}
			if (res.status !== 402) break;
			await new Promise((resolve) => setTimeout(resolve, CLAIM_RETRY_MS));
		}
		// Async payment methods (bank debit) complete later: the webhook emails
		// the links once the money lands.
		setStage({ kind: "pending" });
	}, [onPurchased]);

	const options = useMemo(
		() => ({ fetchClientSecret, onComplete }),
		[fetchClientSecret, onComplete],
	);

	const handleOpenChange = (next: boolean) => {
		// A finished purchase shouldn't be dismissed by an accidental backdrop
		// click before the buyer has seen the links; the close button still works.
		onOpenChange(next);
		if (!next) {
			setTimeout(() => setStage({ kind: "checkout" }), 300);
			sessionIdRef.current = null;
		}
	};

	const price = formatPriceEur(DATASET_PRICE_EUR_CENTS, locale);

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent closeLabel={t("Close")} className="max-w-xl">
				<div className="border-b border-border px-5 py-4 pr-12">
					<DialogTitle>{t("Full NACE-BEL 2025 dataset")}</DialogTitle>
					<DialogDescription className="mt-1">
						{effectiveStage.kind === "done"
							? t("Your files are ready.")
							: (intro ??
								t("{price} excl. VAT · one-time · {formats}", {
									price,
									formats: DATASET_FORMATS.map((f) =>
										f.toUpperCase(),
									).join(" + "),
								}))}
					</DialogDescription>
				</div>

				<div className="min-h-0 overflow-y-auto p-5">
					{effectiveStage.kind === "checkout" ||
					effectiveStage.kind === "confirming" ? (
						<div className="relative">
							{process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? (
								<EmbeddedCheckoutProvider
									stripe={getStripePromise()}
									options={options}
								>
									<EmbeddedCheckout />
								</EmbeddedCheckoutProvider>
							) : (
								<p className="text-sm text-destructive">
									{t(
										"Checkout is not available right now. Please try again later.",
									)}
								</p>
							)}
							{stage.kind === "confirming" ? (
								<div className="absolute inset-0 grid place-items-center bg-card/80 text-sm font-medium">
									{t("Confirming your payment…")}
								</div>
							) : null}
						</div>
					) : null}

					{effectiveStage.kind === "done" ? (
						<DownloadLinks
							links={effectiveStage.purchase.links}
							email={effectiveStage.purchase.email}
						/>
					) : null}

					{stage.kind === "pending" ? (
						<p className="text-sm leading-relaxed">
							{t(
								"Your payment is being processed. As soon as it is confirmed, your download links will arrive by email.",
							)}
						</p>
					) : null}

					{stage.kind === "error" ? (
						<p className="text-sm text-destructive">{stage.message}</p>
					) : null}
				</div>
			</DialogContent>
		</Dialog>
	);
}
