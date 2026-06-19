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
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

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
      <nav
        aria-label="Paginación de gastos"
        className="grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:hidden"
      >
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-11 w-11 shrink-0 rounded-xl"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <div className="flex min-w-0 items-center justify-center rounded-xl bg-muted/40 px-3 py-2.5 ring-1 ring-border/40">
          <span className="truncate text-sm font-medium tabular-nums">
            <span className="text-foreground">Página {currentPage}</span>
            <span className="text-muted-foreground"> de {totalPages}</span>
          </span>
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-11 w-11 shrink-0 rounded-xl"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Página siguiente"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </nav>

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
