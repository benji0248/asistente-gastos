import { Router } from "express";
import userControllers from "../controllers/userControllers";

const registerRoute = Router();

registerRoute.post('/', userControllers.addUser)

export default registerRoute;