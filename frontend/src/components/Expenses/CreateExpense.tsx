import React, { useState } from "react"
import { Button, Form, Modal, ModalBody, ModalHeader, ModalTitle } from "react-bootstrap";
import { actualDate } from "../../consts";
import { addExpense } from "../../lib/controller";
import { Timestamp } from "firebase/firestore";

function CreateExpense() {

    const [title, setTitle] = useState<string>("")
    const [amount, setAmount] = useState<number>(0)
    const [type, setType] = useState<string>("")
    const [createdDate, setCreatedDate] = useState<Timestamp>()
    const [paidDate, setPaidDate] = useState<Timestamp>()
    const [paidMethod, setPaidMethod] = useState<string>("")
    const [paid, setPaid] = useState<boolean>(false)
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => {
        setShow(true)
        const date = actualDate();
        setCreatedDate(date);
        setPaidDate(date);
    };

    const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value === 'true';
        setPaid(value);
    }

    const hanldeAmountChange = (e:string) =>{
        const value = e;
        if (value === '') {
            setAmount(0)
        } else {
            setAmount(parseFloat(value))
        }
    }
    
    const addNewExpense = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        addExpense({title, amount, type, createdDate, paidDate, paidMethod, paid})
    }

    return (
        <>
        <Button variant="warning" onClick={handleShow} size="sm" className="ms-2">Agregar Gasto</Button>
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
                            onChange={(e) =>  hanldeAmountChange(e.target.value)}
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
                            <option value="uber">Uber</option>
                            <option value="compras">Compras</option>
                            <option value="sube">Sube</option>
                            <option value="envios">Envio de Plata</option>
                            <option value="varios">Varios</option>
                        </Form.Select>
                        <Form.Label>Pagado</Form.Label>
                        <br />
                        <Form.Check inline label="Si" name='paid' value={'true'} checked={paid === true} onChange={handleRadioChange} type='radio' required/>
                        <Form.Check inline label="No" name='paid' value={'false'} checked={paid === false} onChange={handleRadioChange} type='radio' required/>
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
                            <Button variant='success' size='sm' type='submit' onClick={handleClose}>Agregar Gasto</Button>
                        </Modal.Footer>
                </Form>
            </ModalBody>
        </Modal>
        </>
    )
}

export default CreateExpense;