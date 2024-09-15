import { Container } from "react-bootstrap"
import useAuth from "../../hooks/useAuth"
import { useEffect, useState } from "react"
import { useAxiosPrivate } from "../../hooks/useAxiosPrivate"
import { Account } from "../../types"
import { useLocation, useNavigate } from "react-router-dom"
import CreateAccount from "./createAccount"



function Profile() {

    const { auth } = useAuth();
    const [accounts, setAccounts] = useState<Account[]>([]);
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

    return (
        <Container>
            <CreateAccount></CreateAccount>
        </Container>
    )
}

export default Profile