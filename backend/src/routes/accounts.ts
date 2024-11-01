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
accountsRoutes.put('/:accountId/add', verifyRoles(ROLES_LIST.admin, ROLES_LIST.editor, ROLES_LIST.user), accountsControllers.addMoneyFounds)
accountsRoutes.put('/:accountId/edit', verifyRoles(ROLES_LIST.admin, ROLES_LIST.editor, ROLES_LIST.user), accountsControllers.editMoneyFounds)
accountsRoutes.put('/:accountId/transfer', verifyRoles(ROLES_LIST.admin, ROLES_LIST.editor, ROLES_LIST.user), accountsControllers.transferMoneyFounds)
accountsRoutes.delete('/:accountId', verifyRoles(ROLES_LIST.admin, ROLES_LIST.editor, ROLES_LIST.user), accountsControllers.deleteOneAccount)

export default accountsRoutes