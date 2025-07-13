import axios, { type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import type { AuthResponse, User, Category, ProjectStatusTransitionsResponse, ProjectTransitionResponse } from '../types/index';
// Import LineaCredito types from the new location
import type { LineaCredito, LineaCreditoCreate, LineaCreditoUpdate, LineaCreditoUso, LineaCreditoUsoCreate } from '../types/lineasDeCredito';
import type {
    PlanillaAdministracion, PlanillaAdministracionCreate, PlanillaAdministracionUpdate,
    PlanillaFijaConstruccion, PlanillaFijaConstruccionCreate, PlanillaFijaConstruccionUpdate,
    PlanillaGerencial, PlanillaGerencialCreate, PlanillaGerencialUpdate,
    PlanillaServicioProfesionales, PlanillaServicioProfesionalesCreate, PlanillaServicioProfesionalesUpdate,
    PlanillaVariableConstruccion, PlanillaVariableConstruccionCreate, PlanillaVariableConstruccionUpdate,
    VPlanillaAdministracion, VPlanillaFijaConstruccion, VPlanillaGerencial, 
    VPlanillaServicioProfesionales, VPlanillaVariableConstruccion, VPlanillaTotal
} from '../types/payrollTypes'; // Added import for payroll types
import { 
  NombresConsultores,
  CostoConsultores,
  CostoConsultoresCreate,
  CostoConsultoresUpdate,
  VCostoConsultores
} from '../types/consultoresTypes';

export interface CashFlowItem {
  category: string;
  subcategory: string;
  description: string;
  months: Record<string, number>;
}

export interface CashFlow {
  id: number;
  amount: number;
  description: string;
  date: string;
  type: 'income' | 'expense';
  category_id: number;
  created_at: string;
  updated_at: string;
}

// New interface for Ledger Entries
export interface LedgerEntry {
  id: number;
  account_id: string | null;
  account_description: string | null;
  entry_date: string;
  reference: string | null;
  journal: string | null;
  transaction_description: string;
  debit_amount: number | null;
  credit_amount: number | null;
  balance: number | null;
  project_name?: string;
}

// Interface for Administrative Costs
export interface AdministrativeCost {
  id: number;
  accountId: string | null;
  accountDescription: string | null;
  entryDate: string; // Assuming YYYY-MM-DD string from backend
  reference: string | null;
  journal: string | null;
  transactionDescription: string;
  debitAmount: number | null;
  creditAmount: number | null;
  balance: number | null;
  // No projectName for admin costs as they are general
}

// Interface for Project Cash Flow Items (Contabilidad)
export interface ProjectCashFlowItem {
  category: string; // account_description
  months: Record<string, number>; // YYYY-MM: net_amount (Decimal from backend, number in TS)
}

// Frontend interface for Vendedor
export interface Vendedor {
  id: number;
  nombre: string;
}

// Interface for PlantillaComisionesVentas (moved to types/index.ts, but might be re-imported or re-declared here if needed elsewhere)
// export interface PlantillaComisionesVentas { ... }

// Frontend interfaces for Pago (Payment)
export interface PagoCreate {
  cliente_id: number;
  proyecto_keyword?: string;
  monto: number | string; // Frontend can prepare as number or string that Pydantic can parse to Decimal
  fecha_pago: string; // YYYY-MM-DD
  metodo_pago: string;
  referencia?: string;
  notas?: string;
  linea_credito_id_abono?: number;
  abono_porcentaje_linea_credito?: number;
  origen_pago?: string;
}

export interface Pago { // This is what the API returns
  id: number;
  cliente_id: number;
  cliente_nombre?: string;
  proyecto_keyword?: string | null; // Backend Optional[str] can be null in JSON
  monto: string; // Pydantic Decimal serializes to string in FastAPI JSON response
  fecha_pago: string; // YYYY-MM-DD
  metodo_pago: string;
  referencia?: string | null;
  notas?: string | null;
  linea_credito_id_abono?: number | null;
  origen_pago?: string | null;
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
}

// Frontend interfaces for Cliente (Client)
export interface Cliente {
  id: number;
  nombre: string;
  ruc?: string | null;
  email?: string | null;
  telefono?: string | null;
  numero_cedula?: string | null;
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
}

export interface ClienteCreate {
  nombre: string;
  ruc?: string;
  email?: string;
  telefono?: string;
  numero_cedula?: string;
}

export interface ClienteUpdate {
  nombre?: string;
  ruc?: string;
  email?: string;
  telefono?: string;
  numero_cedula?: string;
}

// Use environment variable for flexibility.
// For production, VITE_API_BASE_URL is set during the build process (see deploy.ps1).
// For local development, it should be set in a .env.local file (e.g., VITE_API_BASE_URL=http://localhost:8000).
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'https://flujo-backend-5y5k7r4ssq-vp.a.run.app' : 'http://localhost:8000');

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 Unauthorized
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API methods
export const auth = {
  login: (username: string, password: string) => 
    api.post<AuthResponse>(
      '/api/auth/token',
      { username, password },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    ),
  
  register: (username: string, password: string, department: string) =>
    api.post<AuthResponse>(
      '/auth/register',
      { username, password, department },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    ),
};

export const users = {
  getMe: () => api.get<User>('/users/me/'),
  updateProfile: (data: Partial<User>) => api.patch<User>('/users/me/', data),
};

export const categories = {
  getAll: () => api.get<Category[]>('/categories/'),
  create: (data: { name: string; type: string }) => api.post<Category>('/categories/', data),
};

export const cashFlows = {
  getAll: () => api.get('/api/cashflow/', {
    headers: { 'ngrok-skip-browser-warning': 'true' }
  }),
  getProjectCashFlow: (project: string) => api.get(`/api/cashflow/${project}`, {
    headers: { 'ngrok-skip-browser-warning': 'true' }
  }),
  getCombinedCashFlow: () => api.get('/api/cashflow/combined/mercadeo', {
    headers: { 'ngrok-skip-browser-warning': 'true' }
  }),
  create: (data: { 
    amount: number; 
    description: string; 
    date: string; 
    type: 'income' | 'expense'; 
    category_id: number 
  }) => api.post('/api/cashflow/', data),
};


