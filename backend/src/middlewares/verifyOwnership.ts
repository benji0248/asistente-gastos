import { NextFunction, Request, Response } from 'express'

export const verifyOwnership = (req: Request, res: Response, next: NextFunction) => {
  const { userId } = req.params
  const visibleUserIds = req.visibleUserIds ?? (req.userId ? [req.userId] : [])

  if (userId && !visibleUserIds.includes(userId)) {
    return res.sendStatus(403)
  }
  next()
}
