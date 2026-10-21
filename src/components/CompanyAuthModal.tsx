import { useState, useEffect } from 'react'
import { Building2, Lock, UserPlus, LogIn, Database, AlertCircle, Loader2, Settings } from 'lucide-react'
import { loginCompany, registerCompany, getTursoConfig } from '../services/turso'
import type { Company } from '../types'
import { TursoConfigModal } from './TursoConfigModal'

interface CompanyAuthModalProps {
  isOpen: boolean
  onAuthenticated: (company: Company) => void
}

export function CompanyAuthModal({ isOpen, onAuthenticated }: CompanyAuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [companyId, setCompanyId] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isTursoConfigOpen, setIsTursoConfigOpen] = useState(false)
  const [hasTursoConfig, setHasTursoConfig] = useState<boolean | null>(null)

  useEffect(() => {
    getTursoConfig().then((cfg) => {
      setHasTursoConfig(Boolean(cfg.url && cfg.url.trim()))
    })
  }, [isTursoConfigOpen])

  if (!isOpen) return null

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!companyId.trim()) {
      setError('Por favor, introduce el ID de empresa.')
      return
    }
    if (!password) {
      setError('Por favor, introduce la contraseña.')
      return
    }

    setLoading(true)
    try {
      const res = await loginCompany(companyId, password)
      if (res.success && res.company) {
        onAuthenticated(res.company)
      } else {
        setError(res.error || 'Credenciales incorrectas.')
      }
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err))
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const cleanId = companyId.trim().toLowerCase().replace(/\s+/g, '-')
    if (!cleanId) {
      setError('Por favor, introduce un ID para la empresa.')
      return
    }
    if (!companyName.trim()) {
      setError('Por favor, introduce el nombre oficial de la empresa.')
      return
    }
    if (!password || password.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres.')
      return
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    try {
      const res = await registerCompany(cleanId, companyName.trim(), password)
      if (res.success && res.company) {
        onAuthenticated(res.company)
      } else {
        setError(res.error || 'Error al registrar la empresa.')
      }
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl transition-all">
        {/* Top Header Card */}
        <div className="bg-neutral-900 px-6 py-6 text-white text-center relative">
          <button
            type="button"
            onClick={() => setIsTursoConfigOpen(true)}
            title="Configurar conexión Turso"
            className="absolute top-4 right-4 p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
          >
            <Settings className="h-4 w-4" />
          </button>

          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 mb-3">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-white">JeffAccounting</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Gestión contable profesional sincronizada con Turso DB
          </p>

          {/* Turso Status Pill */}
          <div className="mt-3 inline-flex items-center space-x-1.5 rounded-full border border-neutral-700 bg-neutral-800/80 px-2.5 py-0.5 text-[11px] text-neutral-300">
            <Database className="h-3 w-3 text-emerald-400" />
            <span>
              {hasTursoConfig === false
                ? 'Turso sin configurar'
                : 'Conectado a Turso Cloud'}
            </span>
          </div>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 border-b border-neutral-200 bg-neutral-50 p-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setMode('login')
              setError(null)
            }}
            className={`flex items-center justify-center space-x-1.5 rounded-lg py-2 transition cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-neutral-900 font-semibold shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>Iniciar Sesión</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('register')
              setError(null)
            }}
            className={`flex items-center justify-center space-x-1.5 rounded-lg py-2 transition cursor-pointer ${
              mode === 'register'
                ? 'bg-white text-neutral-900 font-semibold shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Nueva Empresa</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200 flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {hasTursoConfig === false && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex items-start justify-between">
              <div>
                <strong className="font-semibold block">Configura tu Base de Datos Turso</strong>
                <span className="text-[11px] text-amber-700 mt-0.5 block">
                  Debes indicar la URL y token de Turso para guardar los datos en la nube.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsTursoConfigOpen(true)}
                className="ml-2 px-2.5 py-1 rounded bg-amber-200/80 hover:bg-amber-300 text-amber-900 font-medium text-[11px] transition cursor-pointer shrink-0"
              >
                Configurar
              </button>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  ID Empresa
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Ej. mi-empresa-sl"
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 shadow-xs focus:border-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-neutral-900 font-mono"
                  />
                  <Building2 className="absolute right-3 top-2.5 h-4 w-4 text-neutral-400 pointer-events-none" />
                </div>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Identificador único asignado a tu empresa
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Contraseña de Empresa
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 shadow-xs focus:border-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-neutral-900"
                  />
                  <Lock className="absolute right-3 top-2.5 h-4 w-4 text-neutral-400 pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center space-x-2 rounded-lg bg-neutral-900 py-2.5 text-sm font-medium text-white shadow-xs hover:bg-neutral-800 transition cursor-pointer disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Conectando con Turso...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    <span>Acceder a la empresa</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  ID Empresa (Identificador único)
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. jeff-services o cif-b12345678"
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 shadow-xs focus:border-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-neutral-900 font-mono"
                />
                <p className="text-[11px] text-neutral-400 mt-1">
                  Se usará para iniciar sesión en cualquier dispositivo
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Nombre Oficial de la Empresa
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Jeff Services S.L."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 shadow-xs focus:border-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 shadow-xs focus:border-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Confirmar
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 shadow-xs focus:border-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-neutral-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center space-x-2 rounded-lg bg-neutral-900 py-2.5 text-sm font-medium text-white shadow-xs hover:bg-neutral-800 transition cursor-pointer disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Creando empresa en Turso...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    <span>Crear Empresa y Entrar</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer link to configure Turso DB */}
          <div className="mt-5 text-center border-t border-neutral-150 pt-3">
            <button
              type="button"
              onClick={() => setIsTursoConfigOpen(true)}
              className="inline-flex items-center space-x-1.5 text-xs text-neutral-500 hover:text-neutral-900 transition cursor-pointer"
            >
              <Database className="h-3.5 w-3.5" />
              <span>Configuración de Base de Datos Turso</span>
            </button>
          </div>
        </div>
      </div>

      {/* Turso Config Modal */}
      <TursoConfigModal
        isOpen={isTursoConfigOpen}
        onClose={() => setIsTursoConfigOpen(false)}
        onConfigSaved={() => setHasTursoConfig(true)}
      />
    </div>
  )
}
