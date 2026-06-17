import { Account } from "../../types"

interface Props {
  account: Account
}

export const AccordionAccounts = ({ account }: Props) => {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
      <span className="font-medium">{account.description}</span>
      <span className="text-lg font-semibold text-primary">
        ${account.balance}
      </span>
    </div>
  )
}
