import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  VStack,
  HStack,
  Text,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  IconButton,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  Spinner,
  Center,
  Card,
  CardBody,
  Flex,
  Divider
} from '@chakra-ui/react';
import { FaTrash, FaEye, FaEdit, FaArrowLeft, FaDatabase, FaTable } from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';
import { API_BASE_URL } from '../../api/api';

interface Project {
  name: string;
  keyword: string;
  type: string;
  tablesCount: number;
  viewsCount: number;
  status: 'active' | 'inactive';
  createdDate: string;
}

const GestionarProyectosPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  // Función para obtener proyectos de marketing desde la base de datos
  const fetchMarketingProjects = async () => {
    try {
      setLoading(true);
      
      // Obtener proyectos desde el endpoint de admin
      const response = await fetch(`${API_BASE_URL}/api/admin/projects`);
      const data = await response.json();
      
      if (data.success) {
        // Crear objetos de proyecto desde la respuesta del API
        const projectList: Project[] = data.projects.map((project: any) => ({
          name: project.display_name || project.name,
          keyword: project.name, // Use the keyword from backend
          type: 'Marketing',
          tablesCount: project.tables_exist ? 7 : 0, // 7 categorías si existen tablas
          viewsCount: project.views_exist ? 9 : 0,  // 7 individuales + 2 consolidadas si existen vistas
          status: project.status === 'active' ? 'active' as const : 'inactive' as const,
          createdDate: project.created_date || new Date().toLocaleDateString()
        }));
        
        setProjects(projectList);
      } else {
        setProjects([]);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los proyectos',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketingProjects();
  }, []);

  const handleDeleteClick = (project: Project) => {
    setSelectedProject(project);
    onOpen();
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProject) return;

    try {
      setDeleteLoading(true);
      
      // Use the keyword directly from the project
      const projectKeyword = selectedProject.keyword;
      
      // Llamar al endpoint para eliminar el proyecto
      const response = await fetch(`${API_BASE_URL}/api/admin/delete-project/${projectKeyword}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Proyecto Eliminado',
          description: `El proyecto "${selectedProject.name}" ha sido eliminado exitosamente`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        // Recargar la lista de proyectos
        await fetchMarketingProjects();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error eliminando proyecto');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: 'Error',
        description: `No se pudo eliminar el proyecto: ${error}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setDeleteLoading(false);
      onClose();
      setSelectedProject(null);
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'green' : 'red';
  };

  if (loading) {
    return (
      <Center h="400px">
        <VStack>
          <Spinner size="xl" color="blue.500" />
          <Text>Cargando proyectos...</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <Box p={8}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <HStack justifyContent="space-between">
          <VStack align="start" spacing={2}>
            <Heading as="h1" size="xl">
              Gestionar Proyectos Existentes
            </Heading>
            <Text color="gray.600">
              Administra y elimina proyectos de construcción existentes
            </Text>
          </VStack>
          <Button
            as={RouterLink}
            to="/admin"
            leftIcon={<FaArrowLeft />}
            colorScheme="gray"
            variant="outline"
          >
            Volver al Panel Admin
          </Button>
        </HStack>

        <Divider />

        {/* Estadísticas */}
        <HStack spacing={6}>
          <Card>
            <CardBody>
              <VStack>
                <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                  {projects.length}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  Proyectos Totales
                </Text>
              </VStack>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <VStack>
                <Text fontSize="2xl" fontWeight="bold" color="green.500">
                  {projects.filter(p => p.status === 'active').length}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  Proyectos Activos
                </Text>
              </VStack>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <VStack>
                <Text fontSize="2xl" fontWeight="bold" color="purple.500">
                  {projects.reduce((sum, p) => sum + p.tablesCount, 0)}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  Tablas Totales
                </Text>
              </VStack>
            </CardBody>
          </Card>
        </HStack>

        {/* Tabla de Proyectos */}
        {projects.length === 0 ? (
          <Card>
            <CardBody>
              <Center py={10}>
                <VStack>
                  <FaDatabase size={48} color="gray" />
                  <Text fontSize="lg" color="gray.500">
                    No hay proyectos creados
                  </Text>
                  <Text fontSize="sm" color="gray.400">
                    Crea un nuevo proyecto desde el Panel de Administración
                  </Text>
                </VStack>
              </Center>
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardBody>
              <TableContainer>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Proyecto</Th>
                      <Th>Tipo</Th>
                      <Th>Tablas</Th>
                      <Th>Vistas</Th>
                      <Th>Estado</Th>
                      <Th>Fecha Creación</Th>
                      <Th>Acciones</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {projects.map((project, index) => (
                      <Tr key={index}>
                        <Td>
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="bold">{project.name}</Text>
                            <Text fontSize="sm" color="gray.500">
                              Proyecto de construcción
                            </Text>
                          </VStack>
                        </Td>
                        <Td>
                          <Badge colorScheme="blue" variant="subtle">
                            {project.type}
                          </Badge>
                        </Td>
                        <Td>
                          <HStack>
                            <FaTable color="gray" />
                            <Text>{project.tablesCount}</Text>
                          </HStack>
                        </Td>
                        <Td>
                          <HStack>
                            <FaEye color="gray" />
                            <Text>{project.viewsCount}</Text>
                          </HStack>
                        </Td>
                        <Td>
                          <Badge colorScheme={getStatusColor(project.status)}>
                            {project.status === 'active' ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </Td>
                        <Td>
                          <Text fontSize="sm">{project.createdDate}</Text>
                        </Td>
                        <Td>
                          <HStack spacing={2}>
                            <IconButton
                              as={RouterLink}
                              to={`/marketing-budget/proyecto_${project.keyword}/vistas`}
                              aria-label="Ver proyecto"
                              icon={<FaEye />}
                              size="sm"
                              colorScheme="blue"
                              variant="outline"
                              title="Ver proyecto"
                            />
                            <IconButton
                              as={RouterLink}
                              to={`/marketing-budget/proyecto_${project.keyword}/tablas`}
                              aria-label="Editar tablas"
                              icon={<FaEdit />}
                              size="sm"
                              colorScheme="green"
                              variant="outline"
                              title="Editar tablas"
                            />
                            <IconButton
                              aria-label="Eliminar proyecto"
                              icon={<FaTrash />}
                              size="sm"
                              colorScheme="red"
                              variant="outline"
                              onClick={() => handleDeleteClick(project)}
                              title="Eliminar proyecto"
                            />
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </CardBody>
          </Card>
        )}

        {/* Dialog de Confirmación */}
        <AlertDialog
          isOpen={isOpen}
          leastDestructiveRef={cancelRef}
          onClose={onClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Eliminar Proyecto
              </AlertDialogHeader>

              <AlertDialogBody>
                ¿Estás seguro de que quieres eliminar el proyecto{' '}
                <strong>"{selectedProject?.name}"</strong>?
                <br />
                <br />
                Esta acción eliminará:
                <br />
                • {selectedProject?.tablesCount} tablas de datos
                <br />
                • {selectedProject?.viewsCount} vistas del sistema
                <br />
                • Todos los datos asociados al proyecto
                <br />
                <br />
                <Text color="red.500" fontWeight="bold">
                  Esta acción no se puede deshacer.
                </Text>
              </AlertDialogBody>

              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onClose}>
                  Cancelar
                </Button>
                <Button
                  colorScheme="red"
                  onClick={handleDeleteConfirm}
                  ml={3}
                  isLoading={deleteLoading}
                  loadingText="Eliminando..."
                >
                  Eliminar
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </VStack>
    </Box>
  );
};

export default GestionarProyectosPage; 