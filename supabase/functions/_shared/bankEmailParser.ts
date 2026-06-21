export interface CategoryRow {
  id: number
  name: string
  user_id: string
  is_enabled: boolean
  is_system: boolean
}

export interface BankEmailParseResult {
  title: string
  amount: number | null
  categoryId: number | null
  skipReason: string | null
}

const SKIP_PATTERNS =
  /\b(abono|deposito|depósito|transferencia|pago de tarjeta|pago tarjeta|nomina|nómina|spei recibido|recibiste|ingreso|devoluci[oó]n)\b/i

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

export function parseAmount(raw: string): number | null {
  const match = raw.match(/[\d][\d.,\s]*/)
  if (!match) return null

  let s = match[0].replace(/\s/g, "")
  if (!s) return null

  const lastComma = s.lastIndexOf(",")
  const lastDot = s.lastIndexOf(".")

  if (lastComma !== -1 && lastDot !== -1) {
    if (lastComma > lastDot) {
      s = s.replace(/\./g, "").replace(",", ".")
    } else {
      s = s.replace(/,/g, "")
    }
  } else if (lastComma !== -1) {
    const afterComma = s.slice(lastComma + 1)
    if (/^\d{2}$/.test(afterComma)) {
      s = s.slice(0, lastComma).replace(/\./g, "") + "." + afterComma
    } else {
      s = s.replace(/,/g, "")
    }
  } else if (lastDot !== -1) {
    const afterDot = s.slice(lastDot + 1)
    if (/^\d{2}$/.test(afterDot)) {
      s = s.slice(0, lastDot).replace(/,/g, "").replace(/\./g, "") + "." + afterDot
      const dotCount = (s.match(/\./g) ?? []).length
      if (dotCount > 1) {
        const parts = s.split(".")
        s = parts.slice(0, -1).join("") + "." + parts[parts.length - 1]
      }
    } else if (/^\d{3}$/.test(afterDot)) {
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

function suggestCategory(text: string, categories: CategoryRow[]): number | null {
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

  return null
}

function cleanTitle(raw: string): string {
  return raw
    .replace(/\s+/g, " ")
    .replace(/[^\w\sáéíóúñÁÉÍÓÚÑ&\-\.]/g, " ")
    .trim()
    .slice(0, 255)
}

function extractFromPatterns(text: string): { amount: number | null; title: string | null } {
  const normalized = text.replace(/\s+/g, " ")

  const compraMatch = normalized.match(
    /compra(?:ste)?[^$]*?(?:por\s+)?(?:\$|MXN\s*)?([\d.,]+)(?:\s+(?:en|con|a)\s+(.+?))?(?:\.|$|\n)/i
  )
  if (compraMatch) {
    const amount = parseAmount(compraMatch[1])
    const title = compraMatch[2] ? cleanTitle(compraMatch[2]) : null
    if (amount !== null) return { amount, title }
  }

  const cargoMatch = normalized.match(
    /cargo(?:\s+de|\s+por|\s+)?(?:\$|MXN\s*)?([\d.,]+)/i
  )
  if (cargoMatch) {
    const amount = parseAmount(cargoMatch[1])
    if (amount !== null) return { amount, title: null }
  }

  const montoMatch = normalized.match(/monto[:\s]+(?:\$|MXN\s*)?([\d.,]+)/i)
  if (montoMatch) {
    const amount = parseAmount(montoMatch[1])
    if (amount !== null) return { amount, title: null }
  }

  const amountPattern = /(?:\$|MXN\s*)[\d][\d.,\s]{0,12}\d|\$?\s*\d+[.,]\d{2}/gi
  let bestAmount: number | null = null
  let match: RegExpExecArray | null
  while ((match = amountPattern.exec(normalized)) !== null) {
    const value = parseAmount(match[0])
    if (value !== null && value < 1_000_000) {
      bestAmount = bestAmount === null ? value : Math.max(bestAmount, value)
    }
  }

  return { amount: bestAmount, title: null }
}

export function parseBankEmail(
  subject: string,
  body: string,
  categories: CategoryRow[] = []
): BankEmailParseResult {
  const combined = `${subject}\n${body}`.trim()

  if (SKIP_PATTERNS.test(combined)) {
    return {
      title: "",
      amount: null,
      categoryId: null,
      skipReason: "Movimiento no es un gasto (abono, transferencia, etc.)",
    }
  }

  const { amount, title: patternTitle } = extractFromPatterns(combined)

  if (amount === null) {
    return {
      title: "",
      amount: null,
      categoryId: null,
      skipReason: "No se detectó un monto válido",
    }
  }

  let title = patternTitle
  if (!title || title.length < 2) {
    const subjectClean = cleanTitle(subject)
    title =
      subjectClean.length >= 3 && !/^(alerta|aviso|notificaci)/i.test(subjectClean)
        ? subjectClean
        : "Movimiento bancario"
  }

  const categoryId = suggestCategory(combined, categories)

  return {
    title,
    amount,
    categoryId,
    skipReason: null,
  }
}

export function extractEmailAddress(fromHeader: string): string {
  const angleMatch = fromHeader.match(/<([^>]+)>/)
  if (angleMatch) return angleMatch[1].trim().toLowerCase()
  const emailMatch = fromHeader.match(/[\w.+-]+@[\w.-]+\.\w+/)
  return emailMatch ? emailMatch[0].toLowerCase() : fromHeader.trim().toLowerCase()
}

export function isSenderAllowed(fromHeader: string, allowedSenders: string[]): boolean {
  if (allowedSenders.length === 0) return false
  const email = extractEmailAddress(fromHeader)
  const domain = email.includes("@") ? email.split("@")[1] : email

  return allowedSenders.some((allowed) => {
    const normalized = allowed.trim().toLowerCase()
    if (!normalized) return false
    if (normalized.startsWith("@")) {
      return domain === normalized.slice(1) || domain.endsWith(normalized.slice(1))
    }
    return email === normalized || email.endsWith("@" + normalized) || domain === normalized
  })
}
