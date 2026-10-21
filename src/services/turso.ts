import { createClient, type Client } from '@libsql/client/web'
import type { Company, Movement, TursoConfig } from '../types'

const CURRENT_COMPANY_KEY = 'jeffaccounting-current-company'
const TURSO_CONFIG_KEY = 'jeffaccounting-turso-config'

// Web client cache for browser fallback
let webClientCache: Client | null = null
let webClientCacheConfig = { url: '', authToken: '' }

async function hashPasswordWeb(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + '_jeff_accounting_salt_2026')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

function getWebTursoConfig(): TursoConfig {
  const raw = localStorage.getItem(TURSO_CONFIG_KEY)
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      return {
        url: parsed.url || '',
        authToken: parsed.authToken || '',
      }
    } catch {
      // ignore
    }
  }
  return {
    url: (import.meta as any).env?.VITE_TURSO_DATABASE_URL || '',
    authToken: (import.meta as any).env?.VITE_TURSO_AUTH_TOKEN || '',
  }
}

function getWebClient(configOverride?: TursoConfig): Client {
  const config = configOverride || getWebTursoConfig()
  if (!config.url || !config.url.trim()) {
    throw new Error('No se ha configurado la URL de la base de datos de Turso.')
  }

  if (
    webClientCache &&
    !configOverride &&
    webClientCacheConfig.url === config.url &&
    webClientCacheConfig.authToken === config.authToken
  ) {
    return webClientCache
  }

  // Turso client handles libsql:// or https://
  const client = createClient({
    url: config.url.trim(),
    authToken: config.authToken ? config.authToken.trim() : undefined,
  })

  if (!configOverride) {
    webClientCache = client
    webClientCacheConfig = { ...config }
  }

  return client
}

