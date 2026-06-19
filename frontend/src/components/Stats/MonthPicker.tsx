import dayjs from "dayjs"
import "dayjs/locale/es"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { monthKey, type MonthYear } from "@/lib/monthUtils"

dayjs.locale("es")

interface MonthPickerProps {
  months: MonthYear[]
  selectedMonth: number | null
  selectedYear: number | null
  onSelect: (month: number, year: number) => void
  className?: string
}

export function MonthPicker({
  months,
  selectedMonth,
  selectedYear,
  onSelect,
  className,
}: MonthPickerProps) {
  const options =
    months.length > 0
      ? months
      : selectedMonth !== null && selectedYear !== null
        ? [{ month: selectedMonth, year: selectedYear }]
        : []

  const value =
    selectedMonth !== null && selectedYear !== null
      ? monthKey(selectedMonth, selectedYear)
      : undefined

  return (
    <Select
      value={value}
      onValueChange={(key) => {
        const [month, year] = key.split("/").map(Number)
        if (month && year) onSelect(month, year)
      }}
    >
      <SelectTrigger className={className ?? "w-full sm:w-[220px] rounded-xl"}>
        <SelectValue placeholder="Seleccioná un mes" />
      </SelectTrigger>
      <SelectContent>
        {options.map(({ month, year }) => {
          const key = monthKey(month, year)
          const label = dayjs()
            .month(month - 1)
            .year(year)
            .format("MMMM YYYY")
          return (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
