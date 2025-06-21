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
  useToast,
  Spinner,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Flex,
  Spacer,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  IconButton,
  Divider,
  NumberInput,
  NumberInputField,
  Progress,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import { 
  FaArrowLeft, 
  FaEdit, 
  FaPlus, 
  FaFileAlt, 
  FaCalculator,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaClock,
  FaUsers,
  FaRuler,
  FaMoneyBillWave
} from 'react-icons/fa';
import { useParams, useNavigate } from 'react-router-dom';

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

interface ConstructionQuote {
  id: number;
  project_id: number;
  quote_name: string;
  description?: string;
  status: string;
  quote_version: number;
  materials_cost: number;
  labor_cost: number;
  equipment_cost: number;
  subcontract_cost: number;
  direct_costs_total: number;
  overhead_percentage: number;
  overhead_amount: number;
  profit_percentage: number;
  profit_amount: number;
  contingency_percentage: number;
  contingency_amount: number;
  subtotal_before_tax: number;
  tax_percentage: number;
  tax_amount: number;
  total_quote_amount: number;
  cost_per_m2?: number;
  created_at: string;
  updated_at: string;
}

const ConstructionProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [project, setProject] = useState<ConstructionProject | null>(null);
  const [quotes, setQuotes] = useState<ConstructionQuote[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  
  const { 
    isOpen: isCreateQuoteOpen, 
    onOpen: onCreateQuoteOpen, 
    onClose: onCreateQuoteClose 
  } = useDisclosure();
  
  const { 
    isOpen: isTemplateOpen, 
    onOpen: onTemplateOpen, 
    onClose: onTemplateClose 
  } = useDisclosure();
  
  // Form state for creating new quote
  const [newQuote, setNewQuote] = useState({
    quote_name: '',
    description: '',
    overhead_percentage: '15',
    profit_percentage: '10',
    contingency_percentage: '5',
    tax_percentage: '7' // ITBMS in Panama
  });

  useEffect(() => {
    if (id) {
      fetchProject();
      fetchQuotes();
    }
  }, [id]);

  const fetchTemplates = async () => {
    try {
      setTemplatesLoading(true);
      const params = new URLSearchParams();
      if (project?.project_type) {
        params.append('project_type', project.project_type);
      }
      
      const response = await fetch(`${API_BASE_URL}/api/construction-quotes/templates?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las plantillas',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setTemplatesLoading(false);
    }
  };

  const openTemplateModal = () => {
    onTemplateOpen();
    fetchTemplates();
  };

  const createQuoteFromTemplate = async (templateId: number, quoteName: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/construction-quotes/projects/${id}/quotes/from-template/${templateId}?quote_name=${encodeURIComponent(quoteName)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const newQuote = await response.json();
        toast({
          title: 'Éxito',
          description: `Cotización creada desde plantilla: ${quoteName}`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        fetchQuotes(); // Refresh quotes list
        onTemplateClose();
        
        // Navigate to the new quote
        navigate(`/admin/construction-quotes/${newQuote.id}`);
      } else {
        throw new Error('Failed to create quote from template');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo crear la cotización desde la plantilla',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/construction-quotes/projects/${id}`);
      if (response.ok) {
        const data = await response.json();
        setProject(data);
      } else {
        throw new Error('Failed to fetch project');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cargar el proyecto',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      navigate('/admin/construction-projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuotes = async () => {
    try {
      setQuotesLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/construction-quotes/projects/${id}/quotes`);
      if (response.ok) {
        const data = await response.json();
        setQuotes(data);
      }
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setQuotesLoading(false);
    }
  };

  const createQuote = async () => {
    if (!newQuote.quote_name.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre de la cotización es requerido',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/construction-quotes/projects/${id}/quotes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quote_name: newQuote.quote_name,
          description: newQuote.description,
          construction_project_id: parseInt(id!),
          overhead_percentage: parseFloat(newQuote.overhead_percentage),
          profit_margin_percentage: parseFloat(newQuote.profit_percentage),
          contingency_percentage: parseFloat(newQuote.contingency_percentage),
          itbms_percentage: parseFloat(newQuote.tax_percentage)
        }),
      });

      if (response.ok) {
        toast({
          title: 'Éxito',
          description: 'Cotización creada exitosamente',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        fetchQuotes();
        onCreateQuoteClose();
        setNewQuote({
          quote_name: '',
          description: '',
          overhead_percentage: '15',
          profit_percentage: '10',
          contingency_percentage: '5',
          tax_percentage: '7'
        });
      } else {
        throw new Error('Failed to create quote');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo crear la cotización',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'gray';
      case 'BIDDING': return 'blue';
      case 'QUOTED': return 'yellow';
      case 'AWARDED': return 'green';
      case 'REJECTED': return 'red';
      case 'ON_HOLD': return 'orange';
      default: return 'gray';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'Borrador';
      case 'BIDDING': return 'En Licitación';
      case 'QUOTED': return 'Cotizado';
      case 'AWARDED': return 'Adjudicado';
      case 'REJECTED': return 'Rechazado';
      case 'ON_HOLD': return 'En Espera';
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
    return dateString ? new Date(dateString).toLocaleDateString('es-ES') : '-';
  };

  const formatCurrency = (amount?: number) => {
    return new Intl.NumberFormat('es-PA', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const getProjectProgress = () => {
    if (!project) return 0;
    let completed = 0;
    let total = 3;
    
    if (project.plans_uploaded) completed++;
    if (project.specifications_received) completed++;
    if (project.site_visit_completed) completed++;
    
    return (completed / total) * 100;
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" h="50vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (!project) {
    return (
      <Box p={6}>
        <Alert status="error">
          <AlertIcon />
          Proyecto no encontrado
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={6}>
      {/* Header */}
      <HStack mb={6} spacing={4}>
        <IconButton
          icon={<FaArrowLeft />}
          aria-label="Volver"
          onClick={() => navigate('/admin/construction-projects')}
        />
        <VStack align="start" spacing={1} flex={1}>
          <HStack spacing={3}>
            <Heading size="lg">{project.project_name}</Heading>
            <Badge colorScheme={getStatusColor(project.status)} size="lg">
              {getStatusText(project.status)}
            </Badge>
            <Badge colorScheme={getPriorityColor(project.priority)}>
              {getPriorityText(project.priority)}
            </Badge>
          </HStack>
          <Text color="gray.600">Cliente: {project.client_name}</Text>
        </VStack>
        <Button
          leftIcon={<FaEdit />}
          colorScheme="blue"
          onClick={() => navigate(`/admin/construction-projects/${id}/edit`)}
        >
          Editar Proyecto
        </Button>
      </HStack>

      {/* Project Overview Cards */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>
                <HStack>
                  <FaMapMarkerAlt />
                  <Text>Ubicación</Text>
                </HStack>
              </StatLabel>
              <StatNumber fontSize="lg">{project.location || 'No especificada'}</StatNumber>
              <StatHelpText>Factor de costo: {project.location_cost_factor}x</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>
                <HStack>
                  <FaRuler />
                  <Text>Área Total</Text>
                </HStack>
              </StatLabel>
              <StatNumber fontSize="lg">
                {project.total_area_m2 ? `${project.total_area_m2.toLocaleString()} m²` : 'N/A'}
              </StatNumber>
              <StatHelpText>
                {project.total_floors && `${project.total_floors} pisos`}
                {project.total_units && ` • ${project.total_units} unidades`}
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>
                <HStack>
                  <FaCalendarAlt />
                  <Text>Fecha Límite</Text>
                </HStack>
              </StatLabel>
              <StatNumber fontSize="lg">{formatDate(project.bid_deadline)}</StatNumber>
              <StatHelpText>Licitación</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>
                <HStack>
                  <FaClock />
                  <Text>Duración</Text>
                </HStack>
              </StatLabel>
              <StatNumber fontSize="lg">
                {project.project_duration_days ? `${project.project_duration_days} días` : 'N/A'}
              </StatNumber>
              <StatHelpText>Estimada</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Progress and Documents Status */}
      <Card mb={8}>
        <CardHeader>
          <Heading size="md">Estado de Documentación</Heading>
        </CardHeader>
        <CardBody>
          <VStack spacing={4}>
            <Box w="full">
              <HStack justify="space-between" mb={2}>
                <Text fontWeight="medium">Progreso General</Text>
                <Text fontSize="sm" color="gray.600">
                  {Math.round(getProjectProgress())}% completado
                </Text>
              </HStack>
              <Progress value={getProjectProgress()} colorScheme="blue" />
            </Box>
            
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} w="full">
              <HStack>
                <Box
                  w={4}
                  h={4}
                  borderRadius="full"
                  bg={project.plans_uploaded ? 'green.500' : 'gray.300'}
                />
                <Text color={project.plans_uploaded ? 'green.600' : 'gray.500'}>
                  Planos {project.plans_uploaded ? 'Subidos' : 'Pendientes'}
                </Text>
              </HStack>
              
              <HStack>
                <Box
                  w={4}
                  h={4}
                  borderRadius="full"
                  bg={project.specifications_received ? 'green.500' : 'gray.300'}
                />
                <Text color={project.specifications_received ? 'green.600' : 'gray.500'}>
                  Especificaciones {project.specifications_received ? 'Recibidas' : 'Pendientes'}
                </Text>
              </HStack>
              
              <HStack>
                <Box
                  w={4}
                  h={4}
                  borderRadius="full"
                  bg={project.site_visit_completed ? 'green.500' : 'gray.300'}
                />
                <Text color={project.site_visit_completed ? 'green.600' : 'gray.500'}>
                  Visita de Obra {project.site_visit_completed ? 'Completada' : 'Pendiente'}
                </Text>
              </HStack>
            </SimpleGrid>
          </VStack>
        </CardBody>
      </Card>

      {/* Tabs for different sections */}
      <Tabs>
        <TabList>
          <Tab>Información del Proyecto</Tab>
          <Tab>Cotizaciones ({quotes.length})</Tab>
          <Tab>Costos y Análisis</Tab>
        </TabList>

        <TabPanels>
          {/* Project Information Tab */}
          <TabPanel>
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
              <Card>
                <CardHeader>
                  <Heading size="md">Información del Cliente</Heading>
                </CardHeader>
                <CardBody>
                  <VStack align="start" spacing={3}>
                    <Box>
                      <Text fontWeight="medium">Cliente:</Text>
                      <Text>{project.client_name}</Text>
                    </Box>
                    {project.client_contact && (
                      <Box>
                        <Text fontWeight="medium">Contacto:</Text>
                        <Text>{project.client_contact}</Text>
                      </Box>
                    )}
                    {project.client_email && (
                      <Box>
                        <Text fontWeight="medium">Email:</Text>
                        <Text>{project.client_email}</Text>
                      </Box>
                    )}
                    {project.client_phone && (
                      <Box>
                        <Text fontWeight="medium">Teléfono:</Text>
                        <Text>{project.client_phone}</Text>
                      </Box>
                    )}
                  </VStack>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <Heading size="md">Detalles del Proyecto</Heading>
                </CardHeader>
                <CardBody>
                  <VStack align="start" spacing={3}>
                    <Box>
                      <Text fontWeight="medium">Tipo de Proyecto:</Text>
                      <Text>{project.project_type || 'No especificado'}</Text>
                    </Box>
                    {project.site_address && (
                      <Box>
                        <Text fontWeight="medium">Dirección:</Text>
                        <Text>{project.site_address}</Text>
                      </Box>
                    )}
                    <Box>
                      <Text fontWeight="medium">Factor de Complejidad:</Text>
                      <Text>{project.complexity_factor}x</Text>
                    </Box>
                    {project.project_start_date && (
                      <Box>
                        <Text fontWeight="medium">Fecha de Inicio:</Text>
                        <Text>{formatDate(project.project_start_date)}</Text>
                      </Box>
                    )}
                  </VStack>
                </CardBody>
              </Card>

              {project.description && (
                <Card>
                  <CardHeader>
                    <Heading size="md">Descripción</Heading>
                  </CardHeader>
                  <CardBody>
                    <Text whiteSpace="pre-wrap">{project.description}</Text>
                  </CardBody>
                </Card>
              )}

              {project.scope_of_work && (
                <Card>
                  <CardHeader>
                    <Heading size="md">Alcance del Trabajo</Heading>
                  </CardHeader>
                  <CardBody>
                    <Text whiteSpace="pre-wrap">{project.scope_of_work}</Text>
                  </CardBody>
                </Card>
              )}
            </SimpleGrid>

            {project.special_requirements && (
              <Card mt={6}>
                <CardHeader>
                  <Heading size="md">Requerimientos Especiales</Heading>
                </CardHeader>
                <CardBody>
                  <Text whiteSpace="pre-wrap">{project.special_requirements}</Text>
                </CardBody>
              </Card>
            )}
          </TabPanel>

          {/* Quotes Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <Flex justify="space-between" align="center">
                <Heading size="md">Cotizaciones del Proyecto</Heading>
                <HStack spacing={3}>
                  <Button
                    leftIcon={<FaFileAlt />}
                    colorScheme="blue"
                    variant="outline"
                    onClick={openTemplateModal}
                  >
                    Desde Plantilla
                  </Button>
                  <Button
                    leftIcon={<FaPlus />}
                    colorScheme="green"
                    onClick={onCreateQuoteOpen}
                  >
                    Nueva Cotización
                  </Button>
                </HStack>
              </Flex>

              {quotesLoading ? (
                <Flex justify="center" p={8}>
                  <Spinner />
                </Flex>
              ) : quotes.length === 0 ? (
                <Card>
                  <CardBody>
                    <Text textAlign="center" py={8} color="gray.500">
                      No hay cotizaciones creadas para este proyecto.
                      ¡Crea tu primera cotización!
                    </Text>
                  </CardBody>
                </Card>
              ) : (
                <TableContainer>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Nombre</Th>
                        <Th>Versión</Th>
                        <Th>Estado</Th>
                        <Th>Total</Th>
                        <Th>Costo/m²</Th>
                        <Th>Fecha</Th>
                        <Th>Acciones</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {quotes.map((quote) => (
                        <Tr key={quote.id}>
                          <Td>
                            <VStack align="start" spacing={1}>
                              <Text fontWeight="medium">{quote.quote_name}</Text>
                              {quote.description && (
                                <Text fontSize="sm" color="gray.500">
                                  {quote.description}
                                </Text>
                              )}
                            </VStack>
                          </Td>
                          <Td>v{quote.quote_version}</Td>
                          <Td>
                            <Badge colorScheme={getStatusColor(quote.status)}>
                              {getStatusText(quote.status)}
                            </Badge>
                          </Td>
                          <Td fontWeight="bold">
                            {formatCurrency(quote.total_quote_amount)}
                          </Td>
                          <Td>
                            {quote.cost_per_m2 ? formatCurrency(quote.cost_per_m2) : '-'}
                          </Td>
                          <Td>{formatDate(quote.created_at)}</Td>
                          <Td>
                            <HStack spacing={1}>
                              <IconButton
                                icon={<FaFileAlt />}
                                aria-label="Ver cotización"
                                size="sm"
                                variant="ghost"
                                colorScheme="blue"
                                onClick={() => navigate(`/admin/construction-quotes/${quote.id}`)}
                              />
                              <IconButton
                                icon={<FaCalculator />}
                                aria-label="Calcular costos"
                                size="sm"
                                variant="ghost"
                                colorScheme="green"
                                onClick={() => navigate(`/admin/construction-quotes/${quote.id}/calculate`)}
                              />
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              )}
            </VStack>
          </TabPanel>

          {/* Costs Analysis Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <Heading size="md">Análisis de Costos</Heading>
              
              {quotes.length > 0 ? (
                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                  <Card>
                    <CardHeader>
                      <Heading size="md">Resumen de Cotizaciones</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack align="start" spacing={3}>
                        <HStack justify="space-between" w="full">
                          <Text>Total de Cotizaciones:</Text>
                          <Text fontWeight="bold">{quotes.length}</Text>
                        </HStack>
                        <HStack justify="space-between" w="full">
                          <Text>Cotización Más Baja:</Text>
                          <Text fontWeight="bold" color="green.600">
                            {formatCurrency(Math.min(...quotes.map(q => q.total_quote_amount)))}
                          </Text>
                        </HStack>
                        <HStack justify="space-between" w="full">
                          <Text>Cotización Más Alta:</Text>
                          <Text fontWeight="bold" color="red.600">
                            {formatCurrency(Math.max(...quotes.map(q => q.total_quote_amount)))}
                          </Text>
                        </HStack>
                        <HStack justify="space-between" w="full">
                          <Text>Promedio:</Text>
                          <Text fontWeight="bold">
                            {formatCurrency(quotes.reduce((sum, q) => sum + q.total_quote_amount, 0) / quotes.length)}
                          </Text>
                        </HStack>
                      </VStack>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardHeader>
                      <Heading size="md">Factores del Proyecto</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack align="start" spacing={3}>
                        <HStack justify="space-between" w="full">
                          <Text>Factor de Ubicación:</Text>
                          <Text fontWeight="bold">{project.location_cost_factor}x</Text>
                        </HStack>
                        <HStack justify="space-between" w="full">
                          <Text>Factor de Complejidad:</Text>
                          <Text fontWeight="bold">{project.complexity_factor}x</Text>
                        </HStack>
                        <HStack justify="space-between" w="full">
                          <Text>Factor Combinado:</Text>
                          <Text fontWeight="bold" color="blue.600">
                            {(project.location_cost_factor * project.complexity_factor).toFixed(4)}x
                          </Text>
                        </HStack>
                      </VStack>
                    </CardBody>
                  </Card>
                </SimpleGrid>
              ) : (
                <Card>
                  <CardBody>
                    <Text textAlign="center" py={8} color="gray.500">
                      No hay cotizaciones para analizar.
                      Crea una cotización para ver el análisis de costos.
                    </Text>
                  </CardBody>
                </Card>
              )}
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Create Quote Modal */}
      <Modal isOpen={isCreateQuoteOpen} onClose={onCreateQuoteClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Nueva Cotización</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Nombre de la Cotización</FormLabel>
                <Input
                  value={newQuote.quote_name}
                  onChange={(e) => setNewQuote(prev => ({ ...prev, quote_name: e.target.value }))}
                  placeholder="Ej: Cotización Principal v1.0"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Descripción</FormLabel>
                <Textarea
                  value={newQuote.description}
                  onChange={(e) => setNewQuote(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción de la cotización (opcional)"
                />
              </FormControl>

              <SimpleGrid columns={2} spacing={4} w="full">
                <FormControl>
                  <FormLabel>Gastos Generales (%)</FormLabel>
                  <NumberInput
                    value={newQuote.overhead_percentage}
                    onChange={(value) => setNewQuote(prev => ({ ...prev, overhead_percentage: value }))}
                    min={0}
                    max={100}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>Utilidad (%)</FormLabel>
                  <NumberInput
                    value={newQuote.profit_percentage}
                    onChange={(value) => setNewQuote(prev => ({ ...prev, profit_percentage: value }))}
                    min={0}
                    max={100}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>Contingencia (%)</FormLabel>
                  <NumberInput
                    value={newQuote.contingency_percentage}
                    onChange={(value) => setNewQuote(prev => ({ ...prev, contingency_percentage: value }))}
                    min={0}
                    max={100}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>ITBMS (%)</FormLabel>
                  <NumberInput
                    value={newQuote.tax_percentage}
                    onChange={(value) => setNewQuote(prev => ({ ...prev, tax_percentage: value }))}
                    min={0}
                    max={100}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
              </SimpleGrid>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCreateQuoteClose}>
              Cancelar
            </Button>
            <Button colorScheme="green" onClick={createQuote}>
              Crear Cotización
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Template Selection Modal */}
      <Modal isOpen={isTemplateOpen} onClose={onTemplateClose} size="4xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Crear Cotización desde Plantilla</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {templatesLoading ? (
              <Flex justify="center" p={8}>
                <VStack>
                  <Spinner size="lg" />
                  <Text>Cargando plantillas...</Text>
                </VStack>
              </Flex>
            ) : templates.length === 0 ? (
              <VStack spacing={4} py={8}>
                <Text color="gray.500" fontSize="lg">
                  No hay plantillas disponibles
                </Text>
                <Text color="gray.400" fontSize="sm">
                  {project?.project_type 
                    ? `No se encontraron plantillas para proyectos de tipo "${project.project_type}"`
                    : "No se encontraron plantillas en el sistema"
                  }
                </Text>
                <Button 
                  colorScheme="blue" 
                  variant="outline"
                  onClick={() => navigate('/admin/quote-templates')}
                >
                  Gestionar Plantillas
                </Button>
              </VStack>
            ) : (
              <VStack spacing={4}>
                <Text color="gray.600">
                  Selecciona una plantilla para crear una cotización con partidas predefinidas:
                </Text>
                
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                  {templates.map((template) => (
                    <Card 
                      key={template.id} 
                      cursor="pointer" 
                      _hover={{ shadow: 'md', borderColor: 'blue.300' }}
                      transition="all 0.2s"
                      onClick={() => {
                        const quoteName = `${template.template_name} - ${project?.project_name}`;
                        createQuoteFromTemplate(template.id, quoteName);
                      }}
                    >
                      <CardBody>
                        <VStack align="start" spacing={3}>
                          <HStack justify="space-between" w="full">
                            <Text fontWeight="bold" color="blue.600">
                              {template.template_name}
                            </Text>
                            <Badge colorScheme="blue">
                              {template.project_type}
                            </Badge>
                          </HStack>
                          
                          <Text fontSize="sm" color="gray.600">
                            {Object.keys(template.template_sections).length} secciones
                          </Text>
                          
                          <HStack spacing={4} fontSize="sm">
                            <Text>
                              <strong>Overhead:</strong> {template.default_overhead}%
                            </Text>
                            <Text>
                              <strong>Ganancia:</strong> {template.default_profit}%
                            </Text>
                            <Text>
                              <strong>Contingencia:</strong> {template.default_contingency}%
                            </Text>
                          </HStack>
                          
                          <Text fontSize="sm" color="gray.500">
                            Usado {template.usage_count} veces
                          </Text>
                        </VStack>
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onTemplateClose}>
              Cancelar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ConstructionProjectDetailPage; 