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
import { API_BASE_URL } from '../../api/api';
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
      const response = await fetch(`${API_BASE_URL}/api/proyeccion-ventas/cash-flow/${new Date().getFullYear()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true',
        },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Error desconocido al cargar datos de flujo de efectivo.' }));
        throw new Error(errorData.detail || `Error ${response.status}`);
      }
      const result: SalesCashFlowResponseAPI = await response.json();
      setCashFlowData(result.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCashFlowData();
  }, [fetchCashFlowData]);

  if (isLoading) {
    return <Spinner />;
  }

  if (error) {
    return <Alert status="error"><AlertIcon />{error}</Alert>;
  }

  return (
    <Box p={5}>
      <Heading mb={5}>Flujo de Efectivo de Ventas</Heading>
      <Tabs>
        <TabList>
          {periods.map(p => <Tab key={p.label}>{p.label}</Tab>)}
        </TabList>
        <TabPanels>
          {periods.map(p => (
            <TabPanel key={p.label}>
              <TableContainer>
                <Table variant="simple" bg={tableBg}>
                  <Thead>
                    <Tr bg={headerBg}>
                      <Th>Actividad</Th>
                      {p.months.map(m => <Th key={m.key}>{m.label}</Th>)}
                      <Th>Total Anual</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {cashFlowData.map((item, index) => (
                      <Tr 
                        key={index} 
                        bg={item.grp === 'TOTAL' ? totalRowBg : item.grp === 'GRAND TOTAL' ? grandTotalRowBg : undefined}
                        fontWeight={item.grp ? 'bold' : 'normal'}
                      >
                        <Td>{item.actividad}</Td>
                        {p.months.map(m => (
                          <Td key={m.key}>{item.meses[m.key]?.toLocaleString() || '0'}</Td>
                        ))}
                        <Td>{item.total_anual?.toLocaleString() || '0'}</Td>
                      </Tr>
                    ))}
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

export default VistaFlujoEfectivoVentas;