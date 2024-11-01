import { Accordion, AccordionBody, AccordionHeader, AccordionItem, Card, CardBody, CardTitle, Col, Table } from "react-bootstrap"
import { listOfAccounts, listOfExpenses } from "../../types";
import { useEffect, useState } from "react";
import { useAxiosPrivate } from "../../hooks/useAxiosPrivate";
import { useLocation, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { balanceTotal } from "../../consts";
import { AccordionAccounts } from "../Profile/accordionAccounts";
import { ExpenseTableItems } from "../Expenses/ExpenseTableItems";
import { RecentExpenses } from "./RecentExpenses";


export const HomeLogged = () => {

    const { auth } = useAuth();
    const [expenses, setExpenses] = useState<listOfExpenses>([]);
    const [accounts, setAccounts] = useState<listOfAccounts>([])
    const axiosPrivate = useAxiosPrivate();
    console.log(auth)
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        let isMounted = true
        const controller = new AbortController();
        const getAccounts = async () => {
          try{
            const response = await axiosPrivate.get(`/${auth.id}/accounts`, {
              signal: controller.signal
            })
            isMounted && setAccounts(response.data)
          }catch(err:any) {
            if (err.code === 'ERR_CANCELED') {
            
            }
          }
        }
        getAccounts();
        return () => {
          isMounted = false;
          controller.abort();
        }
    }, [])
    
    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();
    
        const getExpenses = async () => {
          try {
            const response = await axiosPrivate.get(`/${auth.id}/expenses`, {
              signal: controller.signal
            });
            isMounted && setExpenses(response.data)
          } catch (err: any) {
            if(err.code === 'ERR_CANCELED') {
            } else {
              navigate('/login', { state: { from: location }, replace: true });
            }
          }
        }
        getExpenses();
        return () => {
          isMounted = false;
          controller.abort();
        }
    }, [])
    
    const sortAndFilterExpenses = expenses
    .sort((a, b) => {
      
        if (a.is_paid && !b.is_paid) {
          return 1;
        } else if (!a.is_paid && b.is_paid) {
          return -1;
        } 
        const dateA = a.payment_date ? new Date(a.payment_date) : new Date(0);
        const dateB = b.payment_date ? new Date(b.payment_date) : new Date(0);
  
        return dateB.getTime() - dateA.getTime();
    });

    return (
        <>

                <Accordion className="profileContainer my-5">
                <AccordionItem eventKey="0">
                    <p className="m-4 fs-2 fw-bold">Bienvenido { auth.user}</p>
                    <p className="mx-5 my-4 fs-3">Balance Total</p>
                    <AccordionHeader className="mx-4 mt-5"><p className="totalBalance fs-1">${balanceTotal(accounts)}</p></AccordionHeader>
                    <AccordionBody> 
                        {accounts.map(account => (
                            <AccordionAccounts account = {account}/>
                        ))}
                    </AccordionBody>
                </AccordionItem>
                    </Accordion>
                <Col md={8}>
                    <Card>
                        <CardTitle>
                            <p className="fs-3 my-3 mx-5">Ultimos Recientes</p>
                        </CardTitle>
                        <CardBody>
                            <Table>
                                <thead>
                                    <tr>
                                        <th className="text-secondary">Fecha</th>
                                        <th className="text-secondary">Gasto</th>
                                        <th className="text-secondary">Monto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortAndFilterExpenses.slice(0, 5).map(expense => (
                                        <RecentExpenses expense={expense} />
                                    ))}
                                </tbody>
                            </Table>
                        </CardBody>
                    </Card>
                </Col>
        </>
    )
}