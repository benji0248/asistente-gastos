import { Route, Routes } from "react-router-dom"
import Expenses from "./components/Expenses/Expenses"
import { NavbarApp } from "./components/Navbar/NavbarApp"
import { Container } from "react-bootstrap"
import Profile from "./components/Profile/Profile"
import { Register } from "./components/Auth/Register"
import { Login } from "./components/Auth/Login"
function App() {
  return (
    <Container>
    <NavbarApp />
    <Routes>
      <Route path="/login" element={<Login/>}></Route>
      <Route path="/register" element={<Register/>}></Route>
      <Route path="/expenses" element={<Expenses/>}></Route>
    </Routes>
    </Container>
  ) 
}

export default App
 