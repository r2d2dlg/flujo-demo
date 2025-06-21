import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  VStack,
  HStack,
  Text,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  useDisclosure,
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
  Textarea,
  Select,
  IconButton,
  useToast,
  Spinner,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Flex,
  Spacer,
  Checkbox,
  NumberInput,
  NumberInputField,
  Divider
} from '@chakra-ui/react';
import { FaPlus, FaEdit, FaTrash, FaEye, FaFileAlt, FaCalendarAlt, FaCogs } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Types
interface ConstructionProject {
  id: number;
  project_name: string;
  client_name: string;
  client_contact?: string;
  client_email?: string;
  client_phone?: string;
  project_type?: string;
  location?: string;
  site_address?: string;
  description?: string;
  scope_of_work?: string;
  special_requirements?: string;
  bid_deadline?: string;
  project_start_date?: string;
  project_duration_days?: number;
  total_area_m2?: number;
  total_floors?: number;
  total_units?: number;
  location_cost_factor: number;
  complexity_factor: number;
  status: string;
  priority: string;
  plans_uploaded: boolean;
  specifications_received: boolean;
  site_visit_completed: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

interface ProjectSummary {
  projects: ConstructionProject[];
  total: number;
}

const ConstructionProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<ConstructionProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [totalProjects, setTotalProjects] = useState(0);
  
  const toast = useToast();
  const navigate = useNavigate();
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  
  // Form state for creating new project
  const [newProject, setNewProject] = useState({
    project_name: '',
    client_name: '',
    client_contact: '',
    client_email: '',
    client_phone: '',
    project_type: 'RESIDENTIAL',
    location: '',
    site_address: '',
    description: '',
    scope_of_work: '',
    special_requirements: '',
    bid_deadline: '',
    project_start_date: '',
    project_duration_days: '',
    total_area_m2: '',
    total_floors: '',
    total_units: '',
    location_cost_factor: '1.0000',
    complexity_factor: '1.0000',
    priority: 'MEDIUM'
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/construction-quotes/projects/`);
      if (response.ok) {
        const data: ProjectSummary = await response.json();
        console.log('Loaded construction projects:', data.projects);
        setProjects(data.projects);
        setTotalProjects(data.total);
      } else {
        throw new Error('Failed to fetch projects');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los proyectos de construcción',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setNewProject(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setNewProject({
      project_name: '',
      client_name: '',
      client_contact: '',
      client_email: '',
      client_phone: '',
      project_type: 'RESIDENTIAL',
      location: '',
      site_address: '',
      description: '',
      scope_of_work: '',
      special_requirements: '',
      bid_deadline: '',
      project_start_date: '',
      project_duration_days: '',
      total_area_m2: '',
      total_floors: '',
      total_units: '',
      location_cost_factor: '1.0000',
      complexity_factor: '1.0000',
      priority: 'MEDIUM'
    });
  };

  const createProject = async () => {
    if (!newProject.project_name.trim() || !newProject.client_name.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre del proyecto y del cliente son requeridos',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setCreating(true);
      const projectData = {
        ...newProject,
        project_duration_days: newProject.project_duration_days ? parseInt(newProject.project_duration_days) : null,
        total_area_m2: newProject.total_area_m2 ? parseFloat(newProject.total_area_m2) : null,
        total_floors: newProject.total_floors ? parseInt(newProject.total_floors) : null,
        total_units: newProject.total_units ? parseInt(newProject.total_units) : null,
        location_cost_factor: parseFloat(newProject.location_cost_factor),
        complexity_factor: parseFloat(newProject.complexity_factor),
        bid_deadline: newProject.bid_deadline ? new Date(newProject.bid_deadline).toISOString() : null,
        project_start_date: newProject.project_start_date || null,
      };

      const response = await fetch(`${API_BASE_URL}/api/construction-quotes/projects/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });

