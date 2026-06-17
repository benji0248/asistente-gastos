import { Outlet } from "react-router-dom"
import { useState, useEffect } from "react"
import useRefreshToken from "../hooks/useRefreshToken"
import useAuth from "../hooks/useAuth"
import { LoadingScreen } from "./layout/LoadingScreen"

const PersistLogin = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const refresh = useRefreshToken()
  const { auth } = useAuth()

  useEffect(() => {
    const verifyRefreshToken = async () => {
      try {
        await refresh()
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    !auth?.accessToken ? verifyRefreshToken() : setIsLoading(false)
  }, [])

  return <>{isLoading ? <LoadingScreen /> : <Outlet />}</>
}

export default PersistLogin
