import type {
  AccountingInterpretation,
  Movement,
  MovementType,
  PaymentMethod,
} from '../types'

export const MOVEMENT_TYPES: { value: MovementType; label: string }[] = [
  { value: 'venta', label: 'Venta' },
  { value: 'compra', label: 'Compra' },
  { value: 'gasto', label: 'Gasto' },
  { value: 'ingreso_capital', label: 'Ingreso de capital' },
  { value: 'prestamo', label: 'Préstamo' },
  { value: 'cobro', label: 'Cobro' },
  { value: 'pago', label: 'Pago' },
  { value: 'otro', label: 'Otro' },
]

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'banco', label: 'Banco' },
  { value: 'caja', label: 'Caja' },
  { value: 'otro', label: 'Otro' },
]

export function getMovementTypeLabel(type: MovementType): string {
  const match = MOVEMENT_TYPES.find((t) => t.value === type)
  return match ? match.label : type
}

export function getPaymentMethodLabel(method: PaymentMethod): string {
  const match = PAYMENT_METHODS.find((m) => m.value === method)
  return match ? match.label : method
}

function getTreasuryAccount(method: PaymentMethod): { code: string; name: string } {
  switch (method) {
    case 'banco':
      return { code: '572', name: 'Bancos c/c' }
    case 'caja':
      return { code: '570', name: 'Caja, euros' }
    case 'otro':
    default:
      return { code: '572', name: 'Tesorería' }
  }
}

function roundToTwo(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100
}

export function interpretMovement(movement: Movement): AccountingInterpretation {
  const amount = Number(movement.amount) || 0
  const treasury = getTreasuryAccount(movement.method)
  const applyVat = movement.applyVat ?? (movement.type === 'venta' || movement.type === 'compra' || movement.type === 'gasto')

  switch (movement.type) {
    case 'venta': {
      if (applyVat) {
        const vatAmount = roundToTwo(amount * 0.21)
        const totalAmount = roundToTwo(amount + vatAmount)
        return {
          debe: [{ code: treasury.code, name: treasury.name, amount: totalAmount }],
          haber: [
            { code: '700', name: 'Ventas de mercaderías', amount: amount },
            { code: '477', name: 'H.P. IVA repercutido (21%)', amount: vatAmount },
          ],
          impact: {
            activo: totalAmount,
            pasivo: vatAmount,
            patrimonioNeto: amount,
          },
        }
      } else {
        return {
          debe: [{ code: treasury.code, name: treasury.name, amount }],
          haber: [{ code: '700', name: 'Ventas de mercaderías', amount }],
          impact: {
            activo: amount,
            pasivo: 0,
            patrimonioNeto: amount,
          },
        }
      }
    }

    case 'compra': {
      if (applyVat) {
        const vatAmount = roundToTwo(amount * 0.21)
        const totalAmount = roundToTwo(amount + vatAmount)
        return {
          debe: [
            { code: '600', name: 'Compras de mercaderías', amount: amount },
            { code: '472', name: 'H.P. IVA soportado (21%)', amount: vatAmount },
          ],
          haber: [{ code: treasury.code, name: treasury.name, amount: totalAmount }],
          impact: {
            activo: -amount, // -total (banco) + vatAmount (crédito IVA) = -amount neto
            pasivo: 0,
            patrimonioNeto: -amount,
          },
        }
      } else {
        return {
          debe: [{ code: '600', name: 'Compras de mercaderías', amount }],
          haber: [{ code: treasury.code, name: treasury.name, amount }],
          impact: {
            activo: -amount,
            pasivo: 0,
            patrimonioNeto: -amount,
          },
        }
      }
    }

    case 'gasto': {
      if (applyVat) {
        const vatAmount = roundToTwo(amount * 0.21)
        const totalAmount = roundToTwo(amount + vatAmount)
        return {
          debe: [
            { code: '629', name: 'Otros servicios / Gastos', amount: amount },
            { code: '472', name: 'H.P. IVA soportado (21%)', amount: vatAmount },
          ],
          haber: [{ code: treasury.code, name: treasury.name, amount: totalAmount }],
          impact: {
            activo: -amount, // -total + vatAmount = -amount neto
            pasivo: 0,
            patrimonioNeto: -amount,
          },
        }
      } else {
        return {
          debe: [{ code: '629', name: 'Otros servicios / Gastos', amount }],
          haber: [{ code: treasury.code, name: treasury.name, amount }],
          impact: {
            activo: -amount,
            pasivo: 0,
            patrimonioNeto: -amount,
          },
        }
      }
    }

    case 'ingreso_capital': {
      return {
        debe: [{ code: treasury.code, name: treasury.name, amount }],
        haber: [{ code: '100', name: 'Capital social', amount }],
        impact: {
          activo: amount,
          pasivo: 0,
          patrimonioNeto: amount,
        },
      }
    }

    case 'prestamo': {
      return {
        debe: [{ code: treasury.code, name: treasury.name, amount }],
        haber: [{ code: '520', name: 'Deudas a c/p con entidades crédito', amount }],
        impact: {
          activo: amount,
          pasivo: amount,
          patrimonioNeto: 0,
        },
      }
    }

    case 'cobro': {
      return {
        debe: [{ code: treasury.code, name: treasury.name, amount }],
        haber: [{ code: '430', name: 'Clientes', amount }],
        impact: {
          activo: 0,
          pasivo: 0,
          patrimonioNeto: 0,
        },
      }
    }

    case 'pago': {
      return {
        debe: [{ code: '400', name: 'Proveedores / Acreedores', amount }],
        haber: [{ code: treasury.code, name: treasury.name, amount }],
        impact: {
          activo: -amount,
          pasivo: -amount,
          patrimonioNeto: 0,
        },
      }
    }

    case 'otro':
    default: {
      return {
        debe: [{ code: treasury.code, name: treasury.name, amount }],
        haber: [{ code: '555', name: 'Partidas pendientes de aplicación', amount }],
        impact: {
          activo: amount,
          pasivo: 0,
          patrimonioNeto: amount,
        },
      }
    }
  }
}

export function formatCurrency(amount: number, showSign = false): string {
  const absValue = Math.abs(amount)
  const formatted = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absValue)

  if (showSign) {
    if (amount > 0) return `+${formatted}`
    if (amount < 0) return `-${formatted}`
    return formatted
  }

  return amount < 0 ? `-${formatted}` : formatted
}

export function formatDate(dateString: string): string {
  if (!dateString) return ''
  const parts = dateString.split('-')
  if (parts.length === 3) {
    const [year, month, day] = parts
    return `${day}/${month}/${year}`
  }
  return dateString
}

export function getTodayDateString(): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
