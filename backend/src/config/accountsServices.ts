import { RowDataPacket } from 'mysql2'
import accountsControllers from '../controllers/accountsControllers'
import { db } from '../database/database'
import { Account, newAccount } from './types'

class accountsServices{

    static getAllAccounts = async (userId:string) => {
        try{
            const [result] = await db.query (`SELECT * FROM accounts WHERE user_id = ?`,[userId])
            return result
        }catch(err){
            console.error('Error en el servicio getAllAccounts', err)
        }
    }

    static getOneAccount = async (accountId:string): Promise<Account | undefined> => {
        try{
            const [result] = await db.query<RowDataPacket[]>(`SELECT * FROM accounts WHERE id = ?`, [accountId])
            if(result.length > 0)
            return result[0] as Account
        }catch(err){
            console.error('Error en el servicio getOneAccount', err)
        }
    }

    static addAccount = async (userId:string, dataAccout:newAccount) => {
        try{
            const result = await db.query (`
                INSERT INTO accounts (user_id, type, balance, description, created_at)
                VALUES (?,?,?,?,now())`, [userId, dataAccout.type, dataAccout.balance, dataAccout.description])
            console.log('Se logro crear la cuenta con exito', result);
        }catch(err){
            console.error('Error en el servicio addAccount', err)
        }
    }

    static setDefaultAccount = async (userId: string) => {
        const type = "cash"
        const balance = 0
        const description = "efectivo"
        try {
            await db.query(`INSERT INTO accounts (user_id, type, balance, description, created_at)
                VALUES (?,?,?,?,now())`, [userId, type, balance, description])
        } catch (err) {
            console.error('Error en el servicio setDefaultAccount', err)
        }
    }

    static updateAccount = async (accountId:string, dataAccount:Account) => {
        try{
            await db.query(
                `UPDATE accounts SET type = ?, balance = ?, description = ? WHERE id = ?`,
                [dataAccount.type,dataAccount.balance,dataAccount.description,accountId]);

        }catch(err){
            console.error('Error en el servicio updateAccount', err)
        }
    }

    static editFounds = async (accountId: string, newBalance: Number) => {
        const account = await this.getOneAccount(accountId)
        try{
            if (account) {
                await db.query(
                    `UPDATE accounts SET balance = ? WHERE id = ?`,
                    [newBalance,accountId]);
            } else {
                throw new Error ('No se consiguio la fuente de fondos')
            }

        }catch(err){
            console.error('Error en el servicio updateAccount', err)
        }
    }

    static updateBalance = async (accountId: string, expenseAmount: number) => {
        
        const account = await this.getOneAccount(accountId)
        try {
            if (account) {
                const balance = Number(account.balance) - Number(expenseAmount)
                await db.query(
                    `UPDATE accounts SET balance = ? WHERE id = ?`, [balance, accountId])
            } else {
                throw new Error ('No se consiguio la fuente de fondos')
            }
        }catch(err){
            console.error('Error en el servicio updateBalance', err)
        }
    }

    static addFounds = async (accountId: string, foundsToAdd: number) => {
        
        const account = await this.getOneAccount(accountId)
        try {
            if (account) {
                const balance = Number(account.balance) + Number(foundsToAdd)
                console.log(balance)
                await db.query(
                    `UPDATE accounts SET balance = ? WHERE id = ?`, [balance, accountId])
            } else {
                throw new Error ('No se consiguio la fuente de fondos')
            }
        }catch(err){
            console.error('Error en el servicio addFounds', err)
        }
    }

    static transferFounds = async (accountId: string, accountToTransferId: string, moneyToTransfer: number) => {
        
        const account = await this.getOneAccount(accountId)
        const accountToTransfer = await this.getOneAccount(accountToTransferId)
        try {
            if (account && accountToTransfer
            ) {
                const originAccountBalance = Number(account.balance) - Number(moneyToTransfer)
                const destinyAccountBalance = Number(accountToTransfer.balance) + Number(moneyToTransfer)
                await db.query(
                    `UPDATE accounts SET balance = ? WHERE id = ?`, [originAccountBalance, accountId])
                await db.query(
                    `UPDATE accounts SET balance = ? WHERE id = ?`, [destinyAccountBalance, accountToTransferId])
            } else {
                throw new Error ('No se consiguio la fuente de fondos')
            }
        }catch(err){
            console.error('Error en el servicio addFounds', err)
        }
    }

    static deleteAccount = async (accountId:string) => {
        try{
            await db.query(`DELETE FROM accounts WHERE id = ?`, accountId)
        }catch(err){
            console.error('Error en el servicio deleteAccount', err)
        }
    }

}
export default accountsServices