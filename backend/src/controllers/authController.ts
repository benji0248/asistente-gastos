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
    const { username, pwd } = req.body;
    if (!username) {
        return res.status(400).json({'message': 'Ingrese el usuario por favor'})
    } else if (!pwd) {
        return res.status(400).json({'message': 'Ingrese la contraseña por favor'})
    } else {
        try {
            const [foundUser] = await db.query<RowDataPacket[]>(`SELECT * FROM users WHERE username = ?`, username)
            if (foundUser.length === 0) return res.status(400).json({ message: 'Usuario incorrecto' })
            const [typeFoundUser] = foundUser as Users[]
            const match = await bcrypt.compare(pwd, typeFoundUser.pwd)
            if(!match) return res.status(400).json({message:'Clave incorrecta'})
        if (match) {
            const accessSecret = process.env.ACCESS_TOKEN_SECRET;
            const refreshSecret = process.env.REFRESH_TOKEN_SECRET;
            if(!accessSecret || !refreshSecret) throw new Error('El token no esta definido.')
            const accessToken = jwt.sign(
            
                {
                    "username": typeFoundUser.username,
                    "roles"
                 },
                accessSecret,
                { expiresIn: '30s'}
            )
            const refreshToken = jwt.sign(
                { "username": typeFoundUser.username },
                refreshSecret,
                { expiresIn: '1d'}
            )
            await handleTokenInsertion(refreshToken, typeFoundUser.id)
            res.cookie('jwt', refreshToken, {httpOnly: true, maxAge: 24*60*60*1000})
            res.json({accessToken})
            }
        } catch (err) {
            res.status(400)
        }
    }
}