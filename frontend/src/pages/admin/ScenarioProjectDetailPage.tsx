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
  SimpleGrid,
  Alert,
  AlertIcon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
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
  NumberInput,
  NumberInputField,
  Select,
  Textarea,
  Divider,
  useColorModeValue,
  UnorderedList,
  ListItem,
  Progress
} from '@chakra-ui/react';
import { 
  FaArrowLeft, 
  FaEdit, 
  FaTrash, 
  FaPlus, 
  FaCalculator, 
  FaChartLine,
  FaDollarSign,
  FaBuilding
} from 'react-icons/fa';
import { Link as RouterLink, useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

// TypeScript interfaces
interface ScenarioProject {
  id: number;
  name: string;
  description?: string;
  location?: string;
  status: string;
  total_area_m2?: number;
  buildable_area_m2?: number;
  total_units?: number;
  avg_unit_size_m2?: number;
  target_price_per_m2?: number;
  expected_sales_period_months?: number;
  discount_rate: number;
  inflation_rate: number;
  contingency_percentage: number;
  created_at: string;
  updated_at: string;
}

interface CostItem {
  id: number;
  categoria: string;
  subcategoria: string;
  partida_costo: string;
  base_costo: string;
  monto_proyectado?: number;
  monto_real?: number;
  unit_cost?: number;
  quantity?: number;
  percentage_of_base?: number;
  base_reference?: string;
  start_month?: number;
  duration_months?: number;
  notes?: string;
  is_active: boolean;
}

interface ProjectMetrics {
  total_investment?: number;
  total_revenue?: number;
  total_profit?: number;
  profit_margin_pct?: number;
  npv?: number;
  irr?: number;
  payback_months?: number;
  cost_per_unit?: number;
  revenue_per_unit?: number;
  profit_per_unit?: number;
  cost_per_m2?: number;
  revenue_per_m2?: number;
  profit_per_m2?: number;
  break_even_units?: number;
  break_even_price_per_m2?: number;
  max_drawdown?: number;
}

interface CashFlowItem {
  year: number;
  month: number;
  period_label: string;
  ingresos_ventas: number;
  total_ingresos: number;
  costos_terreno: number;
  costos_duros: number;
  costos_blandos: number;
  costos_financiacion: number;
  costos_marketing: number;
  total_egresos: number;
  flujo_neto: number;
  flujo_acumulado: number;
  flujo_descontado: number;
}

interface SalesScenarioConfig {
  scenario_name: string;
  period_0_6_months: number;
  period_6_12_months: number;
  period_12_18_months: number;
  period_18_24_months: number;
  period_24_plus_months?: number;
}

interface SalesScenarioMetrics {
  scenario_name: string;
  npv?: number;
  irr?: number;
  payback_months?: number;
  max_exposure?: number;
  total_revenue?: number;
  total_profit?: number;
}

interface SalesSimulationResponse {
  success: boolean;
  message: string;
  scenarios: SalesScenarioMetrics[];
  cash_flow_comparison: Array<{
    month: string;
    scenario: string;
    accumulated_flow: number;
  }>;
  company_impact: {
    min_liquidity_required: number;
    recommended_credit_line: number;
    liquidity_risk_level: string;
    critical_month: number;
    recommendations: string[];
  };
}

const ScenarioProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [project, setProject] = useState<ScenarioProject | null>(null);
  const [costItems, setCostItems] = useState<CostItem[]>([]);
  const [metrics, setMetrics] = useState<ProjectMetrics | null>(null);
  const [cashFlow, setCashFlow] = useState<CashFlowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [simulationResults, setSimulationResults] = useState<SalesSimulationResponse | null>(null);
  
  const { isOpen: isAddCostOpen, onOpen: onAddCostOpen, onClose: onAddCostClose } = useDisclosure();
  
  const [newCostItem, setNewCostItem] = useState({
    categoria: '',
    subcategoria: '',
    partida_costo: '',
    base_costo: '',
    monto_proyectado: '',
    start_month: '1',
    duration_months: '1',
    notes: ''
  });

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Add sensitivity analysis state
  const [sensitivityResults, setSensitivityResults] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedAnalysisType, setSelectedAnalysisType] = useState<string | null>(null);
  const [analysisConfig, setAnalysisConfig] = useState({
    min_variation_pct: -30,
    max_variation_pct: 30,
    steps: 13
  });

  useEffect(() => {
    if (id) {
      fetchProjectDetails();
      fetchCostItems();
      fetchMetrics();
      fetchCashFlow();
      fetchSensitivityAnalyses();
    }
  }, [id]);

  const fetchProjectDetails = async () => {
    try {
      const response = await fetch(`/api/scenario-projects/${id}`);
      if (response.ok) {
        const data = await response.json();
        setProject(data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cargar el proyecto',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const fetchCostItems = async () => {
    try {
      const response = await fetch(`/api/scenario-projects/${id}/cost-items`);
      if (response.ok) {
        const data = await response.json();
        setCostItems(data);
      }
    } catch (error) {
      console.error('Error fetching cost items:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await fetch(`/api/scenario-projects/${id}/metrics`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Metrics not available yet');
    }
  };

  const fetchCashFlow = async () => {
    try {
      const response = await fetch(`/api/scenario-projects/${id}/cash-flow`);
      if (response.ok) {
        const data = await response.json();
        setCashFlow(data);
      }
    } catch (error) {
      console.error('Cash flow not available yet');
    }
  };

  const calculateFinancials = async () => {
    try {
      setCalculating(true);
      const response = await fetch(`/api/scenario-projects/${id}/calculate-financials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scenario_project_id: parseInt(id!),
          recalculate_cash_flow: true,
          recalculate_metrics: true
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast({
            title: 'Cálculo Completado',
            description: result.message,
            status: 'success',
            duration: 5000,
            isClosable: true,
          });
          fetchMetrics();
          fetchCashFlow();
        } else {
          throw new Error(result.message);
        }
      }
    } catch (error) {
      toast({
        title: 'Error en Cálculo',
        description: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setCalculating(false);
    }
  };

  const addCostItem = async () => {
    try {
      const response = await fetch(`/api/scenario-projects/${id}/cost-items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newCostItem,
          scenario_project_id: parseInt(id!),
          monto_proyectado: newCostItem.monto_proyectado ? parseFloat(newCostItem.monto_proyectado) : null,
          start_month: parseInt(newCostItem.start_month),
          duration_months: parseInt(newCostItem.duration_months),
        }),
      });

      if (response.ok) {
        toast({
          title: 'Item Agregado',
          description: 'El item de costo ha sido agregado exitosamente',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        setNewCostItem({
          categoria: '',
          subcategoria: '',
          partida_costo: '',
          base_costo: '',
          monto_proyectado: '',
          start_month: '1',
          duration_months: '1',
          notes: ''
        });
        onAddCostClose();
        fetchCostItems();
      } else {
        // Handle HTTP error responses
        const errorData = await response.json().catch(() => ({}));
        toast({
          title: 'Error',
          description: errorData.detail || `Error ${response.status}: ${response.statusText}`,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al agregar el item de costo',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const deleteCostItem = async (itemId: number, itemName: string) => {
    if (!window.confirm(`¿Eliminar "${itemName}"?`)) return;

    try {
      const response = await fetch(`/api/scenario-projects/${id}/cost-items/${itemId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Item Eliminado',
          description: 'El item de costo ha sido eliminado',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        fetchCostItems();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al eliminar el item',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('es-PA', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (rate?: number) => {
    if (!rate) return '-';
    return `${(rate * 100).toFixed(2)}%`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'green';
      case 'COMPLETED': return 'blue';
      case 'ARCHIVED': return 'gray';
      default: return 'yellow';
    }
  };

  const getCategoriaColor = (categoria: string) => {
    switch (categoria.toLowerCase()) {
      case 'terreno': return 'brown';
      case 'costos duros': return 'blue';
      case 'costos blandos': return 'purple';
      case 'financiación': return 'orange';
      case 'contingencia': return 'red';
      default: return 'gray';
    }
  };

  const simulateSalesScenarios = async () => {
    try {
      setSimulating(true);
      
      const optimisticScenario: SalesScenarioConfig = {
        scenario_name: 'optimista',
        period_0_6_months: 40,
        period_6_12_months: 35,
        period_12_18_months: 20,
        period_18_24_months: 5,
        period_24_plus_months: 0
      };

      const realisticScenario: SalesScenarioConfig = {
        scenario_name: 'realista',
        period_0_6_months: 25,
        period_6_12_months: 30,
        period_12_18_months: 25,
        period_18_24_months: 20,
        period_24_plus_months: 0
      };

      const conservativeScenario: SalesScenarioConfig = {
        scenario_name: 'conservador',
        period_0_6_months: 15,
        period_6_12_months: 20,
        period_12_18_months: 25,
        period_18_24_months: 25,
        period_24_plus_months: 15
      };

      const response = await fetch(`/api/scenario-projects/${id}/simulate-sales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          optimistic_scenario: optimisticScenario,
          realistic_scenario: realisticScenario,
          conservative_scenario: conservativeScenario
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setSimulationResults(result);
        
        if (result.success) {
          toast({
            title: 'Simulación Completada',
            description: result.message,
            status: 'success',
            duration: 5000,
            isClosable: true,
          });
        } else {
          throw new Error(result.message);
        }
      }
    } catch (error) {
      toast({
        title: 'Error en Simulación',
        description: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSimulating(false);
    }
  };

  // Prepare chart data
  const chartData = cashFlow.map(cf => ({
    period: cf.period_label,
    ingresos: cf.total_ingresos,
    egresos: cf.total_egresos,
    flujo_neto: cf.flujo_neto,
    flujo_acumulado: cf.flujo_acumulado
  }));

  const costByCategory = costItems.reduce((acc, item) => {
    const category = item.categoria;
    acc[category] = (acc[category] || 0) + (item.monto_proyectado || 0);
    return acc;
  }, {} as Record<string, number>);

  const categoryData = Object.entries(costByCategory).map(([name, value]) => ({
    name,
    value
  }));

  // Sensitivity analysis function
  const runSensitivityAnalysis = async (variableType: string) => {
    try {
      setIsAnalyzing(true);
      setSelectedAnalysisType(variableType);
      
      const response = await fetch(`/api/scenario-projects/${id}/sensitivity-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          variable_type: variableType,
          min_variation_pct: analysisConfig.min_variation_pct,
          max_variation_pct: analysisConfig.max_variation_pct,
          steps: analysisConfig.steps
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setSensitivityResults(prev => [...prev, result]);
        
        toast({
          title: 'Análisis Completado',
          description: `Análisis de ${getVariableName(variableType)} completado exitosamente`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      toast({
        title: 'Error en Análisis',
        description: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Get existing sensitivity analyses
  const fetchSensitivityAnalyses = async () => {
    try {
      const response = await fetch(`/api/scenario-projects/${id}/sensitivity-analyses`);
      if (response.ok) {
        const analyses = await response.json();
        setSensitivityResults(analyses);
      }
    } catch (error) {
      console.error('Error fetching sensitivity analyses:', error);
    }
  };

  // Helper function to get variable display name
  const getVariableName = (variableType: string) => {
    switch (variableType) {
      case 'PRICE_PER_M2': return 'Precio por m²';
      case 'UNIT_SIZE': return 'Tamaño de Unidades';
      case 'TOTAL_UNITS': return 'Número de Unidades';
      case 'DISCOUNT_RATE': return 'Tasa de Descuento';
      default: return variableType;
    }
  };

  if (loading) {
    return (
      <Center p={8}>
        <VStack spacing={4}>
          <Spinner size="xl" color="purple.500" />
          <Text>Cargando detalles del proyecto...</Text>
        </VStack>
      </Center>
    );
  }

  if (!project) {
    return (
      <Center p={8}>
        <VStack spacing={4}>
          <Text fontSize="lg" color="red.500">Proyecto no encontrado</Text>
          <Button as={RouterLink} to="/admin/scenario-projects" leftIcon={<FaArrowLeft />}>
            Volver a Proyectos
          </Button>
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
              to="/admin/scenario-projects"
              icon={<FaArrowLeft />}
              aria-label="Volver a proyectos"
              variant="ghost"
              size="lg"
            />
            <VStack align="start" spacing={1}>
              <Heading as="h1" size="xl" color="purple.600">
                {project.name}
              </Heading>
              <HStack spacing={4}>
                <Badge colorScheme={getStatusColor(project.status)} size="lg">
                  {project.status}
                </Badge>
                {project.location && (
                  <Text color="gray.600">{project.location}</Text>
                )}
              </HStack>
            </VStack>
          </HStack>
          {project.description && (
            <Text color="gray.600" maxW="600px">
              {project.description}
            </Text>
          )}
        </VStack>
        
        <VStack spacing={2}>
          <Button
            leftIcon={<FaCalculator />}
            colorScheme="green"
            onClick={calculateFinancials}
            isLoading={calculating}
            loadingText="Calculando..."
            size="lg"
          >
            Calcular Financieros
          </Button>
          <Button
            leftIcon={<FaCalculator />}
            colorScheme="green"
            variant="outline"
            onClick={calculateFinancials}
            isLoading={calculating}
            loadingText="Calculando..."
          >
            Calcular Métricas
          </Button>
        </VStack>
      </Flex>

      {/* Project Overview Cards */}
      <SimpleGrid columns={{ base: 2, md: 4, lg: 6 }} spacing={4} mb={8}>
        <Card bg={cardBg} borderColor={borderColor}>
          <CardBody>
            <Stat size="sm">
              <StatLabel>Unidades Totales</StatLabel>
              <StatNumber fontSize="xl">{project.total_units || '-'}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg={cardBg} borderColor={borderColor}>
          <CardBody>
            <Stat size="sm">
              <StatLabel>Precio/m²</StatLabel>
              <StatNumber fontSize="xl">{formatCurrency(project.target_price_per_m2)}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg={cardBg} borderColor={borderColor}>
          <CardBody>
            <Stat size="sm">
              <StatLabel>NPV</StatLabel>
              <StatNumber fontSize="xl" color={metrics?.npv && metrics.npv > 0 ? 'green.500' : 'red.500'}>
                {formatCurrency(metrics?.npv)}
              </StatNumber>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg={cardBg} borderColor={borderColor}>
          <CardBody>
            <Stat size="sm">
              <StatLabel>TIR</StatLabel>
              <StatNumber fontSize="xl" color={metrics?.irr && metrics.irr > 0.12 ? 'green.500' : 'orange.500'}>
                {formatPercentage(metrics?.irr)}
              </StatNumber>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg={cardBg} borderColor={borderColor}>
          <CardBody>
            <Stat size="sm">
              <StatLabel>Margen</StatLabel>
              <StatNumber fontSize="xl">
                {formatPercentage(metrics?.profit_margin_pct ? metrics.profit_margin_pct / 100 : undefined)}
              </StatNumber>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg={cardBg} borderColor={borderColor}>
          <CardBody>
            <Stat size="sm">
              <StatLabel>Payback</StatLabel>
              <StatNumber fontSize="xl">
                {metrics?.payback_months ? `${metrics.payback_months}m` : '-'}
              </StatNumber>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Main Content Tabs */}
      <Tabs colorScheme="purple" variant="enclosed">
        <TabList>
          <Tab>Estructura de Costos</Tab>
          <Tab>Flujo de Caja</Tab>
          <Tab>Métricas Financieras</Tab>
          <Tab>Simulación de Ventas</Tab>
          <Tab>Análisis</Tab>
        </TabList>

        <TabPanels>
          {/* Cost Structure Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <Flex justify="space-between" align="center">
                <Heading size="md">Estructura de Costos del Proyecto</Heading>
                <Button leftIcon={<FaPlus />} colorScheme="purple" onClick={onAddCostOpen}>
                  Agregar Item de Costo
                </Button>
              </Flex>

              {/* Cost Summary */}
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <Card>
                  <CardHeader>
                    <Heading size="sm">Distribución por Categoría</Heading>
                  </CardHeader>
                  <CardBody>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={categoryData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45}
                          textAnchor="end"
                          height={100}
                          fontSize={12}
                        />
                        <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        <Bar dataKey="value" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader>
                    <Heading size="sm">Resumen de Costos</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={3} align="stretch">
                      {Object.entries(costByCategory).map(([category, amount]) => (
                        <Flex key={category} justify="space-between" align="center">
                          <HStack>
                            <Badge colorScheme={getCategoriaColor(category)} size="sm">
                              {category}
                            </Badge>
                          </HStack>
                          <Text fontWeight="semibold">{formatCurrency(amount)}</Text>
                        </Flex>
                      ))}
                      <Divider />
                      <Flex justify="space-between" align="center" fontWeight="bold" fontSize="lg">
                        <Text>Total Estimado</Text>
                        <Text color="purple.600">
                          {formatCurrency(Object.values(costByCategory).reduce((a, b) => a + b, 0))}
                        </Text>
                      </Flex>
                    </VStack>
                  </CardBody>
                </Card>
              </SimpleGrid>

              {/* Cost Items Table */}
              <Card>
                <CardHeader>
                  <Heading size="sm">Items de Costo Detallados</Heading>
                </CardHeader>
                <CardBody>
                  <TableContainer>
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Categoría</Th>
                          <Th>Subcategoría</Th>
                          <Th>Partida de Costo</Th>
                          <Th>Base de Costo</Th>
                          <Th>Monto Proyectado</Th>
                          <Th>Timing</Th>
                          <Th>Acciones</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {costItems.map((item) => (
                          <Tr key={item.id}>
                            <Td>
                              <Badge colorScheme={getCategoriaColor(item.categoria)} size="sm">
                                {item.categoria}
                              </Badge>
                            </Td>
                            <Td>{item.subcategoria}</Td>
                            <Td>{item.partida_costo}</Td>
                            <Td>{item.base_costo}</Td>
                            <Td fontWeight="semibold">{formatCurrency(item.monto_proyectado)}</Td>
                            <Td>
                              {item.start_month && item.duration_months && (
                                <Text fontSize="sm">
                                  Mes {item.start_month} ({item.duration_months}m)
                                </Text>
                              )}
                            </Td>
                            <Td>
                              <HStack spacing={1}>
                                <IconButton
                                  icon={<FaEdit />}
                                  aria-label="Editar"
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="purple"
                                />
                                <IconButton
                                  icon={<FaTrash />}
                                  aria-label="Eliminar"
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="red"
                                  onClick={() => deleteCostItem(item.id, item.partida_costo)}
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
            </VStack>
          </TabPanel>

          {/* Cash Flow Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <Heading size="md">Flujo de Caja Proyectado</Heading>
              
              {cashFlow.length > 0 ? (
                <>
                  <Card>
                    <CardHeader>
                      <Heading size="sm">Flujo de Caja Mensual</Heading>
                    </CardHeader>
                    <CardBody>
                      <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={chartData.slice(0, 36)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="period"
                            angle={-45}
                            textAnchor="end"
                            height={80}
                            fontSize={10}
                          />
                          <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                          <Tooltip formatter={(value) => formatCurrency(value as number)} />
                          <Legend />
                          <Line type="monotone" dataKey="ingresos" stroke="#10b981" name="Ingresos" strokeWidth={2} />
                          <Line type="monotone" dataKey="egresos" stroke="#ef4444" name="Egresos" strokeWidth={2} />
                          <Line type="monotone" dataKey="flujo_neto" stroke="#8b5cf6" name="Flujo Neto" strokeWidth={2} />
                          <Line type="monotone" dataKey="flujo_acumulado" stroke="#f59e0b" name="Flujo Acumulado" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardHeader>
                      <Heading size="sm">Detalle del Flujo de Caja (Primeros 12 meses)</Heading>
                    </CardHeader>
                    <CardBody>
                      <TableContainer>
                        <Table variant="simple" size="sm">
                          <Thead>
                            <Tr>
                              <Th>Período</Th>
                              <Th>Ingresos</Th>
                              <Th>Egresos</Th>
                              <Th>Flujo Neto</Th>
                              <Th>Flujo Acumulado</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {cashFlow.slice(0, 12).map((cf) => (
                              <Tr key={cf.period_label}>
                                <Td>{cf.period_label}</Td>
                                <Td color="green.600">{formatCurrency(cf.total_ingresos)}</Td>
                                <Td color="red.600">{formatCurrency(cf.total_egresos)}</Td>
                                <Td color={cf.flujo_neto >= 0 ? 'green.600' : 'red.600'}>
                                  {formatCurrency(cf.flujo_neto)}
                                </Td>
                                <Td color={cf.flujo_acumulado >= 0 ? 'green.600' : 'red.600'}>
                                  {formatCurrency(cf.flujo_acumulado)}
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </TableContainer>
                    </CardBody>
                  </Card>
                </>
              ) : (
                <Alert status="warning">
                  <AlertIcon />
                  No hay datos de flujo de caja disponibles. Ejecute el cálculo financiero primero.
                </Alert>
              )}
            </VStack>
          </TabPanel>

          {/* Financial Metrics Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <Heading size="md">Métricas Financieras</Heading>
              
              {metrics ? (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  <Card>
                    <CardHeader>
                      <Heading size="sm">Rentabilidad</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <Stat>
                          <StatLabel>Inversión Total</StatLabel>
                          <StatNumber>{formatCurrency(metrics.total_investment)}</StatNumber>
                        </Stat>
                        <Stat>
                          <StatLabel>Ingresos Totales</StatLabel>
                          <StatNumber>{formatCurrency(metrics.total_revenue)}</StatNumber>
                        </Stat>
                        <Stat>
                          <StatLabel>Utilidad Total</StatLabel>
                          <StatNumber color={metrics.total_profit && metrics.total_profit > 0 ? 'green.500' : 'red.500'}>
                            {formatCurrency(metrics.total_profit)}
                          </StatNumber>
                        </Stat>
                        <Stat>
                          <StatLabel>Margen de Utilidad</StatLabel>
                          <StatNumber>
                            {formatPercentage(metrics.profit_margin_pct ? metrics.profit_margin_pct / 100 : undefined)}
                          </StatNumber>
                        </Stat>
                      </VStack>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardHeader>
                      <Heading size="sm">Análisis DCF</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <Stat>
                          <StatLabel>Valor Presente Neto (NPV)</StatLabel>
                          <StatNumber color={metrics.npv && metrics.npv > 0 ? 'green.500' : 'red.500'}>
                            {formatCurrency(metrics.npv)}
                          </StatNumber>
                          <StatHelpText>
                            {metrics.npv && metrics.npv > 0 ? 'Proyecto viable' : 'Revisar viabilidad'}
                          </StatHelpText>
                        </Stat>
                        <Stat>
                          <StatLabel>Tasa Interna de Retorno (TIR)</StatLabel>
                          <StatNumber color={metrics.irr && metrics.irr > 0.12 ? 'green.500' : 'orange.500'}>
                            {formatPercentage(metrics.irr)}
                          </StatNumber>
                          <StatHelpText>
                            {metrics.irr && metrics.irr > 0.12 ? 'Supera tasa de descuento' : 'Por debajo del objetivo'}
                          </StatHelpText>
                        </Stat>
                        <Stat>
                          <StatLabel>Período de Recuperación</StatLabel>
                          <StatNumber>
                            {metrics.payback_months ? `${metrics.payback_months} meses` : '-'}
                          </StatNumber>
                        </Stat>
                        <Stat>
                          <StatLabel>Índice de Rentabilidad</StatLabel>
                          <StatNumber>
                            {metrics.profitability_index ? metrics.profitability_index.toFixed(2) : '-'}
                          </StatNumber>
                        </Stat>
                      </VStack>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardHeader>
                      <Heading size="sm">Métricas por Unidad</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <Stat>
                          <StatLabel>Costo por Unidad</StatLabel>
                          <StatNumber>{formatCurrency(metrics.cost_per_unit)}</StatNumber>
                        </Stat>
                        <Stat>
                          <StatLabel>Ingreso por Unidad</StatLabel>
                          <StatNumber>{formatCurrency(metrics.revenue_per_unit)}</StatNumber>
                        </Stat>
                        <Stat>
                          <StatLabel>Utilidad por Unidad</StatLabel>
                          <StatNumber color={metrics.profit_per_unit && metrics.profit_per_unit > 0 ? 'green.500' : 'red.500'}>
                            {formatCurrency(metrics.profit_per_unit)}
                          </StatNumber>
                        </Stat>
                        <Divider />
                        <Stat>
                          <StatLabel>Costo por m²</StatLabel>
                          <StatNumber>{formatCurrency(metrics.cost_per_m2)}</StatNumber>
                        </Stat>
                        <Stat>
                          <StatLabel>Ingreso por m²</StatLabel>
                          <StatNumber>{formatCurrency(metrics.revenue_per_m2)}</StatNumber>
                        </Stat>
                        <Stat>
                          <StatLabel>Utilidad por m²</StatLabel>
                          <StatNumber color={metrics.profit_per_m2 && metrics.profit_per_m2 > 0 ? 'green.500' : 'red.500'}>
                            {formatCurrency(metrics.profit_per_m2)}
                          </StatNumber>
                        </Stat>
                      </VStack>
                    </CardBody>
                  </Card>
                </SimpleGrid>
              ) : (
                <Alert status="warning">
                  <AlertIcon />
                  No hay métricas financieras disponibles. Ejecute el cálculo financiero primero.
                </Alert>
              )}
            </VStack>
          </TabPanel>

          {/* Sales Simulation Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <Heading size="md">Simulación de Cronograma de Ventas</Heading>
              
              <Text color="gray.600">
                Configure diferentes escenarios de ventas para evaluar el impacto en el flujo de caja 
                del proyecto y los requerimientos de financiamiento.
              </Text>

              {/* Sales Scenarios Configuration */}
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <Card>
                  <CardHeader>
                    <Heading size="sm">Configurar Escenarios de Venta</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <Alert status="info" size="sm">
                        <AlertIcon />
                        <Text fontSize="sm">
                          Configure el % de unidades vendidas por período de 6 meses
                        </Text>
                      </Alert>
                      
                      {/* Optimistic Scenario */}
                      <Box p={4} borderWidth={1} borderRadius="md" borderColor="green.200" bg="green.50">
                        <Text fontWeight="bold" color="green.700" mb={3}>Escenario Optimista</Text>
                        <SimpleGrid columns={2} spacing={3}>
                          <FormControl>
                            <FormLabel fontSize="sm">0-6 meses (%)</FormLabel>
                            <NumberInput size="sm" min={0} max={100} defaultValue={40}>
                              <NumberInputField />
                            </NumberInput>
                          </FormControl>
                          <FormControl>
                            <FormLabel fontSize="sm">6-12 meses (%)</FormLabel>
                            <NumberInput size="sm" min={0} max={100} defaultValue={35}>
                              <NumberInputField />
                            </NumberInput>
                          </FormControl>
                          <FormControl>
                            <FormLabel fontSize="sm">12-18 meses (%)</FormLabel>
                            <NumberInput size="sm" min={0} max={100} defaultValue={20}>
                              <NumberInputField />
                            </NumberInput>
                          </FormControl>
                          <FormControl>
                            <FormLabel fontSize="sm">18-24 meses (%)</FormLabel>
                            <NumberInput size="sm" min={0} max={100} defaultValue={5}>
                              <NumberInputField />
                            </NumberInput>
                          </FormControl>
                        </SimpleGrid>
                      </Box>

                      {/* Realistic Scenario */}
                      <Box p={4} borderWidth={1} borderRadius="md" borderColor="blue.200" bg="blue.50">
                        <Text fontWeight="bold" color="blue.700" mb={3}>Escenario Realista</Text>
                        <SimpleGrid columns={2} spacing={3}>
                          <FormControl>
                            <FormLabel fontSize="sm">0-6 meses (%)</FormLabel>
                            <NumberInput size="sm" min={0} max={100} defaultValue={25}>
                              <NumberInputField />
                            </NumberInput>
                          </FormControl>
                          <FormControl>
                            <FormLabel fontSize="sm">6-12 meses (%)</FormLabel>
                            <NumberInput size="sm" min={0} max={100} defaultValue={30}>
                              <NumberInputField />
                            </NumberInput>
                          </FormControl>
                          <FormControl>
                            <FormLabel fontSize="sm">12-18 meses (%)</FormLabel>
                            <NumberInput size="sm" min={0} max={100} defaultValue={25}>
                              <NumberInputField />
                            </NumberInput>
                          </FormControl>
                          <FormControl>
                            <FormLabel fontSize="sm">18-24 meses (%)</FormLabel>
                            <NumberInput size="sm" min={0} max={100} defaultValue={20}>
                              <NumberInputField />
                            </NumberInput>
                          </FormControl>
                        </SimpleGrid>
                      </Box>

                      {/* Pessimistic Scenario */}
                      <Box p={4} borderWidth={1} borderRadius="md" borderColor="orange.200" bg="orange.50">
                        <Text fontWeight="bold" color="orange.700" mb={3}>Escenario Conservador</Text>
                        <SimpleGrid columns={2} spacing={3}>
                          <FormControl>
                            <FormLabel fontSize="sm">0-6 meses (%)</FormLabel>
                            <NumberInput size="sm" min={0} max={100} defaultValue={15}>
                              <NumberInputField />
                            </NumberInput>
                          </FormControl>
                          <FormControl>
                            <FormLabel fontSize="sm">6-12 meses (%)</FormLabel>
                            <NumberInput size="sm" min={0} max={100} defaultValue={20}>
                              <NumberInputField />
                            </NumberInput>
                          </FormControl>
                          <FormControl>
                            <FormLabel fontSize="sm">12-18 meses (%)</FormLabel>
                            <NumberInput size="sm" min={0} max={100} defaultValue={25}>
                              <NumberInputField />
                            </NumberInput>
                          </FormControl>
                          <FormControl>
                            <FormLabel fontSize="sm">18-24 meses (%)</FormLabel>
                            <NumberInput size="sm" min={0} max={100} defaultValue={25}>
                              <NumberInputField />
                            </NumberInput>
                          </FormControl>
                          <FormControl>
                            <FormLabel fontSize="sm">24+ meses (%)</FormLabel>
                            <NumberInput size="sm" min={0} max={100} defaultValue={15}>
                              <NumberInputField />
                            </NumberInput>
                          </FormControl>
                        </SimpleGrid>
                      </Box>

                      <Button 
                        colorScheme="purple" 
                        leftIcon={<FaCalculator />}
                        onClick={simulateSalesScenarios}
                        isLoading={simulating}
                        loadingText="Simulando..."
                      >
                        Simular Escenarios
                      </Button>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Simulation Results */}
                <Card>
                  <CardHeader>
                    <Heading size="sm">Comparación de Escenarios</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <TableContainer>
                        <Table variant="simple" size="sm">
                          <Thead>
                            <Tr>
                              <Th>Métrica</Th>
                              <Th color="green.600">Optimista</Th>
                              <Th color="blue.600">Realista</Th>
                              <Th color="orange.600">Conservador</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            <Tr>
                              <Td fontWeight="medium">NPV</Td>
                              <Td color="green.600">
                                {simulationResults?.scenarios.find(s => s.scenario_name === 'optimista')?.npv 
                                  ? formatCurrency(simulationResults.scenarios.find(s => s.scenario_name === 'optimista')!.npv) 
                                  : '$2.8M'}
                              </Td>
                              <Td color="blue.600">
                                {simulationResults?.scenarios.find(s => s.scenario_name === 'realista')?.npv 
                                  ? formatCurrency(simulationResults.scenarios.find(s => s.scenario_name === 'realista')!.npv) 
                                  : '$2.1M'}
                              </Td>
                              <Td color="orange.600">
                                {simulationResults?.scenarios.find(s => s.scenario_name === 'conservador')?.npv 
                                  ? formatCurrency(simulationResults.scenarios.find(s => s.scenario_name === 'conservador')!.npv) 
                                  : '$1.4M'}
                              </Td>
                            </Tr>
                            <Tr>
                              <Td fontWeight="medium">TIR</Td>
                              <Td color="green.600">
                                {simulationResults?.scenarios.find(s => s.scenario_name === 'optimista')?.irr 
                                  ? formatPercentage(simulationResults.scenarios.find(s => s.scenario_name === 'optimista')!.irr) 
                                  : '18.5%'}
                              </Td>
                              <Td color="blue.600">
                                {simulationResults?.scenarios.find(s => s.scenario_name === 'realista')?.irr 
                                  ? formatPercentage(simulationResults.scenarios.find(s => s.scenario_name === 'realista')!.irr) 
                                  : '15.2%'}
                              </Td>
                              <Td color="orange.600">
                                {simulationResults?.scenarios.find(s => s.scenario_name === 'conservador')?.irr 
                                  ? formatPercentage(simulationResults.scenarios.find(s => s.scenario_name === 'conservador')!.irr) 
                                  : '11.8%'}
                              </Td>
                            </Tr>
                            <Tr>
                              <Td fontWeight="medium">Payback</Td>
                              <Td color="green.600">
                                {simulationResults?.scenarios.find(s => s.scenario_name === 'optimista')?.payback_months 
                                  ? `${simulationResults.scenarios.find(s => s.scenario_name === 'optimista')!.payback_months} meses`
                                  : '20 meses'}
                              </Td>
                              <Td color="blue.600">
                                {simulationResults?.scenarios.find(s => s.scenario_name === 'realista')?.payback_months 
                                  ? `${simulationResults.scenarios.find(s => s.scenario_name === 'realista')!.payback_months} meses`
                                  : '24 meses'}
                              </Td>
                              <Td color="orange.600">
                                {simulationResults?.scenarios.find(s => s.scenario_name === 'conservador')?.payback_months 
                                  ? `${simulationResults.scenarios.find(s => s.scenario_name === 'conservador')!.payback_months} meses`
                                  : '32 meses'}
                              </Td>
                            </Tr>
                            <Tr>
                              <Td fontWeight="medium">Max Exposición</Td>
                              <Td color="green.600">
                                {simulationResults?.scenarios.find(s => s.scenario_name === 'optimista')?.max_exposure 
                                  ? formatCurrency(simulationResults.scenarios.find(s => s.scenario_name === 'optimista')!.max_exposure) 
                                  : '$8.2M'}
                              </Td>
                              <Td color="blue.600">
                                {simulationResults?.scenarios.find(s => s.scenario_name === 'realista')?.max_exposure 
                                  ? formatCurrency(simulationResults.scenarios.find(s => s.scenario_name === 'realista')!.max_exposure) 
                                  : '$9.1M'}
                              </Td>
                              <Td color="orange.600">
                                {simulationResults?.scenarios.find(s => s.scenario_name === 'conservador')?.max_exposure 
                                  ? formatCurrency(simulationResults.scenarios.find(s => s.scenario_name === 'conservador')!.max_exposure) 
                                  : '$10.8M'}
                              </Td>
                            </Tr>
                          </Tbody>
                        </Table>
                      </TableContainer>

                      <Alert status="warning" size="sm">
                        <AlertIcon />
                        <Box>
                          <Text fontWeight="bold" fontSize="sm">Nota Importante</Text>
                          <Text fontSize="sm">
                            Estos son datos simulados. Ejecute el cálculo financiero para obtener valores reales.
                          </Text>
                        </Box>
                      </Alert>
                    </VStack>
                  </CardBody>
                </Card>
              </SimpleGrid>

              {/* Cash Flow Impact Chart */}
              <Card>
                <CardHeader>
                  <Heading size="sm">Impacto en Flujo de Caja del Proyecto</Heading>
                </CardHeader>
                <CardBody>
                  <Text fontSize="sm" color="gray.600" mb={4}>
                    Comparación del flujo de caja acumulado bajo diferentes escenarios de venta
                  </Text>
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={[
                      { month: 'Mes 0', optimista: 0, realista: 0, conservador: 0 },
                      { month: 'Mes 6', optimista: -2000000, realista: -3500000, conservador: -4500000 },
                      { month: 'Mes 12', optimista: 1200000, realista: -800000, conservador: -2200000 },
                      { month: 'Mes 18', optimista: 4800000, realista: 2100000, conservador: -500000 },
                      { month: 'Mes 24', optimista: 7200000, realista: 4500000, conservador: 1800000 },
                      { month: 'Mes 30', optimista: 8500000, realista: 6200000, conservador: 3400000 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend />
                      <Line type="monotone" dataKey="optimista" stroke="#10b981" name="Optimista" strokeWidth={2} />
                      <Line type="monotone" dataKey="realista" stroke="#3b82f6" name="Realista" strokeWidth={2} />
                      <Line type="monotone" dataKey="conservador" stroke="#f59e0b" name="Conservador" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardBody>
              </Card>

              {/* Company Cash Flow Impact */}
              <Card>
                <CardHeader>
                  <Heading size="sm">Impacto en Flujo de Caja Empresarial</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Text fontSize="sm" color="gray.600">
                      Análisis del impacto en la liquidez general de la empresa considerando otros proyectos en cartera
                    </Text>
                    
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                      <Stat size="sm">
                        <StatLabel>Liquidez Mínima Requerida</StatLabel>
                        <StatNumber color="red.600">
                          {simulationResults?.company_impact?.min_liquidity_required 
                            ? formatCurrency(simulationResults.company_impact.min_liquidity_required)
                            : '$12.5M'}
                        </StatNumber>
                        <StatHelpText>
                          En el mes {simulationResults?.company_impact?.critical_month || 14} (Escenario Conservador)
                        </StatHelpText>
                      </Stat>
                      <Stat size="sm">
                        <StatLabel>Línea de Crédito Recomendada</StatLabel>
                        <StatNumber color="blue.600">
                          {simulationResults?.company_impact?.recommended_credit_line 
                            ? formatCurrency(simulationResults.company_impact.recommended_credit_line)
                            : '$15.0M'}
                        </StatNumber>
                        <StatHelpText>Con 20% de buffer</StatHelpText>
                      </Stat>
                      <Stat size="sm">
                        <StatLabel>Riesgo de Liquidez</StatLabel>
                        <StatNumber color={
                          simulationResults?.company_impact?.liquidity_risk_level === 'ALTO' ? 'red.600' :
                          simulationResults?.company_impact?.liquidity_risk_level === 'MEDIO' ? 'orange.600' : 'green.600'
                        }>
                          {simulationResults?.company_impact?.liquidity_risk_level || 'Medio'}
                        </StatNumber>
                        <StatHelpText>Requiere monitoreo</StatHelpText>
                      </Stat>
                    </SimpleGrid>

                    <Alert status="info">
                      <AlertIcon />
                      <Box>
                        <Text fontWeight="bold">Recomendaciones de Gestión de Riesgo</Text>
                        <UnorderedList mt={2} fontSize="sm">
                          {simulationResults?.company_impact?.recommendations?.length ? 
                            simulationResults.company_impact.recommendations.map((recommendation, index) => (
                              <ListItem key={index}>{recommendation}</ListItem>
                            )) : 
                            <>
                              <ListItem>Asegurar línea de crédito de $15M antes del inicio</ListItem>
                              <ListItem>Acelerar ventas en primeros 6 meses con incentivos</ListItem>
                              <ListItem>Implementar escenario de preventa del 30% mínimo</ListItem>
                              <ListItem>Monitorear flujo semanal durante primeros 18 meses</ListItem>
                            </>
                          }
                        </UnorderedList>
                      </Box>
                    </Alert>
                  </VStack>
                </CardBody>
              </Card>
            </VStack>
          </TabPanel>

          {/* Analysis Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <Heading size="md">Análisis de Sensibilidad</Heading>
              
              <Alert status="info">
                <AlertIcon />
                <Box>
                  <Text fontWeight="bold">Análisis de Variables Clave</Text>
                  <Text>
                    Evalúa cómo los cambios en variables importantes afectan la rentabilidad del proyecto.
                    Configura el rango de variación y ejecuta el análisis.
                  </Text>
                </Box>
              </Alert>

              {/* Configuration Panel */}
              <Card>
                <CardHeader>
                  <Heading size="sm">Configuración del Análisis</Heading>
                </CardHeader>
                <CardBody>
                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                    <FormControl>
                      <FormLabel>Variación Mínima (%)</FormLabel>
                      <NumberInput 
                        value={analysisConfig.min_variation_pct}
                        onChange={(_, val) => setAnalysisConfig(prev => ({...prev, min_variation_pct: val || -30}))}
                        min={-50}
                        max={0}
                      >
                        <NumberInputField />
                      </NumberInput>
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Variación Máxima (%)</FormLabel>
                      <NumberInput 
                        value={analysisConfig.max_variation_pct}
                        onChange={(_, val) => setAnalysisConfig(prev => ({...prev, max_variation_pct: val || 30}))}
                        min={0}
                        max={100}
                      >
                        <NumberInputField />
                      </NumberInput>
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Número de Pasos</FormLabel>
                      <NumberInput 
                        value={analysisConfig.steps}
                        onChange={(_, val) => setAnalysisConfig(prev => ({...prev, steps: val || 13}))}
                        min={5}
                        max={25}
                      >
                        <NumberInputField />
                      </NumberInput>
                    </FormControl>
                  </SimpleGrid>
                </CardBody>
              </Card>

              {/* Analysis Buttons */}
              <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
                <Button
                  leftIcon={<FaChartLine />}
                  colorScheme="blue"
                  variant="outline"
                  h="100px"
                  isLoading={isAnalyzing && selectedAnalysisType === 'PRICE_PER_M2'}
                  loadingText="Analizando..."
                  onClick={() => runSensitivityAnalysis('PRICE_PER_M2')}
                >
                  <VStack spacing={2}>
                    <Text>Análisis de Precio</Text>
                    <Text fontSize="sm" color="gray.500">
                      Precio por m²
                    </Text>
                  </VStack>
                </Button>
                
                <Button
                  leftIcon={<FaBuilding />}
                  colorScheme="purple"
                  variant="outline"
                  h="100px"
                  isLoading={isAnalyzing && selectedAnalysisType === 'UNIT_SIZE'}
                  loadingText="Analizando..."
                  onClick={() => runSensitivityAnalysis('UNIT_SIZE')}
                >
                  <VStack spacing={2}>
                    <Text>Tamaño de Unidades</Text>
                    <Text fontSize="sm" color="gray.500">
                      m² por unidad
                    </Text>
                  </VStack>
                </Button>
                
                <Button
                  leftIcon={<FaDollarSign />}
                  colorScheme="orange"
                  variant="outline"
                  h="100px"
                  isLoading={isAnalyzing && selectedAnalysisType === 'TOTAL_UNITS'}
                  loadingText="Analizando..."
                  onClick={() => runSensitivityAnalysis('TOTAL_UNITS')}
                >
                  <VStack spacing={2}>
                    <Text>Número de Unidades</Text>
                    <Text fontSize="sm" color="gray.500">
                      Total del proyecto
                    </Text>
                  </VStack>
                </Button>
                
                <Button
                  leftIcon={<FaChartLine />}
                  colorScheme="teal"
                  variant="outline"
                  h="100px"
                  isLoading={isAnalyzing && selectedAnalysisType === 'DISCOUNT_RATE'}
                  loadingText="Analizando..."
                  onClick={() => runSensitivityAnalysis('DISCOUNT_RATE')}
                >
                  <VStack spacing={2}>
                    <Text>Tasa de Descuento</Text>
                    <Text fontSize="sm" color="gray.500">
                      Costo de capital
                    </Text>
                  </VStack>
                </Button>
              </SimpleGrid>

              {/* Results Display */}
              {sensitivityResults.length > 0 && (
                <Card>
                  <CardHeader>
                    <Heading size="sm">Resultados del Análisis</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      {sensitivityResults.map((result, index) => (
                        <Box key={index} p={4} borderWidth={1} borderRadius="md">
                          <HStack justify="space-between" mb={2}>
                            <Heading size="xs">{result.analysis_name}</Heading>
                            <Badge colorScheme="blue">
                              {new Date(result.created_at).toLocaleDateString()}
                            </Badge>
                          </HStack>
                          
                          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                            <Stat>
                              <StatLabel>Valor Base</StatLabel>
                              <StatNumber fontSize="md">
                                {formatCurrency(result.base_value)}
                              </StatNumber>
                            </Stat>
                            
                            <Stat>
                              <StatLabel>NPV Base</StatLabel>
                              <StatNumber fontSize="md">
                                {result.base_npv ? formatCurrency(result.base_npv) : 'N/A'}
                              </StatNumber>
                            </Stat>
                            
                            <Stat>
                              <StatLabel>TIR Base</StatLabel>
                              <StatNumber fontSize="md">
                                {result.base_irr ? formatPercentage(result.base_irr) : 'N/A'}
                              </StatNumber>
                            </Stat>
                            
                            <Stat>
                              <StatLabel>Payback</StatLabel>
                              <StatNumber fontSize="md">
                                {result.base_payback_months ? `${result.base_payback_months} meses` : 'N/A'}
                              </StatNumber>
                            </Stat>
                          </SimpleGrid>
                          
                          <Text fontSize="sm" color="gray.600" mt={2}>
                            Rango: {result.min_variation_pct}% a {result.max_variation_pct}% en {result.steps} pasos
                          </Text>
                          
                          {result.results && (
                            <Box mt={4}>
                              <Text fontSize="sm" fontWeight="bold" mb={2}>
                                Escenarios Analizados: {Object.keys(result.results).length}
                              </Text>
                              <Alert status="success" size="sm">
                                <AlertIcon />
                                <Text fontSize="sm">
                                  Análisis completado. Los resultados detallados incluyen variaciones de NPV, TIR y período de recuperación para cada escenario.
                                </Text>
                              </Alert>
                            </Box>
                          )}
                        </Box>
                      ))}
                    </VStack>
                  </CardBody>
                </Card>
              )}
              
              {sensitivityResults.length === 0 && !isAnalyzing && (
                <Box textAlign="center" py={8}>
                  <Text color="gray.500">
                    No hay análisis de sensibilidad disponibles. Ejecuta un análisis para ver los resultados.
                  </Text>
                </Box>
              )}
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Add Cost Item Modal */}
      <Modal isOpen={isAddCostOpen} onClose={onAddCostClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Agregar Item de Costo</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <SimpleGrid columns={2} spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Categoría</FormLabel>
                  <Select
                    value={newCostItem.categoria}
                    onChange={(e) => setNewCostItem({...newCostItem, categoria: e.target.value})}
                    placeholder="Seleccionar categoría"
                  >
                    <option value="Terreno">Terreno</option>
                    <option value="Costos Duros">Costos Duros</option>
                    <option value="Costos Blandos">Costos Blandos</option>
                    <option value="Financiación">Financiación</option>
                    <option value="Contingencia">Contingencia</option>
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Subcategoría</FormLabel>
                  <Input
                    value={newCostItem.subcategoria}
                    onChange={(e) => setNewCostItem({...newCostItem, subcategoria: e.target.value})}
                    placeholder="Ej: Construcción"
                  />
                </FormControl>
              </SimpleGrid>

              <FormControl isRequired>
                <FormLabel>Partida de Costo</FormLabel>
                <Input
                  value={newCostItem.partida_costo}
                  onChange={(e) => setNewCostItem({...newCostItem, partida_costo: e.target.value})}
                  placeholder="Ej: Estructura y Cimentación"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Base de Costo</FormLabel>
                <Select
                  value={newCostItem.base_costo}
                  onChange={(e) => setNewCostItem({...newCostItem, base_costo: e.target.value})}
                  placeholder="Seleccionar base"
                >
                  <option value="Monto Fijo">Monto Fijo</option>
                  <option value="por m²">por m²</option>
                  <option value="por unidad">por unidad</option>
                  <option value="% Costos Duros">% Costos Duros</option>
                  <option value="% Ingresos por Venta">% Ingresos por Venta</option>
                  <option value="% Costos Totales">% Costos Totales</option>
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Monto Proyectado</FormLabel>
                <NumberInput>
                  <NumberInputField
                    value={newCostItem.monto_proyectado}
                    onChange={(e) => setNewCostItem({...newCostItem, monto_proyectado: e.target.value})}
                    placeholder="0.00"
                  />
                </NumberInput>
              </FormControl>

              <SimpleGrid columns={2} spacing={4}>
                <FormControl>
                  <FormLabel>Mes de Inicio</FormLabel>
                  <NumberInput min={1} max={60}>
                    <NumberInputField
                      value={newCostItem.start_month}
                      onChange={(e) => setNewCostItem({...newCostItem, start_month: e.target.value})}
                    />
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>Duración (meses)</FormLabel>
                  <NumberInput min={1} max={60}>
                    <NumberInputField
                      value={newCostItem.duration_months}
                      onChange={(e) => setNewCostItem({...newCostItem, duration_months: e.target.value})}
                    />
                  </NumberInput>
                </FormControl>
              </SimpleGrid>

              <FormControl>
                <FormLabel>Notas</FormLabel>
                <Textarea
                  value={newCostItem.notes}
                  onChange={(e) => setNewCostItem({...newCostItem, notes: e.target.value})}
                  placeholder="Notas adicionales..."
                  rows={3}
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onAddCostClose}>
              Cancelar
            </Button>
            <Button colorScheme="purple" onClick={addCostItem}>
              Agregar Item
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ScenarioProjectDetailPage; 