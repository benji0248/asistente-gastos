import { Router } from "express";
import { handleLogout } from "../controllers/logoutController";

const logoutRoute = Router();

logoutRoute.get('/', handleLogout);

export default logoutRoute;