"use client";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export function SectionPagination({
  currentPage,
  totalPages,
  onPageChange,
  itemLabel,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemLabel: string;
}) {
  return (
    <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <p className="text-sm text-muted-foreground">{itemLabel}</p>
      <Pagination className="mx-0 w-auto justify-start md:justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(event) => {
                event.preventDefault();
                if (currentPage > 1) {
                  onPageChange(currentPage - 1);
                }
              }}
            />
          </PaginationItem>
          <PaginationItem>
            <span className="inline-flex h-9 items-center rounded-md border px-3 text-sm">
              Page {currentPage} of {totalPages}
            </span>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(event) => {
                event.preventDefault();
                if (currentPage < totalPages) {
                  onPageChange(currentPage + 1);
                }
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
