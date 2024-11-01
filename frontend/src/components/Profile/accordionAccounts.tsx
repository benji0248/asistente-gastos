import React from "react";
import { Account } from "../../types";

interface Props{
    account: Account
}

export const AccordionAccounts: React.FC<Props> = ({ account }) => {
    
    return (
        <p>
            <span className="fs-4 mx-4 ">{account.description}</span><span className="balanceAccount fs-4">${account.balance}</span>
        </p>
    )
}