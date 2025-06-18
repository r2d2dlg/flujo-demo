import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Spinner,
  Alert,
  AlertIcon,
  Flex,
  useToast,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  VStack,
  useDisclosure,
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import apiClient from '../../api/api';
import type { Cliente, ClienteCreate, ClienteUpdate } from '../../api/api';

const ManageClientesPage = () => {
  const toast = useToast();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure();

  const [formData, setFormData] = useState<Partial<ClienteCreate & ClienteUpdate>>({
    nombre: '',
    ruc: '',
    email: '',
    telefono: '',
    numero_cedula: '',
  });

  const fetchClientes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.clientesApi.getAll();
      setClientes(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al cargar clientes.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const handleOpenModal = (cliente?: Cliente) => {
    if (cliente) {
      setSelectedCliente(cliente);
      setFormData({
        nombre: cliente.nombre,
        ruc: cliente.ruc || '',
        email: cliente.email || '',
        telefono: cliente.telefono || '',
        numero_cedula: cliente.numero_cedula || '',
      });
    } else {
      setSelectedCliente(null);
      setFormData({ nombre: '', ruc: '', email: '', telefono: '', numero_cedula: '' });
    }
    onModalOpen();
  };

  const handleModalClose = () => {
    onModalClose();
    setSelectedCliente(null);
    setFormData({ nombre: '', ruc: '', email: '', telefono: '', numero_cedula: '' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      const payload = {
        nombre: formData.nombre || '',
        ruc: formData.ruc || undefined,
        email: formData.email || undefined,
        telefono: formData.telefono || undefined,
        numero_cedula: formData.numero_cedula || undefined,
      };

      if (!payload.nombre) {
        toast({ title: 'Nombre es requerido', status: 'error' });
        setIsSaving(false);
        return;
      }

      if (selectedCliente) {
        // Update
        await apiClient.clientesApi.update(selectedCliente.id, payload as ClienteUpdate);
        toast({ title: 'Cliente actualizado', status: 'success' });
      } else {
        // Create
        await apiClient.clientesApi.create(payload as ClienteCreate);
        toast({ title: 'Cliente creado', status: 'success' });
      }
      fetchClientes();
      handleModalClose();
    } catch (err: any) {
      toast({ title: 'Error al guardar cliente', description: err.response?.data?.detail || err.message, status: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (clienteId: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar este cliente? Esta acción no se puede deshacer y podría afectar registros existentes.')) {
      try {
        await apiClient.clientesApi.deleteById(clienteId);
        toast({ title: 'Cliente eliminado', status: 'success' });
        fetchClientes();
      } catch (err: any) {
        toast({ title: 'Error al eliminar cliente', description: err.response?.data?.detail || 'El cliente podría estar en uso.', status: 'error' });
      }
    }
  };

  if (isLoading) return <Spinner />;
  if (error) return <Alert status="error"><AlertIcon />{error}</Alert>;

  return (
    <Box p={5}>
      <Flex justifyContent="space-between" alignItems="center" mb={5}>
        <Heading>Administrar Clientes</Heading>
        <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={() => handleOpenModal()}>
          Agregar Cliente
        </Button>
      </Flex>

      <TableContainer>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>ID</Th><Th>Nombre</Th><Th>RUC</Th><Th>Cédula</Th><Th>Email</Th><Th>Teléfono</Th><Th>Acciones</Th>
            </Tr>
          </Thead>
          <Tbody>
            {clientes.map((cliente) => (
              <Tr key={cliente.id}>
                <Td>{cliente.id}</Td>
                <Td>{cliente.nombre}</Td>
                <Td>{cliente.ruc || '-'}</Td>
                <Td>{cliente.numero_cedula || '-'}</Td>
                <Td>{cliente.email || '-'}</Td>
                <Td>{cliente.telefono || '-'}</Td>
                <Td>
                  <IconButton aria-label="Editar" icon={<EditIcon />} onClick={() => handleOpenModal(cliente)} mr={2} size="sm" />
                  <IconButton aria-label="Eliminar" icon={<DeleteIcon />} colorScheme="red" onClick={() => handleDelete(cliente.id)} size="sm" />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>

      <Modal isOpen={isModalOpen} onClose={handleModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{selectedCliente ? 'Editar Cliente' : 'Agregar Nuevo Cliente'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Nombre</FormLabel>
                <Input name="nombre" value={formData.nombre} onChange={handleInputChange} placeholder="Nombre del cliente" />
              </FormControl>
              <FormControl>
                <FormLabel>RUC</FormLabel>
                <Input name="ruc" value={formData.ruc} onChange={handleInputChange} placeholder="RUC (Opcional)" />
              </FormControl>
              <FormControl>
                <FormLabel>Número de Cédula</FormLabel>
                <Input name="numero_cedula" value={formData.numero_cedula} onChange={handleInputChange} placeholder="Número de Cédula (Opcional)" />
              </FormControl>
              <FormControl>
                <FormLabel>Email</FormLabel>
                <Input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Email (Opcional)" />
              </FormControl>
              <FormControl>
                <FormLabel>Teléfono</FormLabel>
                <Input name="telefono" value={formData.telefono} onChange={handleInputChange} placeholder="Teléfono (Opcional)" />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleSubmit} isLoading={isSaving}>
              Guardar
            </Button>
            <Button onClick={handleModalClose}>Cancelar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ManageClientesPage; 