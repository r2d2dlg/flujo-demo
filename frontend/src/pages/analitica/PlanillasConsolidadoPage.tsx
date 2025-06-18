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
  TableContainer,
  VStack,
  HStack,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Grid,
  GridItem,
  Card,
  CardBody,
  Badge,
  Text,
  Spinner,
  Alert,
  AlertIcon,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Button,
  Icon
} from '@chakra-ui/react';
import { FaUsers, FaMoneyBillWave, FaChartLine, FaCalendarAlt, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/api';

interface PlanillaData {
  month: string;
  monto: number;
  tipo: string;
  categoria: string;
}

interface ConsolidatedData {
  planillas_fijas: PlanillaData[];
  planillas_variables: PlanillaData[];
  servicios_profesionales: PlanillaData[];
  totales_mensuales: { [key: string]: number };
  total_general: number;
}

const PlanillasConsolidadoPage: React.FC = () => {
  const [data, setData] = useState<ConsolidatedData | null>(null);
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
      const monthLabel = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
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

        // Process and consolidate data
        const planillasFijas = planillasAdminRes.data || [];
        const planillasVariables = planillasVarRes.data || [];
        const serviciosProfesionales = serviciosProfRes.data || [];

        // Calculate monthly totals
        const totalesMensuales: { [key: string]: number } = {};
        months.forEach(month => {
          const fijasMonto = planillasFijas.find((item: any) => item.month === month.key)?.monto || 0;
          const variablesMonto = planillasVariables.find((item: any) => item.month === month.key)?.monto || 0;
          const serviciosMonto = serviciosProfesionales.find((item: any) => item.month === month.key)?.monto || 0;
          
          totalesMensuales[month.key] = fijasMonto + variablesMonto + serviciosMonto;
        });

        const totalGeneral = Object.values(totalesMensuales).reduce((sum, val) => sum + val, 0);

        setData({
          planillas_fijas: planillasFijas,
          planillas_variables: planillasVariables,
          servicios_profesionales: serviciosProfesionales,
          totales_mensuales: totalesMensuales,
          total_general: totalGeneral
        });

      } catch (err: any) {
        console.error('Error fetching planillas data:', err);
        setError('Error al cargar los datos de planillas');
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los datos de planillas',
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

  if (isLoading) {
    return (
      <Box p={5} display="flex" justifyContent="center" alignItems="center" minH="400px">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>Cargando datos de planillas...</Text>
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

  // Calculate statistics
  const totalFijas = data.planillas_fijas.reduce((sum, item) => sum + item.monto, 0);
  const totalVariables = data.planillas_variables.reduce((sum, item) => sum + item.monto, 0);
  const totalServicios = data.servicios_profesionales.reduce((sum, item) => sum + item.monto, 0);

  const promedioMensual = data.total_general / 12;
  const mesActual = months[months.length - 1].key;
  const mesAnterior = months[months.length - 2].key;
  const variacionMensual = ((data.totales_mensuales[mesActual] || 0) - (data.totales_mensuales[mesAnterior] || 0)) / (data.totales_mensuales[mesAnterior] || 1) * 100;

  return (
    <Box p={5}>
      <HStack justify="space-between" mb={6}>
        <VStack align="start" spacing={2}>
          <Heading>Planillas Consolidado</Heading>
          <Text color="gray.600">Análisis consolidado de todas las planillas</Text>
        </VStack>
        <Button leftIcon={<Icon as={FaArrowLeft} />} onClick={() => navigate('/admin/analitica-avanzada')}>
          Volver
        </Button>
      </HStack>

      {/* Statistics Cards */}
      <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={6} mb={8}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>
                <HStack>
                  <Icon as={FaUsers} />
                  <Text>Planillas Fijas</Text>
                </HStack>
              </StatLabel>
              <StatNumber>{formatCurrency(totalFijas)}</StatNumber>
              <StatHelpText>
                <Badge colorScheme="blue">Administrativo</Badge>
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>
                <HStack>
                  <Icon as={FaMoneyBillWave} />
                  <Text>Planillas Variables</Text>
                </HStack>
              </StatLabel>
              <StatNumber>{formatCurrency(totalVariables)}</StatNumber>
              <StatHelpText>
                <Badge colorScheme="green">Por proyecto</Badge>
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>
                <HStack>
                  <Icon as={FaChartLine} />
                  <Text>Servicios Profesionales</Text>
                </HStack>
              </StatLabel>
              <StatNumber>{formatCurrency(totalServicios)}</StatNumber>
              <StatHelpText>
                <Badge colorScheme="purple">Consultoría</Badge>
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>
                <HStack>
                  <Icon as={FaCalendarAlt} />
                  <Text>Total General</Text>
                </HStack>
              </StatLabel>
              <StatNumber>{formatCurrency(data.total_general)}</StatNumber>
              <StatHelpText>
                <StatArrow type={variacionMensual >= 0 ? 'increase' : 'decrease'} />
                {variacionMensual.toFixed(1)}% vs mes anterior
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </Grid>

      <Tabs>
        <TabList>
          <Tab>Vista Consolidada</Tab>
          <Tab>Planillas Fijas</Tab>
          <Tab>Planillas Variables</Tab>
          <Tab>Servicios Profesionales</Tab>
        </TabList>

        <TabPanels>
          {/* Consolidated View */}
          <TabPanel>
            <Card>
              <CardBody>
                <Heading size="md" mb={4}>Resumen Mensual Consolidado</Heading>
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
                        const totalMes = data.totales_mensuales[month.key] || 0;

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
                      <Tr bg="gray.50" fontWeight="bold">
                        <Td>TOTAL</Td>
                        <Td isNumeric>{formatCurrency(totalFijas)}</Td>
                        <Td isNumeric>{formatCurrency(totalVariables)}</Td>
                        <Td isNumeric>{formatCurrency(totalServicios)}</Td>
                        <Td isNumeric color="blue.700" fontSize="lg">
                          {formatCurrency(data.total_general)}
                        </Td>
                      </Tr>
                    </Tbody>
                  </Table>
                </TableContainer>
              </CardBody>
            </Card>
          </TabPanel>

          {/* Individual Tabs for each payroll type */}
          <TabPanel>
            <Card>
              <CardBody>
                <Heading size="md" mb={4}>Detalle Planillas Fijas</Heading>
                <TableContainer>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Mes</Th>
                        <Th isNumeric>Monto</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {data.planillas_fijas.map((item, index) => (
                        <Tr key={index}>
                          <Td>{months.find(m => m.key === item.month)?.label || item.month}</Td>
                          <Td isNumeric>{formatCurrency(item.monto)}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </CardBody>
            </Card>
          </TabPanel>

          <TabPanel>
            <Card>
              <CardBody>
                <Heading size="md" mb={4}>Detalle Planillas Variables</Heading>
                <TableContainer>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Mes</Th>
                        <Th isNumeric>Monto</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {data.planillas_variables.map((item, index) => (
                        <Tr key={index}>
                          <Td>{months.find(m => m.key === item.month)?.label || item.month}</Td>
                          <Td isNumeric>{formatCurrency(item.monto)}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </CardBody>
            </Card>
          </TabPanel>

          <TabPanel>
            <Card>
              <CardBody>
                <Heading size="md" mb={4}>Detalle Servicios Profesionales</Heading>
                <TableContainer>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Mes</Th>
                        <Th isNumeric>Monto</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {data.servicios_profesionales.map((item, index) => (
                        <Tr key={index}>
                          <Td>{months.find(m => m.key === item.month)?.label || item.month}</Td>
                          <Td isNumeric>{formatCurrency(item.monto)}</Td>
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
    </Box>
  );
};

export default PlanillasConsolidadoPage; 