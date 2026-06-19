import { Router } from 'express'
import householdControllers from '../controllers/householdControllers'
import { verifyRoles } from '../controllers/verifyRoles'
import { ROLES_LIST } from '../config/role_list'

const householdRoutes = Router()
const allowedRoles = verifyRoles(ROLES_LIST.admin, ROLES_LIST.editor, ROLES_LIST.user)

householdRoutes.get('/', allowedRoles, householdControllers.getHousehold)
householdRoutes.post('/', allowedRoles, householdControllers.createHousehold)
householdRoutes.post('/invites', allowedRoles, householdControllers.inviteMember)
householdRoutes.get('/invites', allowedRoles, householdControllers.getPendingInvites)
householdRoutes.post('/invites/:inviteId/accept', allowedRoles, householdControllers.acceptInvite)
householdRoutes.post('/invites/:inviteId/reject', allowedRoles, householdControllers.rejectInvite)
householdRoutes.delete('/members/me', allowedRoles, householdControllers.leaveHousehold)
householdRoutes.delete('/members/:userId', allowedRoles, householdControllers.removeMember)
householdRoutes.patch('/shared-cash', allowedRoles, householdControllers.setSharedCash)

householdRoutes.get('/recurring-expenses', allowedRoles, householdControllers.getRecurringExpenses)
householdRoutes.post('/recurring-expenses', allowedRoles, householdControllers.createRecurringExpense)
householdRoutes.put('/recurring-expenses/:recurringId', allowedRoles, householdControllers.updateRecurringExpense)
householdRoutes.delete('/recurring-expenses/:recurringId', allowedRoles, householdControllers.deleteRecurringExpense)
householdRoutes.get('/recurring-expenses/:recurringId/rent-adjustment', allowedRoles, householdControllers.getRentAdjustment)
householdRoutes.post('/recurring-expenses/:recurringId/rent-adjustment', allowedRoles, householdControllers.applyRentAdjustment)

export default householdRoutes
