import { useState, useEffect } from 'react';
import {
  Box, Heading, Table, Thead, Tbody, Tr, Th, Td, TableContainer, useToast, Spinner, Center
} from '@chakra-ui/react';
import { payrollApi } from '../../../api/api';
import { VPlanillaServicioProfesionales } from '../../../types/payrollTypes';

export default function PlanillaServicioProfesionalesViewPage() {
  const [data, setData] = useState<VPlanillaServicioProfesionales[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  const columns = [
    { Header: 'NOMBRE', accessor: 'NOMBRE' as keyof VPlanillaServicioProfesionales },
    { Header: 'SALARIO QUINCENAL', accessor: 'SALARIO QUINCENAL' as keyof VPlanillaServicioProfesionales },
    { Header: 'HRAS. XTRAS', accessor: 'HRAS. XTRAS' as keyof VPlanillaServicioProfesionales },
    { Header: 'OTROS SALARIOS', accessor: 'OTROS SALARIOS' as keyof VPlanillaServicioProfesionales },
    { Header: 'DESCUENTOS', accessor: 'DESCUENTOS' as keyof VPlanillaServicioProfesionales },
    { Header: 'NETO', accessor: 'NETO' as keyof VPlanillaServicioProfesionales },
    { Header: 'OBSERVACIONES', accessor: 'OBSERVACIONES' as keyof VPlanillaServicioProfesionales },
  ];

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await payrollApi.getViewPlanillaServicioProfesionales();
      setData(response.data || []);
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo cargar la vista Planilla Servicios Profesionales.', status: 'error', duration: 5000, isClosable: true });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (isLoading) return <Center p={10}><Spinner size="xl" /></Center>;

  return (
    <Box p={4} overflowX="auto">
      <Heading as="h1" size="lg" mb={6}>Vista: Planilla Servicios Profesionales</Heading>
      <TableContainer>
        <Table variant="striped" size="sm">
          <Thead>
            <Tr>
              {columns.map(col => <Th key={col.Header} whiteSpace="nowrap">{col.Header}</Th>)}
            </Tr>
          </Thead>
          <Tbody>
            {data.map((row, rowIndex) => (
              <Tr key={row.NOMBRE + '-' + rowIndex}>
                {columns.map(col => (
                  <Td key={`${col.accessor}-${rowIndex}`} whiteSpace="nowrap">
                    {String(row[col.accessor] ?? '')}
                  </Td>
                ))}
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
} 