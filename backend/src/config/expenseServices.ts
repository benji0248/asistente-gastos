import { db } from "../database/database";
import { newExpenses, Expenses } from "./types";

export const getAllExpenses = async () => {
    try {
        const [result] = await db.query("SELECT * FROM expenses")
        return result as Expenses[]
    } catch (err) {
        console.error('No se pudo obtener la tabla de Gastos', err)
    }
}

export const getOneExpense = async (expenseId: string) => {
    try {
        const [row] = await db.query(`SELECT * FROM expenses WHERE id = ?`, [expenseId])
        return row as Expenses[]       
    } catch(err) {
        console.error('No se pudo obtener el gasto declarado', err)
    }
}

export const createOneExpense = async (dataExpense: newExpenses) => {
    try {
        await db.query(`
            INSERT INTO expenses (title, amount, created_at, is_paid)
            VALUES(?,?, now(),?)`, [dataExpense.title, dataExpense.amount, dataExpense.is_paid])
    } catch (err) {
        console.error('Hubo un error en el metodo de crear el gasto', err)
    }
}

export const updateOneExpense = async (expenseId: string, updateData: Expenses) => {
    console.log(updateData)
    try {
        await db.query(`
                UPDATE expenses
                SET title = ?, amount = ?, is_paid = ? WHERE id = ?`, [updateData.title, updateData.amount, updateData.is_paid, expenseId]);
    } catch(err) {
        console.error('Hubo un error al actualizar el gasto dentro del servicio', err)
    }
}