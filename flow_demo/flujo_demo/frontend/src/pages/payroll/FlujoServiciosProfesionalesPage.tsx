import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
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
  Spinner,
  IconButton,
  useToast,
  NumberInput,
  NumberInputField,
  Tooltip,
  Text
} from '@chakra-ui/react';
import { EditIcon, CheckIcon, CloseIcon } from '@chakra-ui/icons';
import { api } from '../../api/api';
import { formatCurrency } from '../../utils/formatters';

// Dynamic period logic (3 months before, 36 after current month)
const getDynamicPeriods = () => {
  const now = new Date();
  const months: string[] = [];
  const start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  for (let i = 0; i < 39; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    months.push(`${d.getFullYear()}_${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  // Group by 12 months per tab
  const periods = [];
  for (let i = 0; i < months.length; i += 12) {
    periods.push(months.slice(i, i + 12));
  }
  return periods;
};

const formatMonth = (monthKey: string) => {
  const [year, month] = monthKey.split('_');
  const monthNames: { [key: string]: string } = {
    '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril',
    '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto',
    '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre'
  };
  return `${monthNames[month]} ${year}`;
};

const dynamicPeriods = getDynamicPeriods();

const FlujoServiciosProfesionalesPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [serviciosProfesionales, setServiciosProfesionales] = useState<any[]>([]);
  const [editingCell, setEditingCell] = useState<{month: string, value: number} | null>(null);
  const toast = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await api.get('/api/payroll/flujo/planilla-servicio-profesionales');
        setServiciosProfesionales(response.data);
      } catch (error) {
        toast({
          title: 'Error al cargar datos',
          description: 'No se pudieron cargar los datos del flujo de servicios profesionales',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [toast]);

  const getValue = (data: any[], month: string) => {
    const item = data.find(d => d.month === month);
    return item ? item.monto : 0;
  };

  const getTotal = (data: any[]) => {
    return data.reduce((sum, item) => sum + item.monto, 0);
  };

  const handleEdit = (month: string, currentValue: number) => {
    setEditingCell({ month, value: currentValue });
  };

  const handleSave = async () => {
    if (!editingCell) return;
    
    try {
      await api.put(`/api/payroll/flujo/planilla-servicio-profesionales/${editingCell.month}`, 
        editingCell.value
      );
      
      // Update local state
      setServiciosProfesionales(prev => 
        prev.map(item => 
          item.month === editingCell.month 
            ? { ...item, monto: editingCell.value }
            : item
        )
      );
      
      setEditingCell(null);
      toast({
        title: 'Éxito',
        description: 'Valor actualizado correctamente',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el valor',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleCancel = () => {
    setEditingCell(null);
  };

  const renderCell = (month: string, value: number) => {
    const isEditing = editingCell?.month === month;
    
    if (isEditing) {
      return (
        <Td isNumeric>
          <NumberInput
            size="sm"
            value={editingCell.value}
            onChange={(_, valueAsNumber) => 
              setEditingCell(prev => prev ? { ...prev, value: valueAsNumber || 0 } : null)
            }
            precision={2}
            step={0.01}
          >
            <NumberInputField />
          </NumberInput>
          <Box mt={1}>
            <IconButton
              aria-label="Guardar"
              icon={<CheckIcon />}
              size="xs"
              colorScheme="green"
              mr={1}
              onClick={handleSave}
            />
            <IconButton
              aria-label="Cancelar"
              icon={<CloseIcon />}
              size="xs"
              colorScheme="red"
              onClick={handleCancel}
            />
          </Box>
        </Td>
      );
    }

    return (
      <Td isNumeric>
        <Box display="flex" alignItems="center" justifyContent="flex-end">
          <Text>{formatCurrency(value)}</Text>
          <Tooltip label="Editar valor">
            <IconButton
              aria-label="Editar"
              icon={<EditIcon />}
              size="xs"
              variant="ghost"
              ml={2}
              onClick={() => handleEdit(month, value)}
            />
          </Tooltip>
        </Box>
      </Td>
    );
  };

  if (loading) {
    return (
      <Box p={5} display="flex" justifyContent="center">
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <Box p={5}>
      <Heading mb={6}>Flujo de Caja - Servicios Profesionales y Consultorias</Heading>
      <Text mb={4} color="gray.600">
        Proyección de flujo de efectivo para servicios profesionales y consultorias. 
        Los valores se basan en el salario quincenal multiplicado por 2 (salario mensual).
        Haga clic en el ícono de edición para modificar los valores futuros.
      </Text>
      
      <Tabs>
        <TabList>
          {dynamicPeriods.map((_, idx) => {
            const startMonth = dynamicPeriods[idx][0];
            const endMonth = dynamicPeriods[idx][dynamicPeriods[idx].length - 1];
            const startYear = startMonth.split('_')[0];
            const endYear = endMonth.split('_')[0];
            const label = startYear === endYear ? startYear : `${startYear}-${endYear}`;
            return (
              <Tab key={idx}>{label}</Tab>
            );
          })}
        </TabList>
        <TabPanels>
          {dynamicPeriods.map((months, idx) => (
            <TabPanel key={idx}>
              <TableContainer>
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Concepto</Th>
                      {months.map(m => <Th key={m} isNumeric>{formatMonth(m)}</Th>)}
                      <Th isNumeric>Total</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    <Tr>
                      <Td fontWeight="bold">Servicios Profesionales y Consultorias</Td>
                      {months.map(month => renderCell(month, getValue(serviciosProfesionales, month)))}
                      <Td isNumeric fontWeight="bold">
                        {formatCurrency(
                          months.reduce((sum, month) => sum + getValue(serviciosProfesionales, month), 0)
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

export default FlujoServiciosProfesionalesPage; 