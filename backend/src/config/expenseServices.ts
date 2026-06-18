import { getSupabaseAdmin } from '../lib/supabase'
import accountsServices from './accountsServices'
import { newExpenses, Expenses } from './types'

function monthDateRange(month: number, year: number) {
    const start = new Date(year, month - 1, 1).toISOString()
    const end = new Date(year, month, 0, 23, 59, 59, 999).toISOString()
    return { start, end }
}

class expenseServices{
    private static normalizeUserIds = (userIds: string | string[]) => {
        return Array.isArray(userIds) ? userIds : [userIds]
    }

    static getAllExpenses = async (userIds: string | string[]) => {
        try {
            const { data, error } = await getSupabaseAdmin()
                .from('expenses')
                .select('*')
                .in('user_id', this.normalizeUserIds(userIds))
            if (error) throw error
            return data as Expenses[]
        } catch (err) {
            console.error('Error en el servicio getAllExpenses', err)
            throw err
        }
    }

    static getOneExpense = async (expenseId: string, visibleUserIds?: string[]): Promise<Expenses | undefined> => {
        try {
            let query = getSupabaseAdmin()
                .from('expenses')
                .select('*')
                .eq('id', expenseId)
            if (visibleUserIds?.length) {
                query = query.in('user_id', visibleUserIds)
            }
            const { data, error } = await query.maybeSingle()
            if (error) throw error
            return data as Expenses | undefined
        } catch(err) {
            console.error('Error en el servicio getOneExpense', err)
            throw err
        }
    }

    static getExpensesByMonth = async (userIds: string | string[], month: number, year: number) => {
        try {
            const { start, end } = monthDateRange(month, year)
            const { data, error } = await getSupabaseAdmin()
                .from('expenses')
                .select('*')
                .in('user_id', this.normalizeUserIds(userIds))
                .gte('created_at', start)
                .lte('created_at', end)
            if (error) throw error
            return data as Expenses[]
        } catch (err) {
            console.log('Error en el servicio getExpensesByMonth', err)
            throw err
        }
    }

    static createOneExpense = async (userId: string, dataExpense: newExpenses, visibleUserIds: string[]) => {
        if (dataExpense.is_paid === true) {
            dataExpense.payment_date = new Date()
        }
        try {
            const account = await accountsServices.getOneAccount(dataExpense.account_id, visibleUserIds)
            if (!account) throw new Error('La cuenta no pertenece al hogar')
            const { error } = await getSupabaseAdmin()
                .from('expenses')
                .insert({
                    title: dataExpense.title,
                    amount: dataExpense.amount,
                    payment_date: dataExpense.payment_date,
                    is_paid: dataExpense.is_paid,
                    user_id: userId,
                    category_id: dataExpense.category_id,
                    account_id: dataExpense.account_id,
                })
            if (error) throw error
            if (dataExpense.is_paid === true) {
                await accountsServices.updateBalance(dataExpense.account_id, dataExpense.amount, visibleUserIds)
            }
        } catch (err) {
            console.error('Error en el servicio createOneExpense', err)
            throw err
        }
    }

    static updateOneExpense = async (expenseId: string, updateData: Expenses, visibleUserIds: string[]) => {
        try {
            const expense = await this.getOneExpense(expenseId, visibleUserIds)
            if (!expense) throw new Error('El gasto no pertenece al hogar')
            const account = await accountsServices.getOneAccount(updateData.account_id, visibleUserIds)
            if (!account) throw new Error('La cuenta no pertenece al hogar')
            let query = getSupabaseAdmin()
                .from('expenses')
                .update({
                    title: updateData.title,
                    amount: updateData.amount,
                    is_paid: updateData.is_paid,
                    category_id: updateData.category_id,
                    account_id: updateData.account_id,
                })
                .eq('id', expenseId)
                .in('user_id', visibleUserIds)
            const { error } = await query
            if (error) throw error
        } catch(err) {
            console.error('Error en el servicio updateOneExpense', err)
            throw err
        }
    }

    static deleteOneExpense = async (expenseId: string, visibleUserIds: string[]) => {
        try{
            const { error } = await getSupabaseAdmin()
                .from('expenses')
                .delete()
                .eq('id', expenseId)
                .in('user_id', visibleUserIds)
            if (error) throw error
        }catch(err){
            console.error('Error en el servicio deleteOneExpense', err)
            throw err
        }
    }

    static completePaid = async (expenseId: string, visibleUserIds: string[]) => {
        const expense = await this.getOneExpense(expenseId, visibleUserIds)
        try {
            if (expense) {
                const { error } = await getSupabaseAdmin()
                    .from('expenses')
                    .update({ is_paid: true, payment_date: new Date().toISOString() })
                    .eq('id', expenseId)
                if (error) throw error
                await accountsServices.updateBalance(expense.account_id, expense.amount, visibleUserIds)
            }
        } catch (err) {
            console.error('Error en el servicio de completePaid', err)
            throw err
        }
    }

    static getAvailableMonths = async (userIds: string | string[]) => {
        try {
            const { data, error } = await getSupabaseAdmin()
                .from('expenses')
                .select('created_at')
                .in('user_id', this.normalizeUserIds(userIds))
                .not('created_at', 'is', null)
            if (error) throw error

            const seen = new Set<string>()
            const months: { month: number; year: number }[] = []

            for (const row of data ?? []) {
                const date = new Date(row.created_at)
                const month = date.getMonth() + 1
                const year = date.getFullYear()
                const key = `${year}-${month}`
                if (!seen.has(key)) {
                    seen.add(key)
                    months.push({ month, year })
                }
            }

            months.sort((a, b) => b.year - a.year || b.month - a.month)
            return months
        } catch (err) {
            console.log('Error en el servicio getAvailableMonths', err)
            throw err
        }
    }
}
export default expenseServices
