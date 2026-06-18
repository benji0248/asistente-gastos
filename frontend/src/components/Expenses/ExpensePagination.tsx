import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationFirst,
  PaginationItem,
  PaginationLast,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface Props {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

function getPageWindow(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const delta = 1
  const range: number[] = []
  const result: (number | "ellipsis")[] = []
  let prev: number | undefined

  for (let i = 1; i <= total; i++) {
    if (
      i === 1 ||
      i === total ||
      (i >= current - delta && i <= current + delta)
    ) {
      range.push(i)
    }
  }

  for (const page of range) {
    if (prev !== undefined) {
      if (page - prev === 2) {
        result.push(prev + 1)
      } else if (page - prev !== 1) {
        result.push("ellipsis")
      }
    }
    result.push(page)
    prev = page
  }

  return result
}

export function ExpensePagination({
  currentPage,
  totalPages,
  onPageChange,
}: Props) {
  const pages = getPageWindow(currentPage, totalPages)

  return (
    <>
      {/* Compact pagination for mobile */}
      <div className="flex items-center justify-center gap-3 sm:hidden">
        <PaginationPrevious
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        />
        <span className="text-sm text-muted-foreground tabular-nums">
          {currentPage} / {totalPages}
        </span>
        <PaginationNext
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        />
      </div>

      {/* Windowed pagination for tablet+ */}
      <Pagination className="hidden sm:flex">
        <PaginationContent>
          <PaginationItem>
            <PaginationFirst
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            />
          </PaginationItem>

          {pages.map((page, index) =>
            page === "ellipsis" ? (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={page}>
                <PaginationLink
                  isActive={page === currentPage}
                  onClick={() => onPageChange(page)}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            )
          )}

          <PaginationItem>
            <PaginationNext
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationLast
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </>
  )
}
