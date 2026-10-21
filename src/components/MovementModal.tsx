import { useState } from 'react'
import type { Movement, MovementType, PaymentMethod } from '../types'
import {
  MOVEMENT_TYPES,
  PAYMENT_METHODS,
  formatCurrency,
  getTodayDateString,
  interpretMovement,
} from '../utils/accounting'
import { X } from 'lucide-react'

interface MovementModalProps {
  isOpen: boolean
  initialMovement: Movement | null
  onClose: () => void
  onSave: (data: {
    id?: string
    date: string
    description: string
    amount: number
    type: MovementType
    method: PaymentMethod
    subgroup?: string
    applyVat: boolean
  }) => void
}

interface MovementModalDialogProps {
  initialMovement: Movement | null
  onClose: () => void
  onSave: (data: {
    id?: string
    date: string
    description: string
    amount: number
    type: MovementType
    method: PaymentMethod
    subgroup?: string
    applyVat: boolean
  }) => void
}

function MovementModalDialog({
  initialMovement,
  onClose,
  onSave,
}: MovementModalDialogProps) {
  const [date, setDate] = useState<string>(initialMovement?.date || getTodayDateString())
  const [description, setDescription] = useState<string>(initialMovement?.description || '')
  const [amount, setAmount] = useState<string>(
    initialMovement?.amount ? String(initialMovement.amount) : ''
  )
  const [type, setType] = useState<MovementType>(initialMovement?.type || 'venta')
  const [method, setMethod] = useState<PaymentMethod>(initialMovement?.method || 'banco')
  const [subgroup, setSubgroup] = useState<string>(initialMovement?.subgroup || '')
  const [applyVat, setApplyVat] = useState<boolean>(initialMovement?.applyVat ?? true)
  const [error, setError] = useState<string | null>(null)

  const isEditing = Boolean(initialMovement)
  const parsedAmount = parseFloat(amount.replace(',', '.')) || 0

  // Live accounting interpretation
  const previewMovement: Movement = {
    id: initialMovement?.id || 'preview',
    date: date || getTodayDateString(),
    description: description || 'Sin concepto',
    amount: parsedAmount,
    type,
    method,
    subgroup: subgroup.trim() || undefined,
    applyVat,
  }

  const liveInterpretation = interpretMovement(previewMovement)
  const hasVatOption = type === 'venta' || type === 'compra' || type === 'gasto'

  const suggestedSubgroups: string[] = (() => {
    switch (type) {
      case 'venta':
        return ['Servicios', 'Productos', 'Consultoría', 'Suscripciones', 'Otros']
      case 'compra':
        return ['Mercaderías', 'Materias Primas', 'Embalajes', 'Equipos', 'Otros']
      case 'gasto':
        return ['Suministros', 'Alquiler', 'Marketing', 'Nóminas', 'Software', 'Asesoría', 'Impuestos']
      case 'ingreso_capital':
        return ['Socios', 'Inversores', 'Subvención']
      case 'prestamo':
        return ['Préstamo Bancario', 'Póliza de Crédito']
      case 'cobro':
      case 'pago':
        return ['Clientes', 'Proveedores', 'Hacienda']
      default:
        return ['General', 'Varios']
    }
  })()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!description.trim()) {
      setError('Por favor, introduce un concepto.')
      return
    }

    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Por favor, introduce un importe válido mayor a 0.')
      return
    }

    onSave({
      id: initialMovement?.id,
      date,
      description: description.trim(),
      amount: parsedAmount,
      type,
      method,
      subgroup: subgroup.trim() || undefined,
      applyVat: hasVatOption ? applyVat : false,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl transition-all">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-neutral-150 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">
              {isEditing ? 'Editar movimiento' : 'Añadir movimiento'}
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              {isEditing
                ? 'Modifica los datos y se actualizará automáticamente la contabilidad'
                : 'Registra una nueva operación comercial'}
            </p>
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
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
              {error}
            </div>
          )}

          {/* Fecha */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Fecha
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 shadow-xs focus:border-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-neutral-900"
            />
          </div>

          {/* Concepto */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Concepto
            </label>
            <input
              type="text"
              autoFocus
              placeholder="Ej. Venta de producto, Compra material, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 shadow-xs focus:border-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-neutral-900"
            />
          </div>

          {/* Importe y Método */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Importe (€)
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 font-mono shadow-xs focus:border-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-neutral-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Método
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 shadow-xs focus:border-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-neutral-900 bg-white"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tipo de movimiento */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Tipo de movimiento
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as MovementType)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 shadow-xs focus:border-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-neutral-900 bg-white"
            >
              {MOVEMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Subgrupo Opcional */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-neutral-700">
                Subgrupo <span className="text-neutral-400 font-normal">(opcional)</span>
              </label>
              {subgroup && (
                <button
                  type="button"
                  onClick={() => setSubgroup('')}
                  className="text-[11px] text-neutral-400 hover:text-neutral-700 transition cursor-pointer"
                >
                  Limpiar
                </button>
              )}
            </div>
            <input
              type="text"
              placeholder="Ej. Marketing, Suministros, Alquiler, etc."
              value={subgroup}
              onChange={(e) => setSubgroup(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 shadow-xs focus:border-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-neutral-900 bg-white"
            />
            {/* Sugerencias de subgrupos */}
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {suggestedSubgroups.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setSubgroup(subgroup === item ? '' : item)}
                  className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition cursor-pointer ${
                    subgroup.toLowerCase() === item.toLowerCase()
                      ? 'bg-neutral-900 text-white'
                      : 'border border-neutral-200 bg-neutral-50 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Opcional: IVA checkbox para venta, compra y gasto */}
          {hasVatOption && (
            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="applyVat"
                checked={applyVat}
                onChange={(e) => setApplyVat(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 cursor-pointer"
              />
              <label
                htmlFor="applyVat"
                className="text-xs text-neutral-600 cursor-pointer select-none"
              >
                Aplicar IVA general (21%)
              </label>
            </div>
          )}

          {/* Live Interpretation Preview */}
          {parsedAmount > 0 && (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-3.5 space-y-2.5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                Interpretación contable en tiempo real
              </div>

              {/* Asiento Debe / Haber */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                {/* Debe */}
                <div className="rounded-lg border border-neutral-200 bg-white p-2.5 space-y-1">
                  <div className="font-semibold text-neutral-700 text-[11px] uppercase border-b border-neutral-100 pb-1">
                    Debe
                  </div>
                  {liveInterpretation.debe.map((d, i) => (
                    <div key={i} className="flex justify-between font-mono text-[11px]">
                      <span className="truncate text-neutral-600">
                        {d.code} {d.name}
                      </span>
                      <span className="font-medium text-neutral-900">
                        {formatCurrency(d.amount)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Haber */}
                <div className="rounded-lg border border-neutral-200 bg-white p-2.5 space-y-1">
                  <div className="font-semibold text-neutral-700 text-[11px] uppercase border-b border-neutral-100 pb-1">
                    Haber
                  </div>
                  {liveInterpretation.haber.map((h, i) => (
                    <div key={i} className="flex justify-between font-mono text-[11px]">
                      <span className="truncate text-neutral-600">
                        {h.code} {h.name}
                      </span>
                      <span className="font-medium text-neutral-900">
                        {formatCurrency(h.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Impacto en Balance */}
              <div className="flex items-center justify-between border-t border-neutral-200 pt-2 text-[11px] font-mono">
                <span className="text-neutral-500">Impacto:</span>
                <div className="flex space-x-3">
                  <span>
                    Activo:{' '}
                    <strong className="text-neutral-900">
                      {formatCurrency(liveInterpretation.impact.activo, true)}
                    </strong>
                  </span>
                  <span>
                    Pasivo:{' '}
                    <strong className="text-neutral-900">
                      {formatCurrency(liveInterpretation.impact.pasivo, true)}
                    </strong>
                  </span>
                  <span>
                    PN:{' '}
                    <strong className="text-neutral-900">
                      {formatCurrency(liveInterpretation.impact.patrimonioNeto, true)}
                    </strong>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-neutral-150">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-neutral-900 px-5 py-2 text-sm font-medium text-white shadow-xs hover:bg-neutral-800 transition cursor-pointer"
            >
              {isEditing ? 'Guardar cambios' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function MovementModal({
  isOpen,
  initialMovement,
  onClose,
  onSave,
}: MovementModalProps) {
  if (!isOpen) return null

  return (
    <MovementModalDialog
      key={initialMovement?.id || 'new'}
      initialMovement={initialMovement}
      onClose={onClose}
      onSave={onSave}
    />
  )
}
