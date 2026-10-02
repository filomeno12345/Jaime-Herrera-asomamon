export interface Product {
  codigo: string;
  descripcion: string;
  stock: number;
  valorUnitario: number;
  total: number;
  categoria?: string;
  stockMinimo?: number;
  updatedAt?: string;
}

export interface BalanceItem {
  id: string;
  descripcion: string;
  debe: number;
  haber: number;
  isAutoInventory?: boolean;
}

export type MovementType = 'INGRESO' | 'DESCUENTO' | 'AJUSTE';

export interface StockMovement {
  id: string;
  codigo: string;
  descripcion: string;
  tipo: MovementType;
  cantidad: number;
  stockAnterior: number;
  stockNuevo: number;
  valorUnitario: number;
  totalOperacion: number;
  fecha: string;
}

export interface PeriodInfo {
  mes: string;
  ano: number;
}

export type ActiveTab = 'hoja1' | 'base' | 'balance' | 'informes';

export interface BulkProductRow {
  id: string;
  codigo: string;
  descripcion: string;
  stock: string | number;
  valorUnitario: string | number;
  categoria?: string;
  isValid?: boolean;
  errors?: string[];
}

export type DuplicateAction = 'update' | 'skip' | 'generate_new_code';

export interface StoreInfo {
  nombre: string;
  subtitulo?: string;
  nit?: string;
  ciudad?: string;
}

export interface BulkImportOptions {
  onDuplicate: DuplicateAction;
  defaultCategory?: string;
}

export interface BulkImportResult {
  added: number;
  updated: number;
  skipped: number;
  errors: string[];
}
