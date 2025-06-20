import { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Input,
  FormControl,
  FormLabel,
  useToast,
  VStack,
  HStack,
  Alert,
  AlertIcon,
  Box,
  Text,
  Code,
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { API_BASE_URL } from '../api/api';


interface CreateTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTableCreated: (projectId: string) => void;
}

export default function CreateTableModal({ isOpen, onClose, onTableCreated }: CreateTableModalProps) {
  const [projectKeyword, setProjectKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  const handleCreateTable = async () => {
    const trimmedKeyword = projectKeyword.trim();
    if (!trimmedKeyword) {
      setError('El nombre clave del proyecto es requerido');
      return;
    }

    // Basic validation for the keyword: only allow alphanumeric, no spaces after trim
    if (!/^[a-zA-Z0-9_]+$/.test(trimmedKeyword)) {
      setError('El nombre clave solo puede contener letras y números, sin espacios ni caracteres especiales.');
      return;
    }

    const finalKeyword = trimmedKeyword.toLowerCase();

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_keyword: finalKeyword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al crear el proyecto');
      }

      toast({
        title: '¡Proyecto creado!',
        description: `El proyecto "Proyecto ${trimmedKeyword}" y sus tablas asociadas han sido creados exitosamente.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      setProjectKeyword('');
      onClose();
      
      onTableCreated(`proyecto_${finalKeyword}`);
      
    } catch (error: any) {
      console.error('Error creating project:', error);
      setError(error.message || 'Error al crear el proyecto. Por favor, inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Crear Nuevo Proyecto y Tablas</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Nombre Clave del Proyecto (ej: Colombia, Chepo)</FormLabel>
                <Input
                  placeholder="Ej: Colombia"
                  value={projectKeyword}
                  onChange={(e) => {
                    setProjectKeyword(e.target.value);
                    setError('');
                  }}
                  isInvalid={!!error}
                />
              </FormControl>
              {error && (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  {error}
                </Alert>
              )}
              <Alert status="info" borderRadius="md" width="100%">
                <AlertIcon />
                <Box flex="1"> 
                  <Text fontSize="sm">
                    Se crearán automáticamente tablas para el proyecto "Proyecto <b>{projectKeyword || '(nombre clave)'}</b>" usando el nombre clave ingresado.
                  </Text>
                  <Text fontSize="sm" mt={2}>
                    Por ejemplo, si ingresa "colombia", se crearán tablas como:
                  </Text>
                  <Code fontSize="xs" mt={1} p={1} borderRadius="md" display="block" whiteSpace="normal">
                    <i>presupuesto_mercadeo_<b>colombia</b>_casa_modelo</i>
                  </Code>
                </Box>
              </Alert>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack spacing={3}>
              <Button variant="outline" onClick={onClose} isDisabled={isLoading}>
                Cancelar
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleCreateTable}
                isLoading={isLoading}
                loadingText="Creando Proyecto..."
              >
                Crear Proyecto y Tablas
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
