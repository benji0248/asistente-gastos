import  expenseServices  from "../config/expenseServices";
import { Request, Response } from "express";
import { Expenses, newExpenses } from "../config/types";

class expenseControllers{

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
            const categoryId = req.params.categoryId
            const newExpenseData: newExpenses = req.body
            const newExpense = expenseServices.createOneExpense(userId,categoryId,newExpenseData);
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
}

export default expenseControllers