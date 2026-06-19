import { parseAmount } from "@/lib/receiptParser"
import { suggestCategory } from "@/lib/receiptParser"
import type { Category } from "@/types"
import dayjs from "dayjs"
import customParseFormat from "dayjs/plugin/customParseFormat"

dayjs.extend(customParseFormat)

export interface StatementInstallment {
  current: number
  total: number
}

export interface StatementConsumo {
  id: string
  date: string
  description: string
  amount: number
  currency: "ARS" | "USD"
  installment?: StatementInstallment
}

export interface UpcomingInstallmentMonth {
  month: string
  amount: number
}

export interface CreditCardStatement {
  bank: string
  cardBrand: string
  cardTier?: string
  accountNumber?: string
  holderName?: string
  closingDate: string
  dueDate: string
  totalBalanceArs: number
  totalBalanceUsd?: number
  minimumPayment: number
  importedAt: string
  fileName?: string
  consumos: StatementConsumo[]
  upcomingByMonth: UpcomingInstallmentMonth[]
}

export interface StatementAnalysis {
  cuotasEsteMes: StatementConsumo[]
  pagosUnicos: StatementConsumo[]
  cuotasFuturas: StatementConsumo[]
  totalCuotasEsteMes: number
  totalPagosUnicos: number
  totalCuotasFuturas: number
  totalConsumos: number
}

const CONSUMO_LINE =
  /^(\d{2}-[A-Za-z]{3}-\d{2})\s+(.+?)\s+([\d.]+,\d{2})$/

const INSTALLMENT_RE = /C\.(\d{1,2})\/(\d{1,2})/

function extractField(text: string, pattern: RegExp): string | undefined {
  const match = text.match(pattern)
  return match?.[1]?.trim()
}

function extractAmountField(text: string, pattern: RegExp): number | undefined {
  const raw = extractField(text, pattern)
  if (!raw) return undefined
  return parseAmount(raw) ?? undefined
}

function parseConsumoLine(line: string, index: number): StatementConsumo | null {
  const match = line.match(CONSUMO_LINE)
  if (!match) return null

  const [, date, rawDescription, amountRaw] = match
  const amount = parseAmount(amountRaw)
  if (!amount || amount <= 0) return null

  const installmentMatch = rawDescription.match(INSTALLMENT_RE)
  const currency: "ARS" | "USD" = /\bUSD\b/i.test(rawDescription) ? "USD" : "ARS"

  let description = rawDescription
    .replace(INSTALLMENT_RE, "")
    .replace(/\bUSD\b/gi, "")
    .replace(/\s+\d{6}\s*$/, "")
    .replace(/\s+/g, " ")
    .trim()

  if (!description) description = rawDescription.trim()

  return {
    id: `consumo-${index}-${date}-${amount}`,
    date,
    description,
    amount,
    currency,
    installment: installmentMatch
      ? {
          current: parseInt(installmentMatch[1], 10),
          total: parseInt(installmentMatch[2], 10),
        }
      : undefined,
  }
}

function extractConsumos(text: string): StatementConsumo[] {
  const consumos: StatementConsumo[] = []
  const normalized = text.replace(/\s+/g, " ")

  const startMatch = normalized.match(
    /Consumos\s+[A-Za-zÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑ\s]+?\s+FECHA/i
  )
  const startIdx = startMatch?.index ?? normalized.search(/Consumos\s+[A-Za-zÁÉÍÓÚÑ]/i)
  let endIdx = normalized.indexOf("TOTAL CONSUMOS", startIdx + 1)
  if (endIdx === -1) {
    endIdx = normalized.search(/Impuestos, cargos e intereses/i)
  }
  if (startIdx === -1) return consumos

  const section = normalized.slice(
    startIdx,
    endIdx === -1 ? undefined : endIdx
  )

  const linePattern =
    /(\d{2}-[A-Za-z]{3}-\d{2})\s+(.+?)\s+([\d.]+,\d{2})/g
  let match: RegExpExecArray | null
  let index = 0

  while ((match = linePattern.exec(section)) !== null) {
    const line = `${match[1]} ${match[2]} ${match[3]}`
    const consumo = parseConsumoLine(line, index++)
    if (consumo) consumos.push(consumo)
  }

  return consumos
}

