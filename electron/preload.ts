import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  loadData: () => ipcRenderer.invoke('load-data'),
  saveData: (data: unknown) => ipcRenderer.invoke('save-data', data),
  getStoragePath: () => ipcRenderer.invoke('get-storage-path'),
  openDataFolder: () => ipcRenderer.invoke('open-data-folder'),
  isElectron: true,

  // Turso DB & Company Auth API
  tursoGetConfig: () => ipcRenderer.invoke('turso-get-config'),
  tursoSaveConfig: (config: unknown) => ipcRenderer.invoke('turso-save-config', config),
  tursoCheckConnection: (config?: unknown) => ipcRenderer.invoke('turso-check-connection', config),
  tursoLogin: (companyId: string, password: string) => ipcRenderer.invoke('turso-login', companyId, password),
  tursoRegister: (companyId: string, name: string, password: string) => ipcRenderer.invoke('turso-register', companyId, name, password),
  tursoGetMovements: (companyId: string) => ipcRenderer.invoke('turso-get-movements', companyId),
  tursoSaveMovement: (companyId: string, movement: unknown) => ipcRenderer.invoke('turso-save-movement', companyId, movement),
  tursoDeleteMovement: (companyId: string, movementId: string) => ipcRenderer.invoke('turso-delete-movement', companyId, movementId),
})
