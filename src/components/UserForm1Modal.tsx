import React, { useState, useEffect, useRef } from 'react';
import { useInventory } from '../context/InventoryContext';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { Product } from '../types/inventory';
import {
  Sparkles,
  Search,
  Plus,
  Minus,
  CheckCircle2,
  AlertTriangle,
  X,
  Package,
} from 'lucide-react';

interface UserForm1ModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProduct?: Product | null;
}

export const UserForm1Modal: React.FC<UserForm1ModalProps> = ({
  isOpen,
  onClose,
  initialProduct,
}) => {
  const { products, operateStock } = useInventory();

  const [codigoInput, setCodigoInput] = useState('');
  const [cantidadInput, setCantidadInput] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    msg: string;
  } | null>(null);

  const codigoInputRef = useRef<HTMLInputElement>(null);
  const cantidadInputRef = useRef<HTMLInputElement>(null);

  // When modal opens
  useEffect(() => {
    if (isOpen) {
      setFeedback(null);
      if (initialProduct) {
        setSelectedProduct(initialProduct);
        setCodigoInput(initialProduct.codigo);
        setTimeout(() => cantidadInputRef.current?.focus(), 50);
      } else {
        setSelectedProduct(null);
        setCodigoInput('');
        setCantidadInput('');
        setTimeout(() => codigoInputRef.current?.focus(), 50);
      }
    }
  }, [isOpen, initialProduct]);

  // Synchronize product when code matches
  const handleCodigoChange = (val: string) => {
    setCodigoInput(val);
    setFeedback(null);
    const clean = val.trim().toLowerCase();
    if (!clean) {
      setSelectedProduct(null);
      return;
    }
    const found = products.find((p) => p.codigo.toLowerCase() === clean);
    if (found) {
      setSelectedProduct(found);
    } else {
      setSelectedProduct(null);
    }
  };

  // Execute operation
  const handleExecute = (tipo: 'INGRESO' | 'DESCUENTO') => {
    const cleanCode = codigoInput.trim();
    if (!cleanCode) {
      setFeedback({
        type: 'error',
        msg: 'Falta código o cantidad en Hoja1. Ingrese el código del producto.',
      });
      codigoInputRef.current?.focus();
      return;
    }

    const prod = products.find(
      (p) => p.codigo.toLowerCase() === cleanCode.toLowerCase()
    );

    if (!prod) {
      setFeedback({
        type: 'error',
        msg: 'El código no existe en BASE.',
      });
      return;
    }

    const cant = parseFloat(cantidadInput);
    if (isNaN(cant) || cant <= 0) {
      setFeedback({
        type: 'error',
        msg: 'Falta código o cantidad en Hoja1. Ingrese una cantidad válida mayor a 0.',
      });
      cantidadInputRef.current?.focus();
      return;
    }

    const result = operateStock(prod.codigo, cant, tipo);

    if (result.success) {
      setFeedback({
        type: 'success',
        msg: result.message,
      });
      setCantidadInput('');
      if (result.product) {
        setSelectedProduct(result.product);
      }
    } else {
      setFeedback({
        type: 'error',
        msg: result.message,
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
        {/* Title Bar */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <div>
              <h3 className="font-black text-sm uppercase tracking-wider">
                Ajuste Rápido de Stock
              </h3>
              <p className="text-[10px] text-emerald-200">
                Supertienda Los Paisa • Consulta y Actualización de Existencias
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
        <div className="p-5 space-y-4">
          {/* Feedback Banner */}
          {feedback && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                  : 'bg-rose-50 text-rose-900 border border-rose-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              )}
              <span>{feedback.msg}</span>
            </div>
          )}

          {/* Campo CODIGO */}
          <div>
            <label
              htmlFor="userform1-codigo"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
            >
              CÓDIGO DEL PRODUCTO:
            </label>
            <div className="relative">
              <input
                id="userform1-codigo"
                ref={codigoInputRef}
                type="text"
                placeholder="Ej. 1001, 1002..."
                value={codigoInput}
                onChange={(e) => handleCodigoChange(e.target.value)}
                className="w-full px-3 py-2.5 font-mono text-sm font-bold bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Product Live Info Card */}
          {selectedProduct ? (
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-slate-900 text-sm">
                  {selectedProduct.descripcion}
                </span>
                <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 bg-emerald-200 text-emerald-900 rounded">
                  {selectedProduct.codigo}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-emerald-200/60">
                <div>
                  <span className="text-slate-500 block text-[10px]">STOCK ACTUAL:</span>
                  <span className="font-mono font-bold text-slate-800 text-sm">
                    {formatNumber(selectedProduct.stock)} unidades
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">VALOR UNITARIO:</span>
                  <span className="font-mono font-bold text-emerald-800 text-sm">
                    {formatCurrency(selectedProduct.valorUnitario)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            codigoInput.trim() !== '' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>
                  No existe ningún producto con el código &quot;{codigoInput}&quot; en BASE.
                </span>
              </div>
            )
          )}

          {/* Campo CANTIDAD */}
          <div>
            <label
              htmlFor="userform1-cantidad"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
            >
              CANTIDAD A INGRESAR O DESCONTAR:
            </label>
            <input
              id="userform1-cantidad"
              ref={cantidadInputRef}
              type="number"
              min="1"
              placeholder="Ej. 10"
              value={cantidadInput}
              onChange={(e) => setCantidadInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleExecute('INGRESO');
                }
              }}
              className="w-full px-3 py-2.5 font-mono text-base font-black bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleExecute('INGRESO')}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black shadow-md transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Sumar Stock (+)</span>
              </button>

              <button
                type="button"
                onClick={() => handleExecute('DESCUENTO')}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-black shadow-md transition active:scale-95 cursor-pointer"
              >
                <Minus className="w-4 h-4" />
                <span>Descontar Stock (-)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
            >
              Cerrar Formulario
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
