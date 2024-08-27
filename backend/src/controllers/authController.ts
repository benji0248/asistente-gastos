import { db } from "../database/database";
import bcrypt from 'bcrypt';
import { Request, Response } from "express";
import { Users } from "../config/types";
import { RowDataPacket } from "mysql2";

export const handleLogin = async (req: Request, res: Response) => {
    const { user, pwd } = req.body;
    if (!user) {
        return res.status(400).json({'message': 'Ingrese el usuario por favor'})
    } else if (!pwd) {
        return res.status(400).json({'message': 'Ingrese la contraseña por favor'})
    } else {
        try {
            const [foundUser] = await db.query<RowDataPacket[]>(`SELECT * FROM users WHERE user = ?`, user)
            if (foundUser.length === 0) return res.status(400).json({ message: 'Usuario incorrecto' })
            const [typeFoundUser] = foundUser as Users[]
            const match = await bcrypt.compare(pwd, typeFoundUser.pwd)
            if(!match) return res.status(400).json({message:'Clave incorrecta'})
        if (match) {
            res.status(200).json({'success':`El usuario ${typeFoundUser.user} ha iniciado sesion con exito`})
            }
        } catch (err) {
            res.status(400)
        }
    }
}