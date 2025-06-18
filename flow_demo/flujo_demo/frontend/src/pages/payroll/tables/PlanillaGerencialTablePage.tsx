import { useState, useEffect } from 'react';
import {
  Box, Button, Heading, Table, Thead, Tbody, Tr, Th, Td, TableContainer, useToast,
  IconButton, HStack, Spinner, Text, useDisclosure, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalCloseButton, ModalBody, ModalFooter, FormControl, FormLabel, Input, VStack, NumberInput, NumberInputField,
  Center
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { payrollApi } from '../../../api/api';
import { PlanillaGerencial, PlanillaGerencialCreate, PlanillaGerencialUpdate } from '../../../types/payrollTypes';

export default function PlanillaGerencialTablePage() {
  const [data, setData] = useState<PlanillaGerencial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingRow, setEditingRow] = useState<PlanillaGerencial | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const [formData, setFormData] = useState<Partial<PlanillaGerencialCreate>>({});

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await payrollApi.getAllPlanillasGerencial();
      setData(response.data || []);
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo cargar Planilla Gerencial.', status: 'error', duration: 5000, isClosable: true });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleNumberInputChange = (name: string, valueAsString: string, valueAsNumber: number) => {
    setFormData(prev => ({ ...prev, [name]: valueAsString })); // Store as string for Decimal-like fields
  };

  const handleOpenAddModal = () => {
    setEditingRow(null); setFormData({}); onOpen();
  };

  const handleOpenEditModal = (row: PlanillaGerencial) => {
    setEditingRow(row);
    setFormData({ nombre: row.nombre, salario: String(row.salario || '') });
    onOpen();
  };

  const handleSubmit = async () => {
    if (!formData.nombre && !editingRow) {
        toast({ title: "Error", description: "NOMBRE es obligatorio.", status: "error" });
        return;
    }
    setIsSubmitting(true);
    const payload = {
      ...formData,
      salario: formData.salario ? String(formData.salario) : null,
    };

    try {
      if (editingRow) {
        const updatePayload: PlanillaGerencialUpdate = { salario: payload.salario }; // Only salario is updatable besides PK
        await payrollApi.updatePlanillaGerencial(editingRow.nombre, updatePayload);
        toast({ title: 'Éxito', description: 'Registro actualizado.', status: 'success' });
      } else {
        const createPayload: PlanillaGerencialCreate = payload as PlanillaGerencialCreate;
        if (!createPayload.nombre) {
            toast({ title: "Error de Validación", description: "NOMBRE es requerido.", status: "error"});
            setIsSubmitting(false); return;
        }
        await payrollApi.createPlanillaGerencial(createPayload);
        toast({ title: 'Éxito', description: 'Registro creado.', status: 'success' });
      }
      fetchData(); onClose();
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.detail || 'No se pudo guardar.', status: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (nombre: string) => {
    if (window.confirm(`Eliminar ${nombre}?`)) {
      try {
        await payrollApi.deletePlanillaGerencial(nombre);
        toast({ title: 'Éxito', description: 'Registro eliminado.', status: 'success' });
        fetchData();
      } catch (error) {
        toast({ title: 'Error', description: 'No se pudo eliminar.', status: 'error' });
      }
    }
  };
  
  const columnsDef = [
    { Header: 'NOMBRE', accessor: 'nombre' },
    { Header: 'Salario', accessor: 'salario' },
  ];

  if (isLoading) return <Center p={10}><Spinner size="xl" /></Center>;

  return (
    <Box p={4}>
      <HStack justify="space-between" mb={6}>
        <Heading size="lg">Planilla Gerencial</Heading>
        <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={handleOpenAddModal}>Agregar</Button>
      </HStack>
      <TableContainer>
        <Table variant="striped">
          <Thead><Tr>{columnsDef.map(c => <Th key={c.accessor}>{c.Header}</Th>)}<Th>Acciones</Th></Tr></Thead>
          <Tbody>
            {data.map(row => (
              <Tr key={row.nombre}>
                {columnsDef.map(c => <Td key={`${row.nombre}-${c.accessor}`}>{String(row[c.accessor as keyof PlanillaGerencial] ?? '')}</Td>)}
                <Td><HStack spacing={2}>
                  <IconButton aria-label="Editar" icon={<EditIcon />} size="sm" onClick={() => handleOpenEditModal(row)} />
                  <IconButton aria-label="Eliminar" icon={<DeleteIcon />} colorScheme="red" size="sm" onClick={() => handleDelete(row.nombre)} />
                </HStack></Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editingRow ? 'Editar' : 'Agregar'} Planilla Gerencial</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl isRequired={!editingRow}><FormLabel>NOMBRE</FormLabel><Input name="nombre" value={formData.nombre || ''} onChange={handleInputChange} isDisabled={!!editingRow} /></FormControl>
              <FormControl><FormLabel>Salario</FormLabel><NumberInput precision={2} step={0.01} value={formData.salario || ''} onChange={(vs, vn) => handleNumberInputChange('salario', vs, vn)}><NumberInputField name="salario" /></NumberInput></FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>Cancelar</Button>
            <Button colorScheme="blue" onClick={handleSubmit} isLoading={isSubmitting}>{editingRow ? 'Actualizar' : 'Guardar'}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
} 