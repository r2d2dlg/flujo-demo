import { api } from './api';

// Use the api instance directly
const apiClient = api;

export interface TableData {
  data: any[];
  columns: string[];
}

const createProjectApi = (project: 'chepo' | 'tanara') => ({
  // Get all tables for the project
  getTables: async (): Promise<{ tables: string[] }> => {
    const response = await apiClient.get(`/api/marketing/${project}/tables`);
    return response.data;
  },

  // Get table data (for editing) - raw data exactly as it exists in database
  getTableData: async (tableName: string): Promise<TableData> => {
    const response = await apiClient.get(`/api/marketing/${project}/table/${tableName}/raw`);
    return response.data;
  },

  // Get view data (read-only)
  getViewData: async (viewName: string): Promise<TableData> => {
    const response = await apiClient.get(`/api/marketing/${project}/view/${viewName}`);
    return response.data;
  },

  // Update table row with raw data
  updateTableRow: async (tableName: string, rowId: string, data: any) => {
    const response = await apiClient.put(
      `/api/marketing/${project}/table/${tableName}/${rowId}/raw`,
      data
    );
    return response.data;
  },

  // Get all views for the project
  getViews: async (): Promise<{ views: string[] }> => {
    const response = await apiClient.get(`/api/marketing/${project}/views`);
    return response.data;
  }
});

export const marketingApi = {
  chepo: createProjectApi('chepo'),
  tanara: createProjectApi('tanara')
};

export default marketingApi;
