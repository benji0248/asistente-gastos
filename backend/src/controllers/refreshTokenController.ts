import { db } from "../database/database";
import { Request, Response } from "express";
import { Token, Users } from "../config/types";
import { RowDataPacket } from "mysql2";
import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from 'dotenv'
import { handleTokenInsertion } from "../middlewares/tokenInsertion";

dotenv.config();

interface DecodedPlayload extends JwtPayload{
    username: string
    role: number
}

export const handleRefreshToken = async (req: Request, res: Response) => {
    
    const cookies = req.cookies
    const refreshToken = cookies.jwt
    const accessSecret = process.env.ACCESS_TOKEN_SECRET;
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET;
    if (!cookies?.jwt) return res.sendStatus(401);
    res.clearCookie('jwt', { httpOnly: true, sameSite:'none', secure: true });
    const [foundToken] = await db.query<RowDataPacket[]>(`SELECT * FROM tokens WHERE token = ?`, refreshToken)
    if (foundToken.length === 0) return res.status(403)
    const [typedFoundToken] = foundToken as Token[]
    if (!accessSecret || !refreshSecret) throw new Error('El token no esta definido.')
    const [foundUser] = await db.query<RowDataPacket[]>(`SELECT * FROM users WHERE id = ?`, typedFoundToken.user_id)
    const [typedFoundUser] = foundUser as Users[]
    if (!typedFoundToken || !typedFoundToken.user_id) {
        try {
            const decoded = jwt.verify(refreshToken, refreshSecret) as JwtPayload
            if (!decoded) return res.sendStatus(403)
            await db.query(`DELETE FROM tokens WHERE user_id = ?`, typedFoundToken.user_id)
        } catch (err) {
            res.sendStatus(403);
        }
    }
    await db.query(`DELETE FROM tokens WHERE id = ? `, typedFoundToken.id)
    const decoded = jwt.verify(refreshToken, refreshSecret) as JwtPayload
    if (!decoded) {
        console.log('El token expiro');
    }
    if (!decoded || typedFoundUser.username !== decoded.username) return res.sendStatus(403)
    const role = typedFoundUser.role
    
    const accessToken = jwt.sign(
        {
            "UserInfo": {
                "username": decoded.username,
                "role": typedFoundUser.role
            }
        },
            accessSecret,
            { expiresIn: '30s' }
    );
    
    const nweRefreshToken = jwt.sign(
        { "username": typedFoundUser.username },
        refreshSecret,
        { expiresIn: '1d' }
    );
    await db.query(`UPDATE tokens SET token = ? WHERE id = ?`, [nweRefreshToken, typedFoundToken.id])
    res.json({role,accessToken})
    }