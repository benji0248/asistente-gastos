export interface newUsers{
    username: string,
    email: string,
    pwd: string,
}

export interface Users{
    id:string,
    username: string,
    email: string,
    pwd: string,
    created_at: Date,
    role:number
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
    id: string
    title: string,
    amount: number,
    payment_date: Date,
    created_at: Date,
    is_paid: boolean,
    user_id: string,
    category_id: string,
    account_id:string
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

export interface Token{
    id: string,
    user_id: string,
    token: string,
    created_at:Date
}

export interface Role{
    id: string,
    name: string
}