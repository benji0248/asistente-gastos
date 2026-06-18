import { Navigate } from "react-router-dom"
import useAuth from "../../hooks/useAuth"
import HomeNoLog from "./HomeNoLog"
import { PublicNavbar } from "../layout/PublicNavbar"

const Home = () => {
  const { auth } = useAuth()

  if (auth?.id) {
    return <Navigate to="/home" replace />
  }

  return (
    <>
      <PublicNavbar />
      <HomeNoLog />
    </>
  )
}

export default Home
