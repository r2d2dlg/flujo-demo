import React, { useState, useEffect, useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Heading,
  VStack,
  HStack,
  Grid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
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
  AlertIcon
} from '@chakra-ui/react';
import { 
  FaArrowUp, 
  FaArrowDown, 
  FaUsers, 
  FaBuilding, 
  FaProjectDiagram, 
  FaCogs,
  FaChartLine,
  FaExclamationTriangle
} from 'react-icons/fa';
import { api, payrollFlowApi, contabilidadApi } from '../../api/api';

// Types for our dashboard data
interface ExpenseKPI {
  totalExpenses: number;
  monthlyChange: number;
  budgetVariance: number;
  largestCategory: string;
  largestCategoryAmount: number;
}

interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
}

interface MonthlyExpense {
  month: string;
  fixedOperational: number;
  payroll: number;
  administrative: number;
  projects: number;
  total: number;
}

interface BudgetAlert {
  category: string;
  budgeted: number;
  actual: number;
  variance: number;
  severity: 'low' | 'medium' | 'high';
}

const DashboardEjecutivoGastosPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<ExpenseKPI | null>(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState<MonthlyExpense[]>([]);
  const [budgetAlerts, setBudgetAlerts] = useState<BudgetAlert[]>([]);
  const toast = useToast();

  // Helper function to format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Helper function to format percentage
  const formatPercentage = (value: number): string => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  // Helper to get Spanish month name
  const spanishMonths = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];
  function getMesYYYY(date: Date) {
    return `${spanishMonths[date.getMonth()]} ${date.getFullYear()}`;
  }

  // Map Spanish months to order
  const monthOrder = [
    'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
    'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
  ];

  // Fetch all expense data
  const fetchExpenseData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Starting to fetch expense data...');
      
      // Fetch data from multiple sources in parallel
      const [
        fixedExpensesRes,
        adminCostsRes,
        planillaAdminRes,
        planillaFijaRes,
        planillaGerencialRes,
        planillaServiciosRes
      ] = await Promise.all([
        // Fixed operational expenses
        api.get('/api/tables/v_presupuesto_gastos_fijos_operativos_resumen/data'),
        // Administrative costs
        contabilidadApi.getAdministrativeCosts(),
        // Payroll data
        payrollFlowApi.getFlujoPlanillaAdministracion(),
        payrollFlowApi.getFlujoPlanillaFijaConstruccion(),
        payrollFlowApi.getFlujoPlanillaGerencial(),
        payrollFlowApi.getFlujoPlanillaServicioProfesionales()
      ]);
      
      console.log('API responses received:', {
        fixedExpenses: fixedExpensesRes.data,
        adminCosts: adminCostsRes.data,
        planillaAdmin: planillaAdminRes.data,
        planillaFija: planillaFijaRes.data,
        planillaGerencial: planillaGerencialRes.data,
        planillaServicios: planillaServiciosRes.data
      });

      // Process fixed expenses data
      const fixedExpensesData = fixedExpensesRes.data.data || [];
      const totalFixedExpenses = fixedExpensesData
        .filter((row: any) => row.CONCEPTO !== 'TOTAL')
        .reduce((sum: number, row: any) => sum + (row.TOTAL_ANUAL || 0), 0);

      // Process administrative costs
      const adminCosts = adminCostsRes.data || [];
      const totalAdminCosts = adminCosts.reduce((sum, cost) => sum + (cost.debitAmount || 0), 0);

      // Process payroll data - these endpoints return monthly flow data
      const payrollData = [
        planillaAdminRes.data,
        planillaFijaRes.data,
        planillaGerencialRes.data,
        planillaServiciosRes.data
      ];

      // Calculate monthly payroll costs (each type returns same amount for all months)
      const monthlyPayrollCosts = payrollData.map(payrollType => {
        const monthlyData = payrollType || [];
        return monthlyData.length > 0 ? monthlyData[0].monto : 0;
      });

      const totalMonthlyPayroll = monthlyPayrollCosts.reduce((sum, amount) => sum + amount, 0);
      const totalPayrollCosts = totalMonthlyPayroll; // This is monthly, will multiply by 12 for annual
      
      console.log('Expense calculation debug:', {
        totalFixedExpenses,
        totalAdminCosts,
        monthlyPayrollCosts,
        totalMonthlyPayroll,
        totalPayrollCosts
      });

      // Calculate KPIs
      const totalExpenses = totalFixedExpenses + totalAdminCosts + totalPayrollCosts;
      
              // Calculate category breakdown (annual amounts)
        const annualPayrollCosts = totalPayrollCosts * 12; // Convert monthly to annual
        const totalAnnualExpenses = totalFixedExpenses + totalAdminCosts + annualPayrollCosts;
        
        const categories: CategoryBreakdown[] = [
          {
            category: 'Gastos Fijos Operativos',
            amount: totalFixedExpenses,
            percentage: totalAnnualExpenses > 0 ? (totalFixedExpenses / totalAnnualExpenses) * 100 : 0,
            trend: 'stable',
            trendValue: 0
          },
          {
            category: 'Planillas (Anual)',
            amount: annualPayrollCosts,
            percentage: totalAnnualExpenses > 0 ? (annualPayrollCosts / totalAnnualExpenses) * 100 : 0,
            trend: 'up',
            trendValue: 2.5
          },
          {
            category: 'Gastos Administrativos',
            amount: totalAdminCosts,
            percentage: totalAnnualExpenses > 0 ? (totalAdminCosts / totalAnnualExpenses) * 100 : 0,
            trend: 'down',
            trendValue: -1.2
          }
        ].sort((a, b) => b.amount - a.amount);

              // Set KPIs
        setKpis({
          totalExpenses: totalAnnualExpenses,
          monthlyChange: 3.2, // This would be calculated from historical data
          budgetVariance: -5.1, // This would be calculated against budget
          largestCategory: categories.length > 0 ? categories[0].category : 'Sin datos',
          largestCategoryAmount: categories.length > 0 ? categories[0].amount : 0
        });

      setCategoryBreakdown(categories);

      // Find which months are present in the data
      const availableMonths = monthOrder.filter(m => fixedExpensesData.length > 0 && m in fixedExpensesData[0]);
      // Get the last 6 months available
      const last6Months = availableMonths.slice(-6);

      // Sum fixed expenses for each of the last 6 months
      const monthlyFixedExpenses = last6Months.map(mesCol =>
        fixedExpensesData.reduce((sum: number, row: any) => sum + (parseFloat(row[mesCol]) || 0), 0)
      );

      // Build monthlyData for the dashboard
      const monthlyData: MonthlyExpense[] = [];
      last6Months.forEach(monthStr => {
        const monthlyFixed = monthlyFixedExpenses[last6Months.indexOf(monthStr)] || 0;
        const monthlyAdmin = totalAdminCosts / 12; // Still using annual admin costs, can be improved if you have monthly
        const monthlyPayrollTotal = totalMonthlyPayroll; // Already monthly
        monthlyData.push({
          month: monthStr,
          fixedOperational: monthlyFixed,
          payroll: monthlyPayrollTotal,
          administrative: monthlyAdmin,
          projects: 0, // Would need project-specific data
          total: monthlyFixed + monthlyPayrollTotal + monthlyAdmin
        });
      });

      setMonthlyExpenses(monthlyData);

              // Generate budget alerts based on actual data
        const alerts: BudgetAlert[] = [];
        
        // Check if payroll is over a reasonable threshold
        if (totalMonthlyPayroll > 40000) {
          alerts.push({
            category: 'Planillas Mensuales',
            budgeted: 40000,
            actual: totalMonthlyPayroll,
            variance: ((totalMonthlyPayroll - 40000) / 40000) * 100,
            severity: totalMonthlyPayroll > 50000 ? 'high' : 'medium'
          });
        }
        
        // Check fixed expenses
        const monthlyFixedBudget = 25000;
        const monthlyFixed = totalFixedExpenses / 12;
        if (monthlyFixed > monthlyFixedBudget) {
          alerts.push({
            category: 'Gastos Fijos Mensuales',
            budgeted: monthlyFixedBudget,
            actual: monthlyFixed,
            variance: ((monthlyFixed - monthlyFixedBudget) / monthlyFixedBudget) * 100,
            severity: monthlyFixed > monthlyFixedBudget * 1.2 ? 'high' : 'medium'
          });
        }
        
        setBudgetAlerts(alerts);

    } catch (err) {
      console.error('Error fetching expense data:', err);
      setError('Error al cargar los datos de gastos. Por favor, inténtelo de nuevo.');
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos de gastos.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      
      // Set default data to prevent empty dashboard
      setKpis({
        totalExpenses: 0,
        monthlyChange: 0,
        budgetVariance: 0,
        largestCategory: 'Sin datos',
        largestCategoryAmount: 0
      });
      setCategoryBreakdown([]);
      setBudgetAlerts([]);
      setMonthlyExpenses([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenseData();
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'yellow';
      default: return 'gray';
    }
  };

  const getTrendIcon = (trend: string, value: number) => {
    if (trend === 'up') return <FaArrowUp color="green" size="12px" />;
    if (trend === 'down') return <FaArrowDown color="red" size="12px" />;
    return null;
  };

  if (isLoading) {
    return (
      <Center h="100vh">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>Cargando Dashboard Ejecutivo de Gastos...</Text>
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
            Dashboard Ejecutivo de Gastos
          </Heading>
          <Button as={RouterLink} to="/admin/analitica-avanzada" colorScheme="gray">
            Volver a Analítica Avanzada
          </Button>
        </Flex>

        {/* Key Performance Indicators */}
        {kpis && (
          <Card>
            <CardHeader>
              <Heading size="md">Indicadores Clave de Gastos</Heading>
            </CardHeader>
            <CardBody>
              <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={6}>
                <Stat>
                  <StatLabel>Total de Gastos</StatLabel>
                  <StatNumber>{formatCurrency(kpis.totalExpenses)}</StatNumber>
                  <StatHelpText>
                    <HStack spacing={1}>
                      {kpis.monthlyChange > 0 ? 
                        <FaArrowUp color="red" size="12px" /> : 
                        <FaArrowDown color="green" size="12px" />
                      }
                      <Text>{formatPercentage(kpis.monthlyChange)} vs mes anterior</Text>
                    </HStack>
                  </StatHelpText>
                </Stat>

                <Stat>
                  <StatLabel>Variación vs Presupuesto</StatLabel>
                  <StatNumber color={kpis.budgetVariance > 0 ? 'red.500' : 'green.500'}>
                    {formatPercentage(kpis.budgetVariance)}
                  </StatNumber>
                  <StatHelpText>
                    {kpis.budgetVariance > 0 ? 'Sobre presupuesto' : 'Bajo presupuesto'}
                  </StatHelpText>
                </Stat>

                <Stat>
                  <StatLabel>Mayor Categoría de Gastos</StatLabel>
                  <StatNumber fontSize="lg">{kpis.largestCategory}</StatNumber>
                  <StatHelpText>
                    {formatCurrency(kpis.largestCategoryAmount)}
                  </StatHelpText>
                </Stat>
              </Grid>
            </CardBody>
          </Card>
        )}

        <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={6}>
          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <Heading size="md">Distribución por Categoría</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                {categoryBreakdown.map((category, index) => (
                  <Box key={index}>
                    <Flex justify="space-between" align="center" mb={2}>
                      <HStack>
                        <Text fontWeight="semibold">{category.category}</Text>
                        {getTrendIcon(category.trend, category.trendValue)}
                      </HStack>
                      <VStack align="end" spacing={0}>
                        <Text fontWeight="bold">{formatCurrency(category.amount)}</Text>
                        <Text fontSize="sm" color="gray.500">
                          {category.percentage.toFixed(1)}%
                        </Text>
                      </VStack>
                    </Flex>
                    <Progress 
                      value={category.percentage} 
                      colorScheme="blue" 
                      size="sm" 
                    />
                  </Box>
                ))}
              </VStack>
            </CardBody>
          </Card>

          {/* Budget Alerts */}
          <Card>
            <CardHeader>
              <HStack>
                <FaExclamationTriangle color="orange" />
                <Heading size="md">Alertas Presupuestarias</Heading>
              </HStack>
            </CardHeader>
            <CardBody>
              <VStack spacing={3} align="stretch">
                {budgetAlerts.length > 0 ? (
                  budgetAlerts.map((alert, index) => (
                    <Box 
                      key={index}
                      p={3}
                      borderRadius="md"
                      borderWidth="1px"
                      borderColor={`${getSeverityColor(alert.severity)}.200`}
                      bg={`${getSeverityColor(alert.severity)}.50`}
                    >
                      <Flex justify="space-between" align="center">
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="semibold">{alert.category}</Text>
                          <Text fontSize="sm" color="gray.600">
                            Presupuesto: {formatCurrency(alert.budgeted)}
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            Actual: {formatCurrency(alert.actual)}
                          </Text>
                        </VStack>
                        <VStack align="end" spacing={1}>
                          <Badge 
                            colorScheme={getSeverityColor(alert.severity)}
                            fontSize="sm"
                          >
                            {formatPercentage(alert.variance)}
                          </Badge>
                          <Text fontSize="xs" color="gray.500">
                            {alert.severity === 'high' ? 'Crítico' : 
                             alert.severity === 'medium' ? 'Moderado' : 'Bajo'}
                          </Text>
                        </VStack>
                      </Flex>
                    </Box>
                  ))
                ) : (
                  <Text color="gray.500" textAlign="center">
                    No hay alertas presupuestarias en este momento
                  </Text>
                )}
              </VStack>
            </CardBody>
          </Card>
        </Grid>

        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <Heading size="md">Tendencia Mensual de Gastos (Últimos 12 Meses)</Heading>
          </CardHeader>
          <CardBody>
            <TableContainer>
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Mes</Th>
                    <Th isNumeric>Gastos Fijos</Th>
                    <Th isNumeric>Planillas</Th>
                    <Th isNumeric>Administrativos</Th>
                    <Th isNumeric>Total</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {monthlyExpenses.map((month, index) => (
                    <Tr key={index}>
                      <Td>{month.month}</Td>
                      <Td isNumeric>{formatCurrency(month.fixedOperational)}</Td>
                      <Td isNumeric>{formatCurrency(month.payroll)}</Td>
                      <Td isNumeric>{formatCurrency(month.administrative)}</Td>
                      <Td isNumeric fontWeight="bold">{formatCurrency(month.total)}</Td>
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
            <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
              <Button 
                as={RouterLink} 
                to="/dashboard-contabilidad/presupuesto_gastos_fijos_operativos"
                leftIcon={<FaBuilding />}
                colorScheme="blue"
                variant="outline"
              >
                Gestionar Gastos Fijos
              </Button>
              <Button 
                as={RouterLink} 
                to="/analitica/planillas-consolidado"
                leftIcon={<FaUsers />}
                colorScheme="green"
                variant="outline"
              >
                Analizar Planillas
              </Button>
              <Button 
                as={RouterLink} 
                to="/contabilidad/gestionar-presupuesto-gastos"
                leftIcon={<FaProjectDiagram />}
                colorScheme="purple"
                variant="outline"
              >
                Gastos por Proyecto
              </Button>
              <Button 
                as={RouterLink} 
                to="/cash-flows/egresos-preliminares"
                leftIcon={<FaChartLine />}
                colorScheme="orange"
                variant="outline"
              >
                Ver Flujos de Caja
              </Button>
            </Grid>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
};

export default DashboardEjecutivoGastosPage; 