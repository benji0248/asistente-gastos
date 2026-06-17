import { db } from "../database/database";
import { Request, Response } from "express";
import { Token, Users } from "../config/types";
import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from 'dotenv'
import { cookieOptions, clearCookieOptions } from "../config/cookies";

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
    if (!cookies?.jwt) {
        return res.sendStatus(401);
    }
    res.clearCookie('jwt', clearCookieOptions);
    const [foundToken] = await db.query<Token[]>(`SELECT * FROM tokens WHERE token = ?`, refreshToken)
    if (foundToken.length === 0) return res.status(403)
    const typedFoundToken = foundToken[0]
    if (!accessSecret || !refreshSecret) throw new Error('El token no esta definido.')
    const [foundUser] = await db.query<Users[]>(`SELECT * FROM users WHERE id = ?`, typedFoundToken.user_id)
    const typedFoundUser = foundUser[0]
    if (!typedFoundToken || !typedFoundToken.user_id) {
        try {
            const decoded = jwt.verify(refreshToken, refreshSecret) as JwtPayload
            if (!decoded) return res.sendStatus(403)
            await db.query(`DELETE FROM tokens WHERE user_id = ?`, typedFoundToken.user_id)
        } catch (err) {
            res.sendStatus(403);
        }
    }
    const decoded = jwt.verify(refreshToken, refreshSecret) as JwtPayload
    if (!decoded) {
        console.log('El token expiro');
    }
    if (!decoded || typedFoundUser.username !== decoded.username) return res.sendStatus(403)
    const role = typedFoundUser.role
    const id = typedFoundUser.id
    const user = typedFoundUser.username
    
    const accessToken = jwt.sign(
        {
            "UserInfo": {
                "username": decoded.username,
                "role": typedFoundUser.role
            }
        },
            accessSecret,
            { expiresIn: '180s' }
    );
    
    const newRefreshToken = jwt.sign(
        { "username": typedFoundUser.username },
        refreshSecret,
        { expiresIn: '1d' }
    );
    await db.query(`UPDATE tokens SET token = ? WHERE id = ?`, [newRefreshToken, typedFoundToken.id])
    res.cookie('jwt', newRefreshToken, cookieOptions)
    res.json({user,role,accessToken, id})
}