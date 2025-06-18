import { useState, useEffect } from 'react';
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
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { api } from '../api/api';

interface MiscelaneosRow {
  id: number;
  concepto: string;
  monto: number;
}

export default function MiscelaneosTablePage() {
  const [data, setData] = useState<MiscelaneosRow[]>([]);
  const [editingRow, setEditingRow] = useState<MiscelaneosRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const toast = useToast();

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
        await api.put(`/api/miscelaneos/${editingRow.id}`, formData);
        toast({
          title: 'Éxito',
          description: 'Registro actualizado correctamente',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await api.post('/api/miscelaneos', formData);
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
  
  const handleEdit = (row: MiscelaneosRow) => {
    setEditingRow(row);
    onEditOpen();
  };

  const handleCreate = () => {
    setEditingRow(null);
    onEditOpen();
  };


  return (
    <Box p={5}>
      <Heading size="lg" mb={5}>
        Gestión de Misceláneos
      </Heading>
      <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={handleCreate} mb={4}>
        Añadir Concepto
      </Button>
      <TableContainer>
        <Table variant="striped" colorScheme="gray">
          <Thead>
            <Tr>
              <Th>ID</Th>
              <Th>Concepto</Th>
              <Th isNumeric>Monto</Th>
              <Th>Acciones</Th>
            </Tr>
          </Thead>
          <Tbody>
            {data.map((row) => (
              <Tr key={row.id}>
                <Td>{row.id}</Td>
                <Td>{row.concepto}</Td>
                <Td isNumeric>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(row.monto)}</Td>
                <Td>
                  <HStack spacing={2}>
                    <Tooltip label="Editar" hasArrow>
                      <IconButton
                        aria-label="Editar"
                        icon={<EditIcon />}
                        onClick={() => handleEdit(row)}
                        size="sm"
                        colorScheme="yellow"
                      />
                    </Tooltip>
                    <Tooltip label="Eliminar" hasArrow>
                      <IconButton
                        aria-label="Eliminar"
                        icon={<DeleteIcon />}
                        onClick={() => handleDelete(row.id)}
                        size="sm"
                        colorScheme="red"
                      />
                    </Tooltip>
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>

      <Modal isOpen={isEditOpen} onClose={onEditClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editingRow ? 'Editar' : 'Añadir'} Concepto</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Concepto</FormLabel>
                <Input
                  defaultValue={editingRow?.concepto || ''}
                  name="concepto"
                  id="concepto-input"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Monto</FormLabel>
                <NumberInput defaultValue={editingRow?.monto || 0} precision={2} step={0.01} id="monto-input">
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEditClose}>
              Cancelar
            </Button>
            <Button
              colorScheme="blue"
              onClick={() => {
                const concepto = (document.getElementById('concepto-input') as HTMLInputElement).value;
                const monto = (document.getElementById('monto-input') as HTMLInputElement).value;
                handleSave({ concepto, monto: parseFloat(monto) });
              }}
            >
              Guardar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
} 