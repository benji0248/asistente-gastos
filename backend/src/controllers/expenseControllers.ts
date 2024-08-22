import { createOneExpense, getAllExpenses, getOneExpense, updateOneExpense } from "../config/expenseServices";
import { Request, Response } from "express";
import { Expenses, newExpenses } from "../config/types";

export const getExpenses = async (req: Request, res: Response) => {
    try {
        const expenses = await getAllExpenses();
        if(expenses)
        res.status(200).json(expenses)
    } catch (err) {
        console.error('No se pudieron obtener los gastos', err)
    }
}

export const getExpense = async (req: Request, res: Response) => {
    const { id } = req.params
    try {
        const expense = await getOneExpense(id)
        if(expense)
        res.status(200).json(expense)
    } catch (err) {
        console.error('Hubo un error al obtener el gasto deseado', err)
    }
}

export const addExpense = async (req: Request, res: Response) => {
    try {
        const newExpenseData: newExpenses = req.body
        const newExpense = createOneExpense(newExpenseData);
        res.status(201).json(newExpense)
    } catch (err) {
        console.error('Hubo un error al crear el nuevo gasto', err)
    }
}

export const updateExpense = async (req: Request, res: Response) => {
        const { id } = req.params
        const dataToUpdate: Expenses = req.body;
    try {
        const updatedData = updateOneExpense(id, dataToUpdate)
        res.status(201).json(updatedData)
    } catch (err) {
        console.error('Hubo un error al actualizar los datos del gasto.')
    }
}