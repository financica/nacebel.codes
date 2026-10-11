"use client";

import { Fragment } from "react";

import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import { useT } from "@/lib/i18n";
import { siteScope } from "@/lib/i18n/scopes/site";
import { cn } from "@/lib/utils";

interface PaginationControlsProps {
	currentPage: number;
	totalPages: number;
	setCurrentPage: (page: number) => void;
	className?: string;
}

export function PaginationControls({
	currentPage,
	totalPages,
	setCurrentPage,
	className,
}: PaginationControlsProps) {
	const t = useT(siteScope);
	const getVisiblePages = (page: number, pages: number) => {
		const visiblePages: number[] = [];
		const left = Math.max(1, page - 2);
		const right = Math.min(pages, page + 2);

		visiblePages.push(1);
		for (let pageNumber = left; pageNumber <= right; pageNumber += 1) {
			visiblePages.push(pageNumber);
		}
		visiblePages.push(pages);

		return Array.from(new Set(visiblePages)).sort((a, b) => a - b);
	};

	if (totalPages <= 1) return null;

	const clampedCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
	const visiblePages = getVisiblePages(clampedCurrentPage, totalPages);

	const handlePageChange = (page: number) => {
		setCurrentPage(page);
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	return (
		<Pagination className={cn("justify-start sm:justify-center", className)}>
			<PaginationContent>
				<PaginationItem>
					<PaginationPrevious
						label={t("Previous")}
						onClick={() =>
							handlePageChange(Math.max(1, clampedCurrentPage - 1))
						}
						disabled={clampedCurrentPage <= 1}
					/>
				</PaginationItem>
				{visiblePages.map((page, index) => {
					const previousPage = visiblePages[index - 1];

					return (
						<Fragment key={`page-fragment-${page}`}>
							{index > 0 &&
							typeof previousPage === "number" &&
							page - previousPage > 1 ? (
								<PaginationItem>
									<PaginationEllipsis />
								</PaginationItem>
							) : null}
							<PaginationItem>
								<PaginationLink
									isActive={page === clampedCurrentPage}
									onClick={() => handlePageChange(page)}
								>
									{page}
								</PaginationLink>
							</PaginationItem>
						</Fragment>
					);
				})}
				<PaginationItem>
					<PaginationNext
						label={t("Next")}
						onClick={() =>
							handlePageChange(
								Math.min(totalPages, clampedCurrentPage + 1),
							)
						}
						disabled={clampedCurrentPage >= totalPages}
					/>
				</PaginationItem>
			</PaginationContent>
		</Pagination>
	);
}
