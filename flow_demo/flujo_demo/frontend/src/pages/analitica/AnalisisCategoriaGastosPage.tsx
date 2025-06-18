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
  Progress,
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
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Tag,
  TagLabel,
  SimpleGrid
} from '@chakra-ui/react';
import { 
  FaSearch,
  FaFilter,
  FaChartPie,
  FaBuilding,
  FaUsers,
  FaProjectDiagram,
  FaArrowUp,
  FaArrowDown,
  FaSync
} from 'react-icons/fa';
import { api, contabilidadApi, payrollFlowApi } from '../../api/api';

// Interfaces
interface CategoryExpense {
  category: string;
  subcategory?: string;
  amount: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  monthlyData: MonthlyAmount[];
  budgeted?: number;
  variance?: number;
  description?: string;
}

interface MonthlyAmount {
  month: string;
  amount: number;
}

interface CategoryFilter {
  category: string;
  dateRange: string;
  searchTerm: string;
}

const AnalisisCategoriaGastosPage: React.FC = () => {
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryExpenses, setCategoryExpenses] = useState<CategoryExpense[]>([]);
  const [filters, setFilters] = useState<CategoryFilter>({
    category: 'all',
    dateRange: 'current_year',
    searchTerm: ''
  });
  const [totalExpenses, setTotalExpenses] = useState(0);

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

  const formatMonth = (monthStr: string): string => {
    const [year, month] = monthStr.split('_');
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  // Fetch expense data by category
  const fetchCategoryData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Fetching category expense data...');
      
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

      // Process data into categories
      const categories: CategoryExpense[] = [];
      let total = 0;

      // 1. Fixed Operational Expenses
      const fixedExpensesData = fixedExpensesRes.data || [];
      if (fixedExpensesData.length > 0) {
        const fixedTotal = fixedExpensesData.reduce((sum: number, item: any) => 
          sum + (item.total_anual || 0), 0);
        
        // Generate monthly data for fixed expenses
        const monthlyData: MonthlyAmount[] = [];
        const currentDate = new Date();
        for (let i = 11; i >= 0; i--) {
          const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
          const monthStr = `${date.getFullYear()}_${String(date.getMonth() + 1).padStart(2, '0')}`;
          monthlyData.push({
            month: monthStr,
            amount: fixedTotal / 12
          });
        }

        categories.push({
          category: 'Gastos Fijos Operativos',
          amount: fixedTotal,
          percentage: 0,
          trend: 'stable',
          trendValue: 0,
          monthlyData,
          budgeted: fixedTotal * 1.1,
          variance: 0,
          description: 'Gastos operativos fijos mensuales'
        });
        total += fixedTotal;
      }

      // 2. Payroll Categories
      const payrollTypes = [
        { name: 'Planilla Administrativa', data: planillaAdminRes.data },
        { name: 'Planilla Fija Construcción', data: planillaFijaRes.data },
        { name: 'Planilla Gerencial', data: planillaGerencialRes.data },
        { name: 'Servicios Profesionales', data: planillaServiciosRes.data }
      ];

      payrollTypes.forEach(({ name, data }) => {
        if (data && data.length > 0) {
          const monthlyAmount = data[0].monto || 0;
          const annualAmount = monthlyAmount * 12;
          
          const monthlyData: MonthlyAmount[] = [];
          const currentDate = new Date();
          for (let i = 11; i >= 0; i--) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const monthStr = `${date.getFullYear()}_${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthlyData.push({
              month: monthStr,
              amount: monthlyAmount
            });
          }

          categories.push({
            category: 'Planillas y Nómina',
            subcategory: name,
            amount: annualAmount,
            percentage: 0,
            trend: 'up',
            trendValue: 2.3,
            monthlyData,
            budgeted: annualAmount * 1.05,
            variance: -5,
            description: `Costos anuales de ${name.toLowerCase()}`
          });
          total += annualAmount;
        }
      });

      // 3. Administrative Costs
      const adminCosts = adminCostsRes.data || [];
      if (adminCosts.length > 0) {
        const adminTotal = adminCosts.reduce((sum: number, item: any) => 
          sum + Math.abs(item.debito || 0), 0);
        
        const monthlyData: MonthlyAmount[] = [];
        const currentDate = new Date();
        for (let i = 11; i >= 0; i--) {
          const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
          const monthStr = `${date.getFullYear()}_${String(date.getMonth() + 1).padStart(2, '0')}`;
          monthlyData.push({
            month: monthStr,
            amount: adminTotal / 12
          });
        }

        categories.push({
          category: 'Gastos Administrativos',
          amount: adminTotal,
          percentage: 0,
          trend: 'down',
          trendValue: -1.5,
          monthlyData,
          budgeted: adminTotal * 1.2,
          variance: 15,
          description: 'Gastos administrativos y operacionales'
        });
        total += adminTotal;
      }

      // Calculate percentages
      categories.forEach(category => {
        category.percentage = total > 0 ? (category.amount / total) * 100 : 0;
        if (category.budgeted) {
          category.variance = category.budgeted > 0 ? 
            ((category.amount - category.budgeted) / category.budgeted) * 100 : 0;
        }
      });

      categories.sort((a, b) => b.amount - a.amount);

      setCategoryExpenses(categories);
      setTotalExpenses(total);

    } catch (err) {
      console.error('Error fetching category data:', err);
      setError('Error al cargar los datos de categorías. Por favor, inténtelo de nuevo.');
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos de categorías.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoryData();
  }, [filters.dateRange]);

  // Filtered data based on current filters
  const filteredCategories = useMemo(() => {
    return categoryExpenses.filter(category => {
      if (filters.category !== 'all' && category.category !== filters.category) {
        return false;
      }
      if (filters.searchTerm && 
          !category.category.toLowerCase().includes(filters.searchTerm.toLowerCase()) &&
          !category.subcategory?.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [categoryExpenses, filters]);

  // Get trend icon
  const getTrendIcon = (trend: string, value: number) => {
    if (trend === 'up') return <FaArrowUp color="red" size="12px" />;
    if (trend === 'down') return <FaArrowDown color="green" size="12px" />;
    return null;
  };

  // Get variance color
  const getVarianceColor = (variance: number) => {
    if (variance > 10) return 'red';
    if (variance > 0) return 'orange';
    return 'green';
  };

  if (isLoading) {
    return (
      <Center h="100vh">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>Cargando Análisis por Categoría de Gastos...</Text>
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

  return (
    <Box p={5}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <Heading as="h1" size="lg">
            Análisis por Categoría de Gastos
          </Heading>
          <HStack>
            <Button 
              leftIcon={<FaSync />} 
              onClick={fetchCategoryData}
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

        {/* Summary Cards */}
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total de Gastos</StatLabel>
                <StatNumber fontSize="2xl">{formatCurrency(totalExpenses)}</StatNumber>
                <StatHelpText>Todas las categorías</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Categorías Activas</StatLabel>
                <StatNumber fontSize="2xl">{filteredCategories.length}</StatNumber>
                <StatHelpText>Con gastos registrados</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Mayor Categoría</StatLabel>
                <StatNumber fontSize="lg">
                  {filteredCategories.length > 0 ? filteredCategories[0].category : 'N/A'}
                </StatNumber>
                <StatHelpText>
                  {filteredCategories.length > 0 ? formatCurrency(filteredCategories[0].amount) : ''}
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Promedio por Categoría</StatLabel>
                <StatNumber fontSize="xl">
                  {formatCurrency(filteredCategories.length > 0 ? totalExpenses / filteredCategories.length : 0)}
                </StatNumber>
                <StatHelpText>Distribución equitativa</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Filters */}
        <Card>
          <CardHeader>
            <HStack>
              <FaFilter />
              <Heading size="md">Filtros de Análisis</Heading>
            </HStack>
          </CardHeader>
          <CardBody>
            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr 2fr" }} gap={4}>
              <Box>
                <Text mb={2} fontWeight="semibold">Categoría</Text>
                <Select 
                  value={filters.category}
                  onChange={(e) => setFilters({...filters, category: e.target.value})}
                >
                  <option value="all">Todas las Categorías</option>
                  <option value="Gastos Fijos Operativos">Gastos Fijos Operativos</option>
                  <option value="Planillas y Nómina">Planillas y Nómina</option>
                  <option value="Gastos Administrativos">Gastos Administrativos</option>
                </Select>
              </Box>
              <Box>
                <Text mb={2} fontWeight="semibold">Período</Text>
                <Select 
                  value={filters.dateRange}
                  onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
                >
                  <option value="current_year">Año Actual</option>
                  <option value="last_12_months">Últimos 12 Meses</option>
                  <option value="quarter">Trimestre Actual</option>
                  <option value="month">Mes Actual</option>
                </Select>
              </Box>
              <Box>
                <Text mb={2} fontWeight="semibold">Buscar</Text>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <FaSearch color="gray" />
                  </InputLeftElement>
                  <Input 
                    placeholder="Buscar categoría o subcategoría..."
                    value={filters.searchTerm}
                    onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
                  />
                </InputGroup>
              </Box>
            </Grid>
          </CardBody>
        </Card>

        {/* Category Analysis */}
        <Card>
          <CardHeader>
            <HStack>
              <FaChartPie />
              <Heading size="md">Análisis Detallado por Categoría</Heading>
            </HStack>
          </CardHeader>
          <CardBody>
            <Accordion allowMultiple>
              {filteredCategories.map((category, index) => (
                <AccordionItem key={index}>
                  <AccordionButton>
                    <Box flex="1" textAlign="left">
                      <HStack justify="space-between" width="100%">
                        <VStack align="start" spacing={1}>
                          <HStack>
                            <Text fontWeight="bold">{category.category}</Text>
                            {category.subcategory && (
                              <Tag size="sm" colorScheme="blue">
                                <TagLabel>{category.subcategory}</TagLabel>
                              </Tag>
                            )}
                          </HStack>
                          <Text fontSize="sm" color="gray.600">{category.description}</Text>
                        </VStack>
                        <VStack align="end" spacing={1}>
                          <HStack>
                            <Text fontWeight="bold" fontSize="lg">
                              {formatCurrency(category.amount)}
                            </Text>
                            <Badge colorScheme="blue">
                              {category.percentage.toFixed(1)}%
                            </Badge>
                          </HStack>
                          <HStack>
                            {getTrendIcon(category.trend, category.trendValue)}
                            <Text fontSize="sm" color="gray.600">
                              {formatPercentage(category.trendValue)}
                            </Text>
                            {category.variance !== undefined && (
                              <Badge colorScheme={getVarianceColor(category.variance)}>
                                vs Presupuesto: {formatPercentage(category.variance)}
                              </Badge>
                            )}
                          </HStack>
                        </VStack>
                      </HStack>
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                  <AccordionPanel pb={4}>
                    <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={6}>
                      {/* Monthly Trend Chart */}
                      <Box>
                        <Text fontWeight="semibold" mb={3}>Tendencia Mensual</Text>
                        <TableContainer>
                          <Table size="sm" variant="simple">
                            <Thead>
                              <Tr>
                                <Th>Mes</Th>
                                <Th isNumeric>Monto</Th>
                                <Th isNumeric>% del Total Anual</Th>
                              </Tr>
                            </Thead>
                            <Tbody>
                              {category.monthlyData.slice(-6).map((month, idx) => (
                                <Tr key={idx}>
                                  <Td>{formatMonth(month.month)}</Td>
                                  <Td isNumeric>{formatCurrency(month.amount)}</Td>
                                  <Td isNumeric>
                                    {((month.amount / category.amount) * 100).toFixed(1)}%
                                  </Td>
                                </Tr>
                              ))}
                            </Tbody>
                          </Table>
                        </TableContainer>
                      </Box>

                      {/* Category Details */}
                      <Box>
                        <Text fontWeight="semibold" mb={3}>Detalles de la Categoría</Text>
                        <VStack align="stretch" spacing={3}>
                          <Box p={3} bg="gray.50" borderRadius="md">
                            <Text fontWeight="semibold">Presupuesto Anual</Text>
                            <Text fontSize="lg">
                              {category.budgeted ? formatCurrency(category.budgeted) : 'N/A'}
                            </Text>
                          </Box>
                          <Box p={3} bg="gray.50" borderRadius="md">
                            <Text fontWeight="semibold">Promedio Mensual</Text>
                            <Text fontSize="lg">{formatCurrency(category.amount / 12)}</Text>
                          </Box>
                          <Box p={3} bg="gray.50" borderRadius="md">
                            <Text fontWeight="semibold">Participación</Text>
                            <Progress value={category.percentage} colorScheme="blue" />
                            <Text fontSize="sm" mt={1}>
                              {category.percentage.toFixed(1)}% del total
                            </Text>
                          </Box>
                        </VStack>
                      </Box>
                    </Grid>
                  </AccordionPanel>
                </AccordionItem>
              ))}
            </Accordion>
          </CardBody>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <Heading size="md">Acciones de Gestión</Heading>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <Button 
                as={RouterLink} 
                to="/dashboard-contabilidad/presupuesto_gastos_fijos_operativos"
                leftIcon={<FaBuilding />}
                colorScheme="blue"
                variant="outline"
                size="lg"
              >
                Gestionar Gastos Fijos
              </Button>
              <Button 
                as={RouterLink} 
                to="/analitica/planillas-consolidado"
                leftIcon={<FaUsers />}
                colorScheme="green"
                variant="outline"
                size="lg"
              >
                Analizar Planillas
              </Button>
              <Button 
                as={RouterLink} 
                to="/contabilidad/cuenta-proyectos"
                leftIcon={<FaProjectDiagram />}
                colorScheme="purple"
                variant="outline"
                size="lg"
              >
                Gastos por Proyecto
              </Button>
            </SimpleGrid>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
};

export default AnalisisCategoriaGastosPage; 