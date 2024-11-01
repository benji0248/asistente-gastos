import React, { useEffect, useState } from "react"
import { Button, Form, Modal, ModalBody, ModalHeader, ModalTitle } from "react-bootstrap";
import { actualDate } from "../../consts";
import useAuth from "../../hooks/useAuth";
import { useAxiosPrivate } from "../../hooks/useAxiosPrivate";
import { Account, Category } from "../../types";

export const CreateExpense = () => {

    const { auth } = useAuth();
    const [title, setTitle] = useState<string>("")
    const [amount, setAmount] = useState<number>(0)
    const [type, setType] = useState<string>("")
    const [createdDate, setCreatedDate] = useState<Date>()
    const [paidDate, setPaidDate] = useState<Date>()
    const [paidMethod, setPaidMethod] = useState<string>("")
    const [paid, setPaid] = useState<boolean>(false)
    const [show, setShow] = useState(false);
    const [category, setCategories] = useState<Category[]>([])
    const [accounts, setAccounts] = useState<Account[]>([])
    const axiosPrivate = useAxiosPrivate();
    const handleClose = () => setShow(false);
    const handleShow = () => {
        setShow(true)
        const date = actualDate();
        setCreatedDate(date);
    };

    useEffect(() => {
        axiosPrivate.get(`/${auth.id}/categories`).then(response => { setCategories(response.data) })
        .catch(error =>{console.error('Error fetching categories:', error)})
        axiosPrivate.get(`/${auth.id}/accounts`).then(response => { setAccounts(response.data) })
        .catch(error =>{console.error('Error fetching accounts:', error)})
    },[])

    const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value === 'true';
        setPaid(value);
    }

    const handleAmountChange = (e:string) =>{
        const value = e;
        if (value === '') {
            setAmount(0)
        } else {
            setAmount(parseFloat(value))
        }
    }
    
    const addNewExpense = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const newExpenseData = {
            title: title,
            amount: amount,
            payment_date: paidDate,
            is_paid: paid,
            user_id: auth.id,
            category_id: type,
            account_id: paidMethod
        }
        console.log(newExpenseData)
        try {
            const response = await axiosPrivate.post(`/${auth.id}/expenses`, JSON.stringify(newExpenseData),
            {
                headers: { 'Content-Type': 'application/json' },
                withCredentials: true
            });
            console.log(JSON.stringify(response.data));
            console.log(JSON.stringify(response))
        } catch (err) {
            console.log('Error en el componente CreateExpenses', err)
        }
    }

    return (
        <>
        <Button variant="outline-dark" onClick={handleShow} className="ms-2">Agregar Gasto</Button>
        <Modal show={show} onHide={handleClose} size="sm">
            <ModalHeader closeButton>
                <ModalTitle>Agrega un nuevo gasto</ModalTitle>
            </ModalHeader>
            <ModalBody>
                <Form onSubmit={(e) => addNewExpense(e)}>
                    <Form.Group className="mb-3">
                        <Form.Label>Gasto</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Ingrese el titulo o nombre del gasto"
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
                            placeholder="Ingrese el monto a pagar"
                            name='amount'
                            value={amount}
                            onChange={(e) =>  handleAmountChange(e.target.value)}
                            className="mb-1"
                            required
                            />
                        <Form.Label>Categoria</Form.Label>
                        <Form.Select aria-label="type-expense" className="mb-1" name='type' value={type} onChange={(e) => setType(e.target.value)} required>
                            <option>Elija la categoria del gasto</option>
                                {category.map(category => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                        </Form.Select>
                        <Form.Label>Pagado</Form.Label>
                        <br />
                        <Form.Check inline label="Si" name='paid' value={'true'} checked={paid === true} onChange={handleRadioChange} type='radio' required/>
                        <Form.Check inline label="No" name='paid' value={'false'} checked={paid === false} onChange={handleRadioChange} type='radio' required/>
                        <br/>
                        <Form.Label>Metodo de Pago</Form.Label>
                        <Form.Select className="mt-1" aria-label="type-expense" name='paidMethod' value={paidMethod} onChange={(e) => setPaidMethod(e.target.value)} required>
                            <option>Elija el metodo de pago</option>
                            {accounts.map(account => (
                                    <option key={account.id} value={account.id}>
                                        {account.description}
                                    </option>
                                ))}
                        </Form.Select>
                        </Form.Group>
                        <Modal.Footer>
                            <Button variant='outline-secondary' size='sm' onClick={handleClose}>Cerrar</Button>
                            <Button variant='success' size='sm' type='submit' onClick={handleClose}>Agregar Gasto</Button>
                        </Modal.Footer>
                        </Form>
                        </ModalBody>
                        
        </Modal>
        </>
    )
}