import { Expense, listOfExpenses } from "./types";


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
        if (expense.hasOwnProperty('amount') && Boolean(expense.is_paid) === true) {
            return total + Number(expense.amount)
        } else {
            return total
        }
    }, 0)
    return suma
}

export function sumatoriaPendientes(expenses:listOfExpenses) {
    const suma = expenses.reduce((total, expense) => {
        if (expense.hasOwnProperty('amount') && Boolean(expense.is_paid) === false) {
            return total + Number(expense.amount)
        } else {
            return total
        }
    }, 0)
    return suma
}
/* 

export const handleComplete = (expense: Expense) => {
    expense.is_paid = Boolean(1);
    expense.paytment_date = actualDate();
    updateExpense(expense.id, expense)
  } */
