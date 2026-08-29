import { Archivo, JetBrains_Mono } from "next/font/google";

// Declared once and imported by the document shell, so `next/font` emits one
// instance of each family.
export const archivo = Archivo({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700", "800"],
	variable: "--font-archivo",
});

export const jetbrainsMono = JetBrains_Mono({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
	variable: "--font-jetbrains-mono",
});
