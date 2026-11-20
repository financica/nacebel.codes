/** The nacebel.codes mark: an "n" and the code separator dot, on an ink tile. */
export function BrandMark({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 64 64" aria-hidden className={className}>
			<rect width="64" height="64" rx="14" fill="#1b1f28" />
			<path
				d="M17 47V30.5a10.5 10.5 0 0 1 21 0V47"
				fill="none"
				stroke="#fefbf9"
				strokeWidth="8"
			/>
			<circle cx="47.5" cy="42.75" r="4.25" fill="#d62c16" />
		</svg>
	);
}
