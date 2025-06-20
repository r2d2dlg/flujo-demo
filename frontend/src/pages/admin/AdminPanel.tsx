import React, { useState, useEffect } from 'react';
import { 
  Box, 
  VStack, 
  HStack, 
  Heading, 
  Text, 
  Card, 
  CardHeader, 
  CardBody,
  Button,
  Input,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  IconButton,
  FormControl,
  FormLabel,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Alert,
  AlertIcon,
  AlertDescription,
  useToast,
  Spinner,
  Center,
  useColorModeValue,
  Flex,
  Container,
  Divider
} from '@chakra-ui/react';
import { 
  FaUsers, 
  FaUserPlus, 
  FaCrown, 
  FaUserCheck, 
  FaUserSlash,
  FaArrowLeft,
  FaShieldAlt
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../api/api';
import { Link } from 'react-router-dom';

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
  const [creating, setCreating] = useState(false);
  const toast = useToast();
  
  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const bgGradient = "linear(to-r, purple.600, blue.600)";

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
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Error al cargar usuarios',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password) {
      toast({
        title: 'Error',
        description: 'Usuario y contraseña son obligatorios',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setCreating(true);
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
        toast({
          title: 'Usuario Creado',
          description: result.message,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        setNewUser({ username: '', email: '', password: '', role: 'user' });
        fetchUsers();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Error al crear usuario',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Error al crear usuario',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setCreating(false);
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
        toast({
          title: 'Estado Actualizado',
          description: result.message,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        fetchUsers();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Error al actualizar estado',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Error al actualizar estado del usuario',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
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
        toast({
          title: 'Rol Actualizado',
          description: result.message,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        fetchUsers();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Error al actualizar rol',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        fetchUsers();
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Error al actualizar rol del usuario',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      fetchUsers();
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'green' : 'red';
  };

  const getRoleColor = (role: string) => {
    return role === 'admin' ? 'purple' : 'blue';
  };

  // Calculate statistics
  const activeUsers = users.filter(u => u.is_active).length;
  const adminUsers = users.filter(u => u.role === 'admin').length;
  const normalUsers = users.filter(u => u.role === 'user').length;
  const inactiveUsers = users.filter(u => !u.is_active).length;

  if (!isAdmin) {
    return (
      <Container maxW="container.md" py={20}>
        <Center>
          <Card maxW="md" bg={cardBg} borderColor={borderColor}>
            <CardBody textAlign="center" p={8}>
              <FaShieldAlt size={48} color="red" style={{ margin: '0 auto 16px' }} />
              <Heading size="lg" color="red.500" mb={4}>
                Acceso Denegado
              </Heading>
              <Text color="gray.600" mb={6}>
                No tienes permisos para acceder al panel de administración.
              </Text>
              <Button as={Link} to="/" leftIcon={<FaArrowLeft />} colorScheme="purple">
                Volver al Dashboard
              </Button>
            </CardBody>
          </Card>
        </Center>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxW="container.xl" py={20}>
        <Center>
          <VStack spacing={4}>
            <Spinner size="xl" color="purple.500" thickness="4px" />
            <Text fontSize="lg" color="gray.600">Cargando panel de administración...</Text>
          </VStack>
        </Center>
      </Container>
    );
  }

  return (
    <Box minH="100vh" bg="gray.50" py={8}>
      <Container maxW="container.xl">
        {/* Header */}
        <Card mb={8} bg={cardBg} borderColor={borderColor}>
          <CardBody bgGradient={bgGradient} color="white" borderRadius="md">
            <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
              <VStack align="start" spacing={2}>
                <HStack spacing={3}>
                  <Button
                    as={Link}
                    to="/"
                    leftIcon={<FaArrowLeft />}
                    variant="ghost"
                    color="white"
                    _hover={{ bg: "whiteAlpha.200" }}
                  >
                    Dashboard
                  </Button>
                  <Divider orientation="vertical" h={6} />
                  <HStack spacing={3}>
                    <FaUsers size={32} />
                    <Box>
                      <Heading size="lg">Panel de Administración</Heading>
                      <Text opacity={0.9}>Gestiona usuarios y permisos del sistema financiero</Text>
                    </Box>
                  </HStack>
                </HStack>
              </VStack>
              <VStack align="end" spacing={1}>
                <Text fontSize="sm" opacity={0.8}>Conectado como:</Text>
                <HStack spacing={2}>
                  <Text fontSize="lg" fontWeight="bold">{currentUser?.username}</Text>
                  <FaCrown color="gold" />
                </HStack>
              </VStack>
            </Flex>
          </CardBody>
        </Card>

        {/* Statistics */}
        <Card mb={8} bg={cardBg} borderColor={borderColor}>
          <CardHeader>
            <Heading size="md" color="purple.600">
              📊 Estadísticas del Sistema
            </Heading>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={6}>
              <Stat>
                <StatLabel color="gray.600">Usuarios Activos</StatLabel>
                <StatNumber color="green.500" fontSize="3xl">{activeUsers}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel color="gray.600">Administradores</StatLabel>
                <StatNumber color="purple.500" fontSize="3xl">{adminUsers}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel color="gray.600">Usuarios Normales</StatLabel>
                <StatNumber color="blue.500" fontSize="3xl">{normalUsers}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel color="gray.600">Usuarios Inactivos</StatLabel>
                <StatNumber color="red.500" fontSize="3xl">{inactiveUsers}</StatNumber>
              </Stat>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Create User Form */}
        <Card mb={8} bg={cardBg} borderColor={borderColor}>
          <CardHeader bgGradient={bgGradient} color="white" borderTopRadius="md">
            <HStack spacing={3}>
              <FaUserPlus />
              <Heading size="md">Crear Nuevo Usuario</Heading>
            </HStack>
          </CardHeader>
          <CardBody>
            <Box as="form" onSubmit={handleCreateUser}>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} mb={6}>
                <FormControl isRequired>
                  <FormLabel color="gray.700" fontWeight="semibold">Usuario</FormLabel>
                  <Input
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    placeholder="Nombre de usuario"
                    focusBorderColor="purple.500"
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel color="gray.700" fontWeight="semibold">Email</FormLabel>
                  <Input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="correo@ejemplo.com"
                    focusBorderColor="purple.500"
                  />
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel color="gray.700" fontWeight="semibold">Contraseña</FormLabel>
                  <Input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Contraseña segura"
                    focusBorderColor="purple.500"
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel color="gray.700" fontWeight="semibold">Rol</FormLabel>
                  <Select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    focusBorderColor="purple.500"
                  >
                    <option value="user">Usuario</option>
                    <option value="admin">Administrador</option>
                  </Select>
                </FormControl>
              </SimpleGrid>
              
              <Button
                type="submit"
                colorScheme="purple"
                leftIcon={<FaUserPlus />}
                isLoading={creating}
                loadingText="Creando usuario..."
                size="lg"
              >
                Crear Usuario
              </Button>
            </Box>
          </CardBody>
        </Card>

        {/* Users Management Table */}
        <Card bg={cardBg} borderColor={borderColor}>
          <CardHeader bgGradient={bgGradient} color="white" borderTopRadius="md">
            <HStack justify="space-between">
              <HStack spacing={3}>
                <FaUsers />
                <Heading size="md">Gestión de Usuarios ({users.length})</Heading>
              </HStack>
              <Button
                size="sm"
                variant="ghost"
                color="white"
                _hover={{ bg: "whiteAlpha.200" }}
                onClick={fetchUsers}
              >
                🔄 Actualizar
              </Button>
            </HStack>
          </CardHeader>
          <CardBody p={0}>
            <TableContainer>
              <Table variant="simple">
                <Thead bg="gray.50">
                  <Tr>
                    <Th color="gray.600">ID</Th>
                    <Th color="gray.600">Usuario</Th>
                    <Th color="gray.600">Email</Th>
                    <Th color="gray.600">Rol</Th>
                    <Th color="gray.600">Estado</Th>
                    <Th color="gray.600">Creado</Th>
                    <Th color="gray.600">Último Login</Th>
                    <Th color="gray.600">Acciones</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {users.map((user) => (
                    <Tr key={user.id} _hover={{ bg: "gray.50" }}>
                      <Td fontWeight="bold" color="gray.700">{user.id}</Td>
                      <Td>
                        <HStack spacing={2}>
                          <Text fontWeight="semibold" color="gray.800">{user.username}</Text>
                          {user.role === 'admin' && (
                            <FaCrown color="gold" title="Administrador" />
                          )}
                        </HStack>
                      </Td>
                      <Td color="gray.600">{user.email || 'N/A'}</Td>
                      <Td>
                        <Select
                          size="sm"
                          value={user.role}
                          onChange={(e) => handleUpdateUserRole(user.id, e.target.value)}
                          width="auto"
                          colorScheme={getRoleColor(user.role)}
                        >
                          <option value="user">Usuario</option>
                          <option value="admin">Administrador</option>
                        </Select>
                      </Td>
                      <Td>
                        <Badge colorScheme={getStatusColor(user.is_active)} variant="solid">
                          {user.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </Td>
                      <Td color="gray.600" fontSize="sm">
                        {formatDate(user.created_at)}
                      </Td>
                      <Td color="gray.600" fontSize="sm">
                        {formatDate(user.last_login)}
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          {user.is_active ? (
                            <IconButton
                              aria-label="Desactivar usuario"
                              icon={<FaUserSlash />}
                              size="sm"
                              colorScheme="red"
                              variant="outline"
                              onClick={() => handleUpdateUserStatus(user.id, false)}
                              title="Desactivar usuario"
                            />
                          ) : (
                            <IconButton
                              aria-label="Activar usuario"
                              icon={<FaUserCheck />}
                              size="sm"
                              colorScheme="green"
                              variant="outline"
                              onClick={() => handleUpdateUserStatus(user.id, true)}
                              title="Activar usuario"
                            />
                          )}
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
            
            {users.length === 0 && (
              <Center py={10}>
                <VStack spacing={3}>
                  <FaUsers size={48} color="gray" />
                  <Text color="gray.500">No hay usuarios registrados</Text>
                </VStack>
              </Center>
            )}
          </CardBody>
        </Card>
      </Container>
    </Box>
  );
};

export default AdminPanel; 