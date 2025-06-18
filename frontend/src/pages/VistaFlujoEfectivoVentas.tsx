import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  Alert,
  AlertIcon,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Flex,
} from '@chakra-ui/react';
// import { getToken } from '../context/AuthContext'; // Assuming you have a way to get the auth token

interface CashFlowMonthData {
  [monthYear: string]: number | null; // e.g., "2023-01": 1000
}

interface SalesCashFlowItem {
  actividad: string;
  meses: CashFlowMonthData;
  total_anual: number | null;
  grp?: string | null; // For styling totals or group headers
  grp_order?: number | null;
}

interface SalesCashFlowResponseAPI {
  data: SalesCashFlowItem[];
  year: number;
}

// Utility to generate months from prev 3 to next 36
function getDynamicMonthPeriods() {
  const now = new Date();
  // Set to first day of current month
  now.setDate(1);
  // Start: 3 months before current month
  const start = new Date(now);
  start.setMonth(start.getMonth() - 3);
  // End: 36 months after current month
  const end = new Date(now);
  end.setMonth(end.getMonth() + 36);

  const months: { key: string; label: string; year: number }[] = [];
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  let d = new Date(start);
  while (d <= end) {
    const year = d.getFullYear();
    const month = d.getMonth();
    const key = `${year}-${(month + 1).toString().padStart(2, '0')}`;
    const label = `${monthNames[month]} ${year}`;
    months.push({ key, label, year });
    d.setMonth(d.getMonth() + 1);
  }
  // Group into 12-month periods for tabs
  const periods: { label: string; months: typeof months }[] = [];
  for (let i = 0; i < months.length; i += 12) {
    const periodMonths = months.slice(i, i + 12);
    if (periodMonths.length > 0) {
      const label = `${periodMonths[0].label.split(' ')[1]}-${periodMonths[periodMonths.length - 1].label.split(' ')[1]}`;
      periods.push({ label, months: periodMonths });
    }
  }
  return periods;
}

const VistaFlujoEfectivoVentas: React.FC = () => {
  const [cashFlowData, setCashFlowData] = useState<SalesCashFlowItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const tableBg = useColorModeValue('white', 'gray.700');
  const headerBg = useColorModeValue('gray.100', 'gray.600');
  const totalRowBg = useColorModeValue('gray.200', 'gray.500');
  const grandTotalRowBg = useColorModeValue('yellow.100', 'yellow.700');

  const periods = getDynamicMonthPeriods();

  // Fetch all data at once (API returns all months)
  const fetchCashFlowData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Autenticación requerida.');
      setIsLoading(false);
      return;
    }
    try {
      // Use current year for endpoint, but we want all months
      const response = await fetch(`http://localhost:8000/api/proyeccion-ventas/cash-flow/${new Date().getFullYear()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Error desconocido al cargar datos de flujo de efectivo.' }));
        throw new Error(errorData.detail || `Error ${response.status}`);
      }
      const data: SalesCashFlowResponseAPI = await response.json();
      setCashFlowData(data.data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocurrió un error inesperado.');
      }
      setCashFlowData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCashFlowData();
  }, [fetchCashFlowData]);

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || typeof value === 'undefined') return '-';
    return value.toLocaleString('es-ES', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <Box p={5}>
      <Heading mb={6}>Vista de Proyección de Flujo de Efectivo Ventas</Heading>
      {isLoading && <Spinner size="xl" />}
      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
      )}
      {!isLoading && !error && cashFlowData.length === 0 && (
        <Alert status="info" mb={4}>
          <AlertIcon />
          No hay datos de flujo de efectivo disponibles.
        </Alert>
      )}
      {!isLoading && !error && cashFlowData.length > 0 && (
        <Tabs variant="enclosed" colorScheme="blue" isFitted>
          <TabList>
            {periods.map((period, idx) => (
              <Tab key={period.label}>{period.label}</Tab>
            ))}
          </TabList>
          <TabPanels>
            {periods.map((period, idx) => (
              <TabPanel key={period.label} p={0}>
                <Box overflowX="auto">
                  <Table variant="simple" bg={tableBg} size="sm">
                    <Thead bg={headerBg}>
                      <Tr>
                        <Th>Actividad</Th>
                        {period.months.map(month => <Th key={month.key} isNumeric>{month.label}</Th>)}
                      </Tr>
                    </Thead>
                    <Tbody>
                      {cashFlowData.map((item, index) => {
                        let rowStyle = {};
                        if (item.actividad?.toLowerCase().includes('total') && !item.actividad?.toLowerCase().includes('gran total')) {
                          rowStyle = { fontWeight: 'bold', backgroundColor: totalRowBg };
                        }
                        if (item.actividad?.toLowerCase().includes('gran total')) {
                          rowStyle = { fontWeight: 'bold', backgroundColor: grandTotalRowBg };
                        }
                        return (
                          <Tr key={`${item.actividad}-${index}`} style={rowStyle}>
                            <Td>{item.actividad}</Td>
                            {period.months.map(month => (
                              <Td key={month.key} isNumeric>
                                {formatCurrency(item.meses[month.key])}
                              </Td>
                            ))}
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </Box>
              </TabPanel>
            ))}
          </TabPanels>
        </Tabs>
      )}
    </Box>
  );
};

export default VistaFlujoEfectivoVentas; 