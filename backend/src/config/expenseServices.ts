import { RowDataPacket } from "mysql2";
import { db } from "../database/database";
import accountsServices from "./accountsServices";
import { newExpenses, Expenses } from "./types";

class expenseServices{
    static getAllExpenses = async (userId: string) => {
        try {
            const [result] = await db.query("SELECT * FROM expenses WHERE user_id = ?", [userId])
            return result as Expenses[]
        } catch (err) {
            console.error('Error en el servicio getAllExpenses', err)
        }
    }

    static getOneExpense = async (expenseId: string): Promise<Expenses | undefined> => {
        try {
            const [result] = await db.query<RowDataPacket[]>(`SELECT * FROM expenses WHERE id = ?`, [expenseId])
            return result[0] as Expenses       
        } catch(err) {
            console.error('Error en el servicio getOneExpense', err)
        }
    }

    static getExpensesByMonth = async (month:any, year:any) => {
        try {
            const [expenses] = await db.query<RowDataPacket[]>(
                `SELECT * FROM expenses WHERE MONTH(created_at) = ? AND YEAR(created_at) = ?`,
                [month, year]
            )
            return expenses as Expenses[]
        } catch (err) {
            console.log('Error en el servicio getExpensesByMonth', err)
        }
    }

    static createOneExpense = async (userId: string, dataExpense: newExpenses) => {

        if (dataExpense.is_paid === true) {
            dataExpense.payment_date = new Date();
        }
        try {
            await db.query(`
                INSERT INTO expenses (title, amount, created_at, payment_date, is_paid, user_id, category_id, account_id)
                VALUES(?,?, now(),?,?,?,?,?)`, [dataExpense.title, dataExpense.amount, dataExpense.payment_date, dataExpense.is_paid, userId, dataExpense.category_id, dataExpense.account_id])
            if (dataExpense.is_paid === true) {
                await accountsServices.updateBalance(dataExpense.account_id, dataExpense.amount)
            }
        } catch (err) {
            console.error('Error en el servicio createOneExpense', err)
        }
    }

    static updateOneExpense = async (expenseId: string, updateData: Expenses) => {
        console.log(updateData)
        try {
            await db.query(`
                    UPDATE expenses
                    SET title = ?, amount = ?, is_paid = ?, category_id = ?, account_id = ? WHERE id = ?`,
                    [updateData.title, updateData.amount, updateData.is_paid, updateData.category_id, updateData.account_id, expenseId]);
        } catch(err) {
            console.error('Error en el servicio updateOneExpense', err)
        }
    }

    static deleteOneExpense = async (expenseId: string) => {
        try{
            await db.query(`DELETE FROM expenses WHERE id = ?`, [expenseId])
        }catch(err){
            console.error('Error en el servicio deleteOneExpense')
        }
    }

    static completePaid = async (expenseId: string) => {
        const expense = await this.getOneExpense(expenseId)
        try {
            if (expense) {
                await db.query(`UPDATE expenses SET is_paid = ?, payment_date = now() WHERE id = ?`, [1, expenseId])
                await accountsServices.updateBalance(expense.account_id, expense.amount)
            }
        } catch (err) {
            console.error('Error en el servicio de completePaid', err)
        }
    }

    static getAvailableMonths = async () => {
        try {
            const [result] = await db.query(
                `SELECT DISTINCT MONTH(created_at) AS month, YEAR(created_at) AS year FROM expenses WHERE created_at IS NOT NULL ORDER BY year DESC, month DESC`
            );
            console.log(result)
            return result as { month: number;  year: number }[]
        } catch (err) {
            console.log('Error en el servicio getAvailableMonths', err)
        }
    }
}
export default expenseServices