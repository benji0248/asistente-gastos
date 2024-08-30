import {Router} from 'express'
import accountsControllers from '../controllers/accountsControllers'

const accountsRoutes = Router({mergeParams:true});

accountsRoutes.get('/', accountsControllers.getAccounts)
accountsRoutes.get('/:accountId', accountsControllers.getAccount)
accountsRoutes.post('/', accountsControllers.createAccount)
accountsRoutes.put('/:accountId', accountsControllers.updateOneAccount)
accountsRoutes.put('/:accountId', accountsControllers.updateBalanceAccount)
accountsRoutes.delete('/:accountId', accountsControllers.deleteOneAccount)

export default accountsRoutes