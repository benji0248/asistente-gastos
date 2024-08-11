import { Timestamp } from "firebase/firestore";
import { Expense, listOfExpenses } from "./types";
import { updateExpense } from "./lib/controller";

export const EXPENSE_FILTERS = {
    ALL: 'all',
    UNPAID: 'impago',
    PAID: 'pagado',
    SERVICIOS: 'servicios',
    COMIDA: 'comida',
    ROPA: 'ropa',
    ALQUILER: 'alquiler',
    SUPER: 'super',
    GYM: 'gym',
    UBER: 'uber',
    COMPRAS: 'compras',
    SUBE: 'sube',
    ENVIOS: 'envios',
    VARIOS: 'varios'
} as const

export const FILTERS_BUTTONS = {
    [EXPENSE_FILTERS.ALL]: {
        literal: 'Todos',
        href: `/?filter=${EXPENSE_FILTERS.ALL}`
    },
    [EXPENSE_FILTERS.UNPAID]: {
        literal: 'Impago',
        href: `/?filter=${EXPENSE_FILTERS.PAID}`
    },
    [EXPENSE_FILTERS.PAID]: {
        literal: 'Pagado',
        href: `/?filter=${EXPENSE_FILTERS.PAID}`
    },
    [EXPENSE_FILTERS.SERVICIOS]: {
        literal: 'Servicios',
        href: `/?filter=${EXPENSE_FILTERS.SERVICIOS}`
    },
    [EXPENSE_FILTERS.COMIDA]: {
        literal: 'Comida',
        href: `/?filter=${EXPENSE_FILTERS.COMIDA}`
    },
    [EXPENSE_FILTERS.SUPER]: {
        literal: 'Super',
        href: `/?filter=${EXPENSE_FILTERS.SUPER}`
    },
    [EXPENSE_FILTERS.ROPA]: {
        literal: 'Ropa',
        href: `/?filter=${EXPENSE_FILTERS.ROPA}`
    },
    [EXPENSE_FILTERS.ALQUILER]: {
        literal: 'Alquiler',
        href: `/?filter=${EXPENSE_FILTERS.ALQUILER}`
    },
    [EXPENSE_FILTERS.GYM]: {
        literal: 'Gym',
        href: `/?filter=${EXPENSE_FILTERS.GYM}`
    },
    [EXPENSE_FILTERS.UBER]: {
        literal: 'Uber',
        href: `/?filter=${EXPENSE_FILTERS.UBER}`
    },
    [EXPENSE_FILTERS.COMPRAS]: {
        literal: 'compras',
        href: `/?filter=${EXPENSE_FILTERS.COMPRAS}`
    },
    [EXPENSE_FILTERS.SUBE]: {
        literal: 'Sube',
        href: `/?filter=${EXPENSE_FILTERS.SUBE}`
    },
    [EXPENSE_FILTERS.ENVIOS]: {
        literal: 'Envios',
        href: `/?filter=${EXPENSE_FILTERS.ENVIOS}`
    },
    [EXPENSE_FILTERS.VARIOS]: {
        literal: 'Varios',
        href: `/?filter=${EXPENSE_FILTERS.VARIOS}`
    }
} as const

export const actualDate = (): Timestamp => {
    const today = Timestamp.now();
    return today
}

export const formattedDate = (date: Timestamp | undefined) => {
    if (date) {
        const formatedDate = date.toDate()
        let dia = formatedDate.getDate();
        let mes = formatedDate.getMonth() + 1;
        let año = formatedDate.getFullYear();
        let hora = formatedDate.getHours();
        let min = formatedDate.getMinutes()
        let finalFormat = `${dia}/${mes}/${año} ${hora}:${min}hs`;
        return finalFormat;
    }
}

export function sumatoria(expenses: listOfExpenses) {
    const suma = expenses.reduce((total, expense) => {
        if (expense.hasOwnProperty('amount') && expense.paid === true) {
            return total + expense.amount
        } else {
            return total
        }
    }, 0)
    return suma
}

export function sumatoriaPendientes(expenses:listOfExpenses) {
    const suma = expenses.reduce((total, expense) => {
        if (expense.hasOwnProperty('amount') && expense.paid === false) {
            return total + expense.amount
        } else {
            return total
        }
    }, 0)
    return suma
}


export const handleComplete = (expense: Expense) => {
    expense.paid = true;
    expense.paidDate = actualDate();
    updateExpense(expense.id, expense)
  }
