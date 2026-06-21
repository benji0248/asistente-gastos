import { useRef, useState } from "react"
import { Copy, FileUp, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/components/ui/button"
import type { CreditCardStatement } from "@/lib/bbvaStatementParser"
import { parseBbvaStatement } from "@/lib/bbvaStatementParser"
import {
  extractTextFromPdf,
  pdfReadErrorDiagnostics,
  pdfReadErrorMessage,
} from "@/lib/pdfTextExtract"
import { buildPdfDiagnostics } from "@/lib/pdfErrorDetails"
import {
  isPdfFileAsync,
  PDF_FILE_ACCEPT,
  pdfValidationErrorMessage,
} from "@/lib/pdfFile"
import { cn } from "@/lib/utils"

interface ImportStatementPdfProps {
  onImported: (statement: CreditCardStatement) => void | Promise<void>
  disabled?: boolean
}

export function ImportStatementPdf({ onImported, disabled }: ImportStatementPdfProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [errorDetail, setErrorDetail] = useState<string | null>(null)
  const [liveDiagnostics, setLiveDiagnostics] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const isDisabled = disabled || loading

  const copyDiagnostics = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt("Copiá estos detalles:", text)
    }
  }

  const handleFile = async (file: File) => {
    const isPdf = await isPdfFileAsync(file)
    if (!isPdf) {
      setError(pdfValidationErrorMessage(file))
      setErrorDetail(null)
      return
    }

    setError(null)
    setErrorDetail(null)
    setLiveDiagnostics(null)
    setLoading(true)
    setProgress(0)

    try {
      const text = await extractTextFromPdf(file, setProgress, setLiveDiagnostics)
      const statement = parseBbvaStatement(text, file.name)

      if (!statement) {
        setError(
          "No pudimos leer el resumen. Por ahora solo se admiten resúmenes Visa de BBVA Argentina."
        )
        setErrorDetail(
          buildPdfDiagnostics([
            `Texto extraído (${text.length} caracteres):`,
            text.slice(0, 800) + (text.length > 800 ? "…" : ""),
          ])
        )
        return
      }

      await onImported({
        ...statement,
        fileName: statement.fileName || file.name || "resumen.pdf",
      })
    } catch (err) {
      console.error("Error importando PDF", err)
      setError(pdfReadErrorMessage(err))
      setErrorDetail(
        pdfReadErrorDiagnostics(err) ??
          buildPdfDiagnostics(liveDiagnostics ? [liveDiagnostics] : [], err)
      )
    } finally {
      setLoading(false)
      setProgress(0)
      setLiveDiagnostics(null)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  const inputId = "import-statement-pdf-input"
  const visibleDiagnostics = errorDetail || (loading ? liveDiagnostics : null)

  return (
    <div className="space-y-3">
      <div className="relative inline-block w-full sm:w-auto">
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept={PDF_FILE_ACCEPT}
          className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:pointer-events-none"
          disabled={isDisabled}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleFile(file)
          }}
        />

        <div
          aria-disabled={isDisabled}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "pointer-events-none inline-flex w-full min-h-11 items-center justify-center sm:w-auto",
            isDisabled && "opacity-50"
          )}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Leyendo PDF {progress > 0 ? `(${progress}%)` : "..."}
            </>
          ) : (
            <>
              <FileUp className="mr-2 h-4 w-4" />
              Subir resumen PDF
            </>
          )}
        </div>
      </div>

      {loading && liveDiagnostics && (
        <pre className="max-h-32 overflow-auto rounded-md border bg-muted/40 p-2 text-[10px] leading-snug whitespace-pre-wrap break-all text-muted-foreground">
          {liveDiagnostics}
        </pre>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription className="space-y-2">
            <p>{error}</p>
            {visibleDiagnostics && (
              <details className="rounded border border-destructive/30 bg-destructive/5 p-2">
                <summary className="cursor-pointer text-xs font-medium">
                  Detalles técnicos (para soporte)
                </summary>
                <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-all text-[10px] leading-snug">
                  {visibleDiagnostics}
                </pre>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 h-8"
                  onClick={() => void copyDiagnostics(visibleDiagnostics)}
                >
                  <Copy className="mr-1 h-3 w-3" />
                  {copied ? "Copiado" : "Copiar detalles"}
                </Button>
              </details>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
