// Types for Scenario Projects, based on backend schemas

// From backend/app/schemas.py

export interface ScenarioCostItem {
  id: number;
  scenario_project_id: number;
  categoria: string;
  subcategoria: string;
  partida_costo: string;
  base_costo: string;
  monto_proyectado?: number | null;
  monto_real?: number | null;
  unit_cost?: number | null;
  quantity?: number | null;
  percentage_of_base?: number | null;
  base_reference?: string | null;
  start_month?: number | null;
  duration_months?: number | null;
  notes?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LineaCreditoProyectoUso {
  id: number;
  linea_credito_proyecto_id: number;
  fecha_uso: string; // YYYY-MM-DD
  monto_usado: number;
  tipo_transaccion: string; // 'DRAWDOWN' | 'PAYMENT' | 'INTEREST'
  descripcion?: string | null;
  cargo_transaccion?: number | null;
  scenario_cost_item_id?: number | null;
  es_simulacion: boolean;
  created_at: string;
  updated_at: string;
}

export interface LineaCreditoProyecto {
  id: number;
  scenario_project_id: number;
  nombre: string;
  fecha_inicio: string; // YYYY-MM-DD
  monto_total_linea: number;
  monto_disponible: number;
  fecha_fin: string; // YYYY-MM-DD
  interest_rate?: number | null;
  tipo_linea?: string | null;
  cargos_apertura?: number | null;
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
  estado: string;
  es_simulacion: boolean;
  created_at: string;
  updated_at: string;
  usos: LineaCreditoProyectoUso[];
} 