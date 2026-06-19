import { Request, Response } from 'express'
import accountsServices from '../config/accountsServices'

class accountsControllers {
    private static visibleUserIds = (req: Request) => req.visibleUserIds ?? (req.userId ? [req.userId] : [])

    private static accountContext = (req: Request) => ({
        visibleUserIds: this.visibleUserIds(req),
        householdId: req.householdId,
        sharedCash: req.sharedCash ?? false,
    })

    static getAccounts = async (req: Request, res: Response) => {
        try {
            const accounts = await accountsServices.getAllAccounts(
                this.visibleUserIds(req),
                this.accountContext(req)
            )
            res.status(200).json(accounts ?? [])
        } catch (err) {
            console.error('Error en el controlador getAccounts', err)
            res.status(500).json({ message: 'Error al obtener las cuentas' })
        }
    }

    static getAccount = async (req: Request, res: Response) => {
        try {
            const accountId = req.params.accountId as string
            const account = await accountsServices.getOneAccount(accountId, this.accountContext(req))
            if (!account) return res.sendStatus(404)
            res.status(200).json(account)
        } catch (err) {
            console.error('Error en el controlador getAccount', err)
            res.status(500).json({ message: 'Error al obtener la cuenta' })
        }
    }

    static createAccount = async (req: Request, res: Response) => {
        try {
            const ownerUserId = req.body.owner_user_id ?? req.body.user_id ?? req.userId
            if (!ownerUserId || !this.visibleUserIds(req).includes(ownerUserId)) {
                return res.sendStatus(403)
            }
            const account = await accountsServices.addAccount(ownerUserId, req.body)
            res.status(201).json(account)
        } catch (err) {
            console.error('Error en el controlador createAccount', err)
            res.status(500).json({ message: 'Error al crear la cuenta' })
        }
    }

    static updateOneAccount = async (req: Request, res: Response) => {
        try {
            const accountId = req.params.accountId as string
            await accountsServices.updateAccount(accountId, req.body, this.accountContext(req))
            res.sendStatus(200)
        } catch (err) {
            console.error('Error en el controlador updateOneAccount', err)
            res.status(500).json({ message: 'Error al actualizar la cuenta' })
        }
    }

    static updateBalanceAccount = async (req: Request, res: Response) => {
        try {
            const accountId = req.params.accountId as string
            const expenseAmount = req.body.balance
            await accountsServices.updateBalance(accountId, expenseAmount, this.accountContext(req))
            res.sendStatus(200)
        } catch (err) {
            console.error('Error en el controlador updateBalanceAccount', err)
            res.status(500).json({ message: 'Error al actualizar el balance' })
        }
    }

    static addMoneyFounds = async (req: Request, res: Response) => {
        try {
            const accountId = req.params.accountId as string
            const moneyToAdd = req.body.amount
            await accountsServices.addFounds(accountId, moneyToAdd, this.accountContext(req))
            res.sendStatus(200)
        } catch (err) {
            console.error('Error en el controlador addMoneyFounds', err)
            res.status(500).json({ message: 'Error al agregar fondos' })
        }
    }

    static transferMoneyFounds = async (req: Request, res: Response) => {
        try {
            const accountId = req.params.accountId as string
            const accountToTransfer = req.body.accountToTransfer
            const moneyToTransfer = req.body.amount
            await accountsServices.transferFounds(
                accountId,
                accountToTransfer,
                moneyToTransfer,
                this.accountContext(req)
            )
            res.sendStatus(200)
        } catch (err) {
            console.error('Error en el controlador transferMoneyFounds', err)
            res.status(500).json({ message: 'Error al transferir fondos' })
        }
    }

    static editMoneyFounds = async (req: Request, res: Response) => {
        try {
            const accountId = req.params.accountId as string
            const newBalance = req.body.amount
            await accountsServices.editFounds(accountId, newBalance, this.accountContext(req))
            res.sendStatus(200)
        } catch (err) {
            console.error('Error en el controlador editMoneyFounds', err)
            res.status(500).json({ message: 'Error al editar fondos' })
        }
    }

    static deleteOneAccount = async (req: Request, res: Response) => {
        try {
            const accountId = req.params.accountId as string
            await accountsServices.deleteAccount(accountId, this.accountContext(req))
            res.sendStatus(200)
        } catch (err) {
            console.error('Error en el controlador deleteOneAccount', err)
            res.status(500).json({ message: 'Error al eliminar la cuenta' })
        }
    }
}

export default accountsControllers
