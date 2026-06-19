import { getSupabaseAdmin } from '../lib/supabase'
import { isSharedCashReady } from '../lib/sharedCashMigration'
import { Account, newAccount } from './types'

type AccountAccessContext = {
    visibleUserIds?: string[]
    householdId?: string
    sharedCash?: boolean
}

class accountsServices{

    private static normalizeUserIds = (userIds: string | string[]) => {
        return Array.isArray(userIds) ? userIds : [userIds]
    }

    private static normalizeContext = (
        context?: string[] | AccountAccessContext
    ): AccountAccessContext | undefined => {
        if (!context) return undefined
        if (Array.isArray(context)) return { visibleUserIds: context }
        return context
    }

    private static canAccessAccount = (
        account: Account,
        context?: string[] | AccountAccessContext
    ) => {
        const access = this.normalizeContext(context)
        if (!access?.visibleUserIds?.length) return true

        if (access.sharedCash && access.householdId && account.household_id === access.householdId) {
            return true
        }

        return access.visibleUserIds.includes(account.user_id) && !account.household_id
    }

    static getAllAccounts = async (
        userIds: string | string[],
        context?: string[] | AccountAccessContext
    ) => {
        const access = this.normalizeContext(context)
        const ids = this.normalizeUserIds(userIds)
        const admin = getSupabaseAdmin()

        const migrationReady = await isSharedCashReady(async () => {
            const result = await admin.from('accounts').select('household_id').limit(1)
            return { error: result.error }
        })

        if (!migrationReady) {
            const { data, error } = await admin
                .from('accounts')
                .select('*')
                .in('user_id', ids)
            if (error) throw error
            return (data ?? []) as Account[]
        }

        const { data: personalAccounts, error } = await admin
            .from('accounts')
            .select('*')
            .in('user_id', ids)
            .is('household_id', null)

        if (error) throw error

        let accounts = (personalAccounts ?? []) as Account[]

        if (access?.sharedCash && access.householdId) {
            accounts = accounts.filter((account) => account.type !== 'cash')

            const { data: sharedAccount, error: sharedError } = await admin
                .from('accounts')
                .select('*')
                .eq('household_id', access.householdId)
                .eq('type', 'cash')
                .maybeSingle()

            if (sharedError) throw sharedError
            if (sharedAccount) accounts = [...accounts, sharedAccount as Account]
        }

        return accounts
    }

    static getOneAccount = async (
        accountId: string,
        context?: string[] | AccountAccessContext
    ): Promise<Account | undefined> => {
        try{
            const { data, error } = await getSupabaseAdmin()
                .from('accounts')
                .select('*')
                .eq('id', accountId)
                .maybeSingle()
            if (error) throw error
            if (!data) return undefined

            const account = data as Account
            if (!this.canAccessAccount(account, context)) return undefined
            return account
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

    static updateAccount = async (
        accountId:string,
        dataAccount:Account,
        context?: string[] | AccountAccessContext
    ) => {
        try{
            const account = await this.getOneAccount(accountId, context)
            if (!account) throw new Error('No se consiguio la fuente de fondos')

            const { error } = await getSupabaseAdmin()
                .from('accounts')
                .update({
                    type: dataAccount.type,
                    balance: dataAccount.balance,
                    description: dataAccount.description,
                })
                .eq('id', accountId)
            if (error) throw error
        }catch(err){
            console.error('Error en el servicio updateAccount', err)
            throw err
        }
    }

    static editFounds = async (
        accountId: string,
        newBalance: Number,
        context?: string[] | AccountAccessContext
    ) => {
        const account = await this.getOneAccount(accountId, context)
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

    static updateBalance = async (
        accountId: string,
        expenseAmount: number,
        context?: string[] | AccountAccessContext
    ) => {
        const account = await this.getOneAccount(accountId, context)
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

    static addFounds = async (
        accountId: string,
        foundsToAdd: number,
        context?: string[] | AccountAccessContext
    ) => {
        const account = await this.getOneAccount(accountId, context)
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

    static transferFounds = async (
        accountId: string,
        accountToTransferId: string,
        moneyToTransfer: number,
        context?: string[] | AccountAccessContext
    ) => {
        const account = await this.getOneAccount(accountId, context)
        const accountToTransfer = await this.getOneAccount(accountToTransferId, context)
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

    static deleteAccount = async (accountId:string, context?: AccountAccessContext) => {
        try{
            const account = await this.getOneAccount(accountId, context)
            if (!account) throw new Error('No se consiguio la fuente de fondos')
            if (account.household_id) {
                throw new Error('No se puede eliminar el efectivo compartido del hogar')
            }

            const { error } = await getSupabaseAdmin()
                .from('accounts')
                .delete()
                .eq('id', accountId)
            if (error) throw error
        }catch(err){
            console.error('Error en el servicio deleteAccount', err)
            throw err
        }
    }

}
export default accountsServices
