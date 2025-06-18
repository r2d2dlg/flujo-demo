import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Heading,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Spinner,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  HStack,
  VStack,
  Button,
  useToast,
  Flex,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  useColorModeValue,
  Divider,
  Select,
  Input,
  FormControl,
  FormLabel,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  Icon
} from '@chakra-ui/react';
import { FaPlus, FaFilter, FaChartLine, FaMoneyBillWave, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import flujoCajaMaestroApi, { 
  FlujoCajaConsolidadoResponse, 
  FlujoCajaFiltros,
  FlujoCajaConsolidadoItem 
} from '../api/flujoCajaMaestroApi';

// Helper to generate dynamic periods: 3 months before + current + 60 months forward, grouped by 12
function generateDynamicPeriods() {
  const now = new Date();
  const months: string[] = [];
  
  // Previous 3 months
  for (let i = 3; i > 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${date.getFullYear()}_${String(date.getMonth() + 1).padStart(2, '0')}`);
  }
  
  // Current + next 60 months
  for (let i = 0; i < 61; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    months.push(`${date.getFullYear()}_${String(date.getMonth() + 1).padStart(2, '0')}`);
  }
  
  // Group by 12
  const periods = [];
  for (let i = 0; i < months.length; i += 12) {
    const periodMonths = months.slice(i, i + 12);
    periods.push({
      label: `${formatMonth(periodMonths[0])} - ${formatMonth(periodMonths[periodMonths.length - 1])}`,
      months: periodMonths.map(monthKey => ({
        key: monthKey,
        label: formatMonth(monthKey)
      }))
    });
  }
  
  return periods;
}

const formatMonth = (monthKey: string) => {
  const [year, month] = monthKey.split('_');
  const monthNames: { [key: string]: string } = {
    '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr',
    '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Ago',
    '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic'
  };
  return `${monthNames[month]} ${year}`;
};

const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return '$ 0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const FlujoCajaMaestroPage: React.FC = () => {
  const [data, setData] = useState<FlujoCajaConsolidadoResponse | null>(null);
  const [filtros, setFiltros] = useState<FlujoCajaFiltros | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilters, setSelectedFilters] = useState({
    categoria_principal: '',
    categoria_secundaria: '',
    proyecto: '',
    tipo_registro: ''
  });
  
  const toast = useToast();
  const periods = useMemo(() => generateDynamicPeriods(), []);
  
  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headerBg = useColorModeValue('gray.50', 'gray.700');

  useEffect(() => {
    fetchData();
    fetchFiltros();
  }, [selectedFilters]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const params = Object.fromEntries(
        Object.entries(selectedFilters).filter(([_, value]) => value !== '')
      );
      
      const response = await flujoCajaMaestroApi.getConsolidado(params);
      setData(response);
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error al cargar los datos del flujo de caja');
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos del flujo de caja',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFiltros = async () => {
    try {
      const filtrosData = await flujoCajaMaestroApi.getFiltros();
      setFiltros(filtrosData);
    } catch (err) {
      console.error('Error fetching filters:', err);
    }
  };

  const createSampleData = async () => {
    try {
      await flujoCajaMaestroApi.createSampleData();
      toast({
        title: 'Datos de ejemplo creados',
        description: 'Se han creado datos de ejemplo exitosamente',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchData();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'No se pudieron crear los datos de ejemplo',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const clearFilters = () => {
    setSelectedFilters({
      categoria_principal: '',
      categoria_secundaria: '',
      proyecto: '',
      tipo_registro: ''
    });
  };

  // Group data by category for better display
  const groupedData = useMemo(() => {
    if (!data) return { INGRESOS: [], EGRESOS: [] };
    
    const grouped = { INGRESOS: [] as FlujoCajaConsolidadoItem[], EGRESOS: [] as FlujoCajaConsolidadoItem[] };
    
    data.data.forEach(item => {
      if (item.categoria_principal === 'INGRESOS' || item.categoria_principal === 'EGRESOS') {
        grouped[item.categoria_principal].push(item);
      }
    });
    
    return grouped;
  }, [data]);

  // Calculate totals for each period
  const calculateTotals = (items: FlujoCajaConsolidadoItem[], periodMonths: string[]) => {
    return periodMonths.map(monthKey => {
      return items.reduce((sum, item) => {
        return sum + (item.meses[monthKey] || 0);
      }, 0);
    });
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="200px">
        <Spinner size="xl" color="blue.500" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" py={10}>
        <Text color="red.500" fontSize="lg">{error}</Text>
        <Button mt={4} onClick={fetchData}>Reintentar</Button>
      </Box>
    );
  }

  return (
    <Box p={6}>
      {/* Header */}
      <VStack spacing={6} align="stretch">
        <Flex justify="space-between" align="center" wrap="wrap">
          <VStack align="start" spacing={1}>
            <Heading size="lg" color="blue.600">
              <Icon as={FaChartLine} mr={3} />
              Flujo de Caja Maestro
            </Heading>
            <Text color="gray.600">
              Sistema centralizado de flujo de caja - 3 meses anteriores + 60 meses proyectados
            </Text>
          </VStack>
          
          <HStack spacing={3}>
            <Button
              leftIcon={<FaPlus />}
              colorScheme="blue"
              variant="outline"
              onClick={createSampleData}
              size="sm"
            >
              Datos de Ejemplo
            </Button>
            <Button
              leftIcon={<FaPlus />}
              colorScheme="blue"
              size="sm"
            >
              Nuevo Item
            </Button>
          </HStack>
        </Flex>

        {/* Summary Cards */}
        {data?.resumen && (
          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Total Ingresos</StatLabel>
                  <StatNumber color="green.500">
                    {formatCurrency(data.resumen.INGRESOS || 0)}
                  </StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    Proyectado
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Total Egresos</StatLabel>
                  <StatNumber color="red.500">
                    {formatCurrency(data.resumen.EGRESOS || 0)}
                  </StatNumber>
                  <StatHelpText>
                    <StatArrow type="decrease" />
                    Proyectado
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Flujo Neto</StatLabel>
                  <StatNumber color={data.resumen.FLUJO_NETO >= 0 ? "green.500" : "red.500"}>
                    {formatCurrency(data.resumen.FLUJO_NETO || 0)}
                  </StatNumber>
                  <StatHelpText>
                    <StatArrow type={data.resumen.FLUJO_NETO >= 0 ? "increase" : "decrease"} />
                    {data.resumen.FLUJO_NETO >= 0 ? "Positivo" : "Negativo"}
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Total Items</StatLabel>
                  <StatNumber>{data.data.length}</StatNumber>
                  <StatHelpText>Conceptos activos</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <Heading size="md">
              <Icon as={FaFilter} mr={2} />
              Filtros
            </Heading>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 5 }} spacing={4}>
              <FormControl>
                <FormLabel fontSize="sm">Categoría Principal</FormLabel>
                <Select
                  value={selectedFilters.categoria_principal}
                  onChange={(e) => setSelectedFilters(prev => ({ ...prev, categoria_principal: e.target.value }))}
                  size="sm"
                >
                  <option value="">Todas</option>
                  {filtros?.categorias_principales.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel fontSize="sm">Categoría Secundaria</FormLabel>
                <Select
                  value={selectedFilters.categoria_secundaria}
                  onChange={(e) => setSelectedFilters(prev => ({ ...prev, categoria_secundaria: e.target.value }))}
                  size="sm"
                >
                  <option value="">Todas</option>
                  {selectedFilters.categoria_principal && filtros?.categorias_secundarias[selectedFilters.categoria_principal]?.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel fontSize="sm">Proyecto</FormLabel>
                <Select
                  value={selectedFilters.proyecto}
                  onChange={(e) => setSelectedFilters(prev => ({ ...prev, proyecto: e.target.value }))}
                  size="sm"
                >
                  <option value="">Todos</option>
                  {filtros?.proyectos.map(proyecto => (
                    <option key={proyecto} value={proyecto}>{proyecto}</option>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel fontSize="sm">Tipo Registro</FormLabel>
                <Select
                  value={selectedFilters.tipo_registro}
                  onChange={(e) => setSelectedFilters(prev => ({ ...prev, tipo_registro: e.target.value }))}
                  size="sm"
                >
                  <option value="">Todos</option>
                  {filtros?.tipos_registro.map(tipo => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel fontSize="sm">&nbsp;</FormLabel>
                <Button size="sm" variant="outline" onClick={clearFilters} width="full">
                  Limpiar
                </Button>
              </FormControl>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Data Tables with Tabs */}
        <Card>
          <CardBody>
            <Tabs variant="enclosed" colorScheme="blue">
              <TabList>
                {periods.map((period, index) => (
                  <Tab key={index} fontSize="sm">
                    {period.label}
                  </Tab>
                ))}
              </TabList>

              <TabPanels>
                {periods.map((period, periodIndex) => (
                  <TabPanel key={periodIndex} p={0} mt={4}>
                    <TableContainer>
                      <Table size="sm" variant="simple">
                        <Thead bg={headerBg}>
                          <Tr>
                            <Th width="300px" position="sticky" left={0} bg={headerBg} zIndex={1}>
                              Concepto
                            </Th>
                            <Th width="120px">Categoría</Th>
                            <Th width="100px">Tipo</Th>
                            {period.months.map((month) => (
                              <Th key={month.key} textAlign="right" minWidth="100px">
                                {month.label}
                              </Th>
                            ))}
                            <Th textAlign="right" width="120px">Total</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {/* INGRESOS Section */}
                          {groupedData.INGRESOS.length > 0 && (
                            <>
                              <Tr bg="green.50">
                                <Td fontWeight="bold" color="green.700" colSpan={period.months.length + 4}>
                                  <Icon as={FaArrowUp} mr={2} />
                                  INGRESOS
                                </Td>
                              </Tr>
                              {groupedData.INGRESOS.map((item, index) => (
                                <Tr key={`ingresos-${index}`} _hover={{ bg: "gray.50" }}>
                                  <Td position="sticky" left={0} bg={bgColor} borderRight="1px" borderColor={borderColor}>
                                    <VStack align="start" spacing={1}>
                                      <Text fontWeight="medium" fontSize="sm">
                                        {item.concepto || `${item.categoria_secundaria}${item.subcategoria ? ` - ${item.subcategoria}` : ''}`}
                                      </Text>
                                      {item.proyecto && (
                                        <Badge size="sm" colorScheme="blue">{item.proyecto}</Badge>
                                      )}
                                    </VStack>
                                  </Td>
                                  <Td>
                                    <Text fontSize="xs" color="gray.600">
                                      {item.categoria_secundaria}
                                    </Text>
                                  </Td>
                                  <Td>
                                    <Badge 
                                      size="sm" 
                                      colorScheme={item.tipo_registro === 'REAL' ? 'green' : 
                                                 item.tipo_registro === 'PROYECTADO' ? 'blue' : 'orange'}
                                    >
                                      {item.tipo_registro}
                                    </Badge>
                                  </Td>
                                  {period.months.map((month) => (
                                    <Td key={month.key} textAlign="right" fontSize="sm">
                                      {formatCurrency(item.meses[month.key] || 0)}
                                    </Td>
                                  ))}
                                  <Td textAlign="right" fontWeight="bold" fontSize="sm">
                                    {formatCurrency(item.total || 0)}
                                  </Td>
                                </Tr>
                              ))}
                              {/* Ingresos Subtotal */}
                              <Tr bg="green.100" fontWeight="bold">
                                <Td colSpan={3}>SUBTOTAL INGRESOS</Td>
                                {period.months.map((month) => (
                                  <Td key={month.key} textAlign="right">
                                    {formatCurrency(calculateTotals(groupedData.INGRESOS, [month.key])[0])}
                                  </Td>
                                ))}
                                <Td textAlign="right">
                                  {formatCurrency(groupedData.INGRESOS.reduce((sum, item) => sum + (item.total || 0), 0))}
                                </Td>
                              </Tr>
                            </>
                          )}

                          {/* EGRESOS Section */}
                          {groupedData.EGRESOS.length > 0 && (
                            <>
                              <Tr bg="red.50">
                                <Td fontWeight="bold" color="red.700" colSpan={period.months.length + 4}>
                                  <Icon as={FaArrowDown} mr={2} />
                                  EGRESOS
                                </Td>
                              </Tr>
                              {groupedData.EGRESOS.map((item, index) => (
                                <Tr key={`egresos-${index}`} _hover={{ bg: "gray.50" }}>
                                  <Td position="sticky" left={0} bg={bgColor} borderRight="1px" borderColor={borderColor}>
                                    <VStack align="start" spacing={1}>
                                      <Text fontWeight="medium" fontSize="sm">
                                        {item.concepto || `${item.categoria_secundaria}${item.subcategoria ? ` - ${item.subcategoria}` : ''}`}
                                      </Text>
                                      {item.proyecto && (
                                        <Badge size="sm" colorScheme="blue">{item.proyecto}</Badge>
                                      )}
                                    </VStack>
                                  </Td>
                                  <Td>
                                    <Text fontSize="xs" color="gray.600">
                                      {item.categoria_secundaria}
                                    </Text>
                                  </Td>
                                  <Td>
                                    <Badge 
                                      size="sm" 
                                      colorScheme={item.tipo_registro === 'REAL' ? 'green' : 
                                                 item.tipo_registro === 'PROYECTADO' ? 'blue' : 'orange'}
                                    >
                                      {item.tipo_registro}
                                    </Badge>
                                  </Td>
                                  {period.months.map((month) => (
                                    <Td key={month.key} textAlign="right" fontSize="sm">
                                      {formatCurrency(item.meses[month.key] || 0)}
                                    </Td>
                                  ))}
                                  <Td textAlign="right" fontWeight="bold" fontSize="sm">
                                    {formatCurrency(item.total || 0)}
                                  </Td>
                                </Tr>
                              ))}
                              {/* Egresos Subtotal */}
                              <Tr bg="red.100" fontWeight="bold">
                                <Td colSpan={3}>SUBTOTAL EGRESOS</Td>
                                {period.months.map((month) => (
                                  <Td key={month.key} textAlign="right">
                                    {formatCurrency(calculateTotals(groupedData.EGRESOS, [month.key])[0])}
                                  </Td>
                                ))}
                                <Td textAlign="right">
                                  {formatCurrency(groupedData.EGRESOS.reduce((sum, item) => sum + (item.total || 0), 0))}
                                </Td>
                              </Tr>
                            </>
                          )}

                          {/* Net Flow Total */}
                          {(groupedData.INGRESOS.length > 0 || groupedData.EGRESOS.length > 0) && (
                            <Tr bg="blue.100" fontWeight="bold" fontSize="lg">
                              <Td colSpan={3}>
                                <Icon as={FaMoneyBillWave} mr={2} />
                                FLUJO NETO
                              </Td>
                              {period.months.map((month) => {
                                const ingresos = calculateTotals(groupedData.INGRESOS, [month.key])[0];
                                const egresos = calculateTotals(groupedData.EGRESOS, [month.key])[0];
                                const neto = ingresos - egresos;
                                return (
                                  <Td key={month.key} textAlign="right" color={neto >= 0 ? "green.600" : "red.600"}>
                                    {formatCurrency(neto)}
                                  </Td>
                                );
                              })}
                              <Td textAlign="right" color={data?.resumen?.FLUJO_NETO >= 0 ? "green.600" : "red.600"}>
                                {formatCurrency(data?.resumen?.FLUJO_NETO || 0)}
                              </Td>
                            </Tr>
                          )}
                        </Tbody>
                      </Table>
                    </TableContainer>
                  </TabPanel>
                ))}
              </TabPanels>
            </Tabs>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
};

export default FlujoCajaMaestroPage; 