export const proyeccionVentas = {
  // Get all sales projections
  getAll: () => api.get('/api/proyeccion-ventas'),
  
  // Get a single sales projection by ID
  getById: (id: number | string) => api.get(`/api/proyeccion-ventas/${id}`),
  
  // Create a new sales projection
  create: (data: any) => api.post('/api/proyeccion-ventas', data),
  
  // Update an existing sales projection
  update: (id: number | string, data: any) => api.put(`/api/proyeccion-ventas/${id}`, data),
  
  // Delete a sales projection
  delete: (id: number | string) => api.delete(`/api/proyeccion-ventas/${id}`),
  
  // New function to get sales cash flow projection
  getVentasCashflowProjection: () => api.get('/api/ventas/cashflow-projection', 
    { headers: { 'ngrok-skip-browser-warning': 'true' } }
  )
};

export const plantillaComisiones = {
  getAll: (year: number, month: number) => {
    console.log(`[api.ts] Getting all plantilla comisiones for ${year}-${month}`);
    return api.get('/api/ventas/plantilla-comisiones/', { params: { year, month } });
  },
  get: (id: number) => api.get(`/api/ventas/plantilla-comisiones/${id}`),
  create: (data: any) => api.post('/api/ventas/plantilla-comisiones/', data),
  
  // Get a single comision by ID
  getById: (id: number | string) => api.get(`/api/ventas/plantilla-comisiones/${id}`, { headers: { 'ngrok-skip-browser-warning': 'true' } }),
  
  // Update an existing comision
  update: (id: number | string, data: any) => api.put(`/api/ventas/plantilla-comisiones/${id}`, data, { headers: { 'ngrok-skip-browser-warning': 'true' } }),
  
  // Delete a comision
  delete: (id: number | string) => api.delete(`/api/ventas/plantilla-comisiones/${id}`, { headers: { 'ngrok-skip-browser-warning': 'true' } })
};

export const tables = {
  // List all tables for a project
  list: async (project: string) => {
    // Ensure the path is correctly constructed for the backend, prepending /api if not already present
    // The backend router for marketing is mounted at /api/marketing
    const path = `/api/marketing/${project}/tables`;
    console.log(`Calling API for tables.list: ${API_BASE_URL}${path} with project: ${project}`);
    return api.get(path, {
      headers: { 
        'ngrok-skip-browser-warning': 'true' 
      }
    });
  },
  
  // Get table data
  getTable: async (project: string, tableName: string) => {
    // Ensure the path is correctly constructed for the backend, prepending /api if not already present
    const path = `/api/marketing/${project}/table/${tableName}`;
    console.log(`Calling API for tables.getTable: ${API_BASE_URL}${path} with project: ${project}, table: ${tableName}`);
    return api.get(path, {
      headers: { 
        'ngrok-skip-browser-warning': 'true' 
      }
    });
  },
  
  // Note: The following methods would need corresponding backend implementation
  create: () => 
    Promise.reject(new Error('Create table not implemented')),
  
  addRow: (_tableName: string) => 
    Promise.reject(new Error('Add row not implemented')),
  
  updateRow: (_tableName: string, _id: number, _data: Record<string, any>) => 
    Promise.reject(new Error('Update row not implemented')),
  
  deleteRow: (_tableName: string, _id: number) => 
    Promise.reject(new Error('Delete row not implemented')),
  
  // New function to list all marketing project tables
  listAllMarketingProjectTables: async () => {
    const path = '/api/tables/list'; // Assuming this is the correct backend endpoint
    console.log(`Calling API for listAllMarketingProjectTables: ${API_BASE_URL}${path}`);
    const response = await api.get<{ tables: string[] }>(path, {
      headers: {
        'ngrok-skip-browser-warning': 'true' // Add header to bypass ngrok interstitial
      }
    });
    console.log('[DEBUG api.ts] Raw response from /api/tables/list:', response);
    return response;
  }
};

// API functions for Lineas de Credito
export const lineasCreditoApi = {
  getAll: () => api.get<LineaCredito[]>('/api/lineas-credito/', { headers: { 'ngrok-skip-browser-warning': 'true' } }),
  getById: (id: number) => api.get<LineaCredito>(`/api/lineas-credito/${id}`, { headers: { 'ngrok-skip-browser-warning': 'true' } }),
  create: (data: LineaCreditoCreate) => api.post<LineaCredito>('/api/lineas-credito/', data, { headers: { 'ngrok-skip-browser-warning': 'true' } }),
  update: (id: number, data: LineaCreditoUpdate) => api.put<LineaCredito>(`/api/lineas-credito/${id}`, data, { headers: { 'ngrok-skip-browser-warning': 'true' } }),
  delete: (id: number) => api.delete(`/api/lineas-credito/${id}`, { headers: { 'ngrok-skip-browser-warning': 'true' } }),
  getUsosByLineaId: (lineaId: number) => api.get<LineaCreditoUso[]>(`/api/lineas-credito/${lineaId}/usos`, { headers: { 'ngrok-skip-browser-warning': 'true' } }),
  createUsoLineaCredito: (lineaId: number, data: LineaCreditoUsoCreate) => api.post<LineaCreditoUso>(`/api/lineas-credito/${lineaId}/usos`, data, { headers: { 'ngrok-skip-browser-warning': 'true' } }),
  deleteUso: (usoId: number) => api.delete(`/api/lineas-credito/usos/${usoId}`, { headers: { 'ngrok-skip-browser-warning': 'true' } }),
  getFinancialCostsCashflow: () => api.get('/api/lineas-credito/financial-costs-cashflow', { headers: { 'ngrok-skip-browser-warning': 'true' } }),
  getIngresosCashflow: () => api.get('/api/lineas-credito/ingresos-cashflow', { headers: { 'ngrok-skip-browser-warning': 'true' } })
};

