import { useState, useMemo } from "react";
import type { Movement } from "../types";
import {
  formatCurrency,
  formatDate,
  getMovementTypeLabel,
  getPaymentMethodLabel,
} from "../utils/accounting";
import { Plus, Edit2, Trash2, Filter, Tag } from "lucide-react";

interface MovementsViewProps {
  movements: Movement[];
  onAddClick: () => void;
  onEditClick: (movement: Movement) => void;
  onDeleteClick: (movement: Movement) => void;
}

export function MovementsView({
  movements,
  onAddClick,
  onEditClick,
  onDeleteClick,
}: MovementsViewProps) {
  const [selectedSubgroup, setSelectedSubgroup] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  // Extract all existing unique subgroups
  const availableSubgroups = useMemo(() => {
    const set = new Set<string>();
    movements.forEach((m) => {
      if (m.subgroup && m.subgroup.trim()) {
        set.add(m.subgroup.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [movements]);

  // Filter and sort movements
  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      if (selectedSubgroup !== "all") {
        if ((m.subgroup || "").toLowerCase() !== selectedSubgroup.toLowerCase()) {
          return false;
        }
      }
      if (search.trim()) {
        const query = search.toLowerCase();
        const descMatch = m.description.toLowerCase().includes(query);
        const subMatch = (m.subgroup || "").toLowerCase().includes(query);
        const typeMatch = getMovementTypeLabel(m.type).toLowerCase().includes(query);
        if (!descMatch && !subMatch && !typeMatch) return false;
      }
      return true;
    });
  }, [movements, selectedSubgroup, search]);

  const sortedMovements = useMemo(() => {
    return [...filteredMovements].sort((a, b) => {
      if (a.date !== b.date) {
        return b.date.localeCompare(a.date);
      }
      return (b.createdAt || "").localeCompare(a.createdAt || "");
    });
  }, [filteredMovements]);

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            Movimientos
          </h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Registro diario de ingresos, gastos y operaciones comerciales
          </p>
        </div>

        {/* Big + Añadir movimiento button */}
        <button
          type="button"
          onClick={onAddClick}
          className="inline-flex items-center justify-center space-x-2 rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white shadow-xs transition hover:bg-neutral-800 active:scale-[0.98] focus:outline-hidden focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>+ Añadir movimiento</span>
          <kbd className="ml-1.5 hidden sm:inline-flex items-center rounded border border-neutral-700 bg-neutral-800 px-1.5 py-0.5 text-[10px] font-mono font-medium text-neutral-300">
            A
          </kbd>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white p-3 shadow-xs">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Buscar por concepto, tipo o subgrupo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-neutral-250 px-3 py-1.5 text-xs text-neutral-900 shadow-xs focus:border-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-neutral-900"
          />
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 text-xs text-neutral-500 whitespace-nowrap">
            <Filter className="h-3.5 w-3.5 text-neutral-400" />
            <span>Subgrupo:</span>
          </div>
          <select
            value={selectedSubgroup}
            onChange={(e) => setSelectedSubgroup(e.target.value)}
            className="rounded-lg border border-neutral-250 bg-white px-2.5 py-1.5 text-xs text-neutral-800 shadow-xs focus:border-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-neutral-900"
          >
            <option value="all">Todos los subgrupos ({movements.length})</option>
            {availableSubgroups.map((sg) => {
              const count = movements.filter(
                (m) => (m.subgroup || "").toLowerCase() === sg.toLowerCase()
              ).length;
              return (
                <option key={sg} value={sg}>
                  {sg} ({count})
                </option>
              );
            })}
          </select>

          {(selectedSubgroup !== "all" || search.trim()) && (
            <button
              type="button"
              onClick={() => {
                setSelectedSubgroup("all");
                setSearch("");
              }}
              className="text-xs text-neutral-500 hover:text-neutral-900 underline px-1 transition cursor-pointer"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xs">
        {sortedMovements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 mb-4">
              <Plus className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-neutral-900">
              {movements.length === 0
                ? "No hay movimientos registrados"
                : "No se encontraron movimientos con los filtros"}
            </h3>
            <p className="mt-1 text-sm text-neutral-500 max-w-sm">
              {movements.length === 0
                ? "Comienza añadiendo una venta, compra, gasto u otra operación comercial de tu empresa."
                : "Prueba a cambiar o limpiar los filtros de búsqueda o subgrupo."}
            </p>
            {movements.length === 0 ? (
              <button
                type="button"
                onClick={onAddClick}
                className="mt-5 inline-flex items-center space-x-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-xs hover:bg-neutral-800 transition cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>+ Añadir movimiento</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSelectedSubgroup("all");
                  setSearch("");
                }}
                className="mt-4 rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition cursor-pointer"
              >
                Restablecer filtros
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-600">
              <thead className="border-b border-neutral-200 bg-neutral-50/75 text-xs font-medium uppercase tracking-wider text-neutral-500">
                <tr>
                  <th scope="col" className="px-6 py-3.5">
                    Fecha
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Concepto
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-right">
                    Importe
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Tipo
                  </th>
                  <th scope="col" className="px-6 py-3.5">
                    Método
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 bg-white">
                {sortedMovements.map((movement) => (
                  <tr
                    key={movement.id}
                    className="transition-colors hover:bg-neutral-50/80"
                  >
                    <td className="whitespace-nowrap px-6 py-4 font-mono text-xs text-neutral-500">
                      {formatDate(movement.date)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-neutral-900 flex items-center flex-wrap gap-2">
                        <span>{movement.description}</span>
                        {movement.subgroup && (
                          <span className="inline-flex items-center space-x-1 rounded-md border border-neutral-200 bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-600">
                            <Tag className="h-2.5 w-2.5 text-neutral-400" />
                            <span>{movement.subgroup}</span>
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right font-mono font-medium text-neutral-900">
                      {formatCurrency(movement.amount)}
                      {movement.applyVat &&
                        (movement.type === "venta" ||
                          movement.type === "compra" ||
                          movement.type === "gasto") && (
                          <span className="block text-[11px] font-normal text-neutral-400">
                            +21% IVA
                          </span>
                        )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="inline-flex items-center rounded-md border border-neutral-200 bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-800">
                        {getMovementTypeLabel(movement.type)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-neutral-500 text-xs">
                      {getPaymentMethodLabel(movement.method)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-xs">
                      <div className="inline-flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => onEditClick(movement)}
                          className="inline-flex items-center space-x-1 rounded-md px-2.5 py-1 text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 transition-colors cursor-pointer"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteClick(movement)}
                          className="inline-flex items-center space-x-1 rounded-md px-2.5 py-1 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
