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
import { AddIcon, EditIcon, DeleteIcon, CopyIcon, CheckIcon, CloseIcon } from '@chakra-ui/icons';
import { api } from '../api/api';

interface MiscelaneosRow {
  id: number;
  concepto: string;
  total_2024_2025: number;
  total_2025_2026: number;
  total_2026_2027: number;
  total_2027_2028: number;
  [key: string]: number | string; // For dynamic month access
}

interface BulkFillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (startMonth: number, value: number, months: number) => void;
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

const formatCurrency = (value: number | null) => {
  if (value === null || value === undefined) return '$ 0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const BulkFillModal: React.FC<BulkFillModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [startMonth, setStartMonth] = useState<number>(0);
  const [value, setValue] = useState<number>(0);
  const [months, setMonths] = useState<number>(1);

  const handleSubmit = () => {
    onSubmit(startMonth, value, months);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Rellenar Múltiples Meses</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl>
              <FormLabel>Mes Inicial</FormLabel>
              <select 
                value={startMonth}
                onChange={(e) => setStartMonth(Number(e.target.value))}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #E2E8F0' }}
              >
                {generateDynamicPeriods().map((period, index) => (
                  <optgroup key={period.label} label={period.label}>
                    {period.months.map((month) => (
                      <option key={`${period.label}-${month}`} value={index}>
                        {formatMonth(month)}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </FormControl>
            <FormControl>
              <FormLabel>Valor</FormLabel>
              <NumberInput value={value} onChange={(_, val) => setValue(val)}>
                <NumberInputField />
              </NumberInput>
            </FormControl>
            <FormControl>
              <FormLabel>Número de Meses</FormLabel>
              <NumberInput value={months} min={1} max={12} onChange={(_, val) => setMonths(val)}>
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
};

export default function MiscelaneosTablePage() {
  const [data, setData] = useState<MiscelaneosRow[]>([]);
  const [editingRow, setEditingRow] = useState<MiscelaneosRow | null>(null);
  const [editingRowId, setEditingRowId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isBulkFillOpen, onOpen: onBulkFillOpen, onClose: onBulkFillClose } = useDisclosure();
  const toast = useToast();

  const periods = useMemo(() => generateDynamicPeriods(), []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/miscelaneos');
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

  const handleSave = async (formData: Partial<MiscelaneosRow>) => {
    try {
      if (editingRow?.id) {
        // Update existing
        await api.put(`/api/miscelaneos/${editingRow.id}`, formData);
        toast({
          title: 'Éxito',
          description: 'Registro actualizado correctamente',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Create new
        await api.post('/api/miscelaneos', formData);
        toast({
          title: 'Éxito',
          description: 'Registro creado correctamente',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      fetchData();
      onEditClose();
      setEditingRow(null);
    } catch (error) {
      console.error('Error saving:', error);
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
    if (!window.confirm('¿Está seguro de que desea eliminar este registro?')) {
      return;
    }

    try {
      await api.delete(`/api/miscelaneos/${id}`);
      toast({
        title: 'Éxito',
        description: 'Registro eliminado correctamente',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el registro',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleBulkFill = (rowId: number) => {
    const row = data.find(r => r.id === rowId);
    if (row) {
      setEditingRow(row);
      onBulkFillOpen();
    }
  };

  const handleBulkFillSubmit = async (startMonth: number, value: number, months: number) => {
    if (!editingRow) return;

    try {
      const allMonths = periods.flatMap(p => p.months);
      const updateData: any = {};
      
      for (let i = 0; i < months && startMonth + i < allMonths.length; i++) {
        const monthKey = allMonths[startMonth + i];
        updateData[`amount_${monthKey}`] = value;
      }

      await api.put(`/api/miscelaneos/${editingRow.id}`, updateData);
      
      toast({
        title: 'Éxito',
        description: `${months} mes(es) actualizados correctamente`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      fetchData();
      setEditingRow(null);
    } catch (error) {
      console.error('Error bulk filling:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron actualizar los meses',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleInlineEdit = (rowId: number) => {
    setEditingRowId(rowId);
  };

  const handleSaveInlineEdit = async (rowId: number) => {
    try {
      const row = data.find(r => r.id === rowId);
      if (!row) return;

      await api.put(`/api/miscelaneos/${rowId}`, row);
      
      toast({
        title: 'Éxito',
        description: 'Registro actualizado correctamente',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      setEditingRowId(null);
      fetchData();
    } catch (error) {
      console.error('Error saving inline edit:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar el registro',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleCancelInlineEdit = () => {
    setEditingRowId(null);
    fetchData(); // Refresh to revert changes
  };

  const handleCellValueChange = (rowId: number, monthKey: string, value: number) => {
    setData(prevData => 
      prevData.map(row => 
        row.id === rowId 
          ? { ...row, [`amount_${monthKey}`]: value }
          : row
      )
    );
  };

  const EditModal = () => (
    <Modal isOpen={isEditOpen} onClose={onEditClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {editingRow?.id ? 'Editar Misceláneos' : 'Nuevo Misceláneos'}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl>
              <FormLabel>Concepto</FormLabel>
              <Input
                value={editingRow?.concepto || ''}
                onChange={(e) => setEditingRow(prev => prev ? {...prev, concepto: e.target.value} : {concepto: e.target.value} as MiscelaneosRow)}
                placeholder="Ingrese el concepto"
              />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onEditClose}>
            Cancelar
          </Button>
          <Button 
            colorScheme="blue" 
            onClick={() => handleSave(editingRow || {})}
            isDisabled={!editingRow?.concepto}
          >
            Guardar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );

  if (isLoading) {
    return (
      <Box p={6}>
        <Text>Cargando...</Text>
      </Box>
    );
  }

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between">
          <Heading size="lg">Gastos Misceláneos</Heading>
          <Button
            leftIcon={<AddIcon />}
            colorScheme="blue"
            onClick={() => {
              setEditingRow({} as MiscelaneosRow);
              onEditOpen();
            }}
          >
            Nuevo Concepto
          </Button>
        </HStack>

        <Tabs variant="enclosed">
          <TabList>
            {periods.map((period, index) => (
              <Tab key={index}>{period.label}</Tab>
            ))}
          </TabList>

          <TabPanels>
            {periods.map((period, periodIndex) => (
              <TabPanel key={periodIndex} p={0}>
                <TableContainer>
                  <Table variant="simple" size="sm">
                    <Thead bg="gray.50">
                      <Tr>
                        <Th width="200px" position="sticky" left={0} bg="gray.50" zIndex={1}>
                          Concepto
                        </Th>
                        {period.months.map((month) => (
                          <Th key={month} textAlign="center" minWidth="120px">
                            {formatMonth(month)}
                          </Th>
                        ))}
                        <Th width="100px" position="sticky" right={0} bg="gray.50" zIndex={1}>
                          Acciones
                        </Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {data.map((row) => (
                        <Tr key={row.id}>
                          <Td 
                            position="sticky" 
                            left={0} 
                            bg="white" 
                            zIndex={1}
                            fontWeight="medium"
                          >
                            {row.concepto}
                          </Td>
                          {period.months.map((month) => (
                            <Td key={month} textAlign="right">
                              {editingRowId === row.id ? (
                                <NumberInput
                                  value={row[`amount_${month}`] as number || 0}
                                  onChange={(_, val) => handleCellValueChange(row.id, month, val || 0)}
                                  size="sm"
                                  min={0}
                                  precision={2}
                                  step={0.01}
                                >
                                  <NumberInputField textAlign="right" />
                                </NumberInput>
                              ) : (
                                formatCurrency(row[`amount_${month}`] as number)
                              )}
                            </Td>
                          ))}
                          <Td position="sticky" right={0} bg="white" zIndex={1}>
                            <HStack spacing={1}>
                              {editingRowId === row.id ? (
                                <>
                                  <Tooltip label="Guardar">
                                    <IconButton
                                      icon={<CheckIcon />}
                                      size="sm"
                                      variant="ghost"
                                      colorScheme="green"
                                      aria-label="Guardar"
                                      onClick={() => handleSaveInlineEdit(row.id)}
                                    />
                                  </Tooltip>
                                  <Tooltip label="Cancelar">
                                    <IconButton
                                      icon={<CloseIcon />}
                                      size="sm"
                                      variant="ghost"
                                      colorScheme="gray"
                                      aria-label="Cancelar"
                                      onClick={handleCancelInlineEdit}
                                    />
                                  </Tooltip>
                                </>
                              ) : (
                                <>
                                  <Tooltip label="Editar">
                                    <IconButton
                                      icon={<EditIcon />}
                                      size="sm"
                                      variant="ghost"
                                      aria-label="Editar"
                                      onClick={() => handleInlineEdit(row.id)}
                                    />
                                  </Tooltip>
                                  <Tooltip label="Rellenar meses">
                                    <IconButton
                                      icon={<CopyIcon />}
                                      size="sm"
                                      variant="ghost"
                                      aria-label="Rellenar"
                                      onClick={() => handleBulkFill(row.id)}
                                    />
                                  </Tooltip>
                                  <Tooltip label="Eliminar">
                                    <IconButton
                                      icon={<DeleteIcon />}
                                      size="sm"
                                      variant="ghost"
                                      colorScheme="red"
                                      aria-label="Eliminar"
                                      onClick={() => handleDelete(row.id)}
                                    />
                                  </Tooltip>
                                </>
                              )}
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

        {/* Summary Table */}
        <Box>
          <Heading size="md" mb={4}>Resumen por Año</Heading>
          <TableContainer>
            <Table variant="simple" size="sm">
              <Thead bg="gray.50">
                <Tr>
                  <Th>Concepto</Th>
                  <Th textAlign="right">2024-2025</Th>
                  <Th textAlign="right">2025-2026</Th>
                  <Th textAlign="right">2026-2027</Th>
                  <Th textAlign="right">2027-2028</Th>
                </Tr>
              </Thead>
              <Tbody>
                {data.map((row) => (
                  <Tr key={`summary-${row.id}`}>
                    <Td fontWeight="medium">{row.concepto}</Td>
                    <Td textAlign="right">{formatCurrency(row.total_2024_2025)}</Td>
                    <Td textAlign="right">{formatCurrency(row.total_2025_2026)}</Td>
                    <Td textAlign="right">{formatCurrency(row.total_2026_2027)}</Td>
                    <Td textAlign="right">{formatCurrency(row.total_2027_2028)}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>
      </VStack>

      <EditModal />
      <BulkFillModal
        isOpen={isBulkFillOpen}
        onClose={onBulkFillClose}
        onSubmit={handleBulkFillSubmit}
      />
    </Box>
  );
} 