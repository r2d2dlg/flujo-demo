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
import { AddIcon, EditIcon, DeleteIcon, CopyIcon } from '@chakra-ui/icons';
import { api } from '../api/api';

interface EstudiosPermisosRow {
  id: number;
  actividad: string;
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

export default function EstudiosPermisosTablePage() {
  const [data, setData] = useState<EstudiosPermisosRow[]>([]);
  const [editingRow, setEditingRow] = useState<EstudiosPermisosRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isBulkFillOpen, onOpen: onBulkFillOpen, onClose: onBulkFillClose } = useDisclosure();
  const toast = useToast();

  const periods = useMemo(() => generateDynamicPeriods(), []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/estudios_disenos_permisos');
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

  const handleSave = async (formData: Partial<EstudiosPermisosRow>) => {
    try {
      if (editingRow?.id) {
        await api.put(`/api/estudios_disenos_permisos/${editingRow.id}`, formData);
        toast({
          title: 'Éxito',
          description: 'Registro actualizado correctamente',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await api.post('/api/estudios_disenos_permisos', formData);
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
        await api.delete(`/api/estudios_disenos_permisos/${id}`);
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

    const updates: Partial<EstudiosPermisosRow> = {};
    for (let i = 0; i < months && (startMonth + i) < 12; i++) {
      updates[`amount_${periods[startMonth + i].months[i]}`] = value;
    }

    try {
      await api.put(`/api/estudios_disenos_permisos/${editingRow.id}`, updates);
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

  return (
    <Box p={4}>
      <HStack justify="space-between" mb={6}>
        <Heading size="lg">Estudios, Diseños y Permisos</Heading>
        <Button
          leftIcon={<AddIcon />}
          colorScheme="blue"
          onClick={() => {
            setEditingRow({
              id: 0,
              actividad: '',
              total_2024_2025: 0,
              total_2025_2026: 0,
              total_2026_2027: 0,
              total_2027_2028: 0
            });
            onEditOpen();
          }}
        >
          Agregar
        </Button>
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
                        {period.months.map((month) => (
                          <Td key={month} isNumeric>
                            {formatCurrency(row[`amount_${month}`] as number)}
                          </Td>
                        ))}
                        <Td isNumeric fontWeight="bold">
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
                              onClick={() => handleDelete(row.id)}
                            />
                            <IconButton
                              aria-label="Bulk Fill"
                              icon={<CopyIcon />}
                              size="sm"
                              onClick={() => handleBulkFill(row.id)}
                            />
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
                  onChange={(e) => setEditingRow(prev => prev ? {...prev, actividad: e.target.value} : {
                    id: 0,
                    actividad: e.target.value,
                    total_2024_2025: 0,
                    total_2025_2026: 0,
                    total_2026_2027: 0,
                    total_2027_2028: 0
                  })}
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
                        onChange={(_, val) => setEditingRow(prev => prev ? {...prev, [`amount_${month}`]: val} : {
                          id: 0,
                          actividad: '',
                          total_2024_2025: 0,
                          total_2025_2026: 0,
                          total_2026_2027: 0,
                          total_2027_2028: 0,
                          [`amount_${month}`]: val
                        })}
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