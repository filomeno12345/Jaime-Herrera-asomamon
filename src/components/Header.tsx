import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { MONTHS } from '../data/initialData';
import { EditarTiendaModal } from './EditarTiendaModal';
import {
  Store,
  Layers,
  Database,
  Scale,
  FileSpreadsheet,
  AlertTriangle,
  PlusCircle,
  TrendingUp,
  RotateCcw,
  Sparkles,
  Upload,
  Pencil,
} from 'lucide-react';

interface HeaderProps {
  onOpenUserForm1: () => void;
  onOpenUserForm2: () => void;
  onOpenBulkImport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenUserForm1,
  onOpenUserForm2,
  onOpenBulkImport,
}) => {
  const {
    period,
    setPeriod,
    storeInfo,
    activeTab,
    setActiveTab,
    totalInventario,
    totalProductos,
    stockBajoCount,
    agotadosCount,
    utilidad,
    resetToDefaults,
  } = useInventory();

  const [isEditStoreOpen, setIsEditStoreOpen] = useState(false);

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPeriod((prev) => ({ ...prev, mes: e.target.value }));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val > 2000 && val < 2100) {
      setPeriod((prev) => ({ ...prev, ano: val }));
    }
  };

  return (
    <header className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white shadow-xl border-b border-emerald-700/40 no-print">
      {/* Top Banner with Store Identity & Period Selector */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Brand Info */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsEditStoreOpen(true)}
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black text-xl border border-amber-300 hover:scale-105 transition cursor-pointer flex-shrink-0"
              title="Haga clic para editar los datos de la tienda"
            >
              <Store className="w-7 h-7 text-emerald-950" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditStoreOpen(true)}
                  className="flex items-center gap-2 group text-left transition cursor-pointer"
                  title="Haga clic para editar el nombre de la tienda"
                >
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase group-hover:text-amber-300 transition">
                    {storeInfo.nombre}
                  </h1>
                  <span className="p-1 rounded-md bg-white/10 group-hover:bg-amber-400 group-hover:text-slate-950 text-white/70 transition">
                    <Pencil className="w-3.5 h-3.5" />
                  </span>
                </button>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  INVENTARIO
                </span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-200/80 font-medium">
                {storeInfo.subtitulo || 'Control de Existencias, Consulta de Productos & Balance Contable'}
              </p>
            </div>
          </div>

          {/* Quick Actions & Period Picker */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Period Controls (MES / AÑO from Excel) */}
            <div className="flex items-center gap-2 bg-emerald-950/70 border border-emerald-700/50 rounded-lg px-3 py-1.5 shadow-inner">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">
                Período:
              </span>
              <div className="flex items-center gap-1.5">
                <select
                  value={period.mes}
                  onChange={handleMonthChange}
                  aria-label="Seleccionar Mes de Inventario"
                  className="bg-emerald-900/90 text-white text-xs font-semibold rounded px-2 py-1 border border-emerald-600 focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer"
                >
                  {MONTHS.map((m) => (
                    <option key={m} value={m} className="bg-slate-900 text-white">
                      {m}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={period.ano}
                  onChange={handleYearChange}
                  aria-label="Seleccionar Año de Inventario"
                  className="w-16 bg-emerald-900/90 text-white text-xs font-semibold rounded px-2 py-1 border border-emerald-600 focus:outline-none focus:ring-1 focus:ring-amber-400 text-center"
                />
              </div>
            </div>

            {/* Quick Action Trigger Buttons */}
            <button
              onClick={onOpenBulkImport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs rounded-lg shadow-md hover:shadow-teal-500/20 transition active:scale-95 cursor-pointer"
              title="Ingresar productos masivamente por Rejilla, Excel o archivo CSV"
            >
              <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Carga Masiva</span>
            </button>

            <button
              onClick={onOpenUserForm1}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow-md hover:shadow-amber-500/20 transition active:scale-95 cursor-pointer"
              title="Ajuste rápido de existencias y consulta de producto"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ajustar Stock</span>
            </button>

            <button
              onClick={onOpenUserForm2}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs rounded-lg shadow-md hover:shadow-emerald-500/20 transition active:scale-95 cursor-pointer"
              title="Registrar un nuevo producto en el catálogo"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Nuevo Producto</span>
            </button>
          </div>
        </div>

        {/* Real-time KPI Bar matching Excel totals */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-4 pt-3 border-t border-emerald-800/60">
          {/* Total Inventario General */}
          <div className="bg-emerald-950/50 backdrop-blur border border-emerald-700/40 rounded-lg p-2.5 flex flex-col">
            <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider">
              Total Inventario (BASE)
            </span>
            <span className="text-base sm:text-xl font-extrabold text-amber-300 font-mono">
              {formatCurrency(totalInventario)}
            </span>
          </div>

          {/* Total Productos */}
          <div className="bg-emerald-950/50 backdrop-blur border border-emerald-700/40 rounded-lg p-2.5 flex flex-col">
            <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider">
              Productos en Tabla1
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-xl font-extrabold text-white font-mono">
                {formatNumber(totalProductos)}
              </span>
              <span className="text-[11px] text-emerald-400">ítems activos</span>
            </div>
          </div>

          {/* Alerta de Stock Bajo / Agotado */}
          <div className="bg-emerald-950/50 backdrop-blur border border-emerald-700/40 rounded-lg p-2.5 flex flex-col">
            <span className="text-[11px] font-semibold text-amber-300/90 uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              Stock Crítico / Agotado
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-base sm:text-xl font-extrabold text-amber-400 font-mono">
                {stockBajoCount + agotadosCount}
              </span>
              <span className="text-[11px] text-slate-300">
                ({agotadosCount} sin stock)
              </span>
            </div>
          </div>

          {/* Utilidad Balance */}
          <div className="bg-emerald-950/50 backdrop-blur border border-emerald-700/40 rounded-lg p-2.5 flex flex-col">
            <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              Utilidad (Debe − Haber)
            </span>
            <span
              className={`text-base sm:text-xl font-extrabold font-mono ${
                utilidad >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatCurrency(utilidad)}
            </span>
          </div>
        </div>
      </div>

      {/* Excel Sheet Navigation Tabs */}
      <div className="bg-slate-950/90 border-t border-emerald-900/60 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <nav className="flex space-x-1 sm:space-x-2 py-1.5 overflow-x-auto">
            {/* Tab 1: Hoja1 (Pantalla Principal) */}
            <button
              onClick={() => setActiveTab('hoja1')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-t-lg font-bold text-xs sm:text-sm transition-all border-b-2 cursor-pointer ${
                activeTab === 'hoja1'
                  ? 'bg-emerald-600 text-white border-amber-400 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-emerald-950/40 border-transparent'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Hoja1 (Consulta & Stock)</span>
            </button>

            {/* Tab 2: BASE (Tabla1 Productos) */}
            <button
              onClick={() => setActiveTab('base')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-t-lg font-bold text-xs sm:text-sm transition-all border-b-2 cursor-pointer ${
                activeTab === 'base'
                  ? 'bg-emerald-600 text-white border-amber-400 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-emerald-950/40 border-transparent'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>BASE (Tabla1 Productos)</span>
            </button>

            {/* Tab 3: BALANCE (Balance Contable) */}
            <button
              onClick={() => setActiveTab('balance')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-t-lg font-bold text-xs sm:text-sm transition-all border-b-2 cursor-pointer ${
                activeTab === 'balance'
                  ? 'bg-emerald-600 text-white border-amber-400 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-emerald-950/40 border-transparent'
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>BALANCE Contable</span>
            </button>

            {/* Tab 4: Informes & Macros PDF */}
            <button
              onClick={() => setActiveTab('informes')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-t-lg font-bold text-xs sm:text-sm transition-all border-b-2 cursor-pointer ${
                activeTab === 'informes'
                  ? 'bg-emerald-600 text-white border-amber-400 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-emerald-950/40 border-transparent'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Informes & Macros PDF</span>
            </button>
          </nav>

          <button
            onClick={() => {
              if (
                window.confirm(
                  '¿Desea restaurar los datos iniciales de demostración de Supertienda Los Paisa?'
                )
              ) {
                resetToDefaults();
              }
            }}
            className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-300 px-2 py-1 rounded transition hover:bg-slate-800"
            title="Restaurar datos predeterminados del Excel"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Base</span>
          </button>
        </div>
      </div>

      <EditarTiendaModal
        isOpen={isEditStoreOpen}
        onClose={() => setIsEditStoreOpen(false)}
      />
    </header>
  );
};