      if (response.ok) {
        toast({
          title: 'Proyecto Creado',
          description: 'El proyecto de construcción ha sido creado exitosamente',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        onCreateClose();
        resetForm();
        fetchProjects();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create project');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: 'Error',
        description: 'Error al crear el proyecto',
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
      const response = await fetch(`${API_BASE_URL}/api/construction-quotes/projects/${projectId}`, {
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
      case 'BIDDING': return 'blue';
      case 'QUOTED': return 'yellow';
      case 'AWARDED': return 'green';
      case 'REJECTED': return 'red';
      case 'COMPLETED': return 'gray';
      default: return 'gray';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'BIDDING': return 'Licitando';
      case 'QUOTED': return 'Cotizado';
      case 'AWARDED': return 'Adjudicado';
      case 'REJECTED': return 'Rechazado';
      case 'COMPLETED': return 'Completado';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'red';
      case 'MEDIUM': return 'yellow';
      case 'LOW': return 'green';
      default: return 'gray';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'Alta';
      case 'MEDIUM': return 'Media';
      case 'LOW': return 'Baja';
      default: return priority;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-PA');
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('es-PA', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <Box p={6}>
      {/* Header */}
      <Flex mb={6} align="center">
        <VStack align="start" spacing={1}>
          <Heading size="lg">Proyectos de Construcción</Heading>
          <Text color="gray.600">
            Gestiona licitaciones y cotizaciones de construcción de manera organizada
          </Text>
        </VStack>
        <Spacer />
        <HStack spacing={3}>
          <Button
            leftIcon={<FaCogs />}
            colorScheme="purple"
            variant="outline"
            onClick={() => navigate('/admin/quote-templates')}
          >
            Plantillas & Eficiencia
          </Button>
          <Button
            leftIcon={<FaPlus />}
            colorScheme="blue"
            onClick={onCreateOpen}
          >
            Nuevo Proyecto
          </Button>
        </HStack>
      </Flex>

      {/* Statistics Cards */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Total de Proyectos</StatLabel>
              <StatNumber>{totalProjects}</StatNumber>
              <StatHelpText>Proyectos registrados</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>En Licitación</StatLabel>
              <StatNumber>{projects.filter(p => p.status === 'BIDDING').length}</StatNumber>
              <StatHelpText>Esperando cotizaciones</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Cotizados</StatLabel>
              <StatNumber>{projects.filter(p => p.status === 'QUOTED').length}</StatNumber>
              <StatHelpText>Cotizaciones enviadas</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Adjudicados</StatLabel>
              <StatNumber>{projects.filter(p => p.status === 'AWARDED').length}</StatNumber>
              <StatHelpText>Proyectos ganados</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Projects Table */}
      <Card>
        <CardHeader>
          <Heading size="md">Lista de Proyectos</Heading>
        </CardHeader>
        <CardBody>
          {loading ? (
            <Flex justify="center" p={8}>
              <Spinner size="lg" />
            </Flex>
          ) : projects.length === 0 ? (
            <Text textAlign="center" py={8} color="gray.500">
              No hay proyectos registrados. ¡Crea tu primer proyecto de construcción!
            </Text>
          ) : (
            <TableContainer>
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Proyecto</Th>
                    <Th>Cliente</Th>
                    <Th>Tipo</Th>
                    <Th>Estado</Th>
                    <Th>Prioridad</Th>
                    <Th>Fecha Límite</Th>
                    <Th>Área (m²)</Th>
                    <Th>Documentos</Th>
                    <Th>Acciones</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {projects.map((project) => (
                    <Tr key={project.id}>
                      <Td>
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="semibold">{project.project_name}</Text>
                          {project.location && (
                            <Text fontSize="sm" color="gray.500">
                              📍 {project.location}
                            </Text>
                          )}
                        </VStack>
                      </Td>
                      <Td>
                        <VStack align="start" spacing={1}>
                          <Text>{project.client_name}</Text>
                          {project.client_email && (
                            <Text fontSize="sm" color="gray.500">
                              {project.client_email}
                            </Text>
                          )}
                        </VStack>
                      </Td>
                      <Td>{project.project_type || '-'}</Td>
                      <Td>
                        <Badge colorScheme={getStatusColor(project.status)}>
                          {getStatusText(project.status)}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge colorScheme={getPriorityColor(project.priority)}>
                          {getPriorityText(project.priority)}
                        </Badge>
                      </Td>
                      <Td>{formatDate(project.bid_deadline)}</Td>
                      <Td>{project.total_area_m2 || '-'}</Td>
                      <Td>
                        <HStack spacing={1}>
                          <Box
                            w={3}
                            h={3}
                            borderRadius="full"
                            bg={project.plans_uploaded ? 'green.500' : 'gray.300'}
                            title="Planos"
                          />
                          <Box
                            w={3}
                            h={3}
                            borderRadius="full"
                            bg={project.specifications_received ? 'green.500' : 'gray.300'}
                            title="Especificaciones"
                          />
                          <Box
                            w={3}
                            h={3}
                            borderRadius="full"
                            bg={project.site_visit_completed ? 'green.500' : 'gray.300'}
                            title="Visita de Obra"
                          />
                        </HStack>
                      </Td>
                      <Td>
                        <HStack spacing={1}>
                          <IconButton
                            icon={<FaEye />}
                            aria-label="Ver proyecto"
                            size="sm"
                            variant="ghost"
                            colorScheme="blue"
                            onClick={() => navigate(`/admin/construction-projects/${project.id}`)}
                          />
                          <IconButton
                            icon={<FaFileAlt />}
                            aria-label="Cotizaciones"
                            size="sm"
                            variant="ghost"
                            colorScheme="green"
                            onClick={() => navigate(`/admin/construction-projects/${project.id}/quotes`)}
                          />
                          <IconButton
                            icon={<FaEdit />}
                            aria-label="Editar proyecto"
                            size="sm"
                            variant="ghost"
                            colorScheme="yellow"
                            onClick={() => navigate(`/admin/construction-projects/${project.id}/edit`)}
                          />
                          <IconButton
                            icon={<FaTrash />}
                            aria-label="Eliminar proyecto"
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            onClick={() => deleteProject(project.id, project.project_name)}
                          />
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          )}
        </CardBody>
      </Card>

      {/* Create Project Modal */}
      <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="xl">
        <ModalOverlay />
        <ModalContent maxW="4xl">
          <ModalHeader>Crear Nuevo Proyecto de Construcción</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={6} align="stretch">
              {/* Basic Information */}
              <Box>
                <Heading size="md" mb={4}>Información Básica</Heading>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Nombre del Proyecto</FormLabel>
                    <Input
                      value={newProject.project_name}
                      onChange={(e) => handleInputChange('project_name', e.target.value)}
                      placeholder="Ej: Residencial Vista Hermosa"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Cliente</FormLabel>
                    <Input
                      value={newProject.client_name}
                      onChange={(e) => handleInputChange('client_name', e.target.value)}
                      placeholder="Nombre del cliente"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Contacto del Cliente</FormLabel>
                    <Input
                      value={newProject.client_contact}
                      onChange={(e) => handleInputChange('client_contact', e.target.value)}
                      placeholder="Nombre del contacto"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Email del Cliente</FormLabel>
                    <Input
                      type="email"
                      value={newProject.client_email}
                      onChange={(e) => handleInputChange('client_email', e.target.value)}
                      placeholder="email@cliente.com"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Teléfono del Cliente</FormLabel>
                    <Input
                      value={newProject.client_phone}
                      onChange={(e) => handleInputChange('client_phone', e.target.value)}
                      placeholder="+507 1234-5678"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Tipo de Proyecto</FormLabel>
                    <Select
                      value={newProject.project_type}
                      onChange={(e) => handleInputChange('project_type', e.target.value)}
                    >
                      <option value="RESIDENTIAL">Residencial</option>
                      <option value="COMMERCIAL">Comercial</option>
                      <option value="INDUSTRIAL">Industrial</option>
                      <option value="INSTITUTIONAL">Institucional</option>
                      <option value="INFRASTRUCTURE">Infraestructura</option>
                      <option value="RENOVATION">Renovación</option>
                    </Select>
                  </FormControl>
                </SimpleGrid>
              </Box>

              <Divider />

              {/* Location and Timeline */}
              <Box>
                <Heading size="md" mb={4}>Ubicación y Cronograma</Heading>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl>
                    <FormLabel>Ubicación</FormLabel>
                    <Input
                      value={newProject.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="Ciudad, Provincia"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Dirección del Sitio</FormLabel>
                    <Input
                      value={newProject.site_address}
                      onChange={(e) => handleInputChange('site_address', e.target.value)}
                      placeholder="Dirección completa"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Fecha Límite de Licitación</FormLabel>
                    <Input
                      type="datetime-local"
                      value={newProject.bid_deadline}
                      onChange={(e) => handleInputChange('bid_deadline', e.target.value)}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Fecha de Inicio del Proyecto</FormLabel>
                    <Input
                      type="date"
                      value={newProject.project_start_date}
                      onChange={(e) => handleInputChange('project_start_date', e.target.value)}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Duración del Proyecto (días)</FormLabel>
                    <NumberInput>
                      <NumberInputField
                        value={newProject.project_duration_days}
                        onChange={(e) => handleInputChange('project_duration_days', e.target.value)}
                        placeholder="Ej: 365"
                      />
                    </NumberInput>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Prioridad</FormLabel>
                    <Select
                      value={newProject.priority}
                      onChange={(e) => handleInputChange('priority', e.target.value)}
                    >
                      <option value="HIGH">Alta</option>
                      <option value="MEDIUM">Media</option>
                      <option value="LOW">Baja</option>
                    </Select>
                  </FormControl>
                </SimpleGrid>
              </Box>

              <Divider />

              {/* Project Metrics */}
              <Box>
                <Heading size="md" mb={4}>Métricas del Proyecto</Heading>
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                  <FormControl>
                    <FormLabel>Área Total (m²)</FormLabel>
                    <NumberInput>
                      <NumberInputField
                        value={newProject.total_area_m2}
                        onChange={(e) => handleInputChange('total_area_m2', e.target.value)}
                        placeholder="Ej: 500.00"
                      />
                    </NumberInput>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Número de Pisos</FormLabel>
                    <NumberInput>
                      <NumberInputField
                        value={newProject.total_floors}
                        onChange={(e) => handleInputChange('total_floors', e.target.value)}
                        placeholder="Ej: 2"
                      />
                    </NumberInput>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Número de Unidades</FormLabel>
                    <NumberInput>
                      <NumberInputField
                        value={newProject.total_units}
                        onChange={(e) => handleInputChange('total_units', e.target.value)}
                        placeholder="Ej: 1"
                      />
                    </NumberInput>
                  </FormControl>
                </SimpleGrid>
              </Box>

              <Divider />

              {/* Descriptions */}
              <Box>
                <Heading size="md" mb={4}>Descripciones</Heading>
                <VStack spacing={4}>
                  <FormControl>
                    <FormLabel>Descripción del Proyecto</FormLabel>
                    <Textarea
                      value={newProject.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Descripción general del proyecto..."
                      rows={3}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Alcance del Trabajo</FormLabel>
                    <Textarea
                      value={newProject.scope_of_work}
                      onChange={(e) => handleInputChange('scope_of_work', e.target.value)}
                      placeholder="Detalle del alcance del trabajo..."
                      rows={3}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Requerimientos Especiales</FormLabel>
                    <Textarea
                      value={newProject.special_requirements}
                      onChange={(e) => handleInputChange('special_requirements', e.target.value)}
                      placeholder="Requerimientos especiales del cliente..."
                      rows={3}
                    />
                  </FormControl>
                </VStack>
              </Box>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCreateClose}>
              Cancelar
            </Button>
            <Button
              colorScheme="blue"
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

export default ConstructionProjectsPage; 