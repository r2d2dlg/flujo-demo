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
  useDisclosure,
  Tooltip,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { api } from '../api/api';
import { useState, useEffect } from 'react';

interface EstadoCuentaRow {
  id: number;
  proveedor: string;
  empresa_credito: string;
  dias_0_30: number;
  dias_30_60: number;
  dias_61_90: number;
  dias_91_mas: number;
}

const EstadoCuentaProveedoresTab = () => {
  const [data, setData] = useState<EstadoCuentaRow[]>([]);
  const [editingRow, setEditingRow] = useState<EstadoCuentaRow | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const fetchData = async () => {
    try {
      const response = await api.get('/api/estado-cuenta-proveedores');
      setData(response.data);
    } catch (error) {
      toast({ title: 'Error fetching data', status: 'error', duration: 3000, isClosable: true });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (formData: Partial<EstadoCuentaRow>) => {
    try {
      if (editingRow) {
        await api.put(`/api/estado-cuenta-proveedores/${editingRow.id}`, formData);
      } else {
        await api.post('/api/estado-cuenta-proveedores', formData);
      }
      toast({ title: 'Data saved', status: 'success', duration: 3000, isClosable: true });
      fetchData();
      onClose();
    } catch (error) {
      toast({ title: 'Error saving data', status: 'error', duration: 3000, isClosable: true });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/estado-cuenta-proveedores/${id}`);
      toast({ title: 'Data deleted', status: 'success', duration: 3000, isClosable: true });
      fetchData();
    } catch (error) {
      toast({ title: 'Error deleting data', status: 'error', duration: 3000, isClosable: true });
    }
  };

  const handleEdit = (row: EstadoCuentaRow) => {
    setEditingRow(row);
    onOpen();
  };

  const handleCreate = () => {
    setEditingRow(null);
    onOpen();
  };

  return (
    <Box>
      <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={handleCreate} mb={4}>
        Añadir Registro
      </Button>
      <TableContainer>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Proveedor</Th>
              <Th>Empresa Crédito</Th>
              <Th isNumeric>0-30 Días</Th>
              <Th isNumeric>30-60 Días</Th>
              <Th isNumeric>61-90 Días</Th>
              <Th isNumeric>91+ Días</Th>
              <Th>Acciones</Th>
            </Tr>
          </Thead>
          <Tbody>
            {data.map((row) => (
              <Tr key={row.id}>
                <Td>{row.proveedor}</Td>
                <Td>{row.empresa_credito}</Td>
                <Td isNumeric>{row.dias_0_30}</Td>
                <Td isNumeric>{row.dias_30_60}</Td>
                <Td isNumeric>{row.dias_61_90}</Td>
                <Td isNumeric>{row.dias_91_mas}</Td>
                <Td>
                  <HStack>
                    <IconButton aria-label="Edit" icon={<EditIcon />} onClick={() => handleEdit(row)} />
                    <IconButton aria-label="Delete" icon={<DeleteIcon />} onClick={() => handleDelete(row.id)} />
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editingRow ? 'Editar' : 'Crear'} Registro</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Proveedor</FormLabel>
                <Input defaultValue={editingRow?.proveedor} id="proveedor" />
              </FormControl>
              <FormControl>
                <FormLabel>Empresa Crédito</FormLabel>
                <Input defaultValue={editingRow?.empresa_credito} id="empresa_credito" />
              </FormControl>
              <FormControl>
                <FormLabel>0-30 Días</FormLabel>
                <NumberInput defaultValue={editingRow?.dias_0_30} id="dias_0_30">
                  <NumberInputField />
                </NumberInput>
              </FormControl>
              <FormControl>
                <FormLabel>30-60 Días</FormLabel>
                <NumberInput defaultValue={editingRow?.dias_30_60} id="dias_30_60">
                  <NumberInputField />
                </NumberInput>
              </FormControl>
              <FormControl>
                <FormLabel>61-90 Días</FormLabel>
                <NumberInput defaultValue={editingRow?.dias_61_90} id="dias_61_90">
                  <NumberInputField />
                </NumberInput>
              </FormControl>
              <FormControl>
                <FormLabel>91+ Días</FormLabel>
                <NumberInput defaultValue={editingRow?.dias_91_mas} id="dias_91_mas">
                  <NumberInputField />
                </NumberInput>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>Cancelar</Button>
            <Button colorScheme="blue" ml={3} onClick={() => {
              const formData = {
                proveedor: (document.getElementById('proveedor') as HTMLInputElement).value,
                empresa_credito: (document.getElementById('empresa_credito') as HTMLInputElement).value,
                dias_0_30: parseFloat((document.getElementById('dias_0_30') as HTMLInputElement).value),
                dias_30_60: parseFloat((document.getElementById('dias_30_60') as HTMLInputElement).value),
                dias_61_90: parseFloat((document.getElementById('dias_61_90') as HTMLInputElement).value),
                dias_91_mas: parseFloat((document.getElementById('dias_91_mas') as HTMLInputElement).value),
              };
              handleSave(formData);
            }}>
              Guardar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

interface SaldoCuentaRow {
  id: number;
  proveedor: string;
  saldo_a_favor: number;
}

const SaldoProveedoresTab = () => {
  const [data, setData] = useState<SaldoCuentaRow[]>([]);
  const [editingRow, setEditingRow] = useState<SaldoCuentaRow | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const fetchData = async () => {
    try {
      const response = await api.get('/api/saldo-proveedores');
      setData(response.data);
    } catch (error) {
      toast({ title: 'Error fetching data', status: 'error', duration: 3000, isClosable: true });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (formData: Partial<SaldoCuentaRow>) => {
    try {
      if (editingRow) {
        await api.put(`/api/saldo-proveedores/${editingRow.id}`, formData);
      } else {
        await api.post('/api/saldo-proveedores', formData);
      }
      toast({ title: 'Data saved', status: 'success', duration: 3000, isClosable: true });
      fetchData();
      onClose();
    } catch (error) {
      toast({ title: 'Error saving data', status: 'error', duration: 3000, isClosable: true });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/saldo-proveedores/${id}`);
      toast({ title: 'Data deleted', status: 'success', duration: 3000, isClosable: true });
      fetchData();
    } catch (error) {
      toast({ title: 'Error deleting data', status: 'error', duration: 3000, isClosable: true });
    }
  };

  const handleEdit = (row: SaldoCuentaRow) => {
    setEditingRow(row);
    onOpen();
  };

  const handleCreate = () => {
    setEditingRow(null);
    onOpen();
  };

  return (
    <Box>
      <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={handleCreate} mb={4}>
        Añadir Saldo
      </Button>
      <TableContainer>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Proveedor</Th>
              <Th isNumeric>Saldo a Favor</Th>
              <Th>Acciones</Th>
            </Tr>
          </Thead>
          <Tbody>
            {data.map((row) => (
              <Tr key={row.id}>
                <Td>{row.proveedor}</Td>
                <Td isNumeric>{row.saldo_a_favor}</Td>
                <Td>
                  <HStack>
                    <IconButton aria-label="Edit" icon={<EditIcon />} onClick={() => handleEdit(row)} />
                    <IconButton aria-label="Delete" icon={<DeleteIcon />} onClick={() => handleDelete(row.id)} />
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editingRow ? 'Editar' : 'Crear'} Saldo</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Proveedor</FormLabel>
                <Input defaultValue={editingRow?.proveedor} id="saldo_proveedor" />
              </FormControl>
              <FormControl>
                <FormLabel>Saldo a Favor</FormLabel>
                <NumberInput defaultValue={editingRow?.saldo_a_favor} id="saldo_a_favor">
                  <NumberInputField />
                </NumberInput>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>Cancelar</Button>
            <Button colorScheme="blue" ml={3} onClick={() => {
              const formData = {
                proveedor: (document.getElementById('saldo_proveedor') as HTMLInputElement).value,
                saldo_a_favor: parseFloat((document.getElementById('saldo_a_favor') as HTMLInputElement).value),
              };
              handleSave(formData);
            }}>
              Guardar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default function ProveedoresPage() {
  return (
    <Box p={5}>
      <Heading size="lg" mb={5}>
        Gestión de Proveedores
      </Heading>
      <Tabs isLazy>
        <TabList>
          <Tab>Estado de Cuenta Proveedores</Tab>
          <Tab>Saldo a Favor Proveedores</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <EstadoCuentaProveedoresTab />
          </TabPanel>
          <TabPanel>
            <SaldoProveedoresTab />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
} 