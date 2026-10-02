import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { Product } from '../types/inventory';
import {
  Search,
  PlusCircle,
  FileSpreadsheet,
  Trash2,
  Edit2,
  ArrowUpDown,
  Filter,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Download,
  Upload,
} from 'lucide-react';

interface HojaBaseTabla1Props {
  onOpenUserForm2: () => void;
  onEditProduct: (product: Product) => void;
  onOpenBulkImport: () => void;
}

export const HojaBaseTabla1: React.FC<HojaBaseTabla1Props> = ({
  onOpenUserForm2,
  onEditProduct,
  onOpenBulkImport,
}) => {
  const {
    products,
    deleteProduct,
    clearAllProducts,
    resetToDefaults,
    totalInventario,
    totalProductos,
    addProduct,
    storeInfo,
  } = useInventory();

  // Search & filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'NORMAL' | 'LOW' | 'OUT'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Confirmation Modal state for Delete ALL
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'info';
    text: string;
  } | null>(null);

  // Sorting state
  const [sortField, setSortField] = useState<'codigo' | 'descripcion' | 'stock' | 'valorUnitario' | 'total'>('codigo');
  const [sortAsc, setSortAsc] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Import Modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.categoria) set.add(p.categoria);
    });
    return Array.from(set);
  }, [products]);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Search filter
        const matchSearch =
          searchTerm === '' ||
          p.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.descripcion.toLowerCase().includes(searchTerm.toLowerCase());

        // Category filter
        const matchCategory =
          categoryFilter === 'ALL' || p.categoria === categoryFilter;

        // Status filter
        let matchStatus = true;
        if (statusFilter === 'OUT') matchStatus = p.stock === 0;
        else if (statusFilter === 'LOW') matchStatus = p.stock > 0 && p.stock <= (p.stockMinimo ?? 5);
        else if (statusFilter === 'NORMAL') matchStatus = p.stock > (p.stockMinimo ?? 5);

        return matchSearch && matchCategory && matchStatus;
      })
      .sort((a, b) => {
        let valA: string | number = a[sortField];
        let valB: string | number = b[sortField];

        if (sortField === 'codigo') {
          const numA = parseInt(a.codigo.replace(/\D/g, ''), 10);
          const numB = parseInt(b.codigo.replace(/\D/g, ''), 10);
          if (!isNaN(numA) && !isNaN(numB)) {
            valA = numA;
            valB = numB;
          }
        }

        if (typeof valA === 'string') {
          return sortAsc
            ? (valA as string).localeCompare(valB as string)
            : (valB as string).localeCompare(valA as string);
        } else {
          return sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
        }
      });
  }, [products, searchTerm, statusFilter, categoryFilter, sortField, sortAsc]);

  // Paginated list
  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleDelete = (prod: Product) => {
    if (
      window.confirm(
        `¿Está seguro de eliminar el producto "${prod.descripcion}" (Código: ${prod.codigo}) de la base de datos?`
      )
    ) {
      deleteProduct(prod.codigo);
    }
  };

  // Export Tabla1 as CSV
  const handleExportCSV = () => {
    const headers = ['CODIGO', 'DESCRIPCION', 'STOCK', 'VALOR UNITARIO', 'TOTAL', 'CATEGORIA'];
    const rows = products.map((p) => [
      `"${p.codigo}"`,
      `"${p.descripcion.replace(/"/g, '""')}"`,
      p.stock,
      p.valorUnitario,
      p.stock * p.valorUnitario,
      `"${p.categoria || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const cleanStore = storeInfo.nombre.replace(/[^A-Za-z0-9]/g, '_');
    link.setAttribute('download', `${cleanStore}_TABLA1_INVENTARIO_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle CSV import
  const handleProcessImport = () => {
    if (!importText.trim()) return;

    try {
      const lines = importText.split('\n').filter((l) => l.trim().length > 0);
      let importedCount = 0;

      lines.forEach((line) => {
        // support comma or semicolon
        const separator = line.includes(';') ? ';' : ',';
        const parts = line.split(separator).map((s) => s.replace(/^"|"$/g, '').trim());

        if (parts.length >= 4) {
          const [codigo, descripcion, stockStr, precioStr, catStr] = parts;
          if (codigo && descripcion && codigo.toUpperCase() !== 'CODIGO') {
            const stock = parseInt(stockStr, 10) || 0;
            const valorUnitario = parseFloat(precioStr) || 0;
            addProduct({
              codigo,
              descripcion,
              stock,
              valorUnitario,
              categoria: catStr || 'General',
            });
            importedCount++;
          }
        }
      });

      setImportStatus(`¡Se importaron ${importedCount} productos exitosamente!`);
      setTimeout(() => {
        setShowImportModal(false);
        setImportStatus(null);
        setImportText('');
      }, 1500);
    } catch {
      setImportStatus('Error al procesar el formato. Verifique los datos.');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
                <FileSpreadsheet className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <span>Hoja BASE: Tabla1</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-semibold border border-slate-200">
                    A1:E{totalProductos + 1}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Base de datos principal de inventario. Almacén de códigos, descripción, existencias y precios.
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenBulkImport}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-black shadow-md hover:shadow-amber-500/20 transition active:scale-95 cursor-pointer"
              title="Cargar productos en lote por Rejilla, Excel o archivo CSV"
            >
              <Upload className="w-3.5 h-3.5 stroke-[3]" />
              <span>⚡ Ingreso Masivo (Lotes)</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition cursor-pointer"
              title="Descargar tabla en formato CSV / Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar CSV</span>
            </button>

            <button
              onClick={() => setShowDeleteAllModal(true)}
              disabled={products.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 disabled:opacity-40 disabled:cursor-not-allowed text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition cursor-pointer"
              title="Eliminar todos los productos de la base de datos (con confirmación)"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Borrar Todos</span>
            </button>

            <button
              onClick={onOpenUserForm2}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black shadow-md hover:shadow-emerald-500/20 transition active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Nuevo Producto</span>
            </button>
          </div>
        </div>

        {/* Feedback Banner if an action was executed */}
        {feedbackBanner && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs font-semibold flex items-center justify-between animate-in fade-in ${
              feedbackBanner.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                : 'bg-blue-50 text-blue-900 border border-blue-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{feedbackBanner.text}</span>
            </div>
            <button
              onClick={() => setFeedbackBanner(null)}
              className="text-xs underline hover:opacity-75 font-bold"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Filters and Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-4 items-center">
          {/* Search Input */}
          <div className="sm:col-span-5 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Buscar por código o descripción..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Category Filter */}
          <div className="sm:col-span-3">
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filtrar por categoría"
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="ALL">Todas las Categorías</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter Chips */}
          <div className="sm:col-span-4 flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos ({products.length})
            </button>
            <button
              onClick={() => {
                setStatusFilter('LOW');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                statusFilter === 'LOW'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
              }`}
            >
              Bajo Stock (≤5)
            </button>
            <button
              onClick={() => {
                setStatusFilter('OUT');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                statusFilter === 'OUT'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
              }`}
            >
              Agotados (0)
            </button>
          </div>
        </div>
      </div>

      {/* Main Table (Tabla1) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-xs uppercase tracking-wider font-bold">
                {/* Column A: CODIGO */}
                <th
                  onClick={() => handleSort('codigo')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-800 transition select-none w-28"
                >
                  <div className="flex items-center gap-1">
                    <span>A: CODIGO</span>
                    <ArrowUpDown className="w-3 h-3 text-amber-400" />
                  </div>
                </th>

                {/* Column B: DESCRIPCION */}
                <th
                  onClick={() => handleSort('descripcion')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-800 transition select-none min-w-[240px]"
                >
                  <div className="flex items-center gap-1">
                    <span>B: DESCRIPCION</span>
                    <ArrowUpDown className="w-3 h-3 text-amber-400" />
                  </div>
                </th>

                {/* Column C: STOCK */}
                <th
                  onClick={() => handleSort('stock')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-800 transition select-none text-right w-28"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>C: STOCK</span>
                    <ArrowUpDown className="w-3 h-3 text-amber-400" />
                  </div>
                </th>

                {/* Column D: VALOR UNITARIO */}
                <th
                  onClick={() => handleSort('valorUnitario')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-800 transition select-none text-right w-36"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>D: VALOR UNIT.</span>
                    <ArrowUpDown className="w-3 h-3 text-amber-400" />
                  </div>
                </th>

                {/* Column E: TOTAL */}
                <th
                  onClick={() => handleSort('total')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-800 transition select-none text-right w-40"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>E: TOTAL</span>
                    <ArrowUpDown className="w-3 h-3 text-amber-400" />
                  </div>
                </th>

                {/* Acciones */}
                <th className="py-3.5 px-4 text-center w-24">
                  ACCIONES
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center">
                    {products.length === 0 ? (
                      <div className="max-w-md mx-auto space-y-3">
                        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                          <Trash2 className="w-6 h-6 text-slate-400" />
                        </div>
                        <p className="font-bold text-slate-800 text-sm">
                          La base de datos de productos está vacía
                        </p>
                        <p className="text-xs text-slate-500">
                          Todos los productos han sido borrados. Puede cargar un lote masivo desde Excel, crear productos uno a uno o restaurar los datos de demostración.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                          <button
                            onClick={onOpenBulkImport}
                            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-black shadow transition cursor-pointer"
                          >
                            ⚡ Carga Masiva (Lotes)
                          </button>
                          <button
                            onClick={onOpenUserForm2}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow transition cursor-pointer"
                          >
                            + Nuevo Código
                          </button>
                          <button
                            onClick={() => {
                              resetToDefaults();
                              setFeedbackBanner({
                                type: 'info',
                                text: `Se restauraron los productos y datos iniciales de ${storeInfo.nombre}.`,
                              });
                            }}
                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
                          >
                            Restaurar Datos Iniciales
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-400 py-6">
                        No se encontraron productos que coincidan con la búsqueda o filtro seleccionado.
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((prod) => (
                  <tr
                    key={prod.codigo}
                    className="hover:bg-emerald-50/50 transition group"
                  >
                    {/* CODIGO */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-900 border border-slate-200">
                        {prod.codigo}
                      </span>
                    </td>

                    {/* DESCRIPCION */}
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div>{prod.descripcion}</div>
                      {prod.categoria && (
                        <span className="text-[10px] text-slate-400 font-normal">
                          {prod.categoria}
                        </span>
                      )}
                    </td>

                    {/* STOCK */}
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${
                          prod.stock === 0
                            ? 'bg-rose-100 text-rose-700'
                            : prod.stock <= 5
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {formatNumber(prod.stock)}
                      </span>
                    </td>

                    {/* VALOR UNITARIO */}
                    <td className="py-3 px-4 text-right font-mono text-slate-700 font-medium">
                      {formatCurrency(prod.valorUnitario)}
                    </td>

                    {/* TOTAL */}
                    <td className="py-3 px-4 text-right font-mono font-extrabold text-emerald-700">
                      {formatCurrency(prod.total)}
                    </td>

                    {/* ACCIONES */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 opacity-80 group-hover:opacity-100 transition">
                        <button
                          onClick={() => onEditProduct(prod)}
                          className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-100 rounded transition cursor-pointer"
                          title="Editar producto"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(prod)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                          title="Eliminar producto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {/* Table Footer with Total General calculation */}
            <tfoot>
              <tr className="bg-slate-900 text-white font-bold border-t-2 border-amber-400">
                <td colSpan={2} className="py-3.5 px-4 text-xs uppercase tracking-wider text-amber-300">
                  TOTAL GENERAL INVENTARIO (Hoja BASE / Tabla1)
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-xs sm:text-sm text-white">
                  {formatNumber(products.reduce((acc, p) => acc + p.stock, 0))} unid.
                </td>
                <td className="py-3.5 px-4 text-right text-xs text-slate-300">
                  Promedio: {formatCurrency(totalInventario / (products.length || 1))}
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-sm sm:text-base text-amber-300 font-black">
                  {formatCurrency(totalInventario)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Mostrando{' '}
            <strong className="text-slate-900">
              {filteredProducts.length === 0
                ? 0
                : (currentPage - 1) * pageSize + 1}
            </strong>{' '}
            a{' '}
            <strong className="text-slate-900">
              {Math.min(currentPage * pageSize, filteredProducts.length)}
            </strong>{' '}
            de <strong className="text-slate-900">{filteredProducts.length}</strong>{' '}
            productos
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded bg-white border border-slate-200 text-slate-700 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 cursor-pointer"
            >
              Anterior
            </button>
            <span className="px-2 font-mono font-bold text-slate-800">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded bg-white border border-slate-200 text-slate-700 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 cursor-pointer"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal to Delete ALL Products */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-200 animate-in zoom-in-95">
            <div className="flex items-center gap-3 pb-3 border-b border-rose-100">
              <div className="p-3 bg-rose-100 text-rose-700 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">
                  ¿Eliminar TODOS los productos?
                </h3>
                <p className="text-xs text-rose-600 font-semibold">
                  Acción destructiva para la hoja BASE
                </p>
              </div>
            </div>

            <div className="py-4 space-y-3 text-xs text-slate-600">
              <p>
                Está a punto de borrar los{' '}
                <strong className="text-slate-900 font-black">{products.length} productos</strong>{' '}
                registrados en <strong>Tabla1 de {storeInfo.nombre}</strong>.
              </p>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-1.5 font-medium">
                <div className="flex items-center gap-1.5 font-bold text-rose-950">
                  <AlertTriangle className="w-4 h-4 text-rose-700 flex-shrink-0" />
                  <span>Consecuencias de esta acción:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-800">
                  <li>Se eliminarán todos los códigos, descripciones y categorías.</li>
                  <li>Las existencias (Stock) y precios unitarios quedarán vacíos.</li>
                  <li>El Total General de Inventario pasará de <strong>{formatCurrency(totalInventario)}</strong> a <strong>$ 0</strong>.</li>
                  <li>La hoja <strong>BALANCE</strong> actualizará el renglón contable de inventario a <strong>$ 0</strong>.</li>
                </ul>
              </div>

              <p className="text-slate-500 text-[11px]">
                Nota: Podrá en cualquier momento volver a ingresar productos mediante <em>Carga Masiva</em> o restaurar los datos iniciales de demostración.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDeleteAllModal(false)}
                className="px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  clearAllProducts();
                  setShowDeleteAllModal(false);
                  setFeedbackBanner({
                    type: 'success',
                    text: 'Se han eliminado todos los productos y existencias de la hoja BASE.',
                  });
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black shadow-lg hover:shadow-rose-600/30 transition active:scale-95 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sí, Eliminar Todo el Inventario</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Bulk Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-600" />
                Importar Productos a Tabla1
              </h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-3 mb-2">
              Pegue datos separados por coma (,) o punto y coma (;) con el formato:
              <br />
              <code className="bg-slate-100 p-1 rounded font-mono text-[11px] block mt-1">
                CODIGO;DESCRIPCION;STOCK;VALOR_UNITARIO;CATEGORIA
              </code>
            </p>

            <textarea
              rows={6}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="1030;HARINA DE TRIGO 1000G;20;3800;Abarrotes&#10;1031;LAVANDINA BLANCA 1000ML;15;2900;Aseo"
              className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            {importStatus && (
              <p className="text-xs font-semibold text-emerald-700 mt-2 bg-emerald-50 p-2 rounded">
                {importStatus}
              </p>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleProcessImport}
                className="px-4 py-2 text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow"
              >
                Procesar e Importar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
