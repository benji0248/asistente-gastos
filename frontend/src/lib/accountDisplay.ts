import type { LucideIcon } from "lucide-react"
import {
  Building2,
  CreditCard,
  Smartphone,
  Users,
  Wallet,
} from "lucide-react"
import type { Account } from "@/types"

export function isSharedCashAccount(account: Account): boolean {
  return Boolean(account.household_id) && account.type === "cash"
}

export function isPersonalCashAccount(account: Account): boolean {
  return account.type === "cash" && !account.household_id
}

export function getAccountTypeIcon(account: Account): LucideIcon {
  if (isSharedCashAccount(account)) return Users

  switch (account.type) {
    case "bank_account":
      return Building2
    case "virtual_wallet":
      return Smartphone
    case "credit_card":
      return CreditCard
    case "cash":
    default:
      return Wallet
  }
}

export function getAccountTypeLabel(account: Account): string {
  if (isSharedCashAccount(account)) return "Efectivo compartido"

  switch (account.type) {
    case "bank_account":
      return "Cuenta bancaria"
    case "virtual_wallet":
      return "Billetera virtual"
    case "credit_card":
      return "Tarjeta de crédito"
    case "cash":
      return "Efectivo"
    default:
      return "Cuenta"
  }
}
