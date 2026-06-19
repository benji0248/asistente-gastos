import { getSupabaseAdmin } from '../lib/supabase'
import categoriesServices from './categoriesServices'
import expenseServices from './expenseServices'

export interface StatementBillExpense {
  id: number
  amount: number
  amount_paid: number
  is_paid: boolean
  title: string
}

export interface CreditCardStatementRow {
  id: string
  user_id: string
  statement_data: Record<string, unknown>
  file_name: string | null
  expense_id: number | null
  imported_at: string
  updated_at: string
  bill_expense?: StatementBillExpense | null
}

function buildBillTitle(statementData: Record<string, unknown>): string {
  const brand = statementData.cardBrand ?? 'Visa'
  const tier = statementData.cardTier ? ` ${statementData.cardTier}` : ''
  const bank = statementData.bank ?? 'BBVA'
  const dueDate = statementData.dueDate ?? ''
  return `Resumen ${brand}${tier} ${bank} · vence ${dueDate}`
}

async function findCreditCardCategoryId(userId: string): Promise<string> {
  const categories = await categoriesServices.getCategories(userId, true)
  const match = categories.find((c) =>
    String(c.name).toLowerCase().includes('tarjeta de cr')
  )
  if (!match) throw new Error('CATEGORY_NOT_FOUND')
  return String(match.id)
}

class statementServices {
  private static normalizeUserIds = (userIds: string | string[]) =>
    Array.isArray(userIds) ? userIds : [userIds]

  private static async attachBillExpense(
    row: CreditCardStatementRow
  ): Promise<CreditCardStatementRow> {
    if (!row.expense_id) return { ...row, bill_expense: null }

    const expense = await expenseServices.getOneExpense(String(row.expense_id))
    if (!expense) return { ...row, bill_expense: null }

    return {
      ...row,
      bill_expense: {
        id: Number(expense.id),
        amount: Number(expense.amount),
        amount_paid: Number(expense.amount_paid ?? 0),
        is_paid: expense.is_paid,
        title: expense.title,
      },
    }
  }

  static getAllForUsers = async (userIds: string | string[]) => {
    const { data, error } = await getSupabaseAdmin()
      .from('credit_card_statements')
      .select('*')
      .in('user_id', this.normalizeUserIds(userIds))
      .order('updated_at', { ascending: false })

    if (error) throw error
    const rows = (data ?? []) as CreditCardStatementRow[]
    return Promise.all(rows.map((row) => this.attachBillExpense(row)))
  }

  private static async syncBillExpense(
    userId: string,
    statementData: Record<string, unknown>,
    existingExpenseId: number | null
  ): Promise<number> {
    const total = Number(statementData.totalBalanceArs)
    if (!Number.isFinite(total) || total <= 0) {
      throw new Error('INVALID_STATEMENT_TOTAL')
    }

    const categoryId = await findCreditCardCategoryId(userId)
    const title = buildBillTitle(statementData)

    if (existingExpenseId) {
      const existing = await expenseServices.getOneExpense(String(existingExpenseId), [userId])
      if (existing && !existing.is_paid) {
        const { error } = await getSupabaseAdmin()
          .from('expenses')
          .update({ title, amount: total })
          .eq('id', existingExpenseId)
          .eq('user_id', userId)
        if (error) throw error
        return existingExpenseId
      }
    }

    return expenseServices.createBillExpense(userId, {
      title,
      amount: total,
      category_id: categoryId,
    })
  }

  static upsertForUser = async (
    userId: string,
    statementData: Record<string, unknown>,
    fileName?: string
  ) => {
    const admin = getSupabaseAdmin()
    const { data: current } = await admin
      .from('credit_card_statements')
      .select('expense_id')
      .eq('user_id', userId)
      .maybeSingle()

    const expenseId = await this.syncBillExpense(
      userId,
      statementData,
      current?.expense_id ?? null
    )

    const now = new Date().toISOString()
    const { data, error } = await admin
      .from('credit_card_statements')
      .upsert(
        {
          user_id: userId,
          statement_data: statementData,
          file_name: fileName ?? null,
          expense_id: expenseId,
          imported_at: now,
          updated_at: now,
        },
        { onConflict: 'user_id' }
      )
      .select('*')
      .single()

    if (error) throw error
    return this.attachBillExpense(data as CreditCardStatementRow)
  }

  static registerPartialPayment = async (
    ownerUserId: string,
    paymentAmount: number,
    accountId: string,
    visibleUserIds: string[],
    accountContext?: {
      visibleUserIds?: string[]
      householdId?: string
      sharedCash?: boolean
    }
  ) => {
    if (!visibleUserIds.includes(ownerUserId)) {
      throw new Error('FORBIDDEN')
    }

    const { data: row, error } = await getSupabaseAdmin()
      .from('credit_card_statements')
      .select('expense_id')
      .eq('user_id', ownerUserId)
      .maybeSingle()

    if (error) throw error
    if (!row?.expense_id) throw new Error('STATEMENT_EXPENSE_NOT_FOUND')

    const expense = await expenseServices.addPartialPayment(
      String(row.expense_id),
      paymentAmount,
      accountId,
      visibleUserIds,
      accountContext
    )

    return expense
  }

  static deleteForUser = async (userId: string, visibleUserIds: string[]) => {
    if (!visibleUserIds.includes(userId)) {
      throw new Error('FORBIDDEN')
    }

    const admin = getSupabaseAdmin()
    const { data: row } = await admin
      .from('credit_card_statements')
      .select('expense_id')
      .eq('user_id', userId)
      .maybeSingle()

    if (row?.expense_id) {
      const expense = await expenseServices.getOneExpense(String(row.expense_id), visibleUserIds)
      if (expense && !expense.is_paid) {
        await expenseServices.deleteOneExpense(String(row.expense_id), visibleUserIds)
      }
    }

    const { error } = await admin
      .from('credit_card_statements')
      .delete()
      .eq('user_id', userId)

    if (error) throw error
  }
}

export default statementServices
