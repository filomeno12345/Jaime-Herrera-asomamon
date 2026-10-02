import React, { useState, useMemo, useRef } from 'react';
import { useInventory } from '../context/InventoryContext';
import { BulkProductRow, DuplicateAction, BulkImportResult } from '../types/inventory';
import { formatCurrency, formatNumber, parseColombianNumber } from '../utils/formatters';
import {
  X,
  Upload,
  ClipboardPaste,
  Table,
  Plus,
  Trash2,
  Download,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  FileSpreadsheet,
  ArrowRight,
  RefreshCw,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface CargaMasivaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  'Abarrotes y Granos',
  'Aseo Personal y Hogar',
  'Lácteos y Huevos',
  'Bebidas y Café',
  'Enlatados y Conservas',
  'Panadería y Arepas',
  'Snacks y Dulces',
  'Carnes y Embutidos',
  'Frutas y Verduras',
  'General',
];

// Sample bulk packs for Colombian Supermarket
const SAMPLE_BATCH_ABARROTES = [
  { codigo: '', descripcion: 'FRIJOL BOLA ROJA 500G', stock: 25, valorUnitario: 6200, categoria: 'Abarrotes y Granos' },
  { codigo: '', descripcion: 'GARBANZO IMPORTADO 500G', stock: 20, valorUnitario: 4900, categoria: 'Abarrotes y Granos' },
  { codigo: '', descripcion: 'ACEITE GIRASOL 1000ML', stock: 18, valorUnitario: 11500, categoria: 'Abarrotes y Granos' },
  { codigo: '', descripcion: 'ATUN EN AGUA LOMITOS 160G', stock: 35, valorUnitario: 7100, categoria: 'Enlatados y Conservas' },
  { codigo: '', descripcion: 'SARDINAS EN TOMATE 425G', stock: 15, valorUnitario: 5400, categoria: 'Enlatados y Conservas' },
  { codigo: '', descripcion: 'CAFE AGUILA ROJA 500G', stock: 24, valorUnitario: 13900, categoria: 'Bebidas y Café' },
];

const SAMPLE_BATCH_ASEO = [
  { codigo: '', descripcion: 'JABON FAB BARRA LIMON 300G', stock: 40, valorUnitario: 2900, categoria: 'Aseo Personal y Hogar' },
  { codigo: '', descripcion: 'DETERGENTE ARIEL LIQUIDO 1000ML', stock: 16, valorUnitario: 14500, categoria: 'Aseo Personal y Hogar' },
  { codigo: '', descripcion: 'SUAVIZANTE AMOR AZUL 850ML', stock: 22, valorUnitario: 5900, categoria: 'Aseo Personal y Hogar' },
  { codigo: '', descripcion: 'DESINFECTANTE FABULOSO 1000ML', stock: 30, valorUnitario: 6200, categoria: 'Aseo Personal y Hogar' },
  { codigo: '', descripcion: 'ESPONJA DE ALAMBRE BRILLO X 3', stock: 50, valorUnitario: 2100, categoria: 'Aseo Personal y Hogar' },
];

