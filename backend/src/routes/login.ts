import { Router } from "express";
import { handleLogin } from "../controllers/authController";

const loginRoute = Router();

loginRoute.post('/', handleLogin)

export default loginRoute