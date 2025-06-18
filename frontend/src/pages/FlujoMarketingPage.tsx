import { useState, useEffect, useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
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
  Center,
  Button,
  VStack,
  HStack,
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  Tab,
  useToast,
} from '@chakra-ui/react';
import { api } from '../api/api';

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const HIDDEN_COLUMNS = ['id', 'created_at', 'updated_at'];

// Helper to extract all month columns from a row (e.g., amount_2024_03, 2024_03, ENERO, etc.)
function extractMonthColumns(row: any) {
  return Object.keys(row).filter(
    col =>
      /^amount_\d{4}_\d{2}$/.test(col) || // amount_2024_03
      /^\d{4}_\d{2}$/.test(col) ||       // 2024_03
      MONTHS_ES.map(m => m.toUpperCase()).includes(col.toUpperCase())
  );
}

// Helper to convert column name to 'Mes Año'
function tidyMonthCol(col: string) {
  let match = col.match(/(\d{4})_(\d{2})$/);
  if (!match) match = col.match(/amount_(\d{4})_(\d{2})$/);
  if (match) {
    const year = match[1];
    const monthIdx = parseInt(match[2], 10) - 1;
    return `${MONTHS_ES[monthIdx]} ${year}`;
  }
  const idx = MONTHS_ES.map(m => m.toUpperCase()).indexOf(col.toUpperCase());
  if (idx !== -1) {
    const year = new Date().getFullYear();
    return `${MONTHS_ES[idx]} ${year}`;
  }
  return col;
}

// Generate periods: previous 3 months + next 36 months, grouped by 12
function generatePeriods(allMonthCols: string[]) {
  const sorted = [...allMonthCols].sort((a, b) => {
    const parse = (col: string) => {
      let m = col.match(/(\d{4})_(\d{2})$/);
      if (!m) m = col.match(/amount_(\d{4})_(\d{2})$/);
      if (m) return parseInt(m[1]) * 100 + parseInt(m[2]);
      return 99999999;
    };
    return parse(a) - parse(b);
  });
  const periods = [];
  for (let i = 0; i < sorted.length; i += 12) {
    periods.push({
      label: `${tidyMonthCol(sorted[i])} - ${tidyMonthCol(sorted[Math.min(i+11, sorted.length-1)])}`,
      months: sorted.slice(i, i+12)
    });
  }
  return periods;
}

function getDynamicPeriods() {
  const now = new Date();
  now.setDate(1);
  const start = new Date(now);
  start.setMonth(start.getMonth() - 3);
  const end = new Date(now);
  end.setMonth(end.getMonth() + 36);
  const months = [];
  let d = new Date(start);
  while (d <= end) {
    const year = d.getFullYear();
    const month = d.getMonth();
    const key = `${year}_${(month + 1).toString().padStart(2, '0')}`;
    const label = `${MONTHS_ES[month]} ${year}`;
    months.push({ key, label, year, month });
    d.setMonth(d.getMonth() + 1);
  }
  const periods = [];
  for (let i = 0; i < months.length; i += 12) {
    periods.push({
      label: `${months[i].label} - ${months[Math.min(i+11, months.length-1)].label}`,
      months: months.slice(i, i+12)
    });
  }
  return periods;
}

