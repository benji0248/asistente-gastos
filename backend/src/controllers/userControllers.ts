import { Request, Response } from "express";
import  userServices  from "../config/userServices";
import { newUsers, Users } from "../config/types";
import bcrypt from 'bcrypt'
import { db } from "../database/database";

class userControllers {

    static getUsers = async (req:Request, res: Response) => {
        try {
            const users = await userServices.getAllUsers()
            console.log(users)
            res.status(200).json(users);
        } catch (err) {
            console.error('Error en el controlador getUsers', err)
        }
    }

    static addUser = async (req: Request, res: Response) => {
        const { user, email, pwd } = req.body;
        if (!user || !email || !pwd) return res.status(400).json({ 'message': 'Datos invalidos' })
        const duplicate = db.query(`SELECT COUNT (*) FROM users WHERE (user, email) VALUES (?,?)`, [user, email]);
        
        try {

        } catch (err) {
            console.error('Error en el controlador addUser', err)
        }
    }

    static updateUser = async (req: Request, res: Response) => {
        const {userId} = req.params
        try {
            const updatedUser = await userServices.updateOneUser(userId, req.body)
            res.status(200).json(updatedUser);
        } catch (err) {
            console.error('Error en el controlador updateUser', err)
        }
    }

    static getOneUser = async (req: Request, res: Response) => {
        try {
            const { userId } = req.params;
        const user = await userServices.getUserById(userId);
            res.status(200).json(user);
        } catch (err) {
            console.error('Error en el controlador getOneUser', err)
        }
    }

    static deleteUser = async (req: Request, res: Response) => {
        const { userId } = req.params;
        try {
            const userToDelete = await userServices.deleteOneUser(userId);
            res.status(200).json(userToDelete);
        } catch (err) {
            console.error('Error en el controlador deleteUser', err)
        }
    }
}

export default userControllers