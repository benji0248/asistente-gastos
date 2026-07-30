import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePrivacyAmounts } from "@/context/PrivacyAmountsProvider"
import { cn } from "@/lib/utils"

interface PrivacyToggleProps {
  className?: string
}

export function PrivacyToggle({ className }: PrivacyToggleProps) {
  const { amountsVisible, toggleAmountsVisible } = usePrivacyAmounts()

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn("h-10 w-10 shrink-0 rounded-xl", className)}
      onClick={toggleAmountsVisible}
      aria-label={amountsVisible ? "Ocultar montos totales" : "Mostrar montos totales"}
      aria-pressed={amountsVisible}
      title={amountsVisible ? "Ocultar montos totales" : "Mostrar montos totales"}
    >
      {amountsVisible ? (
        <EyeOff className="h-4 w-4" />
      ) : (
        <Eye className="h-4 w-4" />
      )}
    </Button>
  )
}
