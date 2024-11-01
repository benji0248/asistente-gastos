import { Accordion, AccordionBody, AccordionHeader, AccordionItem, Badge, Card, CardBody, CardTitle, Container } from "react-bootstrap"
import useAuth from "../../hooks/useAuth"
import { useEffect, useState } from "react"
import { useAxiosPrivate } from "../../hooks/useAxiosPrivate"
import { Account, Category } from "../../types"
import { useLocation, useNavigate } from "react-router-dom"
import CreateAccount from "./createAccount"
import CreateCategory from "../Expenses/CreateCategory"
import { ProfileAccounts } from "./profileAccounts"
import { AccordionAccounts } from "./accordionAccounts"
import { balanceTotal } from "../../consts"



function Profile() {

    const { auth } = useAuth();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const axiosPrivate = useAxiosPrivate();
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        const getAccounts = async () => {
            try {
                const response = await axiosPrivate.get(`${auth.id}/accounts`, {
                    signal: controller.signal
                });
                console.log(response.data)
                isMounted && setAccounts(response.data)
            } catch (err: any) {
                if (err.code === 'ERR_CANCELED') {
                    console.log('Aborted')
                } else {
                    navigate('/login', { state: { from: location }, replace: true });
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

        const getCategories = async () => {
            try {
                const response = await axiosPrivate.get(`${auth.id}/categories`, {
                    signal: controller.signal
                });
                console.log(response.data)
                isMounted && setCategories(response.data)
            } catch (err: any) {
                if (err.code === 'ERR_CANCELED') {
                    console.log('Aborted')
                } else {
                    navigate('/login', { state: { from: location }, replace: true });
                }
            }
        }
        getCategories();
        return () => {
            isMounted = false;
            controller.abort();
        }
    }, [])

    return (
        <Container>
            
            <Card className="my-3">
                <CardTitle><h1 className="my-4 mx-3">{auth.user}</h1></CardTitle>
                <CardBody>
                    <p className="fs-2">Balance Total: ${balanceTotal(accounts)}</p>
                </CardBody>
            </Card>
            <CreateAccount />
            {accounts.map(account => (
                <ProfileAccounts account={account} listOfAccounts={accounts}/>
            ))}
            <Container className="my-4 profileContainer">
                <h2 className="mx-3 my-4">Categoria de gastos</h2>
                <Container className="mb-4">
                {categories.map(category => (
                    <span className="fs-5 mx-1"><Badge bg="dark">{category.name}</Badge></span>
                ))}
                <br />
                <br />
                <CreateCategory/>
                </Container>
            </Container>
        </Container>
    )
}

export default Profile