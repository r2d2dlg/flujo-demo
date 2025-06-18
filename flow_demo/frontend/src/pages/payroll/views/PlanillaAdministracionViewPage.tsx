import React, { useEffect, useState } from 'react';
import { Box, Heading, Table, Thead, Tbody, Tr, Th, Td, TableContainer, Spinner, Center, Alert, AlertIcon } from '@chakra-ui/react';
import { payrollApi } from '../../../api/api';
import { VPlanillaAdministracion } from '../../../types/payrollTypes';

const PlanillaAdministracionViewPage: React.FC = () => {
  const [data, setData] = useState<VPlanillaAdministracion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    payrollApi.getViewPlanillaAdministracion()
      .then(res => setData(res.data))
      .catch(() => setError('No se pudo cargar la vista de Planilla Administración.'))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    'NOMBRE', 'Horas', 'Sal. Bruto', 'S.S.', 'S.E.', 'I.S.R.', 'Otros Desc.', 'Total', 'Sal. Neto'
  ];

  return (
    <Box p={5}>
      <Heading mb={6}>Vista Planilla Administración</Heading>
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
                  <Td>{row.Horas ?? ''}</Td>
                  <Td>{row['Sal. Bruto'] ?? ''}</Td>
                  <Td>{row['S.S.'] ?? ''}</Td>
                  <Td>{row['S.E.'] ?? ''}</Td>
                  <Td>{row['I.S.R.'] ?? ''}</Td>
                  <Td>{row['Otros Desc.'] ?? ''}</Td>
                  <Td>{row.Total ?? ''}</Td>
                  <Td>{row['Sal. Neto'] ?? ''}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default PlanillaAdministracionViewPage;
