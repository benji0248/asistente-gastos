import { Router } from 'express'
import statementControllers from '../controllers/statementControllers'
import { verifyRoles } from '../controllers/verifyRoles'
import { ROLES_LIST } from '../config/role_list'

const statementsRoutes = Router({ mergeParams: true })

statementsRoutes.get(
  '/',
  verifyRoles(ROLES_LIST.admin, ROLES_LIST.editor, ROLES_LIST.user),
  statementControllers.getStatements
)
statementsRoutes.put(
  '/',
  verifyRoles(ROLES_LIST.admin, ROLES_LIST.editor, ROLES_LIST.user),
  statementControllers.upsertStatement
)
statementsRoutes.post(
  '/:ownerUserId/payments',
  verifyRoles(ROLES_LIST.admin, ROLES_LIST.editor, ROLES_LIST.user),
  statementControllers.registerPayment
)
statementsRoutes.delete(
  '/:ownerUserId',
  verifyRoles(ROLES_LIST.admin, ROLES_LIST.editor, ROLES_LIST.user),
  statementControllers.deleteStatement
)

export default statementsRoutes
