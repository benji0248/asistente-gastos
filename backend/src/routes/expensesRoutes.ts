import { Router } from "express";
import { addExpense, getExpenses, getExpense, updateExpense } from "../controllers/expenseControllers";

const expensesRoutes = Router();

expensesRoutes.get('/', getExpenses)
expensesRoutes.get('/:id', getExpense)
expensesRoutes.post('/', addExpense)
expensesRoutes.put('/:id', updateExpense)
/* expensesRoutes.delete('/:id', deleteExpense) */

export default expensesRoutes;