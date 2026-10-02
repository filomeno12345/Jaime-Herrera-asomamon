import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Product, BalanceItem, StockMovement, PeriodInfo, MovementType, BulkImportOptions, BulkImportResult, StoreInfo } from '../types/inventory';
import { INITIAL_PRODUCTS, INITIAL_BALANCE_ITEMS, INITIAL_PERIOD } from '../data/initialData';
import { parseColombianNumber } from '../utils/formatters';

interface InventoryContextType {
  products: Product[];
  balanceItems: BalanceItem[];
  movements: StockMovement[];
  period: PeriodInfo;
  storeInfo: StoreInfo;
  setStoreName: (name: string) => void;
  updateStoreInfo: (info: Partial<StoreInfo>) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setPeriod: React.Dispatch<React.SetStateAction<PeriodInfo>>;
  
  // Computed values
  totalInventario: number;
  totalProductos: number;
  totalDebe: number;
  totalHaber: number;
  utilidad: number;
  stockBajoCount: number;
  agotadosCount: number;

  // Stock operations (UserForm1)
  operateStock: (
    codigo: string,
    cantidad: number,
    tipo: MovementType,
    nota?: string
  ) => { success: boolean; message: string; product?: Product };
  
  // Product management (UserForm2 & Bulk)
  addProduct: (product: Omit<Product, 'total'>) => { success: boolean; message: string };
  bulkAddProducts: (
    newItems: Array<Omit<Product, 'total'>>,
    options?: BulkImportOptions
  ) => BulkImportResult;
  updateProduct: (codigo: string, product: Partial<Product>) => { success: boolean; message: string };
  deleteProduct: (codigo: string) => { success: boolean; message: string };
  clearAllProducts: () => void;
  getNextAvailableCode: () => string;
  getProductByCode: (codigo: string) => Product | undefined;
  searchProducts: (query: string) => Product[];

  // Balance management
  updateBalanceItem: (id: string, updates: Partial<BalanceItem>) => void;
  addBalanceItem: (item: Omit<BalanceItem, 'id'>) => void;
  deleteBalanceItem: (id: string) => void;
  syncInventoryWithBalance: () => void;
  
  // Data management
  resetToDefaults: () => void;
  exportDataJSON: () => void;
  importDataJSON: (jsonString: string) => boolean;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PRODUCTS: 'lucho_inventario_productos_v2',
  BALANCE: 'lucho_inventario_balance_v2',
  MOVEMENTS: 'lucho_inventario_movimientos_v2',
  PERIOD: 'lucho_inventario_periodo_v2',
  STORE: 'lucho_inventario_store_v2',
};

