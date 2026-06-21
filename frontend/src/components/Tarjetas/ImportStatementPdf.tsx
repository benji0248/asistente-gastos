import { useRef, useState } from "react"
import { FileUp, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { buttonVariants } from "@/components/ui/button"
import type { CreditCardStatement } from "@/lib/bbvaStatementParser"
import { parseBbvaStatement } from "@/lib/bbvaStatementParser"
import { extractTextFromPdf } from "@/lib/pdfTextExtract"
import {
  isPdfFileAsync,
  PDF_FILE_ACCEPT,
  pdfValidationErrorMessage,
} from "@/lib/pdfFile"
import { cn } from "@/lib/utils"

interface ImportStatementPdfProps {
  onImported: (statement: CreditCardStatement) => void
  disabled?: boolean
}

export function ImportStatementPdf({ onImported, disabled }: ImportStatementPdfProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const isDisabled = disabled || loading

  const handleFile = async (file: File) => {
    const isPdf = await isPdfFileAsync(file)
    if (!isPdf) {
      setError(pdfValidationErrorMessage(file))
      return
    }

    setError(null)
    setLoading(true)
    setProgress(0)

    try {
      const text = await extractTextFromPdf(file, setProgress)
      const statement = parseBbvaStatement(text, file.name)

      if (!statement) {
        setError(
          "No pudimos leer el resumen. Por ahora solo se admiten resúmenes Visa de BBVA Argentina."
        )
        return
      }

      onImported({
        ...statement,
        fileName: statement.fileName || file.name || "resumen.pdf",
      })
    } catch (err) {
      console.error("Error leyendo PDF", err)
      setError("Ocurrió un error al leer el PDF. Intenta de nuevo.")
    } finally {
      setLoading(false)
      setProgress(0)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  const inputId = "import-statement-pdf-input"

  return (
    <div className="space-y-3">
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept={PDF_FILE_ACCEPT}
        className="sr-only"
        disabled={isDisabled}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleFile(file)
        }}
      />

      <label
        htmlFor={inputId}
        aria-disabled={isDisabled}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "inline-flex w-full min-h-11 cursor-pointer items-center justify-center sm:w-auto",
          isDisabled && "pointer-events-none opacity-50"
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
      </label>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
