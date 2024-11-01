import useAuth from "../../hooks/useAuth";
import { HomeLogged } from "./HomeLogged";
import HomeNoLog from "./HomeNoLog";



const Home = () => {
    const { auth } = useAuth();
    return (
        <>  {auth 
                ? <HomeLogged/>
                : <HomeNoLog/>
            }
            
        </>
    )
}

export default Home;