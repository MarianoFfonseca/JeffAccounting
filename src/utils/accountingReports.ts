import type { Movement } from '../types'
import { interpretMovement } from './accounting'

export interface ProfitAndLossReport {
  operatingIncome: {
    sales: number
    otherIncome: number
    total: number
  }
  operatingExpenses: {
    purchases: number
    externalServices: number
    otherExpenses: number
    total: number
  }
  operatingResult: number // Ingresos - Gastos
  netResult: number
}

export interface BalanceSheetReport {
  activo: {
    nonCurrent: {
      items: { name: string; amount: number }[]
      total: number
    }
    current: {
      treasuryBank: number
      treasuryCash: number
      vatReceivable: number // 472 H.P. IVA soportado
      tradeReceivables: number // 430 Clientes
      total: number
    }
    total: number
  }
  patrimonioNeto: {
    shareCapital: number // 100 Capital social
    exerciseResult: number // Resultado del ejercicio
    otherEquity: number
    total: number
  }
  pasivo: {
    nonCurrent: {
      total: number
    }
    current: {
      bankLoans: number // 520 Deudas entidades crédito
      vatPayable: number // 477 H.P. IVA repercutido
      tradePayables: number // 400 Proveedores
      total: number
    }
    total: number
  }
  totalPatrimonioNetoYPasivo: number
  isBalanced: boolean
  difference: number
}

export interface PeriodSummary {
  periodKey: string
  periodLabel: string
  year: number
  income: number
  expenses: number
  netResult: number
  cashInflow: number
  cashOutflow: number
  netCashFlow: number
  movementCount: number
}

export function computeProfitAndLoss(movements: Movement[]): ProfitAndLossReport {
  let sales = 0
  let otherIncome = 0
  let purchases = 0
  let externalServices = 0
  let otherExpenses = 0

  for (const m of movements) {
    const amount = Number(m.amount) || 0
    switch (m.type) {
      case 'venta':
        sales += amount
        break
      case 'compra':
        purchases += amount
        break
      case 'gasto':
        externalServices += amount
        break
      case 'otro':
        if (amount > 0) {
          otherIncome += amount
        } else {
          otherExpenses += Math.abs(amount)
        }
        break
      default:
        // ingreso_capital, prestamo, cobro, pago don't affect P&L
        break
    }
  }

  const totalIncome = sales + otherIncome
  const totalExpenses = purchases + externalServices + otherExpenses
  const operatingResult = totalIncome - totalExpenses
  const netResult = operatingResult

  return {
    operatingIncome: {
      sales,
      otherIncome,
      total: totalIncome,
    },
    operatingExpenses: {
      purchases,
      externalServices,
      otherExpenses,
      total: totalExpenses,
    },
    operatingResult,
    netResult,
  }
}

