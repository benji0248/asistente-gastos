import { Button } from 'react-bootstrap';
import { Expense} from '../../types'
import { formattedDate } from '../../consts';
import useAuth from '../../hooks/useAuth';
import { useAxiosPrivate } from '../../hooks/useAxiosPrivate';
import { DeleteModalExpense } from '../Expenses/DeleteModalExpense';

interface Props{
    expense: Expense;
}

export const RecentExpenses: React.FC<Props> = ({ expense }) => {

    const { auth } = useAuth();
    const axiosPrivate = useAxiosPrivate();

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
                  {formattedDate(expense.payment_date) ? formattedDate(expense.payment_date) : 'Sin pagar'}  
            </td>
            <td><label className='capitalize-first'> {expense.title} </label>
            <DeleteModalExpense id={expense.id} title={expense.title}/></td>
            <td className='capitalize-first'><p>${expense.amount}</p>
            </td>
            </tr>
        </>
        
)    
}
