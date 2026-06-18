import { NextFunction, Request, Response } from 'express'

export const verifyOwnership = (req: Request, res: Response, next: NextFunction) => {
  const { userId } = req.params
  if (userId && req.userId && userId !== req.userId) {
    return res.sendStatus(403)
  }
  next()
}
