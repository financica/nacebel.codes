import "@/app/globals.css";
import { RootHtml } from "@/components/root-html";
import { resolveLocale } from "@/lib/i18n/locale";
import { buildRootMetadata } from "@/lib/site-metadata";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export { viewport } from "@/lib/site-metadata";

// One route tree, no `[locale]` segment: the proxy rewrites `/fr/about` onto
// `/about` and forwards the locale the URL named as a request header, so this
// layout resolves the language the same way whether the address named one or
// the bare path negotiated it.
export async function generateMetadata(): Promise<Metadata> {
	return buildRootMetadata(await resolveLocale());
}

export default async function RootLayout({ children }: { children: ReactNode }) {
	return <RootHtml locale={await resolveLocale()}>{children}</RootHtml>;
}
