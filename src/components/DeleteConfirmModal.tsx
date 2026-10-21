import type { Movement } from '../types'
import { formatCurrency, formatDate } from '../utils/accounting'

interface DeleteConfirmModalProps {
  isOpen: boolean
  movement: Movement | null
  onClose: () => void
  onConfirm: () => void
}

export function DeleteConfirmModal({
  isOpen,
  movement,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  if (!isOpen || !movement) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl transition-all">
        <h3 className="text-lg font-semibold text-neutral-900">
          Eliminar movimiento
        </h3>
        <p className="mt-2 text-sm text-neutral-600">
          ¿Estás seguro de que deseas eliminar este movimiento? Se eliminará del archivo JSON local y se recalculará la contabilidad.
        </p>

        {/* Movement details preview */}
        <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs space-y-1">
          <div className="flex justify-between font-mono text-neutral-500">
            <span>Fecha: {formatDate(movement.date)}</span>
            <span className="font-semibold text-neutral-900 font-mono">
              {formatCurrency(movement.amount)}
            </span>
          </div>
          <div className="font-medium text-neutral-800">
            {movement.description}
          </div>
        </div>

        {/* Modal actions */}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-xs hover:bg-red-700 transition cursor-pointer"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}