// API functions for Project Credit Lines (Scenario Projects)
export const projectCreditLinesApi = {
  // Credit Lines CRUD
  getProjectCreditLines: (projectId: number) => 
    api.get<ProjectCreditLine[]>(`/api/scenario-projects/${projectId}/credit-lines`, { 
      headers: { 'ngrok-skip-browser-warning': 'true' } 
    }),
  createProjectCreditLine: (projectId: number, data: ProjectCreditLineCreate) => 
    api.post<ProjectCreditLine>(`/api/scenario-projects/${projectId}/credit-lines`, data, { 
      headers: { 'ngrok-skip-browser-warning': 'true' } 
    }),
  updateProjectCreditLine: (projectId: number, creditLineId: number, data: ProjectCreditLineUpdate) => 
    api.put<ProjectCreditLine>(`/api/scenario-projects/${projectId}/credit-lines/${creditLineId}`, data, { 
      headers: { 'ngrok-skip-browser-warning': 'true' } 
    }),
  deleteProjectCreditLine: (projectId: number, creditLineId: number) => 
    api.delete(`/api/scenario-projects/${projectId}/credit-lines/${creditLineId}`, { 
      headers: { 'ngrok-skip-browser-warning': 'true' } 
    }),

  // Credit Line Usage CRUD
  getCreditLineUsage: (projectId: number, creditLineId: number) => 
    api.get<CreditLineUsage[]>(`/api/scenario-projects/${projectId}/credit-lines/${creditLineId}/usage`, { 
      headers: { 'ngrok-skip-browser-warning': 'true' } 
    }),
  createCreditLineUsage: (projectId: number, creditLineId: number, data: CreditLineUsageCreate) => 
    api.post<CreditLineUsage>(`/api/scenario-projects/${projectId}/credit-lines/${creditLineId}/usage`, data, { 
      headers: { 'ngrok-skip-browser-warning': 'true' } 
    }),
  updateCreditLineUsage: (projectId: number, creditLineId: number, usageId: number, data: CreditLineUsageUpdate) => 
    api.put<CreditLineUsage>(`/api/scenario-projects/${projectId}/credit-lines/${creditLineId}/usage/${usageId}`, data, { 
      headers: { 'ngrok-skip-browser-warning': 'true' } 
    }),
  deleteCreditLineUsage: (projectId: number, creditLineId: number, usageId: number) => 
    api.delete(`/api/scenario-projects/${projectId}/credit-lines/${creditLineId}/usage/${usageId}`, { 
      headers: { 'ngrok-skip-browser-warning': 'true' } 
    }),

  // Credit Requirements Analysis
  getProjectCreditRequirements: (projectId: number) => 
    api.get<CreditRequirementsAnalysis>(`/api/scenario-projects/${projectId}/credit-requirements`, { 
      headers: { 'ngrok-skip-browser-warning': 'true' } 
    }),

  // Monthly Timeline
  getCreditLinesMonthlyTimeline: (projectId: number) => 
    api.get<CreditLinesMonthlyTimeline>(`/api/scenario-projects/${projectId}/credit-lines/monthly-timeline`, { 
      headers: { 'ngrok-skip-browser-warning': 'true' } 
    })
};

// API for Pagos - Ensure this is a standalone named export
export const pagosApi = {
  getAll: () => api.get<Pago[]>('/api/pagos/'),
  getById: (id: number) => api.get<Pago>(`/api/pagos/${id}`),
  create: (pagoData: PagoCreate) => api.post<Pago>('/api/pagos/', pagoData),
  delete: (id: number) => api.delete<Pago>(`/api/pagos/${id}`),
};

// API functions for Vendedores (Salespeople)
export const vendedoresApi = {
  getAll: () => 
    api.get<Vendedor[]>('/api/vendedores/', { 
      headers: { 'ngrok-skip-browser-warning': 'true' } 
    }),
  create: (data: { nombre: string }) => 
    api.post<Vendedor>('/api/vendedores/', data, { 
      headers: { 'ngrok-skip-browser-warning': 'true' } 
    }),
  delete: (id: number) => 
    api.delete(`/api/vendedores/${id}`, { 
      headers: { 'ngrok-skip-browser-warning': 'true' } 
    }),
};

// API functions for Contabilidad
export const contabilidadApi = {
  getLedgerEntries: (projectName?: string) => {
    let url = '/api/ledger-entries';
    if (projectName) {
      url += `?project_name=${encodeURIComponent(projectName)}`;
    }
    return api.get<LedgerEntry[]>(url, 
      { headers: { 'ngrok-skip-browser-warning': 'true' } }
    );
  },
  
  uploadAndReplaceLedger: (file: File, projectName: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('project_name', projectName);
    
    return api.post<{ message: string }>('/contabilidad/upload-replace-ledger', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'ngrok-skip-browser-warning': 'true'
      },
    });
  },

  // Endpoint to get project-specific cash flow data (for Contabilidad Cuenta Proyectos)
  getProjectCashFlowSummary: (projectName: string): Promise<AxiosResponse<ProjectCashFlowItem[]>> => {
    return api.get<ProjectCashFlowItem[]>(`/contabilidad/project-cashflow/${encodeURIComponent(projectName)}`, 
      { headers: { 'ngrok-skip-browser-warning': 'true' } }
    );
  },

  // Endpoint to get administrative costs (for Contabilidad General)
  getAdministrativeCosts: (): Promise<AxiosResponse<AdministrativeCost[]>> => {
    return api.get<AdministrativeCost[]>('/api/administrative-costs', 
      { headers: { 'ngrok-skip-browser-warning': 'true' } }
    );
  },

  uploadAndReplaceAdminCosts: (file: File): Promise<AxiosResponse<{ message: string }>> => {
    const formData = new FormData();
    formData.append('file', file);
    // No project_name needed for admin costs

    return api.post<{ message: string }>('/contabilidad/upload-replace-admin-costs', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'ngrok-skip-browser-warning': 'true'
      },
    });
  },

  // New function for Project Cash Flow (Contabilidad)
  getProjectCashFlow: (projectName: string): Promise<AxiosResponse<ProjectCashFlowItem[]>> => {
    const params = new URLSearchParams();
    params.append('project_name', projectName);
    return api.get<ProjectCashFlowItem[]>(`/contabilidad/project-cash-flow?${params.toString()}`,
      { headers: { 'ngrok-skip-browser-warning': 'true' } }
    );
  },

  getDistinctProjectNames: (): Promise<AxiosResponse<string[]>> => {
    return api.get<string[]>('/api/distinct-project-names',
      { headers: { 'ngrok-skip-browser-warning': 'true' } }
    );
  }
};

export const clientesApi = {
  getAll: () => 
    api.get<Cliente[]>('/api/clientes/', { 
      headers: { 'ngrok-skip-browser-warning': 'true' } 
    }),
  getById: (id: number) => 
    api.get<Cliente>(`/api/clientes/${id}`, { 
      headers: { 'ngrok-skip-browser-warning': 'true' } 
    }),
  create: (data: ClienteCreate) => 
    api.post<Cliente>('/api/clientes/', data, { 
      headers: { 'ngrok-skip-browser-warning': 'true' } 
    }),
  update: (id: number, data: ClienteUpdate) => 
    api.put<Cliente>(`/api/clientes/${id}`, data, { 
      headers: { 'ngrok-skip-browser-warning': 'true' } 
    }),
  deleteById: (id: number) => 
    api.delete(`/api/clientes/${id}`, { // Backend returns the deleted client object or error
      headers: { 'ngrok-skip-browser-warning': 'true' } 
    }),
};

