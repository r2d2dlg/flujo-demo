import React, { useEffect, useState } from 'react';
import { Box, Heading, Table, Thead, Tbody, Tr, Th, Td, TableContainer, Spinner, Center, Alert, AlertIcon } from '@chakra-ui/react';
import { payrollApi } from '../../../api/api';
import { VPlanillaVariableConstruccion } from '../../../types/payrollTypes';

const PlanillaVariableConstruccionViewPage: React.FC = () => {
  const [data, setData] = useState<VPlanillaVariableConstruccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    payrollApi.getViewPlanillaVariableConstruccion()
      .then(res => setData(res.data))
      .catch(() => setError('No se pudo cargar la vista de Planilla Variable Construcción.'))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    'NOMBRE', 'RATA X H.', 'HORAS', 'ACTIVIDAD', 'EXT. 1.25', '1.5', '2.0', 'REGULAR', 'P 1.25', 'P 1.5', 'P2_0', 'S.BRUTO', 'S.S.', 'S.E.', 'I/RENTA', 'TOTAL D.', 'SAL. NETO'
  ];

  return (
    <Box p={5}>
      <Heading mb={6}>Vista Planilla Variable Construcción</Heading>
      {loading ? (
        <Center p={10}><Spinner size="xl" /></Center>
      ) : error ? (
        <Alert status="error"><AlertIcon />{error}</Alert>
      ) : (
        <TableContainer borderRadius="md" boxShadow="md" bg="white" maxW="100vw" overflowX="auto">
          <Table variant="striped" colorScheme="gray" size="sm">
            <Thead>
              <Tr>
                {columns.map(col => <Th key={col}>{col}</Th>)}
              </Tr>
            </Thead>
            <Tbody>
              {data.map((row, idx) => (
                <Tr key={row.NOMBRE + idx} fontWeight={row.NOMBRE.toLowerCase().includes('total') ? 'bold' : 'normal'}>
                  <Td>{row.NOMBRE}</Td>
                  <Td>{row['RATA X H.'] ?? ''}</Td>
                  <Td>{row.HORAS ?? ''}</Td>
                  <Td>{row.ACTIVIDAD ?? ''}</Td>
                  <Td>{row['EXT. 1.25'] ?? ''}</Td>
                  <Td>{row['1.5'] ?? ''}</Td>
                  <Td>{row['2.0'] ?? ''}</Td>
                  <Td>{row.REGULAR ?? ''}</Td>
                  <Td>{row['P 1.25'] ?? ''}</Td>
                  <Td>{row['P 1.5'] ?? ''}</Td>
                  <Td>{row.P2_0 ?? ''}</Td>
                  <Td>{row['S.BRUTO'] ?? ''}</Td>
                  <Td>{row['S.S.'] ?? ''}</Td>
                  <Td>{row['S.E.'] ?? ''}</Td>
                  <Td>{row['I/RENTA'] ?? ''}</Td>
                  <Td>{row['TOTAL D.'] ?? ''}</Td>
                  <Td>{row['SAL. NETO'] ?? ''}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default PlanillaVariableConstruccionViewPage;
