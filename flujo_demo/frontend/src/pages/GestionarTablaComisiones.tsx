console.log('<<<<< GestionarTablaComisiones.tsx MODULE IS BEING LOADED >>>>>');

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
  Spinner,
  Alert,
  AlertIcon,
  Select,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Textarea
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon, DownloadIcon } from '@chakra-ui/icons';
import { vendedoresApi, type Vendedor } from '../api/api';
import * as XLSX from 'xlsx';

// Interface for the full sales commission structure
interface SalesCommissionRecord {
  id: number;
  entidad?: string;
  etapa?: string;
  inmueble?: string;
  modelo?: string;
  n_proceso_entrega?: string;
  contrato_firmado_con?: string;
  nombre_del_banco?: string;
  identificacion?: string;
  ingreso?: string;
  fecha_empleo?: string;
  tiempo_trabajando?: string;
  profesion?: string;
  fecha_ingreso_al?: string;
  cotitular?: string;
  vendedor?: string;
  fecha_reserva?: string;
  servicio?: string;
  cpf?: string;
  importe_cpf?: number;
  fecha_venta?: string;
  fecha_ingreso_etapa?: string;
  ultima_etapa?: string;
  responsable?: string;
  personal_comisiones?: Record<string, number>;
  created_at?: string;
  cliente?: string;
  producto_servicio?: string;
  monto_venta?: number;
}

