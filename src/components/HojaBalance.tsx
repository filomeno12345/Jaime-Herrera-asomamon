import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { formatCurrency } from '../utils/formatters';
import { BalanceItem } from '../types/inventory';
import {
  Scale,
  Plus,
  Trash2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Info,
  DollarSign,
  PieChart,
} from 'lucide-react';

export const HojaBalance: React.FC = () => {
  const {
    balanceItems,
    updateBalanceItem,
    addBalanceItem,
    deleteBalanceItem,
    syncInventoryWithBalance,
    totalDebe,
    totalHaber,
    utilidad,
    totalInventario,
    period,
  } = useInventory();

  // New Concept Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDesc, setNewDesc] = useState('');
  const [newDebe, setNewDebe] = useState('');
  const [newHaber, setNewHaber] = useState('');

  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc.trim()) return;

    addBalanceItem({
      descripcion: newDesc.trim().toUpperCase(),
      debe: parseFloat(newDebe) || 0,
      haber: parseFloat(newHaber) || 0,
    });

    setNewDesc('');
    setNewDebe('');
    setNewHaber('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* TOTAL DEBE Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              TOTAL DEBE (Activos / Ingresos)
            </span>
            <span className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black font-mono text-emerald-700 mt-2">
            {formatCurrency(totalDebe)}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Incluye Inventario ({formatCurrency(totalInventario)}), Base y Cuentas por Cobrar
          </p>
        </div>

        {/* TOTAL HABER Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              TOTAL HABER (Pasivos / Gastos)
            </span>
            <span className="p-2 rounded-lg bg-rose-100 text-rose-700">
              <TrendingDown className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black font-mono text-rose-700 mt-2">
            {formatCurrency(totalHaber)}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Cuentas por Pagar, Salarios, Servicios y Obligaciones
          </p>
        </div>

        {/* UTILIDAD NETA Card */}
        <div
          className={`p-5 rounded-2xl border shadow-sm relative overflow-hidden ${
            utilidad >= 0
              ? 'bg-gradient-to-br from-emerald-900 to-teal-900 text-white border-emerald-700'
              : 'bg-gradient-to-br from-rose-900 to-rose-950 text-white border-rose-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-200">
              UTILIDAD (DEBE − HABER)
            </span>
            <span className="p-2 rounded-lg bg-white/10 text-amber-300">
              {utilidad >= 0 ? (
                <TrendingUp className="w-4 h-4 text-emerald-300" />
              ) : (
                <TrendingDown className="w-4 h-4 text-rose-300" />
              )}
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black font-mono text-amber-300 mt-2">
            {formatCurrency(utilidad)}
          </p>
          <p className="text-xs text-emerald-200/80 mt-1">
            {utilidad >= 0
              ? 'Superávit / Ganancia Neta Estimada'
              : 'Déficit / Ajustar Obligaciones Pendientes'}
          </p>
        </div>
      </div>

      {/* Main Balance Contable Table Sheet */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
              <Scale className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase">
                BALANCE CONTABLE
              </h2>
              <p className="text-xs text-slate-500">
                Supertienda Los Paisa - Período: {period.mes} {period.ano}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={syncInventoryWithBalance}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300/80 rounded-lg text-xs font-bold transition cursor-pointer"
              title="Actualiza el renglón de inventario con el valor de la hoja BASE"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sincronizar Inventario BASE</span>
            </button>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Nuevo Concepto</span>
            </button>
          </div>
        </div>

        {/* Add Concept Inline Drawer/Form */}
        {showAddForm && (
          <form
            onSubmit={handleAddNewItem}
            className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end animate-in fade-in"
          >
            <div className="sm:col-span-6">
              <label
                htmlFor="balance-new-desc"
                className="block text-xs font-bold text-slate-700 uppercase mb-1"
              >
                DESCRIPCIÓN DEL CONCEPTO
              </label>
              <input
                id="balance-new-desc"
                type="text"
                placeholder="Ej. ARRIENDO LOCAL, IMPUESTOS, ETC."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="balance-new-debe"
                className="block text-xs font-bold text-slate-700 uppercase mb-1"
              >
                DEBE ($ COP)
              </label>
              <input
                id="balance-new-debe"
                type="number"
                min="0"
                step="any"
                placeholder="0"
                value={newDebe}
                onChange={(e) => setNewDebe(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-right"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="balance-new-haber"
                className="block text-xs font-bold text-slate-700 uppercase mb-1"
              >
                HABER ($ COP)
              </label>
              <input
                id="balance-new-haber"
                type="number"
                min="0"
                step="any"
                placeholder="0"
                value={newHaber}
                onChange={(e) => setNewHaber(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-right"
              />
            </div>

            <div className="sm:col-span-2 flex gap-1.5">
              <button
                type="submit"
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-lg shadow cursor-pointer"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-2 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-300 cursor-pointer"
              >
                ✕
              </button>
            </div>
          </form>
        )}

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-xs uppercase tracking-wider font-bold">
                <th className="py-3.5 px-4 w-12 text-center">#</th>
                <th className="py-3.5 px-4">A: DESCRIPCION</th>
                <th className="py-3.5 px-4 text-right w-48">B: DEBE ($)</th>
                <th className="py-3.5 px-4 text-right w-48">C: HABER ($)</th>
                <th className="py-3.5 px-4 text-center w-20">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {balanceItems.map((item, idx) => {
                const isAuto =
                  item.isAutoInventory ||
                  item.descripcion.startsWith('INVENTARIO MES DE');

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-emerald-50/40 transition group ${
                      isAuto ? 'bg-amber-50/30' : ''
                    }`}
                  >
                    <td className="py-3 px-4 text-center text-slate-400 font-mono text-xs">
                      {idx + 1}
                    </td>

                    {/* DESCRIPCION */}
                    <td className="py-3 px-4 font-bold text-slate-800">
                      <div className="flex items-center gap-2">
                        <span>{item.descripcion}</span>
                        {isAuto && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900 border border-amber-300">
                            Auto BASE
                          </span>
                        )}
                      </div>
                    </td>

                    {/* DEBE */}
                    <td className="py-3 px-4 text-right font-mono">
                      <input
                        type="number"
                        min="0"
                        value={item.debe}
                        onChange={(e) =>
                          updateBalanceItem(item.id, {
                            debe: parseFloat(e.target.value) || 0,
                          })
                        }
                        aria-label={`Valor Debe para ${item.descripcion}`}
                        className="w-36 text-right px-2 py-1 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-emerald-500 rounded font-bold text-slate-900 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                      />
                    </td>

                    {/* HABER */}
                    <td className="py-3 px-4 text-right font-mono">
                      <input
                        type="number"
                        min="0"
                        value={item.haber}
                        onChange={(e) =>
                          updateBalanceItem(item.id, {
                            haber: parseFloat(e.target.value) || 0,
                          })
                        }
                        aria-label={`Valor Haber para ${item.descripcion}`}
                        className="w-36 text-right px-2 py-1 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-rose-500 rounded font-bold text-slate-900 text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 transition"
                      />
                    </td>

                    {/* ACTIONS */}
                    <td className="py-3 px-4 text-center">
                      {!isAuto && (
                        <button
                          onClick={() => deleteBalanceItem(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                          title="Eliminar fila"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Total Row */}
            <tfoot>
              {/* Row: TOTAL (Suma de DEBE y HABER) */}
              <tr className="bg-slate-900 text-white font-bold border-t-2 border-emerald-500">
                <td></td>
                <td className="py-3.5 px-4 text-xs uppercase tracking-wider text-emerald-300">
                  TOTALES (Suma DEBE y HABER)
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-sm sm:text-base text-emerald-400 font-black">
                  {formatCurrency(totalDebe)}
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-sm sm:text-base text-rose-400 font-black">
                  {formatCurrency(totalHaber)}
                </td>
                <td></td>
              </tr>

              {/* Row: UTILIDAD = DEBE - HABER */}
              <tr className="bg-slate-950 text-white font-extrabold border-t border-slate-800">
                <td></td>
                <td className="py-4 px-4 text-sm uppercase tracking-wider text-amber-300">
                  UTILIDAD = DEBE − HABER
                </td>
                <td
                  colSpan={2}
                  className={`py-4 px-4 text-right font-mono text-lg sm:text-xl font-black ${
                    utilidad >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {formatCurrency(utilidad)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Accounting Notes Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
          <Info className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>
            Los valores de Debe y Haber se pueden modificar directamente en las celdas. La utilidad se recalcula en tiempo real.
          </span>
        </div>
      </div>
    </div>
  );
};
