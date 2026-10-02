import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Store, X, Check, Building2, MapPin, FileText, Sparkles, RotateCcw } from 'lucide-react';

interface EditarTiendaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditarTiendaModal: React.FC<EditarTiendaModalProps> = ({ isOpen, onClose }) => {
  const { storeInfo, updateStoreInfo } = useInventory();

  const [nombre, setNombre] = useState(storeInfo.nombre);
  const [subtitulo, setSubtitulo] = useState(storeInfo.subtitulo || '');
  const [nit, setNit] = useState(storeInfo.nit || '');
  const [ciudad, setCiudad] = useState(storeInfo.ciudad || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNombre = nombre.trim();
    if (!cleanNombre) return;

    updateStoreInfo({
      nombre: cleanNombre.toUpperCase(),
      subtitulo: subtitulo.trim(),
      nit: nit.trim(),
      ciudad: ciudad.trim(),
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 700);
  };

  const handleResetDefault = () => {
    setNombre('SUPERTIENDA LOS PAISA');
    setSubtitulo('SISTEMA DE CONTROL DE INVENTARIO Y BALANCE CONTABLE');
    setNit('NIT: 900.842.119-4');
    setCiudad('Medellín, Colombia');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md">
              <Store className="w-5 h-5 text-emerald-950" />
            </div>
            <div>
              <h3 className="font-black text-base uppercase tracking-wider">
                Editar Nombre y Datos de la Tienda
              </h3>
              <p className="text-xs text-emerald-200">
                Personalice el nombre comercial que aparece en encabezados, reportes y PDFs
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

        {/* Body Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {savedSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>¡Nombre y datos de la tienda actualizados con éxito!</span>
            </div>
          )}

          {/* Nombre Comercial de la Tienda */}
          <div>
            <label
              htmlFor="store-name-input"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
            >
              Nombre de la Tienda / Negocio: <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Store className="w-4 h-4 text-emerald-600" />
              </div>
              <input
                id="store-name-input"
                type="text"
                required
                placeholder="Ej. SUPERTIENDA LOS PAISA"
                value={nombre}
                onChange={(e) => setNombre(e.target.value.toUpperCase())}
                className="w-full pl-9 pr-3 py-2.5 font-bold uppercase text-sm sm:text-base text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Este nombre se mostrará en la barra superior, en las exportaciones y en el membrete oficial de los reportes en PDF.
            </p>
          </div>

          {/* Subtítulo o Slogan */}
          <div>
            <label
              htmlFor="store-subtitle-input"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
            >
              Subtítulo / Lema Comercial:
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Sparkles className="w-4 h-4 text-amber-500" />
              </div>
              <input
                id="store-subtitle-input"
                type="text"
                placeholder="Ej. SISTEMA DE CONTROL DE INVENTARIO Y BALANCE CONTABLE"
                value={subtitulo}
                onChange={(e) => setSubtitulo(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Grid NIT y Ciudad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="store-nit-input"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
              >
                NIT / Identificación Tributaria:
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <FileText className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  id="store-nit-input"
                  type="text"
                  placeholder="Ej. NIT: 900.842.119-4"
                  value={nit}
                  onChange={(e) => setNit(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="store-city-input"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
              >
                Ciudad / Ubicación:
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <MapPin className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  id="store-city-input"
                  type="text"
                  placeholder="Ej. Medellín, Colombia"
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Reset button */}
          <div className="pt-2 flex justify-start">
            <button
              type="button"
              onClick={handleResetDefault}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold hover:underline"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer nombre por defecto</span>
            </button>
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!nombre.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-lg hover:shadow-emerald-600/30 transition active:scale-95 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Guardar Cambios</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