export function computeBalanceSheet(movements: Movement[]): BalanceSheetReport {
  let treasuryBank = 0
  let treasuryCash = 0
  let vatReceivable = 0 // 472
  let vatPayable = 0 // 477
  let bankLoans = 0 // 520
  let shareCapital = 0 // 100
  let tradeReceivables = 0 // 430
  let tradePayables = 0 // 400

  for (const m of movements) {
    const interpretation = interpretMovement(m)

    // Accumulate each journal entry into respective accounts
    for (const d of interpretation.debe) {
      if (d.code === '572') treasuryBank += d.amount
      else if (d.code === '570') treasuryCash += d.amount
      else if (d.code === '472') vatReceivable += d.amount
      else if (d.code === '430') tradeReceivables += d.amount
      else if (d.code === '400') tradePayables -= d.amount
      else if (d.code === '520') bankLoans -= d.amount
    }

    for (const h of interpretation.haber) {
      if (h.code === '572') treasuryBank -= h.amount
      else if (h.code === '570') treasuryCash -= h.amount
      else if (h.code === '477') vatPayable += h.amount
      else if (h.code === '100') shareCapital += h.amount
      else if (h.code === '520') bankLoans += h.amount
      else if (h.code === '430') tradeReceivables -= h.amount
      else if (h.code === '400') tradePayables += h.amount
    }
  }

  const pnl = computeProfitAndLoss(movements)
  const exerciseResult = pnl.netResult

  const currentAssetsTotal =
    treasuryBank + treasuryCash + vatReceivable + tradeReceivables
  const totalActivo = currentAssetsTotal

  const totalPatrimonioNeto = shareCapital + exerciseResult

  const currentLiabilitiesTotal = bankLoans + vatPayable + tradePayables
  const totalPasivo = currentLiabilitiesTotal

  const totalPatrimonioNetoYPasivo = totalPatrimonioNeto + totalPasivo
  const difference = Math.round((totalActivo - totalPatrimonioNetoYPasivo) * 100) / 100
  const isBalanced = Math.abs(difference) < 0.01

  return {
    activo: {
      nonCurrent: {
        items: [],
        total: 0,
      },
      current: {
        treasuryBank: Math.round(treasuryBank * 100) / 100,
        treasuryCash: Math.round(treasuryCash * 100) / 100,
        vatReceivable: Math.round(vatReceivable * 100) / 100,
        tradeReceivables: Math.round(tradeReceivables * 100) / 100,
        total: Math.round(currentAssetsTotal * 100) / 100,
      },
      total: Math.round(totalActivo * 100) / 100,
    },
    patrimonioNeto: {
      shareCapital: Math.round(shareCapital * 100) / 100,
      exerciseResult: Math.round(exerciseResult * 100) / 100,
      otherEquity: 0,
      total: Math.round(totalPatrimonioNeto * 100) / 100,
    },
    pasivo: {
      nonCurrent: {
        total: 0,
      },
      current: {
        bankLoans: Math.round(bankLoans * 100) / 100,
        vatPayable: Math.round(vatPayable * 100) / 100,
        tradePayables: Math.round(tradePayables * 100) / 100,
        total: Math.round(currentLiabilitiesTotal * 100) / 100,
      },
      total: Math.round(totalPasivo * 100) / 100,
    },
    totalPatrimonioNetoYPasivo: Math.round(totalPatrimonioNetoYPasivo * 100) / 100,
    isBalanced,
    difference,
  }
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

export function computePeriodicSummaries(
  movements: Movement[],
  mode: 'monthly' | 'quarterly' | 'four_months' | 'annual'
): PeriodSummary[] {
  const groups: Record<string, Movement[]> = {}

  for (const m of movements) {
    if (!m.date) continue
    const [yearStr, monthStr] = m.date.split('-')
    const year = parseInt(yearStr, 10) || new Date().getFullYear()
    const month = parseInt(monthStr, 10) || 1

    let key = ''
    if (mode === 'monthly') {
      key = `${year}-${String(month).padStart(2, '0')}`
    } else if (mode === 'quarterly') {
      // 1T: Ene-Mar (1-3), 2T: Abr-Jun (4-6), 3T: Jul-Sep (7-9), 4T: Oct-Dic (10-12)
      const trimestre = Math.ceil(month / 3)
      key = `${year}-Q${trimestre}`
    } else if (mode === 'four_months') {
      // 1C: Ene-Abr (1-4), 2C: May-Ago (5-8), 3C: Sep-Dic (9-12)
      const cuatrimestre = month <= 4 ? 1 : month <= 8 ? 2 : 3
      key = `${year}-C${cuatrimestre}`
    } else {
      key = `${year}`
    }

    if (!groups[key]) groups[key] = []
    groups[key].push(m)
  }

  // Convert groups into summaries
  const summaries: PeriodSummary[] = Object.keys(groups).map((key) => {
    const list = groups[key]
    let income = 0
    let expenses = 0
    let cashInflow = 0
    let cashOutflow = 0
    let year = 0

    for (const m of list) {
      const interpretation = interpretMovement(m)
      const amount = Number(m.amount) || 0

      if (m.type === 'venta') income += amount
      if (m.type === 'compra' || m.type === 'gasto') expenses += amount

      // Cash flow (treasury debit = inflow, treasury credit = outflow)
      for (const d of interpretation.debe) {
        if (d.code === '572' || d.code === '570') cashInflow += d.amount
      }
      for (const h of interpretation.haber) {
        if (h.code === '572' || h.code === '570') cashOutflow += h.amount
      }
    }

    let periodLabel = ''
    if (mode === 'monthly') {
      const [yStr, mStr] = key.split('-')
      year = parseInt(yStr, 10)
      const mIdx = parseInt(mStr, 10) - 1
      periodLabel = `${MONTH_NAMES[mIdx]} ${year}`
    } else if (mode === 'quarterly') {
      const [yStr, qStr] = key.split('-')
      year = parseInt(yStr, 10)
      const qNum = qStr.replace('Q', '')
      const range =
        qNum === '1'
          ? 'Ene - Mar'
          : qNum === '2'
          ? 'Abr - Jun'
          : qNum === '3'
          ? 'Jul - Sep'
          : 'Oct - Dic'
      periodLabel = `${qNum}º Trimestre ${year} (${range})`
    } else if (mode === 'four_months') {
      const [yStr, cStr] = key.split('-')
      year = parseInt(yStr, 10)
      const cNum = cStr.replace('C', '')
      const range = cNum === '1' ? 'Ene - Abr' : cNum === '2' ? 'May - Ago' : 'Sep - Dic'
      periodLabel = `${cNum}º Cuatrimestre ${year} (${range})`
    } else {
      year = parseInt(key, 10)
      periodLabel = `Año ${year}`
    }

    return {
      periodKey: key,
      periodLabel,
      year,
      income: Math.round(income * 100) / 100,
      expenses: Math.round(expenses * 100) / 100,
      netResult: Math.round((income - expenses) * 100) / 100,
      cashInflow: Math.round(cashInflow * 100) / 100,
      cashOutflow: Math.round(cashOutflow * 100) / 100,
      netCashFlow: Math.round((cashInflow - cashOutflow) * 100) / 100,
      movementCount: list.length,
    }
  })

  // Sort descending by periodKey
  summaries.sort((a, b) => b.periodKey.localeCompare(a.periodKey))
  return summaries
}

export interface SubgroupSummary {
  subgroup: string
  movementCount: number
  income: number
  expenses: number
  netResult: number
}

export function computeSubgroupBreakdown(movements: Movement[]): SubgroupSummary[] {
  const map: Record<string, { count: number; income: number; expenses: number }> = {}

  for (const m of movements) {
    const key = m.subgroup && m.subgroup.trim() ? m.subgroup.trim() : 'Sin subgrupo'
    if (!map[key]) {
      map[key] = { count: 0, income: 0, expenses: 0 }
    }
    const amount = Number(m.amount) || 0
    map[key].count += 1
    if (m.type === 'venta') {
      map[key].income += amount
    } else if (m.type === 'compra' || m.type === 'gasto') {
      map[key].expenses += amount
    }
  }

  return Object.keys(map)
    .map((subgroup) => {
      const data = map[subgroup]
      return {
        subgroup,
        movementCount: data.count,
        income: Math.round(data.income * 100) / 100,
        expenses: Math.round(data.expenses * 100) / 100,
        netResult: Math.round((data.income - data.expenses) * 100) / 100,
      }
    })
    .sort((a, b) => b.income + b.expenses - (a.income + a.expenses))
}
