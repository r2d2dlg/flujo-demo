import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../api/api';

interface User {
  id: number;
  username: string;
  email?: string;
  department?: string;
  role: string;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, department?: string, email?: string) => Promise<void>;
  logout: () => void;
  getAccessToken: () => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const response = await fetch(`${API_BASE_URL}/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            // Token is invalid, remove it
            localStorage.removeItem('access_token');
          }
        } catch (err) {
          console.error('Auth check failed:', err);
          localStorage.removeItem('access_token');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setError(null);
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Credenciales incorrectas');
      }

      const { access_token } = await response.json();
      localStorage.setItem('access_token', access_token);

      // Fetch user data
      const userResponse = await fetch(`${API_BASE_URL}/me`, {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData);
        navigate('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error durante el login');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username: string, password: string, department?: string, email?: string) => {
    try {
      setError(null);
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username, 
          password, 
          department: department || '',
          email: email || '',
          role: 'user'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error durante el registro');
      }

      const { access_token } = await response.json();
      localStorage.setItem('access_token', access_token);

      // Fetch user data
      const userResponse = await fetch(`${API_BASE_URL}/me`, {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData);
        navigate('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error durante el registro');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
    navigate('/login');
  };

  const getAccessToken = async (): Promise<string> => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No access token available');
    }
    return token;
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    getAccessToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
