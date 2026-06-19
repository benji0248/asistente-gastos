export const RENT_DEPOSIT_MONTHS = 1.5
export const RENT_IPC_PERIOD_MONTHS = 4

export interface RentAdjustmentInput {
  currentRent: number
  ipcRates: number[]
  depositMonths?: number
}

export interface RentAdjustmentResult {
  currentRent: number
  newRent: number
  inflationFactor: number
  depositCurrent: number
  depositNew: number
  depositDifference: number
  totalToPay: number
  formula: string
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100
}

export function calculateRentAdjustment({
  currentRent,
  ipcRates,
  depositMonths = RENT_DEPOSIT_MONTHS,
}: RentAdjustmentInput): RentAdjustmentResult {
  if (currentRent <= 0) {
    throw new Error('El alquiler actual debe ser mayor a cero')
  }
  if (ipcRates.length !== RENT_IPC_PERIOD_MONTHS) {
    throw new Error(`Indicá el IPC de los ${RENT_IPC_PERIOD_MONTHS} meses`)
  }
  if (ipcRates.some((rate) => !Number.isFinite(rate))) {
    throw new Error('Todos los valores de IPC deben ser numéricos')
  }

  let inflationFactor = 1
  for (const ipc of ipcRates) {
    inflationFactor *= 1 + ipc / 100
  }

  const newRent = roundMoney(currentRent * inflationFactor)
  const depositCurrent = roundMoney(currentRent * depositMonths)
  const depositNew = roundMoney(newRent * depositMonths)
  const depositDifference = roundMoney(depositNew - depositCurrent)
  const totalToPay = roundMoney(newRent + depositDifference)

  let formula = `${currentRent.toFixed(2)}`
  for (const ipc of ipcRates) {
    formula += ` × (${ipc}/100 + 1)`
  }
  formula += ` = ${newRent.toFixed(2)}`

  return {
    currentRent,
    newRent,
    inflationFactor,
    depositCurrent,
    depositNew,
    depositDifference,
    totalToPay,
    formula,
  }
}

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

export function ipcMonthLabels(adjustmentMonth: number, adjustmentYear: number) {
  const labels: Array<{ month: number; year: number; label: string }> = []

  for (let offset = RENT_IPC_PERIOD_MONTHS; offset >= 1; offset -= 1) {
    let month = adjustmentMonth - offset
    let year = adjustmentYear
    while (month <= 0) {
      month += 12
      year -= 1
    }
    labels.push({
      month,
      year,
      label: `${MONTH_NAMES[month - 1]} ${year}`,
    })
  }

  return labels
}

export function monthLabel(month: number, year: number) {
  return `${MONTH_NAMES[month - 1]} ${year}`
}
