import { listOfAccounts, listOfCategories, listOfExpenses } from "../../types"
import { ExpenseTableItems } from "./ExpenseTableItems"
import { ExpenseCardList } from "./ExpenseCardList"
import { ExpensePagination } from "./ExpensePagination"
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
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  onExpenseMutated?: () => void
}

export const ExpenseTable = ({
  expenses,
  categories,
  accounts,
  currentPage,
  totalPages,
  onPageChange,
  onExpenseMutated,
}: Props) => {
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

  const sharedProps = {
    expenses,
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
            {expenses.map((expense) => (
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
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  )
}
