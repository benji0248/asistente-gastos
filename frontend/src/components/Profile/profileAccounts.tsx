import { Account, listOfAccounts } from "../../types"
import { AddFounds } from "./addFounds"
import { EditFounds } from "./editFounds"
import { TransferFounds } from "./transferFounds"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Props {
  account: Account
  listOfAccounts: listOfAccounts
}

export const ProfileAccounts = ({ account, listOfAccounts }: Props) => {
  const accountTypeLabel =
    account.type === "bank_account"
      ? "Cuenta Bancaria"
      : account.type === "virtual_wallet"
        ? "Billetera Virtual"
        : ""

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>{account.description}</CardTitle>
          {accountTypeLabel && (
            <Badge variant="outline" className="mt-2">
              {accountTypeLabel}
            </Badge>
          )}
        </div>
        <p className="text-xl font-semibold text-primary">
          ${account.balance}
        </p>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <AddFounds account={account} />
        <EditFounds account={account} />
        <TransferFounds account={account} listOfAccounts={listOfAccounts} />
      </CardContent>
    </Card>
  )
}
