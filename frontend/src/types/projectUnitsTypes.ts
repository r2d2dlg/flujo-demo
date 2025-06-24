// Types for Project Units Management

export interface ProjectUnitBase {
  unit_number: string;
  unit_type: 'APARTAMENTO' | 'CASA' | 'LOTE' | 'OFICINA' | 'LOCAL';
  construction_area_m2?: number | null;
  land_area_m2?: number | null;
  total_area_m2?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  parking_spaces?: number | null;
  floor_level?: number | null;
  target_price_total?: number | null;
  price_per_m2_construction?: number | null;
  price_per_m2_land?: number | null;
  status?: 'AVAILABLE' | 'RESERVED' | 'SOLD' | 'DELIVERED' | 'CANCELLED';
  reserved_date?: string | null;
  sold_date?: string | null;
  delivery_date?: string | null;
  buyer_name?: string | null;
  sale_price?: number | null;
  planned_sale_month?: number | null;
  sales_priority?: number;
  description?: string | null;
  special_features?: string | null;
  notes?: string | null;
  is_active?: boolean;
}

export interface ProjectUnit extends ProjectUnitBase {
  id: number;
  scenario_project_id: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectUnitCreate extends ProjectUnitBase {
  scenario_project_id: number;
}

export interface ProjectUnitUpdate extends Partial<ProjectUnitBase> {
  unit_number?: string;
  unit_type?: 'APARTAMENTO' | 'CASA' | 'LOTE' | 'OFICINA' | 'LOCAL';
}

export interface ProjectUnitsBulkCreate {
  quantity: number;
  unit_number_prefix: string;
  start_number?: number;
  number_padding?: number;
  unit_type: 'APARTAMENTO' | 'CASA' | 'LOTE' | 'OFICINA' | 'LOCAL';
  construction_area_m2?: number | null;
  land_area_m2?: number | null;
  total_area_m2?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  parking_spaces?: number | null;
  floor_level?: number | null;
  units_per_floor?: number | null;
  target_price_total?: number | null;
  price_per_m2_construction?: number | null;
  price_per_m2_land?: number | null;
  description?: string | null;
  sales_priority?: number;
}

// Unit Sales Simulation Types
export interface UnitSalesSimulationBase {
  simulation_name: string;
  description?: string | null;
  units_sales_schedule: Record<string, number>; // {"unit_id": month_to_sell}
  total_revenue?: number | null;
  total_units_to_sell?: number | null;
  sales_period_months?: number | null;
  average_monthly_sales?: number | null;
  npv?: number | null;
  irr?: number | null;
  payback_months?: number | null;
  max_capital_exposure?: number | null;
  is_active?: boolean;
}

export interface UnitSalesSimulation extends UnitSalesSimulationBase {
  id: number;
  scenario_project_id: number;
  created_at: string;
  updated_at: string;
}

export interface UnitSalesSimulationCreate extends UnitSalesSimulationBase {
  scenario_project_id: number;
}

export interface UnitSalesSimulationUpdate extends Partial<UnitSalesSimulationBase> {
  simulation_name?: string;
  description?: string | null;
  units_sales_schedule?: Record<string, number>;
}

// Sales Scenario Configuration
export interface UnitSalesScenarioConfig {
  scenario_name: 'optimista' | 'realista' | 'conservador';
  units_schedule: Record<string, number>; // {"unit_id": month_to_sell}
  description?: string | null;
}

// Payment Distribution Configuration
export interface PaymentDistributionConfig {
  separation_payment_percentage?: number; // % del precio que va al desarrollador en separación (default: 10%)
  separation_credit_line_percentage?: number; // % que va a línea de crédito en separación (default: 90%)
  delivery_payment_percentage?: number; // % del precio que va al desarrollador en entrega (default: 10%)
  delivery_credit_line_percentage?: number; // % que va a línea de crédito en entrega (default: 90%)
  cash_payment_percentage?: number; // % que va al desarrollador si es pago en efectivo (default: 100%)
  mortgage_usage_percentage?: number; // % de unidades que usan hipoteca (default: 80%)
}

// Unit Payment Flow Details
export interface UnitSalesPaymentFlow {
  unit_id: number;
  unit_number: string;
  sale_month: number;
  sale_price: number;
  uses_mortgage: boolean;
  separation_amount: number;
  delivery_amount: number;
  developer_separation: number;
  developer_delivery: number;
  credit_line_separation: number;
  credit_line_delivery: number;
  credit_line_id?: number | null;
}

export interface UnitSalesSimulationRequest {
  optimistic_scenario: UnitSalesScenarioConfig;
  realistic_scenario: UnitSalesScenarioConfig;
  conservative_scenario: UnitSalesScenarioConfig;
  payment_distribution?: PaymentDistributionConfig | null;
}

export interface UnitSalesScenarioMetrics {
  scenario_name: string;
  total_units_sold: number;
  total_revenue: number;
  sales_period_months: number;
  average_monthly_sales: number;
  npv?: number | null;
  irr?: number | null;
  payback_months?: number | null;
  max_exposure?: number | null;
  monthly_sales_distribution: Record<string, number>; // {"month": units_sold}
  developer_cash_flow: Array<Record<string, any>>; // Flujo de caja del desarrollador
  credit_line_impact: Array<Record<string, any>>; // Impacto en líneas de crédito
}

export interface UnitSalesSimulationResponse {
  success: boolean;
  message: string;
  scenarios: UnitSalesScenarioMetrics[];
  cash_flow_comparison: Array<Record<string, any>>;
  company_impact: Record<string, any>;
  units_summary: Record<string, any>;
  payment_flows: UnitSalesPaymentFlow[]; // Detalle de flujos de pago por unidad
}

// Extended Project type with units
export interface ScenarioProjectWithUnits {
  id: number;
  name: string;
  description?: string | null;
  location?: string | null;
  status: string;
  start_date?: string | null;
  end_date?: string | null;
  total_area_m2?: number | null;
  buildable_area_m2?: number | null;
  total_units?: number | null;
  avg_unit_size_m2?: number | null;
  target_price_per_m2?: number | null;
  expected_sales_period_months?: number | null;
  discount_rate: number;
  inflation_rate: number;
  contingency_percentage: number;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  units: ProjectUnit[];
  cost_items: any[];
  total_investment?: number | null;
  total_revenue?: number | null;
  npv?: number | null;
  irr?: number | null;
}

// Unit statistics and summary types
export interface ProjectUnitsStats {
  total_units: number;
  available_units: number;
  reserved_units: number;
  sold_units: number;
  delivered_units: number;
  total_value: number;
  average_price_per_m2: number;
  units_by_type: Record<string, number>;
  units_by_floor: Record<string, number>;
}

export interface UnitSalesCalendar {
  month: number;
  year: number;
  units_to_sell: ProjectUnit[];
  total_units: number;
  total_revenue: number;
}

// Excel Upload Response Types
export interface ExcelUploadResponse {
  success: boolean;
  message: string;
  created_units: Array<{
    id: number;
    unit_number: string;
    unit_type: string;
    target_price_total?: number | null;
  }>;
  errors: string[];
  summary: {
    total_rows: number;
    created_count: number;
    error_count: number;
  };
}

// --- Project Stages Types ---

export interface ProjectStageBase {
  stage_name: string;
  stage_type: string;
  description?: string | null;
  stage_order: number;
  parent_stage_id?: number | null;
  
