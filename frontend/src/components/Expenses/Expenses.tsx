import { useEffect, useState } from 'react'
import { ExpenseTable } from './ExpenseTable';
import 'bootstrap/dist/css/bootstrap.min.css';
import { EXPENSE_FILTERS } from '../../consts'
import { FilterValue, listOfExpenses } from '../../types';
import { ExpenseHeader } from './ExpenseHeader';
import { useAxiosPrivate } from '../../hooks/useAxiosPrivate';
import useAuth from '../../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';

function Expenses() {

  const { auth } = useAuth()
  const [expenses, setExpenses] = useState<listOfExpenses>([]);
  const [filterSelected, setFilterSelected] = useState<FilterValue>(EXPENSE_FILTERS.ALL)
  const axiosPrivate = useAxiosPrivate();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const getExpenses = async () => {
      try {
        const response = await axiosPrivate.get(`/${auth.id}/expenses`, {
          signal: controller.signal
        });
        console.log(response.data)
        isMounted && setExpenses(response.data)
      } catch (err: any) {
        console.log(err)
        if(err.code === 'ERR_CANCELED') {
          console.log('aborted')
        } else {
          navigate('/login', { state: { from: location }, replace: true });
        }
      }
    }
    getExpenses();
    return () => {
      isMounted = false;
      controller.abort();
    }
  }, [])


  const handleFilterChange = (filter: FilterValue): void => {
    setFilterSelected(filter)
  }

  const activeCount = expenses.filter(expense => expense.paid).length
  const completedCount = expenses.length - activeCount

  const filteredAndSortExpenses = (): listOfExpenses => {
    
    let filteredExpenses = expenses.filter(expense => {
    
      if (filterSelected === EXPENSE_FILTERS.ALL) return true
      /* if (filterSelected === EXPENSE_FILTERS.ALQUILER && filterSelected === expense.type) return true
      if (filterSelected === EXPENSE_FILTERS.COMIDA && filterSelected === expense.type) return true
      if (filterSelected === EXPENSE_FILTERS.SUPER && filterSelected === expense.type) return true
      if (filterSelected === EXPENSE_FILTERS.PAID && expense.paid === true) return true
      if (filterSelected === EXPENSE_FILTERS.UNPAID && expense.paid === false) return true
      if (filterSelected === EXPENSE_FILTERS.ROPA && filterSelected === expense.type) return true
      if (filterSelected === EXPENSE_FILTERS.SERVICIOS && filterSelected === expense.type) return true
      if (filterSelected === EXPENSE_FILTERS.GYM && filterSelected === expense.type) return true */
      return false;
    });

    filteredExpenses.sort((a, b) => {
      if (a.paid !== b.paid) {
        return a.paid ? 1 : -1;
      } 
      const aDate = a.createdDate?.toDate().getTime() || 0;
      const bDate = b.createdDate?.toDate().getTime() || 0;
      return bDate - aDate;
    })
    return filteredExpenses;
  }
  const filteredExpenses = filteredAndSortExpenses();


  return (
    
    <>
      { <ExpenseHeader
        activeCount={activeCount}
        completedCount={completedCount}
        filterSelected={filterSelected}
        onClearCompleted={() => { }}
        handleFilterChange={handleFilterChange}
        expenses={filteredExpenses}
      /> }
      <ExpenseTable
        expenses={filteredExpenses}
      />
     </>
    
  )
}

export default Expenses
 