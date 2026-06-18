import { useLocation, Navigate, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";

interface RequireAuthProps {
    allowedRoles: number[]
}

const RequireAuth: React.FC<RequireAuthProps> = ({ allowedRoles }) => {
    const { auth, loading } = useAuth();
    const location = useLocation();

    if (loading) return null;

    if (!auth?.id || !auth?.accessToken) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    const hasAccess = allowedRoles.includes(auth.role);

    return hasAccess
        ? <Outlet />
        : <Navigate to="/" state={{ from: location }} replace />;
}

export default RequireAuth;