export default function FlujoPublicidadPage() {
  const toast = useToast();
  const [tableData, setTableData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentMonthSum, setCurrentMonthSum] = useState<number>(0);


  const periods = useMemo(() => getDynamicPeriods(), []);
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}`;

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // Get data from the inversion_mercadeo table (publicity budget from reporte-marketing)
        const response = await api.get('/api/tables/inversion_mercadeo/data', {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        
        // The response format is: { columns: [...], data: [...] }
        if (response.data && response.data.data) {
          // Transform the budget data into cash flow format
          const budgetData = response.data.data;
          
          // Group by actividad and create cash flow rows
          const cashFlowData = budgetData.map((row: any) => {
            // Create a cash flow row with the actividad and distribute monto across periods
            const cashFlowRow: any = {
              actividad: row.actividad || row.descripcion || 'Publicidad',
              id: row.id
            };
            
            // For now, put the monto in the current month or fecha_prevista month
            const currentDate = new Date();
            let targetMonth = `${currentDate.getFullYear()}_${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
            
            // If there's a fecha_prevista, use that month instead
            if (row.fecha_prevista) {
              const fechaDate = new Date(row.fecha_prevista);
              targetMonth = `${fechaDate.getFullYear()}_${String(fechaDate.getMonth() + 1).padStart(2, '0')}`;
            }
            
            // Initialize all periods to 0
            const periods = getDynamicPeriods();
            periods.forEach(period => {
              period.months.forEach(month => {
                cashFlowRow[month.key] = 0;
              });
            });
            
            // Set the monto in the target month
            if (row.monto) {
              cashFlowRow[targetMonth] = Number(row.monto) || 0;
            }
            
            return cashFlowRow;
          });
          
          setTableData(cashFlowData);
          
          // Calculate current month sum
          const currentSum = cashFlowData.reduce((sum, row) => {
            const currentValue = row[currentMonthKey] || 0;
            return sum + (Number(currentValue) || 0);
          }, 0);
          setCurrentMonthSum(currentSum);
        } else {
          setTableData([]);
          setCurrentMonthSum(0);
        }
        
      } catch (error) {
        console.error('Error fetching publicity budget data:', error);
        toast({ 
          title: 'Error al cargar datos', 
          description: 'No se pudieron cargar los datos del presupuesto de publicidad', 
          status: 'error' 
        });
        setTableData([]);
        setCurrentMonthSum(0);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [toast, currentMonthKey]);

  // Helper to get value for a cell
  const getCellValue = (row: any, monthKey: string) => {
    // The consolidated cash flow data uses direct monthKey format (YYYY_MM)
    // First try the direct monthKey
    let value = row[monthKey];
    if (value === undefined || value === null) {
      // Fallback: try with amount_ prefix (in case some data still uses that format)
      value = row[`amount_${monthKey}`];
    }
    return value ?? 0;
  };

  // Calculate totals for each column in the current period
  const getColumnTotal = (monthKey: string) => {
    return tableData.reduce((sum, row) => {
      const value = getCellValue(row, monthKey);
      return sum + (Number(value) || 0);
    }, 0);
  };



  if (isLoading) {
    return <Center h="300px"><Spinner size="xl" /></Center>;
  }

  return (
    <Box p={5}>
      <VStack spacing={5} align="stretch">
        <HStack justifyContent="space-between" alignItems="center">
          <Heading as="h1" size="lg">Flujo de Publicidad</Heading>
          <Button as={RouterLink} to="/dashboard" colorScheme="gray">Volver a Dashboard</Button>
        </HStack>
        <Text>Visualización del flujo de publicidad (últimos 3 meses y próximos 36 meses).</Text>
        <Tabs variant="enclosed" colorScheme="blue" isFitted>
          <TabList>
            {periods.map(period => (
              <Tab key={period.label}>{period.label}</Tab>
            ))}
          </TabList>
          <TabPanels>
            {periods.map(period => (
              <TabPanel key={period.label} p={0}>
                <TableContainer>
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Actividad</Th>
                        {period.months.map(m => (
                          <Th key={m.key}>{m.label}</Th>
                        ))}
                      </Tr>
                    </Thead>
                    <Tbody>
                      {tableData.map((row, rowIndex) => (
                        <Tr key={row.id || rowIndex}>
                          <Td>{row.actividad}</Td>
                          {period.months.map(m => {
                            const isCurrent = m.key === currentMonthKey;
                            const isFuture = (() => {
                              const [y, mo] = m.key.split('_');
                              const cellDate = new Date(parseInt(y), parseInt(mo) - 1);
                              return cellDate > now;
                            })();
                            const value = getCellValue(row, m.key);
                            // Marketing cash flow data is read-only, so just display the values
                            return (
                              <Td key={m.key} isNumeric>
                                {typeof value === 'number' ? value.toLocaleString('en-US', {
                                  style: 'currency',
                                  currency: 'USD',
                                  minimumFractionDigits: 2
                                }) : value}
                              </Td>
                            );
                          })}
                        </Tr>
                      ))}
                      {tableData.length === 0 && (
                        <Tr>
                          <Td colSpan={1 + period.months.length} textAlign="center">
                            No hay datos disponibles para el flujo de publicidad.
                          </Td>
                        </Tr>
                      )}
                      {tableData.length > 0 && (
                        <Tr fontWeight="bold" bg="gray.100">
                          <Td>Total</Td>
                          {period.months.map(m => (
                            <Td key={m.key} isNumeric>{getColumnTotal(m.key)}</Td>
                          ))}
                        </Tr>
                      )}
                    </Tbody>
                  </Table>
                </TableContainer>
              </TabPanel>
            ))}
          </TabPanels>
        </Tabs>
      </VStack>
    </Box>
  );
} 