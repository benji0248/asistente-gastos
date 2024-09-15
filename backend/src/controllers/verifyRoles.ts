import { NextFunction, Request, Response } from "express"

declare module "express-serve-static-core" {
    interface Request {
        role?: number
    }
}

export const verifyRoles = (...allowedRoles: number[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req?.role) return res.sendStatus(401);
        const rolesArray = [...allowedRoles];
        if (req.role === undefined) return res.sendStatus(401);
        if(!allowedRoles.includes(req.role)) return res.sendStatus(401)
        next();
    }
}