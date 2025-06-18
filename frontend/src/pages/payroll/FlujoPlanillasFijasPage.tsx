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
  Tooltip
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
  const monthNames = {
    '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril',
    '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto',
    '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre'
  };
  return `${monthNames[month]} ${year}`;
};

const dynamicPeriods = getDynamicPeriods();

const FlujoPlanillasFijasPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [planillaAdministracion, setPlanillaAdministracion] = useState<any[]>([]);
  const [planillaFijaConstruccion, setPlanillaFijaConstruccion] = useState<any[]>([]);
  const [planillaGerencial, setPlanillaGerencial] = useState<any[]>([]);
  const [planillaServicioProfesionales, setPlanillaServicioProfesionales] = useState<any[]>([]);
  const [editingCell, setEditingCell] = useState<{row: string, month: string, value: number} | null>(null);
  const toast = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [adminRes, fijaRes, gerencialRes, serviciosRes] = await Promise.all([
          api.get('/api/payroll/flujo/planilla-administracion'),
          api.get('/api/payroll/flujo/planilla-fija-construccion'),
          api.get('/api/payroll/flujo/planilla-gerencial'),
          api.get('/api/payroll/flujo/planilla-servicio-profesionales')
        ]);
        setPlanillaAdministracion(adminRes.data);
        setPlanillaFijaConstruccion(fijaRes.data);
        setPlanillaGerencial(gerencialRes.data);
        setPlanillaServicioProfesionales(serviciosRes.data);
      } catch (error) {
        toast({
          title: 'Error al cargar datos',
          description: 'No se pudieron cargar los datos del flujo de planillas',
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

  const handleEdit = (row: string, month: string, currentValue: number) => {
    const now = new Date();
    const [year, monthStr] = month.split('_');
    const cellDate = new Date(parseInt(year), parseInt(monthStr) - 1);
    
    // Only allow editing future months
    if (cellDate <= now) {
      toast({
        title: 'No se puede editar',
        description: 'Solo se pueden editar valores futuros',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setEditingCell({ row, month, value: currentValue });
  };

  const handleSave = async () => {
    if (!editingCell) return;

    try {
      const { row, month, value } = editingCell;
      const endpoint = `/api/payroll/flujo/${row}/${month}`;
      await api.put(endpoint, { monto: value });
      
      // Update local state based on which planilla was edited
      const updateState = (prevData: any[]) => {
        return prevData.map(item => {
          if (item.month === month) {
            return { ...item, monto: value };
          }
          return item;
        });
      };

      switch (row) {
        case 'planilla-administracion':
          setPlanillaAdministracion(prev => updateState(prev));
          break;
        case 'planilla-fija-construccion':
          setPlanillaFijaConstruccion(prev => updateState(prev));
          break;
        case 'planilla-gerencial':
          setPlanillaGerencial(prev => updateState(prev));
          break;
        case 'planilla-servicio-profesionales':
          setPlanillaServicioProfesionales(prev => updateState(prev));
          break;
      }

      toast({
        title: 'Cambios guardados',
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: 'Error al guardar',
        description: 'No se pudieron guardar los cambios',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setEditingCell(null);
    }
  };

  const getValue = (data: any[], month: string) => {
    return data.find(item => item.month === month)?.monto || 0;
  };

  const getTotal = (data: any[]) => {
    return data.reduce((sum, item) => sum + (item.monto || 0), 0);
  };

  const renderCell = (row: string, month: string, value: number) => {
    const isEditing = editingCell?.row === row && editingCell?.month === month;
    const now = new Date();
    const [year, monthStr] = month.split('_');
    const cellDate = new Date(parseInt(year), parseInt(monthStr) - 1);
    const isFuture = cellDate > now;

    if (isEditing) {
      return (
        <Td key={month}>
          <Box display="flex" alignItems="center" gap={2}>
            <NumberInput
              defaultValue={value}
              onChange={(_, val) => setEditingCell(prev => prev ? { ...prev, value: val } : null)}
              size="sm"
            >
              <NumberInputField />
            </NumberInput>
            <IconButton
              aria-label="Save"
              icon={<CheckIcon />}
              size="sm"
              colorScheme="green"
              onClick={handleSave}
            />
            <IconButton
              aria-label="Cancel"
              icon={<CloseIcon />}
              size="sm"
              colorScheme="red"
              onClick={() => setEditingCell(null)}
            />
          </Box>
        </Td>
      );
    }

    return (
      <Td key={month} isNumeric>
        <Box display="flex" alignItems="center" justifyContent="flex-end" gap={2}>
          {formatCurrency(value)}
          {isFuture && (
            <Tooltip label="Editar valor futuro">
              <IconButton
                aria-label="Edit"
                icon={<EditIcon />}
                size="xs"
                variant="ghost"
                onClick={() => handleEdit(row, month, value)}
              />
            </Tooltip>
          )}
        </Box>
      </Td>
    );
  };

  if (loading) {
    return (
      <Box p={4} display="flex" justifyContent="center">
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <Box p={5}>
      <Heading mb={6}>Flujo Planillas Fijas</Heading>
      <Tabs>
        <TabList>
          {dynamicPeriods.map((_, idx) => (
            <Tab key={idx}>Periodo {idx + 1}</Tab>
          ))}
        </TabList>
        <TabPanels>
          {dynamicPeriods.map((months, idx) => (
            <TabPanel key={idx}>
              <TableContainer>
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Planilla</Th>
                      {months.map(m => <Th key={m}>{formatMonth(m)}</Th>)}
                      <Th>Total</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    <Tr>
                      <Td fontWeight="bold">Planilla Administración</Td>
                      {months.map(month => renderCell('planilla-administracion', month, getValue(planillaAdministracion, month)))}
                      <Td isNumeric fontWeight="bold">{formatCurrency(getTotal(planillaAdministracion))}</Td>
                    </Tr>
                    <Tr>
                      <Td fontWeight="bold">Planilla Fija Construcción</Td>
                      {months.map(month => renderCell('planilla-fija-construccion', month, getValue(planillaFijaConstruccion, month)))}
                      <Td isNumeric fontWeight="bold">{formatCurrency(getTotal(planillaFijaConstruccion))}</Td>
                    </Tr>
                    <Tr>
                      <Td fontWeight="bold">Planilla Gerencial</Td>
                      {months.map(month => renderCell('planilla-gerencial', month, getValue(planillaGerencial, month)))}
                      <Td isNumeric fontWeight="bold">{formatCurrency(getTotal(planillaGerencial))}</Td>
                    </Tr>
                    <Tr>
                      <Td fontWeight="bold">Planilla Servicios Profesionales</Td>
                      {months.map(month => renderCell('planilla-servicio-profesionales', month, getValue(planillaServicioProfesionales, month)))}
                      <Td isNumeric fontWeight="bold">{formatCurrency(getTotal(planillaServicioProfesionales))}</Td>
                    </Tr>
                    <Tr>
                      <Td fontWeight="bold">Total Planillas Fijas</Td>
                      {months.map(month => {
                        const total = 
                          getValue(planillaAdministracion, month) +
                          getValue(planillaFijaConstruccion, month) +
                          getValue(planillaGerencial, month) +
                          getValue(planillaServicioProfesionales, month);
                        return <Td key={month} isNumeric fontWeight="bold">{formatCurrency(total)}</Td>;
                      })}
                      <Td isNumeric fontWeight="bold">
                        {formatCurrency(
                          getTotal(planillaAdministracion) +
                          getTotal(planillaFijaConstruccion) +
                          getTotal(planillaGerencial) +
                          getTotal(planillaServicioProfesionales)
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

export default FlujoPlanillasFijasPage; 