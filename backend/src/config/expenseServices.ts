import { db } from "../database/database";
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

    static getOneExpense = async (expenseId: string) => {
        try {
            const [result] = await db.query(`SELECT * FROM expenses WHERE id = ?`, [expenseId])
            return result as Expenses[]       
        } catch(err) {
            console.error('Error en el servicio getOneExpense', err)
        }
    }

    static createOneExpense = async (userId: string, dataExpense: newExpenses) => {
        console.log(dataExpense.is_paid)
        if (dataExpense.is_paid === true) {
            dataExpense.payment_date = new Date();
        }
        try {
            await db.query(`
                INSERT INTO expenses (title, amount, created_at, payment_date, is_paid, user_id, category_id, account_id)
                VALUES(?,?, now(),?,?,?,?,?)`, [dataExpense.title, dataExpense.amount, dataExpense.payment_date, dataExpense.is_paid, userId, dataExpense.category_id, dataExpense.account_id])
            console.log('Se creo el gastos correctamente')
        } catch (err) {
            console.error('Error en el servicio createOneExpense', err)
        }
    }

    static updateOneExpense = async (expenseId: string, updateData: Expenses) => {
        console.log(updateData)
        try {
            await db.query(`
                    UPDATE expenses
                    SET title = ?, amount = ?, is_paid = ? WHERE id = ?`, [updateData.title, updateData.amount, updateData.is_paid, expenseId]);
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
}
export default expenseServices