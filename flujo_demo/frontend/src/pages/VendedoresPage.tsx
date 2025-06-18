import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  useToast,
  IconButton,
  HStack,
  Spinner,
  Center,
  TableContainer,
} from '@chakra-ui/react';
import { DeleteIcon } from '@chakra-ui/icons';
import { api } from '../api/api';

interface Vendedor {
  id: number;
  nombre: string;
}

const VendedoresPage = () => {
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [newVendedorName, setNewVendedorName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  const fetchVendedores = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/vendedores/');
      setVendedores(response.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los vendedores.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVendedores();
  }, []);

  const handleAddVendedor = async () => {
    if (!newVendedorName.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre del vendedor no puede estar vacío.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    try {
      const response = await api.post('/api/vendedores/', { nombre: newVendedorName });
      setVendedores([...vendedores, response.data]);
      setNewVendedorName('');
      toast({
        title: 'Vendedor agregado',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo agregar el vendedor.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDeleteVendedor = async (id: number) => {
    try {
      await api.delete(`/api/vendedores/${id}`);
      setVendedores(vendedores.filter((v) => v.id !== id));
      toast({
        title: 'Vendedor eliminado',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el vendedor.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box p={8}>
      <Stack spacing={6}>
        <Heading>Gestionar Vendedores</Heading>
        <HStack>
          <FormControl>
            <FormLabel>Nombre del Vendedor</FormLabel>
            <Input
              value={newVendedorName}
              onChange={(e) => setNewVendedorName(e.target.value)}
              placeholder="Ej. Juan Pérez"
            />
          </FormControl>
          <Button onClick={handleAddVendedor} colorScheme="blue" alignSelf="flex-end">
            Agregar
          </Button>
        </HStack>
        {isLoading ? (
          <Center>
            <Spinner />
          </Center>
        ) : (
          <TableContainer>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>ID</Th>
                  <Th>Nombre</Th>
                  <Th>Acciones</Th>
                </Tr>
              </Thead>
              <Tbody>
                {vendedores.map((vendedor) => (
                  <Tr key={vendedor.id}>
                    <Td>{vendedor.id}</Td>
                    <Td>{vendedor.nombre}</Td>
                    <Td>
                      <IconButton
                        aria-label="Eliminar vendedor"
                        icon={<DeleteIcon />}
                        colorScheme="red"
                        onClick={() => handleDeleteVendedor(vendedor.id)}
                      />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        )}
      </Stack>
    </Box>
  );
};

export default VendedoresPage; 