export function formatMoney(amount: number): string {
  if (!Number.isFinite(amount)) return "0"

  return amount.toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

export function formatMoneyInput(amount: number): string {
  return amount > 0 ? formatMoney(amount) : ""
}

export function normalizeMoneyInput(value: string): string {
  const normalized = value.replace(/\./g, ",").replace(/[^\d,-]/g, "")
  const [integerPart, ...decimalParts] = normalized.split(",")
  const decimalPart = decimalParts.join("")

  if (decimalParts.length === 0) return integerPart

  return `${integerPart},${decimalPart.slice(0, 2)}`
}

export function parseMoneyInput(value: string): number {
  const cleaned = value.trim().replace(/[^\d,.-]/g, "")

  if (!cleaned) return 0

  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned

  const parsed = Number.parseFloat(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return "—"
  const sign = value > 0 ? "+" : ""
  return `${sign}${value.toFixed(1)}%`
}
