import { listOfAccounts, listOfCategories, type listOfExpenses } from "../../types"
import { ExpenseTableItems } from "./ExpenseTableItems"
import { useState } from "react"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationFirst,
  PaginationItem,
  PaginationLast,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface Props {
  expenses: listOfExpenses
  categories: listOfCategories
  accounts: listOfAccounts
}

export const ExpenseTable = ({ expenses, categories, accounts }: Props) => {
  const categoryMap = new Map(
    categories.map((category) => [category.id, category.name])
  )
  const accountMap = new Map(
    accounts.map((account) => [account.id, account.description])
  )

  const [actualPage, setActualPage] = useState<number>(1)
  const [elementsByPage] = useState<number>(15)

  const indexLastExpense = actualPage * elementsByPage
  const indexfFirstExpense = indexLastExpense - elementsByPage
  const actualExpenses = expenses.slice(indexfFirstExpense, indexLastExpense)

  const handleChangePage = (numberPage: number) => {
    setActualPage(numberPage)
  }

  const totalPages = Math.ceil(expenses.length / elementsByPage)

  return (
    <div className="mt-6 space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Gasto</TableHead>
            <TableHead>Monto</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Método de pago</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {actualExpenses.map((expense) => (
            <ExpenseTableItems
              key={expense.id}
              expense={expense}
              categoryMap={categoryMap}
              accountMap={accountMap}
              categories={categories}
              accounts={accounts}
            />
          ))}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationFirst
                onClick={() => handleChangePage(1)}
                disabled={actualPage === 1}
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handleChangePage(actualPage - 1)}
                disabled={actualPage === 1}
              />
            </PaginationItem>

            {[...Array(totalPages)].map((_, index) => (
              <PaginationItem key={index}>
                <PaginationLink
                  isActive={index + 1 === actualPage}
                  onClick={() => handleChangePage(index + 1)}
                >
                  {index + 1}
                </PaginationLink>
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                onClick={() => handleChangePage(actualPage + 1)}
                disabled={actualPage === totalPages}
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationLast
                onClick={() => handleChangePage(totalPages)}
                disabled={actualPage === totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
