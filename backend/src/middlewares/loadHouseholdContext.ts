import { NextFunction, Request, Response } from 'express'
import householdServices from '../config/householdServices'

export const loadHouseholdContext = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.userId) {
    return res.sendStatus(401)
  }

  try {
    const context = await householdServices.getHouseholdContext(req.userId)
    req.householdId = context.householdId
    req.sharedCash = context.sharedCash ?? false
    req.visibleUserIds = context.visibleUserIds
    req.householdMembers = context.members
  } catch {
    req.visibleUserIds = [req.userId]
    req.householdMembers = []
  }

  next()
}
