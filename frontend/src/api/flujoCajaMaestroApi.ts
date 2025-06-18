/**
 * API client for Flujo de Caja Maestro
 */

import apiClient from './api';

export interface FlujoCajaItem {
  id: number;
  categoria_principal: 'INGRESOS' | 'EGRESOS';
  categoria_secundaria: string;
  subcategoria?: string;
  concepto: string;
  proyecto?: string;
  centro_costo?: string;
  area_responsable?: string;
  fecha_registro: string;
  periodo_inicio: string;
  periodo_fin?: string;
  moneda: string;
  monto_base: number;
  distribucion_mensual?: Record<string, number>;
  tipo_registro: 'REAL' | 'PROYECTADO' | 'PRESUPUESTADO';
  estado: 'ACTIVO' | 'INACTIVO' | 'CANCELADO';
  origen_dato?: string;
  referencia_externa?: string;
  usuario_creacion?: string;
  fecha_creacion: string;
  fecha_modificacion: string;
  usuario_modificacion?: string;
}

export interface FlujoCajaCreateRequest {
  categoria_principal: 'INGRESOS' | 'EGRESOS';
  categoria_secundaria: string;
  subcategoria?: string;
  concepto: string;
  proyecto?: string;
  centro_costo?: string;
  area_responsable?: string;
  periodo_inicio: string;
  periodo_fin?: string;
  moneda?: string;
  monto_base: number;
  distribucion_mensual?: Record<string, number>;
  tipo_registro: 'REAL' | 'PROYECTADO' | 'PRESUPUESTADO';
  estado?: string;
  origen_dato?: string;
  referencia_externa?: string;
  usuario_creacion?: string;
}

export interface FlujoCajaConsolidadoItem {
  categoria_principal: string;
  categoria_secundaria: string;
  subcategoria?: string;
  concepto?: string;
  proyecto?: string;
  tipo_registro: string;
  meses: Record<string, number>;
  total?: number;
}

export interface FlujoCajaConsolidadoResponse {
  data: FlujoCajaConsolidadoItem[];
  periodos: string[];
  resumen: Record<string, number>;
}

export interface FlujoCajaFiltros {
  categorias_principales: string[];
  categorias_secundarias: Record<string, string[]>;
  subcategorias: Record<string, string[]>;
  proyectos: string[];
  tipos_registro: string[];
  monedas: string[];
}

export interface FlujoCajaDinamicoItem {
  categoria_principal: string;
  categoria_secundaria: string;
  subcategoria?: string;
  concepto: string;
  proyecto?: string;
  centro_costo?: string;
  area_responsable?: string;
  tipo_registro: string;
  moneda: string;
  periodo_key: string;
  periodo_fecha: string;
  año: number;
  mes: number;
  monto: number;
}

export interface FlujoCajaDinamicoResponse {
  data: FlujoCajaDinamicoItem[];
  total_periodos: number;
}

class FlujoCajaMaestroApi {
  private baseUrl = '/api/flujo-caja-maestro';

  // CRUD Operations
  async getItems(params?: {
    skip?: number;
    limit?: number;
    categoria_principal?: string;
    categoria_secundaria?: string;
    proyecto?: string;
    tipo_registro?: string;
    estado?: string;
  }): Promise<FlujoCajaItem[]> {
    const response = await apiClient.api.get(this.baseUrl, { params });
    return response.data;
  }

  async getItem(id: number): Promise<FlujoCajaItem> {
    const response = await apiClient.api.get(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async createItem(item: FlujoCajaCreateRequest): Promise<FlujoCajaItem> {
    const response = await apiClient.api.post(this.baseUrl, item);
    return response.data;
  }

  async updateItem(id: number, item: Partial<FlujoCajaCreateRequest>): Promise<FlujoCajaItem> {
    const response = await apiClient.api.put(`${this.baseUrl}/${id}`, item);
    return response.data;
  }

  async deleteItem(id: number): Promise<void> {
    await apiClient.api.delete(`${this.baseUrl}/${id}`);
  }

  async updateDistribucion(id: number, distribucion: Record<string, number>): Promise<FlujoCajaItem> {
    const response = await apiClient.api.put(`${this.baseUrl}/${id}/distribucion`, {
      distribucion,
      tipo_distribucion: 'PERSONALIZADA'
    });
    return response.data;
  }

  // Consolidated Views
  async getConsolidado(params?: {
    fecha_inicio?: string;
    fecha_fin?: string;
    categoria_principal?: string;
    proyecto?: string;
    tipo_registro?: string;
  }): Promise<FlujoCajaConsolidadoResponse> {
    const response = await apiClient.api.get(`${this.baseUrl}/consolidado/view`, { params });
    return response.data;
  }

  async getDinamico(limit?: number): Promise<FlujoCajaDinamicoResponse> {
    const response = await apiClient.api.get(`${this.baseUrl}/dinamico/view`, {
      params: { limit }
    });
    return response.data;
  }

  // Utility Endpoints
  async getFiltros(): Promise<FlujoCajaFiltros> {
    const response = await apiClient.api.get(`${this.baseUrl}/filtros/disponibles`);
    return response.data;
  }

  async getCategoriasInfo(): Promise<any[]> {
    const response = await apiClient.api.get(`${this.baseUrl}/categorias/info`);
    return response.data;
  }

  async getPeriodos(): Promise<string[]> {
    const response = await apiClient.api.get(`${this.baseUrl}/periodos/disponibles`);
    return response.data.periodos;
  }

  async getResumenCategorias(params?: {
    fecha_inicio?: string;
    fecha_fin?: string;
  }): Promise<Record<string, number>> {
    const response = await apiClient.api.get(`${this.baseUrl}/resumen/categorias`, { params });
    return response.data.resumen;
  }

  // Development/Testing
  async createSampleData(): Promise<any> {
    const response = await apiClient.api.post(`${this.baseUrl}/test/sample-data`);
    return response.data;
  }
}

export const flujoCajaMaestroApi = new FlujoCajaMaestroApi();
export default flujoCajaMaestroApi; 