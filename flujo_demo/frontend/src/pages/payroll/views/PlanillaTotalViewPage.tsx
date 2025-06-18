import React, { useEffect, useState } from 'react';
import { Box, Heading, Table, Thead, Tbody, Tr, Th, Td, TableContainer, Spinner, Center, Alert, AlertIcon } from '@chakra-ui/react';
import { payrollApi } from '../../../api/api';
import { VPlanillaTotal } from '../../../types/payrollTypes';

const PlanillaTotalViewPage: React.FC = () => {
  const [data, setData] = useState<VPlanillaTotal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    payrollApi.getViewPlanillaTotal()
      .then(res => setData(res.data))
      .catch(() => setError('No se pudo cargar la vista de Planilla Total.'))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    'NOMBRE', 'TOTAL'
  ];

  return (
    <Box p={5}>
      <Heading mb={6}>Vista Planilla Total</Heading>
      {loading ? (
        <Center p={10}><Spinner size="xl" /></Center>
      ) : error ? (
        <Alert status="error"><AlertIcon />{error}</Alert>
      ) : (
        <TableContainer borderRadius="md" boxShadow="md" bg="white">
          <Table variant="striped" colorScheme="gray">
            <Thead>
              <Tr>
                {columns.map(col => <Th key={col}>{col}</Th>)}
              </Tr>
            </Thead>
            <Tbody>
              {data.map((row, idx) => (
                <Tr key={row.NOMBRE + idx} fontWeight={row.NOMBRE.toLowerCase().includes('total') ? 'bold' : 'normal'}>
                  <Td>{row.NOMBRE}</Td>
                  <Td>{row.TOTAL ?? ''}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default PlanillaTotalViewPage; 