import { Route, Routes } from "react-router-dom"
import Expenses from "./components/Expenses/Expenses"
import { NavbarApp } from "./components/Navbar/NavbarApp"
import { Container } from "react-bootstrap"
import { Register } from "./components/Auth/Register"
import { Login } from "./components/Auth/Login"
import RequireAuth from "./components/RequireAuth"
import Profile from "./components/Profile/Profile"
import Home from "./components/Home/Home"
import PersistLogin from "./components/PersistLogin"
import { ROLES } from "./consts"

function App() {
  return (
    <>
      <Container>
      <NavbarApp />
      <Routes>
      <Route path="/login" element={<Login/>}></Route>
      <Route path="/register" element={<Register />}></Route>
        
          <Route element={<PersistLogin />}>
          <Route path="/" element={<Home/>}></Route>
          <Route path="/home" element={<Home/>}></Route>
      <Route element={<RequireAuth allowedRoles={[ROLES.user]} />}>
          <Route path="/:userId/expenses" element={<Expenses />}></Route>
          <Route path="/:userId/profile" element={<Profile />}></Route>
          </Route>
      </Route>
    </Routes>
    </Container>
    </>
  ) 
}
export default App
 