// --- Payroll API Service ---
export const payrollApi = {
  // PlanillaAdministracion
  getAllPlanillasAdministracion: (skip: number = 0, limit: number = 100) => 
    api.get<PlanillaAdministracion[]>(`/api/payroll/planillas/administracion/?skip=${skip}&limit=${limit}`),
  getPlanillaAdministracionByName: (nombre: string) => 
    api.get<PlanillaAdministracion>(`/api/payroll/planillas/administracion/${encodeURIComponent(nombre)}`),
  createPlanillaAdministracion: (data: PlanillaAdministracionCreate) => 
    api.post<PlanillaAdministracion>('/api/payroll/planillas/administracion/', data),
  updatePlanillaAdministracion: (nombre: string, data: PlanillaAdministracionUpdate) => 
    api.put<PlanillaAdministracion>(`/api/payroll/planillas/administracion/${encodeURIComponent(nombre)}`, data),
  deletePlanillaAdministracion: (nombre: string) => 
    api.delete<PlanillaAdministracion>(`/api/payroll/planillas/administracion/${encodeURIComponent(nombre)}`),

  // PlanillaFijaConstruccion
  getAllPlanillasFijaConstruccion: (skip: number = 0, limit: number = 100) => 
    api.get<PlanillaFijaConstruccion[]>(`/api/payroll/planillas/fija_construccion/?skip=${skip}&limit=${limit}`),
  getPlanillaFijaConstruccionByName: (nombre: string) => 
    api.get<PlanillaFijaConstruccion>(`/api/payroll/planillas/fija_construccion/${encodeURIComponent(nombre)}`),
  createPlanillaFijaConstruccion: (data: PlanillaFijaConstruccionCreate) => 
    api.post<PlanillaFijaConstruccion>('/api/payroll/planillas/fija_construccion/', data),
  updatePlanillaFijaConstruccion: (nombre: string, data: PlanillaFijaConstruccionUpdate) => 
    api.put<PlanillaFijaConstruccion>(`/api/payroll/planillas/fija_construccion/${encodeURIComponent(nombre)}`, data),
  deletePlanillaFijaConstruccion: (nombre: string) => 
    api.delete<PlanillaFijaConstruccion>(`/api/payroll/planillas/fija_construccion/${encodeURIComponent(nombre)}`),

  // PlanillaGerencial
  getAllPlanillasGerencial: (skip: number = 0, limit: number = 100) => 
    api.get<PlanillaGerencial[]>(`/api/payroll/planillas/gerencial/?skip=${skip}&limit=${limit}`),
  getPlanillaGerencialByName: (nombre: string) => 
    api.get<PlanillaGerencial>(`/api/payroll/planillas/gerencial/${encodeURIComponent(nombre)}`),
  createPlanillaGerencial: (data: PlanillaGerencialCreate) => 
    api.post<PlanillaGerencial>('/api/payroll/planillas/gerencial/', data),
  updatePlanillaGerencial: (nombre: string, data: PlanillaGerencialUpdate) => 
    api.put<PlanillaGerencial>(`/api/payroll/planillas/gerencial/${encodeURIComponent(nombre)}`, data),
  deletePlanillaGerencial: (nombre: string) => 
    api.delete<PlanillaGerencial>(`/api/payroll/planillas/gerencial/${encodeURIComponent(nombre)}`),

  // PlanillaServicioProfesionales
  getAllPlanillasServicioProfesionales: (skip: number = 0, limit: number = 100) => 
    api.get<PlanillaServicioProfesionales[]>(`/api/payroll/planillas/servicio_profesionales/?skip=${skip}&limit=${limit}`),
  getPlanillaServicioProfesionalesByName: (nombre: string) => 
    api.get<PlanillaServicioProfesionales>(`/api/payroll/planillas/servicio_profesionales/${encodeURIComponent(nombre)}`),
  createPlanillaServicioProfesionales: (data: PlanillaServicioProfesionalesCreate) => 
    api.post<PlanillaServicioProfesionales>('/api/payroll/planillas/servicio_profesionales/', data),
  updatePlanillaServicioProfesionales: (nombre: string, data: PlanillaServicioProfesionalesUpdate) => 
    api.put<PlanillaServicioProfesionales>(`/api/payroll/planillas/servicio_profesionales/${encodeURIComponent(nombre)}`, data),
  deletePlanillaServicioProfesionales: (nombre: string) => 
    api.delete<PlanillaServicioProfesionales>(`/api/payroll/planillas/servicio_profesionales/${encodeURIComponent(nombre)}`),

  // PlanillaVariableConstruccion
  getAllPlanillasVariableConstruccion: (skip: number = 0, limit: number = 100) => 
    api.get<PlanillaVariableConstruccion[]>(`/api/payroll/planillas/variable_construccion/?skip=${skip}&limit=${limit}`),
  getPlanillaVariableConstruccionByName: (nombre: string) => 
    api.get<PlanillaVariableConstruccion>(`/api/payroll/planillas/variable_construccion/${encodeURIComponent(nombre)}`),
  createPlanillaVariableConstruccion: (data: PlanillaVariableConstruccionCreate) => 
    api.post<PlanillaVariableConstruccion>('/api/payroll/planillas/variable_construccion/', data),
  updatePlanillaVariableConstruccion: (nombre: string, data: PlanillaVariableConstruccionUpdate) => 
    api.put<PlanillaVariableConstruccion>(`/api/payroll/planillas/variable_construccion/${encodeURIComponent(nombre)}`, data),
  deletePlanillaVariableConstruccion: (nombre: string) => 
    api.delete<PlanillaVariableConstruccion>(`/api/payroll/planillas/variable_construccion/${encodeURIComponent(nombre)}`),

  // Payroll Views
  getViewPlanillaAdministracion: () => 
    api.get<VPlanillaAdministracion[]>('/api/payroll/views/administracion/'),
  getViewPlanillaFijaConstruccion: () => 
    api.get<VPlanillaFijaConstruccion[]>('/api/payroll/views/fija_construccion/'),
  getViewPlanillaGerencial: () => 
    api.get<VPlanillaGerencial[]>('/api/payroll/views/gerencial/'),
  getViewPlanillaServicioProfesionales: () => 
    api.get<VPlanillaServicioProfesionales[]>('/api/payroll/views/servicio_profesionales/'),
  getViewPlanillaVariableConstruccion: () => 
    api.get<VPlanillaVariableConstruccion[]>('/api/payroll/views/variable_construccion/'),
  getViewPlanillaTotal: () => 
    api.get<VPlanillaTotal[]>('/api/payroll/views/total/'),
  updatePlanillaVariableMonto: (proyecto: string, month: string, monto: number) =>
    api.put(`/api/payroll/flujo/planilla-variable/${proyecto}/${month}`, { monto })
};

