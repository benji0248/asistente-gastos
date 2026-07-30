import { describe, expect, it } from "vitest"
import { normalizeMoneyInput, parseMoneyInput } from "./formatMoney"

describe("normalizeMoneyInput", () => {
  it("adds thousand separators while typing", () => {
    expect(normalizeMoneyInput("450000")).toBe("450.000")
    expect(normalizeMoneyInput("450000,5")).toBe("450.000,5")
  })

  it("treats pasted dots as thousand separators", () => {
    expect(normalizeMoneyInput("1.500")).toBe("1.500")
    expect(normalizeMoneyInput("1.500,50")).toBe("1.500,50")
  })

  it("uses only the comma as decimal separator", () => {
    expect(normalizeMoneyInput("2.500.000,123")).toBe("2.500.000,12")
    expect(normalizeMoneyInput("1,2,3")).toBe("1,23")
  })

  it("removes currency symbols and other characters", () => {
    expect(normalizeMoneyInput("$ 12.345,60")).toBe("12.345,60")
  })
})

describe("parseMoneyInput", () => {
  it("ignores dots when parsing whole amounts", () => {
    expect(parseMoneyInput("1.500")).toBe(1500)
    expect(parseMoneyInput("450.000")).toBe(450000)
  })

  it("parses comma decimals", () => {
    expect(parseMoneyInput("2.500,50")).toBe(2500.5)
    expect(parseMoneyInput("0,75")).toBe(0.75)
  })

  it("returns zero for empty or invalid values", () => {
    expect(parseMoneyInput("")).toBe(0)
    expect(parseMoneyInput("pesos")).toBe(0)
  })
})
