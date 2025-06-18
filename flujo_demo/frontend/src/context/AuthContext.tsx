import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: number;
  username: string;
  email: string;
  department: string;
  is_active: boolean;
  is_superuser: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (username?: string, password?: string) => Promise<void>;
  logout: () => void;
  getAccessToken: () => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define a mock user
const MOCK_USER: User = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  department: 'any_department',
  is_active: true,
  is_superuser: false,
};

// Define a mock token
const MOCK_TOKEN = 'mock_token_12345';

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

  useEffect(() => {
    // For disabled authentication, always set the mock user
    console.log('[AuthContext] Setting mock user as authentication is disabled.');
    setUser(MOCK_USER);
      setLoading(false);
  }, []);

  const login = async () => {
    try {
    // For disabled authentication, simulate successful login
    console.log('[AuthContext] Mock login successful.');
    setUser(MOCK_USER);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during login');
      throw err;
    }
  };

  const logout = () => {
    // For disabled authentication, clear mock user and navigate to login
    console.log('[AuthContext] Logging out mock user.');
    setUser(null);
    navigate('/login');
  };

  const getAccessToken = async (): Promise<string> => {
    console.log('[AuthContext] Returning mock token as authentication is disabled.');
    return MOCK_TOKEN;
  };

  const value = {
    user,
    loading,
    error,
    login,
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
