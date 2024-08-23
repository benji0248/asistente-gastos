export interface newUsers{
    name: string,
    email: string,
    password: string,
}

export interface Users{
    name: string,
    email: string,
    password: string,
    created_at: Date,
}

export interface newExpenses{
    title: string,
    amount: number,
    payment_date: Date,
    is_paid: boolean
}

export interface Expenses{
    title: string,
    amount: number,
    created_at: Date,
    payment_date: Date,
    is_paid: boolean
}

export interface newCategory{
    name: string
}