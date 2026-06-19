import type { StoredCreditCardStatement } from "@/lib/creditCardStatementsApi"

export function statementTabLabel(
  stored: StoredCreditCardStatement,
  authId: string | undefined,
  isLinked: boolean,
  getOwnerName: (userId?: string | null) => string
): string {
  const card = [stored.statement.cardBrand, stored.statement.cardTier]
    .filter(Boolean)
    .join(" ")
  const isOwn = stored.userId === authId

  if (isLinked) {
    return isOwn
      ? `Mi ${card || "tarjeta"}`
      : `@${getOwnerName(stored.userId)}`
  }

  return card || "Mi resumen"
}
