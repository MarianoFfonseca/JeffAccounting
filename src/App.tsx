import { useState, useEffect } from 'react'
import type { Company, Movement, MovementType, PaymentMethod } from './types'
import {
  getCurrentCompany,
  logoutCompany,
  loadCompanyMovements,
  saveCompanyMovement,
  deleteCompanyMovement,
} from './services/turso'
import { Navbar } from './components/Navbar'
import { MovementsView } from './components/MovementsView'
import { AccountingView } from './components/AccountingView'
import { MovementModal } from './components/MovementModal'
import { DeleteConfirmModal } from './components/DeleteConfirmModal'
import { CompanyAuthModal } from './components/CompanyAuthModal'
import { TursoConfigModal } from './components/TursoConfigModal'
import { ExportPdfModal } from './components/ExportPdfModal'

export default function App() {
  const [company, setCompany] = useState<Company | null>(() => getCurrentCompany())
  const [movements, setMovements] = useState<Movement[]>([])
  const [loading, setLoading] = useState(false)
  const [currentTab, setCurrentTab] = useState<'movements' | 'accounting'>('movements')

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMovement, setEditingMovement] = useState<Movement | null>(null)
  const [deletingMovement, setDeletingMovement] = useState<Movement | null>(null)
  const [isTursoSettingsOpen, setIsTursoSettingsOpen] = useState(false)
  const [isExportPdfOpen, setIsExportPdfOpen] = useState(false)

  // Load movements whenever active company changes
  useEffect(() => {
    async function initCompanyMovements() {
      if (company) {
        setLoading(true)
        try {
          const loaded = await loadCompanyMovements(company.id)
          setMovements(loaded)
        } catch (err) {
          console.error('Error loading movements from Turso:', err)
        } finally {
          setLoading(false)
        }
      } else {
        setMovements([])
        setLoading(false)
      }
    }
    initCompanyMovements()
  }, [company])

  // Fast key shortcut: Press 'a' to open Add Movement modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const isInput =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        Boolean(target?.isContentEditable)

      if (isInput) return
      if (!company) return

      // Pressing 'a' or 'A' without modifier keys opens Add Movement modal
      if ((e.key === 'a' || e.key === 'A') && !e.ctrlKey && !e.altKey && !e.metaKey) {
        if (!isModalOpen && !deletingMovement && !isTursoSettingsOpen && !isExportPdfOpen) {
          e.preventDefault()
          setEditingMovement(null)
          setIsModalOpen(true)
        }
      }

      // Escape closes open modals
      if (e.key === 'Escape') {
        if (isModalOpen) {
          setIsModalOpen(false)
          setEditingMovement(null)
        }
        if (deletingMovement) {
          setDeletingMovement(null)
        }
        if (isTursoSettingsOpen) {
          setIsTursoSettingsOpen(false)
        }
        if (isExportPdfOpen) {
          setIsExportPdfOpen(false)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [company, isModalOpen, deletingMovement, isTursoSettingsOpen, isExportPdfOpen])

  // Handler for adding or editing a movement
  const handleSaveMovement = async (data: {
    id?: string
    date: string
    description: string
    amount: number
    type: MovementType
    method: PaymentMethod
    subgroup?: string
    applyVat: boolean
  }) => {
    if (!company) return

    let updatedMovement: Movement
    let updatedList: Movement[]

    if (data.id) {
      // Edit existing movement
      const existing = movements.find((m) => m.id === data.id)
      updatedMovement = {
        id: data.id,
        companyId: company.id,
        date: data.date,
        description: data.description,
        amount: data.amount,
        type: data.type,
        method: data.method,
        subgroup: data.subgroup,
        applyVat: data.applyVat,
        createdAt: existing?.createdAt || new Date().toISOString(),
      }
      updatedList = movements.map((m) => (m.id === data.id ? updatedMovement : m))
    } else {
      // Add new movement
      updatedMovement = {
        id:
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : 'mov_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
        companyId: company.id,
        date: data.date,
        description: data.description,
        amount: data.amount,
        type: data.type,
        method: data.method,
        subgroup: data.subgroup,
        applyVat: data.applyVat,
        createdAt: new Date().toISOString(),
      }
      updatedList = [updatedMovement, ...movements]
    }

    setMovements(updatedList)
    await saveCompanyMovement(company.id, updatedMovement)
    setEditingMovement(null)
  }

  // Handler for deleting a movement
  const handleConfirmDelete = async () => {
    if (!deletingMovement || !company) return

    const idToDelete = deletingMovement.id
    const updated = movements.filter((m) => m.id !== idToDelete)
    setMovements(updated)
    await deleteCompanyMovement(company.id, idToDelete)
    setDeletingMovement(null)
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col text-neutral-900 selection:bg-neutral-200">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        movementsCount={movements.length}
        company={company}
        onLogout={() => {
          logoutCompany()
          setCompany(null)
          setMovements([])
        }}
        onOpenTursoSettings={() => setIsTursoSettingsOpen(true)}
        onOpenExportPdf={() => setIsExportPdfOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-6 py-8">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-sm text-neutral-400 font-mono">
              Sincronizando contabilidad con Turso DB...
            </div>
          </div>
        ) : currentTab === 'movements' ? (
          <MovementsView
            movements={movements}
            onAddClick={() => {
              setEditingMovement(null)
              setIsModalOpen(true)
            }}
            onEditClick={(movement) => {
              setEditingMovement(movement)
              setIsModalOpen(true)
            }}
            onDeleteClick={(movement) => {
              setDeletingMovement(movement)
            }}
          />
        ) : (
          <AccountingView movements={movements} company={company} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-white py-3 text-xs text-neutral-400">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
          <span>JeffAccounting &bull; Software contable profesional</span>
          <span className="flex items-center space-x-1.5 font-mono text-[11px]">
            <span>Base de datos:</span>
            <strong className="text-neutral-700">Turso Cloud SQLite</strong>
            {company && (
              <span className="text-neutral-500">
                &bull; Empresa ID: <code className="text-neutral-800">{company.id}</code>
              </span>
            )}
          </span>
        </div>
      </footer>

      {/* Login & Company Registration Modal (shown when not authenticated) */}
      <CompanyAuthModal
        isOpen={company === null}
        onAuthenticated={(authenticatedCompany) => {
          setCompany(authenticatedCompany)
        }}
      />

      {/* Add / Edit Movement Modal */}
      <MovementModal
        isOpen={isModalOpen}
        initialMovement={editingMovement}
        onClose={() => {
          setIsModalOpen(false)
          setEditingMovement(null)
        }}
        onSave={handleSaveMovement}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingMovement)}
        movement={deletingMovement}
        onClose={() => setDeletingMovement(null)}
        onConfirm={handleConfirmDelete}
      />

      {/* Turso Database Settings Modal */}
      <TursoConfigModal
        isOpen={isTursoSettingsOpen}
        onClose={() => setIsTursoSettingsOpen(false)}
        onConfigSaved={async () => {
          if (company) {
            const loaded = await loadCompanyMovements(company.id)
            setMovements(loaded)
          }
        }}
      />

      {/* Export Monthly and Quarterly PDF Report Modal */}
      <ExportPdfModal
        isOpen={isExportPdfOpen}
        company={company}
        movements={movements}
        onClose={() => setIsExportPdfOpen(false)}
      />
    </div>
  )
}
