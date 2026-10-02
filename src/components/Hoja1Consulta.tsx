import React, { useState, useEffect, useRef } from 'react';
import { useInventory } from '../context/InventoryContext';
import { formatCurrency, formatNumber, formatDate } from '../utils/formatters';
import { Product } from '../types/inventory';
import {
  Search,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  Package,
  DollarSign,
  History,
  Barcode,
  Layers,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface Hoja1ConsultaProps {
  onOpenUserForm2: () => void;
}

export const Hoja1Consulta: React.FC<Hoja1ConsultaProps> = ({ onOpenUserForm2 }) => {
  const {
    products,
    operateStock,
    totalInventario,
    period,
    movements,
  } = useInventory();

  // Search states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cantidadInput, setCantidadInput] = useState<string>('');
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Search autocomplete suggestions
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const cantidadInputRef = useRef<HTMLInputElement>(null);

  // Default to first product if none selected
  useEffect(() => {
    if (!selectedProduct && products.length > 0) {
      setSelectedProduct(products[0]);
    } else if (selectedProduct) {
      // Keep selected product in sync with updated stock from state
      const current = products.find((p) => p.codigo === selectedProduct.codigo);
      if (current) {
        setSelectedProduct(current);
      }
    }
  }, [products, selectedProduct]);

  // Handle outside click for suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update suggestions on search term change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (!val.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const filtered = products
      .filter(
        (p) =>
          p.descripcion.toLowerCase().includes(val.toLowerCase()) ||
          p.codigo.toLowerCase().includes(val.toLowerCase())
      )
      .slice(0, 8);

    setSuggestions(filtered);
    setShowSuggestions(true);
  };

  const handleSelectProduct = (prod: Product) => {
    setSelectedProduct(prod);
    setSearchTerm(`${prod.codigo} - ${prod.descripcion}`);
    setShowSuggestions(false);
    setNotification(null);
    // Focus quantity input for fast typing
    setTimeout(() => {
      cantidadInputRef.current?.focus();
      cantidadInputRef.current?.select();
    }, 50);
  };

  // Perform stock update (UserForm1 logic)
  const handleStockAction = (tipo: 'INGRESO' | 'DESCUENTO' | 'AJUSTE') => {
    if (!selectedProduct) {
      setNotification({
        type: 'error',
        message: 'Falta código o cantidad en Hoja1. Seleccione un producto.',
      });
      return;
    }

    const numCantidad = parseFloat(cantidadInput);
    if (isNaN(numCantidad) || numCantidad <= 0) {
      setNotification({
        type: 'error',
        message: 'Falta código o cantidad en Hoja1. Ingrese una cantidad válida mayor a 0.',
      });
      cantidadInputRef.current?.focus();
      return;
    }

    const result = operateStock(selectedProduct.codigo, numCantidad, tipo);

    if (result.success) {
      setNotification({
        type: 'success',
        message: result.message,
      });
      setCantidadInput('');
    } else {
      setNotification({
        type: 'error',
        message: result.message,
      });
    }
  };

  const cantidadNum = parseFloat(cantidadInput) || 0;
  const valorUnitario = selectedProduct ? selectedProduct.valorUnitario : 0;
  const totalOperacion = cantidadNum * valorUnitario;
  const nuevoStockProyectado = selectedProduct
    ? selectedProduct.stock + cantidadNum
    : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner / Notification */}
      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between shadow-md transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : notification.type === 'error'
              ? 'bg-rose-50 border-rose-300 text-rose-900'
              : 'bg-blue-50 border-blue-300 text-blue-900'
          }`}
        >
          <div className="flex items-center gap-3">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            )}
            <p className="font-semibold text-sm">{notification.message}</p>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs font-bold underline px-2 py-1 hover:opacity-75"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Product Search & UserForm1 Controls (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card: Hoja1 Consulta de Productos (XLOOKUP / BUSCARX) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 sm:p-6 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-100 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                    <Barcode className="w-5 h-5" />
                  </span>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900">
                    Área de Consulta de Productos
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Búsqueda directa por Nombre o Código (Equivalente XLOOKUP / BUSCARX sobre Tabla1)
                </p>
              </div>

              {/* Quick sample pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-slate-400 font-semibold">Ejemplos:</span>
                <button
                  onClick={() => {
                    const p = products.find((x) => x.codigo === '1001');
                    if (p) handleSelectProduct(p);
                  }}
                  className="px-2 py-1 text-xs rounded-md bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 font-medium transition cursor-pointer"
                >
                  ARROZ KILO X 45
                </button>
                <button
                  onClick={() => {
                    const p = products.find((x) => x.codigo === '1002');
                    if (p) handleSelectProduct(p);
                  }}
                  className="px-2 py-1 text-xs rounded-md bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 font-medium transition cursor-pointer"
                >
                  JABON ENCUERO ORO
                </button>
              </div>
            </div>

            {/* Search Input Bar with Autocomplete Dropdown */}
            <div className="relative mb-6" ref={searchContainerRef}>
              <label
                htmlFor="buscar-nombre-input"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2"
              >
                BUSCAR X NOMBRE O CÓDIGO
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  id="buscar-nombre-input"
                  type="text"
                  placeholder="Escriba el nombre (ej. ARROZ, JABON, HARINA) o código numérico..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onFocus={() => {
                    if (searchTerm.trim()) setShowSuggestions(true);
                  }}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm sm:text-base shadow-inner transition"
                />
              </div>

              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-30 left-0 right-0 mt-1 bg-white rounded-xl shadow-2xl border border-slate-200 max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {suggestions.map((prod) => (
                    <div
                      key={prod.codigo}
                      onClick={() => handleSelectProduct(prod)}
                      className="p-3 hover:bg-emerald-50 cursor-pointer flex items-center justify-between transition group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold px-2 py-1 bg-slate-100 group-hover:bg-emerald-200 text-slate-700 group-hover:text-emerald-900 rounded">
                          {prod.codigo}
                        </span>
                        <div>
                          <p className="font-semibold text-sm text-slate-900 group-hover:text-emerald-900">
                            {prod.descripcion}
                          </p>
                          <p className="text-xs text-slate-500">{prod.categoria}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-900">
                          Stock: {prod.stock}
                        </p>
                        <p className="text-xs font-mono text-emerald-600 font-semibold">
                          {formatCurrency(prod.valorUnitario)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Product Card (Displays Exact Fields from Hoja1) */}
            {selectedProduct ? (
              <div className="bg-gradient-to-br from-slate-50 to-emerald-50/40 rounded-xl border border-slate-200 p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Producto Activo en Consulta
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                      {selectedProduct.descripcion}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">CÓDIGO:</span>
                    <span className="font-mono text-sm font-bold bg-slate-900 text-amber-300 px-3 py-1 rounded-lg shadow-sm">
                      {selectedProduct.codigo}
                    </span>
                  </div>
                </div>

                {/* Metrics Grid from Hoja1 & BASE */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                  {/* STOCK ACTUAL */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200/90 shadow-xs">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      STOCK ACTUAL
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                        {formatNumber(selectedProduct.stock)}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          selectedProduct.stock === 0
                            ? 'bg-rose-100 text-rose-700'
                            : selectedProduct.stock <= 5
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {selectedProduct.stock === 0
                          ? 'Agotado'
                          : selectedProduct.stock <= 5
                          ? 'Bajo'
                          : 'Normal'}
                      </span>
                    </div>
                  </div>

                  {/* VALOR UNITARIO */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200/90 shadow-xs">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      VALOR UNID.
                    </span>
                    <span className="text-lg sm:text-xl font-black text-emerald-700 font-mono mt-1 block">
                      {formatCurrency(selectedProduct.valorUnitario)}
                    </span>
                  </div>

                  {/* TOTAL EN BASE */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200/90 shadow-xs">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      TOTAL EN BASE
                    </span>
                    <span className="text-lg sm:text-xl font-black text-slate-900 font-mono mt-1 block">
                      {formatCurrency(selectedProduct.total)}
                    </span>
                  </div>

                  {/* CATEGORÍA */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200/90 shadow-xs">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      CATEGORÍA
                    </span>
                    <span className="text-xs font-semibold text-slate-700 truncate block mt-1">
                      {selectedProduct.categoria || 'General'}
                    </span>
                  </div>
                </div>

                {/* Panel de Actualización de Existencias */}
                <div className="bg-emerald-950 text-white rounded-xl p-4 sm:p-5 mt-4 border border-emerald-800 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <h4 className="text-sm font-bold uppercase tracking-wider text-amber-300">
                        Modificar Existencias del Producto
                      </h4>
                    </div>
                    <span className="text-[11px] text-emerald-300 font-medium">
                      Enter para confirmar suma
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    {/* CANTIDAD Input */}
                    <div className="sm:col-span-5">
                      <label
                        htmlFor="cantidad-userform-input"
                        className="block text-xs font-bold text-emerald-200 mb-1"
                      >
                        CANTIDAD A INGRESAR O MODIFICAR:
                      </label>
                      <input
                        id="cantidad-userform-input"
                        ref={cantidadInputRef}
                        type="number"
                        min="1"
                        step="1"
                        placeholder="Ej. 10"
                        value={cantidadInput}
                        onChange={(e) => setCantidadInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleStockAction('INGRESO');
                          }
                        }}
                        className="w-full bg-emerald-900/90 border-2 border-amber-400 text-amber-300 font-mono font-black text-xl px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-inner"
                      />
                    </div>

                    {/* Previews: Total Operación & Proyección */}
                    <div className="sm:col-span-7 bg-emerald-900/60 rounded-lg p-2.5 border border-emerald-700/50 flex items-center justify-around text-center">
                      <div>
                        <span className="text-[10px] text-emerald-300 uppercase font-semibold block">
                          Total Operación (Cant × Val)
                        </span>
                        <span className="text-sm sm:text-base font-extrabold text-amber-300 font-mono">
                          {formatCurrency(totalOperacion)}
                        </span>
                      </div>
                      <div className="h-8 w-px bg-emerald-700"></div>
                      <div>
                        <span className="text-[10px] text-emerald-300 uppercase font-semibold block">
                          Stock Resultante (+)
                        </span>
                        <span className="text-sm sm:text-base font-extrabold text-white font-mono">
                          {nuevoStockProyectado} unid.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Buttons for Stock Actions */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4">
                    {/* Sumar Stock (Ingreso de Mercancía) */}
                    <button
                      onClick={() => handleStockAction('INGRESO')}
                      className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 px-4 rounded-lg shadow-md transition active:scale-95 cursor-pointer text-sm"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>Sumar al Stock (+)</span>
                    </button>

                    {/* Descontar Stock (Salida o Venta) */}
                    <button
                      onClick={() => handleStockAction('DESCUENTO')}
                      className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2.5 px-4 rounded-lg shadow-md transition active:scale-95 cursor-pointer text-sm"
                    >
                      <Minus className="w-4 h-4 stroke-[3]" />
                      <span>Descontar Stock (-)</span>
                    </button>

                    {/* Ajuste Exacto (Auditoría) */}
                    <button
                      onClick={() => handleStockAction('AJUSTE')}
                      className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 px-3 rounded-lg border border-slate-600 transition active:scale-95 cursor-pointer text-xs"
                      title="Reemplaza el stock actual por la cantidad ingresada"
                    >
                      <span>Ajustar Exacto (=)</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
                <Package className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-600 font-semibold">
                  Seleccione un producto para ver stock y operar existencias
                </p>
                <button
                  onClick={onOpenUserForm2}
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-500 shadow"
                >
                  <Plus className="w-4 h-4" />
                  Crear Nuevo Producto
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Total Inventario General & Movimientos Recientes (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Total Inventario General Card matching Hoja1 */}
          <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white rounded-2xl p-5 shadow-lg border border-emerald-700/50">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-800">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-amber-400" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-200">
                  Total Inventario General
                </span>
              </div>
              <span className="text-[11px] font-bold bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded border border-amber-400/30">
                {period.mes} {period.ano}
              </span>
            </div>

            <div className="py-4">
              <span className="text-2xl sm:text-3xl font-black font-mono text-amber-300 tracking-tight block">
                {formatCurrency(totalInventario)}
              </span>
              <p className="text-xs text-emerald-300/80 mt-1">
                Suma total de la columna TOTAL de la hoja BASE ({products.length} productos)
              </p>
            </div>

            <div className="bg-emerald-950/60 rounded-xl p-3 border border-emerald-800 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-emerald-300">Hoja origen:</span>
                <span className="font-semibold text-white">BASE / Tabla1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-300">Fórmula de cálculo:</span>
                <span className="font-mono text-amber-300 font-bold">Σ (STOCK × VALOR UNITARIO)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-300">Vinculación Contable:</span>
                <span className="font-semibold text-emerald-400">Balance (Hoja BALANCE)</span>
              </div>
            </div>
          </div>

          {/* UserForm1 Audit Trail / Recent Stock Movements */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Historial de Movimientos
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">
                {movements.length} operaciones
              </span>
            </div>

            {movements.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                <Layers className="w-8 h-8 mx-auto mb-1 opacity-50" />
                No hay movimientos registrados en esta sesión.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {movements.slice(0, 10).map((mov) => (
                  <div
                    key={mov.id}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                            mov.tipo === 'INGRESO'
                              ? 'bg-emerald-100 text-emerald-800'
                              : mov.tipo === 'DESCUENTO'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {mov.tipo === 'INGRESO'
                            ? `+${mov.cantidad}`
                            : mov.tipo === 'DESCUENTO'
                            ? `-${mov.cantidad}`
                            : `=${mov.cantidad}`}
                        </span>
                        <span className="font-semibold text-slate-800 truncate max-w-[140px]">
                          {mov.descripcion}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        Stock: {mov.stockAnterior} →{' '}
                        <strong className="text-slate-700">{mov.stockNuevo}</strong> |{' '}
                        {formatDate(mov.fecha)}
                      </div>
                    </div>

                    <div className="text-right font-mono text-[11px] font-bold text-slate-700">
                      {formatCurrency(mov.totalOperacion)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
