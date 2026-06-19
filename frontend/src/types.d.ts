export interface Expense {
    id: string
    user_id: string
    title: string
    amount: number
    amount_paid?: number
    category_id: string
    created_at: Date | undefined
    payment_date: string | undefined
    is_paid: boolean
    account_id: string
    household_recurring_expense_id?: string | null
}
export interface newExpense {
    user_id: string
    title: string
    amount: number
    payment_date: string | undefined
    category_id: string
    is_paid: boolean
    account_id: string
}

export interface User {
    id: string
    name: string
    lastName: string
    email: string
    cash: string
    banks: string[]
    tarjetas: string[]
}

export interface newUser {
    name: string
    lastName: string
    email: string
    cash: string
    banks: string[]
    tarjetas: string[]
}

export interface newCategory{
    name: string,
    user_id: string
}

export interface Category {
  id: string
  name: string
  user_id: string
  is_enabled: boolean
  is_system: boolean
}

export interface newAccount{
    type: string,
    balance: number,
    description: string
}

export interface Account {
    id: string,
    user_id: string,
    household_id?: string | null,
    type: string,
    balance: number,
    description: string,
    created_at: Date
}

export type listOfExpenses = Expense[]
export type listOfCategories = Category[]
export type listOfAccounts = Account[]

export interface ExpensesMonthSummary {
    pendingCount: number
    paidTotal: number
    pendingTotal: number
    monthTotal: number
}

export interface PaginatedExpensesResponse {
    data: listOfExpenses
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
    summary: ExpensesMonthSummary
}

export interface Household {
    id: string
    name: string
    created_by: string
    created_at: string
    shared_cash?: boolean
}

export interface HouseholdMember {
    id: string
    username: string
    role: "owner" | "member"
}

export interface HouseholdInvite {
    id: string
    household_id: string
    invited_by: string
    invitee_user_id?: string | null
    invitee_email?: string | null
    status: "pending" | "accepted" | "rejected" | "cancelled"
    created_at: string
    responded_at?: string | null
    households?: {
        id: string
        name: string
    }
    profiles?: {
        id: string
        username: string
    }
}

export interface HouseholdRecurringExpense {
    id: string
    household_id: string
    title: string
    amount_type: "fixed" | "estimated"
    fixed_amount: number | null
    category_id: number | null
    created_by: string
    created_at: string
}