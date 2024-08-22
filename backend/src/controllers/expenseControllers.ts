import { expenseServices } from "../config/expenseServices";
import { Request, Response } from "express";
import { Expenses, newExpenses } from "../config/types";

class expenseControllers{

    static getExpenses = async (req: Request, res: Response) => {
        try {
            const {user_id} = req.params.userId
            const expenses = await expenseServices.getAllExpenses(user_id);
            if(expenses)
            res.status(200).json(expenses)
        } catch (err) {
            console.error('Error en el controlador de obtener todos los gastos', err)
        }
    }

    static getExpense = async (req: Request, res: Response) => {
        const { expenseId } = req.params.expenseId
        try {
            const expense = await expenseServices.getOneExpense(expenseId)
            if(expense)
            res.status(200).json(expense)
        } catch (err) {
            console.error('Error en el controlador para obtener un gasto', err)
        }
    }

    static addExpense = async (req: Request, res: Response) => {
        try {
            const {user_id} = req.params.userId
            const newExpenseData: newExpenses = req.body
            const newExpense = expenseServices.createOneExpense(user_id,newExpenseData);
            res.status(201).json(newExpense)
        } catch (err) {
            console.error('Error en el controlador para agregar un gasto', err)
        }
    }

    static updateExpense = async (req: Request, res: Response) => {
        const { expenseId } = req.params.expenseId
        const dataToUpdate: Expenses = req.body;
        try {
            const updatedData = expenseServices.updateOneExpense(expenseId, dataToUpdate)
            res.status(201).json(updatedData)
        } catch (err) {
            console.error('Error en el controlador para actualizar un gasto.')
        }
    }

    static deleteExpense = async (req: Request, res: Response) =>{
        const { expenseId } = req.params.expenseId
        try {
            expenseServices.deleteOneExpense(expenseId)
            res.status(200)
        }catch(err){
            console.error('Error en el controlador de borrar gasto', err)
        }
    }
}

export default expenseControllers