import React, { useEffect, useRef, useState } from "react";
import { Container, Form, FormControl, Row } from "react-bootstrap";
import { FaInfoCircle, FaCheck, FaTimes } from "react-icons/fa";
    
const USER_REGEX = /^[a-zA-Z][a-zA-Z0-9-_]{3,23}$/;
const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,24}$/;

export const Register = () => {

    const userRef = useRef<HTMLInputElement>(null);
    const errRef = useRef<HTMLParagraphElement>(null);

    const [user, setUser] = useState<string>('');
    const [validName, setValidName] = useState<boolean>(false);
    const [userFocus, setUserFocus] = useState<boolean>(false);

    const [pwd, setPwd] = useState<string>('');
    const [validPwd, setValidPwd] = useState<boolean>(false);
    const [pwdFocus, setPwdFocus] = useState<boolean>(false);

    const [matchPwd, setMatchPwd] = useState<string>('');
    const [validMatch, setValidMatch] = useState<boolean>(false);
    const [matchFocus, setMatchFocus] = useState<boolean>(false);

    const [errMsg, setErrMsg] = useState<string>('');
    const [success, setSuccess] = useState<boolean>(false);

    useEffect(() => {
        userRef.current?.focus();
    }, [])

    useEffect(() => {
        const result = USER_REGEX.test(user);
        console.log(result);
        console.log(user);
        setValidName(result);
    }, [user])

    useEffect(() => {
        const result = PWD_REGEX.test(pwd);
        console.log(result);
        console.log(pwd);
        setValidPwd(result);
        const match = pwd === matchPwd;
        setValidMatch(match);
    }, [pwd, matchPwd])

    useEffect(() => {
        setErrMsg('');  
    }, [user, pwd, matchPwd])

    const handleSubmit = async (e: React.ChangeEvent<HTMLFormElement>) => {
        e.preventDefault();
        const v1 = USER_REGEX.test(user);
        const v2 = PWD_REGEX.test(pwd);
        if (!v1 || !v2) {
            setErrMsg('Usuario o Contraseña Invalidos')
            return;
        }
        console.log(user, pwd);
        setSuccess(true);
    }

    return (
        <Container>
            {success ? (
                <Container className="classContainer verticalCenter">
                    <h1>Registro Exitoso!</h1>
                    <p>
                        <a href="#" className="line">Inicia Sesion</a>
                    </p>
                </Container>
            ) : (
                <Container className="classContainer">
                    <p ref={errRef} className={errMsg ? 'errmsg' : 'offscreen'} aria-live="assertive">{errMsg}</p>
                    <h1>Registrarse</h1>
                    <form onSubmit={handleSubmit}>
                            <Row className="justify-content-center">
                                <label htmlFor="username">
                                    Username:
                                    <span className={validName ? "valid" : "hide"}><FaCheck /></span>
                                    <span className={validName || !user ? "hide" : "invalid"}><FaTimes /></span>
                                </label>
                            </Row>
                        <input
                            type="text"
                            id="username"
                            autoComplete="off"
                            onChange={(e) => setUser(e.target.value)}
                            required
                            aria-invalid={validName ? "false" : "true"}
                            aria-describedby="uidnote"
                            onFocus={() => setUserFocus(true)}
                            onBlur={() => setUserFocus(false)}
                        ></input>
                        <p id="uidnote" className={userFocus && user && !validName ? "instructions" : "offscreen"}>
                            <FaInfoCircle /> Deben ser de 4 a 24 caracteres.<br />
                            Debe comenzar con una letra.<br />
                            Las letras, los numeros y unicamente el simbolo '_' estan permitidos.
                        </p>

                        <label htmlFor="password">
                            Clave:
                            <span className={validPwd ? 'valid' : 'hide'}>
                                <FaCheck />
                            </span>
                            <span className={validPwd || !pwd ? 'hide' : 'invalid'}>
                                <FaTimes />
                            </span>
                        </label>
                        <input
                            type="password"
                            id="password"
                            onChange={(e) => setPwd(e.target.value)}
                            required
                            aria-invalid={validPwd ? 'false' : 'true'}
                            aria-describedby="pwdnote"
                            onFocus={() => setPwdFocus(true)}
                            onBlur={() => setPwdFocus(false)}
                        >
                        </input>
                        <p id="pwdnote" className={pwdFocus && !validPwd ? 'instructions' : 'offscreen'}>
                            <FaInfoCircle />
                            Tiene que tener de 8 a 24 caracteres.<br />
                            Tiene que incluir una letra mayuscula y un numero.<br />
                        </p>

                        <label htmlFor="confirm_pwd">
                            Confirma la Clave:
                            <span className={validMatch && matchPwd ? 'valid' : 'hide'}> <FaCheck /></span>
                            <span className={validMatch || !matchPwd ? 'hide' : 'invalid'}><FaTimes /></span>
                        </label>
                        <input
                            type="password"
                            id="confirm_pwd"
                            onChange={(e) => setMatchPwd(e.target.value)}
                            required
                            aria-invalid={validMatch ? 'false' : 'true'}
                            aria-describedby="confirmnote"
                            onFocus={() => setMatchFocus(true)}
                            onBlur={() => setMatchFocus(false)}
                        >
                        </input>
                        <p id="confirmnote" className={matchFocus && !validMatch ? 'instructions' : 'offscreen'}>
                            <FaInfoCircle />
                            Las claves no coinciden.
                        </p>
                        <button disabled={!validName || !validPwd || !validMatch ? true : false}>Registrarse</button>
                    </form>
                    <p>
                        ¿Ya estas registrado?<br />
                            <a href="/login" className="line">Inicia Sesion</a>

                    </p>
                </Container>
            )}
        </Container>
    )
}