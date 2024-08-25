import {Request, Response} from 'express'
import accountsServices from '../config/accountsServices'

class accountsControllers{

    static getAccounts = async(req:Request, res:Response) => {
        try{
            const userId = req.params.userId
            const accounts = await accountsServices.getAllAccounts(userId)
            res.status(200).json(accounts)
        }catch(err){
            console.error('Error en el controlador getAccounts', err)
        }
    }

    static getAccount = async(req:Request, res:Response) => {
        try{
            const accountId = req.params.accountId
            const account = await accountsServices.getOneAccount(accountId)
            res.status(200).json(account);
        }catch(err){
            console.error('Error en el controlador getAccount', err);
        }
    }

    static createAccount = async(req:Request, res:Response) => {
        try{
            const userId = req.params.userId
            await accountsServices.addAccount(userId, req.body)
            res.status(201);
        }catch(err){
            console.error('Error en el controlador createAccount', err);
        }
    }

    static updateOneAccount = async(req:Request, res:Response) => {
        try{
            const accountId = req.params.accountId
            await accountsServices.updateAccount(accountId,req.body)
            res.status(200);
        }catch(err){
            console.error('Error en el controlador updateOneAccount', err);
        }
    }

    static updateBalanceAccount = async(req:Request, res:Response) => {
        try{
            const accountId = req.params.accountId
            const {balance} = req.body.balance
            await accountsServices.updateBalance(accountId, balance)
            res.status(200);
        }catch(err){
            console.error('ERror en el controlador updateBalanceAccount', err);
        }
    }

    static deleteOneAccount = async(req:Request, res:Response) => {
        try{
            const accountId = req.params.accountId
            await accountsServices.deleteAccount(accountId)
            res.status(200);
        }catch(err){
            console.error('Error en el controlador deleteOneAccount', err);
        }
    }

}
export default accountsControllers