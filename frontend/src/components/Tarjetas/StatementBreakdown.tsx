import { useMemo } from "react"
import { CalendarClock, Layers, Receipt } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatCurrencyArs, formatCurrencyUsd } from "@/lib/formatCurrency"
import {
  analyzeStatement,
  type CreditCardStatement,
  type StatementConsumo,
} from "@/lib/bbvaStatementParser"

/** Cambiá a `true` para ver cada consumo de un solo pago. */
const detalle = false

interface StatementBreakdownProps {
  statement: CreditCardStatement
}

function ConsumoRow({ consumo }: { consumo: StatementConsumo }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 text-sm border-b border-border/40 last:border-0">
      <div className="min-w-0 space-y-0.5">
        <p className="font-medium break-words">{consumo.description}</p>
        <p className="text-xs text-muted-foreground">{consumo.date}</p>
      </div>
      <div className="shrink-0 text-right space-y-1">
        {consumo.installment && (
          <Badge variant="outline" className="text-[10px]">
            Cuota {consumo.installment.current}/{consumo.installment.total}
          </Badge>
        )}
        <p className="font-medium">
          {consumo.currency === "USD"
            ? formatCurrencyUsd(consumo.amount)
            : formatCurrencyArs(consumo.amount)}
        </p>
      </div>
    </div>
  )
}

function ConsumoSection({
  title,
  icon: Icon,
  items,
  total,
  emptyLabel,
  showItemList = true,
}: {
  title: string
  icon: typeof Receipt
  items: StatementConsumo[]
  total: number
  emptyLabel: string
  showItemList?: boolean
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/10 p-3 space-y-3 sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium">{title}</h3>
          <Badge variant="secondary">{items.length}</Badge>
        </div>
        <span className="text-sm font-semibold">{formatCurrencyArs(total)}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      ) : showItemList ? (
        <div className="space-y-0">
          {items.map((c) => (
            <ConsumoRow key={c.id} consumo={c} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function StatementBreakdown({ statement }: StatementBreakdownProps) {
  const analysis = useMemo(() => analyzeStatement(statement), [statement])
  const upcomingByMonth = statement.upcomingByMonth ?? []

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">Detalle del resumen</h2>
        <p className="text-sm text-muted-foreground">
          Solo informativo. El gasto pendiente en tu lista es el pago total del
          resumen ({formatCurrencyArs(statement.totalBalanceArs)}), que incluye
          intereses e impuestos además de estos consumos (
          {formatCurrencyArs(analysis.totalConsumos)}).
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-2 lg:gap-4">
        <ConsumoSection
          title="Pagos en cuotas"
          icon={Layers}
          items={analysis.cuotasEsteMes}
          total={analysis.totalCuotasEsteMes}
          emptyLabel="No hay cuotas en este resumen."
        />
        <ConsumoSection
          title="Pagos en un solo pago"
          icon={Receipt}
          items={analysis.pagosUnicos}
          total={analysis.totalPagosUnicos}
          emptyLabel="No hay consumos de un solo pago."
          showItemList={detalle}
        />
      </div>

      {analysis.cuotasFuturas.length > 0 && (
        <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-3 space-y-3 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary" />
              <h3 className="font-medium">Cuotas futuras estimadas</h3>
              <Badge variant="outline">{analysis.cuotasFuturas.length}</Badge>
            </div>
            <span className="text-sm font-semibold">
              {formatCurrencyArs(analysis.totalCuotasFuturas)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Referencia para planificar. No se cargan automáticamente como gastos.
          </p>
          <div className="space-y-0">
            {analysis.cuotasFuturas.map((c) => (
              <ConsumoRow key={c.id} consumo={c} />
            ))}
          </div>
        </div>
      )}

      {upcomingByMonth.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-muted/10 p-3 space-y-3 sm:p-4">
          <h3 className="font-medium">Cuotas a vencer (según el resumen)</h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingByMonth.map((item) => (
              <div
                key={item.month}
                className="flex items-center justify-between rounded-lg border border-border/50 bg-background px-3 py-2 text-sm"
              >
                <span className="text-muted-foreground capitalize">{item.month}</span>
                <span className="font-medium">{formatCurrencyArs(item.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
