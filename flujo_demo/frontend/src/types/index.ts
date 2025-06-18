export interface User {
  id: number;
  username: string;
  email: string;
  department: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  email: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
  user_id: number;
  created_at?: string;
  updated_at?: string;
}

export interface CashFlow {
  id: number;
  amount: number;
  description: string;
  date: string;
  type: 'income' | 'expense';
  category_id: number;
  user_id: number;
  created_at?: string;
  updated_at?: string;
  category?: Pick<Category, 'id' | 'name'>;
}

// Interface for PlantillaComisionesVentas (matches backend schema)
// Moved from api.ts
export interface PlantillaComisionesVentas {
  id: number; // Primary key
  fecha_venta: string; // Date as string (YYYY-MM-DD)
  cliente?: string | null;
  producto_servicio?: string | null;
  monto_venta?: number | null;
  personal_comisiones?: Record<string, number> | null; // Dict[str, float]
  entidad?: string | null;
  etapa?: string | null;
  inmueble?: string | null;
  modelo?: string | null;
  n_proceso_entrega?: string | null;
  contrato_firmado_con?: string | null;
  nombre_del_banco?: string | null;
  identificacion?: string | null;
  ingreso?: string | null;
  fecha_empleo?: string | null; // Date as string (YYYY-MM-DD)
  tiempo_trabajando?: string | null;
  profesion?: string | null;
  fecha_ingreso_al?: string | null;
  cotitular?: string | null;
  vendedor?: string | null; // This is likely the salesperson's name
  fecha_reserva?: string | null; // Date as string (YYYY-MM-DD)
  servicio?: string | null; // Could be an alias for producto_servicio or different
  cpf?: string | null;
  importe_cpf?: number | null;
  fecha_ingreso_etapa?: string | null; // Date as string (YYYY-MM-DD)
  ultima_etapa?: string | null;
  responsable?: string | null;
  created_at?: string | null; // DateTime as string (ISO format)
}

// Re-export all payroll types
export * from './payrollTypes';
