import {  Col, Container, Row, Table } from "react-bootstrap"
import { listOfAccounts, listOfCategories, type listOfExpenses } from "../../types"
import { ExpenseTableItems } from "./ExpenseTableItems"

interface Props {
    expenses: listOfExpenses
    categories: listOfCategories
    accounts: listOfAccounts
}

export const ExpenseTable: React.FC<Props> = ({ expenses, categories, accounts }) => {

    const categoryMap = new Map(categories.map(category => [category.id, category.name]));
    const accountMap = new Map(accounts.map(account => [account.id, account.description]));
    
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
                                categoryMap={categoryMap}
                                accountMap={accountMap}
                                categories={categories}
                                accounts={accounts}
                            />
                
                        ))}
                        </tbody>
                    </Table>
                </Col>
            </Row>
        </Container>
        
    )
}