import { Router } from "express";
import userControllers from "../controllers/userControllers";

const userRoutes = Router();

userRoutes.get('/', userControllers.getUsers);
userRoutes.get('/:id', userControllers.getOneUser);
userRoutes.post('/', userControllers.addUser);
userRoutes.put('/:id', userControllers.updateUser);
userRoutes.delete('/:id', userControllers.deleteUser);

export default userRoutes;