import { useEffect, useState } from 'react'
import { ExpenseTable } from './ExpenseTable';
import 'bootstrap/dist/css/bootstrap.min.css';
import { listOfAccounts, listOfCategories, listOfExpenses } from '../../types';
import { ExpenseHeader } from './ExpenseHeader';
import { useAxiosPrivate } from '../../hooks/useAxiosPrivate';
import useAuth from '../../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from 'react-bootstrap';
import dayjs from 'dayjs'

function Expenses() {

  const { auth } = useAuth()
  const [expenses, setExpenses] = useState<listOfExpenses>([]);
  const [filterSelected, setFilterSelected] = useState<string | undefined>('all')
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'unpaid'>('all')
  const [categories, setCategories] = useState<listOfCategories>([])
  const [accounts, setAccounts] = useState<listOfAccounts>([])
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [availableMonths, setAvailableMonths] = useState([])
  const axiosPrivate = useAxiosPrivate();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const getExpenses = async () => {
      if (selectedMonth && selectedYear) {
        try {
          const response = await axiosPrivate.get(`/${auth.id}/expenses/${selectedMonth}/${selectedYear}`, {
            signal: controller.signal
          });
          isMounted && setExpenses(response.data)
        } catch (err: any) {
          if (err.code === 'ERR_CANCELED') {
          } else {
            navigate('/login', { state: { from: location }, replace: true });
          }
        }
      }
    }
    getExpenses();
    return () => {
      isMounted = false;
      controller.abort();
    }
  }, [selectedMonth,selectedYear])

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

  const handleMonthSelect = (month: string, year: string) => {
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  const handleFilterChange = (categoryId: string | undefined): void => {
    setFilterSelected(categoryId)
  }
  const handlePaymentFilter = (key: 'all' | 'paid' | 'unpaid'): void => {
    console.log(key)
    console.log(paymentFilter)
    setPaymentFilter(key)
  }

  const activeCount = expenses.filter(expense => expense.is_paid).length
  const completedCount = expenses.length - activeCount

  const filteredExpenses = filterSelected
    ? expenses.filter((expense) => expense.category_id === filterSelected || filterSelected === 'all')
    : expenses;
  
  const filteredAndSortedExpenses = expenses
  
    .filter(expense => {
      if (paymentFilter === 'all') return true;
      if (paymentFilter === 'paid') return expense.is_paid;
      if (paymentFilter === 'unpaid') return !expense.is_paid;
      return true;
    })
    
    .filter(expense => filterSelected === 'all' || expense.category_id === filterSelected)
  
    .sort((a, b) => {
      
      if (a.is_paid && !b.is_paid) {
        return 1;
      } else if (!a.is_paid && b.is_paid) {
        return -1;
      } 
      const dateA = a.payment_date ? new Date(a.payment_date) : new Date(0);
      const dateB = b.payment_date ? new Date(b.payment_date) : new Date(0);

      return dateB.getTime() - dateA.getTime();
    });
  
  return (
    
    <Card className='mt-4'>
      { <ExpenseHeader
        completedCount={completedCount}
        filterSelected={filterSelected}
        onClearCompleted={() => { }}
        handleFilterChange={handleFilterChange}
        handlePaymentFilter={handlePaymentFilter}
        expenses={filteredExpenses}
        categories={categories}
        onMonthSelect={handleMonthSelect}
      /> }
      <ExpenseTable
        expenses={filteredAndSortedExpenses}
        categories={categories}
        accounts={accounts}
      />
     </Card>
    
  )
}

export default Expenses
 