import { createContext, useState, ReactNode, Dispatch, SetStateAction } from "react";

type AuthData = {
    token: string;
    userId: string;
}

interface AuthContextType {
    auth: AuthData;
    setAuth: Dispatch<SetStateAction<any>>;
}

export const AuthContext = createContext<AuthContextType | any>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    
    const [auth, setAuth] = useState<AuthData>({token: '', userId:''});

    return (

         <AuthContext.Provider value={{auth, setAuth}}>
            { children }
        </AuthContext.Provider> 
    )
};