import  expenseServices  from "../config/expenseServices";
import { Request, Response } from "express";
import { Expenses, newExpenses } from "../config/types";

class expenseControllers{

    static availableMonthInExpenses = async (req: Request, res: Response) => {
        try {
            const result = await expenseServices.getAvailableMonths()
            res.status(200).json(result);
        } catch (err) {
            console.error('Error en el metodo availableMonthInExpenses', err)
        }
    }

    static getExpensesByDate = async (req: Request, res: Response) => {
        const month = req.params.month
        const year = req.params.year
        console.log(month)
        console.log(year)
        try {
            const expenses = await expenseServices.getExpensesByMonth(month, year)
            if (expenses)
            res.status(200).json(expenses)
        } catch (err) {
            console.log('Error en el controlador getExpensesByDate', err)
        }
    }

    static getExpenses = async (req: Request, res: Response) => {
        try {
            const userId = req.params.userId
            const expenses = await expenseServices.getAllExpenses(userId);
            if(expenses)
            res.status(200).json(expenses)
        } catch (err) {
            console.error('Error en el controlador getExpenses', err)
        }
    }

    static getExpense = async (req: Request, res: Response) => {
        const expenseId = req.params.expenseId
        try {
            const expense = await expenseServices.getOneExpense(expenseId)
            if(expense)
            res.status(200).json(expense)
        } catch (err) {
            console.error('Error en el controlador getExpense', err)
        }
    }

    static addExpense = async (req: Request, res: Response) => {
        try {
            const userId = req.params.userId
            const newExpenseData: newExpenses = req.body
            const newExpense = expenseServices.createOneExpense(userId,newExpenseData);
            res.status(201).json(newExpense)
        } catch (err) {
            console.error('Error en el controlador addExpense', err)
        }
    }

    static updateExpense = async (req: Request, res: Response) => {
        const  expenseId  = req.params.expenseId
        const dataToUpdate: Expenses = req.body;
        try {
            const updatedData = expenseServices.updateOneExpense(expenseId, dataToUpdate)
            res.status(201).json(updatedData)
        } catch (err) {
            console.error('Error en el controlador updateExpense.')
        }
    }

    static deleteExpense = async (req: Request, res: Response) =>{
        const expenseId = req.params.expenseId
        try {
            expenseServices.deleteOneExpense(expenseId)
            res.status(200)
        }catch(err){
            console.error('Error en el controlador deleteExpense', err)
        }
    }

    static completePaidExpense = async (req: Request, res: Response) => {
        const expenseId = req.params.expenseId
        try {
            expenseServices.completePaid(expenseId)
            res.status(200)
        } catch (err) {
            console.error('Error en el controlador completePaidExpense', err)
        }
    }
}

export default expenseControllers