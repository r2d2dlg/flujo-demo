import React, { useEffect, useState, useMemo } from 'react';
import { Box, Heading, Text, Table, Thead, Tbody, Tr, Th, Td, TableContainer, Spinner, Tabs, TabList, TabPanels, Tab, TabPanel, useToast } from '@chakra-ui/react';
import { api } from '../api/api';

// Helper to generate dynamic periods: 3 months before + current + 36 months forward, grouped by 12
function generateDynamicPeriods() {
  const now = new Date();
  const months: string[] = [];
  // Previous 3 months
  for (let i = 3; i > 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${date.getFullYear()}_${String(date.getMonth() + 1).padStart(2, '0')}`);
  }
  // Current + next 36 months
  for (let i = 0; i < 37; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    months.push(`${date.getFullYear()}_${String(date.getMonth() + 1).padStart(2, '0')}`);
  }
  // Group by 12
  const periods = [];
  for (let i = 0; i < months.length; i += 12) {
    periods.push({
      label: `${formatMonth(months[i])} - ${formatMonth(months[Math.min(i+11, months.length-1)])}`,
      months: months.slice(i, i+12)
    });
  }
  return periods;
}

const formatMonth = (monthKey: string) => {
  const [year, month] = monthKey.split('_');
  const monthNames: { [key: string]: string } = {
    '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril',
    '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto',
    '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre'
  };
  return `${monthNames[month]} ${year}`;
};

const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return '$ 0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const EgresosPreliminaresPage: React.FC = () => {
  const [pagosTierra, setPagosTierra] = useState<any[]>([]);
  const [estudiosPermisos, setEstudiosPermisos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const periods = useMemo(() => generateDynamicPeriods(), []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [pagosRes, estudiosRes] = await Promise.all([
          api.get('/api/pagos_tierra/view'),
          api.get('/api/estudios_disenos_permisos/view'),
        ]);
        setPagosTierra(pagosRes.data || []);
        setEstudiosPermisos(estudiosRes.data || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Error al cargar los datos');
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los datos de egresos preliminares',
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

  const sumByMonth = (data: any[], months: string[]) => {
    return months.map(month => {
      return data.reduce((sum, row) => sum + (Number(row[month]) || 0), 0);
    });
  };

  const sumTotal = (data: any[], months: string[]) => {
    return sumByMonth(data, months).reduce((a, b) => a + b, 0);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
        <Spinner size="xl" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={5}>
        <Text color="red.500">{error}</Text>
      </Box>
    );
  }

  return (
    <Box p={5}>
      <Heading as="h1" size="xl" mb={2}>
        Egresos Preliminares
      </Heading>
      <Text fontSize="lg" mb={8}>
        Pagos a terreno y estudios, diseños y permisos.
      </Text>
      <Tabs>
        <TabList>
          {periods.map((period) => (
            <Tab key={period.label} fontWeight="bold">{period.label}</Tab>
          ))}
        </TabList>
        <TabPanels>
          {periods.map((period) => (
            <TabPanel key={period.label}>
              <TableContainer>
                <Table variant="striped" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Concepto</Th>
                      {period.months.map((month) => (
                        <Th key={month} isNumeric>{formatMonth(month)}</Th>
                      ))}
                      <Th isNumeric>Total</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {/* EGRESOS PRELIMINARES */}
                    <Tr bg="blue.50">
                      <Td fontWeight="bold" color="blue.700">EGRESOS PRELIMINARES</Td>
                      {period.months.map((month) => (
                        <Td key={month} isNumeric></Td>
                      ))}
                      <Td isNumeric></Td>
                    </Tr>
                    
                    <Tr>
                      <Td pl={6}>Pagos a Terreno</Td>
                      {period.months.map((month, i) => {
                        const value = sumByMonth(pagosTierra, [month])[0] || 0;
                        return (
                          <Td key={i} isNumeric>{value > 0 ? formatCurrency(value) : ''}</Td>
                        );
                      })}
                      <Td isNumeric>{formatCurrency(
                        period.months.reduce((sum, month) => {
                          return sum + (sumByMonth(pagosTierra, [month])[0] || 0);
                        }, 0)
                      )}</Td>
                    </Tr>
                    
                    <Tr>
                      <Td pl={6}>Estudios, Diseños y Permisos</Td>
                      {period.months.map((month, i) => {
                        const value = sumByMonth(estudiosPermisos, [month])[0] || 0;
                        return (
                          <Td key={i} isNumeric>{value > 0 ? formatCurrency(value) : ''}</Td>
                        );
                      })}
                      <Td isNumeric>{formatCurrency(
                        period.months.reduce((sum, month) => {
                          return sum + (sumByMonth(estudiosPermisos, [month])[0] || 0);
                        }, 0)
                      )}</Td>
                    </Tr>

                    {/* SUBTOTAL EGRESOS PRELIMINARES */}
                    <Tr bg="blue.100">
                      <Td fontWeight="bold" color="blue.700">SUBTOTAL EGRESOS PRELIMINARES</Td>
                      {period.months.map((month, i) => {
                        const pagosTierraValue = sumByMonth(pagosTierra, [month])[0] || 0;
                        const estudiosValue = sumByMonth(estudiosPermisos, [month])[0] || 0;
                        const subtotal = pagosTierraValue + estudiosValue;
                        return (
                          <Td key={i} fontWeight="bold" fontSize="md" color="blue.700" isNumeric>
                            {formatCurrency(subtotal)}
                          </Td>
                        );
                      })}
                      <Td fontWeight="bold" fontSize="md" color="blue.700" isNumeric>
                        {formatCurrency(
                          period.months.reduce((sum, month) => {
                            const pagosTierraValue = sumByMonth(pagosTierra, [month])[0] || 0;
                            const estudiosValue = sumByMonth(estudiosPermisos, [month])[0] || 0;
                            return sum + pagosTierraValue + estudiosValue;
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

export default EgresosPreliminaresPage; 