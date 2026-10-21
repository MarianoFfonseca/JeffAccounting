import { useState, useEffect } from 'react'
import { Database, CheckCircle2, AlertCircle, X, Loader2, KeyRound } from 'lucide-react'
import { getTursoConfig, saveTursoConfig, checkTursoConnection } from '../services/turso'
import type { TursoConfig } from '../types'

interface TursoConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onConfigSaved?: () => void
}

export function TursoConfigModal({ isOpen, onClose, onConfigSaved }: TursoConfigModalProps) {
  const [url, setUrl] = useState('')
  const [authToken, setAuthToken] = useState('')
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    if (isOpen) {
      getTursoConfig().then((cfg) => {
        setUrl(cfg.url || '')
        setAuthToken(cfg.authToken || '')
        setTestResult(null)
      })
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleTestConnection = async () => {
    if (!url.trim()) {
      setTestResult({ success: false, message: 'Introduce primero la URL de la base de datos Turso.' })
      return
    }

    setTesting(true)
    setTestResult(null)
    const testConfig: TursoConfig = {
      url: url.trim(),
      authToken: authToken.trim(),
    }

    try {
      const res = await checkTursoConnection(testConfig)
      if (res.success) {
        setTestResult({ success: true, message: '¡Conexión establecida con éxito con Turso!' })
      } else {
        setTestResult({
          success: false,
          message: res.error || 'No se pudo conectar a Turso. Revisa la URL y el Token.',
        })
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: String(err instanceof Error ? err.message : err),
      })
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) {
      setTestResult({ success: false, message: 'La URL de la base de datos es obligatoria.' })
      return
    }

    setSaving(true)
    setTestResult(null)

    const newConfig: TursoConfig = {
      url: url.trim(),
      authToken: authToken.trim(),
    }

    try {
      const res = await saveTursoConfig(newConfig)
      if (res.success) {
        if (onConfigSaved) onConfigSaved()
        onClose()
      } else {
        setTestResult({
          success: false,
          message: res.error || 'Error al guardar la configuración de Turso.',
        })
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: String(err instanceof Error ? err.message : err),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-150 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-900 text-white">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-900">
                Conexión a Base de Datos Turso
              </h2>
              <p className="text-xs text-neutral-500">
                Configura tu base de datos SQLite en la nube (Turso / LibSQL)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="mt-5 space-y-4">
          {testResult && (
            <div
              className={`rounded-lg p-3 text-xs border flex items-start space-x-2 ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              )}
              <span className="break-all">{testResult.message}</span>
            </div>
          )}

          {/* Database URL */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              URL de la Base de Datos (Turso Database URL)
            </label>
            <input
              type="text"
              placeholder="libsql://tu-base-de-datos.turso.io"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs font-mono text-neutral-900 shadow-xs focus:border-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-neutral-900"
            />
            <p className="text-[11px] text-neutral-400 mt-1">
              Ejemplo:{' '}
              <code className="text-neutral-600">
                libsql://jeff-accounting-empresa.turso.io
              </code>
            </p>
          </div>

          {/* Auth Token */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Auth Token de Turso
            </label>
            <div className="relative">
              <input
                type="password"
                placeholder="eyJhbGciOiJFZERTQ..."
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs font-mono text-neutral-900 shadow-xs focus:border-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-neutral-900"
              />
              <KeyRound className="absolute right-2.5 top-2.5 h-4 w-4 text-neutral-400" />
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">
              Token de autenticación generado con{' '}
              <code className="text-neutral-600 font-mono">turso db tokens create [nombre-db]</code>
            </p>
          </div>

          {/* Quick instructions callout */}
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-600 space-y-1">
            <div className="font-semibold text-neutral-800">¿Cómo conectar tu base de datos?</div>
            <ol className="list-decimal pl-4 space-y-0.5 text-[11px] text-neutral-500">
              <li>Crea una base de datos gratis en Turso: <code className="font-mono">turso db create jeff-accounting</code></li>
              <li>Obtén la URL: <code className="font-mono">turso db show --url jeff-accounting</code></li>
              <li>Genera un token: <code className="font-mono">turso db tokens create jeff-accounting</code></li>
            </ol>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-neutral-150">
            <button
              type="button"
              disabled={testing || saving}
              onClick={handleTestConnection}
              className="inline-flex items-center space-x-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition cursor-pointer disabled:opacity-50"
            >
              {testing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-neutral-500" />
                  <span>Probando...</span>
                </>
              ) : (
                <span>Probar conexión</span>
              )}
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-3.5 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={testing || saving}
                className="inline-flex items-center space-x-1.5 rounded-lg bg-neutral-900 px-4 py-2 text-xs font-medium text-white shadow-xs hover:bg-neutral-800 transition cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <span>Guardar configuración</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
