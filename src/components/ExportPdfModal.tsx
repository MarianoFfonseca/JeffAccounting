import { useState, useMemo } from 'react'
import { FileText, Download, X, Calendar, Building2, CheckCircle2 } from 'lucide-react'
import type { Company, Movement } from '../types'
import { generateAccountingPdfReport } from '../utils/pdfReport'
import { formatCurrency } from '../utils/accounting'

interface ExportPdfModalProps {
  isOpen: boolean
  company: Company | null
  movements: Movement[]
  onClose: () => void
  initialPeriodType?: 'monthly' | 'quarterly'
  initialYear?: number
  initialMonth?: number
  initialQuarter?: number
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

const QUARTERS = [
  { value: 1, label: '1º Trimestre (Enero - Marzo)' },
  { value: 2, label: '2º Trimestre (Abril - Junio)' },
  { value: 3, label: '3º Trimestre (Julio - Septiembre)' },
  { value: 4, label: '4º Trimestre (Octubre - Diciembre)' },
]

const CURRENT_CALENDAR_YEAR = new Date().getFullYear()
const CURRENT_CALENDAR_MONTH = new Date().getMonth() + 1
const CURRENT_CALENDAR_QUARTER = Math.ceil(CURRENT_CALENDAR_MONTH / 3)

export function ExportPdfModal({
  isOpen,
  company,
  movements,
  onClose,
  initialPeriodType = 'monthly',
  initialYear,
  initialMonth,
  initialQuarter,
}: ExportPdfModalProps) {
  const [periodType, setPeriodType] = useState<'monthly' | 'quarterly'>(initialPeriodType)
  const [year, setYear] = useState<number>(() => initialYear || CURRENT_CALENDAR_YEAR)
  const [month, setMonth] = useState<number>(() => initialMonth || CURRENT_CALENDAR_MONTH)
  const [quarter, setQuarter] = useState<number>(() => initialQuarter || CURRENT_CALENDAR_QUARTER)
  const [downloadSuccess, setDownloadSuccess] = useState(false)

  // Extract available years from movements
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>([CURRENT_CALENDAR_YEAR])
    movements.forEach((m) => {
      if (m.date) {
        const y = parseInt(m.date.split('-')[0], 10)
        if (!isNaN(y)) yearsSet.add(y)
      }
    })
    return Array.from(yearsSet).sort((a, b) => b - a)
  }, [movements])

  // Preview stats for the selected period
  const previewData = useMemo(() => {
    const filtered = movements.filter((m) => {
      if (!m.date) return false
      const [yStr, mStr] = m.date.split('-')
      const mYear = parseInt(yStr, 10)
      const mMonth = parseInt(mStr, 10)
      if (mYear !== year) return false
      if (periodType === 'monthly') return mMonth === month
      return Math.ceil(mMonth / 3) === quarter
    })

    let income = 0
    let expenses = 0

    filtered.forEach((m) => {
      const amt = Number(m.amount) || 0
      if (m.type === 'venta') income += amt
      if (m.type === 'compra' || m.type === 'gasto') expenses += amt
    })

    return {
      count: filtered.length,
      income,
      expenses,
      net: income - expenses,
    }
  }, [movements, year, month, quarter, periodType])

  if (!isOpen) return null

  const handleDownload = () => {
    generateAccountingPdfReport({
      company: company || { id: 'empresa', name: 'Mi Empresa' },
      periodType,
      year,
      month,
      quarter,
      movements,
    })
    setDownloadSuccess(true)
    setTimeout(() => {
      setDownloadSuccess(false)
      onClose()
    }, 1200)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-150 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-900 text-white">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-900">
                Descargar Informe Contable en PDF
              </h2>
              <p className="text-xs text-neutral-500">
                Estados contables oficiales, P&L, balance y libro de movimientos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="mt-5 space-y-4">
          {/* Company info strip */}
          {company && (
            <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-xs">
              <div className="flex items-center space-x-2 text-neutral-700">
                <Building2 className="h-4 w-4 text-neutral-500" />
                <span className="font-semibold text-neutral-900">{company.name}</span>
                <span className="text-neutral-400 font-mono text-[11px]">({company.id})</span>
              </div>
              <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                Sincronizado Turso
              </span>
            </div>
          )}

          {/* Period Type Switcher */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1.5">
              Tipo de Período
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPeriodType('monthly')}
                className={`flex items-center justify-center space-x-2 rounded-lg border py-2.5 text-xs font-medium transition cursor-pointer ${
                  periodType === 'monthly'
                    ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                    : 'border-neutral-250 bg-white text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <Calendar className="h-4 w-4" />
                <span>Informe Mensual</span>
              </button>

              <button
                type="button"
                onClick={() => setPeriodType('quarterly')}
                className={`flex items-center justify-center space-x-2 rounded-lg border py-2.5 text-xs font-medium transition cursor-pointer ${
                  periodType === 'quarterly'
                    ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                    : 'border-neutral-250 bg-white text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <Calendar className="h-4 w-4" />
                <span>Informe Trimestral</span>
              </button>
            </div>
          </div>

          {/* Year and Month/Quarter selector */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Año
              </label>
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value, 10))}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 shadow-xs focus:border-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-neutral-900 bg-white"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div>
              {periodType === 'monthly' ? (
                <>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Mes
                  </label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(parseInt(e.target.value, 10))}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 shadow-xs focus:border-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-neutral-900 bg-white"
                  >
                    {MONTH_NAMES.map((name, idx) => (
                      <option key={idx} value={idx + 1}>
                        {name}
                      </option>
                    ))}
                  </select>
                </>
              ) : (
                <>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Trimestre
                  </label>
                  <select
                    value={quarter}
                    onChange={(e) => setQuarter(parseInt(e.target.value, 10))}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 shadow-xs focus:border-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-neutral-900 bg-white"
                  >
                    {QUARTERS.map((q) => (
                      <option key={q.value} value={q.value}>
                        {q.label}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>
          </div>

          {/* Selected Period Preview KPI */}
          <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-3.5 space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
              Resumen del período seleccionado
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-white border border-neutral-200 p-2">
                <div className="text-[10px] text-neutral-400 uppercase font-medium">Ingresos</div>
                <div className="font-mono text-xs font-semibold text-neutral-900 mt-0.5">
                  {formatCurrency(previewData.income)}
                </div>
              </div>

              <div className="rounded-lg bg-white border border-neutral-200 p-2">
                <div className="text-[10px] text-neutral-400 uppercase font-medium">Gastos</div>
                <div className="font-mono text-xs font-semibold text-neutral-700 mt-0.5">
                  {formatCurrency(previewData.expenses)}
                </div>
              </div>

              <div className="rounded-lg bg-white border border-neutral-200 p-2">
                <div className="text-[10px] text-neutral-400 uppercase font-medium">Resultado</div>
                <div
                  className={`font-mono text-xs font-semibold mt-0.5 ${
                    previewData.net > 0
                      ? 'text-neutral-900'
                      : previewData.net < 0
                      ? 'text-neutral-600'
                      : 'text-neutral-400'
                  }`}
                >
                  {formatCurrency(previewData.net, true)}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1">
              <span>Operaciones incluidas:</span>
              <span className="font-semibold text-neutral-900 font-mono">
                {previewData.count} movimientos
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-neutral-150">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center space-x-2 rounded-lg bg-neutral-900 px-5 py-2 text-xs font-medium text-white shadow-xs hover:bg-neutral-800 transition cursor-pointer active:scale-[0.98]"
            >
              {downloadSuccess ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>¡PDF Descargado!</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>Descargar Informe PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
