import { useEffect, useState } from 'react';
import {
  Box, Heading, Text, Button, Table, Thead, Tbody, Tr, Th, Td, TableCaption, TableContainer, Spinner, Alert, AlertIcon, useToast,
  Input, IconButton, HStack, NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper,
  Link as ChakraLink, Tabs, TabList, TabPanels, Tab, TabPanel
} from '@chakra-ui/react';
import { AddIcon, CheckIcon, CloseIcon, DeleteIcon, EditIcon, ArrowBackIcon } from '@chakra-ui/icons';
import { Link as RouterLink } from 'react-router-dom';
import { proyeccionVentas } from '../api/api';

type MonthKey = 'enero' | 'febrero' | 'marzo' | 'abril' | 'mayo' | 'junio' | 
  'julio' | 'agosto' | 'septiembre' | 'octubre' | 'noviembre' | 'diciembre';

interface MonthValues {
  enero: number;
  febrero: number;
  marzo: number;
  abril: number;
  mayo: number;
  junio: number;
  julio: number;
  agosto: number;
  septiembre: number;
  octubre: number;
  noviembre: number;
  diciembre: number;
  total_anual: number;
}

interface ProyeccionVentasData extends MonthValues {
  id: number | string;
  actividad: string;
  isEditing?: boolean;
  isNew?: boolean;
}

interface CommissionRowData {
  activity_name: string;
  monthly_values: number[];
  row_total: number;
}

interface VentasCashflowProjection {
  month_headers: string[];
  commission_rows: CommissionRowData[];
  group_totals: Record<string, number[]>; 
  group_row_totals: Record<string, number>;
  grand_total_monthly: number[];
  grand_total_overall: number;
}

const monthKeys: MonthKey[] = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

const monthHeaders = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const initialMonthValues: MonthValues = {
  enero: 0,
  febrero: 0,
  marzo: 0,
  abril: 0,
  mayo: 0,
  junio: 0,
  julio: 0,
  agosto: 0,
  septiembre: 0,
  octubre: 0,
  noviembre: 0,
  diciembre: 0,
  total_anual: 0
};

const EDITABLE_ROWS = ["Comision captador", "Comision referido"];

