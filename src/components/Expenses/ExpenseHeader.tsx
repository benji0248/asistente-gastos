import { Badge, Container } from "react-bootstrap"
import { FilterValue, listOfExpenses } from "../../types"
import { FilterExpenses } from "./FilterExpenses"
import CreateExpense from "./CreateExpense"
import { sumatoria, sumatoriaPendientes } from "../../consts"

interface Props {
    activeCount: number
    completedCount: number
    filterSelected: FilterValue
    onClearCompleted: () => void
    handleFilterChange: (filter: FilterValue) => void
    expenses: listOfExpenses
}

export const ExpenseHeader: React.FC<Props> = ({
    activeCount = 0,
    completedCount = 0,
    filterSelected,
    handleFilterChange,
    expenses
}) => {

    return (

        <Container>
            <Container className="mb-2 d-flex" >
            <span>
                Gastos Pendientes <Badge bg="danger">{completedCount}</Badge>
            </span>
            <span className="ms-2">
                Gastos del Mes <Badge bg="success">{activeCount}</Badge>
                </span>
                <CreateExpense/>
                <span className="mx-2 fs-5 ms-auto">Total de gastos sin pagar <Badge bg="danger">${sumatoriaPendientes(expenses)}</Badge></span>
                <span className="fs-5">Total de gastos del mes <Badge bg="success">${sumatoria(expenses)}</Badge></span>
            </Container>

            <FilterExpenses
                filterSelected={filterSelected}
                onFilterChange={handleFilterChange}
            />
        </Container>
        
    )
}