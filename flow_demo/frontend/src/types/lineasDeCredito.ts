export interface LineaCreditoBase {
  nombre: string;
  fecha_inicio: string; // Dates will be string in YYYY-MM-DD format for API
  monto_total_linea: number;
  monto_disponible: number;
  fecha_fin: string;
  interest_rate?: number | null; // Optional, matches Pydantic
  es_revolvente?: boolean | null; // New: Is the credit line revolving?
  cargos_apertura?: number | null; // New: Origination charges
}

export interface LineaCreditoCreate extends LineaCreditoBase {}

export interface LineaCredito extends LineaCreditoBase {
  id: number;
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
}

export interface LineaCreditoUpdate {
  nombre?: string | null;
  fecha_inicio?: string | null; 
  monto_total_linea?: number | null;
  // monto_disponible is not directly updatable on the backend via this model
  fecha_fin?: string | null;
  interest_rate?: number | null;
  es_revolvente?: boolean | null;
  cargos_apertura?: number | null;
}

// New Interfaces for LineaCreditoUso
export interface LineaCreditoUsoBase {
  linea_credito_id?: number; // Optional on creation as it might be part of the path param
  fecha_uso: string; // YYYY-MM-DD
  monto_usado: number; // Positive for drawdown, negative for payment
  tipo_transaccion: 'DRAWDOWN' | 'PAYMENT' | string; // Allow string for flexibility if backend adds more types
  descripcion?: string | null;
  cargo_transaccion?: number | null; // New: Transaction fee (e.g., for drawdown)
}

export interface LineaCreditoUsoCreate extends LineaCreditoUsoBase {}

export interface LineaCreditoUso extends LineaCreditoUsoBase {
  id: number;
  linea_credito_id: number; // Should be present on fetched/returned Uso objects
  created_at: string;
  updated_at: string;
} 