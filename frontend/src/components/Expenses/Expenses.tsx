import { useEffect, useState } from 'react'
import { ExpenseTable } from './ExpenseTable';
import 'bootstrap/dist/css/bootstrap.min.css';
import { listOfAccounts, listOfCategories, listOfExpenses } from '../../types';
import { ExpenseHeader } from './ExpenseHeader';
import { useAxiosPrivate } from '../../hooks/useAxiosPrivate';
import useAuth from '../../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';

function Expenses() {

  const { auth } = useAuth()
  const [expenses, setExpenses] = useState<listOfExpenses>([]);
  const [filterSelected, setFilterSelected] = useState<string | undefined>("")
  const [categories, setCategories] = useState<listOfCategories>([])
  const [accounts, setAccounts] = useState<listOfAccounts>([])
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
        isMounted && setExpenses(response.data)
      } catch (err: any) {
        if(err.code === 'ERR_CANCELED') {
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
  }, [expenses])

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const getCategories = async () => {
      try {
        const response = await axiosPrivate.get(`/${auth.id}/categories`, {
          signal: controller.signal
        });
        isMounted && setCategories(response.data)
      } catch (err: any) {
        if(err.code === 'ERR_CANCELED') {
        } else {
          navigate('/login', { state: { from: location }, replace: true });
        }
      }
    }
    getCategories();
    return () => {
      isMounted = false;
      controller.abort();
    }
  }, [categories])

  useEffect(() => {
    let isMounted = true
    const controller = new AbortController();
    const getAccounts = async () => {
      try{
        const response = await axiosPrivate.get(`/${auth.id}/accounts`, {
          signal: controller.signal
        })
        isMounted && setAccounts(response.data)
      }catch(err:any) {
        if (err.code === 'ERR_CANCELED') {
        
        }
      }
    }
    getAccounts();
    return () => {
      isMounted = false;
      controller.abort();
    }
  }, [])


  const handleFilterChange = (categoryId: string | undefined): void => {
    setFilterSelected(categoryId)
  }

  const activeCount = expenses.filter(expense => expense.is_paid).length
  const completedCount = expenses.length - activeCount

  const filteredExpenses = filterSelected
    ? expenses.filter((expense) => expense.category_id === filterSelected)
    : expenses;

/*     filteredExpenses.sort((a, b) => {
      if (a.is_paid !== b.is_paid) {
        return a.is_paid ? 1 : -1;
      } 
      const aDate = a.created_at?.toDate().getTime() || 0;
      const bDate = b.created_at?.toDate().getTime() || 0;
      return bDate - aDate;
      return filteredExpenses;
    }) */
    

  return (
    
    <>
      { <ExpenseHeader
        activeCount={activeCount}
        completedCount={completedCount}
        filterSelected={filterSelected}
        onClearCompleted={() => { }}
        handleFilterChange={handleFilterChange}
        expenses={filteredExpenses}
        categories={categories}
      /> }
      <ExpenseTable
        expenses={filteredExpenses}
        categories={categories}
        accounts={accounts}
      />
     </>
    
  )
}

export default Expenses
 