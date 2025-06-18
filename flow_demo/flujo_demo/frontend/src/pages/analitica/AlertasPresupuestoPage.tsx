import React, { useState, useEffect, useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Heading,
  VStack,
  HStack,
  Grid,
  Card,
  CardHeader,
  CardBody,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Text,
  Spinner,
  Center,
  Button,
  Badge,
  Flex,
  useToast,
  Alert,
  AlertIcon,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Tag,
  TagLabel,
  SimpleGrid,
  IconButton
} from '@chakra-ui/react';
import { 
  FaExclamationTriangle,
  FaExclamationCircle,
  FaInfoCircle,
  FaCheckCircle,
  FaSearch,
  FaFilter,
  FaBell,
  FaBuilding,
  FaArrowUp,
  FaArrowDown,
  FaSync,
  FaEye,
  FaCog,
  FaChartLine,
  FaPercent
} from 'react-icons/fa';
import { api, contabilidadApi, payrollFlowApi } from '../../api/api';

// Interfaces
interface BudgetAlert {
  id: string;
  category: string;
  subcategory?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: 'overspend' | 'underspend' | 'trend' | 'threshold';
  title: string;
  description: string;
  budgetAmount: number;
  actualAmount: number;
  variance: number;
  variancePercent: number;
  dateGenerated: string;
  isRead: boolean;
}

interface VarianceAnalysis {
  category: string;
  subcategory?: string;
  budgeted: number;
  actual: number;
  variance: number;
  variancePercent: number;
  status: 'over' | 'under' | 'ontrack';
}

interface AlertFilters {
  severity: string;
  category: string;
  type: string;
  status: string;
  searchTerm: string;
}

