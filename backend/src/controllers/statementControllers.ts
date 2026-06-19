import { Request, Response } from 'express'
import statementServices from '../config/statementServices'

class statementControllers {
  private static visibleUserIds = (req: Request) =>
    req.visibleUserIds ?? (req.userId ? [req.userId] : [])

  private static accountContext = (req: Request) => ({
    visibleUserIds: this.visibleUserIds(req),
    householdId: req.householdId,
    sharedCash: req.sharedCash ?? false,
  })

  static getStatements = async (req: Request, res: Response) => {
    try {
      const rows = await statementServices.getAllForUsers(this.visibleUserIds(req))
      res.status(200).json(rows)
    } catch (err) {
      console.error('Error en getStatements', err)
      res.status(500).json({ message: 'Error al obtener resúmenes de tarjeta' })
    }
  }

  static upsertStatement = async (req: Request, res: Response) => {
    try {
      if (!req.userId) return res.sendStatus(401)

      const { statement_data: statementData, file_name: fileName } = req.body
      if (!statementData || typeof statementData !== 'object') {
        return res.status(400).json({ message: 'statement_data es requerido' })
      }

      const row = await statementServices.upsertForUser(
        req.userId,
        statementData,
        typeof fileName === 'string' ? fileName : undefined
      )
      res.status(200).json(row)
    } catch (err) {
      if (err instanceof Error && err.message === 'CATEGORY_NOT_FOUND') {
        return res.status(400).json({
          message: 'No encontramos la categoría Tarjeta de crédito en tu cuenta.',
        })
      }
      console.error('Error en upsertStatement', err)
      res.status(500).json({ message: 'Error al guardar el resumen' })
    }
  }

  static registerPayment = async (req: Request, res: Response) => {
    try {
      const ownerUserId = req.params.ownerUserId as string
      const { amount, account_id: accountId } = req.body

      if (!ownerUserId || !accountId) {
        return res.status(400).json({ message: 'Datos incompletos' })
      }

      const paymentAmount = Number(amount)
      if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
        return res.status(400).json({ message: 'Monto inválido' })
      }

      const expense = await statementServices.registerPartialPayment(
        ownerUserId,
        paymentAmount,
        String(accountId),
        this.visibleUserIds(req),
        this.accountContext(req)
      )

      res.status(200).json(expense)
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === 'FORBIDDEN') return res.sendStatus(403)
        if (err.message === 'STATEMENT_EXPENSE_NOT_FOUND') {
          return res.status(404).json({ message: 'No hay gasto vinculado al resumen' })
        }
        if (err.message === 'INVALID_PAYMENT_AMOUNT') {
          return res.status(400).json({ message: 'El monto supera lo que falta pagar' })
        }
      }
      console.error('Error en registerPayment', err)
      res.status(500).json({ message: 'Error al registrar el pago' })
    }
  }

  static deleteStatement = async (req: Request, res: Response) => {
    try {
      const ownerUserId = req.params.ownerUserId as string
      if (!ownerUserId) return res.sendStatus(400)

      if (req.userId !== ownerUserId) {
        return res.sendStatus(403)
      }

      await statementServices.deleteForUser(ownerUserId, this.visibleUserIds(req))
      res.sendStatus(204)
    } catch (err) {
      if (err instanceof Error && err.message === 'FORBIDDEN') {
        return res.sendStatus(403)
      }
      console.error('Error en deleteStatement', err)
      res.status(500).json({ message: 'Error al eliminar el resumen' })
    }
  }
}

export default statementControllers