// You might also want to integrate this into the main 'tables' object if preferred
// For example:
// tables.createLineaCredito = lineasCreditoApi.create;
// tables.getAllLineasCredito = lineasCreditoApi.getAll;

// Export the main 'api' instance itself. 
// Other consts like 'auth', 'tables', 'lineasCreditoApi' are already exported due to 'export const ...'
// Interfaces like 'LineaCredito' are already exported due to 'export interface ...'
export { api };

// Default export (optional, can be removed if only using named imports)
// For the default export, ensure all members are actually in scope in this file.
// 'marketingApi' is defined in './marketingApi.ts' and should be imported from there by consumers.
/* DELETED apiClient DEFINITION FROM HERE */

// Also need to define FlujoGeneralIngresosResponse and IngresoPorOrigen interfaces for the frontend
// These should mirror the Pydantic schemas
export interface IngresoPorOrigen {
  origen_pago: string; // Pydantic Optional[str] becomes string (could be "DESCONOCIDO" or "-")
  total_monto: string; // Pydantic Decimal serializes to string
}

export interface FlujoGeneralIngresosResponse {
  total_cobros_mes: string; // Pydantic Decimal serializes to string
  cobros_por_origen: IngresoPorOrigen[];
}

// Consultores endpoints
export const consultoresApi = {
  // Nombres Consultores
  getNombresConsultores: () => 
    api.get<NombresConsultores[]>('/api/consultores/nombres'),
  createNombreConsultor: (consultor: NombresConsultores) => 
    api.post<NombresConsultores>('/api/consultores/nombres', consultor),
  deleteNombreConsultor: (nombre: string) => 
    api.delete(`/api/consultores/nombres/${nombre}`),

  // Costo Consultores
  getCostoConsultores: (startDate?: string, endDate?: string) => 
    api.get<CostoConsultores[]>('/api/consultores/costos', { params: { start_date: startDate, end_date: endDate } }),
  createCostoConsultor: (costo: CostoConsultoresCreate) => 
    api.post<CostoConsultores>('/api/consultores/costos', costo),
  updateCostoConsultor: (consultor: string, fecha: string, costo: CostoConsultoresUpdate) => 
    api.put<CostoConsultores>(`/api/consultores/costos/${consultor}/${fecha}`, costo),
  deleteCostoConsultor: (consultor: string, fecha: string) => 
    api.delete(`/api/consultores/costos/${consultor}/${fecha}`),

  // Views
  getVCostoConsultores: (startDate?: string, endDate?: string) => 
    api.get<VCostoConsultores[]>('/api/consultores/views/costos', { params: { start_date: startDate, end_date: endDate } }),
};

export interface CostoDirecto {
  id: number;
  actividad: string;
  infraestructura: number;
  materiales: number;
  mo: number;
  equipos: number;
  total: number;
}

export interface CostoDirectoCreate {
  actividad: string;
  infraestructura: number;
  materiales: number;
  mo: number;
  equipos: number;
}

export interface CostoDirectoUpdate {
  actividad?: string;
  infraestructura?: number;
  materiales?: number;
  mo?: number;
  equipos?: number;
}

export type CostoDirectoView = {
  rows: CostoDirecto[];
  totals: Omit<CostoDirecto, 'id' | 'actividad'>;
};

export type CostosDirectosTotales = {
  costo_total_materiales_infraestructura: number;
  costo_total_materiales_viviendas: number;
  mano_de_obra_infraestructura: number;
  mano_de_obra_vivienda: number;
  total: number;
};

// Interfaces for CostoXVivienda
export interface CostoXVivienda {
  id: number;
  viviendas: number;
  materiales: number;
  mo: number;
  otros: number;
}

export type CostoXViviendaCreate = Omit<CostoXVivienda, 'id'>;

export type CostoXViviendaUpdate = Partial<CostoXViviendaCreate>;

export interface CostoXViviendaView extends CostoXVivienda {
  total: number;
}

// API methods
export const costoDirecto = {
  getAll: (params?: any) => api.get<CostoDirecto[]>('/api/costo-directo/', params),
  getView: (params?: any) => api.get<CostoDirectoView>('/api/costo-directo/view/', params),
  create: (data: CostoDirectoCreate) => api.post<CostoDirecto>('/api/costo-directo/', data),
  update: (id: number, data: CostoDirectoUpdate) => api.put<CostoDirecto>(`/api/costo-directo/${id}`, data),
  delete: (id: number) => api.delete(`/api/costo-directo/${id}`),
  getTotals: (params?: any) => api.get<CostosDirectosTotales>('/api/costo-directo/totales/', params),
};

export const costoXViviendaApi = {
  getAll: (params?: any) => api.get<CostoXVivienda[]>('/api/costo_x_vivienda/', params),
  getById: (id: number) => api.get<CostoXVivienda>(`/api/costo_x_vivienda/${id}`),
  create: (data: CostoXViviendaCreate) => api.post<CostoXVivienda>('/api/costo_x_vivienda/', data),
  update: (id: number, data: CostoXViviendaUpdate) => api.put<CostoXVivienda>(`/api/costo_x_vivienda/${id}`, data),
  delete: (id: number) => api.delete(`/api/costo_x_vivienda/${id}`),
  getView: (params?: any) => api.get<CostoXViviendaView[]>('/api/costo_x_vivienda/view/', params),
};

export const marketingProjectsApi = {
  getAll: async () => {
    return api.get('/api/marketing-projects/');
  },
};

export const projectsApi = {
  getAll: async () => {
    return api.get('/api/projects/list');
  },
  createComprehensive: async (projectName: string) => {
    return api.post('/api/projects/create-comprehensive', { project_name: projectName });
  },
  delete: async (projectKeyword: string) => {
    return api.delete(`/api/projects/${projectKeyword}`);
  },
};

