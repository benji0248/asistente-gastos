import { User } from "lucide-react"
import useHousehold from "@/hooks/useHousehold"
import { Account, listOfAccounts } from "@/types"
import { formatMoney } from "@/lib/formatMoney"
import {
  getAccountTypeIcon,
  getAccountTypeLabel,
  isSharedCashAccount,
} from "@/lib/accountDisplay"
import { AddFounds } from "./addFounds"
import { EditFounds } from "./editFounds"
import { TransferFounds } from "./transferFounds"
import { cn } from "@/lib/utils"

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
  const TypeIcon = getAccountTypeIcon(account)
  const typeLabel = getAccountTypeLabel(account)
  const shared = isSharedCashAccount(account)
  const ownerName = getOwnerName(account.user_id)

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
      <div className="flex items-center gap-3 p-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted"
          title={typeLabel}
        >
          <TypeIcon className="h-4 w-4 text-muted-foreground" aria-hidden />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate text-sm font-medium">{account.description}</p>
            <p className="shrink-0 text-sm font-semibold tabular-nums">
              ${formatMoney(account.balance)}
            </p>
          </div>

          <div className="mt-0.5 flex items-center gap-2 text-muted-foreground">
            {isLinked && !shared && (
              <span className="inline-flex items-center gap-1 text-xs" title={`@${ownerName}`}>
                <User className="h-3 w-3" aria-hidden />
                <span className="truncate">@{ownerName}</span>
              </span>
            )}
            {shared && (
              <span className="text-xs" title={typeLabel}>
                Pool del hogar
              </span>
            )}
          </div>
        </div>
      </div>

      <div
        className={cn(
          "flex flex-wrap gap-1.5 border-t border-border/40 bg-muted/10 px-3 py-2",
          "[&>button]:h-7 [&>button]:px-2.5 [&>button]:text-xs"
        )}
      >
        <AddFounds account={account} onAccountsChange={onAccountsChange} compact />
        <EditFounds account={account} onAccountsChange={onAccountsChange} compact />
        <TransferFounds
          account={account}
          listOfAccounts={listOfAccounts}
          onAccountsChange={onAccountsChange}
          compact
        />
      </div>
    </div>
  )
}

export const ProfileAccounts = ({ accounts, onAccountsChange }: Props) => {
  if (!accounts.length) {
    return (
      <p className="text-sm text-muted-foreground">No tenés cuentas cargadas.</p>
    )
  }

  return (
    <div className="space-y-2">
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
