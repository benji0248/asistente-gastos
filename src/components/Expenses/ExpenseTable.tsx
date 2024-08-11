import { Badge, Col, Container, Row, Table } from "react-bootstrap"
import { type listOfExpenses } from "../../types"
import { ExpenseTableItems } from "./ExpenseTableItems"
import { sumatoria, sumatoriaPendientes } from "../../consts";

interface Props {
    expenses: listOfExpenses
}

export const ExpenseTable: React.FC<Props> = ({ expenses }) => {
    
    return (
        
        <Container>
            <Row className="text-center">
                <Col>
                    <Table bordered hover responsive="lg" size="sm">
                        <thead>
                            <tr>
                                <th>Gasto</th>
                                <th>Monto</th>
                                <th>Categoria</th>
                                <th>Metodo de pago</th>
                            </tr>
                        </thead>
                        <tbody>
                        {expenses.map(expense => (
                
                            <ExpenseTableItems
                                expense={expense}
                            />
                
                        ))}
                        </tbody>
                    </Table>
                </Col>
            </Row>
        </Container>
        
    )
}