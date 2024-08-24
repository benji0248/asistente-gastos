import React, { useEffect, useRef, useState } from "react";
import { Container, Row } from "react-bootstrap";
import { FaInfoCircle, FaCheck, FaTimes } from "react-icons/fa";
import axios from "../../api/axios";
    
const USER_REGEX = /^[a-zA-Z][a-zA-Z0-9-_]{3,23}$/;
const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,24}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
const REGISTER_URL = '/register';

export const Register = () => {

    const userRef = useRef<HTMLInputElement>(null);
    const errRef = useRef<HTMLParagraphElement>(null);

    const [user, setUser] = useState<string>('');
    const [validName, setValidName] = useState<boolean>(false);
    const [userFocus, setUserFocus] = useState<boolean>(false);

    const [email, setEmail] = useState<string>('');
    const [validEmail, setValidEmail] = useState<boolean>(false);
    const [emailFocus, setEmailFocus] = useState<boolean>(false);

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
        setValidName(result);
    }, [user])

    useEffect(() => {
        const result = EMAIL_REGEX.test(email);
        setValidEmail(result)
    }, [email])

    useEffect(() => {
        const result = PWD_REGEX.test(pwd);
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
        const v3 = EMAIL_REGEX.test(email)
        if (!v1 || !v2 || !v3) {
            setErrMsg('Uno de los campos es invalido')
            return;
        }
        try {
            const response = await axios.post(REGISTER_URL, JSON.stringify({ user, pwd, email }),
                {
                    headers: { 'Content-Type': 'application/json' },
                    withCredentials: true
                });
            console.log(JSON.stringify(response.data));
            console.log(JSON.stringify(response))
            setSuccess(true)
        } catch (err) {
            console.error('',err)
            setErrMsg('No se pudo registrar')
        }
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
                            <Row className="justify-content-center">
                                <label htmlFor="email">
                                    Email:
                                    <span className={validEmail ? "valid" : "hide"}><FaCheck /></span>
                                    <span className={validEmail || !email ? "hide" : "invalid"}><FaTimes /></span>
                                </label>
                            </Row>
                        <input
                            type="email"
                            id="email"
                            autoComplete="off"
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            aria-invalid={validEmail? "false" : "true"}
                            aria-describedby="uidnote"
                            onFocus={() => setEmailFocus(true)}
                            onBlur={() => setEmailFocus(false)}
                        ></input>
                        <p id="uidnote" className={emailFocus && email && !validEmail ? "instructions" : "offscreen"}>
                            <FaInfoCircle /> El email ingresado no es valido.
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
                            Confirmacion de clave:
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
                        <button className="rButton" disabled={!validName || !validPwd || !validMatch ? true : false}>Registrarse</button>
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