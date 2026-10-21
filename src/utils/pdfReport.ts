import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Movement } from '../types'
import {
  computeProfitAndLoss,
  computeBalanceSheet,
  computeSubgroupBreakdown,
} from './accountingReports'
import {
  formatCurrency,
  formatDate,
  getMovementTypeLabel,
  getPaymentMethodLabel,
  interpretMovement,
} from './accounting'

export interface GeneratePdfOptions {
  company: {
    id: string
    name: string
  }
  periodType: 'monthly' | 'quarterly'
  year: number
  month?: number // 1 to 12
  quarter?: number // 1 to 4
  movements: Movement[]
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

export function generateAccountingPdfReport({
  company,
  periodType,
  year,
  month = 1,
  quarter = 1,
  movements,
}: GeneratePdfOptions): void {
  // 1. Filter movements for the selected period
  const periodMovements = movements.filter((m) => {
    if (!m.date) return false
    const [yStr, mStr] = m.date.split('-')
    const mYear = parseInt(yStr, 10)
    const mMonth = parseInt(mStr, 10)

    if (mYear !== year) return false

    if (periodType === 'monthly') {
      return mMonth === month
    } else {
      const mQuarter = Math.ceil(mMonth / 3)
      return mQuarter === quarter
    }
  })

  // Cumulative movements up to the end of the period for the Balance Sheet
  const cumulativeMovements = movements.filter((m) => {
    if (!m.date) return false
    const [yStr, mStr] = m.date.split('-')
    const mYear = parseInt(yStr, 10)
    const mMonth = parseInt(mStr, 10)

    if (mYear < year) return true
    if (mYear > year) return false

    if (periodType === 'monthly') {
      return mMonth <= month
    } else {
      const maxMonth = quarter * 3
      return mMonth <= maxMonth
    }
  })

  // 2. Calculations
  const pnl = computeProfitAndLoss(periodMovements)
  const balanceSheet = computeBalanceSheet(cumulativeMovements)
  const subgroupBreakdown = computeSubgroupBreakdown(periodMovements)

  let cashInflow = 0
  let cashOutflow = 0
  let vatReceivable = 0
  let vatPayable = 0

  for (const m of periodMovements) {
    const interpretation = interpretMovement(m)
    for (const d of interpretation.debe) {
      if (d.code === '572' || d.code === '570') cashInflow += d.amount
      if (d.code === '472') vatReceivable += d.amount
    }
    for (const h of interpretation.haber) {
      if (h.code === '572' || h.code === '570') cashOutflow += h.amount
      if (h.code === '477') vatPayable += h.amount
    }
  }

  const netCashFlow = cashInflow - cashOutflow
  const netVatSettlement = vatPayable - vatReceivable

  // Period label
  let periodTitle = ''
  let filePeriodName = ''
  if (periodType === 'monthly') {
    const monthName = MONTH_NAMES[month - 1]
    periodTitle = `Mes de ${monthName} de ${year}`
    filePeriodName = `${monthName}_${year}`
  } else {
    const ranges = ['Enero - Marzo', 'Abril - Junio', 'Julio - Septiembre', 'Octubre - Diciembre']
    periodTitle = `${quarter}º Trimestre de ${year} (${ranges[quarter - 1]})`
    filePeriodName = `T${quarter}_${year}`
  }

  // 3. Document Setup
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 14

  // Helper for Section Titles
  const addSectionHeader = (title: string, yPos: number): number => {
    doc.setFillColor(245, 245, 245)
    doc.rect(margin, yPos - 4, pageWidth - margin * 2, 7, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(30, 41, 59)
    doc.text(title, margin + 2, yPos + 1)
    return yPos + 7
  }

  // 4. Header
  // Top decorative bar
  doc.setFillColor(24, 24, 27) // neutral-900
  doc.rect(0, 0, pageWidth, 5, 'F')

  let currentY = 16

  // Company and Report Info
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(17, 24, 39)
  doc.text(company.name || 'JeffAccounting', margin, currentY)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text(`ID Empresa: ${company.id}`, margin, currentY + 5)

  // Right side header info
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(24, 24, 27)
  const reportTypeHeading =
    periodType === 'monthly' ? 'INFORME CONTABLE MENSUAL' : 'INFORME CONTABLE TRIMESTRAL'
  doc.text(reportTypeHeading, pageWidth - margin, currentY, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(71, 85, 105)
  doc.text(periodTitle, pageWidth - margin, currentY + 5, { align: 'right' })

  const now = new Date()
  const issueDate = `${now.toLocaleDateString('es-ES')} ${now.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })}`
  doc.text(`Fecha de emisión: ${issueDate}`, pageWidth - margin, currentY + 9, { align: 'right' })

  // Divider line
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.5)
  doc.line(margin, currentY + 13, pageWidth - margin, currentY + 13)

  currentY += 19

  // 5. Section 1: RESUMEN EJECUTIVO (KPIs)
  currentY = addSectionHeader('1. RESUMEN EJECUTIVO Y FLUJO DE TESORERÍA', currentY)

  const summaryRows = [
    [
      'Ingresos de Explotación (Ventas):',
      formatCurrency(pnl.operatingIncome.total),
      'Cobros en Tesorería:',
      formatCurrency(cashInflow),
    ],
    [
      'Gastos de Explotación (Compras/Gastos):',
      formatCurrency(pnl.operatingExpenses.total),
      'Pagos en Tesorería:',
      formatCurrency(cashOutflow),
    ],
    [
      'Resultado Neto del Período:',
      formatCurrency(pnl.netResult, true),
      'Flujo Neto de Caja:',
      formatCurrency(netCashFlow, true),
    ],
    [
      'IVA Repercutido (Ventas - 21%):',
      formatCurrency(vatPayable),
      'Liquidación Estimada IVA:',
      netVatSettlement >= 0
        ? `${formatCurrency(netVatSettlement)} (A ingresar)`
        : `${formatCurrency(Math.abs(netVatSettlement))} (A compensar)`,
    ],
    [
      'IVA Soportado Deducible (Compras - 21%):',
      formatCurrency(vatReceivable),
      'Total Operaciones Registradas:',
      `${periodMovements.length} movimientos`,
    ],
  ]

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'plain',
    styles: {
      fontSize: 8.5,
      cellPadding: 1.8,
      textColor: [51, 65, 85],
    },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [71, 85, 105], cellWidth: 55 },
      1: { fontStyle: 'bold', textColor: [15, 23, 42], cellWidth: 35 },
      2: { fontStyle: 'bold', textColor: [71, 85, 105], cellWidth: 50 },
      3: { fontStyle: 'bold', textColor: [15, 23, 42], cellWidth: 42 },
    },
    body: summaryRows,
  })

  currentY = (doc as any).lastAutoTable.finalY + 8

  // 6. Section 2: CUENTA DE PÉRDIDAS Y GANANCIAS (P&L)
  currentY = addSectionHeader('2. CUENTA DE PÉRDIDAS Y GANANCIAS DEL PERÍODO', currentY)

  const pnlRows = [
    ['(+) Ventas e ingresos por actividad comercial (Cta. 700)', formatCurrency(pnl.operatingIncome.sales)],
    ['(+) Otros ingresos de explotación', formatCurrency(pnl.operatingIncome.otherIncome)],
    ['TOTAL INGRESOS DE EXPLOTACIÓN', formatCurrency(pnl.operatingIncome.total)],
    ['(-) Compras de mercaderías y aprovisionamientos (Cta. 600)', `-${formatCurrency(pnl.operatingExpenses.purchases)}`],
    ['(-) Servicios exteriores y suministros (Cta. 629)', `-${formatCurrency(pnl.operatingExpenses.externalServices)}`],
    ['(-) Otros gastos de explotación', `-${formatCurrency(pnl.operatingExpenses.otherExpenses)}`],
    ['TOTAL GASTOS DE EXPLOTACIÓN', `-${formatCurrency(pnl.operatingExpenses.total)}`],
    ['RESULTADO NETO DE EXPLOTACIÓN (BENEFICIO / PÉRDIDA)', formatCurrency(pnl.netResult, true)],
  ]

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Partida Contable', 'Importe Neto']],
    body: pnlRows,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
      cellPadding: 2,
    },
    styles: {
      fontSize: 8,
      cellPadding: 1.8,
    },
    columnStyles: {
      0: { cellWidth: 140 },
      1: { halign: 'right', fontStyle: 'bold', cellWidth: 42 },
    },
    didParseCell: (data) => {
      // Highlight total rows
      if (
        data.row.index === 2 ||
        data.row.index === 6 ||
        data.row.index === 7
      ) {
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.textColor = [15, 23, 42]
        if (data.row.index === 7) {
          data.cell.styles.fillColor = [241, 245, 249]
        }
      }
    },
  })

  currentY = (doc as any).lastAutoTable.finalY + 8

  // Check if we need a new page for Balance and subsequent sections
  if (currentY > pageHeight - 75) {
    doc.addPage()
    currentY = 16
  }

  // 7. Section 3: BALANCE DE SITUACIÓN CONSOLIDADO
  currentY = addSectionHeader('3. BALANCE DE SITUACIÓN (CIERRE ACUMULADO)', currentY)

  const balanceRows = [
    [
      'Activo Corriente: Tesorería (Bancos 572)',
      formatCurrency(balanceSheet.activo.current.treasuryBank),
      'Pasivo Corriente: Préstamos c/p (520)',
      formatCurrency(balanceSheet.pasivo.current.bankLoans),
    ],
    [
      'Activo Corriente: Caja (570)',
      formatCurrency(balanceSheet.activo.current.treasuryCash),
      'Pasivo Corriente: H.P. IVA Repercutido (477)',
      formatCurrency(balanceSheet.pasivo.current.vatPayable),
    ],
    [
      'Activo Corriente: H.P. IVA Soportado (472)',
      formatCurrency(balanceSheet.activo.current.vatReceivable),
      'Pasivo Corriente: Proveedores (400)',
      formatCurrency(balanceSheet.pasivo.current.tradePayables),
    ],
    [
      'Activo Corriente: Clientes (430)',
      formatCurrency(balanceSheet.activo.current.tradeReceivables),
      'Patrimonio Neto: Capital Social (100)',
      formatCurrency(balanceSheet.patrimonioNeto.shareCapital),
    ],
    [
      '',
      '',
      'Patrimonio Neto: Resultado del Ejercicio (129)',
      formatCurrency(balanceSheet.patrimonioNeto.exerciseResult, true),
    ],
    [
      'TOTAL ACTIVO',
      formatCurrency(balanceSheet.activo.total),
      'TOTAL PASIVO + PATRIMONIO NETO',
      formatCurrency(balanceSheet.totalPatrimonioNetoYPasivo),
    ],
  ]

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Estructura de Activo (Bienes y Derechos)', 'Importe', 'Pasivo y Patrimonio Neto (Obligaciones)', 'Importe']],
    body: balanceRows,
    theme: 'grid',
    headStyles: {
      fillColor: [51, 65, 85],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      cellPadding: 2,
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 1.6,
    },
    columnStyles: {
      0: { cellWidth: 62 },
      1: { halign: 'right', fontStyle: 'bold', cellWidth: 28 },
      2: { cellWidth: 64 },
      3: { halign: 'right', fontStyle: 'bold', cellWidth: 28 },
    },
    didParseCell: (data) => {
      if (data.row.index === 5) {
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fillColor = [241, 245, 249]
        data.cell.styles.textColor = [15, 23, 42]
      }
    },
  })

  currentY = (doc as any).lastAutoTable.finalY + 8

  // 8. Section 4: DESGLOSE POR SUBGRUPOS
  if (currentY > pageHeight - 65) {
    doc.addPage()
    currentY = 16
  }

  currentY = addSectionHeader('4. ANÁLISIS DE ACTIVIDAD POR SUBGRUPOS', currentY)

  if (subgroupBreakdown.length === 0) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)
    doc.text('No hay operaciones registradas con subgrupos en este período.', margin, currentY + 3)
    currentY += 8
  } else {
    const subgroupRows = subgroupBreakdown.map((s) => [
      s.subgroup,
      String(s.movementCount),
      formatCurrency(s.income),
      formatCurrency(s.expenses),
      formatCurrency(s.netResult, true),
    ])

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['Subgrupo', 'Operaciones', 'Total Ingresos', 'Total Gastos', 'Saldo Neto']],
      body: subgroupRows,
      theme: 'striped',
      headStyles: {
        fillColor: [71, 85, 105],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        cellPadding: 2,
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 1.6,
      },
      columnStyles: {
        0: { cellWidth: 60, fontStyle: 'bold' },
        1: { halign: 'center', cellWidth: 26 },
        2: { halign: 'right', cellWidth: 32 },
        3: { halign: 'right', cellWidth: 32 },
        4: { halign: 'right', fontStyle: 'bold', cellWidth: 32 },
      },
    })

    currentY = (doc as any).lastAutoTable.finalY + 8
  }

  // 9. Section 5: LIBRO REGISTRO DETALLADO DE MOVIMIENTOS
  if (currentY > pageHeight - 55) {
    doc.addPage()
    currentY = 16
  }

  currentY = addSectionHeader('5. LIBRO DETALLADO DE MOVIMIENTOS CONTABLES', currentY)

  if (periodMovements.length === 0) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)
    doc.text('No hay movimientos registrados para el período seleccionado.', margin, currentY + 3)
  } else {
    const sortedMovs = [...periodMovements].sort((a, b) => (a.date || '').localeCompare(b.date || ''))

    const movementsTableRows = sortedMovs.map((m) => {
      const applyVat = m.applyVat && (m.type === 'venta' || m.type === 'compra' || m.type === 'gasto')
      const vatVal = applyVat ? Math.round(m.amount * 0.21 * 100) / 100 : 0
      const totalVal = Math.round((m.amount + vatVal) * 100) / 100

      return [
        formatDate(m.date),
        m.description,
        getMovementTypeLabel(m.type),
        m.subgroup || '—',
        getPaymentMethodLabel(m.method),
        formatCurrency(m.amount),
        applyVat ? formatCurrency(vatVal) : '0,00 €',
        formatCurrency(totalVal),
      ]
    })

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['Fecha', 'Concepto', 'Tipo', 'Subgrupo', 'Método', 'Base', 'IVA (21%)', 'Total']],
      body: movementsTableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
        cellPadding: 1.8,
      },
      styles: {
        fontSize: 7,
        cellPadding: 1.5,
        overflow: 'linebreak',
      },
      columnStyles: {
        0: { cellWidth: 18, fontStyle: 'bold' },
        1: { cellWidth: 50 },
        2: { cellWidth: 20 },
        3: { cellWidth: 24 },
        4: { cellWidth: 16 },
        5: { halign: 'right', cellWidth: 18 },
        6: { halign: 'right', cellWidth: 18 },
        7: { halign: 'right', fontStyle: 'bold', cellWidth: 18 },
      },
    })
  }

  // 10. Footer with Page Numbers
  const totalPages = (doc.internal as any).getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.3)
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(148, 163, 184)
    doc.text(
      `JeffAccounting • Informe Contable • ${company.name} (${company.id})`,
      margin,
      pageHeight - 6
    )
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 6, {
      align: 'right',
    })
  }

  // 11. Trigger Save / Download
  const cleanCompanyName = (company.id || 'empresa').replace(/[^a-z0-9_-]/gi, '_')
  const fileName = `Informe_Contable_${cleanCompanyName}_${filePeriodName}.pdf`
  doc.save(fileName)
}