export const CargaMasivaModal: React.FC<CargaMasivaModalProps> = ({ isOpen, onClose }) => {
  const { bulkAddProducts, getNextAvailableCode, products, storeInfo } = useInventory();

  // Mode: 'grid' (Interactive Spreadsheet), 'paste' (Clipboard / Excel Copy), 'file' (CSV Upload)
  const [activeMode, setActiveMode] = useState<'grid' | 'paste' | 'file'>('grid');

  // Options
  const [duplicateAction, setDuplicateAction] = useState<DuplicateAction>('update');
  const [defaultCategory, setDefaultCategory] = useState<string>('Abarrotes y Granos');

  // Grid Mode Rows
  const [gridRows, setGridRows] = useState<BulkProductRow[]>(() => {
    return Array.from({ length: 6 }, (_, i) => ({
      id: `row-${Date.now()}-${i}`,
      codigo: '',
      descripcion: '',
      stock: '',
      valorUnitario: '',
      categoria: 'Abarrotes y Granos',
    }));
  });

  // Paste Mode State
  const [rawPastedText, setRawPastedText] = useState('');
  const [parsedPasteRows, setParsedPasteRows] = useState<BulkProductRow[]>([]);

  // File Upload State
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [fileRows, setFileRows] = useState<BulkProductRow[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Result state
  const [resultSummary, setResultSummary] = useState<BulkImportResult | null>(null);

  // Auto fill sequential codes in grid
  const handleAutoFillCodes = () => {
    const nextStartCode = parseInt(getNextAvailableCode(), 10) || 1001;
    let curr = nextStartCode;

    setGridRows((prev) =>
      prev.map((row) => {
        if (!row.codigo.trim()) {
          const assigned = String(curr);
          curr++;
          return { ...row, codigo: assigned };
        }
        return row;
      })
    );
  };

  // Add more rows to Grid
  const handleAddRows = (count: number) => {
    const nextStartCode = parseInt(getNextAvailableCode(), 10) || 1001;
    const currentFilledCount = gridRows.filter((r) => r.codigo.trim()).length;
    let curr = nextStartCode + currentFilledCount;

    const newRows: BulkProductRow[] = Array.from({ length: count }, (_, i) => ({
      id: `row-${Date.now()}-${i}-${Math.random()}`,
      codigo: String(curr + i),
      descripcion: '',
      stock: '10',
      valorUnitario: '0',
      categoria: defaultCategory,
    }));

    setGridRows((prev) => [...prev, ...newRows]);
  };

  // Update specific row in Grid
  const handleRowChange = (id: string, field: keyof BulkProductRow, value: string) => {
    setGridRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  // Delete row in Grid
  const handleDeleteRow = (id: string) => {
    setGridRows((prev) => prev.filter((r) => r.id !== id));
  };

  // Load sample demo batch
  const handleLoadSampleBatch = (batch: typeof SAMPLE_BATCH_ABARROTES) => {
    const startCode = parseInt(getNextAvailableCode(), 10) || 1001;
    const newItems: BulkProductRow[] = batch.map((item, idx) => ({
      id: `sample-${Date.now()}-${idx}`,
      codigo: String(startCode + idx),
      descripcion: item.descripcion,
      stock: item.stock,
      valorUnitario: item.valorUnitario,
      categoria: item.categoria,
    }));

    setGridRows((prev) => [...prev.filter((r) => r.descripcion.trim()), ...newItems]);
  };

  // Clear empty rows in Grid
  const handleClearEmpty = () => {
    setGridRows((prev) => {
      const filtered = prev.filter((r) => r.descripcion.trim().length > 0);
      return filtered.length > 0
        ? filtered
        : [
            {
              id: `row-${Date.now()}-0`,
              codigo: getNextAvailableCode(),
              descripcion: '',
              stock: '',
              valorUnitario: '',
              categoria: defaultCategory,
            },
          ];
    });
  };

  // Parse text from Paste area (supports Excel \t, CSV ;, ,)
  const handleParsePastedText = (text: string) => {
    setRawPastedText(text);
    if (!text.trim()) {
      setParsedPasteRows([]);
      return;
    }

    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const parsed: BulkProductRow[] = [];
    const nextStartCode = parseInt(getNextAvailableCode(), 10) || 1001;
    let autoCode = nextStartCode;

    lines.forEach((line, idx) => {
      // Determine separator: Tab (Excel copy), semicolon, or comma
      let sep = '\t';
      if (line.includes('\t')) {
        sep = '\t';
      } else if (line.includes(';')) {
        sep = ';';
      } else if (line.includes(',')) {
        sep = ',';
      }

      const parts = line.split(sep).map((p) => p.replace(/^"|"$/g, '').trim());

      // If header line, skip
      if (
        idx === 0 &&
        (parts[0]?.toUpperCase().includes('COD') ||
          parts[1]?.toUpperCase().includes('DESC') ||
          parts[0]?.toUpperCase().includes('PRODUCT'))
      ) {
        return;
      }

      let codigo = '';
      let descripcion = '';
      let stock: number | string = '0';
      let valorUnitario: number | string = '0';
      let categoria = defaultCategory;

      if (parts.length === 1) {
        // Just description
        descripcion = parts[0];
        codigo = String(autoCode++);
      } else if (parts.length === 2) {
        // [Desc, Precio] or [Codigo, Desc]
        if (isNaN(Number(parts[0])) && !isNaN(Number(parts[1]))) {
          descripcion = parts[0];
          valorUnitario = parts[1];
          codigo = String(autoCode++);
        } else {
          codigo = parts[0];
          descripcion = parts[1];
        }
      } else if (parts.length >= 3) {
        // Standard: Codigo, Descripcion, Stock, [Precio], [Categoria]
        // Or if first column is description:
        if (isNaN(Number(parts[0])) && parts[0].length > 3) {
          descripcion = parts[0];
          stock = parts[1] || '0';
          valorUnitario = parts[2] || '0';
          categoria = parts[3] || defaultCategory;
          codigo = String(autoCode++);
        } else {
          codigo = parts[0] || String(autoCode++);
          descripcion = parts[1];
          stock = parts[2] || '0';
          valorUnitario = parts[3] || '0';
          categoria = parts[4] || defaultCategory;
        }
      }

      if (descripcion) {
        const parsedStock = parseColombianNumber(stock);
        const parsedPrecio = parseColombianNumber(valorUnitario);
        parsed.push({
          id: `paste-${idx}-${Date.now()}`,
          codigo,
          descripcion: descripcion.toUpperCase(),
          stock: parsedStock,
          valorUnitario: parsedPrecio,
          categoria,
        });
      }
    });

    setParsedPasteRows(parsed);
  };

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        handleParsePastedText(content);
        setFileRows(parsedPasteRows);
        setActiveMode('paste'); // Switch to preview
      }
    };
    reader.readAsText(file);
  };

  // Compute active rows to import based on mode
  const activeRowsToImport = useMemo(() => {
    if (activeMode === 'grid') {
      return gridRows.filter((r) => r.descripcion.trim().length > 0);
    }
    return parsedPasteRows;
  }, [activeMode, gridRows, parsedPasteRows]);

  // Compute summary stats of rows to import (accurately calculating stock * valorUnitario)
  const importMetrics = useMemo(() => {
    let totalStock = 0;
    let totalValor = 0;
    let existingCount = 0;

    const existingCodes = new Set(products.map((p) => p.codigo.toLowerCase().trim()));

    activeRowsToImport.forEach((r) => {
      const st = Math.max(0, parseColombianNumber(r.stock));
      const pr = Math.max(0, parseColombianNumber(r.valorUnitario));
      totalStock += st;
      totalValor += st * pr;

      if (r.codigo && existingCodes.has(r.codigo.toLowerCase().trim())) {
        existingCount++;
      }
    });

    return {
      count: activeRowsToImport.length,
      totalStock,
      totalValor,
      existingCount,
    };
  }, [activeRowsToImport, products]);

  // Execute Bulk Import with full operations
  const handleExecuteImport = () => {
    if (activeRowsToImport.length === 0) {
      alert('No hay productos con descripción válida para ingresar.');
      return;
    }

    const payload = activeRowsToImport.map((r) => {
      const stockNum = Math.max(0, parseColombianNumber(r.stock));
      const precioNum = Math.max(0, parseColombianNumber(r.valorUnitario));
      return {
        codigo: r.codigo.trim(),
        descripcion: r.descripcion.trim().toUpperCase(),
        stock: stockNum,
        valorUnitario: precioNum,
        categoria: r.categoria || defaultCategory,
      };
    });

    const res = bulkAddProducts(payload, {
      onDuplicate: duplicateAction,
      defaultCategory,
    });

    setResultSummary(res);
  };

  // Download official CSV template
  const handleDownloadTemplate = () => {
    const templateContent =
      'CODIGO;DESCRIPCION;STOCK;VALOR_UNITARIO;CATEGORIA\n' +
      '2001;ACEITE DE OLIVA EXTRA VIRGEN 500ML;12;24500;Abarrotes y Granos\n' +
      '2002;LENTEJA PARDINA SELECCIONADA 500G;30;4200;Abarrotes y Granos\n' +
      '2003;JABON REY EN POLVO 1000G;25;7800;Aseo Personal y Hogar\n' +
      '2004;QUESO DOBLE CREMA BLOQUE 500G;15;11900;Lácteos y Huevos\n' +
      '2005;GALLETAS SALTINAS TACO X 3;40;4900;Snacks y Dulces\n';

    const blob = new Blob(['\uFEFF' + templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Plantilla_Ingreso_Masivo_Supertienda_Los_Paisa.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-emerald-700/60 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md">
              <Upload className="w-5 h-5 text-emerald-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg uppercase tracking-tight">
                  Ingreso Masivo de Productos a BASE
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Tabla1 (Excel)
                </span>
              </div>
              <p className="text-xs text-emerald-200">
                {storeInfo.nombre} • Cargue lotes de productos por Rejilla, Portapapeles o Archivo CSV
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Mode Selector Tabs & Template Download */}
        <div className="bg-slate-100/90 border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveMode('grid')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeMode === 'grid'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Table className="w-4 h-4" />
              <span>1. Rejilla Tipo Hoja de Cálculo</span>
            </button>

            <button
              onClick={() => setActiveMode('paste')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeMode === 'paste'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-200'
              }`}
            >
              <ClipboardPaste className="w-4 h-4" />
              <span>2. Pegar desde Excel / Portapapeles</span>
            </button>

            <button
              onClick={() => setActiveMode('file')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeMode === 'file'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>3. Subir Archivo (.csv)</span>
            </button>
          </div>

          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer"
            title="Descargar archivo modelo con ejemplos colombianos"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Descargar Plantilla CSV</span>
          </button>
        </div>

        {/* Success Modal Overlay when import finishes */}
        {resultSummary && (
          <div className="p-6 bg-emerald-50 border-b border-emerald-200 animate-in fade-in flex-shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-600 text-white rounded-xl">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-emerald-950 text-base">
                    ¡Carga Masiva Procesada con Éxito en BASE!
                  </h4>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Se han registrado{' '}
                    <strong>{resultSummary.added} productos nuevos</strong>, actualizados{' '}
                    <strong>{resultSummary.updated} existentes</strong> y omitidos{' '}
                    <strong>{resultSummary.skipped}</strong>.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setResultSummary(null)}
                  className="px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-black hover:bg-emerald-600 shadow cursor-pointer"
                >
                  Seguir Cargando
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-black hover:bg-slate-800 shadow cursor-pointer"
                >
                  Ver en Tabla1
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Configuration Bar (Duplicate handling & default category) */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs flex-shrink-0">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 uppercase tracking-wide">
                Si el código ya existe:
              </span>
              <select
                value={duplicateAction}
                onChange={(e) => setDuplicateAction(e.target.value as DuplicateAction)}
                aria-label="Acción en caso de código duplicado"
                className="bg-white border border-slate-300 rounded-md px-2.5 py-1 text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="update">Actualizar (Sumar stock y renovar precio)</option>
                <option value="skip">Omitir (No sobrescribir el existente)</option>
                <option value="generate_new_code">Generar Nuevo Código (Auto-incremental)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 uppercase tracking-wide">
                Categoría por Defecto:
              </span>
              <select
                value={defaultCategory}
                onChange={(e) => setDefaultCategory(e.target.value)}
                aria-label="Categoría por defecto para productos"
                className="bg-white border border-slate-300 rounded-md px-2.5 py-1 text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Sample Packs Button */}
          {activeMode === 'grid' && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-500 font-semibold">Cargar Lote Rápido:</span>
              <button
                onClick={() => handleLoadSampleBatch(SAMPLE_BATCH_ABARROTES)}
                className="px-2 py-1 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 rounded text-[11px] font-bold transition cursor-pointer"
              >
                + Lote Granos
              </button>
              <button
                onClick={() => handleLoadSampleBatch(SAMPLE_BATCH_ASEO)}
                className="px-2 py-1 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 rounded text-[11px] font-bold transition cursor-pointer"
              >
                + Lote Aseo
              </button>
            </div>
          )}
        </div>

        {/* Content Body Based on Active Tab */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* ===================== MODE 1: SPREADSHEET GRID ===================== */}
          {activeMode === 'grid' && (
            <div className="space-y-3">
              {/* Grid Control Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleAddRows(5)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ 5 Filas</span>
                  </button>

                  <button
                    onClick={() => handleAddRows(10)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ 10 Filas</span>
                  </button>

                  <button
                    onClick={handleAutoFillCodes}
                    className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-black transition cursor-pointer shadow-xs"
                    title="Asigna códigos numéricos correlativos automáticos a las filas vacías"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Auto-Numerar Códigos</span>
                  </button>

                  <button
                    onClick={handleClearEmpty}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold hover:bg-slate-100 rounded-lg transition cursor-pointer"
                  >
                    Limpiar Filas Vacías
                  </button>
                </div>

                <div className="text-xs text-slate-500 font-medium">
                  {gridRows.filter((r) => r.descripcion.trim()).length} de {gridRows.length} filas listas
                </div>
              </div>

              {/* Table of Grid Rows */}
              <div className="border border-slate-300 rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto max-h-[46vh]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-900 text-white uppercase font-bold sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center">#</th>
                        <th className="py-2.5 px-3 w-28">A: CÓDIGO</th>
                        <th className="py-2.5 px-3 min-w-[240px]">B: DESCRIPCIÓN DEL PRODUCTO</th>
                        <th className="py-2.5 px-3 w-24 text-right">C: STOCK</th>
                        <th className="py-2.5 px-3 w-32 text-right">D: VALOR UNIT. ($)</th>
                        <th className="py-2.5 px-3 w-36 text-right text-amber-300">E: TOTAL (C × D)</th>
                        <th className="py-2.5 px-3 w-36">CATEGORÍA</th>
                        <th className="py-2.5 px-2 text-center w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {gridRows.map((row, idx) => {
                        const hasDesc = row.descripcion.trim().length > 0;
                        const rowStock = parseColombianNumber(row.stock);
                        const rowPrice = parseColombianNumber(row.valorUnitario);
                        const rowTotal = rowStock * rowPrice;

                        return (
                          <tr
                            key={row.id}
                            className={`transition hover:bg-emerald-50/40 ${
                              hasDesc ? 'bg-white' : 'bg-slate-50/50'
                            }`}
                          >
                            <td className="py-2 px-3 text-center text-slate-400 font-mono">
                              {idx + 1}
                            </td>

                            {/* CODIGO */}
                            <td className="py-1 px-2">
                              <input
                                type="text"
                                placeholder={`Auto (${1001 + idx})`}
                                value={row.codigo}
                                onChange={(e) =>
                                  handleRowChange(row.id, 'codigo', e.target.value)
                                }
                                aria-label={`Código del producto en fila ${idx + 1}`}
                                className="w-full px-2 py-1.5 font-mono font-bold text-slate-800 bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              />
                            </td>

                            {/* DESCRIPCION */}
                            <td className="py-1 px-2">
                              <input
                                type="text"
                                placeholder="Nombre o descripción (ej. ARROZ DIANA 1000G)"
                                value={row.descripcion}
                                onChange={(e) =>
                                  handleRowChange(row.id, 'descripcion', e.target.value.toUpperCase())
                                }
                                aria-label={`Descripción del producto en fila ${idx + 1}`}
                                className="w-full px-2 py-1.5 font-bold uppercase text-slate-900 bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              />
                            </td>

                            {/* STOCK */}
                            <td className="py-1 px-2">
                              <input
                                type="text"
                                placeholder="0"
                                value={row.stock}
                                onChange={(e) =>
                                  handleRowChange(row.id, 'stock', e.target.value)
                                }
                                aria-label={`Stock del producto en fila ${idx + 1}`}
                                className="w-full px-2 py-1.5 font-mono font-bold text-right text-slate-800 bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              />
                            </td>

                            {/* VALOR UNITARIO */}
                            <td className="py-1 px-2">
                              <input
                                type="text"
                                placeholder="0"
                                value={row.valorUnitario}
                                onChange={(e) =>
                                  handleRowChange(row.id, 'valorUnitario', e.target.value)
                                }
                                aria-label={`Valor unitario del producto en fila ${idx + 1}`}
                                className="w-full px-2 py-1.5 font-mono font-bold text-right text-emerald-800 bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              />
                            </td>

                            {/* TOTAL OPERACION (STOCK x VALOR UNITARIO) */}
                            <td className="py-1 px-2 font-mono font-black text-right text-emerald-800 bg-emerald-50/60">
                              {formatCurrency(rowTotal)}
                            </td>

                            {/* CATEGORIA */}
                            <td className="py-1 px-2">
                              <select
                                value={row.categoria || defaultCategory}
                                onChange={(e) =>
                                  handleRowChange(row.id, 'categoria', e.target.value)
                                }
                                aria-label={`Categoría del producto en fila ${idx + 1}`}
                                className="w-full px-2 py-1.5 text-xs text-slate-700 bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                              >
                                {CATEGORIES.map((cat) => (
                                  <option key={cat} value={cat}>
                                    {cat}
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* ACCION */}
                            <td className="py-1 px-2 text-center">
                              <button
                                onClick={() => handleDeleteRow(row.id)}
                                className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition cursor-pointer"
                                title="Eliminar fila"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ===================== MODE 2: CLIPBOARD / EXCEL PASTE ===================== */}
          {activeMode === 'paste' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center gap-2 font-bold text-slate-800 mb-1">
                  <ClipboardPaste className="w-4 h-4 text-emerald-600" />
                  Instrucciones de Pegado Directo desde Excel o Google Sheets
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Copie sus celdas en Excel (<kbd className="font-mono bg-white px-1.5 py-0.5 rounded border">Ctrl + C</kbd>) y péguelas directamente en el cuadro de abajo (<kbd className="font-mono bg-white px-1.5 py-0.5 rounded border">Ctrl + V</kbd>).
                  El sistema detecta automáticamente columnas separadas por tabulación, coma o punto y coma:
                  <br />
                  <code className="text-emerald-800 font-mono font-bold mt-1 inline-block">
                    CÓDIGO [Tab] DESCRIPCIÓN [Tab] STOCK [Tab] VALOR_UNITARIO [Tab] CATEGORÍA
                  </code>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Área de Pegado (Paste Clipboard):
                </label>
                <textarea
                  rows={6}
                  placeholder={`Ejemplo:\n1030\tARROZ EXTRA FINO 1000G\t20\t3800\tAbarrotes y Granos\n1031\tLAVAPLATOS AXION CREMA 450G\t15\t4700\tAseo Personal y Hogar\n1032\tLECHE COLANTA ENTERA 1000ML\t30\t4200\tLácteos y Huevos`}
                  value={rawPastedText}
                  onChange={(e) => handleParsePastedText(e.target.value)}
                  className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner"
                />
              </div>

              {/* Live Preview of parsed rows */}
              {parsedPasteRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Vista Previa de Productos Detectados ({parsedPasteRows.length} ítems):
                    </span>
                    <button
                      onClick={() => handleParsePastedText('')}
                      className="text-xs text-rose-600 hover:underline font-semibold"
                    >
                      Limpiar
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-bold uppercase sticky top-0">
                        <tr>
                          <th className="py-2 px-3 w-10">#</th>
                          <th className="py-2 px-3 w-24">CÓDIGO</th>
                          <th className="py-2 px-3">DESCRIPCIÓN</th>
                          <th className="py-2 px-3 text-right w-20">STOCK</th>
                          <th className="py-2 px-3 text-right w-28">VALOR UNIT.</th>
                          <th className="py-2 px-3 text-right w-32 text-emerald-800">TOTAL (STOCK × VALOR)</th>
                          <th className="py-2 px-3 w-32">CATEGORÍA</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedPasteRows.map((r, i) => {
                          const sNum = parseColombianNumber(r.stock);
                          const pNum = parseColombianNumber(r.valorUnitario);
                          const tNum = sNum * pNum;
                          return (
                            <tr key={r.id} className="hover:bg-slate-50">
                              <td className="py-1.5 px-3 text-slate-400 font-mono">{i + 1}</td>
                              <td className="py-1.5 px-3 font-mono font-bold text-slate-900">{r.codigo}</td>
                              <td className="py-1.5 px-3 font-semibold text-slate-800">{r.descripcion}</td>
                              <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900">{sNum}</td>
                              <td className="py-1.5 px-3 text-right font-mono text-slate-700 font-semibold">
                                {formatCurrency(pNum)}
                              </td>
                              <td className="py-1.5 px-3 text-right font-mono text-emerald-800 font-black bg-emerald-50/40">
                                {formatCurrency(tNum)}
                              </td>
                              <td className="py-1.5 px-3 text-slate-600">{r.categoria}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===================== MODE 3: FILE UPLOAD ===================== */}
          {activeMode === 'file' && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/80 rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-3"
              >
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Haga clic aquí para seleccionar o arrastre su archivo .CSV o .TXT
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Compatible con archivos exportados de Excel, Google Sheets o cualquier ERP comercial
                  </p>
                </div>
                {uploadedFileName && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-200 text-emerald-900 font-mono text-xs font-bold rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {uploadedFileName}
                  </span>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="text-xs text-slate-600">
                  ¿No tiene el formato exacto? Descargue la plantilla lista para rellenar en Excel:
                </div>
                <button
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Descargar Plantilla CSV
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Bar: Metrics & Confirm Button */}
        <div className="bg-slate-900 text-white px-6 py-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 flex-shrink-0">
          {/* Metrics summary */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs w-full sm:w-auto justify-around sm:justify-start">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                PRODUCTOS A REGISTRAR
              </span>
              <span className="text-base font-black font-mono text-amber-300">
                {importMetrics.count} ítems
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                STOCK TOTAL A INGRESAR
              </span>
              <span className="text-base font-black font-mono text-white">
                {formatNumber(importMetrics.totalStock)} unid.
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                VALOR TOTAL ESTIMADO
              </span>
              <span className="text-base font-black font-mono text-emerald-400">
                {formatCurrency(importMetrics.totalValor)}
              </span>
            </div>

            {importMetrics.existingCount > 0 && (
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 block">
                  CÓDIGOS REPETIDOS ({duplicateAction})
                </span>
                <span className="text-xs font-mono font-bold text-amber-300">
                  {importMetrics.existingCount} coincidencias
                </span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Cancelar
            </button>

            <button
              onClick={handleExecuteImport}
              disabled={importMetrics.count === 0}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 rounded-xl text-xs sm:text-sm font-black shadow-lg hover:shadow-emerald-500/25 transition active:scale-95 cursor-pointer"
            >
              <Upload className="w-4 h-4 stroke-[3]" />
              <span>Ingresar {importMetrics.count} Productos a Tabla1</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
