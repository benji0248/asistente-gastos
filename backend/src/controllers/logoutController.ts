import { Request, Response } from "express";
import { db } from "../database/database";
import { Token } from "../config/types";
import { RowDataPacket } from "mysql2";

export const handleLogout = async (req: Request, res: Response) => {
    const cookies = req.cookies;
    if (!cookies.jwt) return res.sendStatus(204); // No hay contenido
    const refreshToken = cookies.jwt
    const [foundToken] = await db.query<RowDataPacket[]>(`SELECT * FROM tokens WHERE token = ?`, refreshToken)
    const typedFoundToken = foundToken as Token[];
    if (typedFoundToken.length === 0) {
        res.clearCookie('jwt', { httpOnly: true, sameSite:'none', secure: true });
        return res.sendStatus(204);
    }

    await db.query(`DELETE FROM tokens WHERE token = ?`, refreshToken);
    res.clearCookie('jwt', { httpOnly: true, sameSite: 'none', secure: true });
    res.sendStatus(204);
}