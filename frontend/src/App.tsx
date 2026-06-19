import { Route, Routes } from "react-router-dom"
import Expenses from "./components/Expenses/Expenses"
import { Register } from "./components/Auth/Register"
import { Login } from "./components/Auth/Login"
import RequireAuth from "./components/RequireAuth"
import Profile from "./components/Profile/Profile"
import Hogar from "./components/Hogar/Hogar"
import Estadisticas from "./components/Stats/Estadisticas"
import TarjetasCredito from "./components/Tarjetas/TarjetasCredito"
import Home from "./components/Home/Home"
import { HomeLogged } from "./components/Home/HomeLogged"
import PersistLogin from "./components/PersistLogin"
import { ROLES } from "./consts"
import { DashboardLayout } from "./components/layout/DashboardLayout"

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<PersistLogin />}>
        <Route path="/" element={<Home />} />

        <Route element={<RequireAuth allowedRoles={[ROLES.user]} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/home" element={<HomeLogged />} />
            <Route path="/:userId/expenses" element={<Expenses />} />
            <Route path="/:userId/estadisticas" element={<Estadisticas />} />
            <Route path="/:userId/tarjetas" element={<TarjetasCredito />} />
            <Route path="/:userId/hogar" element={<Hogar />} />
            <Route path="/:userId/profile" element={<Profile />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  )
}

export default App
