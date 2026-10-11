"use client";

import { type VariantProps } from "class-variance-authority";
import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from "lucide-react";
import type * as React from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
	return (
		<nav
			aria-label="pagination"
			data-slot="pagination"
			className={cn("mx-auto flex w-full justify-center", className)}
			{...props}
		/>
	);
}

function PaginationContent({ className, ...props }: React.ComponentProps<"ul">) {
	return (
		<ul
			data-slot="pagination-content"
			className={cn("flex flex-row items-center gap-1", className)}
			{...props}
		/>
	);
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
	return <li data-slot="pagination-item" {...props} />;
}

type PaginationLinkProps = {
	isActive?: boolean;
	size?: VariantProps<typeof buttonVariants>["size"];
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

function PaginationLink({
	className,
	isActive,
	size = "icon",
	type = "button",
	...props
}: PaginationLinkProps) {
	return (
		<button
			aria-current={isActive ? "page" : undefined}
			data-slot="pagination-link"
			data-active={isActive}
			type={type}
			className={cn(
				buttonVariants({
					variant: isActive ? "default" : "outline",
					size,
				}),
				"min-w-9 text-sm",
				isActive && "shadow-[0_16px_36px_-24px_hsl(var(--primary))]",
				className,
			)}
			{...props}
		/>
	);
}

function PaginationPrevious({
	className,
	label = "Previous",
	...props
}: PaginationLinkProps & { label?: string }) {
	return (
		<PaginationLink
			aria-label={label}
			size="sm"
			className={cn("gap-1.5 rounded-full px-3.5 sm:pl-3", className)}
			{...props}
		>
			<ChevronLeftIcon className="size-3.5" />
			<span className="hidden sm:block">{label}</span>
		</PaginationLink>
	);
}

function PaginationNext({
	className,
	label = "Next",
	...props
}: PaginationLinkProps & { label?: string }) {
	return (
		<PaginationLink
			aria-label={label}
			size="sm"
			className={cn("gap-1.5 rounded-full px-3.5 sm:pr-3", className)}
			{...props}
		>
			<span className="hidden sm:block">{label}</span>
			<ChevronRightIcon className="size-3.5" />
		</PaginationLink>
	);
}

function PaginationEllipsis({ className, ...props }: React.ComponentProps<"span">) {
	return (
		<span
			aria-hidden
			data-slot="pagination-ellipsis"
			className={cn(
				"flex size-9 items-center justify-center rounded-full text-muted-foreground",
				className,
			)}
			{...props}
		>
			<MoreHorizontalIcon className="size-3.5" />
			<span className="sr-only">More pages</span>
		</span>
	);
}

export {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
};
