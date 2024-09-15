import { Timestamp } from 'firebase/firestore'
import { type EXPENSE_FILTERS } from './consts'

export interface Expense {
    id: string
    title: string
    amount: number
    type: string
    createdDate: Timestamp | undefined
    paidDate: Timestamp | undefined
    paidMethod: string
    paid: boolean
}
export interface newExpense {
    title: string
    amount: number
    type: string
    createdDate: Timestamp | undefined
    paidDate: Timestamp | undefined
    paidMethod: string
    paid: boolean
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

export type FilterValue = typeof EXPENSE_FILTERS[keyof typeof EXPENSE_FILTERS]