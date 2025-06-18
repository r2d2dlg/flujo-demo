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
  List,
  ListItem,
  ListIcon,
} from '@chakra-ui/react';
import { AddIcon, CheckIcon } from '@chakra-ui/icons';
import { api } from '../api/api';

interface CreateComprehensiveProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (projectKeyword: string) => void;
}

export default function CreateComprehensiveProjectModal({ 
  isOpen, 
  onClose, 
  onProjectCreated 
}: CreateComprehensiveProjectModalProps) {
  const [projectName, setProjectName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  const handleCreateProject = async () => {
    const trimmedName = projectName.trim();
    if (!trimmedName) {
      setError('El nombre del proyecto es requerido');
      return;
    }

    // Basic validation for the name: only allow alphanumeric and spaces
    if (!/^[a-zA-Z0-9\s_-]+$/.test(trimmedName)) {
      setError('El nombre del proyecto solo puede contener letras, números, espacios, guiones y guiones bajos.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/api/projects/create-comprehensive', {
        project_name: trimmedName,
      });

      const data = response.data;

      toast({
        title: '¡Proyecto Completo Creado!',
        description: `El proyecto "${trimmedName}" ha sido creado con todas las tablas y datos iniciales.`,
        status: 'success',
        duration: 8000,
        isClosable: true,
      });

      setProjectName('');
      onClose();
      
      // Notify parent component
      onProjectCreated(data.project_keyword);
      
    } catch (error: any) {
      console.error('Error creating comprehensive project:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Error al crear el proyecto completo.';
      setError(errorMessage);
      toast({
        title: 'Error al crear proyecto',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setProjectName('');
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Crear Nuevo Proyecto Completo</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={6}>
            <FormControl isRequired>
              <FormLabel>Nombre del Proyecto</FormLabel>
              <Input
                placeholder="Ej: Colombia, Tanara, Argentina"
                value={projectName}
                onChange={(e) => {
                  setProjectName(e.target.value);
                  setError('');
                }}
                isInvalid={!!error}
                size="lg"
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
                <Text fontSize="sm" fontWeight="bold" mb={2}>
                  Se creará un proyecto completo con:
                </Text>
                <List spacing={1} fontSize="sm">
                  <ListItem>
                    <ListIcon as={CheckIcon} color="green.500" />
                    <strong>7 Tablas de Mercadeo</strong> con actividades predefinidas
                  </ListItem>
                  <ListItem>
                    <ListIcon as={CheckIcon} color="green.500" />
                    <strong>Vistas consolidadas</strong> para análisis
                  </ListItem>
                  <ListItem>
                    <ListIcon as={CheckIcon} color="green.500" />
                    <strong>Configuración de planilla variable</strong> para el proyecto
                  </ListItem>
                  <ListItem>
                    <ListIcon as={CheckIcon} color="green.500" />
                    <strong>Entradas de infraestructura</strong> (24 entradas - 12 meses)
                  </ListItem>
                  <ListItem>
                    <ListIcon as={CheckIcon} color="green.500" />
                    <strong>Entradas de vivienda</strong> (24 entradas - 12 meses)
                  </ListItem>
                  <ListItem>
                    <ListIcon as={CheckIcon} color="green.500" />
                    <strong>Costos directos</strong> con 8 actividades base
                  </ListItem>
                  <ListItem>
                    <ListIcon as={CheckIcon} color="green.500" />
                    <strong>Costo por vivienda</strong> inicializado
                  </ListItem>
                </List>
              </Box>
            </Alert>

            <Alert status="warning" borderRadius="md" width="100%">
              <AlertIcon />
              <Box flex="1">
                <Text fontSize="sm">
                  <strong>Ejemplo:</strong> Si ingresa "Colombia", se creará:
                </Text>
                <Code fontSize="xs" mt={1} p={1} borderRadius="md" display="block" whiteSpace="normal">
                  presupuesto_mercadeo_<strong>colombia</strong>_casa_modelo<br/>
                  presupuesto_mercadeo_<strong>colombia</strong>_gastos_publicitarios<br/>
                  infraestructura_pagos (proyecto: colombia)<br/>
                  costo_directo (proyecto: colombia)<br/>
                  + muchas más tablas y datos...
                </Code>
              </Box>
            </Alert>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="outline" onClick={handleClose} isDisabled={isLoading}>
              Cancelar
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleCreateProject}
              isLoading={isLoading}
              loadingText="Creando Proyecto Completo..."
              leftIcon={<AddIcon />}
            >
              Crear Proyecto Completo
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 