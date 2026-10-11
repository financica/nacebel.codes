import type { ReactNode } from "react";

interface CodeBlockProps {
	children: ReactNode;
}

export function CodeBlock({ children }: CodeBlockProps) {
	return (
		<pre className="overflow-x-auto rounded-lg border border-slate-800/80 bg-slate-950 p-4 text-sm leading-6 text-slate-100 shadow-[0_30px_70px_-45px_rgba(15,23,42,0.9)]">
			<code>{children}</code>
		</pre>
	);
}
