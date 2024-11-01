import {  Col, Container, Pagination, Row, Table } from "react-bootstrap"
import { listOfAccounts, listOfCategories, type listOfExpenses } from "../../types"
import { ExpenseTableItems } from "./ExpenseTableItems"
import { useState } from "react"

interface Props {
    expenses: listOfExpenses
    categories: listOfCategories
    accounts: listOfAccounts
}

export const ExpenseTable: React.FC<Props> = ({ expenses, categories, accounts }) => {

    const categoryMap = new Map(categories.map(category => [category.id, category.name]));
    const accountMap = new Map(accounts.map(account => [account.id, account.description]));

    const [actualPage, setActualPage] = useState<number>(1);
    const [elementsByPage] = useState<number>(15);
    
    const indexLastExpense = actualPage * elementsByPage;
    const indexfFirstExpense = indexLastExpense - elementsByPage;
    const actualExpenses = expenses.slice(indexfFirstExpense, indexLastExpense);

    const handleChangePage = (numberPage: number) => {
        setActualPage(numberPage)
    }

    const totalPages = Math.ceil(expenses.length / elementsByPage)
    
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
                        {actualExpenses.map(expense => (
                
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
                    <Pagination>
                        <Pagination.First onClick={() => handleChangePage(1)} disabled={actualPage === 1} />
                        <Pagination.Prev onClick={() => handleChangePage(actualPage - 1)} disabled={actualPage === 1} />
                        
                        {[...Array(totalPages)].map((_, index) => (
                            <Pagination.Item
                                key={index}
                                active={index + 1 === actualPage}
                                onClick={() => handleChangePage(index + 1)}
                            >{index + 1}</Pagination.Item>
                        ))}
                        <Pagination.Next onClick={() => handleChangePage(actualPage + 1)} disabled={actualPage === totalPages} />
                        <Pagination.Last onClick={() => handleChangePage(totalPages)} disabled={actualPage === totalPages} />
                    </Pagination>
                </Col>
            </Row>
        </Container>
        
    )
}