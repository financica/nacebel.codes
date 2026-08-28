"use client";

import { useSyncExternalStore } from "react";

import type { DatasetFormat } from "./constants";

/**
 * The buyer's proof of purchase, kept in the browser: the signed links the
 * claim endpoint handed back. There is no account, so "this browser has paid"
 * is what unlocks exporting without asking again; the links themselves stay
 * valid for a year (and are also in the buyer's inbox).
 */
export interface DatasetPurchase {
	sessionId: string;
	email: string | null;
	links: Record<DatasetFormat, string>;
	/** Unix ms. */
	purchasedAt: number;
}

const KEY = "nacebel:dataset-purchase";
const TTL_MS = 365 * 24 * 60 * 60 * 1000;
const listeners = new Set<() => void>();

function read(): DatasetPurchase | null {
	if (typeof window === "undefined") return null;
	try {
		const raw = window.localStorage.getItem(KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as DatasetPurchase;
		if (
			typeof parsed.sessionId !== "string" ||
			typeof parsed.purchasedAt !== "number" ||
			parsed.purchasedAt + TTL_MS < Date.now()
		) {
			return null;
		}
		return parsed;
	} catch {
		return null;
	}
}

let snapshot: DatasetPurchase | null | undefined;

function getSnapshot(): DatasetPurchase | null {
	if (snapshot === undefined) snapshot = read();
	return snapshot;
}

function emit() {
	snapshot = read();
	for (const listener of listeners) listener();
}

export function saveDatasetPurchase(purchase: DatasetPurchase): void {
	try {
		window.localStorage.setItem(KEY, JSON.stringify(purchase));
	} catch {
		// Private mode / storage blocked: the modal still shows the links once.
	}
	emit();
}

export function clearDatasetPurchase(): void {
	try {
		window.localStorage.removeItem(KEY);
	} catch {
		// ignore
	}
	emit();
}

function subscribe(listener: () => void) {
	listeners.add(listener);
	const onStorage = (event: StorageEvent) => {
		if (event.key === KEY) emit();
	};
	window.addEventListener("storage", onStorage);
	return () => {
		listeners.delete(listener);
		window.removeEventListener("storage", onStorage);
	};
}

/** The purchase this browser holds, or null. Null during SSR/hydration. */
export function useDatasetPurchase(): DatasetPurchase | null {
	return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
