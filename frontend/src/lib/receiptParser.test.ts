import { describe, expect, it } from "vitest"
import { parseAmount, parseReceiptText } from "./receiptParser"

describe("parseAmount", () => {
  it("parses Mexican decimal comma", () => {
    expect(parseAmount("1.234,56")).toBe(1234.56)
  })

  it("parses US-style decimal dot", () => {
    expect(parseAmount("$1,234.56")).toBe(1234.56)
  })

  it("parses thousands with dot separator", () => {
    expect(parseAmount("5.500,00")).toBe(5500)
  })
})

describe("parseReceiptText", () => {
  it("extracts total and merchant from a typical ticket", () => {
    const text = `
OXXO SA DE CV
AV REFORMA 123
SUBTOTAL         85.00
IVA 16%          13.60
TOTAL           $98.60
`

    const result = parseReceiptText(text, [
      { id: "conv", name: "Conveniencia", user_id: "u1", is_enabled: true, is_system: true },
    ])

    expect(result.title).toContain("OXXO")
    expect(result.amount).toBe(98.6)
    expect(result.categoryId).toBe("conv")
    expect(result.confidence).toBe("high")
  })

  it("prefers total over subtotal", () => {
    const text = `
SORIANA
SUBTOTAL      450.00
TOTAL         522.00
`

    const result = parseReceiptText(text)
    expect(result.amount).toBe(522)
  })

  it("handles OCR noise in total keyword", () => {
    const text = `
WALMART
T0TAL A PAGAR   l59.50
`

    const result = parseReceiptText(text)
    expect(result.amount).toBe(159.5)
    expect(result.title).toContain("WALMART")
  })

  it("falls back to the last dollar amount", () => {
    const text = `
CAFE STARBUCKS
ARTICULO 1   $45.00
PAGO         $45.00
`

    const result = parseReceiptText(text)
    expect(result.amount).toBe(45)
    expect(result.title).toContain("STARBUCKS")
  })
})
