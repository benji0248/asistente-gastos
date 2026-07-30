export function formatMoney(amount: number): string {
  if (!Number.isFinite(amount)) return "0"

  return amount.toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

/** Máscara fija para no filtrar la magnitud del monto. */
export const PRIVATE_MONEY_MASK = "$••••••"

export function formatPrivateMoney(
  amount: number,
  visible: boolean,
  options?: { prefix?: boolean }
): string {
  if (!visible) return PRIVATE_MONEY_MASK

  const formatted = formatMoney(amount)
  return options?.prefix === false ? formatted : `$${formatted}`
}

export function formatMoneyInput(amount: number): string {
  return amount > 0 ? formatMoney(amount) : ""
}

export function normalizeMoneyInput(value: string): string {
  const normalized = value.replace(/\./g, "").replace(/[^\d,-]/g, "")
  const isNegative = normalized.startsWith("-")
  const unsigned = normalized.replace(/-/g, "")
  const [rawIntegerPart, ...decimalParts] = unsigned.split(",")
  const integerPart = rawIntegerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  const decimalPart = decimalParts.join("")
  const sign = isNegative ? "-" : ""

  if (decimalParts.length === 0) return `${sign}${integerPart}`

  return `${sign}${integerPart},${decimalPart.slice(0, 2)}`
}

export function parseMoneyInput(value: string): number {
  const cleaned = value.trim().replace(/\./g, "").replace(/[^\d,-]/g, "")

  if (!cleaned) return 0

  const isNegative = cleaned.startsWith("-")
  const unsigned = cleaned.replace(/-/g, "")
  const [integerPart, ...decimalParts] = unsigned.split(",")
  const decimalPart = decimalParts.join("").slice(0, 2)
  const normalized = `${isNegative ? "-" : ""}${integerPart || "0"}${
    decimalParts.length > 0 ? `.${decimalPart}` : ""
  }`

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return "—"
  const sign = value > 0 ? "+" : ""
  return `${sign}${value.toFixed(1)}%`
}
