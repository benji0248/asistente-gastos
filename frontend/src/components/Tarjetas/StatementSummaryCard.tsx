import { Calendar, CreditCard, DollarSign, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrencyArs, formatCurrencyUsd } from "@/lib/formatCurrency"
import { analyzeStatement, type CreditCardStatement } from "@/lib/bbvaStatementParser"
import type { StatementBillExpense } from "@/lib/creditCardStatementsApi"
import { remainingBillAmount } from "@/lib/creditCardStatementsApi"
import { useMemo } from "react"

interface StatementSummaryCardProps {
  statement: CreditCardStatement
  billExpense?: StatementBillExpense | null
  onRegisterPayment: () => void
  onClear?: () => void
}

export function StatementSummaryCard({
  statement,
  billExpense,
  onRegisterPayment,
  onClear,
}: StatementSummaryCardProps) {
  const analysis = useMemo(() => analyzeStatement(statement), [statement])
  const remaining = remainingBillAmount(billExpense)
  const paid = billExpense?.amount_paid ?? 0
  const progress =
    billExpense && billExpense.amount > 0
      ? Math.min(100, (paid / billExpense.amount) * 100)
      : 0

  const cardLabel = [
    statement.cardBrand,
    statement.cardTier,
    statement.accountNumber ? `····${statement.accountNumber.slice(-4)}` : null,
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm space-y-4 sm:p-6 sm:space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold sm:text-lg">{cardLabel}</h2>
            <Badge variant="secondary" className="rounded-full">{statement.bank}</Badge>
            {billExpense?.is_paid && (
              <Badge className="rounded-full">Pagado</Badge>
            )}
          </div>
          {statement.fileName && (
            <p className="text-xs text-muted-foreground">{statement.fileName}</p>
          )}
        </div>
        {onClear && (
          <Button variant="ghost" size="sm" className="min-h-10" onClick={onClear}>
            Quitar resumen
          </Button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-1 sm:p-4">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5" />
            Pago total
          </p>
          <p className="font-display text-xl font-bold tracking-tight tabular-nums sm:text-2xl">
            {formatCurrencyArs(statement.totalBalanceArs)}
          </p>
          {statement.totalBalanceUsd != null && statement.totalBalanceUsd > 0 && (
            <p className="text-sm text-muted-foreground">
              + {formatCurrencyUsd(statement.totalBalanceUsd)} en USD
            </p>
          )}
        </div>

        <div className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-1 sm:p-4">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Wallet className="h-3.5 w-3.5" />
            Pago mínimo
          </p>
          <p className="font-display text-xl font-bold tracking-tight tabular-nums sm:text-2xl">
            {formatCurrencyArs(statement.minimumPayment)}
          </p>
        </div>

        <div className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-1 sm:p-4">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            Vencimiento
          </p>
          <p className="font-display text-xl font-bold tracking-tight sm:text-2xl">{statement.dueDate}</p>
          <p className="text-sm text-muted-foreground">
            Cierre: {statement.closingDate}
          </p>
        </div>
      </div>

      {billExpense && (
        <div className="rounded-xl border border-border/60 bg-muted/10 p-4 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-muted-foreground">Estado del gasto vinculado</span>
            <span className="font-medium">
              {formatCurrencyArs(paid)} / {formatCurrencyArs(billExpense.amount)}
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {billExpense.is_paid
              ? "Resumen pagado en su totalidad."
              : `Falta pagar ${formatCurrencyArs(remaining)}`}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        {!billExpense?.is_paid && (
          <Button className="w-full sm:w-auto" onClick={onRegisterPayment}>
            Registrar pago parcial
          </Button>
        )}
        <p className="text-sm text-muted-foreground sm:self-center">
          {analysis.cuotasEsteMes.length} en cuotas · {analysis.pagosUnicos.length}{" "}
          en un pago
        </p>
      </div>
    </div>
  )
}
