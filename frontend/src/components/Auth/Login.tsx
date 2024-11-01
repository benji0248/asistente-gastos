import { useEffect, useRef, useState } from "react"
import { Container } from "react-bootstrap";
import useAuth from "../../hooks/useAuth";
import axios from "../../api/axios";
import { AxiosError } from "axios";
import { Link, useNavigate, useLocation } from "react-router-dom";

const LOGIN_URL = '/login'


export const Login = () => {

    const { setAuth } = useAuth();

    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || "/";

    const userRef = useRef<HTMLInputElement>(null);
    const errRef = useRef<HTMLParagraphElement>(null);

    const [user, setUser] = useState<string>('');
    const [pwd, setPwd] = useState<string>('');
    const [errMsg, setErrMsg] = useState<string>('');

    useEffect(() => {
        userRef.current?.focus();
    }, [])

    useEffect(() => {
        setErrMsg('');
    }, [user, pwd])

    const handleSubmit = async (e: React.ChangeEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            const response = await axios.post(LOGIN_URL, JSON.stringify({ user, pwd }),
                {
                    headers: { 'Content-Type': 'application/json' },
                    withCredentials: true
                }
            );
            const accessToken = response?.data?.accessToken;
            const role = response?.data?.role;
            const id = response?.data?.id
            console.log('Este es el id', id)
            setAuth({ user, pwd, role, accessToken, id });
            setUser('')
            setPwd('')
            const redirectionPath = from.replace(":userId", id);
            navigate(redirectionPath, { replace: true });
            
        } catch (err) {
            let errorMessage = 'Error al inciar sesion. Por favor, intente de nuevo.';
            console.log('Este es el error que se esta pasando',err)

            if (err instanceof AxiosError) {
                if (err.response) {

                    errorMessage = err.response.data.message || 'Error en la solicitud';
                } else if (err.request) {

                    errorMessage = 'No se recibió respuesta del servidor';
                } else {

                    errorMessage = err.message;
                }
            }
            console.log(err)
            setErrMsg(errorMessage)
        }
    }

    return (
        <Container className="classContainer">
            <p ref={errRef} className={errMsg ? 'errmsg' : 'offscreen'} aria-live="assertive">{errMsg}</p>
            <h1>Inicia Sesion</h1>
            <form onSubmit={handleSubmit}>
                <label htmlFor="username">Username:</label>
                <input
                    type="text"
                    id="username"
                    ref={userRef}
                    autoComplete="off"
                    onChange={(e) => setUser(e.target.value)}
                    value={user}
                    required
                />

                <label htmlFor="password">Password:</label>
                <input
                    type="password"
                    id="password"
                    onChange={(e) => setPwd(e.target.value)}
                    value={pwd}
                    required
                />
                <button>Iniciar Sesion</button>
            </form>
            <p>¿No tienes cuenta?</p>
            <a href="/register" className="line">Registrate</a>
        </Container>
    )
}
