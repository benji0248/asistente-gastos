import { Router } from "express";
import userControllers from "../controllers/userControllers";

const userRoutes = Router();

userRoutes.get('/', userControllers.getUsers);
userRoutes.get('/:userId', userControllers.getOneUser);
userRoutes.post('/', userControllers.addUser);
userRoutes.put('/:userId', userControllers.updateUser);
userRoutes.delete('/:userId', userControllers.deleteUser);

export default userRoutes;