import { Building2, FileDown, LogOut, Settings } from "lucide-react";
import type { Company } from "../types";

interface NavbarProps {
  currentTab: "movements" | "accounting";
  onSelectTab: (tab: "movements" | "accounting") => void;
  movementsCount: number;
  company: Company | null;
  onLogout: () => void;
  onOpenTursoSettings: () => void;
  onOpenExportPdf: () => void;
}

export function Navbar({
  currentTab,
  onSelectTab,
  movementsCount,
  company,
  onLogout,
  onOpenTursoSettings,
  onOpenExportPdf,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur-xs">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        {/* Brand / Logo & Navigation */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2.5">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-neutral-900 tracking-tight">
                JeffAccounting
              </span>
              <span className="inline-flex items-center space-x-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Turso Cloud</span>
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 border-l border-neutral-200 pl-5">
            <button
              type="button"
              onClick={() => onSelectTab("movements")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                currentTab === "movements"
                  ? "bg-neutral-100 text-neutral-900 font-semibold"
                  : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
              }`}
            >
              Movimientos
              {movementsCount > 0 && (
                <span
                  className={`ml-2 rounded-full px-1.5 py-0.2 text-[11px] font-mono ${
                    currentTab === "movements"
                      ? "bg-neutral-200 text-neutral-800 font-normal"
                      : "bg-neutral-100 text-neutral-500"
                  }`}
                >
                  {movementsCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => onSelectTab("accounting")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                currentTab === "accounting"
                  ? "bg-neutral-100 text-neutral-900 font-semibold"
                  : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
              }`}
            >
              Contabilidad
            </button>
          </nav>
        </div>

        {/* Right side: Company info & actions */}
        <div className="flex items-center space-x-2.5">
          {/* Quick PDF export button */}
          <button
            type="button"
            onClick={onOpenExportPdf}
            title="Descargar informe contable en PDF (mensual o trimestral)"
            className="hidden sm:inline-flex items-center space-x-1.5 rounded-lg border border-neutral-250 bg-neutral-50 px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 transition cursor-pointer"
          >
            <FileDown className="h-3.5 w-3.5 text-neutral-600" />
            <span>Informes PDF</span>
          </button>

          {/* Company badge */}
          {company && (
            <div
              title={`Empresa: ${company.name}\nID: ${company.id}`}
              className="flex items-center space-x-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs text-neutral-800"
            >
              <Building2 className="h-3.5 w-3.5 text-neutral-500" />
              <span className="font-semibold max-w-[140px] truncate">
                {company.name}
              </span>
              <span className="text-neutral-400 font-mono text-[11px]">
                ({company.id})
              </span>
            </div>
          )}

          {/* Turso DB settings button */}
          <button
            type="button"
            onClick={onOpenTursoSettings}
            title="Configuración de base de datos Turso"
            className="p-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition cursor-pointer"
          >
            <Settings className="h-3.5 w-3.5" />
          </button>

          {/* Logout button */}
          {company && (
            <button
              type="button"
              onClick={onLogout}
              title="Cerrar sesión de la empresa"
              className="inline-flex items-center space-x-1 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs text-neutral-600 hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Salir</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
