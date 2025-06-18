import { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Heading,
  Button,
  Input,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  IconButton,
  HStack,
  VStack,
  useToast,
  Spinner,
  Center,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import { api, tables } from '../../api/api'; // Ensure tables is imported from api
import type { AxiosResponse } from 'axios'; // For type safety with tables.listAllMarketingProjectTables

// New interface aligned with Dashboard.tsx project discovery
interface DiscoveredProject {
  keyword: string;      // e.g., "argentina"
  displayName: string;  // e.g., "Argentina"
  // We might not need a specific 'id' field here if 'keyword' is unique and used for keys/actions
}

export default function ManageMarketingProyectosPage() {
  const toast = useToast();
  const [proyectos, setProyectos] = useState<DiscoveredProject[]>([]);
  const [newProyectoKeyword, setNewProyectoKeyword] = useState<string>(''); // Changed from newProyectoName
  const [isLoading, setIsLoading] = useState<boolean>(true); // Set to true initially
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { isOpen: isDeleteConfirmOpen, onOpen: onDeleteConfirmOpen, onClose: onDeleteConfirmClose } = useDisclosure();
  const [proyectoToDelete, setProyectoToDelete] = useState<DiscoveredProject | null>(null); // Changed type

  const fetchProyectos = useCallback(async () => {
    setIsLoading(true);
    try {
      // Logic adapted from Dashboard.tsx to discover projects from table names
      const response: AxiosResponse<{ tables: string[] }> = await tables.listAllMarketingProjectTables();
      const tableList = response.data.tables || [];
      
      const projectMap = new Map<string, string>(); // Stores keyword -> displayName
      
      tableList.forEach((tableName: string) => {
        if (typeof tableName !== 'string' || tableName.trim() === '') {
          return;
        }
        
        const tableLower = tableName.toLowerCase().trim();
        let remainderString = '';
        let currentKeyword = '';

        // Assuming project tables are prefixed like this, adjust if needed
        const prefix = 'presupuesto_mercadeo_';
        if (tableLower.startsWith(prefix)) {
          remainderString = tableLower.substring(prefix.length);
        } else {
          return; // Not a table name pattern we're interested in for project discovery
        }
        
        if (!remainderString) {
          return;
        }

        const parts = remainderString.split('_');
        if (parts.length > 0 && parts[0]) {
          currentKeyword = parts[0]; // The first part after prefix is the keyword
        } else {
          return; 
        }
        
        if (currentKeyword) {
          const displayName = currentKeyword
              .split('_') // Should not happen if keyword is just one word, but good for safety
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
          
          if (!projectMap.has(currentKeyword)) {
            projectMap.set(currentKeyword, displayName);
          }
        }
      });

      const discoveredProjects: DiscoveredProject[] = Array.from(projectMap.entries()).map(([keyword, displayName]) => ({
        keyword,
        displayName,
      }));
      
      setProyectos(discoveredProjects.sort((a, b) => a.displayName.localeCompare(b.displayName)));

    } catch (error) {
      console.error('Error fetching or processing projects:', error);
      toast({ title: 'Error al cargar proyectos', description: String(error), status: 'error' });
      setProyectos([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProyectos();
  }, [fetchProyectos]);

  const handleAddProyecto = async () => {
    const trimmedKeyword = newProyectoKeyword.trim();
    if (!trimmedKeyword) {
      toast({ title: 'Nombre clave vacío', description: 'El nombre clave del proyecto no puede estar vacío.', status: 'warning' });
      return;
    }
    // Basic validation for the keyword (mirroring CreateTableModal)
    if (!/^[a-zA-Z0-9_]+$/.test(trimmedKeyword)) {
      toast({ title: 'Nombre clave inválido', description: 'El nombre clave solo puede contener letras, números y guiones bajos, sin espacios ni otros caracteres especiales.', status: 'warning' });
      return;
    }

    const finalKeyword = trimmedKeyword.toLowerCase();

    setIsSubmitting(true);
    try {
      // Use the same endpoint as CreateTableModal
      const response = await api.post('/api/projects/create', { project_keyword: finalKeyword }); 
      // No direct response.data to add, successful creation means tables exist for next fetch
      setNewProyectoKeyword('');
      toast({ title: 'Proyecto creado', description: `Tablas para el proyecto "${finalKeyword}" solicitadas.`, status: 'success' });
      await fetchProyectos(); // Refresh the list to discover the new project via its tables
    } catch (error: any) {
        if (error.response && error.response.data && error.response.data.detail) {
            toast({ title: 'Error al crear proyecto', description: error.response.data.detail, status: 'error' });
        } else {
            toast({ title: 'Error al crear proyecto', description: String(error), status: 'error' });
        }
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteModal = (proyecto: DiscoveredProject) => {
    setProyectoToDelete(proyecto);
    onDeleteConfirmOpen();
  };

  const handleDeleteProyecto = async () => {
    if (!proyectoToDelete) return;
    setIsSubmitting(true);
    try {
      // Use the endpoint from projects.py router, which expects the keyword
      await api.delete(`/api/projects/${proyectoToDelete.keyword}`);
      // Optimistically update UI, or re-fetch
      setProyectos(prev => prev.filter(p => p.keyword !== proyectoToDelete.keyword));
      toast({ title: 'Proyecto eliminado', status: 'success' });
      onDeleteConfirmClose();
      setProyectoToDelete(null);
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.detail) {
        toast({ title: 'Error al eliminar proyecto', description: error.response.data.detail, status: 'error' });
      } else {
        toast({ title: 'Error al eliminar proyecto', description: String(error), status: 'error' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <Center h="300px"><Spinner size="xl" /></Center>;
  }

  return (
    <Box p={5}>
      <VStack spacing={5} align="stretch">
        <HStack justifyContent="space-between">
            <Heading as="h1" size="lg">Gestionar Proyectos de Marketing</Heading>
            <Button as={RouterLink} to="/dashboard" colorScheme="gray">Volver a Dashboard</Button>
        </HStack>

        <HStack as="form" onSubmit={(e) => { e.preventDefault(); handleAddProyecto(); }}>
          <Input 
            placeholder="Nombre del nuevo proyecto"
            value={newProyectoKeyword}
            onChange={(e) => setNewProyectoKeyword(e.target.value)}
            isDisabled={isSubmitting}
          />
          <IconButton 
            aria-label="Agregar proyecto" 
            icon={<AddIcon />} 
            colorScheme="blue" 
            type="submit"
            isLoading={isSubmitting}
          />
        </HStack>

        {proyectos.length === 0 && !isLoading ? (
            <Text>No hay proyectos de marketing definidos. Agregue uno para comenzar.</Text>
        ) : (
            <TableContainer>
            <Table variant="simple" size="sm">
                <Thead>
                <Tr>
                    <Th>Nombre del Proyecto</Th>
                    <Th isNumeric>Acciones</Th>
                </Tr>
                </Thead>
                <Tbody>
                {proyectos.map(proyecto => (
                    <Tr key={proyecto.keyword}>
                    <Td>{proyecto.displayName}</Td>
                    <Td isNumeric>
                        <IconButton 
                        aria-label="Eliminar proyecto" 
                        icon={<DeleteIcon />} 
                        colorScheme="red" 
                        size="sm"
                        onClick={() => openDeleteModal(proyecto)}
                        />
                    </Td>
                    </Tr>
                ))}
                </Tbody>
            </Table>
            </TableContainer>
        )}
      </VStack>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteConfirmOpen} onClose={onDeleteConfirmClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirmar Eliminación</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
                ¿Estás seguro de que deseas eliminar el proyecto 
                <strong>"{proyectoToDelete?.displayName}"</strong>?
                 Esta acción no se puede deshacer.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="red" mr={3} onClick={handleDeleteProyecto} isLoading={isSubmitting}>
              Eliminar
            </Button>
            <Button variant="ghost" onClick={onDeleteConfirmClose}>Cancelar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
} 