import { listOfAccounts, listOfCategories, type listOfExpenses } from "../../types"
import { ExpenseTableItems } from "./ExpenseTableItems"
import { ExpenseCardList } from "./ExpenseCardList"
import { ExpensePagination } from "./ExpensePagination"
import { useState } from "react"
import useHousehold from "@/hooks/useHousehold"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Props {
  expenses: listOfExpenses
  categories: listOfCategories
  accounts: listOfAccounts
  onExpenseMutated?: () => void
}

export const ExpenseTable = ({ expenses, categories, accounts, onExpenseMutated }: Props) => {
  const { isLinked, getOwnerName } = useHousehold()
  const categoryMap = new Map(
    categories.map((category) => [category.id, category.name])
  )
  const accountMap = new Map(
    accounts.map((account) => [
      account.id,
      isLinked
        ? `@${getOwnerName(account.user_id)} - ${account.description}`
        : account.description,
    ])
  )

  const [actualPage, setActualPage] = useState<number>(1)
  const [elementsByPage] = useState<number>(15)

  const indexLastExpense = actualPage * elementsByPage
  const indexfFirstExpense = indexLastExpense - elementsByPage
  const actualExpenses = expenses.slice(indexfFirstExpense, indexLastExpense)

  const totalPages = Math.ceil(expenses.length / elementsByPage)

  const sharedProps = {
    expenses: actualExpenses,
    categoryMap,
    accountMap,
    categories,
    accounts,
    showOwner: isLinked,
    onExpenseMutated,
  }

  return (
    <div className="space-y-4">
      <div className="md:hidden">
        <ExpenseCardList {...sharedProps} />
      </div>

      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Gasto</TableHead>
              <TableHead>Monto</TableHead>
              {isLinked && <TableHead>Persona</TableHead>}
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
              showOwner={isLinked}
              onExpenseMutated={onExpenseMutated}
            />
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <ExpensePagination
          currentPage={actualPage}
          totalPages={totalPages}
          onPageChange={setActualPage}
        />
      )}
    </div>
  )
}
