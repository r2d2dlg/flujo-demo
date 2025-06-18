// frontend/src/types/payrollTypes.ts

// Base types for table data - aligning with Pydantic schemas (snake_case attributes)

export interface PlanillaAdministracion {
  nombre: string;
  horas: number;
  sal_bruto: string; // Decimal
  i_s_r?: string | null; // Optional Decimal
  otros_desc?: string | null; // Optional Decimal
}

export interface PlanillaAdministracionCreate extends Omit<PlanillaAdministracion, 'nombre'> {
  nombre: string; // Ensure nombre is here if not Omitted from base
}

export interface PlanillaAdministracionUpdate {
  horas?: number;
  sal_bruto?: string;
  i_s_r?: string | null;
  otros_desc?: string | null;
}

export interface PlanillaFijaConstruccion {
  nombre: string;
  rata_x_h: string; // Decimal
  horas_regulares: string; // Decimal
  actividad?: string | null;
  horas_ext_1_25?: string | null; // Optional Decimal
  horas_ext_1_5?: string | null; // Optional Decimal
  horas_ext_2_0?: string | null; // Optional Decimal
  i_renta?: string | null; // Optional Decimal
}

export interface PlanillaFijaConstruccionCreate extends Omit<PlanillaFijaConstruccion, 'nombre'> {
  nombre: string;
}

export interface PlanillaFijaConstruccionUpdate {
  rata_x_h?: string;
  horas_regulares?: string;
  actividad?: string | null;
  horas_ext_1_25?: string | null;
  horas_ext_1_5?: string | null;
  horas_ext_2_0?: string | null;
  i_renta?: string | null;
}

export interface PlanillaGerencial {
  nombre: string;
  salario?: string | null; // Optional Decimal
}

export interface PlanillaGerencialCreate extends Omit<PlanillaGerencial, 'nombre'> {
  nombre: string;
}

export interface PlanillaGerencialUpdate {
  salario?: string | null;
}

export interface PlanillaServicioProfesionales {
  nombre: string;
  salario_quincenal?: string | null; // Optional Decimal
  hras_xtras?: string | null; // Optional Decimal
  otros_salarios?: string | null; // Optional Decimal
  descuentos?: string | null; // Optional Decimal
  observaciones?: string | null;
}

export interface PlanillaServicioProfesionalesCreate extends Omit<PlanillaServicioProfesionales, 'nombre'> {
  nombre: string;
}

export interface PlanillaServicioProfesionalesUpdate {
  salario_quincenal?: string | null;
  hras_xtras?: string | null;
  otros_salarios?: string | null;
  descuentos?: string | null;
  observaciones?: string | null;
}

export interface PlanillaVariableConstruccion {
  nombre: string;
  rata_x_h: string; // Decimal
  horas_regulares: string; // Decimal
  actividad?: string | null;
  horas_ext_1_25?: string | null; // Optional Decimal
  horas_ext_1_5?: string | null; // Optional Decimal
  horas_ext_2_0?: string | null; // Optional Decimal
  i_renta?: string | null; // Optional Decimal
}

export interface PlanillaVariableConstruccionCreate extends Omit<PlanillaVariableConstruccion, 'nombre'> {
  nombre: string;
}

export interface PlanillaVariableConstruccionUpdate {
  rata_x_h?: string;
  horas_regulares?: string;
  actividad?: string | null;
  horas_ext_1_25?: string | null;
  horas_ext_1_5?: string | null;
  horas_ext_2_0?: string | null;
  i_renta?: string | null;
}

// Types for View data - matching the Pydantic schema Field aliases

export interface VPlanillaAdministracion {
  NOMBRE: string;
  Horas?: number | null;
  'Sal. Bruto'?: string | null;
  'S.S.'?: string | null;
  'S.E.'?: string | null;
  'I.S.R.'?: string | null;
  'Otros Desc.'?: string | null;
  Total?: string | null;
  'Sal. Neto'?: string | null;
}

export interface VPlanillaFijaConstruccion {
  NOMBRE: string;
  'RATA X H.'?: string | null;
  HORAS?: string | null;
  ACTIVIDAD?: string | null;
  'EXT. 1.25'?: string | null;
  '1.5'?: string | null; // Key as string literal
  '2.0'?: string | null; // Key as string literal
  REGULAR?: string | null;
  'P 1.25'?: string | null;
  'P 1.5'?: string | null;
  P2_0?: string | null; // Pydantic used p_2_0, alias was 'P2.0'. Axios might return 'P2.0'.
  'S.BRUTO'?: string | null;
  'S.S.'?: string | null;
  'S.E.'?: string | null;
  'I/RENTA'?: string | null;
  'TOTAL D.'?: string | null;
  'SAL. NETO'?: string | null;
}

export interface VPlanillaGerencial {
  NOMBRE: string;
  SALARIO?: string | null;
  NETO?: string | null;
  OBSERVACIONES?: string | null;
}

export interface VPlanillaServicioProfesionales {
  NOMBRE: string;
  'SALARIO QUINCENAL'?: string | null;
  'HRAS. XTRAS'?: string | null;
  'OTROS SALARIOS'?: string | null;
  DESCUENTOS?: string | null;
  NETO?: string | null;
  OBSERVACIONES?: string | null;
}

export interface VPlanillaVariableConstruccion {
  NOMBRE: string;
  'RATA X H.'?: string | null;
  HORAS?: string | null;
  ACTIVIDAD?: string | null;
  'EXT. 1.25'?: string | null;
  '1.5'?: string | null;
  '2.0'?: string | null;
  REGULAR?: string | null;
  'P 1.25'?: string | null;
  'P 1.5'?: string | null;
  P2_0?: string | null;
  'S.BRUTO'?: string | null;
  'S.S.'?: string | null;
  'S.E.'?: string | null;
  'I/RENTA'?: string | null;
  'TOTAL D.'?: string | null;
  'SAL. NETO'?: string | null;
}

export interface VPlanillaTotal {
  NOMBRE: string;
  TOTAL?: string | null;
  // Add more fields as needed based on backend response
} 