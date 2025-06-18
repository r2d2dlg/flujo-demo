import { useState, useEffect } from 'react';
import {
  Box, Button, Heading, Table, Thead, Tbody, Tr, Th, Td, TableContainer, useToast,
  IconButton, HStack, Spinner, Text, useDisclosure, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalCloseButton, ModalBody, ModalFooter, FormControl, FormLabel, Input, VStack, NumberInput, NumberInputField, Center
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { payrollApi } from '../../../api/api';
import { PlanillaAdministracion, PlanillaAdministracionCreate, PlanillaAdministracionUpdate } from '../../../types/payrollTypes';

export default function PlanillaAdministracionTablePage() {
  const [data, setData] = useState<PlanillaAdministracion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingRow, setEditingRow] = useState<PlanillaAdministracion | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  // Form state for the modal
  const [formData, setFormData] = useState<Partial<PlanillaAdministracionCreate>>({});

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await payrollApi.getAllPlanillasAdministracion();
      setData(response.data || []);
    } catch (error) {
      console.error('Error fetching Planilla Administracion data:', error);
      toast({
        title: 'Error', description: 'No se pudo cargar los datos de Planilla Administración.',
        status: 'error', duration: 5000, isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // For numeric fields, convert to number if not empty, else keep as string for controlled input
    const isNumericField = name === 'horas' || name === 'sal_bruto' || name === 'i_s_r' || name === 'otros_desc';
    setFormData(prev => ({ ...prev, [name]: isNumericField && value !== '' ? value : value }));
  };
  
  const handleNumberInputChange = (name: string, valueAsString: string, valueAsNumber: number) => {
    setFormData(prev => ({ ...prev, [name]: valueAsNumber }));
  };


  const handleOpenAddModal = () => {
    setEditingRow(null);
    setFormData({});
    onOpen();
  };

  const handleOpenEditModal = (row: PlanillaAdministracion) => {
    setEditingRow(row);
    setFormData({
        nombre: row.nombre,
        horas: row.horas,
        sal_bruto: row.sal_bruto, // Keep as string for form
        i_s_r: row.i_s_r || '',
        otros_desc: row.otros_desc || ''
    });
    onOpen();
  };

  const handleSubmit = async () => {
    if (!formData.nombre && !editingRow) {
        toast({ title: "Error", description: "El campo NOMBRE es obligatorio.", status: "error", duration: 3000, isClosable: true });
        return;
    }

    setIsSubmitting(true);
    // Prepare data, converting numeric strings to numbers or null
    const payload = {
      ...formData,
      horas: formData.horas ? parseInt(String(formData.horas), 10) : 0,
      sal_bruto: formData.sal_bruto ? String(formData.sal_bruto) : '0.00',
      i_s_r: formData.i_s_r ? String(formData.i_s_r) : null,
      otros_desc: formData.otros_desc ? String(formData.otros_desc) : null,
    };
    
    try {
      if (editingRow) {
        // Update: nombre is in editingRow.nombre, not in formData for update schema
        const updatePayload: PlanillaAdministracionUpdate = {
            horas: payload.horas,
            sal_bruto: payload.sal_bruto,
            i_s_r: payload.i_s_r,
            otros_desc: payload.otros_desc,
        };
        await payrollApi.updatePlanillaAdministracion(editingRow.nombre, updatePayload);
        toast({ title: 'Éxito', description: 'Registro actualizado.', status: 'success', duration: 3000, isClosable: true });
      } else {
        // Create
        const createPayload: PlanillaAdministracionCreate = payload as PlanillaAdministracionCreate;
         if (!createPayload.nombre) { // Double check nombre for create
            toast({ title: "Error de Validación", description: "El campo NOMBRE es requerido para crear.", status: "error", duration: 3000, isClosable: true });
            setIsSubmitting(false);
            return;
        }
        await payrollApi.createPlanillaAdministracion(createPayload);
        toast({ title: 'Éxito', description: 'Registro creado.', status: 'success', duration: 3000, isClosable: true });
      }
      fetchData();
      onClose();
    } catch (error: any) {
      console.error('Error submitting form:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'No se pudo guardar el registro.',
        status: 'error', duration: 5000, isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (nombre: string) => {
    if (window.confirm(`¿Está seguro de que desea eliminar el registro ${nombre}?`)) {
      try {
        await payrollApi.deletePlanillaAdministracion(nombre);
        toast({ title: 'Éxito', description: 'Registro eliminado.', status: 'success', duration: 3000, isClosable: true });
        fetchData();
      } catch (error) {
        console.error('Error deleting record:', error);
        toast({ title: 'Error', description: 'No se pudo eliminar el registro.', status: 'error', duration: 5000, isClosable: true });
      }
    }
  };
  
  const columnsDef = [
    { Header: 'NOMBRE', accessor: 'nombre' },
    { Header: 'Horas', accessor: 'horas' },
    { Header: 'Sal. Bruto', accessor: 'sal_bruto' },
    { Header: 'I.S.R.', accessor: 'i_s_r' },
    { Header: 'Otros Desc.', accessor: 'otros_desc' },
  ];

  if (isLoading) {
    return <Center p={10}><Spinner size="xl" /></Center>;
  }

  return (
    <Box p={4}>
      <HStack justify="space-between" mb={6}>
        <Heading as="h1" size="lg">Planilla Administración</Heading>
        <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={handleOpenAddModal}>
          Agregar Registro
        </Button>
      </HStack>

      <TableContainer>
        <Table variant="striped">
          <Thead>
            <Tr>
              {columnsDef.map(col => <Th key={col.accessor}>{col.Header}</Th>)}
              <Th>Acciones</Th>
            </Tr>
          </Thead>
          <Tbody>
            {data.length === 0 ? (
              <Tr><Td colSpan={columnsDef.length + 1} textAlign="center">No hay datos para mostrar</Td></Tr>
            ) : (
              data.map((row) => (
                <Tr key={row.nombre}>
                  {columnsDef.map(col => (
                    <Td key={`${row.nombre}-${col.accessor}`}>
                      {String(row[col.accessor as keyof PlanillaAdministracion] ?? '')}
                    </Td>
                  ))}
                  <Td>
                    <HStack spacing={2}>
                      <IconButton aria-label="Editar" icon={<EditIcon />} size="sm" onClick={() => handleOpenEditModal(row)} />
                      <IconButton aria-label="Eliminar" icon={<DeleteIcon />} colorScheme="red" size="sm" onClick={() => handleDelete(row.nombre)} />
                    </HStack>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </TableContainer>

      {/* Add/Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editingRow ? 'Editar Registro' : 'Agregar Nuevo Registro'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired={!editingRow}>
                <FormLabel>NOMBRE</FormLabel>
                <Input name="nombre" value={formData.nombre || ''} onChange={handleInputChange} isDisabled={!!editingRow} />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Horas</FormLabel>
                 <NumberInput 
                    value={formData.horas ?? undefined} 
                    onChange={(valueString, valueNumber) => handleNumberInputChange('horas', valueString, valueNumber)}
                    min={0}
                  >
                    <NumberInputField name="horas" />
                </NumberInput>
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Sal. Bruto</FormLabel>
                <NumberInput 
                    precision={2} 
                    step={0.01} 
                    value={formData.sal_bruto ?? undefined}
                    onChange={(valueString, valueNumber) => handleNumberInputChange('sal_bruto', valueString, valueNumber)}
                    min={0}
                >
                    <NumberInputField name="sal_bruto" />
                </NumberInput>
              </FormControl>
              <FormControl>
                <FormLabel>I.S.R.</FormLabel>
                <NumberInput 
                    precision={2} 
                    step={0.01} 
                    value={formData.i_s_r ?? undefined}
                    onChange={(valueString, valueNumber) => handleNumberInputChange('i_s_r', valueString, valueNumber)}
                    min={0}
                    allowMouseWheel
                >
                    <NumberInputField name="i_s_r" />
                </NumberInput>
              </FormControl>
              <FormControl>
                <FormLabel>Otros Desc.</FormLabel>
                 <NumberInput 
                    precision={2} 
                    step={0.01} 
                    value={formData.otros_desc ?? undefined}
                    onChange={(valueString, valueNumber) => handleNumberInputChange('otros_desc', valueString, valueNumber)}
                    min={0}
                    allowMouseWheel
                  >
                    <NumberInputField name="otros_desc" />
                </NumberInput>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>Cancelar</Button>
            <Button colorScheme="blue" onClick={handleSubmit} isLoading={isSubmitting}>
              {editingRow ? 'Actualizar' : 'Guardar'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
} 