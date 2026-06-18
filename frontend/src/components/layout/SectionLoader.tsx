import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface SectionLoaderProps {
  className?: string
  minHeight?: string
  label?: string
}

export function SectionLoader({
  className,
  minHeight = "min-h-[120px]",
  label,
}: SectionLoaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2",
        minHeight,
        className
      )}
    >
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
    </div>
  )
}
