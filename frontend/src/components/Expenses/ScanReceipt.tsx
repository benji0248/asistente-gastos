import { useRef, useState } from "react"
import { Camera, Images, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { parseReceiptText, type ReceiptParseResult } from "@/lib/receiptParser"
import { Category } from "@/types"
import {
  BatchReceiptReview,
  type ScannedReceiptDraft,
} from "./BatchReceiptReview"

interface ScanReceiptProps {
  categories: Category[]
  onParsed: (result: ReceiptParseResult) => void
  onExpenseCreated?: () => void
}

export function ScanReceipt({
  categories,
  onParsed,
  onExpenseCreated,
}: ScanReceiptProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState("")
  const [preview, setPreview] = useState<string | null>(null)
  const [batchLabel, setBatchLabel] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [reviewDrafts, setReviewDrafts] = useState<ScannedReceiptDraft[]>([])
  const [showReview, setShowReview] = useState(false)

  const handleCameraPick = () => {
    if (!scanning) cameraInputRef.current?.click()
  }

  const handleGalleryPick = () => {
    if (!scanning) galleryInputRef.current?.click()
  }

  const processSingleFile = async (file: File) => {
    setError(null)
    setScanning(true)
    setProgress(0)
    setStatus("Preparando imagen...")
    setBatchLabel("")
    const previewUrl = URL.createObjectURL(file)
    setPreview(previewUrl)

    try {
      const { scanReceiptImage } = await import("@/lib/receiptOcr")
      const text = await scanReceiptImage(file, ({ status: s, progress: p }) => {
        setStatus(s)
        setProgress(p)
      })

      const result = parseReceiptText(text, categories)

      if (!result.amount && result.title === "Gasto escaneado") {
        setError(
          "No pudimos leer el ticket con claridad. Intenta con mejor luz o acerca más la cámara."
        )
        return
      }

      onParsed(result)
    } catch (err) {
      console.error("Error escaneando ticket", err)
      setError("Ocurrió un error al leer el ticket. Intenta de nuevo.")
    } finally {
      setScanning(false)
      URL.revokeObjectURL(previewUrl)
      setPreview(null)
      setProgress(0)
      setStatus("")
    }
  }

  const processBatchFiles = async (files: File[]) => {
    setError(null)
    setScanning(true)
    setProgress(0)
    setBatchLabel(`0 de ${files.length}`)

    const drafts: ScannedReceiptDraft[] = []
    let currentPreview: string | null = files[0]
      ? URL.createObjectURL(files[0])
      : null
    setPreview(currentPreview)

    try {
      const { scanReceiptImage } = await import("@/lib/receiptOcr")

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setBatchLabel(`${i + 1} de ${files.length}`)
        setStatus(`Leyendo ticket ${i + 1} de ${files.length}...`)

        if (currentPreview) URL.revokeObjectURL(currentPreview)
        currentPreview = URL.createObjectURL(file)
        setPreview(currentPreview)

        try {
          const text = await scanReceiptImage(file, ({ status: s, progress: p }) => {
            setStatus(s)
            setProgress(p)
          })

          const result = parseReceiptText(text, categories)
          const failed =
            !result.amount && result.title === "Gasto escaneado"

          drafts.push({
            id: `${Date.now()}-${i}`,
            previewUrl: URL.createObjectURL(file),
            title: failed ? "Gasto escaneado" : result.title,
            amount: result.amount,
            categoryId: result.categoryId ?? "",
            accountId: "",
            included: !failed,
            confidence: result.confidence,
            failed,
          })
        } catch (err) {
          console.error(`Error en ticket ${i + 1}`, err)
          drafts.push({
            id: `${Date.now()}-${i}`,
            previewUrl: URL.createObjectURL(file),
            title: "",
            amount: 0,
            categoryId: "",
            accountId: "",
            included: false,
            confidence: "low",
            failed: true,
          })
        }
      }

      const readable = drafts.filter((d) => !d.failed)
      if (readable.length === 0) {
        setError(
          "No pudimos leer ningún ticket. Revisa la iluminación e intenta de nuevo."
        )
        drafts.forEach((d) => URL.revokeObjectURL(d.previewUrl))
        return
      }

      setReviewDrafts(drafts)
      setShowReview(true)
    } catch (err) {
      console.error("Error en escaneo por lote", err)
      setError("Ocurrió un error al procesar los tickets.")
    } finally {
      setScanning(false)
      if (currentPreview) URL.revokeObjectURL(currentPreview)
      setPreview(null)
      setProgress(0)
      setStatus("")
      setBatchLabel("")
    }
  }

  const handleCameraFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    await processSingleFile(file)
  }

  const handleGalleryFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ""
    if (files.length === 0) return

    if (files.length === 1) {
      await processSingleFile(files[0])
      return
    }

    await processBatchFiles(files)
  }

  const closeReview = () => {
    reviewDrafts.forEach((d) => URL.revokeObjectURL(d.previewUrl))
    setReviewDrafts([])
    setShowReview(false)
  }

  return (
    <>
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleCameraFile}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleGalleryFiles}
      />

      <Button variant="outline" onClick={handleCameraPick} disabled={scanning}>
        {scanning && !batchLabel ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Camera className="mr-2 h-4 w-4" />
        )}
        Escanear ticket
      </Button>

      <Button variant="outline" onClick={handleGalleryPick} disabled={scanning}>
        {scanning && batchLabel ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Images className="mr-2 h-4 w-4" />
        )}
        Varios tickets
      </Button>

      <Dialog open={scanning || !!error} onOpenChange={() => !scanning && setError(null)}>
        <DialogContent
          className="sm:max-w-md"
          onPointerDownOutside={(e) => scanning && e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {error ? "No se pudo leer el ticket" : "Leyendo tickets"}
            </DialogTitle>
            <DialogDescription>
              {error
                ? error
                : batchLabel
                  ? `Procesando ticket ${batchLabel}. La primera vez puede tardar un poco.`
                  : "La primera vez puede tardar un poco mientras carga el motor OCR."}
            </DialogDescription>
          </DialogHeader>

          {!error && (
            <div className="space-y-4">
              {preview && (
                <img
                  src={preview}
                  alt="Vista previa del ticket"
                  className="max-h-48 w-full rounded-xl object-contain bg-muted"
                />
              )}
              <div className="space-y-2">
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {status} {progress > 0 ? `(${progress}%)` : ""}
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setError(null)}>
                Cerrar
              </Button>
              <Button onClick={handleGalleryPick}>Reintentar</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <BatchReceiptReview
        open={showReview}
        drafts={reviewDrafts}
        categories={categories}
        onClose={closeReview}
        onDraftsChange={setReviewDrafts}
        onSaved={() => onExpenseCreated?.()}
      />
    </>
  )
}
