import { Outlet } from "react-router-dom"
import useAuth from "../hooks/useAuth"
import { LoadingScreen } from "./layout/LoadingScreen"

const PersistLogin = () => {
  const { loading } = useAuth()

  return <>{loading ? <LoadingScreen /> : <Outlet />}</>
}

export default PersistLogin