export const marketingSummaryApi = {
  getMarketingSummaryViews: () => api.get<string[]>('/api/marketing-summary-views'),
  getMarketingSummaryView: (viewName: string) => api.get(`/api/marketing-summary-view/${viewName}`),
  getConsolidatedCashFlow: () => api.get('/api/marketing/consolidated/cash-flow'),
};

const apiClient = {
  auth,
  users,
  categories,
  cashFlows,
  api, // This is the axios instance itself
  tables,
  proyeccionVentas,
  plantillaComisiones,
  lineasCreditoApi,
  contabilidadApi, // Add the new API service
  vendedoresApi, // Add the new API service
  pagosApi, // Include the named export in the default export object as well
  getLineasCredito: () => api.get<LineaCredito[]>('/api/lineas-credito/', { headers: { 'ngrok-skip-browser-warning': 'true' } }),
  createLineaCredito: (data: LineaCreditoCreate) => api.post<LineaCredito>('/api/lineas-credito/', data, { headers: { 'ngrok-skip-browser-warning': 'true' } }),
  updateLineaCredito: (id: number, data: LineaCreditoUpdate) => api.put<LineaCredito>(`/api/lineas-credito/${id}`, data, { headers: { 'ngrok-skip-browser-warning': 'true' } }),
  deleteLineaCredito: (id: number) => api.delete(`/api/lineas-credito/${id}`, { headers: { 'ngrok-skip-browser-warning': 'true' } }),
  // Usos de Linea de Credito
  getUsosLineaCredito: (lineaId: number) => api.get<LineaCreditoUso[]>(`/api/lineas-credito/${lineaId}/usos`, { headers: { 'ngrok-skip-browser-warning': 'true' } }),
  createUsoLineaCredito: (lineaId: number, data: LineaCreditoUsoCreate) => api.post<LineaCreditoUso>(`/api/lineas-credito/${lineaId}/usos`, data, { headers: { 'ngrok-skip-browser-warning': 'true' } }),
  clientesApi, // Added clientesApi to the default export
  payrollApi, // Added payrollApi to the default export
  contabilidadFlujoGeneralApi: { // New API service
    getIngresosPorCobros: (year: number, month: number) => 
      api.get<FlujoGeneralIngresosResponse>(
        `/api/contabilidad/flujo-general/ingresos-por-cobros?year=${year}&month=${month}`,
        { headers: { 'ngrok-skip-browser-warning': 'true' } }
      ),
    getIngresosPorVentasCashflow: () => 
      api.get<{ month: string, monto: number }[]>(
        '/api/contabilidad/flujo-general/ingresos-por-ventas-cashflow',
        { headers: { 'ngrok-skip-browser-warning': 'true' } }
      ),
  },
  costoDirecto,
  costoXViviendaApi,
  consultoresApi,
  marketingProjectsApi,
  marketingSummaryApi,
};

export default apiClient;

export const getInfraestructuraPagos = (params?: any) => api.get('/api/costo-directo/infraestructura-pagos/', params);
export const createInfraestructuraPago = (data: any) => api.post('/api/costo-directo/infraestructura-pagos/', data);
export const deleteInfraestructuraPago = (id: number) => api.delete(`/api/costo-directo/infraestructura-pagos/${id}/`);

export const getViviendaPagos = (params?: any) => api.get('/api/costo-directo/vivienda-pagos/', params);
export const createViviendaPago = (data: any) => api.post('/api/costo-directo/vivienda-pagos/', data);
export const deleteViviendaPago = (id: number) => api.delete(`/api/costo-directo/vivienda-pagos/${id}/`);

// Payroll Cash Flow API
export const payrollFlowApi = {
  // Fixed Payrolls
  getFlujoPlanillaAdministracion: () => api.get('/api/payroll/flujo/planilla-administracion'),
  getFlujoPlanillaFijaConstruccion: () => api.get('/api/payroll/flujo/planilla-fija-construccion'),
  getFlujoPlanillaGerencial: () => api.get('/api/payroll/flujo/planilla-gerencial'),
  getFlujoPlanillaServicioProfesionales: () => api.get('/api/payroll/flujo/planilla-servicio-profesionales'),
  
  // Variable Payroll
  getFlujoPlanillaVariable: (proyecto: string) => api.get('/api/payroll/flujo/planilla-variable', { params: { proyecto } }),
  
  // Update endpoints
  updateFlujoPlanilla: (planillaType: string, month: string, monto: number) => 
    api.put(`/api/payroll/flujo/${planillaType}/${month}`, { monto }),
  
  updateFlujoPlanillaVariable: (proyecto: string, month: string, monto: number) =>
    api.put(`/api/payroll/flujo/planilla-variable/${proyecto}/${month}`, { monto })
};

// Commission Template Management
export const commissionTemplateApi = {
  getCommissionTemplateData: () => api.get('/api/ventas/commission-template/'),
  createCommissionTemplateRow: (concepto: string) => 
    api.post('/api/ventas/commission-template/', null, { params: { concepto } }),
  updateCommissionTemplateRow: (rowId: number, updates: Record<string, any>) => 
    api.put(`/api/ventas/commission-template/${rowId}`, updates),
  deleteCommissionTemplateRow: (rowId: number) => 
    api.delete(`/api/ventas/commission-template/${rowId}`),
};

