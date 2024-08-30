import { Router } from "express";
import expenseControllers from "../controllers/expenseControllers";

const expensesRoutes = Router({mergeParams:true});

expensesRoutes.get('/', expenseControllers.getExpenses)
expensesRoutes.get('/:expenseId', expenseControllers.getExpense)
expensesRoutes.post('/', expenseControllers.addExpense)
expensesRoutes.put('/:expenseId', expenseControllers.updateExpense)
expensesRoutes.delete('/:expenseId', expenseControllers.deleteExpense) 

export default expensesRoutes;