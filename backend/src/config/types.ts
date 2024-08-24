export interface newUsers{
    name: string,
    email: string,
    password: string,
}

export interface Users{
    id:string,
    name: string,
    email: string,
    password: string,
    created_at: Date,
}

export interface newExpenses{
    title: string,
    amount: number,
    payment_date: Date,
    is_paid: boolean,
    user_id: string,
    account_id: string,
    category_id: string
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

export interface newAccount{
    type:string,
    balance:number,
    description:string
}
export interface Account{
    type:string,
    balance:number,
    description:string,
    created_at:Date
}