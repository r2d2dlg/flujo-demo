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
  useDisclosure,
  Spinner,
  Center,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  SimpleGrid,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  NumberInput,
  NumberInputField,
  Select
} from '@chakra-ui/react';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaCalculator, 
  FaChartLine, 
  FaEye, 
  FaArrowLeft,
  FaDollarSign,
  FaPercentage,
  FaBuilding,
  FaRulerCombined
} from 'react-icons/fa';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

// TypeScript interfaces
interface ScenarioProject {
  id: number;
  name: string;
  description?: string;
  location?: string;
  status: string;
  total_units?: number;
  target_price_per_m2?: number;
  npv?: number;
  irr?: number;
  created_at: string;
  updated_at: string;
}

interface ProjectSummary {
  projects: ScenarioProject[];
  total: number;
}

const ScenarioProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<ScenarioProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [totalProjects, setTotalProjects] = useState(0);
  
  const toast = useToast();
  const navigate = useNavigate();
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  
  // Form state for creating new project
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    location: '',
    total_area_m2: '',
    buildable_area_m2: '',
    total_units: '',
    avg_unit_size_m2: '',
    target_price_per_m2: '',
    expected_sales_period_months: '36',
    discount_rate: '0.12',
    inflation_rate: '0.03',
    contingency_percentage: '0.10'
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/scenario-projects/');
      if (response.ok) {
        const data: ProjectSummary = await response.json();
        console.log('Loaded projects:', data.projects);
        setProjects(data.projects);
        setTotalProjects(data.total);
      } else {
        throw new Error('Failed to fetch projects');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los proyectos de escenario',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    try {
      setCreating(true);
      
      // Prepare the data
      const projectData = {
        ...newProject,
        total_area_m2: newProject.total_area_m2 ? parseFloat(newProject.total_area_m2) : null,
        buildable_area_m2: newProject.buildable_area_m2 ? parseFloat(newProject.buildable_area_m2) : null,
        total_units: newProject.total_units ? parseInt(newProject.total_units) : null,
        avg_unit_size_m2: newProject.avg_unit_size_m2 ? parseFloat(newProject.avg_unit_size_m2) : null,
        target_price_per_m2: newProject.target_price_per_m2 ? parseFloat(newProject.target_price_per_m2) : null,
        expected_sales_period_months: parseInt(newProject.expected_sales_period_months),
        discount_rate: parseFloat(newProject.discount_rate) > 1 ? parseFloat(newProject.discount_rate) / 100 : parseFloat(newProject.discount_rate),
        inflation_rate: parseFloat(newProject.inflation_rate) > 1 ? parseFloat(newProject.inflation_rate) / 100 : parseFloat(newProject.inflation_rate),
        contingency_percentage: parseFloat(newProject.contingency_percentage) > 1 ? parseFloat(newProject.contingency_percentage) / 100 : parseFloat(newProject.contingency_percentage),
        created_by: 'Admin' // This should come from auth context
      };

      const response = await fetch('/api/scenario-projects/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });

      if (response.ok) {
        toast({
          title: 'Proyecto Creado',
          description: 'El proyecto de escenario ha sido creado exitosamente',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Reset form and close modal
        setNewProject({
          name: '',
          description: '',
          location: '',
          total_area_m2: '',
          buildable_area_m2: '',
          total_units: '',
          avg_unit_size_m2: '',
          target_price_per_m2: '',
          expected_sales_period_months: '36',
          discount_rate: '0.12',
          inflation_rate: '0.03',
          contingency_percentage: '0.10'
        });
        onCreateClose();
        fetchProjects();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create project');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `Error al crear el proyecto: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setCreating(false);
    }
  };

  const deleteProject = async (projectId: number, projectName: string) => {
    if (!window.confirm(`¿Está seguro de que desea eliminar el proyecto "${projectName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/scenario-projects/${projectId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Proyecto Eliminado',
          description: 'El proyecto ha sido eliminado exitosamente',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        fetchProjects();
      } else {
        throw new Error('Failed to delete project');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al eliminar el proyecto',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'green';
      case 'COMPLETED': return 'blue';
      case 'ARCHIVED': return 'gray';
      default: return 'yellow';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Activo';
      case 'COMPLETED': return 'Completado';
      case 'ARCHIVED': return 'Archivado';
      default: return 'Borrador';
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('es-PA', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (rate?: number) => {
    if (!rate) return '-';
    return `${(rate * 100).toFixed(2)}%`;
  };

  if (loading) {
    return (
      <Center p={8}>
        <VStack spacing={4}>
          <Spinner size="xl" color="purple.500" />
          <Text>Cargando proyectos de escenario...</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <Box p={8}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={8}>
        <VStack align="start" spacing={2}>
          <HStack spacing={4}>
            <IconButton
              as={RouterLink}
              to="/admin"
              icon={<FaArrowLeft />}
              aria-label="Volver al panel de administración"
              variant="ghost"
              size="lg"
            />
            <Heading as="h1" size="xl" color="purple.600">
              Proyectos de Escenario Financiero
            </Heading>
          </HStack>
          <Text color="gray.600">
            Herramientas de modelado financiero para proyectos de desarrollo inmobiliario en Panamá
          </Text>
        </VStack>
        
        <Button
          leftIcon={<FaPlus />}
          colorScheme="purple"
          onClick={onCreateOpen}
          size="lg"
        >
          Nuevo Proyecto
        </Button>
      </Flex>

      {/* Statistics Cards */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Total de Proyectos</StatLabel>
              <StatNumber>{totalProjects}</StatNumber>
              <StatHelpText>
                <StatArrow type="increase" />
                Proyectos activos
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Proyectos Activos</StatLabel>
              <StatNumber>{projects.filter(p => p.status === 'ACTIVE').length}</StatNumber>
              <StatHelpText>En desarrollo</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Valor Promedio NPV</StatLabel>
              <StatNumber>
                {formatCurrency(
                  projects
                    .filter(p => p.npv)
                    .reduce((sum, p) => sum + (p.npv || 0), 0) / 
                  projects.filter(p => p.npv).length
                )}
              </StatNumber>
              <StatHelpText>De proyectos evaluados</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>TIR Promedio</StatLabel>
              <StatNumber>
                {projects.filter(p => p.irr).length > 0 
                  ? formatPercentage(
                      projects
                        .filter(p => p.irr)
                        .reduce((sum, p) => sum + (p.irr || 0), 0) / 
                      projects.filter(p => p.irr).length
                    )
                  : '-'
                }
              </StatNumber>
              <StatHelpText>Rentabilidad promedio</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Info Alert */}
      <Alert status="info" mb={6} borderRadius="md">
        <AlertIcon />
        <Box>
          <AlertTitle>Modelado Financiero Inmobiliario</AlertTitle>
          <AlertDescription>
            Utilice estas herramientas para construir modelos financieros completos con análisis FCF (Flujo de Caja Libre), 
            DCF (Flujo de Caja Descontado), análisis de sensibilidad y evaluación de viabilidad para proyectos 
            de desarrollo inmobiliario en Panamá.
          </AlertDescription>
        </Box>
      </Alert>

      {/* Projects Table */}
      <Card>
        <CardHeader>
          <Heading size="md">Lista de Proyectos</Heading>
        </CardHeader>
        <CardBody>
          {projects.length === 0 ? (
            <Center p={8}>
              <VStack spacing={4}>
                <FaBuilding size={48} color="gray" />
                <Text fontSize="lg" color="gray.500">
                  No hay proyectos de escenario creados
                </Text>
                <Text color="gray.400">
                  Comience creando su primer proyecto de modelado financiero
                </Text>
                <Button leftIcon={<FaPlus />} colorScheme="purple" onClick={onCreateOpen}>
                  Crear Primer Proyecto
                </Button>
              </VStack>
            </Center>
          ) : (
            <TableContainer>
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Proyecto</Th>
                    <Th>Ubicación</Th>
                    <Th>Estado</Th>
                    <Th>Unidades</Th>
                    <Th>Precio/m²</Th>
                    <Th>NPV</Th>
                    <Th>TIR</Th>
                    <Th>Última Actualización</Th>
                    <Th>Acciones</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {projects.map((project) => {
                    console.log('Rendering project row:', project);
                    return (
                    <Tr key={project.id}>
                      <Td>
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="semibold">{project.name}</Text>
                          {project.description && (
                            <Text fontSize="sm" color="gray.500" noOfLines={1}>
                              {project.description}
                            </Text>
                          )}
                        </VStack>
                      </Td>
                      <Td>{project.location || '-'}</Td>
                      <Td>
                        <Badge colorScheme={getStatusColor(project.status)}>
                          {getStatusText(project.status)}
                        </Badge>
                      </Td>
                      <Td>{project.total_units || '-'}</Td>
                      <Td>{formatCurrency(project.target_price_per_m2)}</Td>
                      <Td>
                        <Text color={project.npv && project.npv > 0 ? 'green.500' : 'red.500'}>
                          {formatCurrency(project.npv)}
                        </Text>
                      </Td>
                      <Td>
                        <Text color={project.irr && project.irr > 0.12 ? 'green.500' : 'orange.500'}>
                          {formatPercentage(project.irr)}
                        </Text>
                      </Td>
                      <Td>
                        <Text fontSize="sm">
                          {new Date(project.updated_at).toLocaleDateString('es-PA')}
                        </Text>
                      </Td>
                      <Td>
                        <HStack spacing={1}>
                          <IconButton
                            icon={<FaEye />}
                            aria-label="Ver proyecto"
                            size="sm"
                            variant="ghost"
                            colorScheme="blue"
                            onClick={() => navigate(`/admin/scenario-projects/${project.id}`)}
                          />
                          <IconButton
                            icon={<FaCalculator />}
                            aria-label="Ver métricas financieras"
                            size="sm"
                            variant="ghost"
                            colorScheme="green"
                            onClick={() => navigate(`/admin/scenario-projects/${project.id}`)}
                          />
                          <IconButton
                            icon={<FaChartLine />}
                            aria-label="Ver análisis y gráficos"
                            size="sm"
                            variant="ghost"
                            colorScheme="orange"
                            onClick={() => navigate(`/admin/scenario-projects/${project.id}`)}
                          />
                          <IconButton
                            icon={<FaEdit />}
                            aria-label="Gestionar costos"
                            size="sm"
                            variant="ghost"
                            colorScheme="purple"
                            onClick={() => navigate(`/admin/scenario-projects/${project.id}`)}
                          />
                          <IconButton
                            icon={<FaTrash />}
                            aria-label="Eliminar proyecto"
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            onClick={() => deleteProject(project.id, project.name)}
                          />
                        </HStack>
                      </Td>
                    </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </TableContainer>
          )}
        </CardBody>
      </Card>

      {/* Create Project Modal */}
      <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Crear Nuevo Proyecto de Escenario</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Nombre del Proyecto</FormLabel>
                <Input
                  value={newProject.name}
                  onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                  placeholder="Ej: Residencial Vista Hermosa"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Descripción</FormLabel>
                <Textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                  placeholder="Descripción del proyecto..."
                  rows={3}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Ubicación</FormLabel>
                <Input
                  value={newProject.location}
                  onChange={(e) => setNewProject({...newProject, location: e.target.value})}
                  placeholder="Ej: Panamá, Distrito de San Miguelito"
                />
              </FormControl>

              <SimpleGrid columns={2} spacing={4}>
                <FormControl>
                  <FormLabel>Área Total (m²)</FormLabel>
                  <NumberInput>
                    <NumberInputField
                      value={newProject.total_area_m2}
                      onChange={(e) => setNewProject({...newProject, total_area_m2: e.target.value})}
                      placeholder="5000"
                    />
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>Área Construible (m²)</FormLabel>
                  <NumberInput>
                    <NumberInputField
                      value={newProject.buildable_area_m2}
                      onChange={(e) => setNewProject({...newProject, buildable_area_m2: e.target.value})}
                      placeholder="3500"
                    />
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>Total de Unidades</FormLabel>
                  <NumberInput>
                    <NumberInputField
                      value={newProject.total_units}
                      onChange={(e) => setNewProject({...newProject, total_units: e.target.value})}
                      placeholder="50"
                    />
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>Tamaño Promedio por Unidad (m²)</FormLabel>
                  <NumberInput>
                    <NumberInputField
                      value={newProject.avg_unit_size_m2}
                      onChange={(e) => setNewProject({...newProject, avg_unit_size_m2: e.target.value})}
                      placeholder="70"
                    />
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>Precio Objetivo por m²</FormLabel>
                  <NumberInput>
                    <NumberInputField
                      value={newProject.target_price_per_m2}
                      onChange={(e) => setNewProject({...newProject, target_price_per_m2: e.target.value})}
                      placeholder="1500"
                    />
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>Período de Ventas (meses)</FormLabel>
                  <NumberInput>
                    <NumberInputField
                      value={newProject.expected_sales_period_months}
                      onChange={(e) => setNewProject({...newProject, expected_sales_period_months: e.target.value})}
                    />
                  </NumberInput>
                </FormControl>
              </SimpleGrid>

              <Text fontWeight="semibold" mt={4}>Parámetros Financieros</Text>
              
              <SimpleGrid columns={3} spacing={4}>
                <FormControl>
                  <FormLabel>Tasa de Descuento</FormLabel>
                  <NumberInput step={0.01} min={0} max={1}>
                    <NumberInputField
                      value={newProject.discount_rate}
                      onChange={(e) => setNewProject({...newProject, discount_rate: e.target.value})}
                    />
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>Tasa de Inflación</FormLabel>
                  <NumberInput step={0.01} min={0} max={1}>
                    <NumberInputField
                      value={newProject.inflation_rate}
                      onChange={(e) => setNewProject({...newProject, inflation_rate: e.target.value})}
                    />
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>% Contingencia</FormLabel>
                  <NumberInput step={0.01} min={0} max={1}>
                    <NumberInputField
                      value={newProject.contingency_percentage}
                      onChange={(e) => setNewProject({...newProject, contingency_percentage: e.target.value})}
                    />
                  </NumberInput>
                </FormControl>
              </SimpleGrid>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCreateClose}>
              Cancelar
            </Button>
            <Button 
              colorScheme="purple" 
              onClick={createProject}
              isLoading={creating}
              loadingText="Creando..."
            >
              Crear Proyecto
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ScenarioProjectsPage; 