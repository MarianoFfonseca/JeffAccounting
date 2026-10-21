import { useState } from 'react'
import type { Company, Movement } from '../types'
import {
  formatCurrency,
  formatDate,
  interpretMovement,
} from '../utils/accounting'
import { ProfitAndLossView } from './ProfitAndLossView'
import { BalanceSheetView } from './BalanceSheetView'
import { PeriodicSummariesView } from './PeriodicSummariesView'

interface AccountingViewProps {
  movements: Movement[]
  company?: Company | null
}

type AccountingSubTab = 'journal' | 'pnl' | 'balance_sheet' | 'periodic'

export function AccountingView({ movements, company }: AccountingViewProps) {
  const [subTab, setSubTab] = useState<AccountingSubTab>('journal')

  // Sort movements by date descending, then createdAt descending
  const sortedMovements = [...movements].sort((a, b) => {
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date)
    }
    return (b.createdAt || '').localeCompare(a.createdAt || '')
  })

  // Calculate interpreted data for each movement
  const interpretedItems = sortedMovements.map((movement) => ({
    movement,
    interpretation: interpretMovement(movement),
  }))

  // Calculate totals for Journal
  const totals = interpretedItems.reduce(
    (acc, item) => {
      acc.activo += item.interpretation.impact.activo
      acc.pasivo += item.interpretation.impact.pasivo
      acc.patrimonioNeto += item.interpretation.impact.patrimonioNeto
      acc.debe += item.interpretation.debe.reduce((sum, d) => sum + d.amount, 0)
      acc.haber += item.interpretation.haber.reduce((sum, h) => sum + h.amount, 0)
      return acc
    },
    { activo: 0, pasivo: 0, patrimonioNeto: 0, debe: 0, haber: 0 }
  )

  const isEquationBalanced =
    Math.abs(totals.activo - (totals.pasivo + totals.patrimonioNeto)) < 0.01

  return (
    <div className="space-y-6">
      {/* Top Header & Sub-Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            Contabilidad
          </h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Estados contables oficiales, libro diario e informes consolidados
          </p>
        </div>

        {/* Sub-tabs pills */}
        <div className="inline-flex rounded-lg border border-neutral-200 bg-neutral-100 p-0.5 text-xs font-medium">
          <button
            type="button"
            onClick={() => setSubTab('journal')}
            className={`rounded-md px-3 py-1.5 transition-all cursor-pointer ${
              subTab === 'journal'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Libro Diario
          </button>
          <button
            type="button"
            onClick={() => setSubTab('pnl')}
            className={`rounded-md px-3 py-1.5 transition-all cursor-pointer ${
              subTab === 'pnl'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Pérdidas y Ganancias
          </button>
          <button
            type="button"
            onClick={() => setSubTab('balance_sheet')}
            className={`rounded-md px-3 py-1.5 transition-all cursor-pointer ${
              subTab === 'balance_sheet'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Balance de Situación
          </button>
          <button
            type="button"
            onClick={() => setSubTab('periodic')}
            className={`rounded-md px-3 py-1.5 transition-all cursor-pointer ${
              subTab === 'periodic'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Resúmenes
          </button>
        </div>
      </div>

      {/* RENDER ACTIVE SUBTAB */}
      {subTab === 'pnl' ? (
        <ProfitAndLossView movements={movements} />
      ) : subTab === 'balance_sheet' ? (
        <BalanceSheetView movements={movements} />
      ) : subTab === 'periodic' ? (
        <PeriodicSummariesView movements={movements} company={company} />
      ) : (
        /* DEFAULT: LIBRO DIARIO Y BALANCE DE MOVIMIENTOS */
        <div className="space-y-6">
          {/* Summary KPI Strip */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Activo */}
            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
              <div className="text-xs font-medium uppercase tracking-wider text-neutral-400">
                Activo (Bienes y Derechos)
              </div>
              <div className="mt-2 font-mono text-2xl font-semibold text-neutral-900">
                {formatCurrency(totals.activo, true)}
              </div>
              <div className="mt-1 text-xs text-neutral-500">
                Tesorería e IVA soportado deducible
              </div>
            </div>

            {/* Pasivo */}
            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
              <div className="text-xs font-medium uppercase tracking-wider text-neutral-400">
                Pasivo (Deudas y Obligaciones)
              </div>
              <div className="mt-2 font-mono text-2xl font-semibold text-neutral-900">
                {formatCurrency(totals.pasivo, true)}
              </div>
              <div className="mt-1 text-xs text-neutral-500">
                Préstamos e IVA repercutido a pagar
              </div>
            </div>

            {/* Patrimonio Neto */}
            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
              <div className="text-xs font-medium uppercase tracking-wider text-neutral-400">
                Patrimonio Neto (Fondos Propios)
              </div>
              <div className="mt-2 font-mono text-2xl font-semibold text-neutral-900">
                {formatCurrency(totals.patrimonioNeto, true)}
              </div>
              <div className="mt-1 text-xs text-neutral-500">
                Capital social y resultados acumulados
              </div>
            </div>
          </div>

          {/* Balance Verification Pill */}
          <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2 text-xs">
            <div className="flex items-center space-x-2 text-neutral-600">
              <span className="font-semibold text-neutral-900">Ecuación fundamental:</span>
              <span>
                Activo ({formatCurrency(totals.activo)}) = Pasivo ({formatCurrency(totals.pasivo)}) + PN ({formatCurrency(totals.patrimonioNeto)})
              </span>
            </div>
            <div className="flex items-center space-x-1.5 font-mono text-xs">
              {isEquationBalanced ? (
                <span className="inline-flex items-center rounded-md bg-neutral-200 px-2 py-0.5 font-medium text-neutral-800">
                  Balance cuadrado
                </span>
              ) : (
                <span className="inline-flex items-center rounded-md bg-red-100 px-2 py-0.5 font-medium text-red-700">
                  Descuadre contable
                </span>
              )}
            </div>
          </div>

          {/* Accounting Table */}
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xs">
            {interpretedItems.length === 0 ? (
              <div className="py-16 px-4 text-center">
                <h3 className="text-base font-semibold text-neutral-900">Sin asientos contables</h3>
                <p className="mt-1 text-sm text-neutral-500">
                  Los movimientos que añadas en la pestaña "Movimientos" aparecerán aquí con su correspondiente asiento y desglose.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-neutral-600">
                  <thead className="border-b border-neutral-200 bg-neutral-50/75 text-xs font-medium uppercase tracking-wider text-neutral-500">
                    <tr>
                      <th scope="col" className="px-5 py-3.5">
                        Fecha
                      </th>
                      <th scope="col" className="px-5 py-3.5">
                        Concepto
                      </th>
                      <th scope="col" className="px-4 py-3.5 text-right">
                        Activo
                      </th>
                      <th scope="col" className="px-4 py-3.5 text-right">
                        Pasivo
                      </th>
                      <th scope="col" className="px-4 py-3.5 text-right">
                        PN
                      </th>
                      <th scope="col" className="px-5 py-3.5 min-w-[200px]">
                        Debe
                      </th>
                      <th scope="col" className="px-5 py-3.5 min-w-[200px]">
                        Haber
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 bg-white">
                    {interpretedItems.map(({ movement, interpretation }) => (
                      <tr
                        key={movement.id}
                        className="transition-colors hover:bg-neutral-50/80 align-top"
                      >
                        {/* Fecha */}
                        <td className="whitespace-nowrap px-5 py-4 font-mono text-xs text-neutral-500">
                          {formatDate(movement.date)}
                        </td>

                        {/* Concepto */}
                        <td className="px-5 py-4">
                          <div className="font-medium text-neutral-900">
                            {movement.description}
                          </div>
                          <div className="text-xs text-neutral-400 capitalize flex items-center flex-wrap gap-1.5 mt-0.5">
                            <span>{movement.type.replace('_', ' ')}</span>
                            {movement.subgroup && (
                              <span className="rounded bg-neutral-100 px-1.5 py-0.2 text-[10px] text-neutral-600 font-sans font-normal border border-neutral-200">
                                {movement.subgroup}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Activo */}
                        <td className="whitespace-nowrap px-4 py-4 text-right font-mono font-medium">
                          <span
                            className={
                              interpretation.impact.activo > 0
                                ? 'text-neutral-900 font-semibold'
                                : interpretation.impact.activo < 0
                                ? 'text-neutral-600'
                                : 'text-neutral-400'
                            }
                          >
                            {formatCurrency(interpretation.impact.activo, true)}
                          </span>
                        </td>

                        {/* Pasivo */}
                        <td className="whitespace-nowrap px-4 py-4 text-right font-mono font-medium">
                          <span
                            className={
                              interpretation.impact.pasivo > 0
                                ? 'text-neutral-900 font-semibold'
                                : interpretation.impact.pasivo < 0
                                ? 'text-neutral-600'
                                : 'text-neutral-400'
                            }
                          >
                            {formatCurrency(interpretation.impact.pasivo, true)}
                          </span>
                        </td>

                        {/* PN */}
                        <td className="whitespace-nowrap px-4 py-4 text-right font-mono font-medium">
                          <span
                            className={
                              interpretation.impact.patrimonioNeto > 0
                                ? 'text-neutral-900 font-semibold'
                                : interpretation.impact.patrimonioNeto < 0
                                ? 'text-neutral-600'
                                : 'text-neutral-400'
                            }
                          >
                            {formatCurrency(interpretation.impact.patrimonioNeto, true)}
                          </span>
                        </td>

                        {/* Debe entries */}
                        <td className="px-5 py-4">
                          <div className="space-y-1.5 font-mono text-xs">
                            {interpretation.debe.map((entry, idx) => (
                              <div key={idx} className="flex justify-between items-baseline gap-2">
                                <span className="text-neutral-700">
                                  <strong className="text-neutral-900">{entry.code}</strong>{' '}
                                  <span className="text-neutral-500">{entry.name}</span>
                                </span>
                                <span className="text-neutral-900 font-medium whitespace-nowrap">
                                  {formatCurrency(entry.amount)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* Haber entries */}
                        <td className="px-5 py-4">
                          <div className="space-y-1.5 font-mono text-xs">
                            {interpretation.haber.map((entry, idx) => (
                              <div key={idx} className="flex justify-between items-baseline gap-2">
                                <span className="text-neutral-700">
                                  <strong className="text-neutral-900">{entry.code}</strong>{' '}
                                  <span className="text-neutral-500">{entry.name}</span>
                                </span>
                                <span className="text-neutral-900 font-medium whitespace-nowrap">
                                  {formatCurrency(entry.amount)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-neutral-300 bg-neutral-50 font-mono text-xs font-semibold text-neutral-900">
                    <tr>
                      <td colSpan={2} className="px-5 py-3.5 text-neutral-700 font-sans font-medium uppercase tracking-wider">
                        Totales
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {formatCurrency(totals.activo, true)}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {formatCurrency(totals.pasivo, true)}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {formatCurrency(totals.patrimonioNeto, true)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-neutral-500 font-normal">Suma Debe: </span>
                        {formatCurrency(totals.debe)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-neutral-500 font-normal">Suma Haber: </span>
                        {formatCurrency(totals.haber)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
