import { useRef, useState } from "react"
import { FileUp, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { CreditCardStatement } from "@/lib/bbvaStatementParser"
import { parseBbvaStatement } from "@/lib/bbvaStatementParser"
import { extractTextFromPdf } from "@/lib/pdfTextExtract"

interface ImportStatementPdfProps {
  onImported: (statement: CreditCardStatement) => void
  disabled?: boolean
}

export function ImportStatementPdf({ onImported, disabled }: ImportStatementPdfProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Solo se admiten archivos PDF del resumen de tu tarjeta.")
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

      onImported(statement)
    } catch (err) {
      console.error("Error leyendo PDF", err)
      setError("Ocurrió un error al leer el PDF. Intenta de nuevo.")
    } finally {
      setLoading(false)
      setProgress(0)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleFile(file)
        }}
      />

      <Button
        type="button"
        variant="outline"
        disabled={disabled || loading}
        onClick={() => inputRef.current?.click()}
        className="w-full sm:w-auto"
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
      </Button>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
