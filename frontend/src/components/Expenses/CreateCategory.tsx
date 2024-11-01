import React, { useState } from "react";
import useAuth from "../../hooks/useAuth";
import { useAxiosPrivate } from "../../hooks/useAxiosPrivate";
import { Button, Form, FormControl, FormLabel, Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from "react-bootstrap";

function CreateCategory() {
    
    const { auth } = useAuth();
    const axiosPrivate = useAxiosPrivate();
    const [name, setName] = useState<string>("")
    const [show, setShow] = useState<boolean>(false)
    const handleClose = () => setShow(false)
    const handleShow = () => setShow(true);

    const addNewCategory = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        try {
            const response = await axiosPrivate.post(`/${auth.id}/categories`, JSON.stringify({name}),
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    withCredentials: true
                });
            console.log(JSON.stringify(response.data))
            console.log(JSON.stringify(response))
            
        } catch (err) {
            console.log('Error en el componente CreateCategory', err)
        }
    }

    return (
        <>
            <Button variant="outline-dark" className="mx-2" onClick={handleShow}>Crea una categoria</Button>
            <Modal show={show} onHide={handleClose} size="sm">
                <ModalHeader closeButton>
                    <ModalTitle>Agrega una categoria de gasto</ModalTitle>
                </ModalHeader>
                <ModalBody>
                    <Form onSubmit={(e) => addNewCategory(e)}>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl
                            type="text"
                            placeholder="Categoria"
                            name="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mb-2"
                            required>   
                        </FormControl>
                        <ModalFooter>
                            <Button variant="secondary" size="sm" onClick={handleClose}>Cerrar</Button>
                            <Button variant="success" size="sm" type="submit" onClick={handleClose}>Agregar categoria</Button>
                        </ModalFooter>
                    </Form>
                </ModalBody>
            </Modal>
        </>
    )
}
export default CreateCategory