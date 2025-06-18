import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  VStack,
  HStack,
  Grid,
  GridItem,
  Card,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Text,
  Spinner,
  Alert,
  AlertIcon,
  useToast,
  Button,
  Icon,
  Badge,
  Progress,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel
} from '@chakra-ui/react';
import { FaUsers, FaChartLine, FaArrowUp, FaArrowDown, FaArrowLeft, FaCalendarAlt, FaMoneyBillWave } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/api';

interface TrendData {
  month: string;
  monto: number;
  tipo: string;
}

interface TrendSummary {
  categoria: string;
  total_actual: number;
  total_anterior: number;
  variacion_porcentual: number;
  tendencia: 'up' | 'down' | 'stable';
  promedio_mensual: number;
}

interface EmployeeTrend {
  planillas_fijas: TrendData[];
  planillas_variables: TrendData[];
  servicios_profesionales: TrendData[];
  resumen_tendencias: TrendSummary[];
  metricas_globales: {
    crecimiento_anual: number;
    mes_mayor_gasto: string;
    mes_menor_gasto: string;
    variabilidad_mensual: number;
  };
}

const PlanillasTendenciasPage: React.FC = () => {
  const [data, setData] = useState<EmployeeTrend | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const navigate = useNavigate();

  // Generate months for the last 12 months
  const generateMonths = () => {
    const months = [];
    const currentDate = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}_${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
      months.push({ key: monthKey, label: monthLabel });
    }
    return months;
  };

  const months = generateMonths();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch data from all payroll endpoints
        const [planillasAdminRes, planillasVarRes, serviciosProfRes] = await Promise.all([
          api.get('/api/payroll/flujo/planilla-administrativa-consolidado'),
          api.get('/api/payroll/flujo/planilla-variable-consolidado'),
          api.get('/api/payroll/flujo/planilla-servicio-profesionales')
        ]);

        const planillasFijas = planillasAdminRes.data || [];
        const planillasVariables = planillasVarRes.data || [];
        const serviciosProfesionales = serviciosProfRes.data || [];

        // Calculate trends and metrics
        const calcularTendencia = (datos: TrendData[]): TrendSummary => {
          if (datos.length === 0) return {
            categoria: 'Sin datos',
            total_actual: 0,
            total_anterior: 0,
            variacion_porcentual: 0,
            tendencia: 'stable',
            promedio_mensual: 0
          };

          const totalActual = datos.reduce((sum, item) => sum + item.monto, 0);
          const promedioMensual = totalActual / datos.length;
          
          // Compare last 6 months vs previous 6 months
          const mitad = Math.floor(datos.length / 2);
          const segundaMitad = datos.slice(mitad);
          const primeraMitad = datos.slice(0, mitad);
          
          const totalSegundaMitad = segundaMitad.reduce((sum, item) => sum + item.monto, 0);
          const totalPrimeraMitad = primeraMitad.reduce((sum, item) => sum + item.monto, 0);
          
          const variacionPorcentual = totalPrimeraMitad > 0 
            ? ((totalSegundaMitad - totalPrimeraMitad) / totalPrimeraMitad) * 100 
            : 0;

          const tendencia = variacionPorcentual > 5 ? 'up' : 
                           variacionPorcentual < -5 ? 'down' : 'stable';

          return {
            categoria: datos[0]?.tipo || 'Categoría',
            total_actual: totalActual,
            total_anterior: totalPrimeraMitad,
            variacion_porcentual: variacionPorcentual,
            tendencia,
            promedio_mensual: promedioMensual
          };
        };

        const resumenTendencias = [
          { ...calcularTendencia(planillasFijas), categoria: 'Planillas Fijas' },
          { ...calcularTendencia(planillasVariables), categoria: 'Planillas Variables' },
          { ...calcularTendencia(serviciosProfesionales), categoria: 'Servicios Profesionales' }
        ];

        // Calculate global metrics
        const todosLosDatos = [...planillasFijas, ...planillasVariables, ...serviciosProfesionales];
        const montosPorMes = months.map(month => {
          const monthData = todosLosDatos.filter(item => item.month === month.key);
          return {
            mes: month.label,
            total: monthData.reduce((sum, item) => sum + item.monto, 0)
          };
        });

        const totalAnual = montosPorMes.reduce((sum, mes) => sum + mes.total, 0);
        const mesMayorGasto = montosPorMes.reduce((max, mes) => mes.total > max.total ? mes : max);
        const mesMenorGasto = montosPorMes.reduce((min, mes) => mes.total < min.total ? mes : min);
        
        // Calculate variability (coefficient of variation)
        const promedio = totalAnual / 12;
        const varianza = montosPorMes.reduce((sum, mes) => sum + Math.pow(mes.total - promedio, 2), 0) / 12;
        const desviacionEstandar = Math.sqrt(varianza);
        const variabilidadMensual = promedio > 0 ? (desviacionEstandar / promedio) * 100 : 0;

        const metricas_globales = {
          crecimiento_anual: resumenTendencias.reduce((sum, trend) => sum + trend.variacion_porcentual, 0) / 3,
          mes_mayor_gasto: mesMayorGasto.mes,
          mes_menor_gasto: mesMenorGasto.mes,
          variabilidad_mensual: variabilidadMensual
        };

        setData({
          planillas_fijas: planillasFijas,
          planillas_variables: planillasVariables,
          servicios_profesionales: serviciosProfesionales,
          resumen_tendencias: resumenTendencias,
          metricas_globales
        });

      } catch (err: any) {
        console.error('Error fetching trends data:', err);
        setError('Error al cargar los datos de tendencias');
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los datos de tendencias',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTrendColor = (tendencia: string) => {
    switch (tendencia) {
      case 'up': return 'green';
      case 'down': return 'red';
      default: return 'gray';
    }
  };

  const getTrendIcon = (tendencia: string) => {
    switch (tendencia) {
      case 'up': return FaArrowUp;
      case 'down': return FaArrowDown;
      default: return FaChartLine;
    }
  };

  if (isLoading) {
    return (
      <Box p={5} display="flex" justifyContent="center" alignItems="center" minH="400px">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>Cargando análisis de tendencias...</Text>
        </VStack>
      </Box>
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

  if (!data) return null;

  return (
    <Box p={5}>
      <HStack justify="space-between" mb={6}>
        <VStack align="start" spacing={2}>
          <Heading>Tendencias Personal</Heading>
          <Text color="gray.600">Evolución de costos laborales y análisis de tendencias</Text>
        </VStack>
        <Button leftIcon={<Icon as={FaArrowLeft} />} onClick={() => navigate('/admin/analitica-avanzada')}>
          Volver
        </Button>
      </HStack>

      {/* Global Metrics Cards */}
      <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={6} mb={8}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>
                <HStack>
                  <Icon as={FaChartLine} />
                  <Text>Crecimiento Anual</Text>
                </HStack>
              </StatLabel>
              <StatNumber>
                <StatArrow type={data.metricas_globales.crecimiento_anual >= 0 ? 'increase' : 'decrease'} />
                {data.metricas_globales.crecimiento_anual.toFixed(1)}%
              </StatNumber>
              <StatHelpText>Promedio de todas las categorías</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>
                <HStack>
                  <Icon as={FaCalendarAlt} />
                  <Text>Mes Mayor Gasto</Text>
                </HStack>
              </StatLabel>
              <StatNumber fontSize="lg">{data.metricas_globales.mes_mayor_gasto}</StatNumber>
              <StatHelpText>Pico de gastos laborales</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>
                <HStack>
                  <Icon as={FaCalendarAlt} />
                  <Text>Mes Menor Gasto</Text>
                </HStack>
              </StatLabel>
              <StatNumber fontSize="lg">{data.metricas_globales.mes_menor_gasto}</StatNumber>
              <StatHelpText>Valle de gastos laborales</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>
                <HStack>
                  <Icon as={FaMoneyBillWave} />
                  <Text>Variabilidad Mensual</Text>
                </HStack>
              </StatLabel>
              <StatNumber>{data.metricas_globales.variabilidad_mensual.toFixed(1)}%</StatNumber>
              <StatHelpText>Coeficiente de variación</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </Grid>

      {/* Trends Summary */}
      <Card mb={8}>
        <CardBody>
          <Heading size="md" mb={4}>Resumen de Tendencias por Categoría</Heading>
          <TableContainer>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Categoría</Th>
                  <Th isNumeric>Total Período</Th>
                  <Th isNumeric>Promedio Mensual</Th>
                  <Th isNumeric>Variación</Th>
                  <Th>Tendencia</Th>
                  <Th>Progreso</Th>
                </Tr>
              </Thead>
              <Tbody>
                {data.resumen_tendencias.map((trend, index) => (
                  <Tr key={index}>
                    <Td fontWeight="medium">{trend.categoria}</Td>
                    <Td isNumeric>{formatCurrency(trend.total_actual)}</Td>
                    <Td isNumeric>{formatCurrency(trend.promedio_mensual)}</Td>
                    <Td isNumeric>
                      <HStack justify="flex-end">
                        <Icon as={trend.variacion_porcentual >= 0 ? FaArrowUp : FaArrowDown} 
                              color={trend.variacion_porcentual >= 0 ? 'green.500' : 'red.500'} 
                              boxSize={3} />
                        <Text color={trend.variacion_porcentual >= 0 ? 'green.500' : 'red.500'}>
                          {Math.abs(trend.variacion_porcentual).toFixed(1)}%
                        </Text>
                      </HStack>
                    </Td>
                    <Td>
                      <Badge colorScheme={getTrendColor(trend.tendencia)} variant="subtle">
                        <HStack spacing={1}>
                          <Icon as={getTrendIcon(trend.tendencia)} boxSize={3} />
                          <Text>{trend.tendencia === 'up' ? 'Creciente' : 
                                trend.tendencia === 'down' ? 'Decreciente' : 'Estable'}</Text>
                        </HStack>
                      </Badge>
                    </Td>
                    <Td>
                      <Progress 
                        value={Math.min(Math.abs(trend.variacion_porcentual), 100)} 
                        colorScheme={getTrendColor(trend.tendencia)}
                        size="sm"
                      />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </CardBody>
      </Card>

      {/* Detailed Data Tabs */}
      <Tabs>
        <TabList>
          <Tab>Evolución Mensual</Tab>
          <Tab>Planillas Fijas</Tab>
          <Tab>Planillas Variables</Tab>
          <Tab>Servicios Profesionales</Tab>
        </TabList>

        <TabPanels>
          {/* Monthly Evolution */}
          <TabPanel>
            <Card>
              <CardBody>
                <Heading size="md" mb={4}>Evolución Mensual por Categoría</Heading>
                <TableContainer>
                  <Table variant="striped" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Mes</Th>
                        <Th isNumeric>Planillas Fijas</Th>
                        <Th isNumeric>Planillas Variables</Th>
                        <Th isNumeric>Servicios Profesionales</Th>
                        <Th isNumeric>Total Mensual</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {months.map(month => {
                        const fijasMonto = data.planillas_fijas.find(item => item.month === month.key)?.monto || 0;
                        const variablesMonto = data.planillas_variables.find(item => item.month === month.key)?.monto || 0;
                        const serviciosMonto = data.servicios_profesionales.find(item => item.month === month.key)?.monto || 0;
                        const totalMes = fijasMonto + variablesMonto + serviciosMonto;

                        return (
                          <Tr key={month.key}>
                            <Td fontWeight="medium">{month.label}</Td>
                            <Td isNumeric>{fijasMonto > 0 ? formatCurrency(fijasMonto) : '-'}</Td>
                            <Td isNumeric>{variablesMonto > 0 ? formatCurrency(variablesMonto) : '-'}</Td>
                            <Td isNumeric>{serviciosMonto > 0 ? formatCurrency(serviciosMonto) : '-'}</Td>
                            <Td isNumeric fontWeight="bold" color="blue.600">
                              {totalMes > 0 ? formatCurrency(totalMes) : '-'}
                            </Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </TableContainer>
              </CardBody>
            </Card>
          </TabPanel>

          {/* Individual category tabs */}
          <TabPanel>
            <Card>
              <CardBody>
                <Heading size="md" mb={4}>Detalle Planillas Fijas - Tendencia</Heading>
                <TableContainer>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Mes</Th>
                        <Th isNumeric>Monto</Th>
                        <Th>Variación vs Anterior</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {data.planillas_fijas.map((item, index) => {
                        const prevItem = index > 0 ? data.planillas_fijas[index - 1] : null;
                        const variacion = prevItem ? ((item.monto - prevItem.monto) / prevItem.monto) * 100 : 0;
                        
                        return (
                          <Tr key={index}>
                            <Td>{months.find(m => m.key === item.month)?.label || item.month}</Td>
                            <Td isNumeric>{formatCurrency(item.monto)}</Td>
                            <Td>
                              {prevItem ? (
                                <HStack>
                                  <Icon as={variacion >= 0 ? FaArrowUp : FaArrowDown} 
                                        color={variacion >= 0 ? 'green.500' : 'red.500'} 
                                        boxSize={3} />
                                  <Text color={variacion >= 0 ? 'green.500' : 'red.500'}>
                                    {Math.abs(variacion).toFixed(1)}%
                                  </Text>
                                </HStack>
                              ) : '-'}
                            </Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </TableContainer>
              </CardBody>
            </Card>
          </TabPanel>

          <TabPanel>
            <Card>
              <CardBody>
                <Heading size="md" mb={4}>Detalle Planillas Variables - Tendencia</Heading>
                <TableContainer>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Mes</Th>
                        <Th isNumeric>Monto</Th>
                        <Th>Variación vs Anterior</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {data.planillas_variables.map((item, index) => {
                        const prevItem = index > 0 ? data.planillas_variables[index - 1] : null;
                        const variacion = prevItem ? ((item.monto - prevItem.monto) / prevItem.monto) * 100 : 0;
                        
                        return (
                          <Tr key={index}>
                            <Td>{months.find(m => m.key === item.month)?.label || item.month}</Td>
                            <Td isNumeric>{formatCurrency(item.monto)}</Td>
                            <Td>
                              {prevItem ? (
                                <HStack>
                                  <Icon as={variacion >= 0 ? FaArrowUp : FaArrowDown} 
                                        color={variacion >= 0 ? 'green.500' : 'red.500'} 
                                        boxSize={3} />
                                  <Text color={variacion >= 0 ? 'green.500' : 'red.500'}>
                                    {Math.abs(variacion).toFixed(1)}%
                                  </Text>
                                </HStack>
                              ) : '-'}
                            </Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </TableContainer>
              </CardBody>
            </Card>
          </TabPanel>

          <TabPanel>
            <Card>
              <CardBody>
                <Heading size="md" mb={4}>Detalle Servicios Profesionales - Tendencia</Heading>
                <TableContainer>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Mes</Th>
                        <Th isNumeric>Monto</Th>
                        <Th>Variación vs Anterior</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {data.servicios_profesionales.map((item, index) => {
                        const prevItem = index > 0 ? data.servicios_profesionales[index - 1] : null;
                        const variacion = prevItem ? ((item.monto - prevItem.monto) / prevItem.monto) * 100 : 0;
                        
                        return (
                          <Tr key={index}>
                            <Td>{months.find(m => m.key === item.month)?.label || item.month}</Td>
                            <Td isNumeric>{formatCurrency(item.monto)}</Td>
                            <Td>
                              {prevItem ? (
                                <HStack>
                                  <Icon as={variacion >= 0 ? FaArrowUp : FaArrowDown} 
                                        color={variacion >= 0 ? 'green.500' : 'red.500'} 
                                        boxSize={3} />
                                  <Text color={variacion >= 0 ? 'green.500' : 'red.500'}>
                                    {Math.abs(variacion).toFixed(1)}%
                                  </Text>
                                </HStack>
                              ) : '-'}
                            </Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </TableContainer>
              </CardBody>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default PlanillasTendenciasPage; 