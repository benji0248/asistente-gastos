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
            console.log(JSON.stringify(prev));
            console.log(response.data.accessToken);
            return { ...prev, accessToken: response.data.accessToken }
        });
        return response.data.accessToken
    }
    return refresh;
}

export default useRefreshToken
