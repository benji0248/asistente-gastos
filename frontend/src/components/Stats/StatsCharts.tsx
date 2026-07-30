import { cn } from "@/lib/utils"
import { formatPrivateMoney } from "@/lib/formatMoney"
import { usePrivacyAmounts } from "@/context/PrivacyAmountsProvider"

interface HorizontalBarProps {
  label: string
  amount: number
  percentage: number
  meta?: string
  highlight?: boolean
}

export function HorizontalBar({
  label,
  amount,
  percentage,
  meta,
  highlight,
}: HorizontalBarProps) {
  const { amountsVisible } = usePrivacyAmounts()

  return (
    <div className="space-y-1.5">
      <div className="flex items-start justify-between gap-3 text-sm">
        <div className="min-w-0">
          <p className="font-medium truncate">{label}</p>
          {meta && <p className="text-xs text-muted-foreground">{meta}</p>}
        </div>
        <div className="text-right shrink-0 tabular-nums">
          <p className="text-sm font-semibold break-all sm:break-normal">
            {formatPrivateMoney(amount, amountsVisible)}
          </p>
          <p className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</p>
        </div>
      </div>
      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            highlight ? "bg-destructive" : "bg-foreground"
          )}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  )
}

interface MonthBarsProps {
  items: Array<{
    label: string
    paid: number
    isSelected?: boolean
  }>
  maxValue: number
}

export function MonthBars({ items, maxValue }: MonthBarsProps) {
  const { amountsVisible } = usePrivacyAmounts()
  const scale = maxValue > 0 ? maxValue : 1

  return (
    <div className="w-full min-w-0 overflow-x-auto overscroll-x-contain">
      <div className="flex h-40 min-w-0 items-end justify-between gap-1.5 sm:h-44 sm:gap-2">
        {items.map((item) => {
          const height = Math.max((item.paid / scale) * 100, item.paid > 0 ? 8 : 2)
          return (
            <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-1.5 sm:gap-2">
              <span className="max-w-full truncate text-[10px] font-medium tabular-nums text-muted-foreground sm:text-xs">
                {formatPrivateMoney(item.paid, amountsVisible)}
              </span>
              <div className="flex h-24 w-full items-end justify-center sm:h-28">
                <div
                  className={cn(
                    "w-full max-w-[1.75rem] rounded-t-lg transition-all sm:max-w-[2.5rem]",
                    item.isSelected ? "bg-foreground" : "bg-foreground/30"
                  )}
                  style={{ height: `${height}%` }}
                />
              </div>
              <span
                className={cn(
                  "w-full truncate text-center text-[10px] capitalize sm:text-xs",
                  item.isSelected ? "font-semibold text-foreground" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
