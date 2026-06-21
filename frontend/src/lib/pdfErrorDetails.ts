export function formatUnknownError(err: unknown): string {
  if (err instanceof Error) {
    const parts = [`${err.name}: ${err.message}`]
    if (err.stack) {
      parts.push(err.stack.split("\n").slice(0, 8).join("\n"))
    }
    const cause = (err as Error & { cause?: unknown }).cause
    if (cause !== undefined) {
      parts.push(`Causa: ${formatUnknownError(cause)}`)
    }
    return parts.join("\n")
  }

  if (typeof err === "string") return err

  try {
    return JSON.stringify(err, null, 2)
  } catch {
    return String(err)
  }
}

export function buildPdfDiagnostics(
  lines: string[],
  err?: unknown
): string {
  const parts = [...lines]
  if (err !== undefined) {
    parts.push("", "— Error —", formatUnknownError(err))
  }
  return parts.join("\n")
}

export class PdfExtractError extends Error {
  readonly diagnostics: string[]

  constructor(message: string, diagnostics: string[]) {
    super(message)
    this.name = "PdfExtractError"
    this.diagnostics = diagnostics
  }
}
