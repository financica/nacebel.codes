import type { ReactNode } from "react";

interface ExplanatoryNoteProps {
	/** Note body as Markdown with `[[code]]` wikilinks. */
	text: string;
	/** Resolved hrefs for the codes referenced by wikilinks (code -> href). */
	links: Record<string, string>;
}

type Block =
	| { type: "p"; text: string }
	| { type: "ul"; items: { text: string; children: string[] }[] };

const BULLET = /^(\s*)-\s+(.*)$/;

function parseBlocks(text: string): Block[] {
	const lines = text.split("\n");
	const blocks: Block[] = [];
	let i = 0;

	while (i < lines.length) {
		const line = lines[i] ?? "";
		if (line.trim() === "") {
			i++;
			continue;
		}
		const bullet = line.match(BULLET);
		if (bullet) {
			const items: { text: string; children: string[] }[] = [];
			for (let m = line.match(BULLET); i < lines.length && m;) {
				const [, indent = "", content = ""] = m;
				const last = items[items.length - 1];
				if (indent.length > 0 && last) {
					last.children.push(content);
				} else {
					items.push({ text: content, children: [] });
				}
				i++;
				m = (lines[i] ?? "").match(BULLET);
			}
			blocks.push({ type: "ul", items });
		} else {
			blocks.push({ type: "p", text: line.trim() });
			i++;
		}
	}
	return blocks;
}

/** Render inline text, turning `[[code]]` into links (or plain code chips). */
function renderInline(text: string, links: Record<string, string>): ReactNode[] {
	return text.split(/(\[\[[^\]]+\]\])/g).map((part, idx) => {
		const m = part.match(/^\[\[([^\]]+)\]\]$/);
		if (!m?.[1]) return part;
		const code = m[1];
		const href = links[code];
		const key = `${idx}-${code}`;
		if (href) {
			return (
				<a
					key={key}
					href={href}
					data-code
					className="font-medium text-foreground underline decoration-border underline-offset-2 transition-colors hover:decoration-foreground"
				>
					{code}
				</a>
			);
		}
		return (
			<span key={key} data-code className="font-medium text-foreground">
				{code}
			</span>
		);
	});
}

export function ExplanatoryNote({ text, links }: ExplanatoryNoteProps) {
	const blocks = parseBlocks(text);
	return (
		<div className="measure space-y-4 text-[0.95rem] leading-7 text-foreground/90">
			{blocks.map((block, bi) => {
				if (block.type === "p") {
					return <p key={bi}>{renderInline(block.text, links)}</p>;
				}
				return (
					<ul key={bi} className="space-y-1.5">
						{block.items.map((item, ii) => (
							<li key={ii} className="flex flex-col gap-1.5">
								<span className="flex gap-2.5">
									<span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60" />
									<span>{renderInline(item.text, links)}</span>
								</span>
								{item.children.length > 0 ? (
									<ul className="ml-5 space-y-1 text-muted-foreground">
										{item.children.map((child, ci) => (
											<li key={ci} className="flex gap-2.5">
												<span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/40" />
												<span>
													{renderInline(child, links)}
												</span>
											</li>
										))}
									</ul>
								) : null}
							</li>
						))}
					</ul>
				);
			})}
		</div>
	);
}
