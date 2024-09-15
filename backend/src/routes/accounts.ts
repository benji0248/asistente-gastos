import {Router} from 'express'
import accountsControllers from '../controllers/accountsControllers'
import { verifyRoles } from '../controllers/verifyRoles';
import { ROLES_LIST } from '../config/role_list';

const accountsRoutes = Router({mergeParams:true});

accountsRoutes.get('/', verifyRoles(ROLES_LIST.admin, ROLES_LIST.editor, ROLES_LIST.user), accountsControllers.getAccounts)
accountsRoutes.get('/:accountId', verifyRoles(ROLES_LIST.admin, ROLES_LIST.editor, ROLES_LIST.user), accountsControllers.getAccount)
accountsRoutes.post('/', verifyRoles(ROLES_LIST.admin, ROLES_LIST.editor, ROLES_LIST.user), accountsControllers.createAccount)
accountsRoutes.put('/:accountId', verifyRoles(ROLES_LIST.admin, ROLES_LIST.editor, ROLES_LIST.user), accountsControllers.updateOneAccount)
accountsRoutes.put('/:accountId', verifyRoles(ROLES_LIST.admin, ROLES_LIST.editor, ROLES_LIST.user), accountsControllers.updateBalanceAccount)
accountsRoutes.delete('/:accountId', verifyRoles(ROLES_LIST.admin, ROLES_LIST.editor, ROLES_LIST.user), accountsControllers.deleteOneAccount)

export default accountsRoutes