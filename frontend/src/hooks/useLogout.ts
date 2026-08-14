import { logout as identityLogout } from '@/lib/auth/identity'
import { getRefreshToken } from '@/lib/auth/session'
import useAuth from './useAuth'

export const useLogout = () => {
  const { setAuth } = useAuth()

  const logout = async () => {
    const refreshToken = getRefreshToken()
    setAuth(null)
    try {
      await identityLogout(refreshToken)
    } catch (err) {
      console.error(err)
    }
  }

  return logout
}
