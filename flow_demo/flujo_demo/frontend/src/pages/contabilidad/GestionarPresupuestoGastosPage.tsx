import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  VStack,
  HStack,
  Input,
  useToast,
  Text,
  CircularProgress,
  Flex,
  Card,
  CardHeader,
  CardBody,
  Select,
  FormControl,
  FormLabel,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Grid,
  TableContainer,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  IconButton,
  Tooltip,
  Alert,
  AlertIcon,
  SimpleGrid,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Textarea
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { FaEdit, FaSave, FaTimes, FaPlus, FaSync, FaChartLine, FaFileExport, FaTrash, FaProjectDiagram } from 'react-icons/fa';

// Interface for project expense items
interface ProjectExpenseItem {
  id: string;
  projectId: string;
  projectName: string;
  expenseType: string;
  category: string;
  description: string;
  estimatedAmount: number;
  actualAmount?: number;
  startMonth: string;
  endMonth: string;
  status: 'planned' | 'in-progress' | 'completed' | 'cancelled';
  responsiblePerson: string;
}

interface Project {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
}

const GestionarPresupuestoGastosPage: React.FC = () => {
  const [projectExpenses, setProjectExpenses] = useState<ProjectExpenseItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ProjectExpenseItem | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Helper functions
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-PA', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'blue';
      case 'in-progress': return 'orange';
      case 'completed': return 'green';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planned': return 'Planificado';
      case 'in-progress': return 'En Progreso';
      case 'completed': return 'Completado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  // Generate sample project data
  const generateSampleProjects = (): Project[] => {
    return [
      { id: '1', name: 'Sistema CRM Empresarial', startDate: '2024-01-15', endDate: '2024-06-30', status: 'in-progress' },
      { id: '2', name: 'Renovación Infraestructura IT', startDate: '2024-03-01', endDate: '2024-08-15', status: 'planned' },
      { id: '3', name: 'Implementación ISO 9001', startDate: '2024-02-01', endDate: '2024-12-31', status: 'in-progress' },
      { id: '4', name: 'Expansión Sede Regional', startDate: '2024-05-01', endDate: '2025-02-28', status: 'planned' },
      { id: '5', name: 'Digitalización Procesos', startDate: '2024-01-01', endDate: '2024-09-30', status: 'in-progress' },
      { id: '6', name: 'Campaña Marketing Q2', startDate: '2024-04-01', endDate: '2024-06-30', status: 'planned' },
    ];
  };

  // Generate sample project expenses
  const generateSampleProjectExpenses = (): ProjectExpenseItem[] => {
    const expenseCategories = [
      'Recursos Humanos', 'Tecnología', 'Materiales', 'Servicios Externos', 
      'Capacitación', 'Marketing', 'Infraestructura', 'Legal y Regulatorio'
    ];

    const expenseTypes = [
      'Personal Temporal', 'Consultores Externos', 'Software/Licencias', 'Hardware',
      'Materiales de Oficina', 'Equipos Especializados', 'Publicidad', 'Capacitación',
      'Viajes y Viáticos', 'Servicios Legales', 'Certificaciones', 'Instalaciones'
    ];

    const responsiblePersons = [
      'Ana García - PM', 'Carlos Rodríguez - IT', 'María López - RH',
      'José Martínez - Ops', 'Laura Sánchez - Marketing', 'David Torres - Legal'
    ];

    const sampleExpenses: ProjectExpenseItem[] = [
      // Sistema CRM Empresarial
      {
        id: '1',
        projectId: '1',
        projectName: 'Sistema CRM Empresarial',
        expenseType: 'Consultores Externos',
        category: 'Servicios Externos',
        description: 'Consultoría especializada implementación CRM',
        estimatedAmount: 15000,
        actualAmount: 12000,
        startMonth: '2024_01',
        endMonth: '2024_06',
        status: 'in-progress',
        responsiblePerson: 'Ana García - PM'
      },
      {
        id: '2',
        projectId: '1',
        projectName: 'Sistema CRM Empresarial',
        expenseType: 'Software/Licencias',
        category: 'Tecnología',
        description: 'Licencias CRM para 50 usuarios',
        estimatedAmount: 8000,
        actualAmount: 8500,
        startMonth: '2024_02',
        endMonth: '2024_12',
        status: 'in-progress',
        responsiblePerson: 'Carlos Rodríguez - IT'
      },
      {
        id: '3',
        projectId: '1',
        projectName: 'Sistema CRM Empresarial',
        expenseType: 'Capacitación',
        category: 'Capacitación',
        description: 'Formación usuarios finales CRM',
        estimatedAmount: 3500,
        startMonth: '2024_05',
        endMonth: '2024_06',
        status: 'planned',
        responsiblePerson: 'María López - RH'
      },

      // Renovación Infraestructura IT
      {
        id: '4',
        projectId: '2',
        projectName: 'Renovación Infraestructura IT',
        expenseType: 'Hardware',
        category: 'Tecnología',
        description: 'Servidores y equipos networking',
        estimatedAmount: 25000,
        startMonth: '2024_03',
        endMonth: '2024_05',
        status: 'planned',
        responsiblePerson: 'Carlos Rodríguez - IT'
      },
      {
        id: '5',
        projectId: '2',
        projectName: 'Renovación Infraestructura IT',
        expenseType: 'Personal Temporal',
        category: 'Recursos Humanos',
        description: 'Técnicos especialistas instalación',
        estimatedAmount: 12000,
        startMonth: '2024_04',
        endMonth: '2024_07',
        status: 'planned',
        responsiblePerson: 'Carlos Rodríguez - IT'
      },

      // Implementación ISO 9001
      {
        id: '6',
        projectId: '3',
        projectName: 'Implementación ISO 9001',
        expenseType: 'Consultores Externos',
        category: 'Servicios Externos',
        description: 'Consultoría certificación ISO 9001',
        estimatedAmount: 18000,
        actualAmount: 16500,
        startMonth: '2024_02',
        endMonth: '2024_10',
        status: 'in-progress',
        responsiblePerson: 'David Torres - Legal'
      },
      {
        id: '7',
        projectId: '3',
        projectName: 'Implementación ISO 9001',
        expenseType: 'Certificaciones',
        category: 'Legal y Regulatorio',
        description: 'Costos auditoría y certificación',
        estimatedAmount: 8500,
        startMonth: '2024_11',
        endMonth: '2024_12',
        status: 'planned',
        responsiblePerson: 'David Torres - Legal'
      },

      // Expansión Sede Regional
      {
        id: '8',
        projectId: '4',
        projectName: 'Expansión Sede Regional',
        expenseType: 'Instalaciones',
        category: 'Infraestructura',
        description: 'Acondicionamiento nueva sede',
        estimatedAmount: 45000,
        startMonth: '2024_05',
        endMonth: '2024_12',
        status: 'planned',
        responsiblePerson: 'José Martínez - Ops'
      },
      {
        id: '9',
        projectId: '4',
        projectName: 'Expansión Sede Regional',
        expenseType: 'Equipos Especializados',
        category: 'Materiales',
        description: 'Mobiliario y equipos oficina',
        estimatedAmount: 15000,
        startMonth: '2024_11',
        endMonth: '2025_01',
        status: 'planned',
        responsiblePerson: 'José Martínez - Ops'
      },

      // Digitalización Procesos
      {
        id: '10',
        projectId: '5',
        projectName: 'Digitalización Procesos',
        expenseType: 'Software/Licencias',
        category: 'Tecnología',
        description: 'Plataforma gestión documental',
        estimatedAmount: 12000,
        actualAmount: 11200,
        startMonth: '2024_01',
        endMonth: '2024_09',
        status: 'in-progress',
        responsiblePerson: 'Carlos Rodríguez - IT'
      },
      {
        id: '11',
        projectId: '5',
        projectName: 'Digitalización Procesos',
        expenseType: 'Capacitación',
        category: 'Capacitación',
        description: 'Formación procesos digitales',
        estimatedAmount: 4500,
        startMonth: '2024_08',
        endMonth: '2024_09',
        status: 'planned',
        responsiblePerson: 'María López - RH'
      },

      // Campaña Marketing Q2
      {
        id: '12',
        projectId: '6',
        projectName: 'Campaña Marketing Q2',
        expenseType: 'Publicidad',
        category: 'Marketing',
        description: 'Campaña digital multiplataforma',
        estimatedAmount: 20000,
        startMonth: '2024_04',
        endMonth: '2024_06',
        status: 'planned',
        responsiblePerson: 'Laura Sánchez - Marketing'
      },
      {
        id: '13',
        projectId: '6',
        projectName: 'Campaña Marketing Q2',
        expenseType: 'Materiales de Oficina',
        category: 'Materiales',
        description: 'Material promocional eventos',
        estimatedAmount: 5000,
        startMonth: '2024_04',
        endMonth: '2024_06',
        status: 'planned',
        responsiblePerson: 'Laura Sánchez - Marketing'
      }
    ];

    return sampleExpenses;
  };

  // Initialize data
  useEffect(() => {
    setIsLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const sampleProjects = generateSampleProjects();
      const sampleExpenses = generateSampleProjectExpenses();
      
      setProjects(sampleProjects);
      setProjectExpenses(sampleExpenses);
      setIsLoading(false);
      
      toast({
        title: 'Datos Cargados',
        description: `${sampleExpenses.length} gastos variables cargados para ${sampleProjects.length} proyectos.`,
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    }, 1000);
  }, [toast]);

  // Filter functions
  const filteredExpenses = projectExpenses.filter(expense => {
    const projectMatch = selectedProject === 'all' || expense.projectId === selectedProject;
    const categoryMatch = selectedCategory === 'all' || expense.category === selectedCategory;
    return projectMatch && categoryMatch;
  });

  const uniqueCategories = [...new Set(projectExpenses.map(expense => expense.category))];

  // Calculate totals
  const calculateTotalEstimated = () => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.estimatedAmount, 0);
  };

  const calculateTotalActual = () => {
    return filteredExpenses.reduce((sum, expense) => sum + (expense.actualAmount || 0), 0);
  };

  const calculateVariance = () => {
    const estimated = calculateTotalEstimated();
    const actual = calculateTotalActual();
    return actual - estimated;
  };

  // CRUD operations
  const openAddModal = () => {
    setEditingExpense({
      id: '',
      projectId: '',
      projectName: '',
      expenseType: '',
      category: '',
      description: '',
      estimatedAmount: 0,
      actualAmount: 0,
      startMonth: '',
      endMonth: '',
      status: 'planned',
      responsiblePerson: ''
    });
    onOpen();
  };

  const openEditModal = (expense: ProjectExpenseItem) => {
    setEditingExpense({ ...expense });
    onOpen();
  };

  const handleSave = () => {
    if (editingExpense) {
      if (editingExpense.id === '') {
        // Add new expense
        const newExpense = {
          ...editingExpense,
          id: Date.now().toString(),
          projectName: projects.find(p => p.id === editingExpense.projectId)?.name || ''
        };
        setProjectExpenses([...projectExpenses, newExpense]);
      toast({
          title: 'Gasto Agregado',
          description: 'El nuevo gasto variable ha sido agregado exitosamente.',
          status: 'success',
          duration: 3000,
        isClosable: true,
      });
      } else {
        // Update existing expense
        setProjectExpenses(prev => prev.map(expense => 
          expense.id === editingExpense.id ? editingExpense : expense
        ));
      toast({
          title: 'Gasto Actualizado',
          description: 'El gasto variable ha sido actualizado exitosamente.',
          status: 'success',
          duration: 3000,
        isClosable: true,
      });
      }
    }
    setEditingExpense(null);
    onClose();
  };

  const handleDelete = (expenseId: string) => {
    setProjectExpenses(prev => prev.filter(expense => expense.id !== expenseId));
    toast({
      title: 'Gasto Eliminado',
      description: 'El gasto variable ha sido eliminado exitosamente.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  if (isLoading) {
    return (
      <Box p={5}>
        <Flex justify="center" align="center" h="400px">
          <VStack spacing={4}>
            <CircularProgress isIndeterminate color="purple.300" size="80px" />
            <Text fontSize="lg">Cargando gastos variables por proyecto...</Text>
          </VStack>
        </Flex>
      </Box>
    );
  }

  return (
    <Box p={5}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
            <Heading as="h1" size="lg">
            Gestionar Presupuesto Gastos Variables por Proyecto
            </Heading>
          <HStack>
            <Button leftIcon={<FaPlus />} onClick={openAddModal} colorScheme="purple" size="sm">
              Agregar Gasto
            </Button>
            <Button as={RouterLink} to="/dashboard-contabilidad" colorScheme="gray">
                Dashboard Contabilidad
            </Button>
          </HStack>
        </Flex>

        {/* Description */}
        <Alert status="info">
          <AlertIcon />
          <VStack align="start" spacing={1}>
            <Text fontWeight="bold">
              Gestión de Gastos Variables por Proyecto
            </Text>
            <Text fontSize="sm">
              Administra y controla los gastos variables asociados a proyectos específicos. Incluye recursos humanos temporales, 
              materiales, servicios externos y otros costos que varían según el proyecto.
            </Text>
          </VStack>
        </Alert>

        {/* Filters */}
        <Card>
          <CardHeader>
            <Heading size="md">Filtros</Heading>
          </CardHeader>
          <CardBody>
            <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
              <FormControl>
                <FormLabel>Proyecto</FormLabel>
                <Select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}>
                  <option value="all">Todos los Proyectos</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Categoría</FormLabel>
                <Select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                  <option value="all">Todas las Categorías</option>
                  {uniqueCategories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </CardBody>
        </Card>

        {/* Summary Cards */}
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total Estimado</StatLabel>
                <StatNumber fontSize="xl" color="blue.500">
                  {formatCurrency(calculateTotalEstimated())}
                </StatNumber>
                <StatHelpText>Presupuesto planificado</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total Actual</StatLabel>
                <StatNumber fontSize="xl" color="orange.500">
                  {formatCurrency(calculateTotalActual())}
                </StatNumber>
                <StatHelpText>Gastos ejecutados</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Variación</StatLabel>
                <StatNumber 
                  fontSize="xl" 
                  color={calculateVariance() >= 0 ? "red.500" : "green.500"}
                >
                  {formatCurrency(Math.abs(calculateVariance()))}
                </StatNumber>
                <StatHelpText>
                  {calculateVariance() >= 0 ? "Sobrepresupuesto" : "Bajo presupuesto"}
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Gastos Activos</StatLabel>
                <StatNumber fontSize="xl" color="purple.500">
                  {filteredExpenses.length}
                </StatNumber>
                <StatHelpText>Conceptos de gasto</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Expenses Table */}
        <Card>
          <CardHeader>
            <HStack justify="space-between">
              <Heading size="md">Gastos Variables por Proyecto</Heading>
              <HStack>
                <Button leftIcon={<FaFileExport />} size="sm" variant="outline">
                  Exportar
            </Button>
                <Badge colorScheme="purple" p={2}>
                  {filteredExpenses.length} elementos
                </Badge>
              </HStack>
          </HStack>
          </CardHeader>
          <CardBody>
            <TableContainer>
              <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                    <Th>Proyecto</Th>
                    <Th>Categoría</Th>
                    <Th>Tipo de Gasto</Th>
                    <Th>Descripción</Th>
                    <Th isNumeric>Estimado</Th>
                    <Th isNumeric>Actual</Th>
                    <Th>Estado</Th>
                    <Th>Responsable</Th>
                    <Th>Período</Th>
                    <Th>Acciones</Th>
                </Tr>
              </Thead>
              <Tbody>
                  {filteredExpenses.map((expense) => (
                    <Tr key={expense.id}>
                      <Td>
                        <VStack align="start" spacing={0}>
                          <Text fontSize="sm" fontWeight="semibold">
                            {expense.projectName}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            ID: {expense.projectId}
                          </Text>
                        </VStack>
                      </Td>
                      <Td>
                        <Badge colorScheme="blue" size="sm">
                          {expense.category}
                        </Badge>
                      </Td>
                      <Td>
                        <Text fontSize="sm">{expense.expenseType}</Text>
                      </Td>
                      <Td maxW="200px">
                        <Text fontSize="sm" noOfLines={2}>
                          {expense.description}
                        </Text>
                      </Td>
                      <Td isNumeric>
                        <Text fontSize="sm" fontWeight="semibold" color="blue.600">
                          {formatCurrency(expense.estimatedAmount)}
                        </Text>
                      </Td>
                      <Td isNumeric>
                        <Text 
                          fontSize="sm" 
                          fontWeight="semibold" 
                          color={expense.actualAmount ? "orange.600" : "gray.400"}
                        >
                          {expense.actualAmount ? formatCurrency(expense.actualAmount) : "N/A"}
                        </Text>
                      </Td>
                      <Td>
                        <Badge colorScheme={getStatusColor(expense.status)} size="sm">
                          {getStatusLabel(expense.status)}
                        </Badge>
                      </Td>
                      <Td>
                        <Text fontSize="sm">{expense.responsiblePerson}</Text>
                      </Td>
                      <Td>
                        <Text fontSize="xs">
                          {expense.startMonth} - {expense.endMonth}
                        </Text>
                      </Td>
                      <Td>
                        <HStack spacing={1}>
                          <Tooltip label="Editar">
                            <IconButton
                              icon={<FaEdit />}
                              size="xs"
                              variant="ghost"
                              onClick={() => openEditModal(expense)}
                              aria-label="Editar"
                            />
                          </Tooltip>
                          <Tooltip label="Eliminar">
                            <IconButton
                              icon={<FaTrash />}
                              size="xs"
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => handleDelete(expense.id)}
                              aria-label="Eliminar"
                            />
                          </Tooltip>
                        </HStack>
                      </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            </TableContainer>
          </CardBody>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <Heading size="md">Acciones Rápidas</Heading>
          </CardHeader>
          <CardBody>
            <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={4}>
              <Button 
                as={RouterLink} 
                to="/dashboard-contabilidad/presupuesto_gastos_fijos_operativos"
                leftIcon={<FaChartLine />}
                colorScheme="blue"
                variant="outline"
              >
                Gastos Fijos Operativos
              </Button>
              <Button 
                as={RouterLink} 
                to="/analitica/dashboard-gastos-ejecutivo"
                leftIcon={<FaProjectDiagram />}
                colorScheme="green"
                variant="outline"
              >
                Dashboard Ejecutivo
              </Button>
              <Button 
                as={RouterLink} 
                to="/analitica/alertas-presupuesto"
                leftIcon={<FaFileExport />}
                colorScheme="orange"
                variant="outline"
              >
                Ver Alertas Presupuestarias
              </Button>
            </Grid>
          </CardBody>
        </Card>
      </VStack>

      {/* Add/Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingExpense?.id === '' ? 'Agregar Nuevo Gasto Variable' : 'Editar Gasto Variable'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {editingExpense && (
              <VStack spacing={4}>
                <Grid templateColumns="repeat(2, 1fr)" gap={4} w="full">
                  <FormControl>
                    <FormLabel>Proyecto</FormLabel>
                    <Select 
                      value={editingExpense.projectId} 
                      onChange={(e) => {
                        const selectedProject = projects.find(p => p.id === e.target.value);
                        setEditingExpense({
                          ...editingExpense, 
                          projectId: e.target.value,
                          projectName: selectedProject?.name || ''
                        });
                      }}
                    >
                      <option value="">Seleccionar Proyecto</option>
                      {projects.map(project => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl>
                    <FormLabel>Categoría</FormLabel>
                    <Select 
                      value={editingExpense.category} 
                      onChange={(e) => setEditingExpense({...editingExpense, category: e.target.value})}
                    >
                      <option value="">Seleccionar Categoría</option>
                      {uniqueCategories.map(category => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid templateColumns="repeat(2, 1fr)" gap={4} w="full">
                  <FormControl>
                    <FormLabel>Tipo de Gasto</FormLabel>
                    <Input 
                      value={editingExpense.expenseType} 
                      onChange={(e) => setEditingExpense({...editingExpense, expenseType: e.target.value})}
                      placeholder="Ej: Consultores Externos"
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Estado</FormLabel>
                    <Select 
                      value={editingExpense.status} 
                      onChange={(e) => setEditingExpense({...editingExpense, status: e.target.value as any})}
                    >
                      <option value="planned">Planificado</option>
                      <option value="in-progress">En Progreso</option>
                      <option value="completed">Completado</option>
                      <option value="cancelled">Cancelado</option>
                    </Select>
                  </FormControl>
                </Grid>

                <FormControl>
                  <FormLabel>Descripción</FormLabel>
                  <Textarea 
                    value={editingExpense.description} 
                    onChange={(e) => setEditingExpense({...editingExpense, description: e.target.value})}
                    placeholder="Descripción detallada del gasto"
                  />
                </FormControl>

                <Grid templateColumns="repeat(2, 1fr)" gap={4} w="full">
                  <FormControl>
                    <FormLabel>Monto Estimado (USD)</FormLabel>
                    <NumberInput 
                      value={editingExpense.estimatedAmount} 
                      onChange={(_, val) => setEditingExpense({...editingExpense, estimatedAmount: val || 0})}
                      min={0}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                  <FormControl>
                    <FormLabel>Monto Actual (USD)</FormLabel>
                    <NumberInput 
                      value={editingExpense.actualAmount || 0} 
                      onChange={(_, val) => setEditingExpense({...editingExpense, actualAmount: val || 0})}
                      min={0}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                </Grid>

                <Grid templateColumns="repeat(2, 1fr)" gap={4} w="full">
                  <FormControl>
                    <FormLabel>Mes Inicio</FormLabel>
                    <Input 
                      type="month"
                      value={editingExpense.startMonth.replace('_', '-')} 
                      onChange={(e) => setEditingExpense({...editingExpense, startMonth: e.target.value.replace('-', '_')})}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Mes Fin</FormLabel>
                    <Input 
                      type="month"
                      value={editingExpense.endMonth.replace('_', '-')} 
                      onChange={(e) => setEditingExpense({...editingExpense, endMonth: e.target.value.replace('-', '_')})}
                    />
                  </FormControl>
                </Grid>

                <FormControl>
                  <FormLabel>Responsable</FormLabel>
                  <Input 
                    value={editingExpense.responsiblePerson} 
                    onChange={(e) => setEditingExpense({...editingExpense, responsiblePerson: e.target.value})}
                    placeholder="Nombre del responsable"
                  />
                </FormControl>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancelar
            </Button>
            <Button colorScheme="purple" onClick={handleSave}>
              {editingExpense?.id === '' ? 'Agregar' : 'Guardar'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default GestionarPresupuestoGastosPage; 