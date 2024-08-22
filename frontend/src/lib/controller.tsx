import { addDoc, collection, deleteDoc, doc, getFirestore, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { newExpense, Expense } from "../types";

export const firestore = getFirestore(db);

/* Coleccion de Gastos */
export const expensesCollection = collection(firestore, 'expenses')
/* Coleccion de Usuarios */
export const userCollection = collection(firestore, 'users')

/* Agregar Gasto */
export const addExpense = async (expenseData: newExpense) => {
    const newExpense = await addDoc(expensesCollection, { ...expenseData });
    console.log(`El gasto se creo en ${newExpense.path}`)
}

/* Borrrar Gasto */
export const deleteExpese = async (id: string) => {
    const document = doc(firestore, `expenses/${id}`);
    await deleteDoc(document);
}

/* Editar Gasto */
export const updateExpense = async (id: string, docData: Expense) => {
    const getExpense = doc(firestore, `expenses/${id}`);
    await setDoc(getExpense, docData);
}