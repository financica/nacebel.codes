export type Language = "en" | "de" | "fr" | "nl";
export type Theme = "light" | "dark" | "system";

export interface NacebelCode {
	level: number;
	code: string;
	titles: {
		[key in Language]: string;
	};
	description: {
		[key in Language]: string;
	};
	childrenCodes?: string[];
}
