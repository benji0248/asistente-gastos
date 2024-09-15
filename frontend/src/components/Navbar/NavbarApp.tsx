import { Container, Nav, Navbar, NavbarBrand, NavbarCollapse, NavbarToggle, NavItem, NavLink } from "react-bootstrap"
import { GrNotes } from "react-icons/gr"


export const NavbarApp: React.FC = () => {
    
    return (
        
        
        <Navbar expand="lg">
            <NavbarBrand href="/home" aria-controls="navbar-nav"><GrNotes className="me-2" />Control de Gastos</NavbarBrand>
            <Nav className="login-nav">
                <NavItem>
                  <NavLink href="/login" className="loginLink">Login</NavLink>  
                </NavItem>
                <NavItem>
                 <NavLink href="/register" className="registerLink">Register</NavLink>   
                </NavItem>
            </Nav>
            <NavbarToggle aria-controls="navbar-nav" /> 
            <NavbarCollapse id="navbar-nav" className="linksNav">
                <Nav>
                    <NavLink href="/home">Inicio</NavLink>
                    <NavLink href="/:userId/expenses">Gastos</NavLink>
                    <NavLink href="/:userId/profile">Cuenta</NavLink>
                </Nav>
            </NavbarCollapse> 
        </Navbar>
        
    )
    
}