import { createContext, useState, ReactNode, Dispatch, SetStateAction } from "react";

type AuthData = {
    user: string;
    token: string;
    userId: string;
}

interface AuthContextType {
    auth: AuthData;
    setAuth: Dispatch<SetStateAction<any>>;
}

export const AuthContext = createContext<AuthContextType | any>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    
    const [auth, setAuth] = useState<AuthData | null>(null);

    return (

         <AuthContext.Provider value={{auth, setAuth}}>
            { children }
        </AuthContext.Provider> 
    )
};