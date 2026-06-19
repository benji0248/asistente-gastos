import { listOfAccounts } from "../../types"
import useHousehold from "@/hooks/useHousehold"
import { Badge } from "@/components/ui/badge"
import { formatMoney } from "@/lib/formatMoney"

interface Props {
  accounts: listOfAccounts
}

export const AccordionAccounts = ({ accounts }: Props) => {
  const { isLinked, getOwnerName } = useHousehold()

  if (!accounts.length) {
    return (
      <p className="text-sm text-muted-foreground">No tenés cuentas cargadas.</p>
    )
  }

  return (
    <div className="space-y-2">
      {accounts.map((account) => (
        <div
          key={account.id}
          className="flex flex-col gap-2 rounded-xl border border-border/40 bg-muted/30 px-4 py-3.5 transition-colors hover:bg-muted/50 min-w-0 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
        >
          <div className="min-w-0">
            <span className="font-medium break-words">{account.description}</span>
            {isLinked && (
              <Badge variant="secondary" className="mt-1.5 sm:ml-2 sm:mt-0">
                @{getOwnerName(account.user_id)}
              </Badge>
            )}
          </div>
          <span className="text-base font-semibold text-foreground shrink-0 tabular-nums sm:text-lg">
            ${formatMoney(account.balance)}
          </span>
        </div>
      ))}
    </div>
  )
}
