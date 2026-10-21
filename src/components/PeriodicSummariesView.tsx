import { useState } from 'react'
import type { Company, Movement } from '../types'
import { formatCurrency } from '../utils/accounting'
import { computePeriodicSummaries } from '../utils/accountingReports'
import { generateAccountingPdfReport } from '../utils/pdfReport'
import { ExportPdfModal } from './ExportPdfModal'
import { FileDown, Download } from 'lucide-react'

interface PeriodicSummariesViewProps {
  movements: Movement[]
  company?: Company | null
}

export function PeriodicSummariesView({ movements, company }: PeriodicSummariesViewProps) {
  const [periodType, setPeriodType] = useState<'monthly' | 'quarterly' | 'four_months' | 'annual'>('monthly')
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [modalInitialData, setModalInitialData] = useState<{
    periodType: 'monthly' | 'quarterly'
    year?: number
    month?: number
    quarter?: number
  }>({ periodType: 'monthly' })

  const summaries = computePeriodicSummaries(movements, periodType)

  const totals = summaries.reduce(
    (acc, s) => {
      acc.income += s.income
      acc.expenses += s.expenses
      acc.netResult += s.netResult
      acc.cashInflow += s.cashInflow
      acc.cashOutflow += s.cashOutflow
      acc.netCashFlow += s.netCashFlow
      acc.movementCount += s.movementCount
      return acc
    },
    {
      income: 0,
      expenses: 0,
      netResult: 0,
      cashInflow: 0,
      cashOutflow: 0,
      netCashFlow: 0,
      movementCount: 0,
    }
  )

  const handleDownloadRowPdf = (item: (typeof summaries)[0]) => {
    if (periodType === 'monthly') {
      const [yStr, mStr] = item.periodKey.split('-')
      const y = parseInt(yStr, 10)
      const m = parseInt(mStr, 10)
      generateAccountingPdfReport({
        company: company || { id: 'empresa', name: 'Mi Empresa' },
        periodType: 'monthly',
        year: y,
        month: m,
        movements,
      })
    } else if (periodType === 'quarterly') {
      const [yStr, qStr] = item.periodKey.split('-')
      const y = parseInt(yStr, 10)
      const q = parseInt(qStr.replace('Q', ''), 10)
      generateAccountingPdfReport({
        company: company || { id: 'empresa', name: 'Mi Empresa' },
        periodType: 'quarterly',
        year: y,
        quarter: q,
        movements,
      })
    } else {
      // Open modal with preselected year
      setModalInitialData({
        periodType: 'quarterly',
        year: item.year,
      })
      setIsExportModalOpen(true)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Filter & Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-neutral-900">
            Resumen de Períodos
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Evolución de ingresos, gastos, resultado y flujo de tesorería
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Switcher pills */}
          <div className="inline-flex rounded-lg border border-neutral-200 bg-neutral-100 p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setPeriodType('monthly')}
              className={`rounded-md px-3 py-1.5 transition-all cursor-pointer ${
                periodType === 'monthly'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Mensual
            </button>
            <button
              type="button"
              onClick={() => setPeriodType('quarterly')}
              className={`rounded-md px-3 py-1.5 transition-all cursor-pointer ${
                periodType === 'quarterly'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Trimestral
            </button>
            <button
              type="button"
              onClick={() => setPeriodType('four_months')}
              className={`rounded-md px-3 py-1.5 transition-all cursor-pointer ${
                periodType === 'four_months'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Cuatrimestral
            </button>
            <button
              type="button"
              onClick={() => setPeriodType('annual')}
              className={`rounded-md px-3 py-1.5 transition-all cursor-pointer ${
                periodType === 'annual'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Anual
            </button>
          </div>

          {/* Download PDF button */}
          <button
            type="button"
            onClick={() => {
              setModalInitialData({
                periodType: periodType === 'quarterly' ? 'quarterly' : 'monthly',
              })
              setIsExportModalOpen(true)
            }}
            className="inline-flex items-center space-x-1.5 rounded-lg bg-neutral-900 px-3.5 py-1.5 text-xs font-medium text-white shadow-xs hover:bg-neutral-800 transition cursor-pointer"
          >
            <FileDown className="h-3.5 w-3.5" />
            <span>Descargar Informe PDF</span>
          </button>
        </div>
      </div>

      {/* Main Periodic Summary Table */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xs">
        {summaries.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <h3 className="text-base font-semibold text-neutral-900">
              No hay datos para el período
            </h3>
            <p className="mt-1 text-sm text-neutral-500">
              Añade movimientos con fecha para ver los resúmenes consolidados.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-600">
              <thead className="border-b border-neutral-200 bg-neutral-50/75 text-xs font-medium uppercase tracking-wider text-neutral-500">
                <tr>
                  <th scope="col" className="px-5 py-3.5">
                    Período
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-right">
                    Ingresos
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-right">
                    Gastos
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-right">
                    Resultado
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-right">
                    Cobros
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-right">
                    Pagos
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-right">
                    Flujo de Caja
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-center">
                    Operaciones
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-center">
                    PDF
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 bg-white font-mono text-xs">
                {summaries.map((item) => (
                  <tr
                    key={item.periodKey}
                    className="transition-colors hover:bg-neutral-50/80"
                  >
                    {/* Período */}
                    <td className="whitespace-nowrap px-5 py-4 font-sans text-sm font-medium text-neutral-900">
                      {item.periodLabel}
                    </td>

                    {/* Ingresos */}
                    <td className="whitespace-nowrap px-4 py-4 text-right text-neutral-900">
                      {formatCurrency(item.income)}
                    </td>

                    {/* Gastos */}
                    <td className="whitespace-nowrap px-4 py-4 text-right text-neutral-600">
                      {item.expenses > 0 ? `-${formatCurrency(item.expenses)}` : '0,00 €'}
                    </td>

                    {/* Resultado */}
                    <td className="whitespace-nowrap px-4 py-4 text-right font-semibold">
                      <span
                        className={
                          item.netResult > 0
                            ? 'text-neutral-900'
                            : item.netResult < 0
                            ? 'text-neutral-600'
                            : 'text-neutral-400'
                        }
                      >
                        {formatCurrency(item.netResult, true)}
                      </span>
                    </td>

                    {/* Cobros */}
                    <td className="whitespace-nowrap px-4 py-4 text-right text-neutral-700">
                      {formatCurrency(item.cashInflow)}
                    </td>

                    {/* Pagos */}
                    <td className="whitespace-nowrap px-4 py-4 text-right text-neutral-700">
                      {item.cashOutflow > 0 ? `-${formatCurrency(item.cashOutflow)}` : '0,00 €'}
                    </td>

                    {/* Flujo de Caja */}
                    <td className="whitespace-nowrap px-4 py-4 text-right font-medium text-neutral-900">
                      {formatCurrency(item.netCashFlow, true)}
                    </td>

                    {/* Operaciones */}
                    <td className="whitespace-nowrap px-4 py-4 text-center font-sans text-xs text-neutral-500">
                      <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 font-medium text-neutral-700">
                        {item.movementCount}
                      </span>
                    </td>

                    {/* Botón Descargar PDF */}
                    <td className="whitespace-nowrap px-4 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleDownloadRowPdf(item)}
                        title={`Descargar informe PDF de ${item.periodLabel}`}
                        className="inline-flex items-center space-x-1 rounded-md border border-neutral-250 bg-neutral-50 px-2.5 py-1 text-xs font-sans text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 transition cursor-pointer"
                      >
                        <Download className="h-3 w-3 text-neutral-500" />
                        <span>PDF</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-neutral-300 bg-neutral-50 font-mono text-xs font-semibold text-neutral-900">
                <tr>
                  <td className="px-5 py-3.5 font-sans uppercase tracking-wider text-neutral-700">
                    Total Acumulado
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {formatCurrency(totals.income)}
                  </td>
                  <td className="px-4 py-3.5 text-right text-neutral-700">
                    -{formatCurrency(totals.expenses)}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {formatCurrency(totals.netResult, true)}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {formatCurrency(totals.cashInflow)}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    -{formatCurrency(totals.cashOutflow)}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {formatCurrency(totals.netCashFlow, true)}
                  </td>
                  <td className="px-4 py-3.5 text-center font-sans">
                    {totals.movementCount}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Export PDF Modal */}
      <ExportPdfModal
        isOpen={isExportModalOpen}
        company={company || null}
        movements={movements}
        initialPeriodType={modalInitialData.periodType}
        initialYear={modalInitialData.year}
        initialMonth={modalInitialData.month}
        initialQuarter={modalInitialData.quarter}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  )
}
