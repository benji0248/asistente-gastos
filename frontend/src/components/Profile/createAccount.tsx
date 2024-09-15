import React, { useEffect, useState } from "react";
import useAuth from "../../hooks/useAuth";
import { useAxiosPrivate } from "../../hooks/useAxiosPrivate";
import { Button, Form, FormControl, FormGroup, FormLabel, FormSelect, Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from "react-bootstrap";

function CreateAccount() {

    const { auth } = useAuth();
    const [show, setShow] = useState<boolean>(false)
    const [type, setType] = useState<string>("")
    const [balance, setBalance] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const axiosPrivate = useAxiosPrivate();
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    const addNewAccount = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const newAccountData = {
            type: type,
            balance: balance,
            description: description
        }
    }
    
    return (
        <>
            <Button variant="warning" size="sm" onClick={handleShow}>Agrega una fuente de fondos</Button>
            <Modal show={show} onHide={handleClose} size="sm">
                <ModalHeader closeButton>
                    <ModalTitle>Agregar fuente de fondos </ModalTitle>
                </ModalHeader>
                <ModalBody>
                    <Form onSubmit={(e) => addNewAccount(e)}>
                        <FormGroup className="mb-3">
                            <FormLabel>Fuente de fondos</FormLabel>
                            <FormSelect className="mt-1" aria-label="type-account" name="type" value={type} onChange={(e) => setType(e.target.value)} required>
                                <option>Elija una fuente de fondos</option>
                                <option value="bank_account">Cuenta Bancaria</option>
                                <option value="virtual_walltet">Billetera Virtual</option>
                            </FormSelect>
                            <FormLabel className="mt-2">Cuenta</FormLabel>
                            <FormControl
                                type="text"
                                placeholder="Nombre de la cuenta"
                                name="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="mb-1"
                                required>
                            </FormControl>
                            <FormLabel>Dinero en cuenta</FormLabel>
                            <FormControl
                                type="text"
                                placeholder="0"
                                name="balance"
                                value={balance} onChange={(e) => setBalance(e.target.value)}
                                className="mb-1"
                                required>
                            </FormControl>
                        </FormGroup>
                    </Form>
                </ModalBody>
                <ModalFooter>
                    <Button variant="secondary" size="sm" onClick={handleClose}>Cerrar</Button>
                    <Button variant="success" size="sm" type="submit" onClick={handleClose}>Agregar fuente de fondos</Button>
                </ModalFooter>

            </Modal>
        </>
    )
}

export default CreateAccount;
