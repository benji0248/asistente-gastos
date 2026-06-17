import useAuth from "../../hooks/useAuth"
import { AppShell } from "../layout/AppShell"
import { HomeLogged } from "./HomeLogged"
import HomeNoLog from "./HomeNoLog"

const Home = () => {
  const { auth } = useAuth()
  return (
    <>
      {auth ? (
        <AppShell>
          <HomeLogged />
        </AppShell>
      ) : (
        <HomeNoLog />
      )}
    </>
  )
}

export default Home
