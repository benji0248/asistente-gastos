import { Request, Response } from "express";
import { db } from "../database/database";
import { Token } from "../config/types";
import { clearCookieOptions } from "../config/cookies";

export const handleLogout = async (req: Request, res: Response) => {
    const cookies = req.cookies;
    if (!cookies.jwt) return res.sendStatus(204); // No hay contenido
    const refreshToken = cookies.jwt
    const [foundToken] = await db.query<Token[]>(`SELECT * FROM tokens WHERE token = ?`, refreshToken)
    if (foundToken.length === 0) {
        res.clearCookie('jwt', clearCookieOptions);
        return res.sendStatus(204);
    }

    await db.query(`DELETE FROM tokens WHERE token = ?`, refreshToken);
    res.clearCookie('jwt', clearCookieOptions);
    res.sendStatus(204);
}