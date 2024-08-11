import { useEffect, useRef, useState } from "react"
import { Container } from "react-bootstrap";


export const Login = () => {

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
