import { Button } from 'react-bootstrap';
import { Expense} from '../../types'
import { handleComplete } from '../../consts';
import { EditExpense } from './EditExpense';
import { DeleteModalExpense } from './DeleteModalExpense';

interface Props{
    expense: Expense
}

export const ExpenseTableItems: React.FC<Props> = ({ expense }) => {
    
    return (
        <>
        <tr key={expense.id}>
            <td>
                    <label className='capitalize-first'> {expense.title} </label>
                    <DeleteModalExpense id={expense.id} title={expense.title} />
                    <EditExpense expense={expense} />
            </td>
            <td><p>${expense.amount}</p></td>
            <td><p className='capitalize-first'>{expense.type}</p></td>
            <td className='capitalize-first'>{expense.paidMethod}<Button
                size='sm'
                className='ms-1 p-1'
                variant={expense.paid === false ? "success" : "secondary"}
                disabled={expense.paid === true}
                onClick={() => handleComplete(expense)}
                >
                {expense.paid === false ? "Pagar" : 'Pagado'}
            </Button>
            </td>
            </tr>
        </>
        
)    
}
