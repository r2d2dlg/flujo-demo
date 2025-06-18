import React, { useEffect, useState } from 'react';
import {
  Box, Heading, Select, Button, Table, Thead, Tbody, Tr, Th, Td, TableContainer, IconButton, useToast, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, FormControl, FormLabel, Switch, VStack, HStack, Text
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { api, projectsApi } from '../api/api';

function getDynamicMonthsList() {
  const months = [];
  const now = new Date();
  now.setDate(1);
  // Start 3 months before
  const start = new Date(now);
  start.setMonth(now.getMonth() - 3);
  for (let i = 0; i < 39; i++) { // 3 before + 36 after = 39
    const d = new Date(start);
    d.setMonth(start.getMonth() + i);
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    months.push(`${y}_${m}`);
  }
  return months;
}
const monthsList = getDynamicMonthsList();
const formatMonth = (m: string) => {
  const [y, mo] = m.split('_');
  const names = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  return `${names[parseInt(mo,10)-1]} ${y}`;
};

const ProjectPayrollAssignmentsPage: React.FC = () => {
  const [projects, setProjects] = useState<{keyword:string,display_name:string}[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [assignments, setAssignments] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number|null>(null);
  const [form, setForm] = useState({ start_month: monthsList[0], end_month: monthsList[11], is_active: true });
  const [planillasForProject, setPlanillasForProject] = useState<any[]>([]);
  const [planillaError, setPlanillaError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    projectsApi.getAll().then(res => setProjects(res.data.projects));
  }, []);

  useEffect(() => {
    if (selectedProject) {
      api.get('/api/payroll/planillas/variable_construccion/', { params: { proyecto: selectedProject } }).then(res => setPlanillasForProject(res.data));
      api.get('/api/payroll/proyecto-variable-payroll/', { params: { proyecto: selectedProject } })
        .then(res => setAssignments(res.data));
    }
  }, [selectedProject, projects]);

  const openAdd = async () => {
    if (!selectedProject) return;
    setEditId(null);
    setForm({ start_month: monthsList[0], end_month: monthsList[11], is_active: true });
    setPlanillaError(null);
    try {
      const res = await api.get('/api/payroll/planillas/variable_construccion/', { params: { proyecto: selectedProject } });
      setPlanillasForProject(res.data);
      if (res.data.length === 0) {
        setPlanillaError('No hay planilla variable para este proyecto.');
      }
    } catch (e) {
      setPlanillaError('Error al cargar planilla para este proyecto.');
    }
    setModalOpen(true);
  };

  const openEdit = (a: any) => {
    setEditId(a.id);
    setForm({ start_month: a.start_month, end_month: a.end_month, is_active: a.is_active });
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const handleSave = async () => {
    if (!selectedProject) return;
    try {
      if (editId) {
        await api.put(`/api/payroll/proyecto-variable-payroll/${editId}`, form);
        toast({ title: 'Asignación actualizada', status: 'success' });
      } else {
        const payload = { proyecto: selectedProject, ...form };
        await api.post('/api/payroll/proyecto-variable-payroll/', payload);
        toast({ title: 'Asignación creada', status: 'success' });
      }
      setModalOpen(false);
      const res = await api.get('/api/payroll/proyecto-variable-payroll/', { params: { proyecto: selectedProject } });
      setAssignments(res.data);
      // Refetch planillasForProject to update employee count
      const resPlanillas = await api.get('/api/payroll/planillas/variable_construccion/', { params: { proyecto: selectedProject } });
      setPlanillasForProject(resPlanillas.data);
    } catch (e: any) {
      toast({ 
        title: 'Error', 
        description: e.response?.data?.detail || 'No se pudo guardar', 
        status: 'error' 
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Eliminar esta asignación?')) return;
    try {
      await api.delete(`/api/payroll/proyecto-variable-payroll/${id}`);
      toast({ title: 'Asignación eliminada', status: 'success' });
      setAssignments(assignments.filter(a => a.id !== id));
    } catch (e) {
      toast({ title: 'Error', description: 'No se pudo eliminar', status: 'error' });
    }
  };

  return (
    <Box p={6} maxW="900px" mx="auto">
      <Heading mb={6}>Asignar Planilla Variable de Construcción a Proyecto</Heading>
      <FormControl mb={6} maxW="400px">
        <FormLabel>Proyecto</FormLabel>
        <Select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} placeholder="Selecciona un proyecto">
          {projects.map(p => <option key={p.keyword} value={p.keyword}>{p.display_name}</option>)}
        </Select>
      </FormControl>
      <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={openAdd} mb={4} isDisabled={!selectedProject}>
        Asignar Planilla Variable
      </Button>
      <TableContainer>
        <Table variant="striped" size="sm">
          <Thead>
            <Tr>
              <Th>Empleados</Th>
              <Th>Mes Inicio</Th>
              <Th>Mes Fin</Th>
              <Th>Activo</Th>
              <Th>Acciones</Th>
            </Tr>
          </Thead>
          <Tbody>
            {assignments.map(a => (
              <Tr key={a.id}>
                <Td>{planillasForProject.length} empleados</Td>
                <Td>{formatMonth(a.start_month)}</Td>
                <Td>{formatMonth(a.end_month)}</Td>
                <Td>{a.is_active ? 'Sí' : 'No'}</Td>
                <Td>
                  <HStack>
                    <IconButton aria-label="Editar" icon={<EditIcon />} size="sm" onClick={() => openEdit(a)} />
                    <IconButton aria-label="Eliminar" icon={<DeleteIcon />} size="sm" colorScheme="red" onClick={() => handleDelete(a.id)} />
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
      <Modal isOpen={modalOpen} onClose={closeModal} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editId ? 'Editar' : 'Asignar'} Planilla Variable</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              {planillaError ? (
                <Box color="red.500">
                  {planillaError}
                  <Button
                    as="a"
                    href="/payroll/tables/variable-construccion"
                    target="_blank"
                    rel="noopener noreferrer"
                    colorScheme="blue"
                    mt={3}
                  >
                    Agregar empleados a la planilla variable
                  </Button>
                </Box>
              ) : planillasForProject.length > 0 ? (
                <Box color="green.600">
                  <Text>Planilla para este proyecto: <b>{planillasForProject.length} empleados</b></Text>
                  <Text fontSize="sm" mt={1}>
                    {planillasForProject.map(p => p.nombre).join(', ')}
                  </Text>
                </Box>
              ) : null}
              <FormControl isRequired>
                <FormLabel>Mes Inicio</FormLabel>
                <Select value={form.start_month} onChange={e => setForm(f => ({ ...f, start_month: e.target.value }))}>
                  {monthsList.map(m => <option key={m} value={m}>{formatMonth(m)}</option>)}
                </Select>
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Mes Fin</FormLabel>
                <Select value={form.end_month} onChange={e => setForm(f => ({ ...f, end_month: e.target.value }))}>
                  {monthsList.map(m => <option key={m} value={m}>{formatMonth(m)}</option>)}
                </Select>
              </FormControl>
              <FormControl display="flex" alignItems="center">
                <FormLabel mb={0}>Activo</FormLabel>
                <Switch isChecked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={closeModal}>Cancelar</Button>
            <Button colorScheme="blue" onClick={handleSave} isDisabled={!!planillaError}>
              {editId ? 'Guardar Cambios' : 'Asignar'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ProjectPayrollAssignmentsPage; 