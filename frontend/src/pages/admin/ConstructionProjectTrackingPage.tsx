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
  Progress
} from '@chakra-ui/react';
import { 
  FaArrowLeft, 
  FaCalculator, 
  FaChartLine,
  FaDollarSign,
  FaBuilding,
  FaSync,
  FaCreditCard,
  FaClock,
  FaHammer,
  FaUsers,
  FaPlus
} from 'react-icons/fa';
import { EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// TypeScript interfaces
interface ConstructionProject {
  id: number;
  project_name: string;
  client_name: string;
  project_type?: string;
  location?: string;
  status: string;
  priority: string;
  total_area_m2?: number;
  project_duration_days?: number;
  bid_deadline?: string;
  created_at: string;
  updated_at: string;
}

interface ConstructionCostItem {
  id: number;
  construction_project_id: number;
  categoria: string;
  subcategoria: string;
  partida_costo: string;
  base_costo: string;
  monto_proyectado?: number;
  monto_real?: number;
  unit_cost?: number;
  quantity?: number;
  unit_of_measure?: string;
  source_quote_id?: number;
  source_line_item_id?: number;
  status: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ConstructionCashFlowItem {
  year: number;
  month: number;
  period_label: string;
  ingresos_pagos_cliente: number;
  total_ingresos: number;
  costos_materiales: number;
  costos_mano_obra: number;
  costos_equipos: number;
  costos_subcontratos: number;
  costos_administrativos: number;
  costos_financiacion: number;
  total_egresos: number;
  flujo_neto: number;
  flujo_acumulado: number;
  flujo_descontado: number;
  avance_obra_pct: number;
}

interface ConstructionMetrics {
  total_investment?: number;
  total_revenue?: number;
  total_profit?: number;
  profit_margin_pct?: number;
  npv?: number;
  irr?: number;
  payback_months?: number;
  profitability_index?: number;
  cost_per_m2?: number;
  revenue_per_m2?: number;
  profit_per_m2?: number;
  max_negative_exposure?: number;
  break_even_month?: number;
}

const ConstructionProjectTrackingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  
  // State
  const [project, setProject] = useState<ConstructionProject | null>(null);
  const [costItems, setCostItems] = useState<ConstructionCostItem[]>([]);
  const [cashFlow, setCashFlow] = useState<ConstructionCashFlowItem[]>([]);
  const [metrics, setMetrics] = useState<ConstructionMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [simulatingPayments, setSimulatingPayments] = useState(false);
  
  // Modal states
  const { isOpen: isAddCostOpen, onOpen: onAddCostOpen, onClose: onAddCostClose } = useDisclosure();
  const { isOpen: isEditCostOpen, onOpen: onEditCostOpen, onClose: onEditCostClose } = useDisclosure();
  const { isOpen: isPaymentSimulationOpen, onOpen: onPaymentSimulationOpen, onClose: onPaymentSimulationClose } = useDisclosure();
  
  // Form states for new cost item
  const [newCostItem, setNewCostItem] = useState({
    categoria: 'CONSTRUCCION',
    subcategoria: 'MATERIALES',
    partida_costo: '',
    base_costo: 'fijo',
    monto_proyectado: '',
    unit_cost: '',
    quantity: '',
    start_month: '1',
    duration_months: '1',
    notes: ''
  });

  // Form states for editing cost item
  const [editingCostItem, setEditingCostItem] = useState<ConstructionCostItem | null>(null);
  const [editCostForm, setEditCostForm] = useState({
    categoria: '',
    subcategoria: '',
    partida_costo: '',
    base_costo: '',
    monto_proyectado: '',
    monto_real: '',
    unit_cost: '',
    quantity: '',
    unit_of_measure: '',
    status: 'PLANNED',
    notes: ''
  });

  // Payment simulation state
  const [paymentScenarios, setPaymentScenarios] = useState([
    {
      scenario_name: 'Conservador',
      anticipo_percentage: 20,
      pago_avance_30_pct: 25,
      pago_avance_60_pct: 25,
      pago_final_entrega: 30,
      retraso_pagos_dias: 15
    },
    {
      scenario_name: 'Optimista',
      anticipo_percentage: 40,
      pago_avance_30_pct: 30,
      pago_avance_60_pct: 20,
      pago_final_entrega: 10,
      retraso_pagos_dias: 5
    }
  ]);

  const [scheduleScenarios, setScheduleScenarios] = useState([
    {
      scenario_name: 'Cronograma Base',
      duration_adjustment_pct: 0,
      cost_impact_pct: 0,
      description: 'Cronograma original del proyecto'
    },
    {
      scenario_name: 'Adelanto 15%',
      duration_adjustment_pct: -15,
      cost_impact_pct: 8,
      description: 'Acelerar obra con recursos adicionales'
    },
    {
      scenario_name: 'Atraso 20%',
      duration_adjustment_pct: 20,
      cost_impact_pct: 12,
      description: 'Retraso por condiciones adversas'
    }
  ]);

  const [simulationResults, setSimulationResults] = useState<any>(null);
  const [cashFlowImpact, setCashFlowImpact] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetchProjectDetails();
      fetchCostItems();
      fetchMetrics();
      fetchCashFlow();
      fetchCashFlowImpact();
    }
  }, [id]);

  const fetchProjectDetails = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/construction-quotes/projects/${id}`);
      if (response.ok) {
        const data = await response.json();
        setProject(data);
      }
    } catch (error) {
      console.error('Error fetching project:', error);
    }
  };

  const fetchCostItems = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/construction-tracking/projects/${id}/cost-items`);
      if (response.ok) {
        const data = await response.json();
        setCostItems(data);
      }
    } catch (error) {
      console.error('Error fetching cost items:', error);
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/construction-tracking/projects/${id}/metrics`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCashFlow = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/construction-tracking/projects/${id}/cash-flow`);
      if (response.ok) {
        const data = await response.json();
        setCashFlow(data);
      }
    } catch (error) {
      console.error('Error fetching cash flow:', error);
    }
  };

  const fetchCashFlowImpact = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/construction-tracking/projects/${id}/cash-flow-impact`);
      if (response.ok) {
        const data = await response.json();
        setCashFlowImpact(data);
      }
    } catch (error) {
      console.error('Error fetching cash flow impact:', error);
    }
  };

  const calculateFinancials = async () => {
    try {
      setCalculating(true);
      
      const response = await fetch(`${API_BASE_URL}/api/construction-tracking/projects/${id}/calculate-financials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          construction_project_id: parseInt(id!),
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
            duration: 3000,
            isClosable: true,
          });
          
          // Refresh data
          fetchMetrics();
          fetchCashFlow();
        } else {
          throw new Error(result.message);
        }
      }
    } catch (error) {
      toast({
        title: 'Error en Cálculo',
        description: 'No se pudieron calcular las métricas financieras',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setCalculating(false);
    }
  };

  const simulatePayments = async () => {
    try {
      setSimulatingPayments(true);
      
      const response = await fetch(`${API_BASE_URL}/api/construction-tracking/projects/${id}/simulate-payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_payment_scenarios: paymentScenarios,
          schedule_scenarios: scheduleScenarios
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSimulationResults(result);
          toast({
            title: 'Simulación Completada',
            description: result.message,
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        } else {
          throw new Error(result.message);
        }
      }
    } catch (error) {
      toast({
        title: 'Error en Simulación',
        description: 'No se pudo completar la simulación de pagos',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSimulatingPayments(false);
    }
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('es-PA', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (rate?: number) => {
    if (rate === undefined || rate === null || typeof rate !== 'number') return 'N/A';
    return `${rate.toFixed(1)}%`;
  };

  const formatPercentageValue = (rate?: number) => {
    if (rate === undefined || rate === null || typeof rate !== 'number') return '0.0';
    return rate.toFixed(1);
  };

  const formatDecimal = (value?: number, decimals: number = 2) => {
    if (value === undefined || value === null || typeof value !== 'number' || isNaN(value)) return '0.00';
    return value.toFixed(decimals);
  };

  const openEditModal = (item: ConstructionCostItem) => {
    setEditingCostItem(item);
    setEditCostForm({
      categoria: item.categoria,
      subcategoria: item.subcategoria,
      partida_costo: item.partida_costo,
      base_costo: item.base_costo,
      monto_proyectado: item.monto_proyectado?.toString() || '',
      monto_real: item.monto_real?.toString() || '',
      unit_cost: item.unit_cost?.toString() || '',
      quantity: item.quantity?.toString() || '',
      unit_of_measure: item.unit_of_measure || '',
      status: item.status,
      notes: item.notes || ''
    });
    onEditCostOpen();
  };

  const handleUpdateCostItem = async () => {
    if (!editingCostItem) return;

    try {
      const updateData = {
        categoria: editCostForm.categoria,
        subcategoria: editCostForm.subcategoria,
        partida_costo: editCostForm.partida_costo,
        base_costo: editCostForm.base_costo,
        monto_proyectado: editCostForm.monto_proyectado ? parseFloat(editCostForm.monto_proyectado) : null,
        monto_real: editCostForm.monto_real ? parseFloat(editCostForm.monto_real) : null,
        unit_cost: editCostForm.unit_cost ? parseFloat(editCostForm.unit_cost) : null,
        quantity: editCostForm.quantity ? parseFloat(editCostForm.quantity) : null,
        unit_of_measure: editCostForm.unit_of_measure || null,
        status: editCostForm.status,
        notes: editCostForm.notes || null
      };

      const response = await fetch(
        `${API_BASE_URL}/api/construction-tracking/projects/${id}/cost-items/${editingCostItem.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        }
      );

      if (response.ok) {
        toast({
          title: 'Item Actualizado',
          description: 'El item de costo se actualizó exitosamente',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Refresh cost items
        fetchCostItems();
        onEditCostClose();
      } else {
        throw new Error('Error al actualizar el item');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el item de costo',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDeleteCostItem = async (itemId: number) => {
    if (!window.confirm('¿Estás seguro de que quieres desactivar este item de costo?')) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/construction-tracking/projects/${id}/cost-items/${itemId}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        toast({
          title: 'Item Desactivado',
          description: 'El item de costo se desactivó exitosamente',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Refresh cost items
        fetchCostItems();
      } else {
        throw new Error('Error al desactivar el item');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo desactivar el item de costo',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'BIDDING': return 'orange';
      case 'QUOTED': return 'blue';
      case 'AWARDED': return 'green';
      case 'IN_PROGRESS': return 'purple';
      case 'COMPLETED': return 'green';
      case 'REJECTED': return 'red';
      default: return 'gray';
    }
  };

  const getCategoriaColor = (categoria: string) => {
    switch (categoria) {
      case 'CONSTRUCCION': return 'blue';
      case 'MATERIALES': return 'green';
      case 'MANO_OBRA': return 'orange';
      case 'EQUIPOS': return 'purple';
      case 'SUBCONTRATOS': return 'teal';
      case 'ADMINISTRATIVOS': return 'gray';
      default: return 'gray';
    }
  };

  // Calculate cost distribution by category
  const costByCategory = costItems.reduce((acc, item) => {
    const amount = item.monto_proyectado || 0;
    acc[item.categoria] = (acc[item.categoria] || 0) + amount;
    return acc;
  }, {} as Record<string, number>);

  const categoryData = Object.entries(costByCategory).map(([name, value]) => ({
    name,
    value
  }));

  // Prepare cash flow chart data
  const chartData = cashFlow.map(cf => ({
    month: cf.period_label,
    ingresos: cf.ingresos_pagos_cliente,
    egresos: cf.total_egresos,
    flujo_neto: cf.flujo_neto,
    flujo_acumulado: cf.flujo_acumulado,
    avance_obra: cf.avance_obra_pct
  }));

  if (loading) {
    return (
      <Center h="50vh">
        <Spinner size="xl" />
      </Center>
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
              {project.status}
            </Badge>
          </HStack>
          <Text color="gray.600">Cliente: {project.client_name}</Text>
        </VStack>
        <HStack spacing={3}>
          <Button
            leftIcon={<FaCalculator />}
            colorScheme="purple"
            onClick={calculateFinancials}
            isLoading={calculating}
            loadingText="Calculando..."
          >
            Calcular Financieros
          </Button>
          <Button
            leftIcon={<FaChartLine />}
            colorScheme="green"
            variant="outline"
            onClick={onPaymentSimulationOpen}
          >
            Simular Pagos
          </Button>
        </HStack>
      </HStack>

      {/* Metrics Overview */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>
                <HStack>
                  <FaDollarSign />
                  <Text>Inversión Total</Text>
                </HStack>
              </StatLabel>
              <StatNumber fontSize="lg">
                {formatCurrency(metrics?.total_investment)}
              </StatNumber>
              <StatHelpText>
                {metrics?.cost_per_m2 && `${formatCurrency(metrics.cost_per_m2)}/m²`}
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>
                <HStack>
                  <FaBuilding />
                  <Text>Ingresos Totales</Text>
                </HStack>
              </StatLabel>
              <StatNumber fontSize="lg">
                {formatCurrency(metrics?.total_revenue)}
              </StatNumber>
              <StatHelpText>
                {metrics?.revenue_per_m2 && `${formatCurrency(metrics.revenue_per_m2)}/m²`}
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>
                <HStack>
                  <FaChartLine />
                  <Text>VPN</Text>
                </HStack>
              </StatLabel>
              <StatNumber fontSize="lg" color={metrics?.npv && metrics.npv > 0 ? 'green.500' : 'red.500'}>
                {formatCurrency(metrics?.npv)}
              </StatNumber>
              <StatHelpText>
                TIR: {formatPercentage(metrics?.irr)}
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>
                <HStack>
                  <FaClock />
                  <Text>Recuperación</Text>
                </HStack>
              </StatLabel>
              <StatNumber fontSize="lg">
                {metrics?.payback_months ? `${metrics.payback_months} meses` : 'N/A'}
              </StatNumber>
              <StatHelpText>
                Margen: {formatPercentage(metrics?.profit_margin_pct)}
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Main Content Tabs */}
      <Tabs colorScheme="blue" variant="enclosed">
        <TabList>
          <Tab>Estructura de Costos</Tab>
          <Tab>Flujo de Caja</Tab>
          <Tab>Métricas Financieras</Tab>
          <Tab>Impacto en Cash Flow</Tab>
          <Tab>Simulación de Pagos</Tab>
        </TabList>

        <TabPanels>
          {/* Cost Structure Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <Flex justify="space-between" align="center">
                <Heading size="md">Estructura de Costos del Proyecto</Heading>
                <Button leftIcon={<FaPlus />} colorScheme="blue" onClick={onAddCostOpen}>
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
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        <Bar dataKey="value" fill="#3182ce" />
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
                          <Th>Cantidad</Th>
                          <Th>Costo Unitario</Th>
                          <Th>Monto Proyectado</Th>
                          <Th>Estado</Th>
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
                            <Td>
                              {item.quantity !== null && item.quantity !== undefined ? (
                                <Text fontSize="sm">
                                  {formatDecimal(item.quantity)} {item.unit_of_measure || ''}
                                </Text>
                              ) : (
                                <Text fontSize="sm" color="gray.400">
                                  Sin especificar
                                </Text>
                              )}
                            </Td>
                            <Td>
                              {item.unit_cost !== null && item.unit_cost !== undefined ? (
                                <Text fontSize="sm">
                                  {formatCurrency(item.unit_cost)}
                                </Text>
                              ) : (
                                <Text fontSize="sm" color="gray.400">
                                  Sin especificar
                                </Text>
                              )}
                            </Td>
                            <Td fontWeight="semibold">
                              {formatCurrency(item.monto_proyectado)}
                            </Td>
                            <Td>
                              <Badge 
                                colorScheme={item.status === 'PLANNED' ? 'blue' : 
                                           item.status === 'IN_PROGRESS' ? 'orange' : 
                                           item.status === 'COMPLETED' ? 'green' : 'gray'} 
                                size="sm"
                              >
                                {item.status}
                              </Badge>
                            </Td>
                            <Td>
                              <HStack spacing={2}>
                                <IconButton
                                  aria-label="Editar item"
                                  icon={<EditIcon />}
                                  size="sm"
                                  colorScheme="blue"
                                  variant="ghost"
                                  onClick={() => openEditModal(item)}
                                />
                                <IconButton
                                  aria-label="Eliminar item"
                                  icon={<DeleteIcon />}
                                  size="sm"
                                  colorScheme="red"
                                  variant="ghost"
                                  onClick={() => handleDeleteCostItem(item.id)}
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
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                          <Tooltip formatter={(value) => formatCurrency(value as number)} />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="ingresos" 
                            stroke="#28a745" 
                            strokeWidth={2}
                            name="Ingresos"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="egresos" 
                            stroke="#dc3545" 
                            strokeWidth={2}
                            name="Egresos"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="flujo_acumulado" 
                            stroke="#007bff" 
                            strokeWidth={3}
                            name="Flujo Acumulado"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardHeader>
                      <Heading size="sm">Detalle del Flujo de Caja</Heading>
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
                              <Th>% Avance Obra</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {cashFlow.slice(0, 12).map((cf) => (
                              <Tr key={cf.month}>
                                <Td>{cf.period_label}</Td>
                                <Td color="green.600" fontWeight="medium">
                                  {formatCurrency(cf.ingresos_pagos_cliente)}
                                </Td>
                                <Td color="red.600" fontWeight="medium">
                                  {formatCurrency(cf.total_egresos)}
                                </Td>
                                <Td color={cf.flujo_neto >= 0 ? "green.600" : "red.600"} fontWeight="semibold">
                                  {formatCurrency(cf.flujo_neto)}
                                </Td>
                                <Td fontWeight="semibold">
                                  {formatCurrency(cf.flujo_acumulado)}
                                </Td>
                                <Td>
                                  <Progress value={cf.avance_obra_pct || 0} colorScheme="blue" size="sm" />
                                  <Text fontSize="xs" mt={1}>{formatPercentageValue(cf.avance_obra_pct)}%</Text>
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
                <Alert status="info">
                  <AlertIcon />
                  No hay datos de flujo de caja disponibles. Ejecute el cálculo financiero primero.
                </Alert>
              )}
            </VStack>
          </TabPanel>

          {/* Financial Metrics Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <Heading size="md">Métricas Financieras del Proyecto</Heading>

              {metrics ? (
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <Card>
                    <CardHeader>
                      <Heading size="sm">Rentabilidad</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <Flex justify="space-between">
                          <Text>Valor Presente Neto (VPN):</Text>
                          <Text fontWeight="bold" color={metrics?.npv && metrics.npv > 0 ? 'green.500' : 'red.500'}>
                            {formatCurrency(metrics?.npv)}
                          </Text>
                        </Flex>
                        <Flex justify="space-between">
                          <Text>Tasa Interna de Retorno (TIR):</Text>
                          <Text fontWeight="bold">{formatPercentage(metrics?.irr)}</Text>
                        </Flex>
                        <Flex justify="space-between">
                          <Text>Margen de Ganancia:</Text>
                          <Text fontWeight="bold">{formatPercentage(metrics?.profit_margin_pct)}</Text>
                        </Flex>
                        <Flex justify="space-between">
                          <Text>Índice de Rentabilidad:</Text>
                          <Text fontWeight="bold">{formatDecimal(metrics?.profitability_index, 2)}</Text>
                        </Flex>
                      </VStack>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardHeader>
                      <Heading size="sm">Análisis de Riesgo</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <Flex justify="space-between">
                          <Text>Período de Recuperación:</Text>
                          <Text fontWeight="bold">
                            {metrics?.payback_months ? `${metrics.payback_months} meses` : 'N/A'}
                          </Text>
                        </Flex>
                        <Flex justify="space-between">
                          <Text>Exposición Negativa Máxima:</Text>
                          <Text fontWeight="bold" color="red.500">
                            {formatCurrency(metrics?.max_negative_exposure)}
                          </Text>
                        </Flex>
                        <Flex justify="space-between">
                          <Text>Mes de Punto de Equilibrio:</Text>
                          <Text fontWeight="bold">
                            {metrics?.break_even_month ? `Mes ${metrics.break_even_month}` : 'N/A'}
                          </Text>
                        </Flex>
                      </VStack>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardHeader>
                      <Heading size="sm">Métricas por m²</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <Flex justify="space-between">
                          <Text>Costo por m²:</Text>
                          <Text fontWeight="bold">{formatCurrency(metrics?.cost_per_m2)}</Text>
                        </Flex>
                        <Flex justify="space-between">
                          <Text>Ingreso por m²:</Text>
                          <Text fontWeight="bold">{formatCurrency(metrics?.revenue_per_m2)}</Text>
                        </Flex>
                        <Flex justify="space-between">
                          <Text>Ganancia por m²:</Text>
                          <Text fontWeight="bold" color="green.500">
                            {formatCurrency(metrics?.profit_per_m2)}
                          </Text>
                        </Flex>
                      </VStack>
                    </CardBody>
                  </Card>
                </SimpleGrid>
              ) : (
                <Alert status="info">
                  <AlertIcon />
                  No hay métricas financieras disponibles. Ejecute el cálculo financiero primero.
                </Alert>
              )}
            </VStack>
          </TabPanel>

          {/* Cash Flow Impact Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <Heading size="md">Impacto en Cash Flow Empresarial</Heading>
              
              <Text color="gray.600">
                Analice cómo este proyecto de construcción afectará el flujo de caja consolidado de la empresa.
              </Text>

              {cashFlowImpact ? (
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <Card>
                    <CardHeader>
                      <Heading size="sm">Análisis de Impacto</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <Flex justify="space-between">
                          <Text>Inversión Requerida:</Text>
                          <Text fontWeight="bold">
                            {formatCurrency(cashFlowImpact.analysis.total_investment_required)}
                          </Text>
                        </Flex>
                        <Flex justify="space-between">
                          <Text>Exposición Negativa Máxima:</Text>
                          <Text fontWeight="bold" color="red.500">
                            {formatCurrency(cashFlowImpact.analysis.max_negative_exposure)}
                          </Text>
                        </Flex>
                        <Flex justify="space-between">
                          <Text>Mes de Equilibrio:</Text>
                          <Text fontWeight="bold">
                            Mes {cashFlowImpact.analysis.break_even_month}
                          </Text>
                        </Flex>
                        <Flex justify="space-between">
                          <Text>Nivel de Riesgo:</Text>
                          <Badge
                            colorScheme={
                              cashFlowImpact.analysis.risk_level === 'HIGH' ? 'red' :
                              cashFlowImpact.analysis.risk_level === 'MEDIUM' ? 'orange' : 'green'
                            }
                          >
                            {cashFlowImpact.analysis.risk_level}
                          </Badge>
                        </Flex>
                      </VStack>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardHeader>
                      <Heading size="sm">Recomendaciones de Financiamiento</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={3} align="stretch">
                        <Text fontSize="sm">
                          <strong>Línea de Crédito Recomendada:</strong> {formatCurrency(cashFlowImpact.analysis.recommended_credit_line)}
                        </Text>
                        <Text fontSize="sm">
                          <strong>Reserva de Liquidez:</strong> {formatCurrency(cashFlowImpact.analysis.liquidity_reserve_needed)} en efectivo
                        </Text>
                        
                        {cashFlowImpact.recommendations && (
                          <Box>
                            <Text fontWeight="medium" mb={2}>Recomendaciones:</Text>
                            <VStack spacing={1} align="stretch">
                              {cashFlowImpact.recommendations.slice(0, 3).map((rec: string, index: number) => (
                                <Text key={index} fontSize="sm" color="gray.600">
                                  • {rec}
                                </Text>
                              ))}
                            </VStack>
                          </Box>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>
                </SimpleGrid>
              ) : (
                <Alert status="info">
                  <AlertIcon />
                  Calculando impacto en cash flow... Esta funcionalidad mostrará la proyección del impacto del proyecto en el cash flow empresarial.
                </Alert>
              )}
            </VStack>
          </TabPanel>

          {/* Payment Simulation Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <Flex justify="space-between" align="center">
                <Heading size="md">Simulación de Pagos del Cliente</Heading>
                <Button
                  leftIcon={<FaSync />}
                  colorScheme="green"
                  onClick={simulatePayments}
                  isLoading={simulatingPayments}
                  loadingText="Simulando..."
                >
                  Ejecutar Simulación
                </Button>
              </Flex>

              <Text color="gray.600">
                Configure diferentes escenarios de pagos del cliente y cronograma de obra para evaluar el impacto en el flujo de caja
              </Text>

              {simulationResults ? (
                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                  <Card>
                    <CardHeader>
                      <Heading size="sm">Resultados de Escenarios</Heading>
                    </CardHeader>
                    <CardBody>
                      <TableContainer>
                        <Table variant="simple" size="sm">
                          <Thead>
                            <Tr>
                              <Th>Escenario</Th>
                              <Th>VPN</Th>
                              <Th>Duración</Th>
                              <Th>Exposición Máx.</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {simulationResults.scenarios.map((scenario: any, index: number) => (
                              <Tr key={index}>
                                <Td fontSize="xs">{scenario.scenario_name}</Td>
                                <Td fontWeight="bold" color={scenario.npv > 0 ? 'green.500' : 'red.500'}>
                                  {formatCurrency(scenario.npv)}
                                </Td>
                                <Td>{Math.round(scenario.duration_days / 30)} meses</Td>
                                <Td color="red.500">
                                  {formatCurrency(scenario.max_negative_exposure)}
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </TableContainer>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardHeader>
                      <Heading size="sm">Impacto Empresarial</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={3} align="stretch">
                        <Flex justify="space-between">
                          <Text fontSize="sm">Liquidez Mínima Requerida:</Text>
                          <Text fontWeight="bold" fontSize="sm">
                            {formatCurrency(simulationResults.company_impact.min_liquidity_required)}
                          </Text>
                        </Flex>
                        <Flex justify="space-between">
                          <Text fontSize="sm">Línea de Crédito Recomendada:</Text>
                          <Text fontWeight="bold" fontSize="sm">
                            {formatCurrency(simulationResults.company_impact.recommended_credit_line)}
                          </Text>
                        </Flex>
                        <Flex justify="space-between">
                          <Text fontSize="sm">Mes Crítico:</Text>
                          <Text fontWeight="bold" fontSize="sm">
                            Mes {simulationResults.company_impact.critical_month}
                          </Text>
                        </Flex>
                        <Flex justify="space-between">
                          <Text fontSize="sm">Nivel de Riesgo de Liquidez:</Text>
                          <Badge
                            colorScheme={
                              simulationResults.company_impact.liquidity_risk_level === 'HIGH' ? 'red' :
                              simulationResults.company_impact.liquidity_risk_level === 'MEDIUM' ? 'orange' : 'green'
                            }
                            fontSize="xs"
                          >
                            {simulationResults.company_impact.liquidity_risk_level}
                          </Badge>
                        </Flex>
                      </VStack>
                    </CardBody>
                  </Card>
                </SimpleGrid>
              ) : (
                <Alert status="info">
                  <AlertIcon />
                  Haga clic en "Ejecutar Simulación" para analizar diferentes escenarios de pagos y cronograma de obra.
                </Alert>
              )}

              {simulationResults?.recommendations && (
                <Card>
                  <CardHeader>
                    <Heading size="sm">Recomendaciones</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={2} align="stretch">
                      {simulationResults.recommendations.map((rec: string, index: number) => (
                        <Text key={index} fontSize="sm" color="gray.700">
                          • {rec}
                        </Text>
                      ))}
                    </VStack>
                  </CardBody>
                </Card>
              )}
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Payment Simulation Modal */}
      <Modal isOpen={isPaymentSimulationOpen} onClose={onPaymentSimulationClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Configurar Simulación de Pagos</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text fontSize="sm" color="gray.600">
                Configure los escenarios de pago del cliente y cronograma de obra que desea simular.
              </Text>
              <Text fontSize="sm" fontWeight="medium" color="blue.600">
                Los escenarios predefinidos incluyen patrones típicos de pago en construcción y 
                variaciones en el cronograma de obra.
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onPaymentSimulationClose}>
              Cancelar
            </Button>
            <Button
              colorScheme="green"
              onClick={() => {
                onPaymentSimulationClose();
                simulatePayments();
              }}
            >
              Ejecutar Simulación
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Cost Item Modal */}
      <Modal isOpen={isEditCostOpen} onClose={onEditCostClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Editar Item de Costo</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Categoría</FormLabel>
                <Select
                  value={editCostForm.categoria}
                  onChange={(e) => setEditCostForm({ ...editCostForm, categoria: e.target.value })}
                >
                  <option value="CONSTRUCCION">Construcción</option>
                  <option value="MATERIALES">Materiales</option>
                  <option value="MANO_OBRA">Mano de Obra</option>
                  <option value="EQUIPOS">Equipos</option>
                  <option value="SUBCONTRATOS">Subcontratos</option>
                  <option value="ADMINISTRATIVOS">Administrativos</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Subcategoría</FormLabel>
                <Input
                  value={editCostForm.subcategoria}
                  onChange={(e) => setEditCostForm({ ...editCostForm, subcategoria: e.target.value })}
                  placeholder="Subcategoría"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Partida de Costo</FormLabel>
                <Input
                  value={editCostForm.partida_costo}
                  onChange={(e) => setEditCostForm({ ...editCostForm, partida_costo: e.target.value })}
                  placeholder="Descripción del item de costo"
                />
              </FormControl>

              <HStack spacing={4} width="100%">
                <FormControl>
                  <FormLabel>Cantidad</FormLabel>
                  <NumberInput>
                    <NumberInputField
                      value={editCostForm.quantity}
                      onChange={(e) => setEditCostForm({ ...editCostForm, quantity: e.target.value })}
                      placeholder="0.00"
                    />
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>Unidad de Medida</FormLabel>
                  <Input
                    value={editCostForm.unit_of_measure}
                    onChange={(e) => setEditCostForm({ ...editCostForm, unit_of_measure: e.target.value })}
                    placeholder="m², kg, unidad, etc."
                  />
                </FormControl>
              </HStack>

              <HStack spacing={4} width="100%">
                <FormControl>
                  <FormLabel>Costo Unitario</FormLabel>
                  <NumberInput>
                    <NumberInputField
                      value={editCostForm.unit_cost}
                      onChange={(e) => setEditCostForm({ ...editCostForm, unit_cost: e.target.value })}
                      placeholder="0.00"
                    />
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>Monto Proyectado</FormLabel>
                  <NumberInput>
                    <NumberInputField
                      value={editCostForm.monto_proyectado}
                      onChange={(e) => setEditCostForm({ ...editCostForm, monto_proyectado: e.target.value })}
                      placeholder="0.00"
                    />
                  </NumberInput>
                </FormControl>
              </HStack>

              <FormControl>
                <FormLabel>Monto Real (Gastado)</FormLabel>
                <NumberInput>
                  <NumberInputField
                    value={editCostForm.monto_real}
                    onChange={(e) => setEditCostForm({ ...editCostForm, monto_real: e.target.value })}
                    placeholder="0.00"
                  />
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel>Estado</FormLabel>
                <Select
                  value={editCostForm.status}
                  onChange={(e) => setEditCostForm({ ...editCostForm, status: e.target.value })}
                >
                  <option value="PLANNED">Planificado</option>
                  <option value="IN_PROGRESS">En Progreso</option>
                  <option value="COMPLETED">Completado</option>
                  <option value="ON_HOLD">En Espera</option>
                  <option value="CANCELLED">Cancelado</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Notas</FormLabel>
                <Textarea
                  value={editCostForm.notes}
                  onChange={(e) => setEditCostForm({ ...editCostForm, notes: e.target.value })}
                  placeholder="Notas adicionales sobre este item..."
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEditCostClose}>
              Cancelar
            </Button>
            <Button colorScheme="blue" onClick={handleUpdateCostItem}>
              Actualizar Item
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Add Cost Item Modal */}
      <Modal isOpen={isAddCostOpen} onClose={onAddCostClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Agregar Item de Costo</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Categoría</FormLabel>
                <Select
                  value={newCostItem.categoria}
                  onChange={(e) => setNewCostItem({ ...newCostItem, categoria: e.target.value })}
                >
                  <option value="CONSTRUCCION">Construcción</option>
                  <option value="MATERIALES">Materiales</option>
                  <option value="MANO_OBRA">Mano de Obra</option>
                  <option value="EQUIPOS">Equipos</option>
                  <option value="SUBCONTRATOS">Subcontratos</option>
                  <option value="ADMINISTRATIVOS">Administrativos</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Partida de Costo</FormLabel>
                <Input
                  value={newCostItem.partida_costo}
                  onChange={(e) => setNewCostItem({ ...newCostItem, partida_costo: e.target.value })}
                  placeholder="Descripción del item de costo"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Monto Proyectado</FormLabel>
                <NumberInput>
                  <NumberInputField
                    value={newCostItem.monto_proyectado}
                    onChange={(e) => setNewCostItem({ ...newCostItem, monto_proyectado: e.target.value })}
                    placeholder="0.00"
                  />
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel>Notas</FormLabel>
                <Textarea
                  value={newCostItem.notes}
                  onChange={(e) => setNewCostItem({ ...newCostItem, notes: e.target.value })}
                  placeholder="Notas adicionales sobre este item..."
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onAddCostClose}>
              Cancelar
            </Button>
            <Button colorScheme="blue" onClick={onAddCostClose}>
              Agregar Item
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ConstructionProjectTrackingPage; 