import { listOfAccounts, listOfExpenses } from "./types";


export const ROLES = {
    'admin': 1701,
    'editor': 2109,
    'user': 1712
}
export const actualDate = (): Date => {
    const today = new Date();
    return today
}

export const formattedDate = (date: string | undefined) => {
    
    if (date) {
        const dateTyped = new Date(date)
        let dia = String(dateTyped.getDate()).padStart(2, '0');
        let mes = String(dateTyped.getMonth() + 1).padStart(2, '0');
        let año = dateTyped.getFullYear();
        let finalFormat = `${dia}/${mes}/${año}`;
        return finalFormat;
    }
}

export function sumatoria(expenses: listOfExpenses) {
    const suma = expenses.reduce((total:number, expense) => {
        if (!expense.hasOwnProperty('amount')) return total
        const paid = Number(expense.amount_paid ?? 0)
        if (expense.is_paid) return total + Number(expense.amount)
        return total + paid
    }, 0)
    return suma
}

export function sumatoriaPendientes(expenses:listOfExpenses) {
    const suma = expenses.reduce((total, expense) => {
        if (!expense.hasOwnProperty('amount') || expense.is_paid) return total
        const remaining = Number(expense.amount) - Number(expense.amount_paid ?? 0)
        return total + Math.max(0, remaining)
    }, 0)
    return suma
}

export function balanceTotal(accounts: listOfAccounts) {
    const suma = accounts.reduce((total: number, account) => {
        if (account.hasOwnProperty('balance')){
            return total + Number(account.balance)
        } else {
            return total
        }
    }, 0)
    return suma
}
