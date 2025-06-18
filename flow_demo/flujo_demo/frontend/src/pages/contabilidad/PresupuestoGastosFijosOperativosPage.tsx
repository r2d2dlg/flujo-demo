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
  useToast,
  Text,
  CircularProgress,
  Flex,
  Card,
  CardHeader,
  CardBody,
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
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { FaEdit, FaSave, FaTimes, FaPlus, FaSync, FaChartLine, FaFileExport } from 'react-icons/fa';

// Interface for fixed operating expense items
interface FixedExpenseItem {
  id: string;
  concept: string;
  category: string;
  description: string;
  months: { [key: string]: number };
}

interface MonthData {
  monthKey: string;
  monthName: string;
  year: number;
  month: number;
}

interface PeriodGroup {
  label: string;
  months: MonthData[];
}

const PresupuestoGastosFijosOperativosPage: React.FC = () => {
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpenseItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [monthsData, setMonthsData] = useState<MonthData[]>([]);
  const [periodGroups, setPeriodGroups] = useState<PeriodGroup[]>([]);
  const toast = useToast();

  // Helper functions
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-PA', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getMonthName = (month: number): string => {
    const monthNames = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];
    return monthNames[month - 1];
  };

  // Generate dynamic 39-month period (3 months before + current month + 35 months forward)
  const generateMonthsData = (): MonthData[] => {
    const currentDate = new Date();
    const months: MonthData[] = [];
    
    // Generate 39 months total: 3 before + current + 35 forward
    for (let i = -3; i <= 35; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      
      months.push({
        monthKey: `${year}_${month.toString().padStart(2, '0')}`,
        monthName: getMonthName(month),
        year,
        month
      });
    }
    
    return months;
  };

  // Group months by year for tabs (12 months per tab)
  const createPeriodGroups = (months: MonthData[]): PeriodGroup[] => {
    const groups: PeriodGroup[] = [];
    
    for (let i = 0; i < months.length; i += 12) {
      const groupMonths = months.slice(i, i + 12);
      if (groupMonths.length > 0) {
        const startYear = groupMonths[0].year;
        const endYear = groupMonths[groupMonths.length - 1].year;
        
        let label: string;
        if (startYear === endYear) {
          label = startYear.toString();
        } else {
          label = `${startYear}-${endYear}`;
        }
        
        groups.push({
          label,
          months: groupMonths
        });
      }
    }
    
    return groups;
  };

  // Generate sample fixed operating expenses data
  const generateFixedExpensesData = (months: MonthData[]): FixedExpenseItem[] => {
    const fixedExpenseRows = [
      // Rent and Facilities
      { concept: 'Alquiler Oficina Principal', category: 'Instalaciones', description: 'Renta mensual sede principal', baseAmount: 3500 },
      { concept: 'Alquiler Bodega', category: 'Instalaciones', description: 'Renta mensual almacén', baseAmount: 1200 },
      { concept: 'Mantenimiento Edificio', category: 'Instalaciones', description: 'Mantenimiento preventivo instalaciones', baseAmount: 800 },
      
      // Utilities
      { concept: 'Electricidad', category: 'Servicios Públicos', description: 'Consumo eléctrico mensual', baseAmount: 1500 },
      { concept: 'Agua y Alcantarillado', category: 'Servicios Públicos', description: 'Servicios de agua mensual', baseAmount: 300 },
      { concept: 'Gas Natural', category: 'Servicios Públicos', description: 'Consumo gas natural', baseAmount: 200 },
      { concept: 'Internet Empresarial', category: 'Servicios Públicos', description: 'Conectividad y telecomunicaciones', baseAmount: 450 },
      { concept: 'Teléfono Fijo', category: 'Servicios Públicos', description: 'Líneas telefónicas fijas', baseAmount: 180 },
      
      // Insurance and Security
      { concept: 'Seguro de Oficina', category: 'Seguros', description: 'Póliza integral oficina', baseAmount: 600 },
      { concept: 'Seguro de Equipos', category: 'Seguros', description: 'Cobertura equipos informáticos', baseAmount: 400 },
      { concept: 'Seguridad Física', category: 'Seguros', description: 'Servicio vigilancia 24/7', baseAmount: 1800 },
      
      // Equipment and Technology
      { concept: 'Licencias Software', category: 'Tecnología', description: 'Licencias software empresarial', baseAmount: 950 },
      { concept: 'Hosting y Dominios', category: 'Tecnología', description: 'Servicios web y hosting', baseAmount: 150 },
      { concept: 'Soporte Técnico', category: 'Tecnología', description: 'Mantenimiento equipos IT', baseAmount: 500 },
      
      // Transportation and Vehicles
      { concept: 'Combustible Vehículos', category: 'Transporte', description: 'Combustible flota empresarial', baseAmount: 2200 },
      { concept: 'Mantenimiento Vehículos', category: 'Transporte', description: 'Servicios mecánicos preventivos', baseAmount: 800 },
      { concept: 'Seguros Vehículos', category: 'Transporte', description: 'Pólizas vehículos empresa', baseAmount: 650 },
      
      // Administrative and Legal
      { concept: 'Servicios Contables', category: 'Servicios Profesionales', description: 'Asesoría contable mensual', baseAmount: 1500 },
      { concept: 'Servicios Legales', category: 'Servicios Profesionales', description: 'Asesoría jurídica retainer', baseAmount: 800 },
      { concept: 'Auditoría Externa', category: 'Servicios Profesionales', description: 'Servicios auditoría anual', baseAmount: 300 },
      
      // Banking and Financial
      { concept: 'Comisiones Bancarias', category: 'Servicios Financieros', description: 'Comisiones cuentas corrientes', baseAmount: 250 },
      { concept: 'Manejo de Cuentas', category: 'Servicios Financieros', description: 'Cargos administración bancaria', baseAmount: 150 },
      
      // Office Supplies and Materials
      { concept: 'Suministros Oficina', category: 'Materiales', description: 'Papelería y materiales oficina', baseAmount: 400 },
      { concept: 'Materiales Limpieza', category: 'Materiales', description: 'Productos aseo y limpieza', baseAmount: 300 },
      { concept: 'Equipos Menor Cuantía', category: 'Materiales', description: 'Herramientas y equipos menores', baseAmount: 200 },
    ];

    const fixedExpenseItems: FixedExpenseItem[] = [];
    let itemId = 1;

    fixedExpenseRows.forEach(item => {
      const monthsObject: { [key: string]: number } = {};
      
      months.forEach((monthData, index) => {
        // Add some seasonal variation for realism
        let seasonalFactor = 1;
        const monthNum = monthData.month;
        
        // Higher costs in certain months (e.g., utilities in summer/winter)
        if (item.category === 'Servicios Públicos' && (monthNum === 1 || monthNum === 2 || monthNum === 7 || monthNum === 8)) {
          seasonalFactor = 1.15; // 15% higher in extreme weather months
        }
        
        // Lower costs in past months, current and future remain stable
        if (index < 3) {
          seasonalFactor *= 0.95; // 5% lower for past months
        }
        
        const amount = Math.round(item.baseAmount * seasonalFactor);
        monthsObject[monthData.monthKey] = amount;
      });

      fixedExpenseItems.push({
        id: itemId.toString(),
        concept: item.concept,
        category: item.category,
        description: item.description,
        months: monthsObject
      });
      
      itemId++;
    });

    return fixedExpenseItems;
  };

  // Initialize data
  useEffect(() => {
    setIsLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const months = generateMonthsData();
      const sampleData = generateFixedExpensesData(months);
      const groups = createPeriodGroups(months);
      
      setMonthsData(months);
      setFixedExpenses(sampleData);
      setPeriodGroups(groups);
      setIsLoading(false);
      
      toast({
        title: 'Datos Cargados',
        description: `Gastos fijos operativos cargados para ${months.length} meses con datos de muestra.`,
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    }, 1000);
  }, [toast]);

  // Calculate totals
  const calculateMonthTotal = (monthKey: string): number => {
    return fixedExpenses.reduce((sum, item) => sum + (item.months[monthKey] || 0), 0);
  };

  const calculateItemTotal = (item: FixedExpenseItem): number => {
    return monthsData.reduce((sum, month) => sum + (item.months[month.monthKey] || 0), 0);
  };

  const calculateGrandTotal = (): number => {
    return monthsData.reduce((sum, month) => sum + calculateMonthTotal(month.monthKey), 0);
  };

  // Edit functionality
  const startEditing = (itemId: string, monthKey: string) => {
    setEditingCell(`${itemId}_${monthKey}`);
  };

  const saveEdit = () => {
    setEditingCell(null);
    toast({
      title: 'Presupuesto Actualizado',
      description: 'Los cambios han sido guardados exitosamente.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const cancelEdit = () => {
    setEditingCell(null);
  };

  const updateExpenseAmount = (itemId: string, monthKey: string, value: number) => {
    setFixedExpenses(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, months: { ...item.months, [monthKey]: value || 0 } }
        : item
    ));
  };

  // Render cell (editable or display)
  const renderCell = (item: FixedExpenseItem, month: MonthData) => {
    const cellKey = `${item.id}_${month.monthKey}`;
    const value = item.months[month.monthKey] || 0;
    const isEditing = editingCell === cellKey;

    return (
      <Td key={month.monthKey} isNumeric position="relative">
        {isEditing ? (
          <HStack spacing={1}>
            <NumberInput
              size="sm"
              value={value}
              onChange={(_, val) => updateExpenseAmount(item.id, month.monthKey, val)}
              min={0}
              step={10}
              w="100px"
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
            <Tooltip label="Guardar">
              <IconButton
                icon={<FaSave />}
                size="xs"
                colorScheme="green"
                onClick={saveEdit}
                aria-label="Guardar"
              />
            </Tooltip>
            <Tooltip label="Cancelar">
              <IconButton
                icon={<FaTimes />}
                size="xs"
                variant="outline"
                onClick={cancelEdit}
                aria-label="Cancelar"
              />
            </Tooltip>
          </HStack>
        ) : (
          <HStack spacing={1} justify="space-between">
            <Text fontSize="sm">{formatCurrency(value)}</Text>
            <Tooltip label="Editar">
              <IconButton
                icon={<FaEdit />}
                size="xs"
                variant="ghost"
                onClick={() => startEditing(item.id, month.monthKey)}
                aria-label="Editar"
                opacity={0.5}
                _hover={{ opacity: 1 }}
              />
            </Tooltip>
                  </HStack>
        )}
                </Td>
    );
  };

  if (isLoading) {
    return (
      <Box p={5}>
        <Flex justify="center" align="center" h="400px">
          <VStack spacing={4}>
            <CircularProgress isIndeterminate color="blue.300" size="80px" />
            <Text fontSize="lg">Cargando gastos fijos operativos...</Text>
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
            Presupuesto Gastos Fijos Operativos - Proyección 39 Meses
          </Heading>
          <HStack>
            <Button 
              leftIcon={<FaSync />} 
              onClick={() => {
                const months = generateMonthsData();
                const sampleData = generateFixedExpensesData(months);
                const groups = createPeriodGroups(months);
                setMonthsData(months);
                setFixedExpenses(sampleData);
                setPeriodGroups(groups);
              }}
              variant="outline"
              size="sm"
            >
              Actualizar Período
            </Button>
            <Button as={RouterLink} to="/dashboard-contabilidad" colorScheme="gray">
              Dashboard Contabilidad
            </Button>
          </HStack>
        </Flex>

        {/* Period Info */}
        <Alert status="info">
          <AlertIcon />
          <VStack align="start" spacing={1}>
            <Text fontWeight="bold">
              Período Dinámico: {monthsData.length > 0 && `${monthsData[0].monthName} ${monthsData[0].year} - ${monthsData[monthsData.length - 1].monthName} ${monthsData[monthsData.length - 1].year}`}
            </Text>
            <Text fontSize="sm">
              Gastos fijos operativos con 3 meses anteriores + mes actual + 35 meses futuros (39 meses total). Los datos son de muestra para demostración.
            </Text>
          </VStack>
        </Alert>

        {/* Summary Cards */}
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total Gastos Fijos</StatLabel>
                <StatNumber fontSize="xl">{formatCurrency(calculateGrandTotal())}</StatNumber>
                <StatHelpText>39 meses (3 anteriores + actual + 35 futuros)</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Promedio Mensual</StatLabel>
                <StatNumber fontSize="xl">
                  {formatCurrency(calculateGrandTotal() / monthsData.length)}
                </StatNumber>
                <StatHelpText>Promedio del período</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Mes Actual</StatLabel>
                <StatNumber fontSize="xl">
                  {monthsData.length > 3 ? formatCurrency(calculateMonthTotal(monthsData[3].monthKey)) : '$0'}
                </StatNumber>
                <StatHelpText>
                  {monthsData.length > 3 ? `${monthsData[3].monthName} ${monthsData[3].year}` : ''}
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Conceptos</StatLabel>
                <StatNumber fontSize="xl">{fixedExpenses.length}</StatNumber>
                <StatHelpText>Gastos fijos operativos</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Fixed Expenses Table with Tabs */}
        <Card>
          <CardHeader>
            <HStack justify="space-between">
              <Heading size="md">Gastos Fijos Operativos por Período</Heading>
              <HStack>
                <Button leftIcon={<FaFileExport />} size="sm" variant="outline">
                  Exportar
                </Button>
                <Button leftIcon={<FaPlus />} size="sm" colorScheme="blue">
                  Agregar Concepto
            </Button>
          </HStack>
        </HStack>
          </CardHeader>
          <CardBody>
            <Tabs variant="enclosed" colorScheme="blue">
              <TabList>
                {periodGroups.map((group, index) => (
                  <Tab key={index}>{group.label}</Tab>
                ))}
              </TabList>
              <TabPanels>
                {periodGroups.map((group, groupIndex) => (
                  <TabPanel key={groupIndex} p={0}>
                    <Box overflowX="auto">
                      <TableContainer>
                        <Table variant="simple" size="sm">
                          <Thead>
                            <Tr>
                              <Th position="sticky" left={0} bg="gray.100" zIndex={1} width="250px">
                                Concepto
                              </Th>
                              {group.months.map(month => (
                                <Th key={month.monthKey} isNumeric width="120px">
                                  {month.monthName} {month.year}
                                </Th>
                              ))}
                              <Th isNumeric width="120px">Total</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {fixedExpenses.map((item) => (
                              <Tr key={item.id}>
                                <Td 
                                  position="sticky" 
                                  left={0} 
                                  bg="white" 
                                  zIndex={1}
                                  borderRight="1px solid"
                                  borderColor="gray.200"
                                >
                                  <VStack align="start" spacing={0}>
                                    <Text fontSize="sm" fontWeight="semibold">
                                      {item.concept}
                                    </Text>
                                    <Text fontSize="xs" color="gray.500">
                                      {item.category}
                                    </Text>
      </VStack>
                                </Td>
                                {group.months.map(month => renderCell(item, month))}
                                <Td isNumeric fontWeight="semibold">
                                  {formatCurrency(calculateItemTotal(item))}
                                </Td>
                              </Tr>
                            ))}
                            
                            {/* Total Row */}
                            <Tr bg="blue.50" borderTop="2px solid" borderColor="blue.200">
                              <Td 
                                position="sticky" 
                                left={0} 
                                bg="blue.50" 
                                zIndex={1}
                                fontWeight="bold" 
                                fontSize="md" 
                                color="blue.700"
                                borderRight="1px solid"
                                borderColor="blue.200"
                              >
                                TOTAL GASTOS FIJOS
                              </Td>
                              {group.months.map(month => (
                                <Td key={month.monthKey} isNumeric fontWeight="bold" fontSize="md" color="blue.700">
                                  {formatCurrency(calculateMonthTotal(month.monthKey))}
                                </Td>
                              ))}
                              <Td isNumeric fontWeight="bold" fontSize="md" color="blue.700">
                                {formatCurrency(calculateGrandTotal())}
                              </Td>
                            </Tr>
                          </Tbody>
                        </Table>
                      </TableContainer>
              </Box>
                  </TabPanel>
                ))}
              </TabPanels>
            </Tabs>
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
                to="/analitica/dashboard-gastos-ejecutivo"
                leftIcon={<FaChartLine />}
                colorScheme="blue" 
                variant="outline"
              >
                Dashboard Ejecutivo
              </Button>
              <Button 
                as={RouterLink} 
                to="/contabilidad/gestionar-presupuesto-gastos"
                leftIcon={<FaChartLine />}
                colorScheme="purple"
                variant="outline"
              >
                Gastos Variables por Proyecto
              </Button>
              <Button 
                as={RouterLink} 
                to="/analitica/alertas-presupuesto"
                leftIcon={<FaFileExport />}
                colorScheme="green"
                variant="outline"
              >
                Ver Alertas Presupuestarias
            </Button>
            </Grid>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
};

export default PresupuestoGastosFijosOperativosPage; 