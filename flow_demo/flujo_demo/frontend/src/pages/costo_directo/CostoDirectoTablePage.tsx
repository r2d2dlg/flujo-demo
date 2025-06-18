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
  NumberInput,
  NumberInputField,
  useDisclosure,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Spinner,
  Select
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { formatCurrency } from '../../utils/formatters';
import apiClient, { 
    costoDirecto, type CostoDirecto, type CostoDirectoCreate, type CostoDirectoUpdate,
    costoXViviendaApi, type CostoXVivienda, type CostoXViviendaCreate, type CostoXViviendaUpdate,
    type CostosDirectosTotales, getInfraestructuraPagos, createInfraestructuraPago, deleteInfraestructuraPago,
    getViviendaPagos, createViviendaPago, deleteViviendaPago,
    projectsApi
} from '../../api/api';

const CostoDirectoTable = ({ data, fetchData, selectedProyecto }: { data: CostoDirecto[], fetchData: () => Promise<void>, selectedProyecto: string }) => {
    const [editingRow, setEditingRow] = useState<Partial<CostoDirecto> | null>(null);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const toast = useToast();
  
    const handleSave = async () => {
      if (!editingRow) return;
      try {
        if (editingRow.id) {
          await costoDirecto.update(editingRow.id, editingRow as CostoDirectoUpdate);
        } else {
          await costoDirecto.create(editingRow as CostoDirectoCreate);
        }
        toast({ title: 'Éxito', description: 'Registro guardado.', status: 'success' });
        onClose();
        fetchData();
      } catch (error) {
        toast({ title: 'Error', description: 'No se pudo guardar el registro.', status: 'error' });
      }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('¿Está seguro?')) return;
        try {
          await costoDirecto.delete(id);
          toast({ title: 'Éxito', description: 'Registro eliminado.', status: 'success' });
          fetchData();
        } catch (error) {
          toast({ title: 'Error', description: 'No se pudo eliminar.', status: 'error' });
        }
    };

    const openModal = (row: Partial<CostoDirecto> | null) => {
        setEditingRow(row ? {...row} : { actividad: '', infraestructura: 0, materiales: 0, mo: 0, equipos: 0 });
        onOpen();
    };

    const handleModalChange = (field: keyof CostoDirecto, value: any) => {
        setEditingRow(prev => prev ? { ...prev, [field]: value } : null);
    };

    return (
        <Box>
            <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={() => openModal(null)} mb={4}>Agregar</Button>
            <TableContainer>
                <Table variant="striped" size="sm">
                    <Thead><Tr><Th>Actividad</Th><Th isNumeric>Infraestructura</Th><Th isNumeric>Materiales</Th><Th isNumeric>MO</Th><Th isNumeric>Equipos</Th><Th>Acciones</Th></Tr></Thead>
                    <Tbody>
                        {data.map((row) => (
                            <Tr key={row.id}>
                                <Td>{row.actividad}</Td>
                                <Td isNumeric>{formatCurrency(row.infraestructura)}</Td>
                                <Td isNumeric>{formatCurrency(row.materiales)}</Td>
                                <Td isNumeric>{formatCurrency(row.mo)}</Td>
                                <Td isNumeric>{formatCurrency(row.equipos)}</Td>
                                <Td><HStack spacing={2}><IconButton aria-label="Edit" icon={<EditIcon />} size="sm" onClick={() => openModal(row)} /><IconButton aria-label="Delete" icon={<DeleteIcon />} size="sm" colorScheme="red" onClick={() => handleDelete(row.id)} /></HStack></Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </TableContainer>
            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalOverlay /><ModalContent>
                    <ModalHeader>{editingRow?.id ? 'Editar' : 'Nuevo'} Registro</ModalHeader><ModalCloseButton />
                    <ModalBody><VStack spacing={4}>
                        <FormControl isRequired><FormLabel>Actividad</FormLabel><Input value={editingRow?.actividad || ''} onChange={(e) => handleModalChange('actividad', e.target.value)} /></FormControl>
                        <FormControl><FormLabel>Infraestructura</FormLabel><NumberInput value={editingRow?.infraestructura || 0} onChange={(_, v) => handleModalChange('infraestructura', v)}><NumberInputField /></NumberInput></FormControl>
                        <FormControl><FormLabel>Materiales</FormLabel><NumberInput value={editingRow?.materiales || 0} onChange={(_, v) => handleModalChange('materiales', v)}><NumberInputField /></NumberInput></FormControl>
                        <FormControl><FormLabel>MO</FormLabel><NumberInput value={editingRow?.mo || 0} onChange={(_, v) => handleModalChange('mo', v)}><NumberInputField /></NumberInput></FormControl>
                        <FormControl><FormLabel>Equipos</FormLabel><NumberInput value={editingRow?.equipos || 0} onChange={(_, v) => handleModalChange('equipos', v)}><NumberInputField /></NumberInput></FormControl>
                    </VStack></ModalBody>
                    <ModalFooter><Button variant="ghost" mr={3} onClick={onClose}>Cancelar</Button><Button colorScheme="blue" onClick={handleSave}>Guardar</Button></ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
};

const CostoXViviendaTable = ({ data, fetchData, selectedProyecto }: { data: CostoXVivienda[], fetchData: () => Promise<void>, selectedProyecto: string }) => {
    const [editingRow, setEditingRow] = useState<Partial<CostoXVivienda> | null>(null);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const toast = useToast();

    const handleSave = async () => {
        if (!editingRow) return;
        try {
            if (editingRow.id) {
                await costoXViviendaApi.update(editingRow.id, editingRow as CostoXViviendaUpdate);
            } else {
                await costoXViviendaApi.create(editingRow as CostoXViviendaCreate);
            }
            toast({ title: 'Éxito', description: 'Registro guardado.', status: 'success' });
            onClose();
            fetchData();
        } catch (error) {
            toast({ title: 'Error', description: 'No se pudo guardar el registro.', status: 'error' });
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('¿Está seguro?')) return;
        try {
            await costoXViviendaApi.delete(id);
            toast({ title: 'Éxito', description: 'Registro eliminado.', status: 'success' });
            fetchData();
        } catch (error) {
            toast({ title: 'Error', description: 'No se pudo eliminar.', status: 'error' });
        }
    };

    const openModal = (row: Partial<CostoXVivienda> | null) => {
        setEditingRow(row ? { ...row } : { viviendas: 0, materiales: 0, mo: 0, otros: 0 });
        onOpen();
    };

    const handleModalChange = (field: keyof CostoXVivienda, value: any) => {
        setEditingRow(prev => prev ? { ...prev, [field]: value } : null);
    };

    return (
        <Box>
            <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={() => openModal(null)} mb={4}>Agregar</Button>
            <TableContainer>
                <Table variant="striped" size="sm">
                    <Thead><Tr><Th isNumeric>Viviendas</Th><Th isNumeric>Materiales</Th><Th isNumeric>M.O</Th><Th isNumeric>Otros</Th><Th>Acciones</Th></Tr></Thead>
                    <Tbody>
                        {data.map((row) => (
                            <Tr key={row.id}>
                                <Td isNumeric>{row.viviendas}</Td>
                                <Td isNumeric>{formatCurrency(row.materiales)}</Td>
                                <Td isNumeric>{formatCurrency(row.mo)}</Td>
                                <Td isNumeric>{formatCurrency(row.otros)}</Td>
                                <Td><HStack spacing={2}><IconButton aria-label="Edit" icon={<EditIcon />} size="sm" onClick={() => openModal(row)} /><IconButton aria-label="Delete" icon={<DeleteIcon />} size="sm" colorScheme="red" onClick={() => handleDelete(row.id)} /></HStack></Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </TableContainer>
            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalOverlay /><ModalContent>
                    <ModalHeader>{editingRow?.id ? 'Editar' : 'Nuevo'} Registro</ModalHeader><ModalCloseButton />
                    <ModalBody><VStack spacing={4}>
                        <FormControl isRequired><FormLabel>Viviendas</FormLabel><NumberInput value={editingRow?.viviendas || 0} onChange={(_, v) => handleModalChange('viviendas', v)}><NumberInputField /></NumberInput></FormControl>
                        <FormControl><FormLabel>Materiales</FormLabel><NumberInput value={editingRow?.materiales || 0} onChange={(_, v) => handleModalChange('materiales', v)}><NumberInputField /></NumberInput></FormControl>
                        <FormControl><FormLabel>M.O</FormLabel><NumberInput value={editingRow?.mo || 0} onChange={(_, v) => handleModalChange('mo', v)}><NumberInputField /></NumberInput></FormControl>
                        <FormControl><FormLabel>Otros</FormLabel><NumberInput value={editingRow?.otros || 0} onChange={(_, v) => handleModalChange('otros', v)}><NumberInputField /></NumberInput></FormControl>
                    </VStack></ModalBody>
                    <ModalFooter><Button variant="ghost" mr={3} onClick={onClose}>Cancelar</Button><Button colorScheme="blue" onClick={handleSave}>Guardar</Button></ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
};

// Dynamic period logic (3 months before, 36 after current month)
const getDynamicPeriods = () => {
  const now = new Date();
  const months: string[] = [];
  const start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  for (let i = 0; i < 39; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    months.push(`${d.getFullYear()}_${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  // Group by 12 months per tab
  const periods = [];
  for (let i = 0; i < months.length; i += 12) {
    periods.push(months.slice(i, i + 12));
  }
  return periods;
};
const dynamicPeriods = getDynamicPeriods();
const formatMonth = (monthKey: string) => {
  const [year, month] = monthKey.split('_');
  const monthNames = {
    '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril',
    '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto',
    '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre'
  } as const;
  return `${monthNames[month as keyof typeof monthNames]} ${year}`;
};

export default function CostoDirectoCombinedTablePage() {
    // For the new tab, fetch both datasets and compute totals
    const [costoDirectoData, setCostoDirectoData] = useState<CostoDirecto[]>([]);
    const [costoXViviendaData, setCostoXViviendaData] = useState<CostoXVivienda[]>([]);
    const [totals, setTotals] = useState<CostosDirectosTotales | null>(null);
    const [loading, setLoading] = useState(false);
    const [proyectos, setProyectos] = useState<{ keyword: string, display_name: string }[]>([]);
    const [selectedProyecto, setSelectedProyecto] = useState<string>('');
    const toast = useToast();
    const [infraPagos, setInfraPagos] = useState<any[]>([]);
    const [pagoModal, setPagoModal] = useState<{ open: boolean, tipo: 'material' | 'mano_obra' | null }>({ open: false, tipo: null });
    const [pagoForm, setPagoForm] = useState<{ monto: number, mes: number, detalles: string }>({ monto: 0, mes: 1, detalles: '' });
    const [pagoLoading, setPagoLoading] = useState(false);
    const [viviendaPagos, setViviendaPagos] = useState<any[]>([]);
    const [viviendaPagoModal, setViviendaPagoModal] = useState<{ open: boolean, tipo: 'material' | 'mano_obra' | null }>({ open: false, tipo: null });
    const [viviendaPagoForm, setViviendaPagoForm] = useState<{ monto: number, mes: number, detalles: string }>({ monto: 0, mes: 1, detalles: '' });
    const [viviendaPagoLoading, setViviendaPagoLoading] = useState(false);

    useEffect(() => {
      projectsApi.getAll().then(res => {
        setProyectos(res.data.projects);
        if (res.data.projects.length > 0 && !selectedProyecto) setSelectedProyecto(res.data.projects[0].keyword);
      });
    }, [selectedProyecto]);

    const fetchData = async () => {
      setLoading(true);
      try {
        const params = selectedProyecto ? { params: { proyecto: selectedProyecto } } : {};
        const [cdRes, cxvRes, totalsRes] = await Promise.all([
          apiClient.costoDirecto.getAll(params),
          apiClient.costoXViviendaApi.getAll(params),
          apiClient.costoDirecto.getTotals(params),
        ]);
        setCostoDirectoData(cdRes.data);
        setCostoXViviendaData(cxvRes.data);
        setTotals(totalsRes.data);
      } catch (e) {
        toast({ title: 'Error', description: 'No se pudieron cargar los datos', status: 'error' });
      } finally {
        setLoading(false);
      }
    };

    // Fetch pagos
    const fetchInfraPagos = async () => {
      if (!selectedProyecto) return;
      try {
        const res = await getInfraestructuraPagos({ params: { proyecto: selectedProyecto } });
        setInfraPagos(res.data);
      } catch (e) {
        toast({ title: 'Error', description: 'No se pudieron cargar los pagos', status: 'error' });
      }
    };

    // Fetch vivienda pagos
    const fetchViviendaPagos = async () => {
      if (!selectedProyecto) return;
      try {
        const res = await getViviendaPagos({ params: { proyecto: selectedProyecto } });
        setViviendaPagos(res.data);
      } catch (e) {
        toast({ title: 'Error', description: 'No se pudieron cargar los pagos de viviendas', status: 'error' });
      }
    };

    // Fetch all data (add vivienda pagos)
    const fetchAll = async () => {
      await Promise.all([fetchData(), fetchInfraPagos(), fetchViviendaPagos()]);
    };

    useEffect(() => {
      if (selectedProyecto) fetchAll();
    }, [selectedProyecto]);

    // Calculate balances
    const totalMaterial = totals?.costo_total_materiales_infraestructura || 0;
    const totalManoObra = totals?.mano_de_obra_infraestructura || 0;
    const pagosMaterial = infraPagos.filter(p => p.tipo === 'material').reduce((sum, p) => sum + p.monto, 0);
    const pagosManoObra = infraPagos.filter(p => p.tipo === 'mano_obra').reduce((sum, p) => sum + p.monto, 0);
    const balanceMaterial = totalMaterial - pagosMaterial;
    const balanceManoObra = totalManoObra - pagosManoObra;

    // Calculate balances for viviendas
    const totalMaterialViviendas = totals?.costo_total_materiales_viviendas || 0;
    const totalManoObraVivienda = totals?.mano_de_obra_vivienda || 0;
    const pagosMaterialViviendas = viviendaPagos.filter(p => p.tipo === 'material').reduce((sum, p) => sum + p.monto, 0);
    const pagosManoObraVivienda = viviendaPagos.filter(p => p.tipo === 'mano_obra').reduce((sum, p) => sum + p.monto, 0);
    const balanceMaterialViviendas = totalMaterialViviendas - pagosMaterialViviendas;
    const balanceManoObraVivienda = totalManoObraVivienda - pagosManoObraVivienda;

    // Payments by month
    const pagosByMonth = (tipo: 'material' | 'mano_obra') => {
      const arr = Array(12).fill(0);
      infraPagos.filter(p => p.tipo === tipo).forEach(p => {
        if (p.mes >= 1 && p.mes <= 12) arr[p.mes - 1] += p.monto;
      });
      return arr;
    };
    const pagosMaterialByMonth = pagosByMonth('material');
    const pagosManoObraByMonth = pagosByMonth('mano_obra');

    // Payments by month for viviendas
    const pagosViviendaByMonth = (tipo: 'material' | 'mano_obra') => {
      const arr = Array(12).fill(0);
      viviendaPagos.filter(p => p.tipo === tipo).forEach(p => {
        if (p.mes >= 1 && p.mes <= 12) arr[p.mes - 1] += p.monto;
      });
      return arr;
    };
    const pagosMaterialViviendasByMonth = pagosViviendaByMonth('material');
    const pagosManoObraViviendaByMonth = pagosViviendaByMonth('mano_obra');

    // Handle modal
    const openPagoModal = (tipo: 'material' | 'mano_obra') => {
      setPagoForm({ monto: 0, mes: 1, detalles: '' });
      setPagoModal({ open: true, tipo });
    };
    const closePagoModal = () => setPagoModal({ open: false, tipo: null });
    const handlePagoFormChange = (field: string, value: any) => setPagoForm(f => ({ ...f, [field]: value }));
    const handlePagoSubmit = async () => {
      if (!pagoModal.tipo) return;
      setPagoLoading(true);
      try {
        await createInfraestructuraPago({
          proyecto: selectedProyecto,
          tipo: pagoModal.tipo,
          monto: pagoForm.monto,
          mes: pagoForm.mes,
          detalles: pagoForm.detalles
        });
        toast({ title: 'Pago registrado', status: 'success' });
        closePagoModal();
        fetchInfraPagos();
      } catch (e) {
        toast({ title: 'Error', description: 'No se pudo registrar el pago', status: 'error' });
      } finally {
        setPagoLoading(false);
      }
    };

    // Modal handlers for viviendas
    const openViviendaPagoModal = (tipo: 'material' | 'mano_obra') => {
      setViviendaPagoForm({ monto: 0, mes: 1, detalles: '' });
      setViviendaPagoModal({ open: true, tipo });
    };
    const closeViviendaPagoModal = () => setViviendaPagoModal({ open: false, tipo: null });
    const handleViviendaPagoFormChange = (field: string, value: any) => setViviendaPagoForm(f => ({ ...f, [field]: value }));
    const handleViviendaPagoSubmit = async () => {
      if (!viviendaPagoModal.tipo) return;
      setViviendaPagoLoading(true);
      try {
        await createViviendaPago({
          proyecto: selectedProyecto,
          tipo: viviendaPagoModal.tipo,
          monto: viviendaPagoForm.monto,
          mes: viviendaPagoForm.mes,
          detalles: viviendaPagoForm.detalles
        });
        toast({ title: 'Pago registrado', status: 'success' });
        closeViviendaPagoModal();
        fetchViviendaPagos();
      } catch (e) {
        toast({ title: 'Error', description: 'No se pudo registrar el pago', status: 'error' });
      } finally {
        setViviendaPagoLoading(false);
      }
    };

    return (
      <Box p={4}>
        <Heading size="lg" mb={6}>Gestionar Costos Directos</Heading>
        <Select
          placeholder="Selecciona un proyecto"
          value={selectedProyecto}
          onChange={e => setSelectedProyecto(e.target.value)}
          mb={4}
          maxW="300px"
        >
          {proyectos.map(proj => (
            <option key={proj.keyword} value={proj.keyword}>{proj.display_name}</option>
          ))}
        </Select>
        <Tabs isFitted variant="enclosed">
          <TabList mb="1em">
            <Tab>Costo Directo General</Tab>
            <Tab>Costo por Vivienda</Tab>
            <Tab>Vista Total Costos Directos</Tab>
            <Tab>Flujo Infraestructura</Tab>
            <Tab>Flujo Viviendas</Tab>
          </TabList>
          <TabPanels>
            <TabPanel><CostoDirectoTable data={costoDirectoData} fetchData={fetchData} selectedProyecto={selectedProyecto} /></TabPanel>
            <TabPanel><CostoXViviendaTable data={costoXViviendaData} fetchData={fetchData} selectedProyecto={selectedProyecto} /></TabPanel>
            <TabPanel>
              {loading ? (
                <Box p={4} display="flex" justifyContent="center"><Spinner size="xl" /></Box>
              ) : (
                <TableContainer>
                  <Table size="sm" variant="simple">
                    <Tbody>
                      <Tr>
                        <Td><b>Costo Total Materiales Infraestructura</b></Td>
                        <Td isNumeric>{totals ? formatCurrency(totals.costo_total_materiales_infraestructura) : '-'}</Td>
                      </Tr>
                      <Tr>
                        <Td><b>Costo Total Materiales Viviendas</b></Td>
                        <Td isNumeric>{totals ? totals.costo_total_materiales_viviendas.toLocaleString('en-US') : '-'}</Td>
                      </Tr>
                      <Tr>
                        <Td><b>Mano de Obra Infraestructura</b></Td>
                        <Td isNumeric>{totals ? formatCurrency(totals.mano_de_obra_infraestructura) : '-'}</Td>
                      </Tr>
                      <Tr>
                        <Td><b>Mano de Obra Vivienda</b></Td>
                        <Td isNumeric>{totals ? totals.mano_de_obra_vivienda.toLocaleString('en-US') : '-'}</Td>
                      </Tr>
                    </Tbody>
                  </Table>
                </TableContainer>
              )}
            </TabPanel>
            <TabPanel>
              <Box mb={4} display="flex" gap={8} alignItems="flex-start">
                <VStack align="flex-start" spacing={2}>
                  <Text fontWeight="bold">Material Infraestructura</Text>
                  <Text>Saldo: {formatCurrency(balanceMaterial)}</Text>
                  <Button size="sm" colorScheme="blue" onClick={() => openPagoModal('material')}>Hacer Pago</Button>
                </VStack>
                <VStack align="flex-start" spacing={2}>
                  <Text fontWeight="bold">Mano de Obra Infraestructura</Text>
                  <Text>Saldo: {formatCurrency(balanceManoObra)}</Text>
                  <Button size="sm" colorScheme="blue" onClick={() => openPagoModal('mano_obra')}>Hacer Pago</Button>
                </VStack>
              </Box>
              <Tabs>
                <TabList>
                  {dynamicPeriods.map((months, idx) => (
                    <Tab key={idx}>Periodo {idx + 1}</Tab>
                  ))}
                </TabList>
                <TabPanels>
                  {dynamicPeriods.map((months, idx) => (
                    <TabPanel key={idx}>
                      <TableContainer>
                        <Table size="sm" variant="simple">
                          <Thead>
                            <Tr>
                              <Th></Th>
                              {months.map(m => <Th key={m}>{formatMonth(m)}</Th>)}
                              <Th>TOTAL</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            <Tr>
                              <Td>Material Infraestructura</Td>
                              {months.map((m, i) => <Td key={m} isNumeric>{pagosMaterialByMonth[dynamicPeriods.flat().indexOf(m)] ? formatCurrency(pagosMaterialByMonth[dynamicPeriods.flat().indexOf(m)]) : ''}</Td>)}
                              <Td isNumeric>{formatCurrency(pagosMaterial)}</Td>
                            </Tr>
                            <Tr>
                              <Td>Mano de Obra Infraestructura</Td>
                              {months.map((m, i) => <Td key={m} isNumeric>{pagosManoObraByMonth[dynamicPeriods.flat().indexOf(m)] ? formatCurrency(pagosManoObraByMonth[dynamicPeriods.flat().indexOf(m)]) : ''}</Td>)}
                              <Td isNumeric>{formatCurrency(pagosManoObra)}</Td>
                            </Tr>
                          </Tbody>
                        </Table>
                      </TableContainer>
                    </TabPanel>
                  ))}
                </TabPanels>
              </Tabs>
              <Box mt={6}>
                <Heading size="sm" mb={2}>Pagos Registrados</Heading>
                <TableContainer>
                  <Table size="sm" variant="striped">
                    <Thead>
                      <Tr>
                        <Th>Tipo</Th>
                        <Th>Monto</Th>
                        <Th>Mes</Th>
                        <Th>Detalles</Th>
                        <Th>Acciones</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {infraPagos.map(p => (
                        <Tr key={p.id}>
                          <Td>{p.tipo === 'material' ? 'Material Infraestructura' : 'Mano de Obra Infraestructura'}</Td>
                          <Td isNumeric>{formatCurrency(p.monto)}</Td>
                          <Td>{['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][p.mes-1]}</Td>
                          <Td>{p.detalles}</Td>
                          <Td><IconButton aria-label="Eliminar" icon={<DeleteIcon />} size="sm" colorScheme="red" onClick={async () => {
                            if (window.confirm('¿Eliminar este pago?')) {
                              try {
                                await deleteInfraestructuraPago(p.id);
                                toast({ title: 'Pago eliminado', status: 'success' });
                                fetchInfraPagos();
                              } catch (e) {
                                toast({ title: 'Error', description: 'No se pudo eliminar el pago', status: 'error' });
                              }
                            }
                          }} /></Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </Box>
              <Modal isOpen={pagoModal.open} onClose={closePagoModal} isCentered>
                <ModalOverlay />
                <ModalContent>
                  <ModalHeader>Hacer Pago - {pagoModal.tipo === 'material' ? 'Material Infraestructura' : 'Mano de Obra Infraestructura'}</ModalHeader>
                  <ModalCloseButton />
                  <ModalBody>
                    <VStack spacing={4}>
                      <FormControl isRequired>
                        <FormLabel>Monto</FormLabel>
                        <NumberInput value={pagoForm.monto} min={0} onChange={(_, v) => handlePagoFormChange('monto', v)}><NumberInputField /></NumberInput>
                      </FormControl>
                      <FormControl isRequired>
                        <FormLabel>Mes</FormLabel>
                        <Select value={pagoForm.mes} onChange={e => handlePagoFormChange('mes', Number(e.target.value))}>
                          {['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'].map((m, idx) => (
                            <option key={idx+1} value={idx+1}>{m}</option>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl>
                        <FormLabel>Detalles</FormLabel>
                        <Input value={pagoForm.detalles} onChange={e => handlePagoFormChange('detalles', e.target.value)} />
                      </FormControl>
                    </VStack>
                  </ModalBody>
                  <ModalFooter>
                    <Button variant="ghost" mr={3} onClick={closePagoModal}>Cancelar</Button>
                    <Button colorScheme="blue" onClick={handlePagoSubmit} isLoading={pagoLoading}>OK</Button>
                  </ModalFooter>
                </ModalContent>
              </Modal>
            </TabPanel>
            <TabPanel>
              <Box mb={4} display="flex" gap={8} alignItems="flex-start">
                <VStack align="flex-start" spacing={2}>
                  <Text fontWeight="bold">Materiales Viviendas</Text>
                  <Text>Saldo: {formatCurrency(balanceMaterialViviendas)}</Text>
                  <Button size="sm" colorScheme="blue" onClick={() => openViviendaPagoModal('material')}>Hacer Pago</Button>
                </VStack>
                <VStack align="flex-start" spacing={2}>
                  <Text fontWeight="bold">Mano de Obra Vivienda</Text>
                  <Text>Saldo: {formatCurrency(balanceManoObraVivienda)}</Text>
                  <Button size="sm" colorScheme="blue" onClick={() => openViviendaPagoModal('mano_obra')}>Hacer Pago</Button>
                </VStack>
              </Box>
              <Tabs>
                <TabList>
                  {dynamicPeriods.map((months, idx) => (
                    <Tab key={idx}>Periodo {idx + 1}</Tab>
                  ))}
                </TabList>
                <TabPanels>
                  {dynamicPeriods.map((months, idx) => (
                    <TabPanel key={idx}>
                      <TableContainer>
                        <Table size="sm" variant="simple">
                          <Thead>
                            <Tr>
                              <Th></Th>
                              {months.map(m => <Th key={m}>{formatMonth(m)}</Th>)}
                              <Th>TOTAL</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            <Tr>
                              <Td>Materiales Viviendas</Td>
                              {months.map((m, i) => <Td key={m} isNumeric>{pagosMaterialViviendasByMonth[dynamicPeriods.flat().indexOf(m)] ? formatCurrency(pagosMaterialViviendasByMonth[dynamicPeriods.flat().indexOf(m)]) : ''}</Td>)}
                              <Td isNumeric>{formatCurrency(pagosMaterialViviendas)}</Td>
                            </Tr>
                            <Tr>
                              <Td>Mano de Obra Vivienda</Td>
                              {months.map((m, i) => <Td key={m} isNumeric>{pagosManoObraViviendaByMonth[dynamicPeriods.flat().indexOf(m)] ? formatCurrency(pagosManoObraViviendaByMonth[dynamicPeriods.flat().indexOf(m)]) : ''}</Td>)}
                              <Td isNumeric>{formatCurrency(pagosManoObraVivienda)}</Td>
                            </Tr>
                          </Tbody>
                        </Table>
                      </TableContainer>
                    </TabPanel>
                  ))}
                </TabPanels>
              </Tabs>
              <Box mt={6}>
                <Heading size="sm" mb={2}>Pagos Registrados</Heading>
                <TableContainer>
                  <Table size="sm" variant="striped">
                    <Thead>
                      <Tr>
                        <Th>Tipo</Th>
                        <Th>Monto</Th>
                        <Th>Mes</Th>
                        <Th>Detalles</Th>
                        <Th>Acciones</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {viviendaPagos.map(p => (
                        <Tr key={p.id}>
                          <Td>{p.tipo === 'material' ? 'Materiales Viviendas' : 'Mano de Obra Vivienda'}</Td>
                          <Td isNumeric>{formatCurrency(p.monto)}</Td>
                          <Td>{['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][p.mes-1]}</Td>
                          <Td>{p.detalles}</Td>
                          <Td><IconButton aria-label="Eliminar" icon={<DeleteIcon />} size="sm" colorScheme="red" onClick={async () => {
                            if (window.confirm('¿Eliminar este pago?')) {
                              try {
                                await deleteViviendaPago(p.id);
                                toast({ title: 'Pago eliminado', status: 'success' });
                                fetchViviendaPagos();
                              } catch (e) {
                                toast({ title: 'Error', description: 'No se pudo eliminar el pago', status: 'error' });
                              }
                            }
                          }} /></Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </Box>
              <Modal isOpen={viviendaPagoModal.open} onClose={closeViviendaPagoModal} isCentered>
                <ModalOverlay />
                <ModalContent>
                  <ModalHeader>Hacer Pago - {viviendaPagoModal.tipo === 'material' ? 'Materiales Viviendas' : 'Mano de Obra Vivienda'}</ModalHeader>
                  <ModalCloseButton />
                  <ModalBody>
                    <VStack spacing={4}>
                      <FormControl isRequired>
                        <FormLabel>Monto</FormLabel>
                        <NumberInput value={viviendaPagoForm.monto} min={0} onChange={(_, v) => handleViviendaPagoFormChange('monto', v)}><NumberInputField /></NumberInput>
                      </FormControl>
                      <FormControl isRequired>
                        <FormLabel>Mes</FormLabel>
                        <Select value={viviendaPagoForm.mes} onChange={e => handleViviendaPagoFormChange('mes', Number(e.target.value))}>
                          {['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'].map((m, idx) => (
                            <option key={idx+1} value={idx+1}>{m}</option>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl>
                        <FormLabel>Detalles</FormLabel>
                        <Input value={viviendaPagoForm.detalles} onChange={e => handleViviendaPagoFormChange('detalles', e.target.value)} />
                      </FormControl>
                    </VStack>
                  </ModalBody>
                  <ModalFooter>
                    <Button variant="ghost" mr={3} onClick={closeViviendaPagoModal}>Cancelar</Button>
                    <Button colorScheme="blue" onClick={handleViviendaPagoSubmit} isLoading={viviendaPagoLoading}>OK</Button>
                  </ModalFooter>
                </ModalContent>
              </Modal>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    );
} 