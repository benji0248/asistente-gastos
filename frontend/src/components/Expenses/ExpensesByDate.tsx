import { useEffect, useState } from "react"
import { listOfExpenses } from "../../types"
import { useAxiosPrivate } from "../../hooks/useAxiosPrivate"
import useAuth from "../../hooks/useAuth"
import dayjs from 'dayjs'


export const ExpensesByDate = () => {
    const [expenses, setExpenses] = useState<listOfExpenses>([])
    const [selectedMonth, setSelectedMonth] = useState('')
    const [selectedYear, setSelectedYear] = useState('')
    const [availableMonths, setAvailableMonths] = useState([])
    const axiosPrivate = useAxiosPrivate();
    const { auth } = useAuth();

    useEffect(() => {
        const fetchAvailableMonths = async () => {
            try {
                const response = await axiosPrivate.get(`/${auth.id}/available-months`);
                setAvailableMonths(response.data);

                const currentMonth = dayjs().format('MM');
                const currentYear = dayjs().format('YYYY');

                const currentMonthExists = response.data.find(
                    (item:any) => item.month === currentMonth && item.year === currentYear
                );

                if (currentMonthExists) {
                    setSelectedMonth(currentMonth);
                    setSelectedYear(currentYear);
                } else if(response.data.length > 0) {
                    setSelectedMonth(response.data[0].month);
                    setSelectedYear(response.data[0].year);
                }
            } catch (err) {
                console.error('Error al obtener los meses disponibles', err)
            }
        };
        fetchAvailableMonths();
    }, []);

    useEffect(() => {
        if (selectedMonth && selectedYear) {
            const fetchExpenses = async () => {
                try {
                    const response = await axiosPrivate.get(`/${auth.id}/expenses/${selectedMonth}/${selectedYear}`);
                    setExpenses(response.data);
                } catch (err) {
                    console.error('Error al obtener los gastos', err)
                }
            }
            fetchExpenses();
        }
    }, [selectedMonth, selectedYear]);

    return (
        <>
        </>
    )
}