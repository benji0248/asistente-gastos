import { getSupabaseAdmin } from '../lib/supabase'
import { Account, newAccount } from './types'

class accountsServices{

    private static normalizeUserIds = (userIds: string | string[]) => {
        return Array.isArray(userIds) ? userIds : [userIds]
    }

    static getAllAccounts = async (userIds: string | string[]) => {
        const { data, error } = await getSupabaseAdmin()
            .from('accounts')
            .select('*')
            .in('user_id', this.normalizeUserIds(userIds))
        if (error) throw error
        return data ?? []
    }

    static getOneAccount = async (accountId:string, visibleUserIds?: string[]): Promise<Account | undefined> => {
        try{
            let query = getSupabaseAdmin()
                .from('accounts')
                .select('*')
                .eq('id', accountId)
            if (visibleUserIds?.length) {
                query = query.in('user_id', visibleUserIds)
            }
            const { data, error } = await query.maybeSingle()
            if (error) throw error
            if (data) return data as Account
        }catch(err){
            console.error('Error en el servicio getOneAccount', err)
            throw err
        }
    }

    static addAccount = async (userId:string, dataAccout:newAccount) => {
        try{
            const { data, error } = await getSupabaseAdmin()
                .from('accounts')
                .insert({
                    user_id: userId,
                    type: dataAccout.type,
                    balance: dataAccout.balance,
                    description: dataAccout.description,
                })
                .select('*')
                .single()
            if (error) throw error
            return data as Account
        }catch(err){
            console.error('Error en el servicio addAccount', err)
            throw err
        }
    }

    static setDefaultAccount = async (userId: string) => {
        try {
            const { error } = await getSupabaseAdmin()
                .from('accounts')
                .insert({
                    user_id: userId,
                    type: 'cash',
                    balance: 0,
                    description: 'efectivo',
                })
            if (error) throw error
        } catch (err) {
            console.error('Error en el servicio setDefaultAccount', err)
        }
    }

    static updateAccount = async (accountId:string, dataAccount:Account, visibleUserIds?: string[]) => {
        try{
            let query = getSupabaseAdmin()
                .from('accounts')
                .update({
                    type: dataAccount.type,
                    balance: dataAccount.balance,
                    description: dataAccount.description,
                })
                .eq('id', accountId)
            if (visibleUserIds?.length) {
                query = query.in('user_id', visibleUserIds)
            }
            const { error } = await query
            if (error) throw error
        }catch(err){
            console.error('Error en el servicio updateAccount', err)
            throw err
        }
    }

    static editFounds = async (accountId: string, newBalance: Number, visibleUserIds?: string[]) => {
        const account = await this.getOneAccount(accountId, visibleUserIds)
        try{
            if (account) {
                const { error } = await getSupabaseAdmin()
                    .from('accounts')
                    .update({ balance: newBalance })
                    .eq('id', accountId)
                if (error) throw error
            } else {
                throw new Error ('No se consiguio la fuente de fondos')
            }
        }catch(err){
            console.error('Error en el servicio updateAccount', err)
            throw err
        }
    }

    static updateBalance = async (accountId: string, expenseAmount: number, visibleUserIds?: string[]) => {
        const account = await this.getOneAccount(accountId, visibleUserIds)
        try {
            if (account) {
                const balance = Number(account.balance) - Number(expenseAmount)
                const { error } = await getSupabaseAdmin()
                    .from('accounts')
                    .update({ balance })
                    .eq('id', accountId)
                if (error) throw error
            } else {
                throw new Error ('No se consiguio la fuente de fondos')
            }
        }catch(err){
            console.error('Error en el servicio updateBalance', err)
            throw err
        }
    }

    static addFounds = async (accountId: string, foundsToAdd: number, visibleUserIds?: string[]) => {
        const account = await this.getOneAccount(accountId, visibleUserIds)
        try {
            if (account) {
                const balance = Number(account.balance) + Number(foundsToAdd)
                const { error } = await getSupabaseAdmin()
                    .from('accounts')
                    .update({ balance })
                    .eq('id', accountId)
                if (error) throw error
            } else {
                throw new Error ('No se consiguio la fuente de fondos')
            }
        }catch(err){
            console.error('Error en el servicio addFounds', err)
            throw err
        }
    }

    static transferFounds = async (accountId: string, accountToTransferId: string, moneyToTransfer: number, visibleUserIds?: string[]) => {
        const account = await this.getOneAccount(accountId, visibleUserIds)
        const accountToTransfer = await this.getOneAccount(accountToTransferId, visibleUserIds)
        try {
            if (account && accountToTransfer) {
                const originAccountBalance = Number(account.balance) - Number(moneyToTransfer)
                const destinyAccountBalance = Number(accountToTransfer.balance) + Number(moneyToTransfer)
                const { error: originError } = await getSupabaseAdmin()
                    .from('accounts')
                    .update({ balance: originAccountBalance })
                    .eq('id', accountId)
                if (originError) throw originError
                const { error: destinyError } = await getSupabaseAdmin()
                    .from('accounts')
                    .update({ balance: destinyAccountBalance })
                    .eq('id', accountToTransferId)
                if (destinyError) throw destinyError
            } else {
                throw new Error ('No se consiguio la fuente de fondos')
            }
        }catch(err){
            console.error('Error en el servicio addFounds', err)
            throw err
        }
    }

    static deleteAccount = async (accountId:string, visibleUserIds?: string[]) => {
        try{
            let query = getSupabaseAdmin()
                .from('accounts')
                .delete()
                .eq('id', accountId)
            if (visibleUserIds?.length) {
                query = query.in('user_id', visibleUserIds)
            }
            const { error } = await query
            if (error) throw error
        }catch(err){
            console.error('Error en el servicio deleteAccount', err)
            throw err
        }
    }

}
export default accountsServices
