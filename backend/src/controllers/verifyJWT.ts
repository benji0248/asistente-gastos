import jwt, { JwtPayload } from 'jsonwebtoken'
import dotenv from 'dotenv'
import { NextFunction, Request, Response } from 'express';

dotenv.config();

interface CustomRequest extends Request {
    user?: string | object;
    role?: number
}

export const verifyJWT = (req: CustomRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
    if(Array.isArray(authHeader)) return res.sendStatus(401)
    if (!authHeader?.startsWith('Bearer ') || !accessTokenSecret) return res.sendStatus(401);
    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, accessTokenSecret!) as JwtPayload;
        req.user = decoded.UserInfo.username;
        req.role = decoded.UserInfo.role
        next();
    } catch (err) {
        console.error('No se pudo verificar el token', err)
    }
}