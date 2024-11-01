import { useState } from "react"
import { Button, Form, FormControl, FormLabel, Modal, ModalBody, ModalFooter, ModalHeader } from "react-bootstrap"
import useAuth from "../../hooks/useAuth";
import { useAxiosPrivate } from "../../hooks/useAxiosPrivate";
import { Account } from "../../types";

interface Props {
    account: Account
}

export const AddFounds: React.FC<Props> = ({account}) => {
    
    const { auth } = useAuth();
    const account_id = account.id
    const axiosPrivate = useAxiosPrivate();
    const [show, setShow] = useState(false);
    const [amount, setAmount] = useState<number>(0)

    const handleClose = () => setShow(false)
    const handleShow = () => setShow(true)

    const handleAmountChange = (e:string) =>{
        const value = e;
        if (value === '') {
            setAmount(0)
        } else {
            setAmount(parseFloat(value))
        }
    }

    const addFounds = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        try {
            const response = await axiosPrivate.put(`/${auth.id}/accounts/${account_id}/add`, JSON.stringify({ amount }),
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    withCredentials: true
                });
                console.log(JSON.stringify(response.data))
                console.log(JSON.stringify(response))
        } catch (err) {
            console.log('Error en el componente AddFounds', err)
        }
    }

    return(
        <>
            <Button className="mb-2 ms-3" variant="outline-dark" onClick={handleShow}>Agregar Fondos</Button>
            <Modal show={show} onHide={handleClose} syze="sm">
                <ModalHeader>Agregar fondos a la cuenta</ModalHeader>
                <ModalBody>
                    <Form onSubmit={(e) => addFounds(e)}>
                        <FormLabel>Ingrese el dinero que desea agregar</FormLabel>
                        <FormControl
                            type="text"
                            placeholder="0"
                            name="amount"
                            value={amount}
                            onChange={(e) => handleAmountChange(e.target.value)}
                            required></FormControl>
                        <ModalFooter>
                            <Button variant="outline-secondary" size="sm" onClick={handleClose}>Cerrar</Button>
                            <Button variant="success" size="sm" type="submit" onClick={handleClose}>Agregar Fondos</Button>
                        </ModalFooter>
                    </Form>
                </ModalBody>
            </Modal>
        </>
    )
}