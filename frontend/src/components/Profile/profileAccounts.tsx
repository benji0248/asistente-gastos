import React from "react"
import { Account, listOfAccounts } from "../../types"
import { Button, Col, Container, Row } from "react-bootstrap"
import  {AddFounds}  from "./addFounds"
import { EditFounds } from "./editFounds"
import { TransferFounds } from "./transferFounds"


interface Props{
    account: Account
    listOfAccounts: listOfAccounts
}

export const ProfileAccounts: React.FC<Props> = ({account, listOfAccounts}) => {
    return (
        <Container className="profileContainer mt-4">
            <h2 className="mx-4 mt-4">{account.description}</h2>
            <p className="mx-4 fs-5 mb-4">{account.type === 'bank_account' ? 'Cuenta Bancaria' : account.type === 'virtual_wallet' ? 'Billetera Virtual' : ''}</p>
            <Row>
                <Col md={12}>
                    <p className="mx-4 fs-5 fontSizeAccount me-5">
                        Balance: ${account.balance}<AddFounds account={account}/><EditFounds account={account}/><TransferFounds account={account} listOfAccounts={listOfAccounts}/>
                    </p>
                </Col>
            </Row>
        </Container>
    )
}