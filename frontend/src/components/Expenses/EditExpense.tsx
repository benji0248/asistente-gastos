import React, { useEffect, useState } from "react"
import { Button, Form, Modal, ModalBody, ModalHeader, ModalTitle } from "react-bootstrap";
import { actualDate } from "../../consts";
import { Account, Category, Expense, listOfAccounts, listOfCategories } from "../../types";
import { FaEdit } from "react-icons/fa";
import useAuth from "../../hooks/useAuth";
import { axiosPrivate } from "../../api/axios";

interface Props{
    expense: Expense
    categories: listOfCategories
    accounts: listOfAccounts
}

export const EditExpense: React.FC<Props> = ({ expense, categories, accounts }) => {

    const { auth } = useAuth();
    const id = expense.id;
    const prevPaidMethod = expense.account_id
    const [title, setTitle] = useState<string>(expense.title)
    const [amount, setAmount] = useState<number>(expense.amount)
    const [type, setType] = useState<string>(expense.category_id)
    const [createdDate, setCreatedDate] = useState<Date>()
    const [paidDate, setPaidDate] = useState<Date>()
    const [paidMethod, setPaidMethod] = useState<string>(expense.account_id)
    const [paid, setPaid] = useState<boolean>(expense.is_paid)

    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => {
        setShow(true);
        const date = actualDate();
        setPaidDate(date);
        setCreatedDate(expense.created_at)
    }

    const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value === 'true';
        setPaid(value);
    }

    const editCurrentExpense = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const editedExpense = {
            id: id,
            title: title,
            amount: amount,
            payment_date: paidDate,
            is_paid: paid,
            user_id: auth.id,
            category_id: type,
            account_id: paidMethod
        }
        console.log(editedExpense)
        try {
            const response = await axiosPrivate.put(`/${auth.id}/expenses/${id}`, JSON.stringify(editedExpense),
                {
                    headers: { 'Content-Type': 'application/json' },
                    withCredentials: true
                });
            console.log(JSON.stringify(response.data));
            console.log(JSON.stringify(response))
        } catch (err) {
            console.log('Error en el componente EditExpenses', err)
        }
    }



    return (
        <>
        <Button variant="white" onClick={handleShow} size="sm"><FaEdit className="editIcon"/></Button>
        <Modal show={show} onHide={handleClose} size="sm">
            <ModalHeader closeButton>
                <ModalTitle>Editar Gasto</ModalTitle>
            </ModalHeader>
            <ModalBody>
                <Form onSubmit={(e) => editCurrentExpense(e)}>
                    <Form.Group className="mb-3">
                        <Form.Label>Gasto</Form.Label>
                        <Form.Control
                            type="text"
                            name='title'
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            autoFocus
                            required
                            className="mb-1"
                            />
                        <Form.Label>Monto</Form.Label>
                        <Form.Control
                            type="text"
                            name='amount'
                            value={amount}
                            onChange={(e) => setAmount(parseFloat(e.target.value))}
                            className="mb-1"
                            required
                            />
                        <Form.Label>Categoria</Form.Label>
                        <Form.Select aria-label="type-expense" className="mb-1" name='type' value={type} onChange={(e) => setType(e.target.value)} required>
                            <option>Elija la categoria del gasto</option>
                            {categories.map(category => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                        </Form.Select>
                        <Form.Label>Pagado</Form.Label>
                        <br />
                        <Form.Check inline label="Si" name='paid' value={'true'} checked={paid === true ? true : false} onChange={handleRadioChange} type='radio' required/>
                        <Form.Check inline label="No" name='paid' value={'false'} checked={paid === true ? false : true} onChange={handleRadioChange} type='radio' required/>
                        <br/>
                        <Form.Label>Metodo de Pago</Form.Label>
                        <Form.Select className="mt-1" aria-label="type-expense" name='bucket' value={paidMethod} onChange={(e) => setPaidMethod(e.target.value)} required>
                            <option>Elija el metodo de pago</option>
                            {accounts.map(account => (
                                    <option key={account.id} value={account.id}>
                                        {account.description}
                                    </option>
                                ))}
                        </Form.Select>
                        </Form.Group>
                        <Modal.Footer>
                            <Button variant='secondary' size='sm' onClick={handleClose}>Cerrar</Button>
                            <Button variant='warning' size='sm' type='submit' onClick={handleClose}>Editar Gasto</Button>
                        </Modal.Footer>
                </Form>
            </ModalBody>
        </Modal>
        </>
    )
}
