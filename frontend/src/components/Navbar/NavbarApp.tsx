import { Container, Nav, Navbar, NavbarBrand, NavbarCollapse, NavbarToggle, NavLink } from "react-bootstrap"
import { GrNotes } from "react-icons/gr"


export const NavbarApp: React.FC = () => {
    
    return (
        
        
        <Navbar expand="lg">
            <Container fluid>
            <NavbarBrand href="/home" aria-controls="navbar-nav"><GrNotes className="me-2" />Control de Gastos</NavbarBrand>
            <NavbarToggle aria-controls="navbar-nav"/>
            <NavbarCollapse id="navbar-nav">
                <Nav className="me-auto">
                    <NavLink href="/home">Inicio</NavLink>
                    <NavLink href="/expenses">Gastos</NavLink>
                    <NavLink href="/profile">Cuenta</NavLink>
                    <NavLink href="#compras" disabled>Lista de Compras</NavLink>
                    <NavLink href="/login">Login</NavLink>
                    <NavLink href="/register">Register</NavLink>
                </Nav>
            </NavbarCollapse>
            </Container>
        </Navbar>
        
    )
    
}