import { useState } from "react"
import { Button, Form, FormControl, FormLabel, Modal, ModalBody, ModalFooter, ModalHeader } from "react-bootstrap"
import useAuth from "../../hooks/useAuth";
import { useAxiosPrivate } from "../../hooks/useAxiosPrivate";
import { Account, listOfAccounts } from "../../types";
import { FaCheck, FaTimes } from "react-icons/fa";

interface Props {
    account: Account
    listOfAccounts: listOfAccounts
}

export const TransferFounds: React.FC<Props> = ({account, listOfAccounts}) => {
    
    const { auth } = useAuth();
    const account_id = account.id
    const actualBalance = account.balance
    const axiosPrivate = useAxiosPrivate();
    const [show, setShow] = useState(false);
    const [amount, setAmount] = useState<number>(account.balance)
    const [accountToTransfer, setAccountToTransfer] = useState<string>("")
    const [validAmount, setValidAmount] = useState<boolean>(true)

    const handleClose = () => setShow(false)
    const handleShow = () => setShow(true)

    const handleAmountChange = (e:string) =>{
        const value = e;
        if (value === '') {
            setAmount(0)
        } else {
            setAmount(parseFloat(value))
        }
        if (amount > actualBalance) {
            setValidAmount(true)
        } else {
            setValidAmount(false)
        }
    }

    const addFounds = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        console.log(amount)
        try {
            const response = await axiosPrivate.put(`/${auth.id}/accounts/${account_id}/transfer`, JSON.stringify({ accountToTransfer, amount }),
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    withCredentials: true
                });
                console.log(JSON.stringify(response.data))
                console.log(JSON.stringify(response))
        } catch (err) {
            console.log('Error en el componente EditFounds', err)
        }
    }

    return(
        <>
            <Button className="mb-2 ms-3" variant="outline-dark" onClick={handleShow}>Transferir Fondos</Button>
            <Modal show={show} onHide={handleClose} syze="sm">
                <ModalHeader className="fs-2">Transferir Fondos</ModalHeader>
                <ModalBody>
                    <Form onSubmit={(e) => addFounds(e)}>
                        <FormLabel className="fs-3">{account.description}</FormLabel>
                        <FormControl
                            type="text"
                            value={String(account.balance)}
                            name="balance1"
                            title={account.description}
                            disabled></FormControl>
                        <FormLabel className="fs-4 my-3">Ingrese el monto a transferir</FormLabel>
                        <FormControl
                            type="text"
                            placeholder="0"
                            name="amount"
                            value={amount}
                            onChange={(e) => handleAmountChange(e.target.value)}
                            required
                        >
                        </FormControl>
                        <p className={amount > actualBalance ? 'instruccions' : 'offscreen'}>No puedes transferir esa cantidad porque no tienes ese dinero en la cuenta</p>
                        <Form.Select className="my-3 fs-5" aria-label="type-expense" name='paidMethod' value={accountToTransfer} onChange={(e) => setAccountToTransfer(e.target.value)} required>
                            <option>Elija una cuenta</option>
                            {listOfAccounts.map(account => (
                                    <option key={account.id} value={account.id}>
                                        {account.description}
                                    </option>
                                ))}
                        </Form.Select>
                        <ModalFooter>
                            <Button variant="outline-secondary" onClick={handleClose}>Cerrar</Button>
                            <Button variant="warning" type="submit" onClick={handleClose} className={amount > actualBalance ? 'disabled' : ''}>Transferir</Button>
                        </ModalFooter>
                    </Form>
                </ModalBody>
            </Modal>
        </>
    )
}