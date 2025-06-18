import { useState, useEffect } from 'react';
import {
  Box, Button, Heading, Table, Thead, Tbody, Tr, Th, Td, TableContainer, useToast,
  IconButton, HStack, Spinner, Text, useDisclosure, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalCloseButton, ModalBody, ModalFooter, FormControl, FormLabel, Input, VStack, NumberInput, NumberInputField,
  Center, Select
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { payrollApi } from '../../../api/api'; 
import { PlanillaVariableConstruccion, PlanillaVariableConstruccionCreate, PlanillaVariableConstruccionUpdate } from '../../../types/payrollTypes';
import { projectsApi } from '../../../api/api';

export default function PlanillaVariableConstruccionTablePage() {
  const [data, setData] = useState<PlanillaVariableConstruccion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingRow, setEditingRow] = useState<PlanillaVariableConstruccion | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const [formData, setFormData] = useState<Partial<PlanillaVariableConstruccionCreate>>({});
  const [proyectos, setProyectos] = useState<{ keyword: string, display_name: string }[]>([]);
  const [selectedProyecto, setSelectedProyecto] = useState<string>('');

  useEffect(() => {
    projectsApi.getAll().then(res => {
      setProyectos(res.data.projects);
      if (res.data.projects.length > 0 && !selectedProyecto) setSelectedProyecto(res.data.projects[0].keyword);
    });
  }, []);

  const fetchData = async () => {
    if (!selectedProyecto) return;
    try {
      setIsLoading(true);
      const response = await payrollApi.getAllPlanillasVariableConstruccion(0, 100, { params: { proyecto: selectedProyecto } });
      setData(response.data || []);
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo cargar Planilla Variable Construcción.', status: 'error', duration: 5000, isClosable: true });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [selectedProyecto]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberInputChange = (name: string, valueAsString: string, valueAsNumber: number) => {
    if (name === 'rata_x_h' || name === 'horas_regulares' || name === 'horas_ext_1_25' || name === 'horas_ext_1_5' || name === 'horas_ext_2_0' || name === 'i_renta') {
        setFormData(prev => ({ ...prev, [name]: valueAsString }));
    } else {
        setFormData(prev => ({ ...prev, [name]: valueAsNumber }));
    }
  };

  const handleOpenAddModal = () => {
    setEditingRow(null); setFormData({}); onOpen();
  };

  const handleOpenEditModal = (row: PlanillaVariableConstruccion) => {
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
    if (!selectedProyecto) {
        toast({ title: "Error", description: "Debe seleccionar un proyecto.", status: "error" });
        return;
    }
    setIsSubmitting(true);

    const payload = {
      ...formData,
      rata_x_h: formData.rata_x_h ? String(formData.rata_x_h) : '0.0000',
      horas_regulares: formData.horas_regulares ? String(formData.horas_regulares) : '0.00',
      horas_ext_1_25: formData.horas_ext_1_25 ? String(formData.horas_ext_1_25) : null,
      horas_ext_1_5: formData.horas_ext_1_5 ? String(formData.horas_ext_1_5) : null,
      horas_ext_2_0: formData.horas_ext_2_0 ? String(formData.horas_ext_2_0) : null,
      i_renta: formData.i_renta ? String(formData.i_renta) : null,
    };

    try {
      if (editingRow) {
        const updatePayload: PlanillaVariableConstruccionUpdate = payload;
        await payrollApi.updatePlanillaVariableConstruccion(editingRow.nombre, updatePayload);
        toast({ title: 'Éxito', description: 'Registro actualizado.', status: 'success' });
      } else {
        const createPayload: PlanillaVariableConstruccionCreate = { ...payload, proyecto: selectedProyecto } as PlanillaVariableConstruccionCreate;
        if (!createPayload.nombre) {
            toast({ title: "Error de Validación", description: "NOMBRE es requerido.", status: "error"});
            setIsSubmitting(false); return;
        }
        await payrollApi.createPlanillaVariableConstruccion(createPayload);
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
        await payrollApi.deletePlanillaVariableConstruccion(nombre);
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
    { Header: 'Proyecto', accessor: 'proyecto' },
  ];

  if (isLoading) return <Center p={10}><Spinner size="xl" /></Center>;

  return (
    <Box p={4}>
      <HStack justify="space-between" mb={6}>
        <Heading size="lg">Planilla Variable Construcción</Heading>
        <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={handleOpenAddModal}>Agregar</Button>
      </HStack>
      <Box mb={4} maxW="300px">
        <FormControl>
          <FormLabel>Proyecto</FormLabel>
          <Select placeholder="Selecciona un proyecto" value={selectedProyecto} onChange={e => setSelectedProyecto(e.target.value)}>
            {proyectos.map(proj => (
              <option key={proj.keyword} value={proj.keyword}>{proj.display_name}</option>
            ))}
          </Select>
        </FormControl>
      </Box>
      <TableContainer>
        <Table variant="striped">
          <Thead><Tr>{columnsDef.map(c => <Th key={c.accessor}>{c.Header}</Th>)}<Th>Acciones</Th></Tr></Thead>
          <Tbody>
            {data.map(row => (
              <Tr key={row.nombre}>
                {columnsDef.map(c => {
                  if (c.accessor === 'proyecto') {
                    return (
                      <Td key={`${row.nombre}-proyecto`}>
                        <Select
                          size="sm"
                          value={row.proyecto}
                          onChange={async (e) => {
                            const newProyecto = e.target.value;
                            try {
                              await payrollApi.updatePlanillaVariableConstruccion(row.nombre, { proyecto: newProyecto });
                              toast({ title: 'Proyecto actualizado', status: 'success' });
                              fetchData();
                            } catch (error) {
                              toast({ title: 'Error', description: 'No se pudo actualizar el proyecto', status: 'error' });
                            }
                          }}
                        >
                          {proyectos.map(proj => (
                            <option key={proj.keyword} value={proj.keyword}>{proj.display_name}</option>
                          ))}
                        </Select>
                      </Td>
                    );
                  } else {
                    return <Td key={`${row.nombre}-${c.accessor}`}>{String(row[c.accessor as keyof PlanillaVariableConstruccion] ?? '')}</Td>;
                  }
                })}
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
          <ModalHeader>{editingRow ? 'Editar' : 'Agregar'} Planilla Variable Construcción</ModalHeader>
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