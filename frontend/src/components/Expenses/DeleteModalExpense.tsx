import React, { useState } from "react"
import { Button, Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from "react-bootstrap"
import { MdDelete } from "react-icons/md"
import { axiosPrivate } from "../../api/axios"
import useAuth from "../../hooks/useAuth"

interface Props {
    id: string
    title: string
}

export const DeleteModalExpense: React.FC<Props> = ({ id, title }) => {

    const { auth } = useAuth();
    const [show, setShow] = useState(false)
    const handleClose = () => setShow(false)
    const handleShow = () => {
        console.log(auth.id)
    console.log(id)
        setShow(true)
    }
    const handleDelete = async () => {
        try {
            const response = await axiosPrivate.delete(`/${auth.id}/expenses/${id}`,
                {
                    withCredentials: true
                    
                });
            
        } catch (err) {
            console.log('Error en el componente DeleteExpenses', err)
        }
        handleClose;
    }

    return (
        <>
            <Button size='sm' variant='white' onClick={handleShow}><MdDelete className="deleteIcon" /></Button>
            <Modal show={show} onHide={handleClose}>
                <ModalHeader closeButton>
                    <ModalTitle>Eliminar Gasto</ModalTitle>
                </ModalHeader>
                <ModalBody>
                    Estas seguro que quieres eliminar el gasto {title}?
                </ModalBody>
                <ModalFooter>
                    <Button variant="white" onClick={handleClose}>Cerrar</Button>
                    <Button variant="danger" onClick={handleDelete}>Borrar</Button>
                </ModalFooter>
            </Modal>
        </>
    )
}