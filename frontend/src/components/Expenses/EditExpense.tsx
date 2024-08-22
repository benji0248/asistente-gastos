import React, { useState } from "react"
import { Button, Form, Modal, ModalBody, ModalHeader, ModalTitle } from "react-bootstrap";
import { actualDate } from "../../consts";
import { Timestamp } from "firebase/firestore";
import { Expense } from "../../types";
import { updateExpense } from "../../lib/controller";
import { FaEdit } from "react-icons/fa";

interface Props{
    expense: Expense
}

export const EditExpense: React.FC<Props> = ({ expense }) => {

    const editCurrentExpense = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const newExpense = {id, title, amount, type, createdDate, paidDate, paidMethod, paid}
        updateExpense(expense.id,newExpense)
    }

    const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value === 'true';
        setPaid(value);
    }

    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => {
        setShow(true);
        const date = actualDate();
        setPaidDate(date);
        setCreatedDate(expense.createdDate)
    }
    const id = (expense.id);
    const [title, setTitle] = useState<string>(expense.title)
    const [amount, setAmount] = useState<number>(expense.amount)
    const [type, setType] = useState<string>(expense.type)
    const [createdDate, setCreatedDate] = useState<Timestamp>()
    const [paidDate, setPaidDate] = useState<Timestamp>()
    const [paidMethod, setPaidMethod] = useState<string>(expense.paidMethod)
    const [paid, setPaid] = useState<boolean>(expense.paid)

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
                            <option value="alquiler">Alquiler</option>
                            <option value="servicios">Servicios</option>
                            <option value="comida">Comida</option>
                            <option value="super">Super</option>
                            <option value="ropa">Ropa</option>
                            <option value="gym">Gym</option>
                        </Form.Select>
                        <Form.Label>Pagado</Form.Label>
                        <br />
                        <Form.Check inline label="Si" name='paid' value={'true'} checked={paid === true ? true : false} onChange={handleRadioChange} type='radio' required/>
                        <Form.Check inline label="No" name='paid' value={'false'} checked={paid === true ? false : true} onChange={handleRadioChange} type='radio' required/>
                        <br/>
                        <Form.Label>Metodo de Pago</Form.Label>
                        <Form.Select className="mt-1" aria-label="type-expense" name='bucket' value={paidMethod} onChange={(e) => setPaidMethod(e.target.value)} required>
                            <option>Elija el metodo de pago</option>
                            <option value="efectivo">Efectivo</option>
                            <option value="banco">Transferencia</option>
                            <option value="mercadoPago">Mercado Pago</option>
                            <option value="debito">Tarjeta de Debito</option>
                            <option value="credito">Tarjeta de Credito</option>
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
