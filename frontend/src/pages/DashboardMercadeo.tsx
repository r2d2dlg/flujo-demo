import { useEffect, useState, useRef, useCallback } from 'react';
import {
  Box, Heading, Text, Button, Grid, GridItem, Spinner, Alert, AlertIcon, useToast,
  IconButton, HStack, VStack, useDisclosure, AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay, Flex, Menu, MenuButton, MenuList, MenuItem
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, ArrowBackIcon } from '@chakra-ui/icons';
import { Link as RouterLink } from 'react-router-dom';
import { api, tables, marketingProjectsApi } from '../api/api';
import type { AxiosResponse } from 'axios';
import { FaCalculator, FaChartLine, FaProjectDiagram, FaTable, FaMoneyBillWave, FaClipboardList, FaListAlt } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

import ActionButton from '../components/ActionButton';

// Define the project types we want to show
interface Project {
  id: string;
  name: string;
  color: string;
}

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tableName: string | null;
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
  gridTemplateColumns?: any;
}

// Define known table suffixes to help in parsing project keywords
// These should ideally align with suffixes used in the backend (e.g., projects.py TABLE_SUFFIXES)
// IMPORTANT: This list should ONLY contain the specific structural suffixes appended by the backend.
// Generic terms like "main", "data", "report" should NOT be here unless they are part of the backend's defined structured suffixes.
/*const KNOWN_TABLE_SUFFIXES = [
  "main_balance", "ejecucion_gastos", "flujo_caja", "resumen_financiero", 
  "metricas_clave", "comparativa_actual_presupuesto", "casa_modelo"
  // Removed generic suffixes like: "main", "data", "details", "summary", "report", "balance", "gastos", "flujo", "resumen", "metricas"
];*/

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({ isOpen, onClose, onConfirm, tableName }) => {
  const cancelRef = useRef<HTMLButtonElement>(null);

  const handleDelete = () => {
    onConfirm();
    onClose();
  };

  return (
    <AlertDialog
      isOpen={isOpen}
      leastDestructiveRef={cancelRef}
      onClose={onClose}
    >
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            Eliminar Tabla
          </AlertDialogHeader>

          <AlertDialogBody>
            ¿Estás seguro de que quieres eliminar la tabla "{tableName}"? Esta acción no se puede deshacer.
          </AlertDialogBody>

          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={onClose}>
              Cancelar
            </Button>
            <Button colorScheme="red" onClick={handleDelete} ml={3}>
              Eliminar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
};

const Section = ({ title, children, gridTemplateColumns, ...props }: SectionProps) => (
  <Box mb={12} {...props}>
    <Heading as="h2" size="lg" mb={6} borderBottom="2px" borderColor="gray.200" pb={2}>
      {title}
    </Heading>
    {gridTemplateColumns ? (
      <Grid templateColumns="repeat(6, 1fr)" gap={4}>
        {children}
      </Grid>
    ) : (
      children
    )}
  </Box>
);

const DashboardMercadeo: React.FC = () => {
  const { logout } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [deleteInput, setDeleteInput] = useState('');
  const [projectTables, setProjectTables] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [tableToDelete, setTableToDelete] = useState<string | null>(null);

  // Fetch all projects from the backend
  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      try {
        // Fetch projects from the new API
        const response = await marketingProjectsApi.getAll();
        const projectList = response.data || [];
        const discoveredProjects = projectList.map((proj: any, index: number) => ({
          id: `proyecto_${proj.keyword}`,
          name: proj.display_name,
          color: ['blue', 'teal', 'purple', 'pink', 'orange', 'green', 'cyan', 'yellow', 'red'][index % 9] || 'gray',
        }));
        setProjects(discoveredProjects);
      } catch (error) {
        console.error('Error fetching projects:', error);
        setProjects([]);
        toast({
          title: 'Error al Cargar Proyectos',
          description: 'No se pudieron cargar los proyectos dinámicamente. Intente recargar la página o contacte soporte.',
          status: 'error',
          duration: 9000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjects();
  }, [toast]);



  const handleLogout = () => {
    logout();
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    try {
      const keyword = projectToDelete.id.startsWith('proyecto_')
        ? projectToDelete.id.substring('proyecto_'.length)
        : projectToDelete.id.startsWith('presupuesto_mercadeo_')
        ? projectToDelete.id.substring('presupuesto_mercadeo_'.length)
        : projectToDelete.id;
      await api.delete(`/projects/${keyword}`);
      setProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
      toast({
        title: 'Proyecto eliminado',
        description: `El proyecto "${projectToDelete.name}" y sus tablas han sido eliminados.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error al eliminar',
        description: 'No se pudo eliminar el proyecto. Intente de nuevo.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setProjectToDelete(null);
      setDeleteInput('');
      onDeleteClose();
    }
  };

  const fetchProjectTables = useCallback(async () => {
    setIsLoading(true);
    try {
      const response: AxiosResponse<{ tables: string[] }> = await tables.listAllMarketingProjectTables();
      const tableNames = response.data.tables || [];
      const filteredTables = tableNames.filter(name => name.startsWith('vista_presupuesto_mercadeo_'));
      setProjectTables(filteredTables);
    } catch (error) {
      console.error("Error fetching project tables:", error);
      toast({
        title: "Error",
        description: "Could not fetch project tables.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProjectTables();
  }, [fetchProjectTables]);

  const handleDeleteClick = (tableName: string) => {
    setTableToDelete(tableName);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (tableToDelete) {
      try {
        const underlyingTableName = tableToDelete.replace(/^vista_/, '').replace(/_resumen$/, '');
        await api.delete(`/tables/chepo/${underlyingTableName}`);
        toast({
          title: "Table deleted.",
          description: `Table ${tableToDelete} and its related views/triggers have been successfully deleted.`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        fetchProjectTables();
      } catch (error) {
        toast({
          title: "Error deleting table.",
          description: "Could not delete the selected table.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        console.error("Error deleting table:", error);
      } finally {
        setIsDeleteDialogOpen(false);
        setTableToDelete(null);
      }
    }
  };

  if (isLoading) {
    return (
      <Box p={5}>
        <Spinner size="xl" />
        <Text mt={4}>Cargando dashboard...</Text>
      </Box>
    );
  }

  return (
    <Box p={8}>
      <VStack spacing={10} align="stretch">
        <HStack justifyContent="space-between" flexWrap="wrap">
          <Heading as="h1" size="xl">Dashboard de Mercadeo</Heading>
          <HStack>
            <Button as={RouterLink} to="/" leftIcon={<ArrowBackIcon />} colorScheme="gray">
              Volver al Dashboard Principal
            </Button>
          </HStack>
        </HStack>

        {/* Project Management Section */}
        <Section title="Gestión de Proyectos">
          <Flex justifyContent="space-between" alignItems="center" mb={6}>
            <Text fontSize="lg" fontWeight="medium">Presupuestos de Proyectos</Text>
          </Flex>
          <Text fontSize="md" color="gray.600" mb={4}>
            Los proyectos ahora se crean desde el Panel de Administración Central.
          </Text>
          <Grid templateColumns="repeat(6, 1fr)" gap={4}>
            {projects.map((project) => (
              <GridItem key={project.id}>
                <Menu isLazy>
                  <MenuButton as="div" w="100%" p={0} background="none" _hover={{ background: 'none' }}>
                    <Box w="100%" p={0}>
                      <ActionButton
                        title={project.name}
                        subtitle="Ver y gestionar tablas"
                        icon={FaProjectDiagram}
                        colorScheme={project.color}
                        variant="solid"
                        size="sm"
                        minHeight="80px"
                        fontSize="sm"
                      />
                    </Box>
                  </MenuButton>
                  <MenuList>
                    <MenuItem
                        as={RouterLink}
                        to={`/marketing-budget/${project.id}/vistas`}
                      icon={<FaProjectDiagram color="#3182ce" />} // blue.600
                      >
                        Vistas
                    </MenuItem>
                    <MenuItem
                        as={RouterLink}
                        to={`/marketing-budget/${project.id}/tablas`}
                      icon={<FaTable color="#319795" />} // teal.500
                      >
                        Tablas
                    </MenuItem>
                  </MenuList>
                </Menu>
              </GridItem>
            ))}
          </Grid>
        </Section>

        {/* Administrative Section */}
        <Section title="Administración">
          <Grid templateColumns="repeat(6, 1fr)" gap={4}>
            <GridItem>
              <ActionButton
                title="Gestionar Vendedores"
                subtitle="Administrar vendedores"
                to="/admin/vendedores"
                icon={FaClipboardList}
                colorScheme="teal"
                size="sm"
                minHeight="80px"
                fontSize="sm"
              />
            </GridItem>
            <GridItem>
              <ActionButton
                title="Comisiones Ventas"
                subtitle="Gestión comisiones ventas"
                to="/ventas/gestionar-tabla-comisiones"
                icon={FaCalculator}
                colorScheme="purple"
                size="sm"
                minHeight="80px"
                fontSize="sm"
              />
            </GridItem>
            <GridItem>
              <ActionButton
                title="Categorías"
                subtitle="Gestionar categorías sistema"
                to="/categories"
                icon={FaListAlt}
                colorScheme="orange"
                size="sm"
                minHeight="80px"
                fontSize="sm"
              />
            </GridItem>
          </Grid>
        </Section>

        {/* Cash Flow and Reports Section */}
        <Section title="Flujos de Efectivo y Reportes">
          <Grid templateColumns="repeat(6, 1fr)" gap={4}>
            <GridItem>
              <ActionButton
                title="Flujo de Caja - Mercadeo"
                subtitle="Análisis flujo mercadeo"
                to="/cash-flows/mercadeo"
                icon={FaChartLine}
                colorScheme="blue"
                size="sm"
                minHeight="80px"
                fontSize="sm"
              />
            </GridItem>
            <GridItem>
              <ActionButton
                title="Reporte de Inversión"
                subtitle="Reportes inversión mercadeo"
                to="/reporte-marketing"
                icon={FaListAlt}
                colorScheme="green"
                size="sm"
                minHeight="80px"
                fontSize="sm"
              />
            </GridItem>
            <GridItem>
              <ActionButton
                title="Flujo Publicidad"
                subtitle="Proyección flujos publicidad"
                to="/flujo-publicidad"
                icon={FaMoneyBillWave}
                colorScheme="pink"
                size="sm"
                minHeight="80px"
                fontSize="sm"
              />
            </GridItem>
          </Grid>
        </Section>

        <DeleteConfirmationDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleDeleteConfirm}
          tableName={tableToDelete}
        />
      </VStack>
    </Box>
  );
};

export default DashboardMercadeo;
