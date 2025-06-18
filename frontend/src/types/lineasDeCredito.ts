export interface LineaCreditoBase {
  nombre: string;
  fecha_inicio: string; // Dates will be string in YYYY-MM-DD format for API
  monto_total_linea: number;
  monto_disponible: number;
  fecha_fin: string;
  interest_rate?: number | null; // Optional, matches Pydantic
  es_revolvente?: boolean | null; // Deprecated: Is the credit line revolving?
  tipo_linea?: string | null; // New: Type of credit line (LINEA_CREDITO, TERMINO_FIJO, LEASING_OPERATIVO, etc.)
  cargos_apertura?: number | null; // Optional: Origination charges
  
  // Campos específicos para diferentes tipos de línea
  plazo_meses?: number | null;
  periodicidad_pago?: string | null; // MENSUAL, TRIMESTRAL, SEMESTRAL, ANUAL
  valor_activo?: number | null; // Para leasing
  valor_residual?: number | null; // Para leasing
  porcentaje_financiamiento?: number | null; // Para factoring
  garantia_tipo?: string | null;
  garantia_descripcion?: string | null;
  limite_sobregiro?: number | null;
  moneda?: string | null;
  
  // Campos para carta de crédito
  beneficiario?: string | null;
  banco_emisor?: string | null;
  documento_respaldo?: string | null;
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
  es_revolvente?: boolean | null; // Deprecated
  tipo_linea?: string | null; // New field for different credit line types
  cargos_apertura?: number | null;
  
  // Campos específicos para diferentes tipos de línea
  plazo_meses?: number | null;
  periodicidad_pago?: string | null;
  valor_activo?: number | null;
  valor_residual?: number | null;
  porcentaje_financiamiento?: number | null;
  garantia_tipo?: string | null;
  garantia_descripcion?: string | null;
  limite_sobregiro?: number | null;
  moneda?: string | null;
  beneficiario?: string | null;
  banco_emisor?: string | null;
  documento_respaldo?: string | null;
}

// Credit Line Types
export const TIPOS_LINEA_CREDITO = {
  LINEA_CREDITO: 'Línea de Crédito',
  TERMINO_FIJO: 'Término Fijo',
  LEASING_OPERATIVO: 'Leasing Operativo',
  LEASING_FINANCIERO: 'Leasing Financiero',
  FACTORING: 'Factoring',
  PRESTAMO_HIPOTECARIO: 'Préstamo Hipotecario',
  PRESTAMO_VEHICULAR: 'Préstamo Vehicular',
  SOBREGIRO: 'Sobregiro Bancario',
  CARTA_CREDITO: 'Carta de Crédito'
} as const;

export type TipoLineaCredito = keyof typeof TIPOS_LINEA_CREDITO;

// Periodicidad de pago
export const PERIODICIDAD_PAGO = {
  MENSUAL: 'Mensual',
  BIMENSUAL: 'Bimensual',
  TRIMESTRAL: 'Trimestral',
  SEMESTRAL: 'Semestral',
  ANUAL: 'Anual'
} as const;

export type PeriodicidadPago = keyof typeof PERIODICIDAD_PAGO;

// Tipos de garantía
export const TIPOS_GARANTIA = {
  HIPOTECARIA: 'Hipotecaria',
  VEHICULAR: 'Vehicular',
  FIDUCIARIA: 'Fiduciaria',
  PRENDARIA: 'Prendaria',
  PERSONAL: 'Personal',
  CORPORATIVA: 'Corporativa',
  NINGUNA: 'Sin Garantía'
} as const;

export type TipoGarantia = keyof typeof TIPOS_GARANTIA;

// Monedas
export const MONEDAS = {
  USD: 'Dólares (USD)',
  PAB: 'Balboas (PAB)',
  EUR: 'Euros (EUR)'
} as const;

export type Moneda = keyof typeof MONEDAS;

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