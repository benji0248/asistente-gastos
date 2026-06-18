import { supabase } from '@/lib/supabase'
import useAuth from './useAuth'

export const useLogout = () => {
    const { setAuth } = useAuth()

    const logout = async () => {
        setAuth(null)
        try {
            await supabase.auth.signOut()
        } catch (err) {
            console.error(err)
        }
    }
    return logout
}
