import  expenseServices  from "../config/expenseServices";
import householdRecurringExpenseServices from "../config/householdRecurringExpenseServices";
import { Request, Response } from "express";
import { Expenses, newExpenses } from "../config/types";

class expenseControllers{
    private static visibleUserIds = (req: Request) => req.visibleUserIds ?? (req.userId ? [req.userId] : [])

    private static accountContext = (req: Request) => ({
        visibleUserIds: this.visibleUserIds(req),
        householdId: req.householdId,
        sharedCash: req.sharedCash ?? false,
    })

    private static async ensureHouseholdRecurringExpenses(req: Request) {
        if (!req.householdId) return
        await householdRecurringExpenseServices.ensureCurrentMonthExpenses(
            req.householdId,
            this.visibleUserIds(req)
        )
    }

    static availableMonthInExpenses = async (req: Request, res: Response) => {
        try {
            await this.ensureHouseholdRecurringExpenses(req)
            const result = await expenseServices.getAvailableMonths(this.visibleUserIds(req))
            res.status(200).json(result);
        } catch (err) {
            console.error('Error en el metodo availableMonthInExpenses', err)
            res.status(500).json({ message: 'Error al obtener meses disponibles' })
        }
    }

    static getExpensesByDate = async (req: Request, res: Response) => {
        const month = Number(req.params.month)
        const year = Number(req.params.year)
        try {
            await this.ensureHouseholdRecurringExpenses(req)
            const expenses = await expenseServices.getExpensesByMonth(this.visibleUserIds(req), month, year)
            res.status(200).json(expenses ?? [])
        } catch (err) {
            console.log('Error en el controlador getExpensesByDate', err)
            res.status(500).json({ message: 'Error al obtener gastos' })
        }
    }

    static getExpenses = async (req: Request, res: Response) => {
        try {
            await this.ensureHouseholdRecurringExpenses(req)
            const expenses = await expenseServices.getAllExpenses(this.visibleUserIds(req));
            res.status(200).json(expenses ?? [])
        } catch (err) {
            console.error('Error en el controlador getExpenses', err)
            res.status(500).json({ message: 'Error al obtener gastos' })
        }
    }

    static getExpense = async (req: Request, res: Response) => {
        const expenseId = req.params.expenseId
        try {
            const expense = await expenseServices.getOneExpense(expenseId, this.visibleUserIds(req))
            if (!expense) return res.sendStatus(404)
            res.status(200).json(expense)
        } catch (err) {
            console.error('Error en el controlador getExpense', err)
            res.status(500).json({ message: 'Error al obtener el gasto' })
        }
    }

    static addExpense = async (req: Request, res: Response) => {
        try {
            const userId = req.params.userId
            const newExpenseData: newExpenses = req.body
            const newExpense = await expenseServices.createOneExpense(
                userId,
                newExpenseData,
                this.visibleUserIds(req),
                this.accountContext(req)
            );
            res.status(201).json(newExpense)
        } catch (err) {
            console.error('Error en el controlador addExpense', err)
            res.status(500).json({ message: 'Error al crear el gasto' })
        }
    }

    static updateExpense = async (req: Request, res: Response) => {
        const  expenseId  = req.params.expenseId
        const dataToUpdate: Expenses = req.body;
        try {
            const updatedData = await expenseServices.updateOneExpense(
                expenseId,
                dataToUpdate,
                this.visibleUserIds(req),
                this.accountContext(req)
            )
            res.status(201).json(updatedData)
        } catch (err) {
            console.error('Error en el controlador updateExpense.')
            res.status(500).json({ message: 'Error al actualizar el gasto' })
        }
    }

    static deleteExpense = async (req: Request, res: Response) =>{
        const expenseId = req.params.expenseId
        try {
            await expenseServices.deleteOneExpense(expenseId, this.visibleUserIds(req))
            res.sendStatus(200)
        }catch(err){
            console.error('Error en el controlador deleteExpense', err)
            res.status(500).json({ message: 'Error al eliminar el gasto' })
        }
    }

    static completePaidExpense = async (req: Request, res: Response) => {
        const expenseId = req.params.expenseId
        const rawAccountId = req.body?.account_id
        const accountId =
            rawAccountId != null && rawAccountId !== ''
                ? String(rawAccountId)
                : undefined

        if (!accountId) {
            return res.status(400).json({ message: 'Seleccioná un método de pago' })
        }

        try {
            await expenseServices.completePaid(
                expenseId,
                this.visibleUserIds(req),
                this.accountContext(req),
                accountId
            )
            res.sendStatus(200)
        } catch (err) {
            console.error('Error en el controlador completePaidExpense', err)
            if (err instanceof Error) {
                if (err.message === 'ACCOUNT_REQUIRED') {
                    return res.status(400).json({ message: 'Seleccioná un método de pago' })
                }
                if (err.message === 'La cuenta no pertenece al hogar') {
                    return res.status(400).json({ message: err.message })
                }
                if (err.message === 'INVALID_PAYMENT_AMOUNT') {
                    return res.status(400).json({ message: 'El monto supera lo que falta pagar' })
                }
            }
            res.status(500).json({ message: 'Error al marcar el gasto como pagado' })
        }
    }
}

export default expenseControllers