import { Request, Response } from 'express'
import householdServices from '../config/householdServices'

function isMissingHouseholdTableError(err: unknown) {
  return typeof err === 'object' && err !== null && 'code' in err && err.code === 'PGRST205'
}

class householdControllers {
  static getHousehold = async (req: Request, res: Response) => {
    try {
      if (!req.userId) return res.sendStatus(401)
      if (!req.householdId) {
        return res.status(200).json({
          household: null,
          members: req.householdMembers ?? [],
          visibleUserIds: req.visibleUserIds ?? [req.userId],
        })
      }
      const household = await householdServices.getCurrentHousehold(req.userId)
      res.status(200).json(household ?? {
        household: null,
        members: [],
        visibleUserIds: [req.userId],
      })
    } catch (err) {
      if (isMissingHouseholdTableError(err)) {
        return res.status(200).json({
          household: null,
          members: [],
          visibleUserIds: req.userId ? [req.userId] : [],
        })
      }
      console.error('Error en el controlador getHousehold', err)
      res.status(500).json({ message: 'Error al obtener el hogar' })
    }
  }

  static createHousehold = async (req: Request, res: Response) => {
    try {
      if (!req.userId) return res.sendStatus(401)
      const name = typeof req.body.name === 'string' && req.body.name.trim()
        ? req.body.name.trim()
        : 'Mi familia'
      const household = await householdServices.createHousehold(req.userId, name)
      res.status(201).json(household)
    } catch (err) {
      console.error('Error en el controlador createHousehold', err)
      res.status(500).json({ message: 'Error al crear el hogar' })
    }
  }

  static inviteMember = async (req: Request, res: Response) => {
    try {
      if (!req.userId) return res.sendStatus(401)
      const identifier = String(req.body.identifier ?? '').trim()
      if (!identifier) {
        return res.status(400).json({ message: 'Indicá un email o username' })
      }
      const invite = await householdServices.inviteMember(req.userId, identifier)
      res.status(201).json(invite)
    } catch (err) {
      console.error('Error en el controlador inviteMember', err)
      res.status(400).json({ message: err instanceof Error ? err.message : 'Error al invitar' })
    }
  }

  static getPendingInvites = async (req: Request, res: Response) => {
    try {
      if (!req.supabaseUser) return res.sendStatus(401)
      const invites = await householdServices.getPendingInvites(req.supabaseUser)
      res.status(200).json(invites)
    } catch (err) {
      if (isMissingHouseholdTableError(err)) {
        return res.status(200).json([])
      }
      console.error('Error en el controlador getPendingInvites', err)
      res.status(500).json({ message: 'Error al obtener invitaciones' })
    }
  }

  static acceptInvite = async (req: Request, res: Response) => {
    try {
      if (!req.supabaseUser) return res.sendStatus(401)
      const household = await householdServices.acceptInvite(req.supabaseUser, req.params.inviteId)
      res.status(200).json(household)
    } catch (err) {
      console.error('Error en el controlador acceptInvite', err)
      res.status(400).json({ message: err instanceof Error ? err.message : 'Error al aceptar invitación' })
    }
  }

  static rejectInvite = async (req: Request, res: Response) => {
    try {
      if (!req.supabaseUser) return res.sendStatus(401)
      await householdServices.rejectInvite(req.supabaseUser, req.params.inviteId)
      res.sendStatus(204)
    } catch (err) {
      console.error('Error en el controlador rejectInvite', err)
      res.status(400).json({ message: err instanceof Error ? err.message : 'Error al rechazar invitación' })
    }
  }

  static leaveHousehold = async (req: Request, res: Response) => {
    try {
      if (!req.userId) return res.sendStatus(401)
      await householdServices.leaveHousehold(req.userId)
      res.sendStatus(204)
    } catch (err) {
      console.error('Error en el controlador leaveHousehold', err)
      res.status(400).json({ message: err instanceof Error ? err.message : 'Error al salir del hogar' })
    }
  }

  static removeMember = async (req: Request, res: Response) => {
    try {
      if (!req.userId) return res.sendStatus(401)
      await householdServices.leaveHousehold(req.userId, req.params.userId)
      res.sendStatus(204)
    } catch (err) {
      console.error('Error en el controlador removeMember', err)
      res.status(400).json({ message: err instanceof Error ? err.message : 'Error al desvincular miembro' })
    }
  }
}

export default householdControllers
