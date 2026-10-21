import type { AccountingData, Movement } from '../types'
import {
  getCurrentCompany,
  loadCompanyMovements,
  saveCompanyMovement,
  deleteCompanyMovement,
} from '../services/turso'

const LOCAL_STORAGE_KEY = 'jeffaccounting-local-data'

export async function loadMovements(): Promise<Movement[]> {
  const currentCompany = getCurrentCompany()
  if (currentCompany) {
    try {
      return await loadCompanyMovements(currentCompany.id)
    } catch (err) {
      console.error('Error loading movements from Turso:', err)
    }
  }

  // Fallback for offline or local preview
  try {
    if (window.electronAPI?.loadData) {
      const data = await window.electronAPI.loadData()
      return Array.isArray(data?.movements) ? data.movements : []
    }

    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AccountingData
      return Array.isArray(parsed?.movements) ? parsed.movements : []
    }
  } catch (error) {
    console.error('Error loading movements from fallback storage:', error)
  }
  return []
}

export async function saveMovements(movements: Movement[]): Promise<boolean> {
  const currentCompany = getCurrentCompany()
  if (currentCompany) {
    try {
      // Save all movements to Turso
      for (const m of movements) {
        await saveCompanyMovement(currentCompany.id, m)
      }
      return true
    } catch (err) {
      console.error('Error saving movements to Turso:', err)
    }
  }

  const data: AccountingData = { movements }

  try {
    if (window.electronAPI?.saveData) {
      const res = await window.electronAPI.saveData(data)
      return res.success
    }

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data, null, 2))
    return true
  } catch (error) {
    console.error('Error saving movements to storage:', error)
    return false
  }
}

export async function saveSingleMovement(movement: Movement): Promise<boolean> {
  const currentCompany = getCurrentCompany()
  if (currentCompany) {
    return await saveCompanyMovement(currentCompany.id, movement)
  }
  return false
}

export async function deleteSingleMovement(movementId: string): Promise<boolean> {
  const currentCompany = getCurrentCompany()
  if (currentCompany) {
    return await deleteCompanyMovement(currentCompany.id, movementId)
  }
  return false
}

export async function getStoragePath(): Promise<string> {
  const currentCompany = getCurrentCompany()
  if (currentCompany) {
    return `Turso DB: ${currentCompany.id}`
  }
  if (window.electronAPI?.getStoragePath) {
    return await window.electronAPI.getStoragePath()
  }
  return 'Turso Cloud / Local'
}

export async function openStorageFolder(): Promise<void> {
  if (window.electronAPI?.openDataFolder) {
    await window.electronAPI.openDataFolder()
  }
}
