import { useContext, useEffect, useRef, useState } from "react"
import { Container } from "react-bootstrap";
import { AuthContext } from "../../context/AuthProvider";
import axios from "../../api/axios";
import {AxiosError} from "axios";

const LOGIN_URL = '/auth'


export const Login = () => {

    const {setAuth} = useContext(AuthContext)
    const userRef = useRef<HTMLInputElement>(null);
    const errRef = useRef<HTMLParagraphElement>(null);

    const [user, setUser] = useState<string>('');
    const [pwd, setPwd] = useState<string>('');
    const [errMsg, setErrMsg] = useState<string>('');
    const [success, setSuccess] = useState<boolean>(false);

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
                    headers: { 'Content-Type': 'application/jason' },
                    withCredentials: true
                }
            );
            console.log(JSON.stringify(response?.data))
            console.log(JSON.stringify(response))
            const accessToken = response?.data?.accessToken;
            const roles = response?.data?.roles;
            setAuth({ user, pwd, roles, accessToken });
            setUser('')
            setPwd(''),
                setSuccess(true);
        } catch (err) {
            const error = err as AxiosError
            if (!error?.response) {
                setErrMsg('No hay respuesta del servidor');
            } else if (error.response?.status === 400) {
                setErrMsg('Falta el Usuario o la Contraseña');
            } else if (error.response?.status === 401) {
                setErrMsg('Autorizacion no permitida')
            } else {
                setErrMsg('Fallo en el login')
            }
            errRef.current?.focus();
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