export default function GestionarTablaComisiones() {
  const [data, setData] = useState<SalesCommissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<SalesCommissionRecord | null>(null);
  const [formData, setFormData] = useState<Partial<SalesCommissionRecord>>({});
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [loadingVendedores, setLoadingVendedores] = useState(false);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast(); 

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch from the comisiones-data endpoint which returns the full structure
      const response = await fetch('http://localhost:8000/api/ventas/comisiones-data');
      if (!response.ok) {
        throw new Error('Failed to fetch commission data');
      }
      const result = await response.json();
      setData(result || []);
    } catch (err: any) {
      console.error('Error fetching commission data:', err);
      setError('No se pudieron cargar los datos de comisiones.');
      toast({
        title: 'Error de Datos',
        description: 'No se pudo cargar los datos de comisiones correctamente.',
        status: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchVendedores = async () => {
    setLoadingVendedores(true);
    try {
      const response = await vendedoresApi.getAll();
      if (response?.data && Array.isArray(response.data)) {
        setVendedores(response.data);
      } else {
        setVendedores([]);
      }
    } catch (err: any) {
      console.error('Error fetching vendedores:', err);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los vendedores.',
        status: 'error'
      });
    } finally {
      setLoadingVendedores(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedYear]);

  useEffect(() => {
    fetchVendedores();
  }, []);

  const handleEdit = (row: SalesCommissionRecord) => {
    setEditingRow(row);
    setFormData({
      ...row,
      personal_comisiones: row.personal_comisiones || {}
    });
    onOpen();
  };

  const handleAdd = () => {
    setEditingRow(null);
    setFormData({
      fecha_venta: new Date().toISOString().split('T')[0],
      cliente: '',
      producto_servicio: '',
      monto_venta: 0,
      vendedor: '',
      personal_comisiones: {}
    });
    onOpen();
  };

  const handleSave = async () => {
    try {
      const saveData = {
        ...formData,
        monto_venta: Number(formData.monto_venta) || 0,
        importe_cpf: Number(formData.importe_cpf) || 0
      };

      if (editingRow) {
        // Update existing record
        const response = await fetch(`http://localhost:8000/api/ventas/plantilla-comisiones/${editingRow.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(saveData),
        });
        
        if (!response.ok) {
          throw new Error('Failed to update record');
        }
        
        toast({
          title: 'Éxito',
          description: 'Registro actualizado correctamente',
          status: 'success',
        });
      } else {
        // Create new record
        const response = await fetch('http://localhost:8000/api/ventas/plantilla-comisiones/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(saveData),
        });
        
        if (!response.ok) {
          throw new Error('Failed to create record');
        }
        
        toast({
          title: 'Éxito',
          description: 'Registro creado correctamente',
          status: 'success',
        });
      }
      onClose();
      fetchData();
    } catch (err: any) {
      console.error('Error saving data:', err);
      toast({
        title: 'Error',
        description: 'No se pudo guardar el registro',
        status: 'error',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar este registro?')) {
      try {
        const response = await fetch(`http://localhost:8000/api/ventas/plantilla-comisiones/${id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete record');
        }
        
        toast({
          title: 'Éxito',
          description: 'Registro eliminado correctamente',
          status: 'success',
        });
        fetchData();
      } catch (err: any) {
        console.error('Error deleting data:', err);
        toast({
          title: 'Error',
          description: 'No se pudo eliminar el registro',
          status: 'error',
        });
      }
    }
  };

  const handleExport = () => {
    if (data.length === 0) {
      toast({
        title: 'Sin datos',
        description: 'No hay datos para exportar',
        status: 'warning',
      });
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Comisiones');
    XLSX.writeFile(workbook, `comisiones_ventas_${selectedYear}.xlsx`);
    
      toast({
      title: 'Exportación exitosa',
      description: 'Los datos se han exportado correctamente',
      status: 'success',
    });
  };

  if (loading) return <Spinner />;
  if (error) return <Alert status="error"><AlertIcon />Error: {error}</Alert>;

    return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        <HStack justifyContent="space-between">
          <Heading as="h1" size="xl">
            Gestionar Tabla de Comisiones de Ventas
          </Heading>
          <Button colorScheme="gray" onClick={() => window.history.back()}>
            Volver al Dashboard
          </Button>
        </HStack>

        <Tabs variant="enclosed">
          <TabList>
            <Tab>{selectedYear}</Tab>
            {years.filter(y => y !== selectedYear).slice(0, 3).map(year => (
              <Tab key={year} onClick={() => setSelectedYear(year)}>{year}</Tab>
            ))}
          </TabList>
          <TabPanels>
            <TabPanel p={0} pt={4}>
              <VStack spacing={4} align="stretch">
                <HStack justifyContent="space-between">
                  <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={handleAdd}>
                    Agregar Registro
                  </Button>
                  <Button leftIcon={<DownloadIcon />} colorScheme="green" onClick={handleExport}>
                    Exportar Excel
                  </Button>
                </HStack>

      <TableContainer>
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
                        <Th>ID</Th>
                        <Th>Fecha Venta</Th>
                        <Th>Cliente</Th>
                        <Th>Vendedor</Th>
                        <Th>Producto/Servicio</Th>
                        <Th isNumeric>Monto Venta</Th>
                        <Th>Etapa</Th>
                        <Th>Acciones</Th>
            </Tr>
          </Thead>
          <Tbody>
            {data.map((row) => (
              <Tr key={row.id}>
                          <Td>{row.id}</Td>
                          <Td>{row.fecha_venta ? new Date(row.fecha_venta).toLocaleDateString() : '-'}</Td>
                          <Td>{row.cliente || '-'}</Td>
                          <Td>{row.vendedor || '-'}</Td>
                          <Td>{row.producto_servicio || '-'}</Td>
                          <Td isNumeric>
                            {row.monto_venta?.toLocaleString(undefined, { 
                              style: 'currency', 
                              currency: 'USD' 
                            }) || '$0.00'}
                </Td>
                          <Td>{row.etapa || '-'}</Td>
                          <Td>
                            <HStack spacing={2}>
                              <IconButton
                                aria-label="Editar"
                                icon={<EditIcon />}
                                size="sm"
                                onClick={() => handleEdit(row)}
                              />
                              <IconButton
                                aria-label="Eliminar"
                                icon={<DeleteIcon />}
                                size="sm"
                                colorScheme="red"
                                onClick={() => handleDelete(row.id)}
                              />
                    </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>

                {data.length === 0 && (
                  <Text textAlign="center" color="gray.500">
                    No hay datos de comisiones para el año seleccionado.
                  </Text>
                )}
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>

      {/* Modal for Add/Edit */}
      <Modal isOpen={isOpen} onClose={onClose} size="6xl">
        <ModalOverlay />
        <ModalContent maxW="90vw">
          <ModalHeader>
            {editingRow ? 'Editar Registro de Comisión' : 'Agregar Registro de Comisión'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Tabs>
              <TabList>
                <Tab>Información Básica</Tab>
                <Tab>Detalles del Cliente</Tab>
                <Tab>Proceso y Etapas</Tab>
                <Tab>Comisiones</Tab>
              </TabList>
              <TabPanels>
                {/* Basic Information Tab */}
                <TabPanel>
                  <VStack spacing={4}>
                    <HStack spacing={4} w="100%">
                      <FormControl>
                        <FormLabel>Fecha de Venta</FormLabel>
                        <Input
                          type="date"
                          value={formData.fecha_venta || ''}
                          onChange={(e) => setFormData({ ...formData, fecha_venta: e.target.value })}
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel>Cliente</FormLabel>
                        <Input
                          value={formData.cliente || ''}
                          onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                          placeholder="Nombre del cliente"
                        />
                      </FormControl>
          </HStack>
                    <HStack spacing={4} w="100%">
                      <FormControl>
                        <FormLabel>Producto/Servicio</FormLabel>
                        <Input
                          value={formData.producto_servicio || ''}
                          onChange={(e) => setFormData({ ...formData, producto_servicio: e.target.value })}
                          placeholder="Descripción del producto o servicio"
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel>Monto de Venta</FormLabel>
                        <NumberInput
                          value={formData.monto_venta || 0}
                          onChange={(valueString) => setFormData({ ...formData, monto_venta: parseFloat(valueString) || 0 })}
                          min={0}
                          precision={2}
                        >
                          <NumberInputField />
                        </NumberInput>
                      </FormControl>
        </HStack>
                    <HStack spacing={4} w="100%">
          <FormControl>
                        <FormLabel>Vendedor</FormLabel>
                        <Select
                          value={formData.vendedor || ''}
                          onChange={(e) => setFormData({ ...formData, vendedor: e.target.value })}
                          placeholder="Seleccionar vendedor"
                        >
                          {vendedores.map((vendedor) => (
                            <option key={vendedor.id} value={vendedor.nombre}>
                              {vendedor.nombre}
                            </option>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl>
                        <FormLabel>Identificación</FormLabel>
                        <Input
                          value={formData.identificacion || ''}
                          onChange={(e) => setFormData({ ...formData, identificacion: e.target.value })}
                          placeholder="Cédula o identificación del cliente"
                        />
                      </FormControl>
                    </HStack>
                  </VStack>
                </TabPanel>

                {/* Client Details Tab */}
                <TabPanel>
                  <VStack spacing={4}>
                    <HStack spacing={4} w="100%">
                      <FormControl>
                        <FormLabel>Entidad</FormLabel>
                        <Input
                          value={formData.entidad || ''}
                          onChange={(e) => setFormData({ ...formData, entidad: e.target.value })}
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel>Nombre del Banco</FormLabel>
                        <Input
                          value={formData.nombre_del_banco || ''}
                          onChange={(e) => setFormData({ ...formData, nombre_del_banco: e.target.value })}
                        />
                      </FormControl>
                    </HStack>
                    <HStack spacing={4} w="100%">
                      <FormControl>
                        <FormLabel>Ingreso</FormLabel>
                        <Input
                          value={formData.ingreso || ''}
                          onChange={(e) => setFormData({ ...formData, ingreso: e.target.value })}
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel>Profesión</FormLabel>
                        <Input
                          value={formData.profesion || ''}
                          onChange={(e) => setFormData({ ...formData, profesion: e.target.value })}
                        />
                      </FormControl>
                    </HStack>
                    <HStack spacing={4} w="100%">
                      <FormControl>
                        <FormLabel>Fecha de Empleo</FormLabel>
                        <Input
                          type="date"
                          value={formData.fecha_empleo || ''}
                          onChange={(e) => setFormData({ ...formData, fecha_empleo: e.target.value })}
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel>Tiempo Trabajando</FormLabel>
                        <Input
                          value={formData.tiempo_trabajando || ''}
                          onChange={(e) => setFormData({ ...formData, tiempo_trabajando: e.target.value })}
                        />
                      </FormControl>
                    </HStack>
                    <HStack spacing={4} w="100%">
                      <FormControl>
                        <FormLabel>Cotitular</FormLabel>
                        <Input
                          value={formData.cotitular || ''}
                          onChange={(e) => setFormData({ ...formData, cotitular: e.target.value })}
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel>Contrato Firmado Con</FormLabel>
                        <Input
                          value={formData.contrato_firmado_con || ''}
                          onChange={(e) => setFormData({ ...formData, contrato_firmado_con: e.target.value })}
                        />
                      </FormControl>
                    </HStack>
                  </VStack>
                </TabPanel>

                {/* Process and Stages Tab */}
                <TabPanel>
                  <VStack spacing={4}>
                    <HStack spacing={4} w="100%">
                      <FormControl>
                        <FormLabel>Etapa</FormLabel>
                        <Input
                          value={formData.etapa || ''}
                          onChange={(e) => setFormData({ ...formData, etapa: e.target.value })}
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel>Última Etapa</FormLabel>
                        <Input
                          value={formData.ultima_etapa || ''}
                          onChange={(e) => setFormData({ ...formData, ultima_etapa: e.target.value })}
                        />
                      </FormControl>
                    </HStack>
                    <HStack spacing={4} w="100%">
                      <FormControl>
                        <FormLabel>Inmueble</FormLabel>
                        <Input
                          value={formData.inmueble || ''}
                          onChange={(e) => setFormData({ ...formData, inmueble: e.target.value })}
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel>Modelo</FormLabel>
                        <Input
                          value={formData.modelo || ''}
                          onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                        />
                      </FormControl>
                    </HStack>
                    <HStack spacing={4} w="100%">
                      <FormControl>
                        <FormLabel>N° Proceso Entrega</FormLabel>
                        <Input
                          value={formData.n_proceso_entrega || ''}
                          onChange={(e) => setFormData({ ...formData, n_proceso_entrega: e.target.value })}
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel>Fecha Ingreso Etapa</FormLabel>
                        <Input
                          type="date"
                          value={formData.fecha_ingreso_etapa || ''}
                          onChange={(e) => setFormData({ ...formData, fecha_ingreso_etapa: e.target.value })}
                        />
                      </FormControl>
                    </HStack>
                    <HStack spacing={4} w="100%">
                      <FormControl>
                        <FormLabel>Fecha Reserva</FormLabel>
                        <Input
                          type="date"
                          value={formData.fecha_reserva || ''}
                          onChange={(e) => setFormData({ ...formData, fecha_reserva: e.target.value })}
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel>Responsable</FormLabel>
                        <Input
                          value={formData.responsable || ''}
                          onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                        />
                      </FormControl>
                    </HStack>
                    <HStack spacing={4} w="100%">
                      <FormControl>
                        <FormLabel>Servicio</FormLabel>
                        <Input
                          value={formData.servicio || ''}
                          onChange={(e) => setFormData({ ...formData, servicio: e.target.value })}
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel>CPF</FormLabel>
              <Input 
                          value={formData.cpf || ''}
                          onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                        />
                      </FormControl>
            </HStack>
                    <FormControl>
                      <FormLabel>Importe CPF</FormLabel>
                      <NumberInput
                        value={formData.importe_cpf || 0}
                        onChange={(valueString) => setFormData({ ...formData, importe_cpf: parseFloat(valueString) || 0 })}
                        min={0}
                        precision={2}
                      >
                        <NumberInputField />
                      </NumberInput>
                    </FormControl>
                  </VStack>
                </TabPanel>

                {/* Commissions Tab */}
                <TabPanel>
                  <VStack spacing={4}>
                    <Text fontWeight="bold">Comisiones Personales</Text>
                    <Text fontSize="sm" color="gray.600">
                      Formato JSON para comisiones por vendedor. Ejemplo: {`{"1": 500.0, "2": 300.0}`}
                    </Text>
                    <FormControl>
                      <FormLabel>Personal Comisiones (JSON)</FormLabel>
                      <Textarea
                        value={JSON.stringify(formData.personal_comisiones || {}, null, 2)}
                        onChange={(e) => {
                          try {
                            const parsed = JSON.parse(e.target.value);
                            setFormData({ ...formData, personal_comisiones: parsed });
                          } catch (err) {
                            // Invalid JSON, keep the text but don't update the object
                          }
                        }}
                        placeholder='{"vendedor_id": monto_comision}'
                        rows={6}
                      />
          </FormControl>
                    
                    {/* Quick commission entry for each vendedor */}
                    <Box w="100%">
                      <Text fontWeight="bold" mb={2}>Comisiones Rápidas por Vendedor</Text>
                      <VStack spacing={2}>
                        {vendedores.map((vendedor) => (
                          <HStack key={vendedor.id} w="100%">
                            <Text minW="200px">{vendedor.nombre}</Text>
                            <NumberInput
                              value={formData.personal_comisiones?.[vendedor.id.toString()] || 0}
                              onChange={(valueString) => {
                                const newComisiones = { ...formData.personal_comisiones };
                                const value = parseFloat(valueString) || 0;
                                if (value > 0) {
                                  newComisiones[vendedor.id.toString()] = value;
                                } else {
                                  delete newComisiones[vendedor.id.toString()];
                                }
                                setFormData({ ...formData, personal_comisiones: newComisiones });
                              }}
                              min={0}
                              precision={2}
                              size="sm"
                            >
                              <NumberInputField />
                            </NumberInput>
                          </HStack>
                        ))}
                      </VStack>
        </Box>
      </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleSave}>
              Guardar
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}