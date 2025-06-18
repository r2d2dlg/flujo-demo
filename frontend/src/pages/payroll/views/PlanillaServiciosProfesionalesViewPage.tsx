import React, { useEffect, useState } from 'react';
import { Box, Heading, Table, Thead, Tbody, Tr, Th, Td, TableContainer, Spinner, Center, Alert, AlertIcon } from '@chakra-ui/react';
import { payrollApi } from '../../../api/api';
import { VPlanillaServicioProfesionales } from '../../../types/payrollTypes';

const PlanillaServiciosProfesionalesViewPage: React.FC = () => {
  const [data, setData] = useState<VPlanillaServicioProfesionales[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    payrollApi.getViewPlanillaServicioProfesionales()
      .then(res => setData(res.data))
      .catch(() => setError('No se pudo cargar la vista de Planilla Servicios Profesionales.'))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    'NOMBRE', 'SALARIO QUINCENAL', 'HRAS. XTRAS', 'OTROS SALARIOS', 'DESCUENTOS', 'NETO', 'OBSERVACIONES'
  ];

  return (
    <Box p={5}>
      <Heading mb={6}>Vista Planilla Servicios Profesionales</Heading>
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
                  <Td>{row['SALARIO QUINCENAL'] ?? ''}</Td>
                  <Td>{row['HRAS. XTRAS'] ?? ''}</Td>
                  <Td>{row['OTROS SALARIOS'] ?? ''}</Td>
                  <Td>{row.DESCUENTOS ?? ''}</Td>
                  <Td>{row.NETO ?? ''}</Td>
                  <Td>{row.OBSERVACIONES ?? ''}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default PlanillaServiciosProfesionalesViewPage; 