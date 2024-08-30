import jwt, { JwtPayload } from 'jsonwebtoken'
import dotenv from 'dotenv'
import { NextFunction, Request, Response } from 'express';

dotenv.config();

interface CustomRequest extends Request {
    user?: string | object;
}

export const verifyJWT = (req: CustomRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const accessSecret = process.env.ACCESS_TOKEN_SECRET;
    if (!authHeader || !accessSecret) return res.sendStatus(401);
    console.log('Hasta aca', authHeader);
    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, accessSecret!) as JwtPayload;
        req.user = decoded.username;
        next();
    } catch (err) {
        console.error('No se pudo verificar el token', err)
    }
}