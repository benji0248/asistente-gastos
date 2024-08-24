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

    static getOneAccount = async (accountId:string) => {
        try{
            const [result] = await db.query(`SELECT FROM accounts WHERE id = ?`, [accountId])
            return result
        }catch(err){
            console.error('Error en el servicio getOneAccount', err)
        }
    }

    static addAccount = async (userId:string, dataAccout:newAccount) => {
        try{
            await db.query (`
                INSER INTO accounts (user_id, type, balance, description, created_at)
                VALUES (?,?,?,?,now())`,[userId, dataAccout.type, dataAccout.balance, dataAccout.description])
        }catch(err){
            console.error('Error en el servicio addAccount', err)
        }
    }

    static updateAccount = async (accountId:string, dataAccount:Account) => {
        try{
            await db.query(
                `UPDATE accounts SET type = ?, balance = ?, description = ? WHERE id = ?`,
                [dataAccount.balance,dataAccount.balance,dataAccount.description,accountId]);

        }catch(err){
            console.error('Error en el servicio updateAccount', err)
        }
    }

    static updateBalance = async (accountId:string, balance:number) => {
        try{
            await db.query(
                `UPDATE accounts SET balance = ? WHERE id = ?`, [balance, accountId])
        }catch(err){
            console.error('Error en el servicio updateBalance', err)
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