async function initWebSchema(client: Client): Promise<void> {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `)

  await client.execute(`
    CREATE TABLE IF NOT EXISTS movements (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      date TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      method TEXT NOT NULL,
      subgroup TEXT,
      apply_vat INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `)

  await client.execute(`
    CREATE INDEX IF NOT EXISTS idx_movements_company ON movements(company_id);
  `)
}

export async function getTursoConfig(): Promise<TursoConfig> {
  if (window.electronAPI?.tursoGetConfig) {
    return await window.electronAPI.tursoGetConfig()
  }
  return getWebTursoConfig()
}

export async function saveTursoConfig(
  config: TursoConfig
): Promise<{ success: boolean; error?: string }> {
  if (window.electronAPI?.tursoSaveConfig) {
    return await window.electronAPI.tursoSaveConfig(config)
  }

  try {
    localStorage.setItem(TURSO_CONFIG_KEY, JSON.stringify(config))
    webClientCache = null
    const client = getWebClient(config)
    await initWebSchema(client)
    return { success: true }
  } catch (err) {
    return { success: false, error: String(err instanceof Error ? err.message : err) }
  }
}

export async function checkTursoConnection(
  config?: TursoConfig
): Promise<{ success: boolean; error?: string }> {
  if (window.electronAPI?.tursoCheckConnection) {
    return await window.electronAPI.tursoCheckConnection(config)
  }

  try {
    const client = getWebClient(config)
    await client.execute('SELECT 1;')
    await initWebSchema(client)
    return { success: true }
  } catch (err) {
    return { success: false, error: String(err instanceof Error ? err.message : err) }
  }
}

export async function loginCompany(
  companyId: string,
  password: string
): Promise<{ success: boolean; company?: Company; error?: string }> {
  const cleanId = companyId.trim().toLowerCase()
  if (!cleanId) {
    return { success: false, error: 'Por favor, introduce el ID de empresa.' }
  }

  if (window.electronAPI?.tursoLogin) {
    const res = await window.electronAPI.tursoLogin(cleanId, password)
    if (res.success && res.company) {
      setCurrentCompany(res.company)
    }
    return res
  }

  // Web fallback
  try {
    const client = getWebClient()
    await initWebSchema(client)
    const result = await client.execute({
      sql: 'SELECT id, name, password_hash, created_at FROM companies WHERE id = ? LIMIT 1;',
      args: [cleanId],
    })

    if (result.rows.length === 0) {
      return { success: false, error: 'No existe ninguna empresa registrada con ese ID.' }
    }

    const row = result.rows[0]
    const passwordHash = await hashPasswordWeb(password)
    if (row.password_hash !== passwordHash) {
      return { success: false, error: 'Contraseña incorrecta.' }
    }

    const company: Company = {
      id: String(row.id),
      name: String(row.name),
      createdAt: String(row.created_at),
    }
    setCurrentCompany(company)
    return { success: true, company }
  } catch (err) {
    return { success: false, error: String(err instanceof Error ? err.message : err) }
  }
}

export async function registerCompany(
  companyId: string,
  name: string,
  password: string
): Promise<{ success: boolean; company?: Company; error?: string }> {
  const cleanId = companyId.trim().toLowerCase()
  const cleanName = name.trim()

  if (!cleanId) return { success: false, error: 'El ID de la empresa es obligatorio.' }
  if (!cleanName) return { success: false, error: 'El nombre de la empresa es obligatorio.' }
  if (!password || password.length < 4) {
    return { success: false, error: 'La contraseña debe tener al menos 4 caracteres.' }
  }

  if (window.electronAPI?.tursoRegister) {
    const res = await window.electronAPI.tursoRegister(cleanId, cleanName, password)
    if (res.success && res.company) {
      setCurrentCompany(res.company)
    }
    return res
  }

  // Web fallback
  try {
    const client = getWebClient()
    await initWebSchema(client)

    const existing = await client.execute({
      sql: 'SELECT id FROM companies WHERE id = ? LIMIT 1;',
      args: [cleanId],
    })
    if (existing.rows.length > 0) {
      return {
        success: false,
        error: 'Ya existe una empresa con ese ID. Por favor, introduce otro o inicia sesión.',
      }
    }

    const passwordHash = await hashPasswordWeb(password)
    const createdAt = new Date().toISOString()
    await client.execute({
      sql: 'INSERT INTO companies (id, name, password_hash, created_at) VALUES (?, ?, ?, ?);',
      args: [cleanId, cleanName, passwordHash, createdAt],
    })

    const company: Company = {
      id: cleanId,
      name: cleanName,
      createdAt,
    }
    setCurrentCompany(company)
    return { success: true, company }
  } catch (err) {
    return { success: false, error: String(err instanceof Error ? err.message : err) }
  }
}

export function getCurrentCompany(): Company | null {
  try {
    const raw = localStorage.getItem(CURRENT_COMPANY_KEY)
    if (raw) {
      return JSON.parse(raw) as Company
    }
  } catch {
    // ignore
  }
  return null
}

export function setCurrentCompany(company: Company | null): void {
  if (company) {
    localStorage.setItem(CURRENT_COMPANY_KEY, JSON.stringify(company))
  } else {
    localStorage.removeItem(CURRENT_COMPANY_KEY)
  }
}

export function logoutCompany(): void {
  setCurrentCompany(null)
}

export async function loadCompanyMovements(companyId: string): Promise<Movement[]> {
  const cleanId = companyId.trim().toLowerCase()

  if (window.electronAPI?.tursoGetMovements) {
    const res = await window.electronAPI.tursoGetMovements(cleanId)
    if (res.success && Array.isArray(res.movements)) {
      return res.movements
    }
    if (res.error) {
      console.error('Error loading movements from Turso:', res.error)
    }
    return []
  }

  // Web fallback
  try {
    const client = getWebClient()
    await initWebSchema(client)
    const result = await client.execute({
      sql: `SELECT id, company_id, date, description, amount, type, method, subgroup, apply_vat, created_at
            FROM movements WHERE company_id = ?
            ORDER BY date DESC, created_at DESC;`,
      args: [cleanId],
    })

    return result.rows.map((row) => ({
      id: String(row.id),
      companyId: String(row.company_id),
      date: String(row.date),
      description: String(row.description),
      amount: Number(row.amount),
      type: String(row.type) as any,
      method: String(row.method) as any,
      subgroup: row.subgroup ? String(row.subgroup) : undefined,
      applyVat: Boolean(row.apply_vat),
      createdAt: row.created_at ? String(row.created_at) : undefined,
    }))
  } catch (err) {
    console.error('Error loading movements in web mode:', err)
    return []
  }
}

export async function saveCompanyMovement(
  companyId: string,
  movement: Movement
): Promise<boolean> {
  const cleanId = companyId.trim().toLowerCase()

  if (window.electronAPI?.tursoSaveMovement) {
    const res = await window.electronAPI.tursoSaveMovement(cleanId, movement)
    return Boolean(res.success)
  }

  // Web fallback
  try {
    const client = getWebClient()
    await initWebSchema(client)
    await client.execute({
      sql: `INSERT INTO movements (id, company_id, date, description, amount, type, method, subgroup, apply_vat, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              date = excluded.date,
              description = excluded.description,
              amount = excluded.amount,
              type = excluded.type,
              method = excluded.method,
              subgroup = excluded.subgroup,
              apply_vat = excluded.apply_vat,
              created_at = excluded.created_at;`,
      args: [
        movement.id,
        cleanId,
        movement.date,
        movement.description,
        Number(movement.amount),
        movement.type,
        movement.method,
        movement.subgroup || null,
        movement.applyVat ? 1 : 0,
        movement.createdAt || new Date().toISOString(),
      ],
    })
    return true
  } catch (err) {
    console.error('Error saving movement in web mode:', err)
    return false
  }
}

export async function deleteCompanyMovement(
  companyId: string,
  movementId: string
): Promise<boolean> {
  const cleanId = companyId.trim().toLowerCase()

  if (window.electronAPI?.tursoDeleteMovement) {
    const res = await window.electronAPI.tursoDeleteMovement(cleanId, movementId)
    return Boolean(res.success)
  }

  // Web fallback
  try {
    const client = getWebClient()
    await initWebSchema(client)
    await client.execute({
      sql: 'DELETE FROM movements WHERE id = ? AND company_id = ?;',
      args: [movementId, cleanId],
    })
    return true
  } catch (err) {
    console.error('Error deleting movement in web mode:', err)
    return false
  }
}
