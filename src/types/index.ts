export type MovementType =
  | 'venta'
  | 'compra'
  | 'gasto'
  | 'ingreso_capital'
  | 'prestamo'
  | 'cobro'
  | 'pago'
  | 'otro'

export type PaymentMethod = 'banco' | 'caja' | 'otro'

export interface Company {
  id: string
  name: string
  createdAt?: string
}

export interface TursoConfig {
  url: string
  authToken: string
}

export interface Movement {
  id: string
  companyId?: string
  date: string // YYYY-MM-DD
  description: string
  amount: number
  type: MovementType
  method: PaymentMethod
  subgroup?: string // Opcional: subgrupo de clasificación
  applyVat?: boolean // 21% IVA for venta/compra/gasto
  createdAt?: string
}

export interface AccountingData {
  movements: Movement[]
}

export interface JournalAccountEntry {
  code: string
  name: string
  amount: number
}

export interface BalanceImpact {
  activo: number
  pasivo: number
  patrimonioNeto: number
}

export interface AccountingInterpretation {
  debe: JournalAccountEntry[]
  haber: JournalAccountEntry[]
  impact: BalanceImpact
}

export interface InterpretedMovement {
  movement: Movement
  interpretation: AccountingInterpretation
}

export interface ElectronAPI {
  loadData: () => Promise<AccountingData>
  saveData: (data: AccountingData) => Promise<{ success: boolean; error?: string }>
  getStoragePath: () => Promise<string>
  openDataFolder: () => Promise<boolean>
  isElectron: boolean

  // Turso DB & Company Auth API
  tursoGetConfig: () => Promise<TursoConfig>
  tursoSaveConfig: (config: TursoConfig) => Promise<{ success: boolean; error?: string }>
  tursoCheckConnection: (config?: TursoConfig) => Promise<{ success: boolean; error?: string }>
  tursoLogin: (companyId: string, password: string) => Promise<{ success: boolean; company?: Company; error?: string }>
  tursoRegister: (companyId: string, name: string, password: string) => Promise<{ success: boolean; company?: Company; error?: string }>
  tursoGetMovements: (companyId: string) => Promise<{ success: boolean; movements?: Movement[]; error?: string }>
  tursoSaveMovement: (companyId: string, movement: Movement) => Promise<{ success: boolean; error?: string }>
  tursoDeleteMovement: (companyId: string, movementId: string) => Promise<{ success: boolean; error?: string }>
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}
