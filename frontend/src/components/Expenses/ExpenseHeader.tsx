import { Badge, Container } from "react-bootstrap"
import { Category, listOfExpenses } from "../../types"
import { FilterExpenses } from "./FilterExpenses"
import { sumatoria, sumatoriaPendientes } from "../../consts"
import { CreateExpense } from "./CreateExpense"
import CreateCategory from "./CreateCategory"

interface Props {
    activeCount: number
    completedCount: number
    filterSelected: string | undefined
    onClearCompleted: () => void
    handleFilterChange: (category_id: string | undefined) => void
    expenses: listOfExpenses
    categories: Category[]
}

export const ExpenseHeader: React.FC<Props> = ({
    activeCount = 0,
    completedCount = 0,
    filterSelected,
    handleFilterChange,
    expenses,
    categories
}) => {

    return (

        <Container>º
            <Container className="mb-2 d-flex" >
            <span>
                Gastos Pendientes <Badge bg="danger">{completedCount}</Badge>
            </span>
            <span className="ms-2">
                Gastos del Mes <Badge bg="success">{activeCount}</Badge>
                </span>
                <CreateExpense />
                <CreateCategory />
            </Container>
            <Container className="mb-3">
            <span className="mx-2 fs-5 ms-auto">Total de gastos sin pagar <Badge bg="danger">${sumatoriaPendientes(expenses)}</Badge></span>
            <span className="fs-5">Total de gastos del mes <Badge bg="success">${sumatoria(expenses)}</Badge></span>
            </Container>

            <FilterExpenses
                filterSelected={filterSelected}
                onFilterChange={handleFilterChange}
                categories={categories}
            />
        </Container>
        
    )
}