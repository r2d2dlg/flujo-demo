import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom'; // Import Link
import apiClient from '../../api/api'; // Adjust path if api.ts is located elsewhere
import type { Vendedor } from '../../api/api'; // Adjust path for Vendedor interface

// Basic styling (can be replaced with your UI library components e.g., Chakra UI, Material UI)
const styles = {
  container: { padding: '20px', fontFamily: 'Arial, sans-serif' },
  heading: { marginBottom: '20px' },
  list: { listStyleType: 'none', padding: 0 },
  listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #eee' },
  deleteButton: { marginLeft: '10px', padding: '5px 10px', backgroundColor: 'red', color: 'white', border: 'none', cursor: 'pointer' },
  form: { marginTop: '20px', display: 'flex', alignItems: 'center' },
  input: { marginRight: '10px', padding: '8px', flexGrow: 1 },
  addButton: { padding: '8px 15px', backgroundColor: 'green', color: 'white', border: 'none', cursor: 'pointer' },
  error: { color: 'red', marginTop: '10px' },
  loading: { marginTop: '10px' },
};

const ManageVendedoresPage: React.FC = () => {
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [newVendedorName, setNewVendedorName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVendedores = useCallback(async () => {
    console.log('[ManageVendedoresPage] fetchVendedores called. apiClient:', apiClient);
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.vendedoresApi.getAll();
      console.log('[ManageVendedoresPage] Response from apiClient.vendedoresApi.getAll():', response);
      setVendedores(response.data);
    } catch (err) {
      setError('Failed to fetch vendedores. Please try again.');
      console.error(err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchVendedores();
  }, [fetchVendedores]);

  const handleAddVendedor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendedorName.trim()) {
      setError('Salesperson name cannot be empty.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await apiClient.vendedoresApi.create(newVendedorName.trim());
      setNewVendedorName(''); // Clear input
      fetchVendedores(); // Refresh the list
    } catch (err) {
      setError('Failed to add salesperson. Please try again.');
      console.error(err);
    }
    setLoading(false);
  };

  const handleDeleteVendedor = async (vendedorId: number) => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.vendedoresApi.delete(vendedorId);
      fetchVendedores(); // Refresh the list
    } catch (err) {
      setError('Failed to delete salesperson. Please try again.');
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Manage Salespeople</h1>

      <div style={{ marginBottom: '20px' }}>
        <Link to="/ventas/gestionar-tabla-comisiones">Back to Sales Commissions Table</Link>
      </div>

      {loading && <p style={styles.loading}>Loading...</p>}
      {error && <p style={styles.error}>{error}</p>}

      <form onSubmit={handleAddVendedor} style={styles.form}>
        <input
          type="text"
          value={newVendedorName}
          onChange={(e) => setNewVendedorName(e.target.value)}
          placeholder="Enter salesperson name"
          style={styles.input}
        />
        <button type="submit" style={styles.addButton} disabled={loading}>
          Add Salesperson
        </button>
      </form>

      <ul style={styles.list}>
        {vendedores.map((vendedor) => (
          <li key={vendedor.id} style={styles.listItem}>
            <span>{vendedor.nombre} (ID: {vendedor.id})</span>
            <button 
              onClick={() => handleDeleteVendedor(vendedor.id)} 
              style={styles.deleteButton}
              disabled={loading}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ManageVendedoresPage; 