function extractUpcomingByMonth(text: string): UpcomingInstallmentMonth[] {
  const normalized = text.replace(/\s+/g, " ")
  const sectionMatch = normalized.match(
    /(?:Total de )?[Cc]uotas a vencer\s+(.+?)(?:Tasas|En el presente cierre|Legales)/i
  )
  if (!sectionMatch) return []

  const months: UpcomingInstallmentMonth[] = []
  const pattern = /([A-Za-zÁÉÍÓÚÑ]+)\/(\d{2})\s*\$?\s*([\d.]+,\d{2})/g
  let match: RegExpExecArray | null

  while ((match = pattern.exec(sectionMatch[1])) !== null) {
    const amount = parseAmount(match[3])
    if (!amount || amount <= 0) continue
    months.push({
      month: `${match[1]}/${match[2]}`,
      amount,
    })
  }

  return months
}

export function parseBbvaDate(date: string): dayjs.Dayjs {
  return dayjs(date, "DD-MMM-YY")
}

export function formatBbvaDate(date: dayjs.Dayjs): string {
  return date.format("DD-MMM-YY")
}

export function generateFutureInstallments(
  consumo: StatementConsumo,
  dueDate: string
): StatementConsumo[] {
  if (!consumo.installment) return []

  const { current, total } = consumo.installment
  if (current >= total) return []

  const base = parseBbvaDate(dueDate)
  if (!base.isValid()) return []

  const futures: StatementConsumo[] = []

  for (let n = current + 1; n <= total; n++) {
    const monthsAhead = n - current
    futures.push({
      id: `${consumo.id}-cuota-${n}`,
      date: formatBbvaDate(base.add(monthsAhead, "month")),
      description: consumo.description,
      amount: consumo.amount,
      currency: consumo.currency,
      installment: { current: n, total },
    })
  }

  return futures
}

export function analyzeStatement(statement: CreditCardStatement): StatementAnalysis {
  const cuotasEsteMes = statement.consumos.filter((c) => c.installment)
  const pagosUnicos = statement.consumos.filter((c) => !c.installment)
  const cuotasFuturas = cuotasEsteMes.flatMap((c) =>
    generateFutureInstallments(c, statement.dueDate)
  )

  const sumArs = (items: StatementConsumo[]) =>
    items.filter((c) => c.currency === "ARS").reduce((acc, c) => acc + c.amount, 0)

  const totalCuotasEsteMes = sumArs(cuotasEsteMes)
  const totalPagosUnicos = sumArs(pagosUnicos)
  const totalCuotasFuturas = sumArs(cuotasFuturas)
  const totalConsumos = sumArs(statement.consumos)

  return {
    cuotasEsteMes,
    pagosUnicos,
    cuotasFuturas,
    totalCuotasEsteMes,
    totalPagosUnicos,
    totalCuotasFuturas,
    totalConsumos,
  }
}

export function parseBbvaStatement(
  rawText: string,
  fileName?: string
): CreditCardStatement | null {
  const normalized = rawText.replace(/\s+/g, " ")

  const totalBalanceArs = extractAmountField(
    normalized,
    /SALDO ACTUAL\s*\$\s*([\d.,]+)/i
  )
  const minimumPayment = extractAmountField(
    normalized,
    /PAGO M[IÍ]NIMO\s*\$\s*([\d.,]+)/i
  )
  const dueDate = extractField(normalized, /VENCIMIENTO ACTUAL\s*(\d{2}-[A-Za-z]{3}-\d{2})/i)
  const closingDate = extractField(normalized, /CIERRE ACTUAL\s*(\d{2}-[A-Za-z]{3}-\d{2})/i)

  if (!totalBalanceArs || !minimumPayment || !dueDate || !closingDate) {
    return null
  }

  const totalBalanceUsd = extractAmountField(
    normalized,
    /SALDO ACTUAL U\$S\s*([\d.,]+)/i
  )

  const cardMatch = normalized.match(
    /Visa\s+(\w+)\s+cuenta\s+(\d+)/i
  )
  const holderMatch = normalized.match(
    /Resumen\s+Visa[\s\S]*?([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]+?)\s+SANTIAGO/i
  )

  return {
    bank: "BBVA",
    cardBrand: "Visa",
    cardTier: cardMatch?.[1],
    accountNumber: cardMatch?.[2],
    holderName: holderMatch?.[1]?.trim(),
    closingDate,
    dueDate,
    totalBalanceArs,
    totalBalanceUsd,
    minimumPayment,
    importedAt: new Date().toISOString(),
    fileName,
    consumos: extractConsumos(rawText),
    upcomingByMonth: extractUpcomingByMonth(rawText),
  }
}

export function suggestConsumoCategory(
  consumo: StatementConsumo,
  categories: Category[]
): string | undefined {
  return suggestCategory(consumo.description, categories)
}

export function buildPaymentTitle(statement: CreditCardStatement): string {
  const card = [statement.cardBrand, statement.cardTier].filter(Boolean).join(" ")
  return `Pago resumen ${card} ${statement.bank}`
}
