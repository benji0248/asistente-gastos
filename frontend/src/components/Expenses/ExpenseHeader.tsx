import { Badge, Button, CardTitle, Col, Container, Row, Tab, Tabs } from "react-bootstrap"
import { Category, listOfExpenses } from "../../types"
import { FilterExpenses } from "./FilterExpenses"
import { sumatoria, sumatoriaPendientes } from "../../consts"
import { CreateExpense } from "./CreateExpense"
import CreateCategory from "./CreateCategory"
import { useEffect, useState } from "react"
import dayjs from "dayjs"
import { useAxiosPrivate } from "../../hooks/useAxiosPrivate"
import useAuth from "../../hooks/useAuth"

interface Props {
    completedCount: number
    filterSelected: string | undefined
    onClearCompleted: () => void
    handleFilterChange: (category_id: string | undefined) => void
    handlePaymentFilter: (key: 'all' | 'paid' | 'unpaid') => void
    onMonthSelect: (month: string, year:string) => void
    expenses: listOfExpenses
    categories: Category[]
}

export const ExpenseHeader: React.FC<Props> = ({
    completedCount = 0,
    filterSelected,
    handleFilterChange,
    handlePaymentFilter,
    expenses,
    categories,
    onMonthSelect
}) => {

    const [availableMonths, setAvailableMonths] = useState([]);
    const axiosPrivate = useAxiosPrivate();
    const { auth } = useAuth();

    useEffect(() => {
        const fetchAvailableMonths = async () => {
          try {
            const response = await axiosPrivate.get(`/${auth.id}/expenses/available-months`);
            setAvailableMonths(response.data);

            const currentMonth = dayjs().format('MM');
            const currentYear = dayjs().format('YYYY');
    
            const currentMonthExists = response.data.find(
              (item:any) => item.month === currentMonth && item.year === currentYear
            );
    
            if (currentMonthExists) {
              onMonthSelect(currentMonth, currentYear);
            } else if (response.data.length > 0) {
              onMonthSelect(response.data[0].month, response.data[0].year);
            }
          } catch (error) {
            console.error('Error al obtener los meses disponibles', error);
          }
        };
    
        fetchAvailableMonths();
      }, []);

    return (

        <Container className="mt-4">
            <CardTitle className="fs-3 mx-3 mb-5">Gastos del mes</CardTitle>
            <Row>
                <Col md={5} className="customTabCol">
                    <Tabs className="mb-3 ms-3 customTabs" defaultActiveKey='all' onSelect={(key) => handlePaymentFilter(key as any)}>
                      <Tab title="Todos" eventKey="all" className="fs-4" key='all'></Tab>
                      <Tab title={<span>Gastos pendientes <Badge bg="danger">{completedCount}</Badge></span>} className="fs-4" eventKey="unpaid" key='unpaid'></Tab>
                      <Tab title="Gastos pagados" eventKey="paid" key='paid'></Tab>
                    </Tabs>
                </Col>
                <Col>
            {availableMonths.map(({ month, year }) => (
                      availableMonths ?
                      <Button className="me-2" variant="dark" 
                        key={`${month}/${year}`}
                        onClick={() => onMonthSelect(month, year)}
                      >
                        {`${month}/${year}`}
                </Button>
                : <></>
                    ))}
                </Col>
            </Row>
            <Row className="mb-3">
            <Col>
            <span className="mx-2 fs-4 ms-auto">Total de gastos sin pagar:<span className="fs-5 fw-bold ms-2 textColorRed">${sumatoriaPendientes(expenses)}</span></span>
                </Col>
                <Col>
                <span className="fs-4">Total de gastos del mes:</span><span className="textColorGreen fs-5 fw-bold ms-2">${sumatoria(expenses)}</span>
                </Col>
            </Row>
            <CreateExpense />
            <CreateCategory />

            <FilterExpenses
                filterSelected={filterSelected}
                onFilterChange={handleFilterChange}
                categories={categories}
            />
        </Container>
        
    )
}