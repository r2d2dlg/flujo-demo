import React, { useState } from 'react';
import {
  Button,
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
  useToast,
} from '@chakra-ui/react';
import { clientesApi } from '../api/api';
import type { Cliente, ClienteCreate } from '../api/api';

interface CreateClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClienteCreated: (newCliente: Cliente) => void;
}

const CreateClienteModal: React.FC<CreateClienteModalProps> = ({ isOpen, onClose, onClienteCreated }) => {
  const toast = useToast();
  const [newCliente, setNewCliente] = useState<ClienteCreate>({
    nombre: '',
    ruc: '',
    email: '',
    telefono: '',
    numero_cedula: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewCliente(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!newCliente.nombre) {
      toast({
        title: 'Campo Requerido',
        description: 'El nombre del cliente es obligatorio.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const payload: ClienteCreate = {
      nombre: newCliente.nombre,
      ruc: newCliente.ruc || undefined,
      email: newCliente.email || undefined,
      telefono: newCliente.telefono || undefined,
      numero_cedula: newCliente.numero_cedula || undefined,
    };

    setIsSubmitting(true);
    try {
      const response = await clientesApi.create(payload);
      toast({
        title: 'Cliente Creado',
        description: 'El nuevo cliente ha sido creado exitosamente.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      onClienteCreated(response.data);
      // Reset form state is handled by closing and reopening if needed, or can be done here explicitly
      setNewCliente({
        nombre: '',
        ruc: '',
        email: '',
        telefono: '',
        numero_cedula: '',
      });
    } catch (error: any) {
      console.error("Error creating cliente:", error);
      const errorMessage = error.response?.data?.detail || 'Hubo un error al crear el cliente.';
      toast({
        title: 'Error al Crear Cliente',
        description: typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage),
        status: 'error',
        duration: 7000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Crear Nuevo Cliente</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Nombre del Cliente</FormLabel>
              <Input name="nombre" value={newCliente.nombre} onChange={handleChange} placeholder="Ej: John Doe" />
            </FormControl>
            <FormControl>
              <FormLabel>RUC / ID</FormLabel>
              <Input name="ruc" value={newCliente.ruc} onChange={handleChange} placeholder="Ej: 123456-7-891011" />
            </FormControl>
            <FormControl>
              <FormLabel>Número de Cédula</FormLabel>
              <Input name="numero_cedula" value={newCliente.numero_cedula} onChange={handleChange} placeholder="Ej: 8-123-456" />
            </FormControl>
            <FormControl>
              <FormLabel>Email</FormLabel>
              <Input type="email" name="email" value={newCliente.email} onChange={handleChange} placeholder="Ej: john.doe@example.com" />
            </FormControl>
            <FormControl>
              <FormLabel>Teléfono</FormLabel>
              <Input type="tel" name="telefono" value={newCliente.telefono} onChange={handleChange} placeholder="Ej: 6677-8899" />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancelar
          </Button>
          <Button colorScheme="blue" onClick={handleSubmit} isLoading={isSubmitting}>
            Crear Cliente
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateClienteModal; 