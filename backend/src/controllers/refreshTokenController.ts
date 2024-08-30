import { db } from "../database/database";
import { Request, Response } from "express";
import { Token, Users } from "../config/types";
import { RowDataPacket } from "mysql2";
import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from 'dotenv'
import { handleTokenInsertion } from "../middlewares/tokenInsertion";

dotenv.config();

interface CustomRequest extends Request{
    
}

export const handleRefreshToken = async (req: Request, res: Response) => {
    
    const cookies = req.cookies
    if (!cookies?.jwt) return res.sendStatus(401);
    const refreshToken = cookies.jwt
    const accessSecret = process.env.ACCESS_TOKEN_SECRET;
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET;
    const [foundToken] = await db.query<RowDataPacket[]>(`SELECT * FROM tokens WHERE token = ?`, refreshToken)
    if (foundToken.length === 0) return res.status(403).json({ message: 'Token no conseguido' })
    const [typedFoundToken] = foundToken as Token[]
    if (!accessSecret || !refreshSecret) throw new Error('El token no esta definido.')
    const [foundUser] = await db.query<RowDataPacket[]>(`SELECT * FROM users WHERE id = ?`, typedFoundToken.user_id)
    const [typedFoundUser] = foundUser as Users[]
    const decoded = jwt.verify(refreshToken, refreshSecret) as JwtPayload
    if (typedFoundUser.username !== decoded.username) return res.sendStatus(403)
        const accessToken = jwt.sign(
            { "username": decoded.username },
            accessSecret,
            { expiresIn: '30s' }
        );
    res.json({accessToken})
    }