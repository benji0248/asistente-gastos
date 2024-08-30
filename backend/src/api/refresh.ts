import { Router } from "express";
import { handleRefreshToken } from "../controllers/refreshTokenController";

const refresh = Router();

refresh.get('/', handleRefreshToken)

export default refresh