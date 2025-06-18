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
  Center,
  Spinner,
  Text
} from '@chakra-ui/react';
import { consultoresApi } from '../../api/api';
import { VCostoConsultores } from '../../types/consultoresTypes';
import { format, subMonths, addMonths } from 'date-fns';

export default function ConsultoresViewPage() {
  const [costoConsultores, setCostoConsultores] = useState<VCostoConsultores[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const startDate = format(subMonths(new Date(), 3), 'yyyy-MM-dd');
      const endDate = format(addMonths(new Date(), 12), 'yyyy-MM-dd');
      const response = await consultoresApi.getVCostoConsultores(startDate, endDate);
      setCostoConsultores(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error fetching data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  // Group costs by month
  const costsByMonth = costoConsultores.reduce((acc, curr) => {
    const month = format(new Date(curr.Mes), 'yyyy-MM');
    if (!acc[month]) {
      acc[month] = {};
    }
    acc[month][curr.Consultor] = curr.Costo;
    return acc;
  }, {} as Record<string, Record<string, number>>);

  // Get unique consultores (excluding 'Total')
  const consultores = Array.from(new Set(
    costoConsultores
      .filter(c => c.Consultor !== 'Total')
      .map(c => c.Consultor)
  )).sort();

  // Get months in order
  const months = Object.keys(costsByMonth).sort();

  return (
    <Box p={4}>
      <Heading size="lg" mb={6}>Vista de Costos de Consultores</Heading>
      <TableContainer>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Consultor</Th>
              {months.map(month => (
                <Th key={month}>{format(new Date(month), 'MMM yyyy')}</Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {consultores.map(consultor => (
              <Tr key={consultor}>
                <Td>{consultor}</Td>
                {months.map(month => (
                  <Td key={`${consultor}-${month}`}>
                    {costsByMonth[month][consultor]?.toFixed(2) || '0.00'}
                  </Td>
                ))}
              </Tr>
            ))}
            <Tr fontWeight="bold" bg="gray.100">
              <Td>Total</Td>
              {months.map(month => (
                <Td key={`total-${month}`}>
                  {costsByMonth[month]['Total']?.toFixed(2) || '0.00'}
                </Td>
              ))}
            </Tr>
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
} 