/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { Header } from './components/Header';
import { Hoja1Consulta } from './components/Hoja1Consulta';
import { HojaBaseTabla1 } from './components/HojaBaseTabla1';
import { HojaBalance } from './components/HojaBalance';
import { InformesPDF } from './components/InformesPDF';
import { UserForm1Modal } from './components/UserForm1Modal';
import { UserForm2Modal } from './components/UserForm2Modal';
import { CargaMasivaModal } from './components/CargaMasivaModal';
import { Product } from './types/inventory';
import { Sparkles, Plus, Keyboard, HelpCircle, Upload } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { activeTab, setActiveTab, storeInfo } = useInventory();

  // Modals state
  const [isUserForm1Open, setIsUserForm1Open] = useState(false);
  const [isUserForm2Open, setIsUserForm2Open] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);

  const handleEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setIsUserForm2Open(true);
  };

  const handleCloseUserForm2 = () => {
    setIsUserForm2Open(false);
    setEditingProduct(null);
  };

  // Keyboard shortcut listener for power supermarket operators
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + 1: UserForm1 (Stock)
      if (e.altKey && e.key === '1') {
        e.preventDefault();
        setIsUserForm1Open((prev) => !prev);
      }
      // Alt + 2: UserForm2 (Nuevo Código)
      if (e.altKey && e.key === '2') {
        e.preventDefault();
        setEditingProduct(null);
        setIsUserForm2Open((prev) => !prev);
      }
      // Alt + M: Carga Masiva
      if (e.altKey && (e.key === 'm' || e.key === 'M')) {
        e.preventDefault();
        setIsBulkImportOpen((prev) => !prev);
      }
      // Escape closes modals
      if (e.key === 'Escape') {
        setIsUserForm1Open(false);
        setIsUserForm2Open(false);
        setIsBulkImportOpen(false);
        setShowKeyboardShortcuts(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Header with Store Branding and Navigation */}
      <Header
        onOpenUserForm1={() => setIsUserForm1Open(true)}
        onOpenUserForm2={() => {
          setEditingProduct(null);
          setIsUserForm2Open(true);
        }}
        onOpenBulkImport={() => setIsBulkImportOpen(true)}
      />

      {/* Main Content View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'hoja1' && (
          <Hoja1Consulta
            onOpenUserForm2={() => {
              setEditingProduct(null);
              setIsUserForm2Open(true);
            }}
          />
        )}

        {activeTab === 'base' && (
          <HojaBaseTabla1
            onOpenUserForm2={() => {
              setEditingProduct(null);
              setIsUserForm2Open(true);
            }}
            onEditProduct={handleEditProduct}
            onOpenBulkImport={() => setIsBulkImportOpen(true)}
          />
        )}

        {activeTab === 'balance' && <HojaBalance />}

        {activeTab === 'informes' && <InformesPDF />}
      </main>

      {/* Floating Action Buttons for quick desktop operation */}
      <aside aria-label="Acciones rápidas de inventario" className="fixed bottom-5 right-5 flex flex-col items-end gap-2.5 z-40 no-print">
        <button
          onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
          className="p-2.5 bg-slate-900 text-white rounded-full shadow-lg hover:bg-slate-800 transition cursor-pointer"
          title="Ver atajos de teclado"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        <button
          onClick={() => setIsBulkImportOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-black text-xs rounded-full shadow-xl hover:shadow-teal-600/30 transition active:scale-95 cursor-pointer border border-teal-400"
          title="Ingresar productos masivamente por Rejilla, Excel o CSV"
        >
          <Upload className="w-4 h-4" />
          <span>Carga Masiva</span>
        </button>

        <button
          onClick={() => setIsUserForm1Open(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-full shadow-xl hover:shadow-amber-500/30 transition active:scale-95 cursor-pointer border border-amber-300"
          title="Ajuste rápido de existencias de un producto"
        >
          <Sparkles className="w-4 h-4" />
          <span>Ajustar Stock</span>
        </button>

        <button
          onClick={() => {
            setEditingProduct(null);
            setIsUserForm2Open(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-full shadow-xl hover:shadow-emerald-600/30 transition active:scale-95 cursor-pointer border border-emerald-400"
          title="Registrar un nuevo producto en el catálogo"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nuevo Producto</span>
        </button>
      </aside>

      {/* Keyboard Shortcuts Modal */}
      {showKeyboardShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-emerald-600" />
                Atajos de Teclado Rápido
              </h4>
              <button
                onClick={() => setShowKeyboardShortcuts(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>
            <div className="py-3 space-y-2 text-xs">
              <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                <span className="text-slate-600">Carga Masiva (Lotes)</span>
                <kbd className="px-2 py-1 bg-white border border-slate-200 rounded font-mono font-bold text-slate-800">
                  Alt + M
                </kbd>
              </div>
              <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                <span className="text-slate-600">Ajuste Rápido de Stock</span>
                <kbd className="px-2 py-1 bg-white border border-slate-200 rounded font-mono font-bold text-slate-800">
                  Alt + 1
                </kbd>
              </div>
              <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                <span className="text-slate-600">Registrar Nuevo Producto</span>
                <kbd className="px-2 py-1 bg-white border border-slate-200 rounded font-mono font-bold text-slate-800">
                  Alt + 2
                </kbd>
              </div>
              <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                <span className="text-slate-600">Confirmar Suma en Hoja1</span>
                <kbd className="px-2 py-1 bg-white border border-slate-200 rounded font-mono font-bold text-slate-800">
                  Enter
                </kbd>
              </div>
              <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                <span className="text-slate-600">Cerrar Formularios / Ventanas</span>
                <kbd className="px-2 py-1 bg-white border border-slate-200 rounded font-mono font-bold text-slate-800">
                  Esc
                </kbd>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UserForm1, UserForm2 & CargaMasiva Modals */}
      <UserForm1Modal
        isOpen={isUserForm1Open}
        onClose={() => setIsUserForm1Open(false)}
      />

      <UserForm2Modal
        isOpen={isUserForm2Open}
        onClose={handleCloseUserForm2}
        editProduct={editingProduct}
      />

      <CargaMasivaModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
      />

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-5 border-t border-slate-800 mt-auto no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-slate-300">
              {storeInfo.nombre}
            </span>
            <span>•</span>
            <span>Sistema de Inventario y Balance Contable</span>
          </div>
          <div className="text-slate-500 text-center sm:text-right">
            Hojas integradas: BASE (Tabla1) • Hoja1 (Consultas) • BALANCE Contable • Macros PDF
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <InventoryProvider>
      <MainLayout />
    </InventoryProvider>
  );
}
