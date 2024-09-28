export interface Expense {
    id: string
    user_id: string
    title: string
    amount: number
    category_id: string
    created_at: Date | undefined
    payment_date: string | undefined
    is_paid: boolean
    account_id: string
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

export interface Category{
    id: string
    name: string
    user_id: string
}

export interface newAccount{
    type: string,
    balance: number,
    description: string
}

export interface Account {
    id: string,
    user_id: string,
    type: string,
    balance: number,
    description: string,
    created_at: Date
}

export type listOfExpenses = Expense[]
export type listOfCategories = Category[]
export type listOfAccounts = Account[]