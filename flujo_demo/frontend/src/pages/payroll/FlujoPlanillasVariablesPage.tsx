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
  Select,
  FormControl,
  FormLabel,
  HStack
} from '@chakra-ui/react';
import { EditIcon, CheckIcon, CloseIcon } from '@chakra-ui/icons';
import { api, projectsApi } from '../../api/api';
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

const FlujoPlanillasVariablesPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<{keyword: string, display_name: string}[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [planillaVariable, setPlanillaVariable] = useState<any[]>([]);
  const [editingCell, setEditingCell] = useState<{month: string, value: number} | null>(null);
  const toast = useToast();

  // Fetch projects
  useEffect(() => {
    projectsApi.getAll()
      .then(res => {
        setProjects(res.data.projects);
        if (res.data.projects.length > 0) {
          setSelectedProject(res.data.projects[0].keyword);
        }
      })
      .catch(() => {
        toast({
          title: 'Error al cargar proyectos',
          status: 'error',
          duration: 3000,
        });
      });
  }, [toast]);

  // Fetch data for selected project
  useEffect(() => {
    if (!selectedProject) return;
    
    setLoading(true);
    api.get('/api/payroll/flujo/planilla-variable', {
      params: { proyecto: selectedProject }
    })
      .then(res => {
        setPlanillaVariable(res.data);
      })
      .catch(() => {
        toast({
          title: 'Error al cargar datos',
          description: 'No se pudieron cargar los datos del flujo de planillas',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedProject, toast]);

  const handleEdit = (month: string, currentValue: number) => {
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
    
    setEditingCell({ month, value: currentValue });
  };

  const handleSave = async () => {
    if (!editingCell || !selectedProject) return;

    try {
      const { month, value } = editingCell;
      await api.put(`/api/payroll/flujo/planilla-variable/${selectedProject}/${month}`, { monto: value });
      
      // Update local state
      setPlanillaVariable(prev => 
        prev.map(item => 
          item.month === month ? { ...item, monto: value } : item
        )
      );

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

  const getValue = (month: string) => {
    return planillaVariable.find(item => item.month === month)?.monto || 0;
  };

  const getTotal = () => {
    return planillaVariable.reduce((sum, item) => sum + (item.monto || 0), 0);
  };

  const renderCell = (month: string, value: number) => {
    const isEditing = editingCell?.month === month;
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
                onClick={() => handleEdit(month, value)}
              />
            </Tooltip>
          )}
        </Box>
      </Td>
    );
  };

  if (loading && !selectedProject) {
    return (
      <Box p={4} display="flex" justifyContent="center">
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <Box p={5}>
      <Heading mb={6}>Flujo Planillas Variables</Heading>
      
      <FormControl maxW="400px" mb={6}>
        <FormLabel>Proyecto</FormLabel>
        <Select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          placeholder="Selecciona un proyecto"
        >
          {projects.map(p => (
            <option key={p.keyword} value={p.keyword}>
              {p.display_name}
            </option>
          ))}
        </Select>
      </FormControl>

      {loading ? (
        <Box p={4} display="flex" justifyContent="center">
          <Spinner size="xl" />
        </Box>
      ) : (
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
                        <Td fontWeight="bold">Planilla Variable Construcción</Td>
                        {months.map(month => renderCell(month, getValue(month)))}
                        <Td isNumeric fontWeight="bold">{formatCurrency(getTotal())}</Td>
                      </Tr>
                    </Tbody>
                  </Table>
                </TableContainer>
              </TabPanel>
            ))}
          </TabPanels>
        </Tabs>
      )}
    </Box>
  );
};

export default FlujoPlanillasVariablesPage; 