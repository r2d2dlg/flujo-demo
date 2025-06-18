import { useState, useEffect } from 'react';
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
  useToast,
  Spinner,
  Text,
  HStack,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel
} from '@chakra-ui/react';
import { RepeatIcon } from '@chakra-ui/icons';
import { api } from '../api/api';

interface EstudiosPermisosViewRow {
  id: number;
  actividad: string;
  total_2024_2025: number;
  total_2025_2026: number;
  total_2026_2027: number;
  total_2027_2028: number;
  [key: string]: number | string; // For dynamic month access
}

const YEAR_PERIODS = [
  {
    label: '2024-2025',
    months: [
      '2024_04', '2024_05', '2024_06', '2024_07', '2024_08', '2024_09',
      '2024_10', '2024_11', '2024_12', '2025_01', '2025_02', '2025_03',
      '2025_04', '2025_05'
    ]
  },
  {
    label: '2025-2026',
    months: [
      '2025_06', '2025_07', '2025_08', '2025_09', '2025_10', '2025_11',
      '2025_12', '2026_01', '2026_02', '2026_03', '2026_04', '2026_05'
    ]
  },
  {
    label: '2026-2027',
    months: [
      '2026_06', '2026_07', '2026_08', '2026_09', '2026_10', '2026_11',
      '2026_12', '2027_01', '2027_02', '2027_03', '2027_04', '2027_05'
    ]
  },
  {
    label: '2027-2028',
    months: [
      '2027_06', '2027_07', '2027_08', '2027_09', '2027_10', '2027_11',
      '2027_12', '2028_01', '2028_02', '2028_03', '2028_04', '2028_05'
    ]
  }
];

const formatMonth = (monthKey: string) => {
  const [year, month] = monthKey.split('_');
  const monthNames = {
    '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril',
    '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto',
    '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre'
  };
  return `${monthNames[month]} ${year}`;
};

export default function EstudiosPermisosViewPage() {
  const [data, setData] = useState<EstudiosPermisosViewRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/estudios_disenos_permisos/view');
      setData(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return '$ 0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  if (isLoading) {
    return (
      <Box p={4} display="flex" justifyContent="center">
        <Spinner size="xl" />
      </Box>
    );
  }

  if (data.length === 0) {
    return (
      <Box p={4}>
        <Text>No hay datos disponibles</Text>
      </Box>
    );
  }

  return (
    <Box p={4}>
      <HStack justify="space-between" mb={6}>
        <Heading size="lg">Vista de Estudios, Diseños y Permisos</Heading>
        <Button
          leftIcon={<RepeatIcon />}
          onClick={fetchData}
          colorScheme="blue"
          variant="outline"
        >
          Actualizar
        </Button>
      </HStack>

      <Tabs>
        <TabList>
          {YEAR_PERIODS.map((period) => (
            <Tab key={period.label}>
              <Text fontWeight="bold">{period.label}</Text>
            </Tab>
          ))}
        </TabList>

        <TabPanels>
          {YEAR_PERIODS.map((period) => (
            <TabPanel key={period.label}>
              <TableContainer>
                <Table variant="striped" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Actividad</Th>
                      {period.months.map((month) => (
                        <Th key={month} isNumeric>
                          {formatMonth(month)}
                        </Th>
                      ))}
                      <Th isNumeric>Total</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {data.map((row) => (
                      <Tr key={`${period.label}-${row.id}`} fontWeight={row.actividad === 'Total' ? 'bold' : 'normal'}>
                        <Td>{row.actividad}</Td>
                        {period.months.map((month) => (
                          <Td key={month} isNumeric>
                            {formatCurrency(row[month] as number)}
                          </Td>
                        ))}
                        <Td isNumeric>
                          {formatCurrency(row[`total_${period.label.replace('-', '_')}`])}
                        </Td>
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
} 