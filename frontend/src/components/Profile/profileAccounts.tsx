import { Account, listOfAccounts } from "../../types"
import useHousehold from "@/hooks/useHousehold"
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
  accounts: listOfAccounts
  onAccountsChange?: () => void
}

interface AccountCardProps {
  account: Account
  listOfAccounts: listOfAccounts
  onAccountsChange?: () => void
}

const ProfileAccountCard = ({
  account,
  listOfAccounts,
  onAccountsChange,
}: AccountCardProps) => {
  const { isLinked, getOwnerName } = useHousehold()
  const accountTypeLabel =
    account.type === "bank_account"
      ? "Cuenta Bancaria"
      : account.type === "virtual_wallet"
        ? "Billetera Virtual"
        : ""

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 min-w-0">
        <div className="min-w-0 flex-1">
          <CardTitle className="truncate">{account.description}</CardTitle>
          {accountTypeLabel && (
            <Badge variant="outline" className="mt-2">
              {accountTypeLabel}
            </Badge>
          )}
          {isLinked && (
            <Badge variant="secondary" className="mt-2 ml-2">
              @{getOwnerName(account.user_id)}
            </Badge>
          )}
        </div>
        <p className="text-xl font-semibold text-foreground shrink-0">
          ${account.balance}
        </p>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <AddFounds account={account} onAccountsChange={onAccountsChange} />
        <EditFounds account={account} onAccountsChange={onAccountsChange} />
        <TransferFounds
          account={account}
          listOfAccounts={listOfAccounts}
          onAccountsChange={onAccountsChange}
        />
      </CardContent>
    </Card>
  )
}

export const ProfileAccounts = ({ accounts, onAccountsChange }: Props) => {
  if (!accounts.length) {
    return (
      <p className="text-sm text-muted-foreground">No tenés cuentas cargadas.</p>
    )
  }

  return (
    <div className="space-y-4">
      {accounts.map((account) => (
        <ProfileAccountCard
          key={account.id}
          account={account}
          listOfAccounts={accounts}
          onAccountsChange={onAccountsChange}
        />
      ))}
    </div>
  )
}
