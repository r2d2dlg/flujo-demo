import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Box, Button, Input, Stack, Heading, Text, Link, useToast, Select } from '@chakra-ui/react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (!department) {
        throw new Error('Por favor selecciona un departamento');
      }
      await register(username, password, department);
      toast({
        title: 'Registro exitoso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: 'Error en el registro',
        description: 'No se pudo crear la cuenta. Por favor, inténtalo de nuevo.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box p={8} maxW="md" mx="auto">
      <Stack spacing={4} as="form" onSubmit={handleSubmit}>
        <Heading mb={6} textAlign="center">Registro</Heading>
        <Box>
          <Text mb={2} fontWeight="medium">Departamento</Text>
          <Select
            placeholder="Selecciona un departamento"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            mb={4}
            required
          >
            <option value="Administracion">Administración</option>
            <option value="Mercadeo">Mercadeo</option>
            <option value="Contabilidad">Contabilidad</option>
            <option value="Operacion">Operación</option>
            <option value="Ventas">Ventas</option>
          </Select>
          <Text mb={2} fontWeight="medium">Nombre de usuario</Text>
          <Input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Elige un nombre de usuario"
            required
          />
        </Box>
        <Box>
          <Text mb={2} fontWeight="medium">Contraseña</Text>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Crea una contraseña"
            required
          />
        </Box>
        <Button
          type="submit"
          colorScheme="blue"
          width="100%"
          isLoading={isLoading}
          loadingText="Registrando..."
          mt={4}
        >
          Registrarse
        </Button>
        <Text textAlign="center" mt={4}>
          ¿Ya tienes una cuenta?{' '}
          <Link as={RouterLink} to="/login" color="blue.500" textDecoration="underline">
            Inicia sesión aquí
          </Link>
        </Text>
      </Stack>
    </Box>
  );
}
