import { Request, Response } from "express";
import { getAllUsers, createOneUser, deleteOneUser, getOneById, updateOneUser } from "../config/userServices";
import { newUsers, Users } from "../config/types";

class userControllers {

static getUsers = async (res: Response) => {
    try {
        const users: Users[] | undefined = await getAllUsers()
        res.status(200).json(users);
    } catch (err) {
        console.error('Hubo un error al usar la funcion getAllUsers', err)
    }
}

static addUser = async (req: Request, res: Response) => {
    try {
        const newUser: newUsers = req.body
        const user = await createOneUser(newUser)
        res.status(201).json(user);
    } catch (err) {
        console.error('', err)
    }
}

static updateUser = async (req: Request, res: Response) => {
    const {id} = req.params
    try {
        const updatedUser = await updateOneUser(id, req.body)
        res.status(200).json(updatedUser);
    } catch (err) {
        console.error('Hubo un error al modificar uno de los valores del usuario', err)
    }
}

static getOneUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
    const user = await getOneById(id);
        res.status(200).json(user);
    } catch (err) {
        console.error('Hubo un error al obtener el usuario especifico')
    }
}

static deleteUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const userToDelete = await deleteOneUser(id);
        res.status(200).json(userToDelete);
    } catch (err) {
        console.error('Ocurrio un error en el metodo deleteOneUser', err)
    }
  }
}

export default userControllers