import axios from '../api/axios'
import useAuth from './useAuth'

type AuthState = {
    accessToken: String;
    user?: string;
    expiresAt?: number;
}

const useRefreshToken = () => {
    const { setAuth } = useAuth();

    const refresh = async () => {
        const response = await axios.get('/refresh', {
            withCredentials: true
        });
        setAuth((prev: AuthState) => {
            return {
                ...prev,
                user: response.data.user,
                role: response.data.role,
                accessToken: response.data.accessToken,
                id: response.data.id
            }
        });
        return response.data.accessToken
    }
    return refresh;
}

export default useRefreshToken
