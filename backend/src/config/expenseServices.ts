import { getSupabaseAdmin } from '../lib/supabase'
import accountsServices from './accountsServices'
import {
    newExpenses,
    Expenses,
    ExpensePaymentFilter,
    ExpensesMonthSummary,
    PaginatedExpenses,
} from './types'

type AccountAccessContext = {
    visibleUserIds?: string[]
    householdId?: string
    sharedCash?: boolean
}

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

    private static getExpensesMonthSummary = async (
        userIds: string[],
        start: string,
        end: string
    ): Promise<ExpensesMonthSummary> => {
        const { data, error } = await getSupabaseAdmin()
            .from('expenses')
            .select('amount, amount_paid, is_paid')
            .in('user_id', userIds)
            .gte('created_at', start)
            .lte('created_at', end)
        if (error) throw error

        let pendingCount = 0
        let paidTotal = 0
        let pendingTotal = 0

        for (const row of data ?? []) {
            const amount = Number(row.amount)
            const amountPaid = Number(row.amount_paid ?? 0)
            if (row.is_paid) {
                paidTotal += amount
            } else {
                pendingCount++
                paidTotal += amountPaid
                pendingTotal += Math.max(0, amount - amountPaid)
            }
        }

        return {
            pendingCount,
            paidTotal,
            pendingTotal,
            monthTotal: paidTotal + pendingTotal,
        }
    }

    static getExpensesByMonth = async (
        userIds: string | string[],
        month: number,
        year: number,
        options: { page?: number; limit?: number; payment?: ExpensePaymentFilter } = {}
    ): Promise<PaginatedExpenses> => {
        try {
            const page = Math.max(1, options.page ?? 1)
            const limit = Math.min(100, Math.max(1, options.limit ?? 10))
            const payment = options.payment ?? 'all'
            const from = (page - 1) * limit
            const to = from + limit - 1
            const { start, end } = monthDateRange(month, year)
            const normalizedUserIds = this.normalizeUserIds(userIds)

            const summary = await this.getExpensesMonthSummary(normalizedUserIds, start, end)

            let query = getSupabaseAdmin()
                .from('expenses')
                .select('*', { count: 'exact' })
                .in('user_id', normalizedUserIds)
                .gte('created_at', start)
                .lte('created_at', end)

            if (payment === 'paid') query = query.eq('is_paid', true)
            if (payment === 'unpaid') query = query.eq('is_paid', false)

            query = query
                .order('is_paid', { ascending: true })
                .order('payment_date', { ascending: false, nullsFirst: false })

            const { data, error, count } = await query.range(from, to)
            if (error) throw error

            const total = count ?? 0
            return {
                data: (data ?? []) as Expenses[],
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
                },
                summary,
            }
        } catch (err) {
            console.log('Error en el servicio getExpensesByMonth', err)
            throw err
        }
    }

    static createOneExpense = async (
        userId: string,
        dataExpense: newExpenses,
        visibleUserIds: string[],
        accountContext?: AccountAccessContext
    ) => {
        const accountCtx = accountContext ?? { visibleUserIds }
        if (dataExpense.is_paid === true) {
            dataExpense.payment_date = new Date()
        }
        const expenseOwnerId =
            dataExpense.user_id && visibleUserIds.includes(dataExpense.user_id)
                ? dataExpense.user_id
                : userId
        try {
            const account = await accountsServices.getOneAccount(dataExpense.account_id, accountCtx)
            if (!account) throw new Error('La cuenta no pertenece al hogar')
            const paidAmount = dataExpense.is_paid === true ? dataExpense.amount : 0
            const { error } = await getSupabaseAdmin()
                .from('expenses')
                .insert({
                    title: dataExpense.title,
                    amount: dataExpense.amount,
                    amount_paid: paidAmount,
                    payment_date: dataExpense.payment_date,
                    is_paid: dataExpense.is_paid,
                    user_id: expenseOwnerId,
                    category_id: dataExpense.category_id,
                    account_id: dataExpense.account_id,
                })
            if (error) throw error
            if (dataExpense.is_paid === true) {
                await accountsServices.updateBalance(dataExpense.account_id, dataExpense.amount, accountCtx)
            }
        } catch (err) {
            console.error('Error en el servicio createOneExpense', err)
            throw err
        }
    }

    static createBillExpense = async (
        userId: string,
        data: { title: string; amount: number; category_id?: string | null }
    ): Promise<number> => {
        const { data: inserted, error } = await getSupabaseAdmin()
            .from('expenses')
            .insert({
                title: data.title,
                amount: data.amount,
                amount_paid: 0,
                is_paid: false,
                user_id: userId,
                category_id: data.category_id ?? null,
                account_id: null,
            })
            .select('id')
            .single()

        if (error) throw error
        return Number(inserted.id)
    }

    static addPartialPayment = async (
        expenseId: string,
        paymentAmount: number,
        accountId: string,
        visibleUserIds: string[],
        accountContext?: AccountAccessContext
    ) => {
        const accountCtx = accountContext ?? { visibleUserIds }
        const expense = await this.getOneExpense(expenseId, visibleUserIds)
        if (!expense) throw new Error('El gasto no pertenece al hogar')

        const account = await accountsServices.getOneAccount(accountId, accountCtx)
        if (!account) throw new Error('La cuenta no pertenece al hogar')

        const total = Number(expense.amount)
        const alreadyPaid = Number(expense.amount_paid ?? 0)
        const remaining = total - alreadyPaid

        if (paymentAmount <= 0 || paymentAmount > remaining + 0.001) {
            throw new Error('INVALID_PAYMENT_AMOUNT')
        }

        const newPaid = Math.min(total, alreadyPaid + paymentAmount)
        const isPaid = newPaid >= total

        const { error } = await getSupabaseAdmin()
            .from('expenses')
            .update({
                amount_paid: newPaid,
                is_paid: isPaid,
                account_id: accountId,
                payment_date: isPaid ? new Date().toISOString() : expense.payment_date ?? null,
            })
            .eq('id', expenseId)
            .in('user_id', visibleUserIds)

        if (error) throw error
        await accountsServices.updateBalance(accountId, paymentAmount, accountCtx)

        return this.getOneExpense(expenseId, visibleUserIds)
    }

    static updateOneExpense = async (
        expenseId: string,
        updateData: Expenses,
        visibleUserIds: string[],
        accountContext?: AccountAccessContext
    ) => {
        const accountCtx = accountContext ?? { visibleUserIds }
        try {
            const expense = await this.getOneExpense(expenseId, visibleUserIds)
            if (!expense) throw new Error('El gasto no pertenece al hogar')
            if (updateData.account_id) {
                const account = await accountsServices.getOneAccount(updateData.account_id, accountCtx)
                if (!account) throw new Error('La cuenta no pertenece al hogar')
            } else if (updateData.is_paid) {
                throw new Error('ACCOUNT_REQUIRED')
            }
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

            const recurringId = (expense as { household_recurring_expense_id?: string | null })
              .household_recurring_expense_id
            const nextAmount = Number(updateData.amount)
            if (recurringId && Number.isFinite(nextAmount) && nextAmount > 0) {
                await getSupabaseAdmin()
                    .from('household_recurring_expenses')
                    .update({ fixed_amount: nextAmount })
                    .eq('id', recurringId)
            }
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

    static completePaid = async (
        expenseId: string,
        visibleUserIds: string[],
        accountContext?: AccountAccessContext,
        accountId?: string
    ) => {
        const accountCtx = accountContext ?? { visibleUserIds }
        const expense = await this.getOneExpense(expenseId, visibleUserIds)
        if (!expense) return

        const total = Number(expense.amount)
        const alreadyPaid = Number(expense.amount_paid ?? 0)
        const remaining = total - alreadyPaid

        if (remaining <= 0) {
            const { error } = await getSupabaseAdmin()
                .from('expenses')
                .update({ is_paid: true, payment_date: new Date().toISOString() })
                .eq('id', expenseId)
                .in('user_id', visibleUserIds)
            if (error) throw error
            return
        }

        const payAccountId = accountId || expense.account_id
        if (!payAccountId) {
            throw new Error('ACCOUNT_REQUIRED')
        }

        await this.addPartialPayment(
            expenseId,
            remaining,
            String(payAccountId),
            visibleUserIds,
            accountCtx
        )
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