// Dynamic period logic (3 months before, 36 after current month)
const getDynamicPeriods = () => {
  const now = new Date();
  const months: string[] = [];
  const start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  for (let i = 0; i < 39; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    months.push(`${d.getFullYear()}_${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  // Group by 12 months per tab
  const periods = [];
  for (let i = 0; i < months.length; i += 12) {
    periods.push(months.slice(i, i + 12));
  }
  return periods;
};

const formatMonth = (monthKey: string) => {
  const [year, month] = monthKey.split('_');
  const monthNames = {
    '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril',
    '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto',
    '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre'
  };
  return `${monthNames[month]} ${year}`;
};

const dynamicPeriods = getDynamicPeriods();

const GestionarProyeccionVentas: React.FC = () => {
  const [projectionData, setProjectionData] = useState<VentasCashflowProjection | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await proyeccionVentas.getVentasCashflowProjection();
        console.log('[GestionarProyeccionVentas] API Response Data:', JSON.stringify(response.data, null, 2));
        setProjectionData(response.data);
      } catch (err: any) {
        console.error("Error fetching sales cash flow projection:", err);
        const errorMsg = err.response?.data?.detail || err.message || 'Error al cargar la proyección de flujo de efectivo.';
        setError(errorMsg);
        toast({ title: "Error de Carga", description: errorMsg, status: "error", duration: 6000, isClosable: true });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [toast]);

  const handleCommissionInputChange = (rowIndex: number, monthIndex: number, newValue: number) => {
    if (!projectionData) return;

    const updatedProjectionData = JSON.parse(JSON.stringify(projectionData)) as VentasCashflowProjection;
    const targetRow = updatedProjectionData.commission_rows[rowIndex];
    
    if (!targetRow || !EDITABLE_ROWS.includes(targetRow.activity_name)) return;

    targetRow.monthly_values[monthIndex] = newValue;
    targetRow.row_total = targetRow.monthly_values.reduce((sum, val) => sum + val, 0);

    let groupKeyToUpdate = '';
    if (targetRow.activity_name.startsWith('Comision captador')) {
      groupKeyToUpdate = 'clientes_captados';
    } else if (targetRow.activity_name.startsWith('Comision referido')) {
      groupKeyToUpdate = 'clientes_referidos';
    }

    if (groupKeyToUpdate) {
      updatedProjectionData.group_totals[groupKeyToUpdate] = [...targetRow.monthly_values];
      updatedProjectionData.group_row_totals[groupKeyToUpdate] = targetRow.row_total;
    }
    
    const numMonths = updatedProjectionData.month_headers.length;
    for (let i = 0; i < numMonths; i++) {
      updatedProjectionData.grand_total_monthly[i] = 
        (updatedProjectionData.group_totals['unidades_vendidas']?.[i] || 0) +
        (updatedProjectionData.group_totals['clientes_captados']?.[i] || 0) +
        (updatedProjectionData.group_totals['clientes_referidos']?.[i] || 0);
    }
    updatedProjectionData.grand_total_overall = updatedProjectionData.grand_total_monthly.reduce((sum, val) => sum + val, 0);

    setProjectionData(updatedProjectionData);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="200px">
        <Spinner size="xl" />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error" mt={4}>
        <AlertIcon />
        <Box>
          <Heading size="md">Error al Cargar Datos</Heading>
          <Text>{error}</Text>
        </Box>
      </Alert>
    );
  }

  if (!projectionData) {
    return (
      <Box textAlign="center" mt={4}>
        <Text>No se encontraron datos para la proyección de flujo de efectivo.</Text>
      </Box>
    );
  }

  const formatCurrency = (value: number): string => {
    return `USD ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const renderRowsAndGroupTotals = (period: string[], periodIndex: number) => {
    const rowsToRender: JSX.Element[] = [];
    const startMonthIndex = periodIndex * 12;
    const endMonthIndex = Math.min(startMonthIndex + period.length, projectionData.month_headers.length);
    
    projectionData.commission_rows.forEach((row, rowIndex) => {
      const isEditableRow = EDITABLE_ROWS.includes(row.activity_name);
      const periodValues = row.monthly_values.slice(startMonthIndex, endMonthIndex);
      const periodTotal = periodValues.reduce((sum, val) => sum + val, 0);
      
      rowsToRender.push(
        <Tr key={`commission-${row.activity_name}-${rowIndex}-${periodIndex}`}>
          <Td>{row.activity_name}</Td>
          {periodValues.map((value, monthIndex) => {
            const actualMonthIndex = startMonthIndex + monthIndex;
            return (
              <Td key={`val-${actualMonthIndex}-${row.activity_name}`} isNumeric>
                {isEditableRow ? (
                  <NumberInput 
                    size="sm" 
                    value={value} 
                    onChange={(_valueAsString, valueAsNumber) => handleCommissionInputChange(rowIndex, actualMonthIndex, valueAsNumber)}
                    min={0}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                ) : (
                  formatCurrency(value)
                )}
              </Td>
            );
          })}
          <Td isNumeric fontWeight="bold">{formatCurrency(periodTotal)}</Td>
        </Tr>
      );

      if (row.activity_name.startsWith('Comision Ventas')) {
        const activityGroupKey = 'unidades_vendidas';
        const groupPeriodValues = projectionData.group_totals[activityGroupKey]?.slice(startMonthIndex, endMonthIndex) || [];
        const groupPeriodTotal = groupPeriodValues.reduce((sum, val) => sum + val, 0);
        rowsToRender.push(
          <Tr key={`group-total-${activityGroupKey}-${periodIndex}`} bg="blue.50">
            <Td fontWeight="bold">Total Unidades Vendidas</Td>
            {groupPeriodValues.map((total, monthIdx) => (
              <Td key={`gtval-${startMonthIndex + monthIdx}-${activityGroupKey}`} isNumeric fontWeight="bold">{formatCurrency(total)}</Td>
            ))}
            <Td isNumeric fontWeight="bold">{formatCurrency(groupPeriodTotal)}</Td>
          </Tr>
        );
      } else if (row.activity_name.startsWith('Comision captador')) {
        const activityGroupKey = 'clientes_captados';
        const groupPeriodValues = projectionData.group_totals[activityGroupKey]?.slice(startMonthIndex, endMonthIndex) || [];
        const groupPeriodTotal = groupPeriodValues.reduce((sum, val) => sum + val, 0);
         rowsToRender.push(
          <Tr key={`group-total-${activityGroupKey}-${periodIndex}`} bg="blue.50">
            <Td fontWeight="bold">Total Clientes Captados</Td>
            {groupPeriodValues.map((total, monthIdx) => (
              <Td key={`gtval-${startMonthIndex + monthIdx}-${activityGroupKey}`} isNumeric fontWeight="bold">{formatCurrency(total)}</Td>
            ))}
            <Td isNumeric fontWeight="bold">{formatCurrency(groupPeriodTotal)}</Td>
          </Tr>
        );
      } else if (row.activity_name.startsWith('Comision referido')) {
        const activityGroupKey = 'clientes_referidos';
        const groupPeriodValues = projectionData.group_totals[activityGroupKey]?.slice(startMonthIndex, endMonthIndex) || [];
        const groupPeriodTotal = groupPeriodValues.reduce((sum, val) => sum + val, 0);
        rowsToRender.push(
          <Tr key={`group-total-${activityGroupKey}-${periodIndex}`} bg="blue.50">
            <Td fontWeight="bold">Total Clientes Referidos</Td>
            {groupPeriodValues.map((total, monthIdx) => (
              <Td key={`gtval-${startMonthIndex + monthIdx}-${activityGroupKey}`} isNumeric fontWeight="bold">{formatCurrency(total)}</Td>
            ))}
            <Td isNumeric fontWeight="bold">{formatCurrency(groupPeriodTotal)}</Td>
          </Tr>
        );
      }
    });
    return rowsToRender;
  };

  return (
    <Box p={5}>
      <ChakraLink as={RouterLink} to="/ventas-dashboard" color="blue.500" display="inline-flex" alignItems="center" mb={4}>
        <ArrowBackIcon mr={2} />
        Volver al Dashboard de Ventas
      </ChakraLink>
      <Heading mb={6} textAlign="center">
        Proyección de Flujo de Efectivo - Ventas (Comisiones)
      </Heading>
      <Tabs isFitted>
                 <TabList>
           {dynamicPeriods.map((period, index) => {
             const startMonth = formatMonth(period[0]);
             const endMonth = formatMonth(period[period.length - 1]);
             const startYear = period[0].split('_')[0];
             const endYear = period[period.length - 1].split('_')[0];
             const label = startYear === endYear ? startYear : `${startYear}-${endYear}`;
             return (
               <Tab key={index}>{label}</Tab>
             );
           })}
         </TabList>
        <TabPanels>
                     {dynamicPeriods.map((period, index) => (
             <TabPanel key={index}>
              <TableContainer borderWidth="1px" borderRadius="lg" overflowX="auto" maxW="100%">
                <Table variant="simple" size="sm" minW="max-content">
                  <TableCaption placement="top">Proyección para {period.length} meses</TableCaption>
                  <Thead bg="gray.100">
                    <Tr>
                      <Th>Actividad</Th>
                      {period.map(month => (
                        <Th key={month} isNumeric>{formatMonth(month)}</Th>
                      ))}
                      <Th isNumeric>TOTAL</Th>
                    </Tr>
                  </Thead>
                                     <Tbody>
                     {renderRowsAndGroupTotals(period, index)}
                     <Tr bg="green.100">
                       <Th fontWeight="bold" fontSize="md">Gran Total</Th>
                       {period.map((month, monthIdx) => {
                         const actualMonthIndex = index * 12 + monthIdx;
                         const total = projectionData.grand_total_monthly[actualMonthIndex] || 0;
                         return (
                           <Td key={`grandtotal-month-${actualMonthIndex}`} isNumeric fontWeight="bold" fontSize="md">{formatCurrency(total)}</Td>
                         );
                       })}
                       <Td isNumeric fontWeight="bold" fontSize="md">
                         {formatCurrency(
                           period.reduce((sum, month, monthIdx) => {
                             const actualMonthIndex = index * 12 + monthIdx;
                             return sum + (projectionData.grand_total_monthly[actualMonthIndex] || 0);
                           }, 0)
                         )}
                       </Td>
                     </Tr>
                   </Tbody>
                </Table>
              </TableContainer>
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default GestionarProyeccionVentas; 