import { Request, Response } from "express";
import userServices from "../config/userServices";

class userControllers {

    static getUsers = async (_req: Request, res: Response) => {
        try {
            const users = await userServices.getAllUsers()
            res.status(200).json(users);
        } catch (err) {
            console.error('Error en el controlador getUsers', err)
        }
    }

    static updateUser = async (req: Request, res: Response) => {
        const { userId } = req.params
        try {
            const updatedUser = await userServices.updateOneUser(userId as string, req.body)
            res.status(200).json(updatedUser);
        } catch (err) {
            console.error('Error en el controlador updateUser', err)
        }
    }

    static getOneUser = async (req: Request, res: Response) => {
        try {
            const { userId } = req.params;
            const user = await userServices.getUserById(userId as string);
            res.status(200).json(user);
        } catch (err) {
            console.error('Error en el controlador getOneUser', err)
        }
    }

    static deleteUser = async (req: Request, res: Response) => {
        const { userId } = req.params;
        try {
            const userToDelete = await userServices.deleteOneUser(userId as string);
            res.status(200).json(userToDelete);
        } catch (err) {
            console.error('Error en el controlador deleteUser', err)
        }
    }
}

export default userControllers
