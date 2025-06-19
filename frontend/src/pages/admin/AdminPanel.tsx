import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../api/api';

interface User {
  id: number;
  username: string;
  email?: string;
  role: string;
  is_active: boolean;
  created_at?: string;
  last_login?: string;
  updated_at: string;
}

const AdminPanel: React.FC = () => {
  const { user: currentUser, getAccessToken } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state for creating new user
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user'
  });

  // Check if current user is admin
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) {
      setError('No tienes permisos para acceder al panel de administración');
      setLoading(false);
      return;
    }
    fetchUsers();
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      const token = await getAccessToken();
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const usersData = await response.json();
        setUsers(usersData);
      } else {
        throw new Error('Error al obtener usuarios');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (message: string, isError: boolean = false) => {
    if (isError) {
      setError(message);
      setSuccessMessage(null);
    } else {
      setSuccessMessage(message);
      setError(null);
    }
    setTimeout(() => {
      setError(null);
      setSuccessMessage(null);
    }, 5000);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await getAccessToken();
      const response = await fetch(`${API_BASE_URL}/api/admin/create-user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newUser)
      });

      const result = await response.json();
      
      if (result.success) {
        showMessage('Usuario creado exitosamente');
        setNewUser({ username: '', email: '', password: '', role: 'user' });
        fetchUsers(); // Refresh users list
      } else {
        showMessage(result.error || 'Error al crear usuario', true);
      }
    } catch (err) {
      showMessage('Error al crear usuario', true);
    }
  };

  const handleUpdateUserStatus = async (userId: number, isActive: boolean) => {
    const action = isActive ? 'activar' : 'desactivar';
    if (!window.confirm(`¿Está seguro de ${action} este usuario?`)) return;

    try {
      const token = await getAccessToken();
      const formData = new FormData();
      formData.append('user_id', userId.toString());
      formData.append('is_active', isActive.toString());

      const response = await fetch(`${API_BASE_URL}/api/admin/update-user-status`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();
      
      if (result.success) {
        showMessage(result.message);
        fetchUsers(); // Refresh users list
      } else {
        showMessage(result.error || 'Error al actualizar estado', true);
      }
    } catch (err) {
      showMessage('Error al actualizar estado del usuario', true);
    }
  };

  const handleUpdateUserRole = async (userId: number, role: string) => {
    if (!window.confirm('¿Está seguro de cambiar el rol de este usuario?')) return;

    try {
      const token = await getAccessToken();
      const formData = new FormData();
      formData.append('user_id', userId.toString());
      formData.append('role', role);

      const response = await fetch(`${API_BASE_URL}/api/admin/update-user-role`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();
      
      if (result.success) {
        showMessage(result.message);
        fetchUsers(); // Refresh users list
      } else {
        showMessage(result.error || 'Error al actualizar rol', true);
        fetchUsers(); // Refresh to reset the select
      }
    } catch (err) {
      showMessage('Error al actualizar rol del usuario', true);
      fetchUsers(); // Refresh to reset the select
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h2>
          <p className="text-gray-600">No tienes permisos para acceder al panel de administración.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-lg mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <i className="fas fa-users-cog mr-3"></i>
                Panel de Administración
              </h1>
              <p className="mt-2 opacity-90">Gestiona usuarios y permisos del sistema financiero</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-75">Conectado como:</p>
              <p className="text-lg font-semibold">{currentUser?.username}</p>
            </div>
          </div>
        </div>

        {/* Flash Messages */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <i className="fas fa-exclamation-triangle mr-2"></i>
            {error}
          </div>
        )}
        
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            <i className="fas fa-check-circle mr-2"></i>
            {successMessage}
          </div>
        )}

        {/* Create User Form */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg">
            <h2 className="text-xl font-bold flex items-center">
              <i className="fas fa-user-plus mr-2"></i>
              Crear Nuevo Usuario
            </h2>
          </div>
          <div className="p-6">
            <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Usuario*
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña*
                </label>
                <input
                  type="password"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rol
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <option value="user">Usuario</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="md:col-span-4">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-md hover:from-blue-700 hover:to-purple-700 transition-colors"
                >
                  <i className="fas fa-plus mr-2"></i>
                  Crear Usuario
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Users Management Table */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg">
            <h2 className="text-xl font-bold flex items-center">
              <i className="fas fa-users mr-2"></i>
              Gestión de Usuarios
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Creado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Último Login</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-900">{user.username}</span>
                        {user.role === 'admin' && (
                          <i className="fas fa-crown text-yellow-500 ml-2" title="Administrador"></i>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.email || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                        value={user.role}
                        onChange={(e) => handleUpdateUserRole(user.id, e.target.value)}
                      >
                        <option value="user">Usuario</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('es-ES') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.last_login ? new Date(user.last_login).toLocaleDateString('es-ES') : 'Nunca'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {user.is_active ? (
                        <button
                          onClick={() => handleUpdateUserStatus(user.id, false)}
                          className="text-yellow-600 hover:text-yellow-900 mr-2"
                          title="Desactivar usuario"
                        >
                          <i className="fas fa-user-slash"></i>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateUserStatus(user.id, true)}
                          className="text-green-600 hover:text-green-900 mr-2"
                          title="Activar usuario"
                        >
                          <i className="fas fa-user-check"></i>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg">
            <h2 className="text-xl font-bold flex items-center">
              <i className="fas fa-chart-bar mr-2"></i>
              Estadísticas del Sistema
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <h3 className="text-2xl font-bold text-blue-600">
                  {users.filter(u => u.is_active).length}
                </h3>
                <p className="text-sm text-gray-500">Usuarios Activos</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <h3 className="text-2xl font-bold text-yellow-600">
                  {users.filter(u => u.role === 'admin').length}
                </h3>
                <p className="text-sm text-gray-500">Administradores</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <h3 className="text-2xl font-bold text-green-600">
                  {users.filter(u => u.role === 'user').length}
                </h3>
                <p className="text-sm text-gray-500">Usuarios Normales</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <h3 className="text-2xl font-bold text-gray-600">
                  {users.filter(u => !u.is_active).length}
                </h3>
                <p className="text-sm text-gray-500">Usuarios Inactivos</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel; 