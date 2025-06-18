import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Box, Button, Input, VStack, Heading, Text } from '@chakra-ui/react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Usuario o contraseña incorrectos');
      console.error('Error de inicio de sesión:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box p={8} maxW="md" mx="auto">
      <VStack as="form" onSubmit={handleSubmit} gap={4} align="stretch">
        <Heading mb={6} textAlign="center">Iniciar Sesión</Heading>
        
        {error && (
          <Box color="red.500" textAlign="center" mb={4}>
            {error}
          </Box>
        )}
        
        <Box>
          <Text mb={2} fontWeight="medium">Nombre de usuario</Text>
          <Input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Ingresa tu nombre de usuario"
            required
          />
        </Box>
        
        <Box>
          <Text mb={2} fontWeight="medium">Contraseña</Text>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Ingresa tu contraseña"
            required
          />
        </Box>
        
        <Button
          type="submit"
          colorScheme="blue"
          width="100%"
          isLoading={isLoading}
          loadingText="Iniciando sesión..."
          mt={4}
        >
          Iniciar Sesión
        </Button>
        
        <Text textAlign="center" mt={4}>
          ¿No tienes una cuenta?{' '}
          <RouterLink to="/register" style={{ color: '#3182ce', textDecoration: 'underline' }}>
            Regístrate aquí
          </RouterLink>
        </Text>
      </VStack>
    </Box>
  );
}
