import { Request, Response } from 'express'
import householdServices from '../config/householdServices'
import householdRecurringExpenseServices from '../config/householdRecurringExpenseServices'

function isMissingHouseholdTableError(err: unknown) {
  return typeof err === 'object' && err !== null && 'code' in err && err.code === 'PGRST205'
}

class householdControllers {
  static getHousehold = async (req: Request, res: Response) => {
    try {
      if (!req.userId) return res.sendStatus(401)
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
      if (!req.userId) return res.sendStatus(401)
      const invites = await householdServices.getPendingInvites(req.userId, req.email)
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
      if (!req.userId) return res.sendStatus(401)
      const household = await householdServices.acceptInvite(req.userId, req.email, req.params.inviteId)
      res.status(200).json(household)
    } catch (err) {
      console.error('Error en el controlador acceptInvite', err)
      res.status(400).json({ message: err instanceof Error ? err.message : 'Error al aceptar invitación' })
    }
  }

  static rejectInvite = async (req: Request, res: Response) => {
    try {
      if (!req.userId) return res.sendStatus(401)
      await householdServices.rejectInvite(req.userId, req.email, req.params.inviteId)
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

  static getRecurringExpenses = async (req: Request, res: Response) => {
    try {
      if (!req.userId) return res.sendStatus(401)
      if (!req.householdId) {
        return res.status(400).json({ message: 'Primero tenés que crear un hogar' })
      }
      const items = await householdRecurringExpenseServices.list(req.householdId)
      res.status(200).json(items)
    } catch (err) {
      console.error('Error en el controlador getRecurringExpenses', err)
      res.status(500).json({ message: 'Error al obtener gastos del hogar' })
    }
  }

  static createRecurringExpense = async (req: Request, res: Response) => {
    try {
      if (!req.userId) return res.sendStatus(401)
      if (!req.householdId) {
        return res.status(400).json({ message: 'Primero tenés que crear un hogar' })
      }
      const item = await householdRecurringExpenseServices.create(
        req.userId,
        req.householdId,
        req.visibleUserIds ?? [req.userId],
        req.body
      )
      res.status(201).json(item)
    } catch (err) {
      console.error('Error en el controlador createRecurringExpense', err)
      res.status(400).json({ message: err instanceof Error ? err.message : 'Error al crear gasto del hogar' })
    }
  }

  static updateRecurringExpense = async (req: Request, res: Response) => {
    try {
      if (!req.userId) return res.sendStatus(401)
      if (!req.householdId) {
        return res.status(400).json({ message: 'Primero tenés que crear un hogar' })
      }
      const item = await householdRecurringExpenseServices.update(
        req.householdId,
        req.params.recurringId,
        req.visibleUserIds ?? [req.userId],
        req.body
      )
      res.status(200).json(item)
    } catch (err) {
      console.error('Error en el controlador updateRecurringExpense', err)
      res.status(400).json({ message: err instanceof Error ? err.message : 'Error al actualizar gasto del hogar' })
    }
  }

  static deleteRecurringExpense = async (req: Request, res: Response) => {
    try {
      if (!req.userId) return res.sendStatus(401)
      if (!req.householdId) {
        return res.status(400).json({ message: 'Primero tenés que crear un hogar' })
      }
      await householdRecurringExpenseServices.delete(req.householdId, req.params.recurringId)
      res.sendStatus(204)
    } catch (err) {
      console.error('Error en el controlador deleteRecurringExpense', err)
      res.status(400).json({ message: err instanceof Error ? err.message : 'Error al eliminar gasto del hogar' })
    }
  }

  static getRentAdjustment = async (req: Request, res: Response) => {
    try {
      if (!req.userId) return res.sendStatus(401)
      if (!req.householdId) {
        return res.status(400).json({ message: 'Primero tenés que crear un hogar' })
      }
      const month = req.query.month ? Number(req.query.month) : undefined
      const year = req.query.year ? Number(req.query.year) : undefined
      const context = await householdRecurringExpenseServices.getRentAdjustmentContext(
        req.householdId,
        req.params.recurringId,
        month,
        year
      )
      res.status(200).json(context)
    } catch (err) {
      console.error('Error en el controlador getRentAdjustment', err)
      res.status(400).json({ message: err instanceof Error ? err.message : 'Error al obtener datos del alquiler' })
    }
  }

  static applyRentAdjustment = async (req: Request, res: Response) => {
    try {
      if (!req.userId) return res.sendStatus(401)
      if (!req.householdId) {
        return res.status(400).json({ message: 'Primero tenés que crear un hogar' })
      }
      const ipcRates = Array.isArray(req.body.ipc_rates)
        ? req.body.ipc_rates.map((rate: unknown) => Number(rate))
        : []
      const month = req.body.month ? Number(req.body.month) : undefined
      const year = req.body.year ? Number(req.body.year) : undefined
      const result = await householdRecurringExpenseServices.applyRentAdjustment(
        req.userId,
        req.householdId,
        req.params.recurringId,
        req.visibleUserIds ?? [req.userId],
        ipcRates,
        month,
        year
      )
      res.status(200).json(result)
    } catch (err) {
      console.error('Error en el controlador applyRentAdjustment', err)
      res.status(400).json({ message: err instanceof Error ? err.message : 'Error al aplicar el ajuste de alquiler' })
    }
  }

  static setSharedCash = async (req: Request, res: Response) => {
    try {
      if (!req.userId) return res.sendStatus(401)
      const enabled = Boolean(req.body.enabled)
      const household = await householdServices.setSharedCash(req.userId, enabled)
      res.status(200).json(household)
    } catch (err) {
      console.error('Error en el controlador setSharedCash', err)
      res.status(400).json({ message: err instanceof Error ? err.message : 'Error al cambiar efectivo compartido' })
    }
  }
}

export default householdControllers
