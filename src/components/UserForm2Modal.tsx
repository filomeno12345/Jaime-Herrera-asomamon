import React, { useState, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Product } from '../types/inventory';
import {
  PlusCircle,
  X,
  CheckCircle,
  AlertCircle,
  Hash,
  FileText,
  DollarSign,
  Package,
  Layers,
} from 'lucide-react';

interface UserForm2ModalProps {
  isOpen: boolean;
  onClose: () => void;
  editProduct?: Product | null;
}

export const UserForm2Modal: React.FC<UserForm2ModalProps> = ({
  isOpen,
  onClose,
  editProduct,
}) => {
  const { addProduct, updateProduct, getNextAvailableCode } = useInventory();

  // Form Fields
  const [txtCodigoNuevo, setTxtCodigoNuevo] = useState('');
  const [txtDescripcion, setTxtDescripcion] = useState('');
  const [txtStock, setTxtStock] = useState('0');
  const [txtValorUnitario, setTxtValorUnitario] = useState('0');
  const [txtCategoria, setTxtCategoria] = useState('Abarrotes y Granos');
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    msg: string;
  } | null>(null);

  // Categories list
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

  useEffect(() => {
    if (isOpen) {
      setFeedback(null);
      if (editProduct) {
        setTxtCodigoNuevo(editProduct.codigo);
        setTxtDescripcion(editProduct.descripcion);
        setTxtStock(String(editProduct.stock));
        setTxtValorUnitario(String(editProduct.valorUnitario));
        setTxtCategoria(editProduct.categoria || 'Abarrotes y Granos');
      } else {
        const nextCode = getNextAvailableCode();
        setTxtCodigoNuevo(nextCode);
        setTxtDescripcion('');
        setTxtStock('0');
        setTxtValorUnitario('0');
        setTxtCategoria('Abarrotes y Granos');
      }
    }
  }, [isOpen, editProduct, getNextAvailableCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanCode = txtCodigoNuevo.trim();
    const cleanDesc = txtDescripcion.trim().toUpperCase();
    const numStock = parseInt(txtStock, 10) || 0;
    const numPrice = parseFloat(txtValorUnitario) || 0;

    if (!cleanCode) {
      setFeedback({ type: 'error', msg: 'El código del producto no puede estar vacío.' });
      return;
    }

    if (!cleanDesc) {
      setFeedback({ type: 'error', msg: 'Debe ingresar la descripción del producto.' });
      return;
    }

    if (numStock < 0) {
      setFeedback({ type: 'error', msg: 'El stock no puede ser negativo.' });
      return;
    }

    if (numPrice < 0) {
      setFeedback({ type: 'error', msg: 'El valor unitario no puede ser negativo.' });
      return;
    }

    if (editProduct) {
      const res = updateProduct(editProduct.codigo, {
        descripcion: cleanDesc,
        stock: numStock,
        valorUnitario: numPrice,
        categoria: txtCategoria,
      });
      if (res.success) {
        setFeedback({ type: 'success', msg: 'Producto actualizado en Tabla1 exitosamente.' });
        setTimeout(() => onClose(), 1000);
      } else {
        setFeedback({ type: 'error', msg: res.message });
      }
    } else {
      const res = addProduct({
        codigo: cleanCode,
        descripcion: cleanDesc,
        stock: numStock,
        valorUnitario: numPrice,
        categoria: txtCategoria,
        stockMinimo: 5,
      });

      if (res.success) {
        setFeedback({ type: 'success', msg: res.message });
        setTimeout(() => onClose(), 1000);
      } else {
        setFeedback({ type: 'error', msg: res.message });
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
        {/* Title Bar */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <PlusCircle className="w-5 h-5 text-amber-300" />
            <div>
              <h3 className="font-black text-base uppercase tracking-wider">
                {editProduct ? 'Modificar Producto' : 'Registrar Nuevo Producto'}
              </h3>
              <p className="text-xs text-emerald-200">
                Supertienda Los Paisa • Catálogo de Inventario
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Feedback */}
          {feedback && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                  : 'bg-rose-50 text-rose-900 border border-rose-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              )}
              <span>{feedback.msg}</span>
            </div>
          )}

          {/* Código del Producto */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label
                htmlFor="userform2-codigo"
                className="text-xs font-bold text-slate-700 uppercase tracking-wider"
              >
                CÓDIGO DEL PRODUCTO:
              </label>
              {!editProduct && (
                <span className="text-[11px] text-emerald-600 font-semibold">
                  (Auto-generado secuencial)
                </span>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Hash className="w-4 h-4" />
              </div>
              <input
                id="userform2-codigo"
                type="text"
                value={txtCodigoNuevo}
                disabled={!!editProduct}
                onChange={(e) => setTxtCodigoNuevo(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2.5 font-mono text-sm font-bold bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
              />
            </div>
          </div>

          {/* TXTDESCRIPCION */}
          <div>
            <label
              htmlFor="userform2-descripcion"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
            >
              DESCRIPCIÓN DEL PRODUCTO:
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <FileText className="w-4 h-4" />
              </div>
              <input
                id="userform2-descripcion"
                type="text"
                placeholder="Ej. ARROZ KILO X 45, JABON ENCUERO ORO..."
                value={txtDescripcion}
                onChange={(e) => setTxtDescripcion(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2.5 text-sm font-bold uppercase bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* 2 Cols: Stock & Unit Price */}
          <div className="grid grid-cols-2 gap-4">
            {/* TXTSTOCK */}
            <div>
              <label
                htmlFor="userform2-stock"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
              >
                STOCK INICIAL:
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Package className="w-4 h-4" />
                </div>
                <input
                  id="userform2-stock"
                  type="number"
                  min="0"
                  step="1"
                  value={txtStock}
                  onChange={(e) => setTxtStock(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 font-mono text-sm font-bold bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* TXTVALORUNITARIO */}
            <div>
              <label
                htmlFor="userform2-precio"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
              >
                VALOR UNITARIO ($ COP):
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <DollarSign className="w-4 h-4" />
                </div>
                <input
                  id="userform2-precio"
                  type="number"
                  min="0"
                  step="any"
                  value={txtValorUnitario}
                  onChange={(e) => setTxtValorUnitario(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 font-mono text-sm font-bold bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* CATEGORIA */}
          <div>
            <label
              htmlFor="userform2-categoria"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
            >
              CATEGORÍA:
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Layers className="w-4 h-4" />
              </div>
              <select
                id="userform2-categoria"
                value={txtCategoria}
                onChange={(e) => setTxtCategoria(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 grid grid-cols-2 gap-3">
            <button
              type="submit"
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md hover:shadow-emerald-500/20 transition active:scale-95 cursor-pointer"
            >
              Guardar Producto
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
