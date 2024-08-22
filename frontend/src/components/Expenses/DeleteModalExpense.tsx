import React, { useState } from "react"
import { Button, Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from "react-bootstrap"
import { MdDelete } from "react-icons/md"
import { deleteExpese } from "../../lib/controller"

interface Props {
    id: string
    title: string
}

export const DeleteModalExpense: React.FC<Props> = ({ id, title }) => {

    const [show, setShow] = useState(false)
    const handleClose = () => setShow(false)
    const handleShow = () => setShow(true)

    const handleDelete = () => {
        deleteExpese(id);
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