// Project Credit Lines interfaces
export interface ProjectCreditLine {
  id: number;
  scenario_project_id: number;
  nombre: string;
  fecha_inicio: string;
  monto_total_linea: number;
  monto_disponible: number;
  fecha_fin: string;
  interest_rate?: number;
  tipo_linea: string;
  cargos_apertura?: number;
  plazo_meses?: number;
  periodicidad_pago?: string;
  valor_activo?: number;
  valor_residual?: number;
  porcentaje_financiamiento?: number;
  garantia_tipo?: string;
  garantia_descripcion?: string;
  limite_sobregiro?: number;
  moneda: string;
  beneficiario?: string;
  banco_emisor?: string;
  documento_respaldo?: string;
  estado: string;
  es_simulacion: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectCreditLineCreate {
  nombre: string;
  fecha_inicio: string;
  monto_total_linea: number;
  fecha_fin: string;
  interest_rate?: number;
  tipo_linea?: string;
  cargos_apertura?: number;
  plazo_meses?: number;
  periodicidad_pago?: string;
  valor_activo?: number;
  valor_residual?: number;
  porcentaje_financiamiento?: number;
  garantia_tipo?: string;
  garantia_descripcion?: string;
  limite_sobregiro?: number;
  moneda?: string;
  beneficiario?: string;
  banco_emisor?: string;
  documento_respaldo?: string;
  estado?: string;
}

export interface ProjectCreditLineUpdate {
  nombre?: string;
  fecha_inicio?: string;
  monto_total_linea?: number;
  fecha_fin?: string;
  interest_rate?: number;
  tipo_linea?: string;
  cargos_apertura?: number;
  plazo_meses?: number;
  periodicidad_pago?: string;
  valor_activo?: number;
  valor_residual?: number;
  porcentaje_financiamiento?: number;
  garantia_tipo?: string;
  garantia_descripcion?: string;
  limite_sobregiro?: number;
  moneda?: string;
  beneficiario?: string;
  banco_emisor?: string;
  documento_respaldo?: string;
  estado?: string;
}

export interface CreditLineUsage {
  id: number;
  linea_credito_proyecto_id: number;
  fecha_uso: string;
  monto_usado: number;
  tipo_transaccion: string;
  descripcion?: string;
  cargo_transaccion?: number;
  scenario_cost_item_id?: number;
  es_simulacion: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreditLineUsageCreate {
  fecha_uso: string;
  monto_usado: number;
  tipo_transaccion: string;
  descripcion?: string;
  cargo_transaccion?: number;
  scenario_cost_item_id?: number;
}

export interface CreditLineUsageUpdate {
  fecha_uso?: string;
  monto_usado?: number;
  tipo_transaccion?: string;
  descripcion?: string;
  cargo_transaccion?: number;
  scenario_cost_item_id?: number;
}

export interface CreditRequirementsAnalysis {
  project_id: number;
  project_name: string;
  total_project_cost: number;
  financing_breakdown: {
    terreno: number;
    construccion: number;
    capital_trabajo: number;
    contingencia: number;
  };
  total_financing_needed: number;
  recommended_credit_lines: Array<{
    tipo_linea: string;
    proposito: string;
    monto_recomendado: number;
    plazo_meses: number;
    garantia_tipo: string;
    justificacion: string;
  }>;
  financing_ratio: number;
}

export interface CreditLineMonthlyData {
  credit_line_id: number;
  credit_line_name: string;
  tipo_linea: string;
  withdrawals: number;
  payments: number;
  interest: number;
  transaction_charges: number;
  ending_balance: number;
  available_credit: number;
  usage_records_count: number;
}

export interface MonthlyTimelineItem {
  year: number;
  month: number;
  period_label: string;
  credit_lines: CreditLineMonthlyData[];
  total_withdrawals: number;
  total_payments: number;
  total_interest: number;
  total_balance: number;
  sales_revenue: number;
  automatic_payments: number;
}

export interface CreditLinesMonthlyTimeline {
  timeline: MonthlyTimelineItem[];
  summary: {
    total_lines: number;
    total_credit_limit: number;
    final_total_balance: number;
    total_interest_projected: number;
    total_withdrawals_projected: number;
    total_payments_projected: number;
    total_automatic_payments_projected?: number;
    total_sales_revenue_projected?: number;
    timeline_months: number;
    payment_distribution_config?: any;
    credit_lines_detail: Array<{
      id: number;
      name: string;
      total_limit: number;
      final_balance: number;
      available_credit: number;
      interest_rate: number;
    }>;
  };
}

// ============================================================================
// SALES PROJECTIONS INTERFACES
// ============================================================================

export interface SalesProjection {
  id: number;
  scenario_project_id: number;
  scenario_name: string;
  monthly_revenue: Record<string, any>;
  is_active: boolean;
  created_at: string;
}

export interface SalesProjectionWithImpact extends SalesProjection {
  impact_summary?: {
    total_revenue: number;
    total_units: number;
    project_duration_months: number;
  };
}

export interface CashFlowWithProjections {
  cash_flow: any[];
  has_active_projection: boolean;
  active_projection?: SalesProjection;
  projection_summary?: {
    scenario_name: string;
    total_revenue: number;
    total_units: number;
    final_accumulated_flow: number;
  };
}

// ============================================================================
// PROJECT UNITS API FUNCTIONS
// ============================================================================

import type {
  ProjectUnit,
  ProjectUnitCreate,
  ProjectUnitUpdate,
  ProjectUnitsBulkCreate,
  UnitSalesSimulation,
  UnitSalesSimulationCreate,
  UnitSalesSimulationUpdate,
  UnitSalesSimulationRequest,
  UnitSalesSimulationResponse,
  ScenarioProjectWithUnits,
  ProjectUnitsStats,
  ExcelUploadResponse,
  ProjectStage,
  ProjectStageCreate,
  ProjectStageUpdate,
  ProjectStageWithSubStages,
  StageTimelineResponse
} from '../types/projectUnitsTypes';

// Project Units Management
export const projectUnits = {
  // Get all units for a project
  getProjectUnits: (projectId: number) =>
    api.get<ProjectUnit[]>(`/api/scenario-projects/${projectId}/units`),

  // Create a single unit
  createUnit: (projectId: number, unit: Omit<ProjectUnitCreate, 'scenario_project_id'>) =>
    api.post<ProjectUnit>(`/api/scenario-projects/${projectId}/units`, unit),

  // Create multiple units at once
  createUnitsInBulk: (projectId: number, bulkData: ProjectUnitsBulkCreate) =>
    api.post<ProjectUnit[]>(`/api/scenario-projects/${projectId}/units/bulk`, bulkData),

  // Update a specific unit
  updateUnit: (projectId: number, unitId: number, unit: ProjectUnitUpdate) =>
    api.put<ProjectUnit>(`/api/scenario-projects/${projectId}/units/${unitId}`, unit),

  // Delete a unit
  deleteUnit: (projectId: number, unitId: number) =>
    api.delete(`/api/scenario-projects/${projectId}/units/${unitId}`),

  // Get unit statistics for a project
  getUnitsStats: (projectId: number) =>
    api.get<ProjectUnitsStats>(`/api/scenario-projects/${projectId}/units/stats`),

  // Get project with units included
  getProjectWithUnits: (projectId: number) =>
    api.get<ScenarioProjectWithUnits>(`/api/scenario-projects/${projectId}/with-units`),

  // Download Excel template for bulk unit creation
  downloadTemplate: (projectId: number) => {
    return api.get(`/api/scenario-projects/${projectId}/units/download-template`, {
      responseType: 'blob',
    }).then(response => {
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `plantilla_unidades_proyecto_${projectId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    });
  },

  // Upload Excel file with units
  uploadExcel: (projectId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ExcelUploadResponse>(`/api/scenario-projects/${projectId}/units/upload-excel`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Unit Sales Simulations
export const unitSalesSimulations = {
  // Get all sales simulations for a project
  getSimulations: (projectId: number) =>
    api.get<UnitSalesSimulation[]>(`/api/scenarios/projects/${projectId}/units/sales-simulations`),

  // Create a new sales simulation
  createSimulation: (projectId: number, simulation: Omit<UnitSalesSimulationCreate, 'scenario_project_id'>) =>
    api.post<UnitSalesSimulation>(`/api/scenarios/projects/${projectId}/units/sales-simulation`, simulation),

  // Update a sales simulation
  updateSimulation: (projectId: number, simulationId: number, simulation: UnitSalesSimulationUpdate) =>
    api.put<UnitSalesSimulation>(`/api/scenarios/projects/${projectId}/units/sales-simulation/${simulationId}`, simulation),

  // Delete a sales simulation
  deleteSimulation: (projectId: number, simulationId: number) =>
    api.delete(`/api/scenarios/projects/${projectId}/units/sales-simulation/${simulationId}`),

  // DEPRECATED: Use simulateUnitSalesWithPaymentDistribution instead
  // simulateScenarios: (projectId: number, request: UnitSalesSimulationRequest) =>
  //   api.post<UnitSalesSimulationResponse>(`/api/scenarios/projects/${projectId}/units/simulate-scenarios`, request),

  // NEW: Run unit sales simulation with payment distribution and credit line integration
  simulateUnitSalesWithPaymentDistribution: (projectId: number, request: UnitSalesSimulationRequest) =>
    api.post<UnitSalesSimulationResponse>(`/api/scenario-projects/${projectId}/simulate-unit-sales`, request),

  // Get sales calendar view
  getSalesCalendar: (projectId: number, year?: number) =>
    api.get(`/api/scenarios/projects/${projectId}/units/sales-calendar`, { 
      params: year ? { year } : undefined 
    }),
};

// Sales Projections Management
export const salesProjections = {
  // Get all sales projections for a project
  getProjections: (projectId: number) =>
    api.get<SalesProjectionWithImpact[]>(`/api/scenario-projects/${projectId}/sales-projections`),

  // Get the active projection for a project
  getActiveProjection: (projectId: number) =>
    api.get<SalesProjectionWithImpact>(`/api/scenario-projects/${projectId}/sales-projections/active`),

  // Activate a specific projection
  activateProjection: (projectId: number, projectionId: number) =>
    api.post<SalesProjection>(`/api/scenario-projects/${projectId}/sales-projections/${projectionId}/activate`, {}),

  // Delete a projection
  deleteProjection: (projectId: number, projectionId: number) =>
    api.delete(`/api/scenario-projects/${projectId}/sales-projections/${projectionId}`),

  // Get enhanced cash flow with projections
  getCashFlowWithProjections: (projectId: number) =>
    api.get<CashFlowWithProjections>(`/api/scenario-projects/${projectId}/cash-flow-with-projections`),
};

// Project Stages Management
export const projectStages = {
  // Get all stages for a project
  getProjectStages: (projectId: number) =>
    api.get<ProjectStageWithSubStages[]>(`/api/scenario-projects/${projectId}/stages`),

  // Create a new stage
  createStage: (projectId: number, stage: Omit<ProjectStageCreate, 'scenario_project_id'>) =>
    api.post<ProjectStage>(`/api/scenario-projects/${projectId}/stages`, stage),

  // Update a stage
  updateStage: (projectId: number, stageId: number, stage: ProjectStageUpdate) =>
    api.put<ProjectStage>(`/api/scenario-projects/${projectId}/stages/${stageId}`, stage),

  // Delete a stage
  deleteStage: (projectId: number, stageId: number) =>
    api.delete(`/api/scenario-projects/${projectId}/stages/${stageId}`),

  // Get stage timeline
  getStageTimeline: (projectId: number) =>
    api.get<StageTimelineResponse>(`/api/scenario-projects/${projectId}/stages/timeline`),

  // Update stage progress
  updateStageProgress: (projectId: number, stageId: number, progress: number, notes?: string) =>
    api.put<ProjectStage>(`/api/scenario-projects/${projectId}/stages/${stageId}/progress`, {
      progress_percentage: progress,
      notes: notes
    }),

  // Get stage dependencies
  getStageDependencies: (projectId: number, stageId: number) =>
    api.get<ProjectStage[]>(`/api/scenario-projects/${projectId}/stages/${stageId}/dependencies`),

  // Create default stages for a project
  createDefaultStages: (projectId: number, projectType: string = 'RESIDENTIAL') =>
    api.post<ProjectStage[]>(`/api/scenario-projects/${projectId}/stages/create-defaults`, { project_type: projectType }),
};

// Project Status Transitions
export const projectStatusTransitions = {
  // Get available transitions for a project
  getAvailableTransitions: (projectId: number) =>
    api.get<ProjectStatusTransitionsResponse>(`/api/scenario-projects/${projectId}/status-transitions`),

  // Transition from PLANNING to DRAFT
  transitionToDraft: (projectId: number) =>
    api.post<ProjectTransitionResponse>(`/api/scenario-projects/${projectId}/transition-to-draft`, {}),

  // Transition from DRAFT to UNDER_REVIEW
  transitionToReview: (projectId: number) =>
    api.post<ProjectTransitionResponse>(`/api/scenario-projects/${projectId}/transition-to-review`, {}),

  // Approve project (UNDER_REVIEW to APPROVED)
  approveProject: (projectId: number) =>
    api.post<ProjectTransitionResponse>(`/api/scenario-projects/${projectId}/approve`, {}),

  // Reject project (UNDER_REVIEW back to DRAFT)
  rejectProject: (projectId: number, reason?: string) =>
    api.post<ProjectTransitionResponse>(`/api/scenario-projects/${projectId}/reject`, { reason }),

  // Activate project (APPROVED to ACTIVE)
  activateProject: (projectId: number) =>
    api.post<ProjectTransitionResponse>(`/api/scenario-projects/${projectId}/activate`, {}),
};
