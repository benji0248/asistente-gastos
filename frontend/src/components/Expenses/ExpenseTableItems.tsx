import { Button } from 'react-bootstrap';
import { Expense, listOfAccounts, listOfCategories} from '../../types'
/* import { handleComplete } from '../../consts'; */
import { EditExpense } from './EditExpense';
import { DeleteModalExpense } from './DeleteModalExpense';
import { formattedDate } from '../../consts';
import useAuth from '../../hooks/useAuth';
import { useAxiosPrivate } from '../../hooks/useAxiosPrivate';

interface Props{
    expense: Expense;
    categoryMap: Map<string, string>;
    accountMap: Map<string, string>;
    categories: listOfCategories;
    accounts: listOfAccounts;
}

export const ExpenseTableItems: React.FC<Props> = ({ expense, categoryMap, accountMap, categories, accounts }) => {

    const { auth } = useAuth();
    const axiosPrivate = useAxiosPrivate();
    const categoryName = categoryMap.get(expense.category_id) || "Sin Categoria"
    const accountName = accountMap.get(expense.account_id) || "Sin tipo"

    const handleComplete = async () => {
        try {
            await axiosPrivate.put(`/${auth.id}/expenses/${expense.id}/complete`)
        } catch (err) {
            console.log('Error en el fetching handleComplete', err)
        }
    }

    return (
        <>
        <tr key={expense.id}>
            <td>
                    <label className='capitalize-first'> {expense.title} </label>
                    <DeleteModalExpense id={expense.id} title={expense.title} />
                    <EditExpense expense={expense} categories={categories} accounts={accounts} />
            </td>
            <td><p>${expense.amount}</p></td>
            <td><p className='capitalize-first'>{categoryName}</p></td>
            <td className='capitalize-first'>{accountName}<Button
                size='sm'
                className='ms-1 p-1'
                variant={Boolean(expense.is_paid )=== false ? "success" : "secondary"}
                disabled={Boolean(expense.is_paid) === true}
                onClick={() => handleComplete()}
                >
                {Boolean(expense.is_paid) === false ? "Pagar" : `Pagado ${formattedDate(expense.payment_date)}`}
            </Button>
            </td>
            </tr>
        </>
        
)    
}
