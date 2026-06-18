import { useContext } from "react";
import { AuthContext, type AuthContextType, type AuthState } from "../context/AuthProvider";

type RequiredAuthContext = Omit<AuthContextType, "auth"> & {
    auth: NonNullable<AuthState>
}

const useAuth = (): RequiredAuthContext => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth debe usarse dentro de AuthProvider");
    }
    return context as RequiredAuthContext;
}

export default useAuth;