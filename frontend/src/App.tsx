import { Route, Routes } from "react-router-dom"
import Expenses from "./components/Expenses/Expenses"
import { PublicNavbar } from "./components/layout/PublicNavbar"
import { Register } from "./components/Auth/Register"
import { Login } from "./components/Auth/Login"
import RequireAuth from "./components/RequireAuth"
import Profile from "./components/Profile/Profile"
import Home from "./components/Home/Home"
import PersistLogin from "./components/PersistLogin"
import { ROLES } from "./consts"
import { AppShell } from "./components/layout/AppShell"

function App() {
  return (
    <>
      <PublicNavbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<PersistLogin />}>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route element={<RequireAuth allowedRoles={[ROLES.user]} />}>
            <Route
              path="/:userId/expenses"
              element={
                <AppShell>
                  <Expenses />
                </AppShell>
              }
            />
            <Route
              path="/:userId/profile"
              element={
                <AppShell>
                  <Profile />
                </AppShell>
              }
            />
          </Route>
        </Route>
      </Routes>
    </>
  )
}

export default App
