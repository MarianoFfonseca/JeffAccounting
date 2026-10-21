import type { Movement } from '../types'
import { formatCurrency } from '../utils/accounting'
import { computeBalanceSheet } from '../utils/accountingReports'
import { CheckCircle2, AlertCircle } from 'lucide-react'

interface BalanceSheetViewProps {
  movements: Movement[]
}

export function BalanceSheetView({ movements }: BalanceSheetViewProps) {
  const bs = computeBalanceSheet(movements)

  return (
    <div className="space-y-6">
      {/* Balance Verification Strip */}
      <div
        className={`flex items-center justify-between rounded-xl border p-4 text-sm transition-all ${
          bs.isBalanced
            ? 'border-neutral-200 bg-white text-neutral-900 shadow-xs'
            : 'border-red-200 bg-red-50 text-red-900'
        }`}
      >
        <div className="flex items-center space-x-3">
          {bs.isBalanced ? (
            <CheckCircle2 className="h-5 w-5 text-neutral-900" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600" />
          )}
          <div>
            <span className="font-semibold">
              {bs.isBalanced
                ? 'Balance de Situación cuadrado'
                : 'Descuadre en Balance'}
            </span>
            <span className="ml-2 text-xs text-neutral-500">
              Activo ({formatCurrency(bs.activo.total)}) = Patrimonio Neto (
              {formatCurrency(bs.patrimonioNeto.total)}) + Pasivo (
              {formatCurrency(bs.pasivo.total)})
            </span>
          </div>
        </div>

        <div className="font-mono text-xs font-semibold">
          {bs.isBalanced ? (
            <span className="rounded-md bg-neutral-100 px-2.5 py-1 text-neutral-800">
              Diferencia: 0,00 €
            </span>
          ) : (
            <span className="rounded-md bg-red-200 px-2.5 py-1 text-red-800">
              Diferencia: {formatCurrency(bs.difference)}
            </span>
          )}
        </div>
      </div>

      {/* Two Column Balance Sheet */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* LEFT COLUMN: ACTIVO */}
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xs">
          <div className="border-b border-neutral-200 bg-neutral-50/75 px-6 py-4">
            <h2 className="text-base font-semibold text-neutral-900">
              ACTIVO
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Bienes, derechos de cobro y recursos económicos
            </p>
          </div>

          <div className="p-6 space-y-5">
            {/* Activo Corriente */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-neutral-500">
                <span>Activo Corriente</span>
                <span className="font-mono text-neutral-900">
                  {formatCurrency(bs.activo.current.total)}
                </span>
              </div>

              <div className="space-y-2 pl-4 text-sm divide-y divide-neutral-100">
                <div className="flex items-center justify-between pt-1 text-neutral-700">
                  <span>
                    <strong className="text-neutral-900 font-mono text-xs">572</strong> Bancos c/c
                  </span>
                  <span className="font-mono font-medium text-neutral-900">
                    {formatCurrency(bs.activo.current.treasuryBank)}
                  </span>
                </div>

                {bs.activo.current.treasuryCash !== 0 && (
                  <div className="flex items-center justify-between pt-2 text-neutral-700">
                    <span>
                      <strong className="text-neutral-900 font-mono text-xs">570</strong> Caja, euros
                    </span>
                    <span className="font-mono font-medium text-neutral-900">
                      {formatCurrency(bs.activo.current.treasuryCash)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 text-neutral-700">
                  <span>
                    <strong className="text-neutral-900 font-mono text-xs">472</strong> H.P. IVA soportado (crédito fiscal)
                  </span>
                  <span className="font-mono font-medium text-neutral-900">
                    {formatCurrency(bs.activo.current.vatReceivable)}
                  </span>
                </div>

                {bs.activo.current.tradeReceivables !== 0 && (
                  <div className="flex items-center justify-between pt-2 text-neutral-700">
                    <span>
                      <strong className="text-neutral-900 font-mono text-xs">430</strong> Clientes
                    </span>
                    <span className="font-mono font-medium text-neutral-900">
                      {formatCurrency(bs.activo.current.tradeReceivables)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Activo Total Footer */}
          <div className="border-t-2 border-neutral-200 bg-neutral-50 px-6 py-4 flex items-center justify-between">
            <span className="text-sm font-semibold uppercase tracking-wider text-neutral-900">
              TOTAL ACTIVO
            </span>
            <span className="font-mono text-lg font-bold text-neutral-900">
              {formatCurrency(bs.activo.total)}
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: PATRIMONIO NETO Y PASIVO */}
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xs">
          <div className="border-b border-neutral-200 bg-neutral-50/75 px-6 py-4">
            <h2 className="text-base font-semibold text-neutral-900">
              PATRIMONIO NETO Y PASIVO
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Fuentes de financiación propia y deudas ajenas
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Section A: Patrimonio Neto */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-neutral-500">
                <span>A) Patrimonio Neto (Fondos Propios)</span>
                <span className="font-mono text-neutral-900">
                  {formatCurrency(bs.patrimonioNeto.total)}
                </span>
              </div>

              <div className="space-y-2 pl-4 text-sm divide-y divide-neutral-100">
                <div className="flex items-center justify-between pt-1 text-neutral-700">
                  <span>
                    <strong className="text-neutral-900 font-mono text-xs">100</strong> Capital social
                  </span>
                  <span className="font-mono font-medium text-neutral-900">
                    {formatCurrency(bs.patrimonioNeto.shareCapital)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 text-neutral-700">
                  <span>
                    <strong className="text-neutral-900 font-mono text-xs">129</strong> Resultado del ejercicio
                  </span>
                  <span className="font-mono font-medium text-neutral-900">
                    {formatCurrency(bs.patrimonioNeto.exerciseResult, true)}
                  </span>
                </div>
              </div>
            </div>

            {/* Section B: Pasivo Corriente */}
            <div className="space-y-3 border-t border-neutral-100 pt-4">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-neutral-500">
                <span>B) Pasivo Corriente (Deudas a c/p)</span>
                <span className="font-mono text-neutral-900">
                  {formatCurrency(bs.pasivo.current.total)}
                </span>
              </div>

              <div className="space-y-2 pl-4 text-sm divide-y divide-neutral-100">
                <div className="flex items-center justify-between pt-1 text-neutral-700">
                  <span>
                    <strong className="text-neutral-900 font-mono text-xs">520</strong> Deudas con entidades de crédito
                  </span>
                  <span className="font-mono font-medium text-neutral-900">
                    {formatCurrency(bs.pasivo.current.bankLoans)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 text-neutral-700">
                  <span>
                    <strong className="text-neutral-900 font-mono text-xs">477</strong> H.P. IVA repercutido (deuda fiscal)
                  </span>
                  <span className="font-mono font-medium text-neutral-900">
                    {formatCurrency(bs.pasivo.current.vatPayable)}
                  </span>
                </div>

                {bs.pasivo.current.tradePayables !== 0 && (
                  <div className="flex items-center justify-between pt-2 text-neutral-700">
                    <span>
                      <strong className="text-neutral-900 font-mono text-xs">400</strong> Proveedores / Acreedores
                    </span>
                    <span className="font-mono font-medium text-neutral-900">
                      {formatCurrency(bs.pasivo.current.tradePayables)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Patrimonio Neto y Pasivo Footer */}
          <div className="border-t-2 border-neutral-200 bg-neutral-50 px-6 py-4 flex items-center justify-between">
            <span className="text-sm font-semibold uppercase tracking-wider text-neutral-900">
              TOTAL PATRIMONIO NETO Y PASIVO
            </span>
            <span className="font-mono text-lg font-bold text-neutral-900">
              {formatCurrency(bs.totalPatrimonioNetoYPasivo)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
