import { useState, useEffect } from 'react';
import {
  Box, Button, Heading, Table, Thead, Tbody, Tr, Th, Td, TableContainer, useToast,
  IconButton, HStack, Spinner, Text, useDisclosure, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalCloseButton, ModalBody, ModalFooter, FormControl, FormLabel, Input, VStack, NumberInput, NumberInputField,
  Center
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { payrollApi } from '../../../api/api'; 
import { PlanillaFijaConstruccion, PlanillaFijaConstruccionCreate, PlanillaFijaConstruccionUpdate } from '../../../types/payrollTypes';

export default function PlanillaFijaConstruccionTablePage() {
  const [data, setData] = useState<PlanillaFijaConstruccion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingRow, setEditingRow] = useState<PlanillaFijaConstruccion | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const [formData, setFormData] = useState<Partial<PlanillaFijaConstruccionCreate>>({});

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await payrollApi.getAllPlanillasFijaConstruccion();
      setData(response.data || []);
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo cargar Planilla Fija Construcción.', status: 'error', duration: 5000, isClosable: true });
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
    // For fields that are numeric but represented as string in the form (due to precision or optionality)
    if (name === 'rata_x_h' || name === 'horas_regulares' || name === 'horas_ext_1_25' || name === 'horas_ext_1_5' || name === 'horas_ext_2_0' || name === 'i_renta') {
        setFormData(prev => ({ ...prev, [name]: valueAsString })); // Store as string for direct use if Decimal-like
    } else {
        setFormData(prev => ({ ...prev, [name]: valueAsNumber }));
    }
  };

  const handleOpenAddModal = () => {
    setEditingRow(null); setFormData({}); onOpen();
  };

  const handleOpenEditModal = (row: PlanillaFijaConstruccion) => {
    setEditingRow(row);
    setFormData({
        nombre: row.nombre,
        rata_x_h: String(row.rata_x_h),
        horas_regulares: String(row.horas_regulares),
        actividad: row.actividad || '',
        horas_ext_1_25: row.horas_ext_1_25 || '',
        horas_ext_1_5: row.horas_ext_1_5 || '',
        horas_ext_2_0: row.horas_ext_2_0 || '',
        i_renta: row.i_renta || ''
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
      // Ensure numeric fields are correctly formatted as strings for Decimal or null
      rata_x_h: formData.rata_x_h ? String(formData.rata_x_h) : '0.0000', // Default if required
      horas_regulares: formData.horas_regulares ? String(formData.horas_regulares) : '0.00', // Default if required
      horas_ext_1_25: formData.horas_ext_1_25 ? String(formData.horas_ext_1_25) : null,
      horas_ext_1_5: formData.horas_ext_1_5 ? String(formData.horas_ext_1_5) : null,
      horas_ext_2_0: formData.horas_ext_2_0 ? String(formData.horas_ext_2_0) : null,
      i_renta: formData.i_renta ? String(formData.i_renta) : null,
    };

    try {
      if (editingRow) {
        const updatePayload: PlanillaFijaConstruccionUpdate = payload;
        await payrollApi.updatePlanillaFijaConstruccion(editingRow.nombre, updatePayload);
        toast({ title: 'Éxito', description: 'Registro actualizado.', status: 'success' });
      } else {
        const createPayload: PlanillaFijaConstruccionCreate = payload as PlanillaFijaConstruccionCreate;
        if (!createPayload.nombre) {
            toast({ title: "Error de Validación", description: "NOMBRE es requerido.", status: "error"});
            setIsSubmitting(false); return;
        }
        await payrollApi.createPlanillaFijaConstruccion(createPayload);
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
        await payrollApi.deletePlanillaFijaConstruccion(nombre);
        toast({ title: 'Éxito', description: 'Registro eliminado.', status: 'success' });
        fetchData();
      } catch (error) {
        toast({ title: 'Error', description: 'No se pudo eliminar.', status: 'error' });
      }
    }
  };
  
  const columnsDef = [
    { Header: 'NOMBRE', accessor: 'nombre' },
    { Header: 'Rata x H', accessor: 'rata_x_h' },
    { Header: 'Horas Reg.', accessor: 'horas_regulares' },
    { Header: 'Actividad', accessor: 'actividad' },
    { Header: 'H.Ext 1.25', accessor: 'horas_ext_1_25' },
    { Header: 'H.Ext 1.5', accessor: 'horas_ext_1_5' },
    { Header: 'H.Ext 2.0', accessor: 'horas_ext_2_0' },
    { Header: 'I. Renta', accessor: 'i_renta' },
  ];

  if (isLoading) return <Center p={10}><Spinner size="xl" /></Center>;

  return (
    <Box p={4}>
      <HStack justify="space-between" mb={6}>
        <Heading size="lg">Planilla Fija Construcción</Heading>
        <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={handleOpenAddModal}>Agregar</Button>
      </HStack>
      <TableContainer>
        <Table variant="striped">
          <Thead><Tr>{columnsDef.map(c => <Th key={c.accessor}>{c.Header}</Th>)}<Th>Acciones</Th></Tr></Thead>
          <Tbody>
            {data.map(row => (
              <Tr key={row.nombre}>
                {columnsDef.map(c => <Td key={`${row.nombre}-${c.accessor}`}>{String(row[c.accessor as keyof PlanillaFijaConstruccion] ?? '')}</Td>)}
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
          <ModalHeader>{editingRow ? 'Editar' : 'Agregar'} Planilla Fija Construcción</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl isRequired={!editingRow}><FormLabel>NOMBRE</FormLabel><Input name="nombre" value={formData.nombre || ''} onChange={handleInputChange} isDisabled={!!editingRow} /></FormControl>
              <FormControl isRequired><FormLabel>Rata x Hora (e.g. 10.1234)</FormLabel><NumberInput precision={4} step={0.0001} value={formData.rata_x_h || ''} onChange={(vs, vn) => handleNumberInputChange('rata_x_h', vs, vn)}><NumberInputField name="rata_x_h" /></NumberInput></FormControl>
              <FormControl isRequired><FormLabel>Horas Regulares</FormLabel><NumberInput precision={2} step={0.01} value={formData.horas_regulares || ''} onChange={(vs, vn) => handleNumberInputChange('horas_regulares', vs, vn)}><NumberInputField name="horas_regulares" /></NumberInput></FormControl>
              <FormControl><FormLabel>Actividad</FormLabel><Input name="actividad" value={formData.actividad || ''} onChange={handleInputChange} /></FormControl>
              <FormControl><FormLabel>Horas Ext. 1.25</FormLabel><NumberInput precision={2} step={0.01} value={formData.horas_ext_1_25 || ''} onChange={(vs, vn) => handleNumberInputChange('horas_ext_1_25', vs, vn)}><NumberInputField name="horas_ext_1_25" /></NumberInput></FormControl>
              <FormControl><FormLabel>Horas Ext. 1.5</FormLabel><NumberInput precision={2} step={0.01} value={formData.horas_ext_1_5 || ''} onChange={(vs, vn) => handleNumberInputChange('horas_ext_1_5', vs, vn)}><NumberInputField name="horas_ext_1_5" /></NumberInput></FormControl>
              <FormControl><FormLabel>Horas Ext. 2.0</FormLabel><NumberInput precision={2} step={0.01} value={formData.horas_ext_2_0 || ''} onChange={(vs, vn) => handleNumberInputChange('horas_ext_2_0', vs, vn)}><NumberInputField name="horas_ext_2_0" /></NumberInput></FormControl>
              <FormControl><FormLabel>I. Renta</FormLabel><NumberInput precision={2} step={0.01} value={formData.i_renta || ''} onChange={(vs, vn) => handleNumberInputChange('i_renta', vs, vn)}><NumberInputField name="i_renta" /></NumberInput></FormControl>
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