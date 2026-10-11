import { ThemeProvider } from "@ingram-tech/nk-themes/next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { archivo, jetbrainsMono } from "@/lib/fonts";
import { HTML_LANG, type Locale } from "@/lib/i18n/locales";

/**
 * The `<html>`/`<body>` document shell. `locale` is whatever the root layout
 * resolved — the one the URL named, or the negotiated one on the bare path.
 */
export function RootHtml({
	locale,
	children,
}: {
	locale: Locale;
	children: ReactNode;
}) {
	return (
		<html
			lang={HTML_LANG[locale]}
			suppressHydrationWarning
			className={`${archivo.variable} ${jetbrainsMono.variable}`}
		>
			<head>
				<link
					rel="search"
					type="application/opensearchdescription+xml"
					title="NACE-BEL 2025 Codes"
					href="/opensearch.xml"
				/>
			</head>
			<body className="min-h-screen bg-background text-foreground antialiased">
				<ThemeProvider>
					<AppShell locale={locale}>{children}</AppShell>
				</ThemeProvider>
			</body>
		</html>
	);
}
