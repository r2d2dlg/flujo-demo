import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  useToast,
  IconButton,
  HStack,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  NumberInput,
  NumberInputField,
  useDisclosure,
  Tooltip,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Text
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon, CopyIcon, CheckIcon, CloseIcon, RepeatIcon } from '@chakra-ui/icons';
import { api } from '../api/api';

interface PagosTierraRow {
  id: number;
  actividad: string;
  total_2024_2025: number;
  total_2025_2026: number;
  total_2026_2027: number;
  total_2027_2028: number;
  [key: string]: number | string; // For dynamic month access
}

interface EditingCell {
  rowId: number;
  month: string;
  value: number;
}

// Helper to generate dynamic periods: 3 months before + current + 36 months forward, grouped by 12
function generateDynamicPeriods() {
  const MONTHS_ES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const now = new Date();
  const months: string[] = [];
  // Previous 3 months
  for (let i = 3; i > 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${date.getFullYear()}_${String(date.getMonth() + 1).padStart(2, '0')}`);
  }
  // Current + next 36 months
  for (let i = 0; i < 37; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    months.push(`${date.getFullYear()}_${String(date.getMonth() + 1).padStart(2, '0')}`);
  }
  // Group by 12
  const periods = [];
  for (let i = 0; i < months.length; i += 12) {
    periods.push({
      label: `${formatMonth(months[i])} - ${formatMonth(months[Math.min(i+11, months.length-1)])}`,
      months: months.slice(i, i+12)
    });
  }
  return periods;
}

const formatMonth = (monthKey: string) => {
  const [year, month] = monthKey.split('_');
  const monthNames = {
    '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril',
    '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto',
    '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre'
  };
  return `${monthNames[month]} ${year}`;
};

interface BulkFillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (startMonth: number, value: number, months: number) => void;
}

function BulkFillModal({ isOpen, onClose, onSubmit }: BulkFillModalProps) {
  const [startMonth, setStartMonth] = useState(0);
  const [value, setValue] = useState(0);
  const [months, setMonths] = useState(1);

  const handleSubmit = () => {
    onSubmit(startMonth, value, months);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Rellenar Valores</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl>
              <FormLabel>Mes Inicial</FormLabel>
              <NumberInput min={0} max={11} value={startMonth} onChange={(_, val) => setStartMonth(val)}>
                <NumberInputField />
              </NumberInput>
            </FormControl>
            <FormControl>
              <FormLabel>Valor</FormLabel>
              <NumberInput value={value} onChange={(_, val) => setValue(val)}>
                <NumberInputField />
              </NumberInput>
            </FormControl>
            <FormControl>
              <FormLabel>Número de Meses</FormLabel>
              <NumberInput min={1} max={12} value={months} onChange={(_, val) => setMonths(val)}>
                <NumberInputField />
              </NumberInput>
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancelar
          </Button>
          <Button colorScheme="blue" onClick={handleSubmit}>
            Aplicar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default function PagosTierraTablePage() {
  const [data, setData] = useState<PagosTierraRow[]>([]);
  const [editingRow, setEditingRow] = useState<PagosTierraRow | null>(null);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);


  const [isLoading, setIsLoading] = useState(true);
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isBulkFillOpen, onOpen: onBulkFillOpen, onClose: onBulkFillClose } = useDisclosure();
  const toast = useToast();

  const periods = useMemo(() => generateDynamicPeriods(), []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/pagos_tierra');
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

  // Inline cell editing functions
  const handleCellEdit = (rowId: number, month: string, currentValue: number) => {

    // Prevent multiple edits at the same time
    if (editingCell) return;
    setEditingCell({ rowId, month, value: currentValue });
  };

  const handleCellSave = async () => {
    if (!editingCell) return;

    try {
      // Find the row to get the actividad
      const row = data.find(r => r.id === editingCell.rowId);
      if (!row) {
        console.error('Row not found for ID:', editingCell.rowId);
        return;
      }

      const updateData = {
        actividad: row.actividad,
        [`amount_${editingCell.month}`]: editingCell.value.toString()
      };

      await api.put(`/api/pagos_tierra/${editingCell.rowId}`, updateData);
      
      toast({
        title: 'Éxito',
        description: 'Valor actualizado correctamente',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setEditingCell(null);
      await fetchData(); // Refresh the data
    } catch (error) {
      console.error('Error updating cell:', error);
      console.error('Error response:', error.response?.data);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el valor',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleCellCancel = () => {
    setEditingCell(null);
  };

  // Render cell with inline editing capability
  const renderCell = (rowId: number, month: string, value: number) => {
    const isEditing = editingCell?.rowId === rowId && editingCell?.month === month;
    const safeValue = value || 0;

    if (isEditing) {
      return (
        <Td key={`${rowId}-${month}`} isNumeric>
          <Box display="flex" alignItems="center" gap={2}>
            <Input
              size="sm"
              type="number"
              value={editingCell.value || 0}
              onChange={(e) => 
                setEditingCell(prev => prev ? { ...prev, value: parseFloat(e.target.value) || 0 } : null)
              }
              step="0.01"
              min="0"
            />
            <IconButton
              aria-label="Save"
              icon={<CheckIcon />}
              size="xs"
              colorScheme="green"
              onClick={handleCellSave}
            />
            <IconButton
              aria-label="Cancel"
              icon={<CloseIcon />}
              size="xs"
              colorScheme="red"
              onClick={handleCellCancel}
            />
          </Box>
        </Td>
      );
    }

    return (
      <Td key={`${rowId}-${month}`} isNumeric>
        <Box display="flex" alignItems="center" justifyContent="flex-end" gap={2}>
          <Text>{formatCurrency(safeValue)}</Text>
          <Tooltip label="Editar valor">
            <IconButton
              aria-label="Edit"
              icon={<EditIcon />}
              size="xs"
              variant="ghost"
              onClick={() => handleCellEdit(rowId, month, safeValue)}
            />
          </Tooltip>
        </Box>
      </Td>
    );
  };

  const handleSave = async (formData: Partial<PagosTierraRow>) => {
    try {
      if (editingRow?.id) {
        await api.put(`/api/pagos_tierra/${editingRow.id}`, formData);
        toast({
          title: 'Éxito',
          description: 'Registro actualizado correctamente',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await api.post('/api/pagos_tierra', formData);
        toast({
          title: 'Éxito',
          description: 'Registro creado correctamente',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      onEditClose();
      fetchData();
    } catch (error) {
      console.error('Error saving data:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar el registro',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro que desea eliminar este registro?')) {
      try {
        await api.delete(`/api/pagos_tierra/${id}`);
        toast({
          title: 'Éxito',
          description: 'Registro eliminado correctamente',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        fetchData();
      } catch (error) {
        console.error('Error deleting data:', error);
        toast({
          title: 'Error',
          description: 'No se pudo eliminar el registro',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  const handleBulkFill = (rowId: number) => {
    setEditingRow(data.find(row => row.id === rowId) || null);
    onBulkFillOpen();
  };

  const handleBulkFillSubmit = async (startMonth: number, value: number, months: number) => {
    if (!editingRow) return;

    const updates: Partial<PagosTierraRow> = {};
    for (let i = 0; i < months && (startMonth + i) < 12; i++) {
      updates[`amount_${periods[startMonth + i].months[i]}`] = value;
    }

    try {
      await api.put(`/api/pagos_tierra/${editingRow.id}`, updates);
      toast({
        title: 'Éxito',
        description: 'Valores actualizados correctamente',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchData();
    } catch (error) {
      console.error('Error updating values:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron actualizar los valores',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return '$ 0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <Box p={4}>
      <HStack justify="space-between" mb={6}>
        <Heading size="lg">Pagos a Tierra</Heading>
        <HStack spacing={2}>
          <Button
            leftIcon={<RepeatIcon />}
            onClick={fetchData}
            colorScheme="blue"
            variant="outline"
          >
            Actualizar
          </Button>
          <Button
            leftIcon={<AddIcon />}
            colorScheme="blue"
            onClick={() => {
              setEditingRow(null);
              onEditOpen();
            }}
          >
            Agregar
          </Button>
        </HStack>
      </HStack>

      <Tabs>
        <TabList>
          {periods.map((period) => (
            <Tab key={period.label}>
              <Text fontWeight="bold">{period.label}</Text>
            </Tab>
          ))}
        </TabList>

        <TabPanels>
          {periods.map((period) => (
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
                      <Th>Acciones</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {data.map((row) => (
                      <Tr key={`${period.label}-${row.id}`}>
                        <Td>{row.actividad}</Td>
                        {period.months.map((month) => 
                          renderCell(row.id, month, row[`amount_${month}`] as number)
                        )}
                        <Td isNumeric>
                          {formatCurrency(row[`total_${period.label.replace('-', '_')}`])}
                        </Td>
                        <Td>
                          <HStack spacing={2}>
                            <IconButton
                              aria-label="Edit"
                              icon={<EditIcon />}
                              size="sm"
                              onClick={() => {
                                setEditingRow(row);
                                onEditOpen();
                              }}
                            />
                            <IconButton
                              aria-label="Delete"
                              icon={<DeleteIcon />}
                              size="sm"
                              colorScheme="red"
                              onClick={() => handleDelete(row.id)}
                            />
                            <Tooltip label="Rellenar valores">
                              <IconButton
                                aria-label="Bulk fill"
                                icon={<CopyIcon />}
                                size="sm"
                                onClick={() => handleBulkFill(row.id)}
                              />
                            </Tooltip>
                          </HStack>
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

      <Modal isOpen={isEditOpen} onClose={onEditClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingRow?.id ? 'Editar' : 'Agregar'} Registro
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Actividad</FormLabel>
                <Input
                  value={editingRow?.actividad || ''}
                  onChange={(e) => setEditingRow(prev => prev ? {...prev, actividad: e.target.value} : { actividad: e.target.value } as PagosTierraRow)}
                />
              </FormControl>
              {periods.map((period) => (
                <FormControl key={period.label}>
                  <FormLabel>{period.label}</FormLabel>
                  {period.months.map((month) => (
                    <FormControl key={month}>
                      <FormLabel>{formatMonth(month)}</FormLabel>
                      <NumberInput
                        value={editingRow?.[`amount_${month}`] as number || 0}
                        onChange={(_, val) => setEditingRow(prev => prev ? {...prev, [`amount_${month}`]: val} : { [`amount_${month}`]: val } as PagosTierraRow)}
                      >
                        <NumberInputField />
                      </NumberInput>
                    </FormControl>
                  ))}
                </FormControl>
              ))}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEditClose}>
              Cancelar
            </Button>
            <Button
              colorScheme="blue"
              onClick={() => handleSave(editingRow || {})}
            >
              {editingRow?.id ? 'Actualizar' : 'Guardar'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <BulkFillModal
        isOpen={isBulkFillOpen}
        onClose={onBulkFillClose}
        onSubmit={handleBulkFillSubmit}
      />
    </Box>
  );
} 