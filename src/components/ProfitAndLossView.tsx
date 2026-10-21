import type { Movement } from '../types'
import { formatCurrency } from '../utils/accounting'
import { computeProfitAndLoss } from '../utils/accountingReports'

interface ProfitAndLossViewProps {
  movements: Movement[]
}

export function ProfitAndLossView({ movements }: ProfitAndLossViewProps) {
  const pnl = computeProfitAndLoss(movements)
  const isProfit = pnl.netResult >= 0

  return (
    <div className="space-y-6">
      {/* Top Banner KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
          <div className="text-xs font-medium uppercase tracking-wider text-neutral-400">
            Total Ingresos
          </div>
          <div className="mt-2 font-mono text-2xl font-semibold text-neutral-900">
            {formatCurrency(pnl.operatingIncome.total)}
          </div>
          <div className="mt-1 text-xs text-neutral-500">
            Ventas y prestaciones de servicios
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
          <div className="text-xs font-medium uppercase tracking-wider text-neutral-400">
            Total Gastos
          </div>
          <div className="mt-2 font-mono text-2xl font-semibold text-neutral-900">
            {formatCurrency(pnl.operatingExpenses.total)}
          </div>
          <div className="mt-1 text-xs text-neutral-500">
            Compras, suministros y software
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
          <div className="text-xs font-medium uppercase tracking-wider text-neutral-400">
            Resultado del Ejercicio
          </div>
          <div className="mt-2 font-mono text-2xl font-semibold text-neutral-900">
            {formatCurrency(pnl.netResult, true)}
          </div>
          <div className="mt-1 flex items-center space-x-1.5 text-xs">
            <span
              className={`inline-flex items-center rounded-md px-2 py-0.5 font-medium ${
                isProfit
                  ? 'bg-neutral-100 text-neutral-800'
                  : 'bg-neutral-200 text-neutral-900'
              }`}
            >
              {isProfit ? 'Beneficio neto' : 'Pérdida neta'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Income Statement Table */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xs">
        <div className="border-b border-neutral-200 bg-neutral-50/75 px-6 py-4">
          <h2 className="text-base font-semibold text-neutral-900">
            Cuenta de Pérdidas y Ganancias
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Estructura económica de ingresos y gastos devengados
          </p>
        </div>

        <div className="divide-y divide-neutral-200">
          {/* Section: INGRESOS */}
          <div className="p-6 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-neutral-500">
              <span>1. Ingresos de Explotación</span>
              <span className="font-mono text-neutral-900">
                {formatCurrency(pnl.operatingIncome.total)}
              </span>
            </div>

            <div className="space-y-2 pl-4 text-sm">
              <div className="flex items-center justify-between text-neutral-700">
                <span>
                  <strong className="text-neutral-900 font-mono text-xs">700</strong> Ventas de mercaderías
                </span>
                <span className="font-mono font-medium text-neutral-900">
                  {formatCurrency(pnl.operatingIncome.sales)}
                </span>
              </div>

              {pnl.operatingIncome.otherIncome > 0 && (
                <div className="flex items-center justify-between text-neutral-700">
                  <span>
                    <strong className="text-neutral-900 font-mono text-xs">75x</strong> Otros ingresos de gestión
                  </span>
                  <span className="font-mono font-medium text-neutral-900">
                    {formatCurrency(pnl.operatingIncome.otherIncome)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Section: GASTOS */}
          <div className="p-6 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-neutral-500">
              <span>2. Gastos de Explotación</span>
              <span className="font-mono text-neutral-900">
                -{formatCurrency(pnl.operatingExpenses.total)}
              </span>
            </div>

            <div className="space-y-2 pl-4 text-sm">
              <div className="flex items-center justify-between text-neutral-700">
                <span>
                  <strong className="text-neutral-900 font-mono text-xs">600</strong> Compras de mercaderías y material
                </span>
                <span className="font-mono font-medium text-neutral-900">
                  -{formatCurrency(pnl.operatingExpenses.purchases)}
                </span>
              </div>

              <div className="flex items-center justify-between text-neutral-700">
                <span>
                  <strong className="text-neutral-900 font-mono text-xs">629</strong> Otros servicios (software, suministros)
                </span>
                <span className="font-mono font-medium text-neutral-900">
                  -{formatCurrency(pnl.operatingExpenses.externalServices)}
                </span>
              </div>

              {pnl.operatingExpenses.otherExpenses > 0 && (
                <div className="flex items-center justify-between text-neutral-700">
                  <span>
                    <strong className="text-neutral-900 font-mono text-xs">65x</strong> Otros gastos de gestión
                  </span>
                  <span className="font-mono font-medium text-neutral-900">
                    -{formatCurrency(pnl.operatingExpenses.otherExpenses)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Section: RESULTADO FINAL */}
          <div className="bg-neutral-50 p-6">
            <div className="flex items-center justify-between font-semibold text-neutral-900">
              <div className="text-sm uppercase tracking-wide">
                Resultado Neto del Ejercicio (Ingresos - Gastos)
              </div>
              <div className="font-mono text-lg font-bold">
                {formatCurrency(pnl.netResult, true)}
              </div>
            </div>
            <p className="mt-1 text-xs text-neutral-500">
              Este resultado se integra automáticamente en los Fondos Propios del Patrimonio Neto en el Balance de Situación.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
