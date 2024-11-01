import { Button, Nav, Navbar, NavbarBrand, NavbarCollapse, NavbarToggle, NavItem, NavLink } from "react-bootstrap"
import useAuth from "../../hooks/useAuth"
import { useNavigate } from "react-router-dom";
import { useLogout } from "../../hooks/useLogout";


export const NavbarApp: React.FC = () => {

    const { auth } = useAuth();
    const navigate = useNavigate();
    const logout = useLogout()

    const signOut = async () => {
        await logout();
        navigate('/login')
    }
    
    return (
        
        
        <Navbar expand="lg" className="borderNavbar">
            <NavbarBrand href="/home" aria-controls="navbar-nav" className="fs-2 fw-bold">Control de Gastos</NavbarBrand>
            <NavbarToggle aria-controls="navbar-nav" /> 
            <NavbarCollapse id="navbar-nav" className="linksNav">
                <Nav>
                    <NavLink href="/home" className="fs-5">Inicio</NavLink>
                    <NavLink href="/:userId/expenses" className="fs-5">Gastos</NavLink>
                    <NavLink href="/:userId/profile" className="fs-5">Cuenta</NavLink>
                </Nav>
            </NavbarCollapse> 
            
                {auth
                ?   <Nav className="login-nav">
                    <NavItem>
                        <Button variant="outline-dark" onClick={signOut}>Logout</Button>
                    </NavItem>
                            
                        </Nav> 
                    :   <Nav className="login-nav">
                            <NavItem>
                                    <Button href="/login" className="fs-5 me-2" variant="outline-dark">Login</Button>  
                                </NavItem>
                                <NavItem>
                                    <Button href="/register" className="fs-5" variant="dark">Register</Button>   
                            </NavItem>
                        </Nav>}
            
        </Navbar>
        
    )
    
}