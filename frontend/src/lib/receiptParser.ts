import { Category } from "@/types"

export interface ReceiptParseResult {
  title: string
  amount: number
  categoryId?: string
  confidence: "high" | "medium" | "low"
  rawText: string
}

const TOTAL_KEYWORDS =
  /(?:total\s*(?:a\s*pagar|general|de\s*venta)?|importe|gran\s*total|amount\s*due|a\s*pagar|subtotal\s*final)/i

const SKIP_LINE =
  /^(RFC|CURP|CP\s*\d|Tel|Teléfono|Fecha|Hora|Cajero|Ticket|Folio|UUID|www\.|http|^\d{2}\/\d{2}\/\d{4}|^\d{2}-\d{2}-\d{4})/i

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  supermercado: [
    "WALMART",
    "SORIANA",
    "CHEDRAUI",
    "BODEGA",
    "COSTCO",
    "LA COMER",
    "HEB",
    "SUPER",
    "ABARROTES",
    "MINISUPER",
  ],
  comida: [
    "RESTAURANT",
    "RESTAURANTE",
    "STARBUCKS",
    "MCDONALD",
    "BURGER",
    "DOMINOS",
    "PIZZA",
    "TACO",
    "CAFE",
    "CAFÉ",
    "FOOD",
    "COMIDA",
    "VIPS",
    "SANBORNS",
  ],
  transporte: ["UBER", "DIDI", "TAXI", "METRO", "RUTA", "TRANSPORTE", "GASOLINERA", "PEMEX", "BP", "SHELL"],
  farmacia: ["FARMACIA", "SIMILARES", "GUADALAJARA", "BENAVIDES", "FARMACIAS"],
  conveniencia: ["OXXO", "7-ELEVEN", "7 ELEVEN", "EXTRA", "KIOSKO", "CIRCLE K"],
  servicios: ["CFE", "TELMEX", "TELCEL", "AT&T", "IZZI", "MEGACABLE", "AGUA"],
  entretenimiento: ["CINEPOLIS", "CINEMEX", "NETFLIX", "SPOTIFY", "STEAM"],
  ropa: ["ZARA", "H&M", "LIVERPOOL", "PALACIO", "C&A", "SEARS"],
}

function parseAmount(raw: string): number | null {
  const match = raw.match(/[\d][\d.,\s]*/)
  if (!match) return null

  let s = match[0].replace(/\s/g, "")
  if (!s) return null

  const lastComma = s.lastIndexOf(",")
  const lastDot = s.lastIndexOf(".")

  if (lastComma !== -1 && lastDot !== -1) {
    // Ej: 5.500,00 o 5,500.00 — el separador más a la derecha es el decimal
    if (lastComma > lastDot) {
      s = s.replace(/\./g, "").replace(",", ".")
    } else {
      s = s.replace(/,/g, "")
    }
  } else if (lastComma !== -1) {
    const afterComma = s.slice(lastComma + 1)
    if (/^\d{2}$/.test(afterComma)) {
      // Ej: 5500,00 → coma decimal
      s = s.slice(0, lastComma).replace(/\./g, "") + "." + afterComma
    } else {
      // Ej: 5,500 → coma como miles
      s = s.replace(/,/g, "")
    }
  } else if (lastDot !== -1) {
    const afterDot = s.slice(lastDot + 1)
    if (/^\d{2}$/.test(afterDot)) {
      // Ej: 5500.00 o 5.500.00
      s = s.slice(0, lastDot).replace(/,/g, "").replace(/\./g, "") +
        "." +
        afterDot
      // Re-handle multiple dots before decimal: 5.500.00
      const dotCount = (s.match(/\./g) ?? []).length
      if (dotCount > 1) {
        const parts = s.split(".")
        s = parts.slice(0, -1).join("") + "." + parts[parts.length - 1]
      }
    } else if (/^\d{3}$/.test(afterDot)) {
      // Ej: 5.500 → punto como miles
      s = s.replace(/\./g, "")
    } else {
      const parts = s.split(".")
      if (parts.length > 2) {
        s = parts.slice(0, -1).join("") + "." + parts[parts.length - 1]
      }
    }
  }

  const value = parseFloat(s)
  return Number.isFinite(value) && value > 0 ? value : null
}

function extractAllAmounts(text: string): number[] {
  const amounts: number[] = []
  const pattern = /[\$MXN]?\s*\d[\d.,\s]{0,12}\d|\$?\s*\d+[.,]\d{2}|\$?\s*\d+/gi
  let match: RegExpExecArray | null
  while ((match = pattern.exec(text)) !== null) {
    const value = parseAmount(match[0])
    if (value !== null && value < 1_000_000) amounts.push(value)
  }
  return amounts
}

function extractTotalAmount(lines: string[]): number | null {
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i]
    if (!TOTAL_KEYWORDS.test(line)) continue
    const sameLine = parseAmount(line.replace(TOTAL_KEYWORDS, ""))
    if (sameLine !== null) return sameLine
    if (i + 1 < lines.length) {
      const nextLine = parseAmount(lines[i + 1])
      if (nextLine !== null) return nextLine
    }
  }

  for (let i = lines.length - 1; i >= 0; i--) {
    if (TOTAL_KEYWORDS.test(lines[i])) {
      const amount = parseAmount(lines[i])
      if (amount !== null) return amount
    }
  }

  const amounts = extractAllAmounts(lines.join("\n"))
  if (amounts.length === 0) return null
  return Math.max(...amounts)
}

function extractMerchant(lines: string[]): string {
  for (const line of lines.slice(0, 8)) {
    const trimmed = line.trim()
    if (trimmed.length < 3 || trimmed.length > 60) continue
    if (SKIP_LINE.test(trimmed)) continue
    if (/^\d+$/.test(trimmed)) continue
    if (/^[\d\s\-\.\$]+$/.test(trimmed)) continue
    return trimmed
      .replace(/[^\w\sáéíóúñÁÉÍÓÚÑ&\-\.]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  }
  return "Gasto escaneado"
}

export function suggestCategory(text: string, categories: Category[]): string | undefined {
  const upper = text.toUpperCase()

  for (const category of categories) {
    const name = category.name.toUpperCase()
    if (name.length > 2 && upper.includes(name)) return category.id
  }

  for (const category of categories) {
    const catKey = category.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")

    for (const [ruleKey, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      const matchesRule =
        catKey.includes(ruleKey) || ruleKey.includes(catKey.split(" ")[0] ?? "")
      if (!matchesRule) continue
      if (keywords.some((kw) => upper.includes(kw))) return category.id
    }
  }

  for (const [, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (!keywords.some((kw) => upper.includes(kw))) continue
    const hit = keywords.find((kw) => upper.includes(kw))
    if (!hit) continue
    const fuzzy = categories.find((c) =>
      c.name.toLowerCase().includes(hit.toLowerCase().slice(0, 4))
    )
    if (fuzzy) return fuzzy.id
  }

  return undefined
}

export function parseReceiptText(
  rawText: string,
  categories: Category[] = []
): ReceiptParseResult {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  const amount = extractTotalAmount(lines)
  const title = extractMerchant(lines)
  const categoryId = suggestCategory(rawText, categories)

  let confidence: ReceiptParseResult["confidence"] = "low"
  if (amount !== null && title !== "Gasto escaneado") {
    confidence = categoryId ? "high" : "medium"
  } else if (amount !== null || title !== "Gasto escaneado") {
    confidence = "medium"
  }

  return {
    title,
    amount: amount ?? 0,
    categoryId,
    confidence,
    rawText,
  }
}