const INITIAL_STORE_INFO: StoreInfo = {
  nombre: 'SUPERTIENDA LOS PAISA',
  subtitulo: 'SISTEMA DE CONTROL DE INVENTARIO Y BALANCE CONTABLE',
  nit: 'NIT: 900.842.119-4',
  ciudad: 'Medellín, Colombia',
};

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Store info (editable store name)
  const [storeInfo, setStoreInfo] = useState<StoreInfo>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STORE);
      if (saved) return { ...INITIAL_STORE_INFO, ...JSON.parse(saved) };
    } catch (e) {
      console.error('Error loading store info from localStorage', e);
    }
    return INITIAL_STORE_INFO;
  });

  const setStoreName = useCallback((name: string) => {
    const clean = name.trim();
    if (!clean) return;
    setStoreInfo((prev) => {
      const updated = { ...prev, nombre: clean };
      try {
        localStorage.setItem(STORAGE_KEYS.STORE, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  }, []);

  const updateStoreInfo = useCallback((info: Partial<StoreInfo>) => {
    setStoreInfo((prev) => {
      const updated = { ...prev, ...info };
      try {
        localStorage.setItem(STORAGE_KEYS.STORE, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  }, []);

  // Load products
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((p: Product) => ({
          ...p,
          total: p.stock * p.valorUnitario,
        }));
      }
    } catch (e) {
      console.error('Error loading products from localStorage', e);
    }
    return INITIAL_PRODUCTS;
  });

  // Load balance items
  const [balanceItems, setBalanceItems] = useState<BalanceItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BALANCE);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading balance from localStorage', e);
    }
    return INITIAL_BALANCE_ITEMS;
  });

  // Load movements history
  const [movements, setMovements] = useState<StockMovement[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading movements from localStorage', e);
    }
    return [];
  });

  // Period
  const [period, setPeriod] = useState<PeriodInfo>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PERIOD);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading period from localStorage', e);
    }
    return INITIAL_PERIOD;
  });

  const [activeTab, setActiveTab] = useState<string>('hoja1');

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch (e) {
      console.error('Failed to save products', e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BALANCE, JSON.stringify(balanceItems));
    } catch (e) {
      console.error('Failed to save balance items', e);
    }
  }, [balanceItems]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(movements));
    } catch (e) {
      console.error('Failed to save movements', e);
    }
  }, [movements]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PERIOD, JSON.stringify(period));
    } catch (e) {
      console.error('Failed to save period', e);
    }
  }, [period]);

  // Calculations
  const totalInventario = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.stock * p.valorUnitario), 0);
  }, [products]);

  const totalProductos = useMemo(() => products.length, [products]);

  const stockBajoCount = useMemo(() => {
    return products.filter((p) => p.stock > 0 && p.stock <= (p.stockMinimo ?? 5)).length;
  }, [products]);

  const agotadosCount = useMemo(() => {
    return products.filter((p) => p.stock === 0).length;
  }, [products]);

  // Keep auto-inventory balance row updated with totalInventario
  useEffect(() => {
    setBalanceItems((prev) => {
      let changed = false;
      const updated = prev.map((item) => {
        if (item.isAutoInventory || item.descripcion.startsWith('INVENTARIO MES DE')) {
          const expectedDesc = `INVENTARIO MES DE ${period.mes}`;
          if (item.debe !== totalInventario || item.descripcion !== expectedDesc) {
            changed = true;
            return {
              ...item,
              descripcion: expectedDesc,
              debe: totalInventario,
            };
          }
        }
        return item;
      });
      return changed ? updated : prev;
    });
  }, [totalInventario, period.mes]);

  const totalDebe = useMemo(() => {
    return balanceItems.reduce((acc, item) => acc + (Number(item.debe) || 0), 0);
  }, [balanceItems]);

  const totalHaber = useMemo(() => {
    return balanceItems.reduce((acc, item) => acc + (Number(item.haber) || 0), 0);
  }, [balanceItems]);

  const utilidad = useMemo(() => {
    return totalDebe - totalHaber;
  }, [totalDebe, totalHaber]);

  // UserForm1 stock operation
  const operateStock = useCallback((
    codigo: string,
    cantidad: number,
    tipo: MovementType,
    _nota?: string
  ) => {
    const cleanCode = codigo.trim();
    if (!cleanCode) {
      return { success: false, message: 'Falta código o cantidad en Hoja1.' };
    }

    if (isNaN(cantidad) || cantidad <= 0) {
      return { success: false, message: 'La cantidad debe ser un número positivo mayor a 0.' };
    }

    const productIndex = products.findIndex(
      (p) => p.codigo.toLowerCase() === cleanCode.toLowerCase()
    );

    if (productIndex === -1) {
      return { success: false, message: 'El código no existe en BASE.' };
    }

    const currentProd = products[productIndex];
    let newStock = currentProd.stock;

    if (tipo === 'INGRESO') {
      newStock = currentProd.stock + cantidad;
    } else if (tipo === 'DESCUENTO') {
      if (currentProd.stock < cantidad) {
        return {
          success: false,
          message: `Stock insuficiente. Stock actual: ${currentProd.stock} unidades.`,
        };
      }
      newStock = currentProd.stock - cantidad;
    } else if (tipo === 'AJUSTE') {
      newStock = cantidad;
    }

    const updatedProduct: Product = {
      ...currentProd,
      stock: newStock,
      total: newStock * currentProd.valorUnitario,
      updatedAt: new Date().toISOString(),
    };

    setProducts((prev) => {
      const copy = [...prev];
      copy[productIndex] = updatedProduct;
      return copy;
    });

    // Record movement
    const movement: StockMovement = {
      id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      codigo: currentProd.codigo,
      descripcion: currentProd.descripcion,
      tipo,
      cantidad,
      stockAnterior: currentProd.stock,
      stockNuevo: newStock,
      valorUnitario: currentProd.valorUnitario,
      totalOperacion: cantidad * currentProd.valorUnitario,
      fecha: new Date().toISOString(),
    };

    setMovements((prev) => [movement, ...prev].slice(0, 100));

    const actionText =
      tipo === 'INGRESO'
        ? `Sumadas ${cantidad} unidades`
        : tipo === 'DESCUENTO'
        ? `Descontadas ${cantidad} unidades`
        : `Ajustado stock a ${cantidad} unidades`;

    return {
      success: true,
      message: `${actionText} para "${currentProd.descripcion}". Nuevo stock: ${newStock}`,
      product: updatedProduct,
    };
  }, [products]);

  // UserForm2: Add Product
  const addProduct = useCallback((productData: Omit<Product, 'total'>) => {
    const cleanCode = productData.codigo.trim();
    if (!cleanCode) {
      return { success: false, message: 'El código del producto es obligatorio.' };
    }
    if (!productData.descripcion.trim()) {
      return { success: false, message: 'La descripción del producto es obligatoria.' };
    }

    const exists = products.some(
      (p) => p.codigo.toLowerCase() === cleanCode.toLowerCase()
    );
    if (exists) {
      return { success: false, message: `El código "${cleanCode}" ya existe en BASE.` };
    }

    const newProd: Product = {
      ...productData,
      codigo: cleanCode,
      stock: Number(productData.stock) || 0,
      valorUnitario: Number(productData.valorUnitario) || 0,
      total: (Number(productData.stock) || 0) * (Number(productData.valorUnitario) || 0),
      updatedAt: new Date().toISOString(),
    };

    setProducts((prev) => [...prev, newProd]);
    return { success: true, message: `Producto "${newProd.descripcion}" registrado con éxito en BASE.` };
  }, [products]);

  // Bulk Add or Update Products
  const bulkAddProducts = useCallback(
    (
      newItems: Array<Omit<Product, 'total'>>,
      options: BulkImportOptions = { onDuplicate: 'update' }
    ): BulkImportResult => {
      const result: BulkImportResult = {
        added: 0,
        updated: 0,
        skipped: 0,
        errors: [],
      };

      if (!newItems || newItems.length === 0) {
        return result;
      }

      setProducts((prev) => {
        const copy = [...prev];

        // Map existing codes to index
        const existingCodeMap = new Map<string, number>();
        copy.forEach((p, idx) => {
          existingCodeMap.set(p.codigo.toLowerCase().trim(), idx);
        });

        // Find max numeric code
        let maxNumeric = copy
          .map((p) => parseInt(p.codigo.replace(/\D/g, ''), 10))
          .filter((n) => !isNaN(n))
          .reduce((max, curr) => Math.max(max, curr), 1000);

        newItems.forEach((item, index) => {
          let code = (item.codigo || '').trim();
          const desc = (item.descripcion || '').trim().toUpperCase();

          if (!desc) {
            result.errors.push(`Fila ${index + 1}: Descripción requerida.`);
            result.skipped++;
            return;
          }

          const stock = Math.max(0, parseColombianNumber(item.stock));
          const valorUnitario = Math.max(0, parseColombianNumber(item.valorUnitario));
          const totalOperacion = stock * valorUnitario;
          const categoria = (item.categoria || options.defaultCategory || 'Abarrotes y Granos').trim();

          if (!code) {
            maxNumeric++;
            code = String(maxNumeric);
          }

          const existingIdx = existingCodeMap.get(code.toLowerCase());

          if (existingIdx !== undefined) {
            // Duplicate code handling
            if (options.onDuplicate === 'skip') {
              result.skipped++;
            } else if (options.onDuplicate === 'generate_new_code') {
              maxNumeric++;
              const newGeneratedCode = String(maxNumeric);
              const newProd: Product = {
                codigo: newGeneratedCode,
                descripcion: desc,
                stock,
                valorUnitario,
                total: totalOperacion,
                categoria,
                stockMinimo: 5,
                updatedAt: new Date().toISOString(),
              };
              copy.push(newProd);
              existingCodeMap.set(newGeneratedCode.toLowerCase(), copy.length - 1);
              result.added++;
            } else {
              // 'update': sum stock, update price, recompute total (stock * valorUnitario)
              const current = copy[existingIdx];
              const updatedStock = current.stock + stock;
              const updatedPrice = valorUnitario > 0 ? valorUnitario : current.valorUnitario;
              const updatedTotal = updatedStock * updatedPrice;
              copy[existingIdx] = {
                ...current,
                descripcion: desc || current.descripcion,
                stock: updatedStock,
                valorUnitario: updatedPrice,
                total: updatedTotal,
                categoria: categoria || current.categoria,
                updatedAt: new Date().toISOString(),
              };
              result.updated++;
            }
          } else {
            // New product entry
            const newProd: Product = {
              codigo: code,
              descripcion: desc,
              stock,
              valorUnitario,
              total: totalOperacion,
              categoria,
              stockMinimo: 5,
              updatedAt: new Date().toISOString(),
            };
            copy.push(newProd);
            existingCodeMap.set(code.toLowerCase(), copy.length - 1);
            result.added++;
          }
        });

        return copy;
      });

      return result;
    },
    []
  );

  // Update existing product
  const updateProduct = useCallback((codigo: string, updates: Partial<Product>) => {
    const productIndex = products.findIndex((p) => p.codigo === codigo);
    if (productIndex === -1) {
      return { success: false, message: 'Producto no encontrado.' };
    }

    setProducts((prev) => {
      const copy = [...prev];
      const current = copy[productIndex];
      const newStock = updates.stock !== undefined ? Number(updates.stock) : current.stock;
      const newPrice = updates.valorUnitario !== undefined ? Number(updates.valorUnitario) : current.valorUnitario;
      copy[productIndex] = {
        ...current,
        ...updates,
        stock: newStock,
        valorUnitario: newPrice,
        total: newStock * newPrice,
        updatedAt: new Date().toISOString(),
      };
      return copy;
    });

    return { success: true, message: 'Producto actualizado con éxito.' };
  }, [products]);

  // Delete product
  const deleteProduct = useCallback((codigo: string) => {
    const exists = products.some((p) => p.codigo === codigo);
    if (!exists) {
      return { success: false, message: 'Producto no encontrado.' };
    }

    setProducts((prev) => prev.filter((p) => p.codigo !== codigo));
    return { success: true, message: 'Producto eliminado de la base de datos.' };
  }, [products]);

  // Clear ALL products and their data (with confirmation in UI)
  const clearAllProducts = useCallback(() => {
    setProducts([]);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([]));
    setMovements([]);
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify([]));

    // Update auto-inventory balance row to 0
    setBalanceItems((prev) =>
      prev.map((item) => {
        if (item.isAutoInventory || item.descripcion.startsWith('INVENTARIO MES DE')) {
          return {
            ...item,
            descripcion: `INVENTARIO MES DE ${period.mes}`,
            debe: 0,
          };
        }
        return item;
      })
    );
  }, [period.mes]);

  // Helper to generate next available code (e.g. TXTCODIGONUEVO)
  const getNextAvailableCode = useCallback(() => {
    const numericCodes = products
      .map((p) => parseInt(p.codigo.replace(/\D/g, ''), 10))
      .filter((n) => !isNaN(n));

    if (numericCodes.length === 0) return '1001';
    const maxCode = Math.max(...numericCodes);
    return String(maxCode + 1);
  }, [products]);

  // Query helpers
  const getProductByCode = useCallback((codigo: string) => {
    const clean = codigo.trim().toLowerCase();
    return products.find((p) => p.codigo.toLowerCase() === clean);
  }, [products]);

  const searchProducts = useCallback((query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products.filter(
      (p) =>
        p.codigo.toLowerCase().includes(q) ||
        p.descripcion.toLowerCase().includes(q) ||
        (p.categoria && p.categoria.toLowerCase().includes(q))
    );
  }, [products]);

  // Balance actions
  const updateBalanceItem = useCallback((id: string, updates: Partial<BalanceItem>) => {
    setBalanceItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  }, []);

  const addBalanceItem = useCallback((item: Omit<BalanceItem, 'id'>) => {
    const newItem: BalanceItem = {
      ...item,
      id: `bal-${Date.now()}`,
    };
    setBalanceItems((prev) => [...prev, newItem]);
  }, []);

  const deleteBalanceItem = useCallback((id: string) => {
    setBalanceItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const syncInventoryWithBalance = useCallback(() => {
    setBalanceItems((prev) =>
      prev.map((item) => {
        if (item.isAutoInventory || item.descripcion.startsWith('INVENTARIO MES DE')) {
          return {
            ...item,
            descripcion: `INVENTARIO MES DE ${period.mes}`,
            debe: totalInventario,
          };
        }
        return item;
      })
    );
  }, [period.mes, totalInventario]);

  // Reset to default
  const resetToDefaults = useCallback(() => {
    setProducts(INITIAL_PRODUCTS);
    setBalanceItems(INITIAL_BALANCE_ITEMS);
    setMovements([]);
    setPeriod(INITIAL_PERIOD);
    setStoreInfo(INITIAL_STORE_INFO);
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.BALANCE);
    localStorage.removeItem(STORAGE_KEYS.MOVEMENTS);
    localStorage.removeItem(STORAGE_KEYS.PERIOD);
    localStorage.removeItem(STORAGE_KEYS.STORE);
  }, []);

  // Export JSON
  const exportDataJSON = useCallback(() => {
    const exportData = {
      store: storeInfo.nombre,
      storeInfo,
      system: 'INVENTARIO LUCHO2',
      exportDate: new Date().toISOString(),
      period,
      products,
      balanceItems,
      movements,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `INVENTARIO_${storeInfo.nombre.replace(/\s+/g, '_')}_${period.mes}_${period.ano}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [period, products, balanceItems, movements, storeInfo]);

  // Import JSON
  const importDataJSON = useCallback((jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.storeInfo) {
        setStoreInfo(data.storeInfo);
        localStorage.setItem(STORAGE_KEYS.STORE, JSON.stringify(data.storeInfo));
      } else if (data.store) {
        const restored = { ...INITIAL_STORE_INFO, nombre: data.store };
        setStoreInfo(restored);
        localStorage.setItem(STORAGE_KEYS.STORE, JSON.stringify(restored));
      }
      if (Array.isArray(data.products)) {
        setProducts(
          data.products.map((p: Product) => ({
            ...p,
            total: (Number(p.stock) || 0) * (Number(p.valorUnitario) || 0),
          }))
        );
      }
      if (Array.isArray(data.balanceItems)) {
        setBalanceItems(data.balanceItems);
      }
      if (data.period) {
        setPeriod(data.period);
      }
      if (Array.isArray(data.movements)) {
        setMovements(data.movements);
      }
      return true;
    } catch (e) {
      console.error('Failed to import JSON', e);
      return false;
    }
  }, []);

  const value = {
    products,
    balanceItems,
    movements,
    period,
    storeInfo,
    setStoreName,
    updateStoreInfo,
    activeTab,
    setActiveTab,
    setPeriod,
    totalInventario,
    totalProductos,
    totalDebe,
    totalHaber,
    utilidad,
    stockBajoCount,
    agotadosCount,
    operateStock,
    addProduct,
    bulkAddProducts,
    updateProduct,
    deleteProduct,
    clearAllProducts,
    getNextAvailableCode,
    getProductByCode,
    searchProducts,
    updateBalanceItem,
    addBalanceItem,
    deleteBalanceItem,
    syncInventoryWithBalance,
    resetToDefaults,
    exportDataJSON,
    importDataJSON,
  };

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
