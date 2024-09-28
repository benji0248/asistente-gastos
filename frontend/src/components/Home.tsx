import { Button, Container } from "react-bootstrap"
import CreateAccount from "./Profile/createAccount";
import { useLogout } from "../hooks/useLogout";
import { useNavigate } from "react-router-dom";


const Home = () => {
    const navigate = useNavigate();
    const logout = useLogout()

    const signOut = async () => {
        await logout();
        navigate('/login')
    }
    return (
        <Container>
            <Button onClick={signOut}>Sign Out</Button>
        </Container>
    )
}

export default Home;