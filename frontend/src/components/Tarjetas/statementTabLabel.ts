import type { StoredCreditCardStatement } from "@/lib/creditCardStatementsApi"

function cardDescription(stored: StoredCreditCardStatement): string {
  const card = [stored.statement.cardBrand, stored.statement.cardTier]
    .filter(Boolean)
    .join(" ")
  if (card) return card
  if (stored.fileName) return stored.fileName.replace(/\.pdf$/i, "")
  if (stored.statement.closingDate) return `Cierre ${stored.statement.closingDate}`
  return "Tarjeta"
}

export function statementTabLabel(
  stored: StoredCreditCardStatement,
  authId: string | undefined,
  isLinked: boolean,
  getOwnerName: (userId?: string | null) => string,
  options?: { indexAmongUser?: number; userStatementCount?: number }
): string {
  const description = cardDescription(stored)
  const isOwn = stored.userId === authId
  const needsSuffix =
    (options?.userStatementCount ?? 1) > 1 &&
    stored.statement.closingDate &&
    !stored.fileName

  const label = needsSuffix
    ? `${description} · ${stored.statement.closingDate}`
    : description

  if (options?.indexAmongUser != null && options.userStatementCount != null && options.userStatementCount > 1 && !stored.statement.cardBrand && !stored.fileName) {
    return isLinked
      ? isOwn
        ? `Mi resumen ${options.indexAmongUser + 1}`
        : `@${getOwnerName(stored.userId)} · Resumen ${options.indexAmongUser + 1}`
      : `Resumen ${options.indexAmongUser + 1}`
  }

  if (isLinked) {
    return isOwn ? `Mi ${label}` : `@${getOwnerName(stored.userId)} · ${label}`
  }

  return label
}

export function countStatementsByUser(
  statements: StoredCreditCardStatement[]
): Map<string, number> {
  const counts = new Map<string, number>()
  for (const s of statements) {
    counts.set(s.userId, (counts.get(s.userId) ?? 0) + 1)
  }
  return counts
}

export function indexAmongUserStatements(
  stored: StoredCreditCardStatement,
  statements: StoredCreditCardStatement[]
): number {
  const sameUser = statements
    .filter((s) => s.userId === stored.userId)
    .sort(
      (a, b) =>
        new Date(a.importedAt).getTime() - new Date(b.importedAt).getTime()
    )
  return sameUser.findIndex((s) => s.id === stored.id)
}
