import { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Spinner,
  Alert,
  AlertIcon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Center,
} from '@chakra-ui/react';
import { marketingSummaryApi } from '../api/api';

interface ConsolidatedData {
  data: any[];
  periods: { key: string; label: string }[];
  period_groups: { label: string; periods: { key: string; label: string }[] }[];
  columns: string[];
}

const formatCurrency = (value: number | null | undefined) => {
  if (value === null || typeof value === 'undefined') return '-';
  return value.toLocaleString('es-PA', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function CashFlows() {
  const [consolidated, setConsolidated] = useState<ConsolidatedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchConsolidatedData() {
      setLoading(true);
      setError(null);
      try {
        const response = await marketingSummaryApi.getConsolidatedCashFlow();
        setConsolidated(response.data);
      } catch (err: any) {
        console.error('Error fetching consolidated marketing cash flow:', err);
        setError('Error al cargar los datos consolidados de marketing');
      } finally {
        setLoading(false);
      }
    }
    fetchConsolidatedData();
  }, []);

  if (loading) {
    return (
      <Center h="200px">
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }

  if (error) {
    return (
      <Alert status="error" mb={4}><AlertIcon />{error}</Alert>
    );
  }

  if (!consolidated || !consolidated.data || consolidated.data.length === 0) {
    return (
      <Alert status="info" mb={4}><AlertIcon />No hay datos consolidados disponibles.</Alert>
    );
  }

  return (
    <Box p={5}>
      <Heading mb={8}>Flujo de Caja Marketing (Todos los Proyectos)</Heading>
      <Tabs variant="enclosed" colorScheme="blue" isFitted>
        <TabList>
          <Tab key="consolidado">CONSOLIDADO</Tab>
        </TabList>
        <TabPanels>
          <TabPanel key="consolidado">
            {consolidated.period_groups && consolidated.period_groups.length > 0 ? (
              <Tabs variant="soft-rounded" colorScheme="teal" isFitted>
                <TabList>
                  {consolidated.period_groups.map((group, idx) => (
                    <Tab key={group.label}>{group.label}</Tab>
                  ))}
                </TabList>
                <TabPanels>
                  {consolidated.period_groups.map((group, idx) => (
                    <TabPanel key={group.label} p={0}>
                      <TableContainer>
                        <Table variant="simple" size="sm">
                          <Thead>
                            <Tr>
                              <Th>Actividad</Th>
                              {group.periods.map(period => (
                                <Th key={period.key} isNumeric>{period.label}</Th>
                              ))}
                            </Tr>
                          </Thead>
                          <Tbody>
                            {consolidated.data.map((row, idx) => (
                              <Tr 
                                key={idx}
                                fontWeight={row.actividad === 'TOTAL' ? 'bold' : 'normal'}
                                bg={row.actividad === 'TOTAL' ? 'gray.100' : 'white'}
                              >
                                <Td>{row.actividad}</Td>
                                {group.periods.map(period => (
                                  <Td key={period.key} isNumeric>
                                    {formatCurrency(row[period.key])}
                                  </Td>
                                ))}
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </TableContainer>
                    </TabPanel>
                  ))}
                </TabPanels>
              </Tabs>
            ) : (
              <Alert status="info" mb={4}><AlertIcon />No hay períodos disponibles.</Alert>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}
