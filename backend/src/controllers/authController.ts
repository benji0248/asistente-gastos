import { db } from "../database/database";
import bcrypt from 'bcrypt';
import { Request, Response } from "express";
import { Users } from "../config/types";
import { RowDataPacket } from "mysql2";
import jwt from "jsonwebtoken";
import dotenv from 'dotenv'
import { handleTokenInsertion } from "../middlewares/tokenInsertion";

dotenv.config();
const path = require('path')

export const handleLogin = async (req: Request, res: Response) => {
    const cookies = req.cookies;
    const { user, pwd } = req.body;
    if (!user) {
        return res.status(400).json({'message': 'Ingrese el usuario por favor'})
    } else if (!pwd) {
        return res.status(400).json({'message': 'Ingrese la contraseña por favor'})
    } else {
        try {
            const [foundUser] = await db.query<RowDataPacket[]>(`SELECT * FROM users WHERE username = ?`, user)
            if (foundUser.length === 0) return res.status(400).json({ message: 'Usuario incorrecto' })
            const [typeFoundUser] = foundUser as Users[]
            const [foundToken] = await db.query<RowDataPacket[]>(`SELECT * FROM tokens WHERE user_id = ?`, [typeFoundUser.id])
            const match = await bcrypt.compare(pwd, typeFoundUser.pwd)
            console.log(match)
            if(!match) return res.status(400).json({message:'Clave incorrecta'})
        if (match) {
            const accessSecret = process.env.ACCESS_TOKEN_SECRET;
            const refreshSecret = process.env.REFRESH_TOKEN_SECRET;
            if (!accessSecret || !refreshSecret) throw new Error('El token no esta definido.')
            const role = typeFoundUser.role
            const id = typeFoundUser.id
            const username = typeFoundUser.username
            const accessToken = jwt.sign(
                {
                "UserInfo": {
                    "username": typeFoundUser.username,
                    "role": typeFoundUser.role,
                    "id": typeFoundUser.id
                    }
                },
                accessSecret,
                { expiresIn: '180s'}
            )
            const newRefreshToken = jwt.sign(
                { "username": typeFoundUser.username },
                refreshSecret,
                { expiresIn: '1d'}
            )

            if (cookies?.jwt) {
                await db.query(`DELETE FROM tokens WHERE token = ? AND user_id = ?`, [cookies.jwt, typeFoundUser.id])
                res.clearCookie('jwt', { httpOnly: true, sameSite: 'none', secure: true })
            }

            await handleTokenInsertion(newRefreshToken, typeFoundUser.id)
            res.cookie('jwt', newRefreshToken, {httpOnly: true, maxAge: 24*60*60*1000})
            res.json({role, accessToken, id, username})
            }
        } catch (err) {
            res.status(400)
        }
    }
}