const AlertasPresupuestoPage: React.FC = () => {
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [variances, setVariances] = useState<VarianceAnalysis[]>([]);
  const [filters, setFilters] = useState<AlertFilters>({
    severity: 'all',
    category: 'all',
    type: 'all',
    status: 'all',
    searchTerm: ''
  });
  const [totalBudget, setTotalBudget] = useState(0);
  const [totalActual, setTotalActual] = useState(0);

  const toast = useToast();

  // Utility functions
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-PA', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number): string => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('es-PA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get severity color and icon
  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'critical':
        return { color: 'red', icon: FaExclamationTriangle, label: 'Crítico' };
      case 'high':
        return { color: 'orange', icon: FaExclamationCircle, label: 'Alto' };
      case 'medium':
        return { color: 'yellow', icon: FaInfoCircle, label: 'Medio' };
      case 'low':
        return { color: 'blue', icon: FaCheckCircle, label: 'Bajo' };
      default:
        return { color: 'gray', icon: FaInfoCircle, label: 'N/A' };
    }
  };

  // Get variance status color
  const getVarianceColor = (variancePercent: number) => {
    if (Math.abs(variancePercent) > 20) return 'red';
    if (Math.abs(variancePercent) > 10) return 'orange';
    if (Math.abs(variancePercent) > 5) return 'yellow';
    return 'green';
  };

  // Generate alerts based on variance analysis
  const generateAlerts = (varianceData: VarianceAnalysis[]): BudgetAlert[] => {
    const generatedAlerts: BudgetAlert[] = [];
    
    varianceData.forEach((variance, index) => {
      const absVariancePercent = Math.abs(variance.variancePercent);
      let severity: 'critical' | 'high' | 'medium' | 'low' = 'low';
      
      if (absVariancePercent >= 20) {
        severity = 'critical';
      } else if (absVariancePercent >= 10) {
        severity = 'high';
      } else if (absVariancePercent >= 5) {
        severity = 'medium';
      }

      if (severity !== 'low') {
        generatedAlerts.push({
          id: `alert_${index}_${Date.now()}`,
          category: variance.category,
          subcategory: variance.subcategory,
          severity,
          type: variance.variance > 0 ? 'overspend' : 'underspend',
          title: `${variance.variance > 0 ? 'Sobregasto' : 'Subgasto'} en ${variance.category}`,
          description: `La categoría ${variance.category} ${variance.subcategory ? `(${variance.subcategory})` : ''} presenta una variación del ${formatPercentage(variance.variancePercent)} respecto al presupuesto.`,
          budgetAmount: variance.budgeted,
          actualAmount: variance.actual,
          variance: variance.variance,
          variancePercent: variance.variancePercent,
          dateGenerated: new Date().toISOString(),
          isRead: false
        });
      }
    });

    return generatedAlerts;
  };

  // Fetch budget data and generate analysis
  const fetchBudgetAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Fetching budget analysis data...');
      
      // Fetch data from multiple sources
      const [
        fixedExpensesRes,
        adminCostsRes,
        planillaAdminRes,
        planillaFijaRes,
        planillaGerencialRes,
        planillaServiciosRes
      ] = await Promise.all([
        api.get('/api/tables/v_presupuesto_gastos_fijos_operativos_resumen/data'),
        contabilidadApi.getAdministrativeCosts(),
        payrollFlowApi.getFlujoPlanillaAdministracion(),
        payrollFlowApi.getFlujoPlanillaFijaConstruccion(),
        payrollFlowApi.getFlujoPlanillaGerencial(),
        payrollFlowApi.getFlujoPlanillaServicioProfesionales()
      ]);

      // Process variance analysis
      const varianceAnalysis: VarianceAnalysis[] = [];
      let budgetTotal = 0;
      let actualTotal = 0;

      // 1. Fixed Operational Expenses
      const fixedExpensesData = fixedExpensesRes.data || [];
      if (fixedExpensesData.length > 0) {
        const actualAmount = fixedExpensesData.reduce((sum: number, item: any) => 
          sum + (item.total_anual || 0), 0);
        const budgetAmount = actualAmount * 1.1; // Assuming 10% buffer as budget

        varianceAnalysis.push({
          category: 'Gastos Fijos Operativos',
          budgeted: budgetAmount,
          actual: actualAmount,
          variance: actualAmount - budgetAmount,
          variancePercent: budgetAmount > 0 ? ((actualAmount - budgetAmount) / budgetAmount) * 100 : 0,
          status: actualAmount > budgetAmount ? 'over' : actualAmount < budgetAmount * 0.95 ? 'under' : 'ontrack'
        });

        budgetTotal += budgetAmount;
        actualTotal += actualAmount;
      }

      // 2. Payroll Analysis
      const payrollTypes = [
        { name: 'Planilla Administrativa', data: planillaAdminRes.data },
        { name: 'Planilla Fija Construcción', data: planillaFijaRes.data },
        { name: 'Planilla Gerencial', data: planillaGerencialRes.data },
        { name: 'Servicios Profesionales', data: planillaServiciosRes.data }
      ];

      payrollTypes.forEach(({ name, data }) => {
        if (data && data.length > 0) {
          const monthlyAmount = data[0].monto || 0;
          const actualAmount = monthlyAmount * 12;
          const budgetAmount = actualAmount * 1.05; // 5% buffer for payroll

          varianceAnalysis.push({
            category: 'Planillas y Nómina',
            subcategory: name,
            budgeted: budgetAmount,
            actual: actualAmount,
            variance: actualAmount - budgetAmount,
            variancePercent: budgetAmount > 0 ? ((actualAmount - budgetAmount) / budgetAmount) * 100 : 0,
            status: actualAmount > budgetAmount ? 'over' : actualAmount < budgetAmount * 0.95 ? 'under' : 'ontrack'
          });

          budgetTotal += budgetAmount;
          actualTotal += actualAmount;
        }
      });

      // 3. Administrative Costs
      const adminCosts = adminCostsRes.data || [];
      if (adminCosts.length > 0) {
        const actualAmount = adminCosts.reduce((sum: number, item: any) => 
          sum + Math.abs(item.debito || 0), 0);
        const budgetAmount = actualAmount * 1.2; // 20% buffer for admin costs

        varianceAnalysis.push({
          category: 'Gastos Administrativos',
          budgeted: budgetAmount,
          actual: actualAmount,
          variance: actualAmount - budgetAmount,
          variancePercent: budgetAmount > 0 ? ((actualAmount - budgetAmount) / budgetAmount) * 100 : 0,
          status: actualAmount > budgetAmount ? 'over' : actualAmount < budgetAmount * 0.95 ? 'under' : 'ontrack'
        });

        budgetTotal += budgetAmount;
        actualTotal += actualAmount;
      }

      // Generate alerts based on variance analysis
      const generatedAlerts = generateAlerts(varianceAnalysis);

      setVariances(varianceAnalysis);
      setAlerts(generatedAlerts);
      setTotalBudget(budgetTotal);
      setTotalActual(actualTotal);

    } catch (err) {
      console.error('Error fetching budget analysis:', err);
      setError('Error al cargar el análisis presupuestario. Por favor, inténtelo de nuevo.');
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos presupuestarios.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgetAnalysis();
  }, []);

  // Filtered alerts based on current filters
  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      if (filters.severity !== 'all' && alert.severity !== filters.severity) return false;
      if (filters.category !== 'all' && alert.category !== filters.category) return false;
      if (filters.type !== 'all' && alert.type !== filters.type) return false;
      if (filters.status !== 'all') {
        if (filters.status === 'read' && !alert.isRead) return false;
        if (filters.status === 'unread' && alert.isRead) return false;
      }
      if (filters.searchTerm && 
          !alert.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) &&
          !alert.description.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [alerts, filters]);

  // Mark alert as read
  const markAsRead = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, isRead: true } : alert
    ));
  };

  if (isLoading) {
    return (
      <Center h="100vh">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>Cargando Análisis de Alertas y Variaciones...</Text>
        </VStack>
      </Center>
    );
  }

  if (error) {
    return (
      <Box p={5}>
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      </Box>
    );
  }

  const totalVariance = totalActual - totalBudget;
  const totalVariancePercent = totalBudget > 0 ? (totalVariance / totalBudget) * 100 : 0;

  return (
    <Box p={5}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <Heading as="h1" size="lg">
            Alertas y Variaciones Presupuestarias
          </Heading>
          <HStack>
            <Button 
              leftIcon={<FaSync />} 
              onClick={fetchBudgetAnalysis}
              variant="outline"
              size="sm"
            >
              Actualizar
            </Button>
            <Button as={RouterLink} to="/admin/analitica-avanzada" colorScheme="gray">
              Volver a Analítica Avanzada
            </Button>
          </HStack>
        </Flex>

        {/* Summary Dashboard */}
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Alertas Activas</StatLabel>
                <StatNumber fontSize="2xl" color={filteredAlerts.length > 0 ? 'red.500' : 'green.500'}>
                  {filteredAlerts.length}
                </StatNumber>
                <StatHelpText>
                  {filteredAlerts.filter(a => !a.isRead).length} sin leer
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Variación Total</StatLabel>
                <StatNumber fontSize="xl" color={getVarianceColor(totalVariancePercent)}>
                  {formatPercentage(totalVariancePercent)}
                </StatNumber>
                <StatHelpText>
                  {formatCurrency(totalVariance)}
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Presupuesto Total</StatLabel>
                <StatNumber fontSize="xl">{formatCurrency(totalBudget)}</StatNumber>
                <StatHelpText>Planificado para el año</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Ejecutado Total</StatLabel>
                <StatNumber fontSize="xl">{formatCurrency(totalActual)}</StatNumber>
                <StatHelpText>
                  {totalActual > totalBudget ? 'Sobre presupuesto' : 'Dentro del presupuesto'}
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Main Content Tabs */}
        <Tabs>
          <TabList>
            <Tab>
              <HStack>
                <FaBell />
                <Text>Alertas</Text>
                {filteredAlerts.filter(a => !a.isRead).length > 0 && (
                  <Badge colorScheme="red" borderRadius="full">
                    {filteredAlerts.filter(a => !a.isRead).length}
                  </Badge>
                )}
              </HStack>
            </Tab>
            <Tab>
              <HStack>
                <FaChartLine />
                <Text>Análisis de Variaciones</Text>
              </HStack>
            </Tab>
          </TabList>

          <TabPanels>
            {/* Alerts Tab */}
            <TabPanel>
              <VStack spacing={4} align="stretch">
                {/* Alert Filters */}
                <Card>
                  <CardHeader>
                    <HStack>
                      <FaFilter />
                      <Heading size="md">Filtros de Alertas</Heading>
                    </HStack>
                  </CardHeader>
                  <CardBody>
                    <Grid templateColumns={{ base: "1fr", md: "repeat(5, 1fr)" }} gap={4}>
                      <Box>
                        <Text mb={2} fontWeight="semibold">Severidad</Text>
                        <Select 
                          value={filters.severity}
                          onChange={(e) => setFilters({...filters, severity: e.target.value})}
                        >
                          <option value="all">Todas</option>
                          <option value="critical">Crítico</option>
                          <option value="high">Alto</option>
                          <option value="medium">Medio</option>
                          <option value="low">Bajo</option>
                        </Select>
                      </Box>
                      <Box>
                        <Text mb={2} fontWeight="semibold">Categoría</Text>
                        <Select 
                          value={filters.category}
                          onChange={(e) => setFilters({...filters, category: e.target.value})}
                        >
                          <option value="all">Todas</option>
                          <option value="Gastos Fijos Operativos">Gastos Fijos</option>
                          <option value="Planillas y Nómina">Planillas</option>
                          <option value="Gastos Administrativos">Administrativos</option>
                        </Select>
                      </Box>
                      <Box>
                        <Text mb={2} fontWeight="semibold">Tipo</Text>
                        <Select 
                          value={filters.type}
                          onChange={(e) => setFilters({...filters, type: e.target.value})}
                        >
                          <option value="all">Todos</option>
                          <option value="overspend">Sobregasto</option>
                          <option value="underspend">Subgasto</option>
                          <option value="trend">Tendencia</option>
                          <option value="threshold">Umbral</option>
                        </Select>
                      </Box>
                      <Box>
                        <Text mb={2} fontWeight="semibold">Estado</Text>
                        <Select 
                          value={filters.status}
                          onChange={(e) => setFilters({...filters, status: e.target.value})}
                        >
                          <option value="all">Todos</option>
                          <option value="read">Leídas</option>
                          <option value="unread">No leídas</option>
                        </Select>
                      </Box>
                      <Box>
                        <Text mb={2} fontWeight="semibold">Buscar</Text>
                        <InputGroup>
                          <InputLeftElement pointerEvents="none">
                            <FaSearch color="gray" />
                          </InputLeftElement>
                          <Input 
                            placeholder="Buscar alertas..."
                            value={filters.searchTerm}
                            onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
                          />
                        </InputGroup>
                      </Box>
                    </Grid>
                  </CardBody>
                </Card>

                {/* Alerts List */}
                <VStack spacing={3} align="stretch">
                  {filteredAlerts.length > 0 ? (
                    filteredAlerts.map((alert) => {
                      const severityConfig = getSeverityConfig(alert.severity);
                      const IconComponent = severityConfig.icon;
                      
                      return (
                        <Card 
                          key={alert.id}
                          borderLeft="4px solid"
                          borderLeftColor={`${severityConfig.color}.400`}
                          bg={alert.isRead ? 'white' : `${severityConfig.color}.50`}
                        >
                          <CardBody>
                            <HStack justify="space-between" align="start">
                              <VStack align="start" spacing={2} flex="1">
                                <HStack>
                                  <IconComponent color={severityConfig.color} />
                                  <Heading size="sm">{alert.title}</Heading>
                                  <Badge colorScheme={severityConfig.color}>
                                    {severityConfig.label}
                                  </Badge>
                                  <Tag size="sm" colorScheme="blue">
                                    <TagLabel>{alert.category}</TagLabel>
                                  </Tag>
                                  {alert.subcategory && (
                                    <Tag size="sm" colorScheme="gray">
                                      <TagLabel>{alert.subcategory}</TagLabel>
                                    </Tag>
                                  )}
                                </HStack>
                                <Text color="gray.600">{alert.description}</Text>
                                <HStack spacing={4}>
                                  <Text fontSize="sm">
                                    <strong>Presupuestado:</strong> {formatCurrency(alert.budgetAmount)}
                                  </Text>
                                  <Text fontSize="sm">
                                    <strong>Real:</strong> {formatCurrency(alert.actualAmount)}
                                  </Text>
                                  <Text fontSize="sm" color={alert.variance > 0 ? 'red.500' : 'green.500'}>
                                    <strong>Variación:</strong> {formatCurrency(alert.variance)} ({formatPercentage(alert.variancePercent)})
                                  </Text>
                                </HStack>
                                <Text fontSize="xs" color="gray.500">
                                  Generado el {formatDate(alert.dateGenerated)}
                                </Text>
                              </VStack>
                              <VStack spacing={2}>
                                {!alert.isRead && (
                                  <IconButton
                                    icon={<FaEye />}
                                    aria-label="Marcar como leída"
                                    size="sm"
                                    onClick={() => markAsRead(alert.id)}
                                  />
                                )}
                              </VStack>
                            </HStack>
                          </CardBody>
                        </Card>
                      );
                    })
                  ) : (
                    <Card>
                      <CardBody>
                        <Center py={8}>
                          <VStack spacing={3}>
                            <FaCheckCircle size="48px" color="green" />
                            <Text fontSize="lg" color="gray.600">
                              No hay alertas que coincidan con los filtros seleccionados
                            </Text>
                          </VStack>
                        </Center>
                      </CardBody>
                    </Card>
                  )}
                </VStack>
              </VStack>
            </TabPanel>

            {/* Variance Analysis Tab */}
            <TabPanel>
              <Card>
                <CardHeader>
                  <Heading size="md">Análisis Detallado de Variaciones</Heading>
                </CardHeader>
                <CardBody>
                  <TableContainer>
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Categoría</Th>
                          <Th>Subcategoría</Th>
                          <Th isNumeric>Presupuestado</Th>
                          <Th isNumeric>Real</Th>
                          <Th isNumeric>Variación</Th>
                          <Th isNumeric>% Variación</Th>
                          <Th>Estado</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {variances.map((variance, index) => (
                          <Tr key={index}>
                            <Td fontWeight="semibold">{variance.category}</Td>
                            <Td>{variance.subcategory || '-'}</Td>
                            <Td isNumeric>{formatCurrency(variance.budgeted)}</Td>
                            <Td isNumeric>{formatCurrency(variance.actual)}</Td>
                            <Td isNumeric color={variance.variance > 0 ? 'red.500' : 'green.500'}>
                              {formatCurrency(variance.variance)}
                            </Td>
                            <Td isNumeric>
                              <Badge colorScheme={getVarianceColor(variance.variancePercent)}>
                                {formatPercentage(variance.variancePercent)}
                              </Badge>
                            </Td>
                            <Td>
                              <Badge 
                                colorScheme={
                                  variance.status === 'ontrack' ? 'green' : 
                                  variance.status === 'over' ? 'red' : 'yellow'
                                }
                              >
                                {variance.status === 'ontrack' ? 'En línea' : 
                                 variance.status === 'over' ? 'Sobre presupuesto' : 'Bajo presupuesto'}
                              </Badge>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                </CardBody>
              </Card>
            </TabPanel>
          </TabPanels>
        </Tabs>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <Heading size="md">Acciones Rápidas</Heading>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <Button 
                as={RouterLink} 
                to="/analitica/dashboard-gastos-ejecutivo"
                leftIcon={<FaChartLine />}
                colorScheme="blue"
                variant="outline"
                size="lg"
              >
                Dashboard Ejecutivo
              </Button>
              <Button 
                as={RouterLink} 
                to="/analitica/categoria-gastos"
                leftIcon={<FaPercent />}
                colorScheme="purple"
                variant="outline"
                size="lg"
              >
                Análisis por Categoría
              </Button>
              <Button 
                as={RouterLink} 
                to="/contabilidad/gestionar-presupuesto-gastos"
                leftIcon={<FaBuilding />}
                colorScheme="green"
                variant="outline"
                size="lg"
              >
                Gestionar Presupuestos
              </Button>
            </SimpleGrid>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
};

export default AlertasPresupuestoPage; 