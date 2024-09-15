import { Router } from "express";
import userControllers from "../controllers/userControllers";
import { ROLES_LIST } from "../config/role_list";
import { verifyRoles } from "../controllers/verifyRoles";

const userRoutes = Router();

userRoutes.get('/', verifyRoles(ROLES_LIST.admin, ROLES_LIST.user), userControllers.getUsers);
userRoutes.get('/:userId', verifyRoles(ROLES_LIST.admin), userControllers.getOneUser);
userRoutes.post('/', userControllers.addUser);
userRoutes.put('/:userId', verifyRoles(ROLES_LIST.admin, ROLES_LIST.editor, ROLES_LIST.user), userControllers.updateUser);
userRoutes.delete('/:userId', verifyRoles(ROLES_LIST.admin), userControllers.deleteUser);

export default userRoutes;