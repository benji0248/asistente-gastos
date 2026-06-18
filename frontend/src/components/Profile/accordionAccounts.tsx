import { listOfAccounts } from "../../types"
import useHousehold from "@/hooks/useHousehold"
import { Badge } from "@/components/ui/badge"

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
          className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-muted/30 px-4 py-3.5 transition-colors hover:bg-muted/50 min-w-0"
        >
          <div className="min-w-0">
            <span className="font-medium truncate min-w-0">{account.description}</span>
            {isLinked && (
              <Badge variant="secondary" className="ml-2">
                @{getOwnerName(account.user_id)}
              </Badge>
            )}
          </div>
          <span className="text-lg font-semibold text-foreground shrink-0">
            ${account.balance}
          </span>
        </div>
      ))}
    </div>
  )
}
