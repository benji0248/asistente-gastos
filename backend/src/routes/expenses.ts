import { Router } from "express";
import expenseControllers from "../controllers/expenseControllers";
import { verifyRoles } from "../controllers/verifyRoles";
import { ROLES_LIST } from "../config/role_list";

const expensesRoutes = Router({mergeParams:true});

expensesRoutes.get('/available-months', verifyRoles(ROLES_LIST.admin, ROLES_LIST.editor, ROLES_LIST.user), expenseControllers.availableMonthInExpenses)
expensesRoutes.get('/:month/:year', verifyRoles(ROLES_LIST.admin, ROLES_LIST.editor, ROLES_LIST.user), expenseControllers.getExpensesByDate)
expensesRoutes.get('/', verifyRoles(ROLES_LIST.admin, ROLES_LIST.editor, ROLES_LIST.user), expenseControllers.getExpenses)
expensesRoutes.get('/:expenseId', verifyRoles(ROLES_LIST.admin, ROLES_LIST.editor, ROLES_LIST.user), expenseControllers.getExpense)
expensesRoutes.post('/', verifyRoles(ROLES_LIST.admin, ROLES_LIST.editor, ROLES_LIST.user), expenseControllers.addExpense)
expensesRoutes.put('/:expenseId', verifyRoles(ROLES_LIST.admin, ROLES_LIST.editor, ROLES_LIST.user), expenseControllers.updateExpense)
expensesRoutes.delete('/:expenseId', verifyRoles(ROLES_LIST.admin, ROLES_LIST.editor, ROLES_LIST.user), expenseControllers.deleteExpense)
expensesRoutes.put('/:expenseId/complete', verifyRoles(ROLES_LIST.admin, ROLES_LIST.editor, ROLES_LIST.user), expenseControllers.completePaidExpense)

export default expensesRoutes;