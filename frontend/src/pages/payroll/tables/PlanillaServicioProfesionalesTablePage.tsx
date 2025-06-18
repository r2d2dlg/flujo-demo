import { useState, useEffect } from 'react';
import {
  Box, Button, Heading, Table, Thead, Tbody, Tr, Th, Td, TableContainer, useToast,
  IconButton, HStack, Spinner, Text, useDisclosure, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalCloseButton, ModalBody, ModalFooter, FormControl, FormLabel, Input, VStack, NumberInput, NumberInputField,
  Textarea, Center
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { payrollApi } from '../../../api/api';
import { PlanillaServicioProfesionales, PlanillaServicioProfesionalesCreate, PlanillaServicioProfesionalesUpdate } from '../../../types/payrollTypes';

export default function PlanillaServicioProfesionalesTablePage() {
  const [data, setData] = useState<PlanillaServicioProfesionales[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingRow, setEditingRow] = useState<PlanillaServicioProfesionales | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const [formData, setFormData] = useState<Partial<PlanillaServicioProfesionalesCreate>>({});

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await payrollApi.getAllPlanillasServicioProfesionales();
      setData(response.data || []);
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo cargar Planilla Servicios Profesionales.', status: 'error', duration: 5000, isClosable: true });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberInputChange = (name: string, valueAsString: string, valueAsNumber: number) => {
    setFormData(prev => ({ ...prev, [name]: valueAsString }));
  };

  const handleOpenAddModal = () => {
    setEditingRow(null); setFormData({}); onOpen();
  };

  const handleOpenEditModal = (row: PlanillaServicioProfesionales) => {
    setEditingRow(row);
    setFormData({
        nombre: row.nombre,
        salario_quincenal: String(row.salario_quincenal || ''),
        hras_xtras: String(row.hras_xtras || ''),
        otros_salarios: String(row.otros_salarios || ''),
        descuentos: String(row.descuentos || ''),
        observaciones: row.observaciones || ''
    });
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
      salario_quincenal: formData.salario_quincenal ? String(formData.salario_quincenal) : null,
      hras_xtras: formData.hras_xtras ? String(formData.hras_xtras) : null,
      otros_salarios: formData.otros_salarios ? String(formData.otros_salarios) : null,
      descuentos: formData.descuentos ? String(formData.descuentos) : null,
    };

    try {
      if (editingRow) {
        const updatePayload: PlanillaServicioProfesionalesUpdate = payload;
        await payrollApi.updatePlanillaServicioProfesionales(editingRow.nombre, updatePayload);
        toast({ title: 'Éxito', description: 'Registro actualizado.', status: 'success' });
      } else {
        const createPayload: PlanillaServicioProfesionalesCreate = payload as PlanillaServicioProfesionalesCreate;
        if (!createPayload.nombre) {
            toast({ title: "Error de Validación", description: "NOMBRE es requerido.", status: "error"});
            setIsSubmitting(false); return;
        }
        await payrollApi.createPlanillaServicioProfesionales(createPayload);
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
        await payrollApi.deletePlanillaServicioProfesionales(nombre);
        toast({ title: 'Éxito', description: 'Registro eliminado.', status: 'success' });
        fetchData();
      } catch (error) {
        toast({ title: 'Error', description: 'No se pudo eliminar.', status: 'error' });
      }
    }
  };
  
  const columnsDef = [
    { Header: 'NOMBRE', accessor: 'nombre' },
    { Header: 'Sal. Quincenal', accessor: 'salario_quincenal' },
    { Header: 'Hras. Xtras', accessor: 'hras_xtras' },
    { Header: 'Otros Salarios', accessor: 'otros_salarios' },
    { Header: 'Descuentos', accessor: 'descuentos' },
    { Header: 'Observaciones', accessor: 'observaciones' },
  ];

  if (isLoading) return <Center p={10}><Spinner size="xl" /></Center>;

  return (
    <Box p={4}>
      <HStack justify="space-between" mb={6}>
        <Heading size="lg">Planilla Servicios Profesionales</Heading>
        <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={handleOpenAddModal}>Agregar</Button>
      </HStack>
      <TableContainer>
        <Table variant="striped">
          <Thead><Tr>{columnsDef.map(c => <Th key={c.accessor}>{c.Header}</Th>)}<Th>Acciones</Th></Tr></Thead>
          <Tbody>
            {data.map(row => (
              <Tr key={row.nombre}>
                {columnsDef.map(c => <Td key={`${row.nombre}-${c.accessor}`}>{String(row[c.accessor as keyof PlanillaServicioProfesionales] ?? '')}</Td>)}
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
          <ModalHeader>{editingRow ? 'Editar' : 'Agregar'} Planilla Servicios Profesionales</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl isRequired={!editingRow}><FormLabel>NOMBRE</FormLabel><Input name="nombre" value={formData.nombre || ''} onChange={handleInputChange} isDisabled={!!editingRow} /></FormControl>
              <FormControl><FormLabel>Salario Quincenal</FormLabel><NumberInput precision={2} step={0.01} value={formData.salario_quincenal || ''} onChange={(vs, vn) => handleNumberInputChange('salario_quincenal', vs, vn)}><NumberInputField name="salario_quincenal" /></NumberInput></FormControl>
              <FormControl><FormLabel>Hras. Xtras</FormLabel><NumberInput precision={2} step={0.01} value={formData.hras_xtras || ''} onChange={(vs, vn) => handleNumberInputChange('hras_xtras', vs, vn)}><NumberInputField name="hras_xtras" /></NumberInput></FormControl>
              <FormControl><FormLabel>Otros Salarios</FormLabel><NumberInput precision={2} step={0.01} value={formData.otros_salarios || ''} onChange={(vs, vn) => handleNumberInputChange('otros_salarios', vs, vn)}><NumberInputField name="otros_salarios" /></NumberInput></FormControl>
              <FormControl><FormLabel>Descuentos</FormLabel><NumberInput precision={2} step={0.01} value={formData.descuentos || ''} onChange={(vs, vn) => handleNumberInputChange('descuentos', vs, vn)}><NumberInputField name="descuentos" /></NumberInput></FormControl>
              <FormControl><FormLabel>Observaciones</FormLabel><Textarea name="observaciones" value={formData.observaciones || ''} onChange={handleInputChange} /></FormControl>
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