  planned_start_date: string; // ISO date string
  planned_end_date: string; // ISO date string
  
  status?: string; // 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED' | 'CANCELLED'
  progress_percentage?: number;
  
  allows_overlap?: boolean;
  min_overlap_days?: number;
  max_overlap_days?: number | null;
  
  dependencies?: number[] | null;
  
  estimated_cost?: number | null;
  required_personnel?: Record<string, any> | null;
  required_equipment?: Record<string, any> | null;
  milestones?: Record<string, any> | null;
  deliverables?: Record<string, any> | null;
  
  risk_level?: string; // 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  contingency_days?: number | null;
  risk_notes?: string | null;
}

export interface ProjectStageCreate extends ProjectStageBase {
  scenario_project_id: number;
}

export interface ProjectStageUpdate extends Partial<ProjectStageBase> {
  actual_start_date?: string | null;
  actual_end_date?: string | null;
  actual_duration_days?: number | null;
  actual_cost?: number | null;
}

export interface ProjectStage extends ProjectStageBase {
  id: number;
  scenario_project_id: number;
  
  planned_duration_days?: number | null;
  actual_start_date?: string | null;
  actual_end_date?: string | null;
  actual_duration_days?: number | null;
  actual_cost?: number | null;
  
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectStageWithSubStages extends ProjectStage {
  sub_stages?: ProjectStage[];
  dependent_stages?: ProjectStage[];
}

export interface StageTimelineResponse {
  project_id: number;
  project_name: string;
  total_duration_days: number;
  earliest_start: string;
  latest_end: string;
  stages: Array<{
    stage: ProjectStage;
    timeline_position: {
      start_offset_days: number;
      duration_days: number;
      overlap_with_previous?: number;
    };
    critical_path: boolean;
    dependencies_met: boolean;
  }>;
  critical_path_stages: number[];
  potential_delays: Array<{
    stage_id: number;
    stage_name: string;
    risk_level: string;
    potential_delay_days: number;
    impact_on_project: string;
  }>;
} 