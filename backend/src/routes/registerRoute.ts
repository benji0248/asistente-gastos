import { Router } from "express";
import userControllers from "../controllers/userControllers";

const registerRoute = Router();

registerRoute.get('/', userControllers.addUser)

export default registerRoute;