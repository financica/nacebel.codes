import * as pulumi from "@pulumi/pulumi";
import * as random from "@pulumi/random";
import * as vercel from "@pulumiverse/vercel";

/**
 * The app-owned Vercel environment variables: every value that exists because
 * of code in this repo. Platform-minted values (the Cloudflare email-sending
 * token, BOT_PROTECTION_SECRET, EMAIL_FROM_DOMAIN) stay in the infra repo
 * (~/src/infra/stacks/websites.ts), which owns the zone. A key has exactly
 * one writer; the split is "who mints the value".
 *
 * Stack `prod` targets production + preview (live Stripe); stack `dev`
 * targets development (Stripe sandbox), so `vercel env pull` gives a local
 * loop that charges nobody. Values are injected NOT sensitive so the pull
 * works (still Pulumi secrets in state).
 */

const VERCEL_TEAM_ID = "team_17olSDTzbi5pb3CHgum6WuXS";
const VERCEL_PROJECT_ID = "prj_1hpTpOwfWeGdYjSiqn1y6nvteL1K"; // nacebel.codes

export function createVercelEnv(stripe: {
	webhookSecret: pulumi.Output<string> | undefined;
}) {
	const cfg = new pulumi.Config();
	const stack = pulumi.getStack();
	if (stack !== "prod" && stack !== "dev") {
		throw new Error(`Unknown stack ${stack}: expected prod or dev`);
	}
	const targets = stack === "prod" ? ["production", "preview"] : ["development"];

	const provider = new vercel.Provider("vercel", {
		apiToken: process.env.VERCEL_API_TOKEN,
		team: VERCEL_TEAM_ID,
	});

	const env = (key: string, value: pulumi.Input<string>) =>
		new vercel.ProjectEnvironmentVariable(
			`env-${stack}-${key}`,
			{
				projectId: VERCEL_PROJECT_ID,
				teamId: VERCEL_TEAM_ID,
				key,
				value,
				targets,
				sensitive: false,
			},
			{ provider, deleteBeforeReplace: true },
		);

	env("STRIPE_SECRET_KEY", cfg.requireSecret("stripeSecretKey"));
	env("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", cfg.require("stripePublishableKey"));
	if (stripe.webhookSecret) env("STRIPE_WEBHOOK_SECRET", stripe.webhookSecret);

	// Signs the download links (lib/dataset/token.ts). Rotating it is a
	// resource replace and invalidates every link minted before — buyers can
	// re-mint theirs from the "lost your links?" form.
	const tokenSecret = new random.RandomId("dataset-token-secret", { byteLength: 32 });
	env("DATASET_TOKEN_SECRET", tokenSecret.hex);

	// Where minted links point. Production defaults to https://nacebel.codes
	// in code; local dev needs its own origin.
	const appUrl = cfg.get("appUrl");
	if (appUrl) env("APP_URL", appUrl);
}
