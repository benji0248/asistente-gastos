import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePrivacyAmounts } from "@/context/PrivacyAmountsProvider"
import { cn } from "@/lib/utils"

interface PrivacyToggleProps {
  className?: string
  /** Compacto para ir al lado del número. */
  size?: "default" | "inline"
}

export function PrivacyToggle({ className, size = "default" }: PrivacyToggleProps) {
  const { amountsVisible, toggleAmountsVisible } = usePrivacyAmounts()
  const inline = size === "inline"

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        "shrink-0 rounded-lg text-muted-foreground hover:text-foreground",
        inline ? "h-7 w-7" : "h-10 w-10 rounded-xl",
        className
      )}
      onClick={toggleAmountsVisible}
      aria-label={amountsVisible ? "Ocultar montos totales" : "Mostrar montos totales"}
      aria-pressed={amountsVisible}
      title={amountsVisible ? "Ocultar montos totales" : "Mostrar montos totales"}
    >
      {amountsVisible ? (
        <EyeOff className={inline ? "h-3.5 w-3.5" : "h-4 w-4"} />
      ) : (
        <Eye className={inline ? "h-3.5 w-3.5" : "h-4 w-4"} />
      )}
    </Button>
  )
}
