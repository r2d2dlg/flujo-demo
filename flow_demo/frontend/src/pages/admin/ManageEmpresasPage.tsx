import { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  useToast,
  Spinner,
  Center,
  Button,
  IconButton,
  VStack,
  HStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon, AddIcon } from '@chakra-ui/icons';
import { api } from '../../api/api';

interface Empresa {
  id: number;
  nombre_empresa: string;
  detalle_pago_predeterminado?: string | null;
  monto_fijo_predeterminado?: number | null;
  fecha_venc_predeterminada?: string | null; // Assuming date as string YYYY-MM-DD
  numero_cliente_predeterminado?: string | null;
  forma_pgo_predeterminada?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Interface for the API response when fetching table data
interface ApiResponse<T> {
  columns: string[];
  data: T;
  total_rows?: number;
}

const TABLE_NAME = 'empresas';

export default function ManageEmpresasPage() {
  const toast = useToast();
  const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure();
  const { isOpen: isAlertOpen, onOpen: onAlertOpen, onClose: onAlertClose } = useDisclosure();

  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentEmpresa, setCurrentEmpresa] = useState<Partial<Empresa> | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [empresaToDelete, setEmpresaToDelete] = useState<number | null>(null);

  const columnDisplayNames: { [key: string]: string } = {
    nombre_empresa: 'Nombre Empresa',
    detalle_pago_predeterminado: 'Detalle Predeterminado',
    monto_fijo_predeterminado: 'Monto Fijo Predeterminado',
    fecha_venc_predeterminada: 'Fecha Venc. Predeterminada',
    numero_cliente_predeterminado: 'No. Cliente Predeterminado',
    forma_pgo_predeterminada: 'Forma Pago Predeterminada',
  };

  const visibleColumns = [
    'nombre_empresa',
    'detalle_pago_predeterminado',
    'monto_fijo_predeterminado',
    'fecha_venc_predeterminada',
    'numero_cliente_predeterminado',
    'forma_pgo_predeterminada',
  ];

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get<ApiResponse<Empresa[]>>(`/api/tables/${TABLE_NAME}/data`);
      if (response.data && response.data.data) {
        setEmpresas(response.data.data);
        if (response.data.columns) {
          // Filter out id, created_at, updated_at for general column state if needed elsewhere
          setColumns(response.data.columns.filter(col => col !== 'id' && col !== 'created_at' && col !== 'updated_at'));
        }
      } else {
        setEmpresas([]);
        setColumns([]);
      }
    } catch (error) {
      toast({ title: 'Error al cargar empresas', description: String(error), status: 'error' });
      setEmpresas([]);
      setColumns([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleModalOpen = (empresa?: Empresa) => {
    if (empresa) {
      setIsEditing(true);
      // Format date for input type="date" if it exists
      const formattedEmpresa = {
        ...empresa,
        fecha_venc_predeterminada: empresa.fecha_venc_predeterminada ? empresa.fecha_venc_predeterminada.split('T')[0] : null,
      };
      setCurrentEmpresa(formattedEmpresa);
    } else {
      setIsEditing(false);
      setCurrentEmpresa({
        nombre_empresa: '',
        // Initialize other fields as needed, or leave them for the form to handle
      });
    }
    onModalOpen();
  };

  const handleModalSave = async () => {
    if (!currentEmpresa || !currentEmpresa.nombre_empresa) {
      toast({ title: 'Error', description: 'El nombre de la empresa es obligatorio.', status: 'error'});
      return;
    }

    const dataToSave = { ...currentEmpresa };
    // Ensure numeric fields are numbers or null
    if (dataToSave.monto_fijo_predeterminado !== undefined && dataToSave.monto_fijo_predeterminado !== null && dataToSave.monto_fijo_predeterminado !== '') {
        dataToSave.monto_fijo_predeterminado = Number(dataToSave.monto_fijo_predeterminado);
    } else {
        dataToSave.monto_fijo_predeterminado = null;
    }


    try {
      if (isEditing && currentEmpresa.id) {
        await api.put(`/api/tables/${TABLE_NAME}/rows/${currentEmpresa.id}`, dataToSave);
        toast({ title: 'Empresa actualizada', status: 'success', duration: 2000, isClosable: true });
      } else {
        await api.post(`/api/tables/${TABLE_NAME}/rows`, dataToSave);
        toast({ title: 'Empresa agregada', status: 'success', duration: 2000, isClosable: true });
      }
      fetchData();
      onModalClose();
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || String(error);
      toast({ title: isEditing ? 'Error al actualizar' : 'Error al agregar', description: errorMsg, status: 'error' });
    }
  };

  const handleDeleteConfirmation = (id: number) => {
    setEmpresaToDelete(id);
    onAlertOpen();
  };

  const handleDelete = async () => {
    if (empresaToDelete === null) return;
    try {
      await api.delete(`/api/tables/${TABLE_NAME}/rows/${empresaToDelete}`);
      toast({ title: 'Empresa eliminada', status: 'success', duration: 2000, isClosable: true });
      fetchData();
    } catch (error) {
      toast({ title: 'Error al eliminar empresa', description: String(error), status: 'error' });
    } finally {
      onAlertClose();
      setEmpresaToDelete(null);
    }
  };
  
  const formatFieldValue = (value: any, column: string) => {
    if (value === null || typeof value === 'undefined') return '';
    if (column === 'monto_fijo_predeterminado' && typeof value === 'number') {
      return value.toLocaleString('es-ES', { style: 'currency', currency: 'USD' }); // Adjust currency as needed
    }
    if (column === 'fecha_venc_predeterminada' && typeof value === 'string') {
      try {
        return new Date(value + 'T00:00:00Z').toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
      } catch (e) { return value; } // Fallback if date is not parsable
    }
    return String(value);
  };


  return (
    <Box p={5}>
      <VStack spacing={5} align="stretch">
        <HStack justifyContent="space-between" alignItems="center">
          <Heading as="h1" size="lg">Administrar Empresas</Heading>
          <HStack>
            <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={() => handleModalOpen()}>
              Agregar Empresa
            </Button>
            <Button as={RouterLink} to="/dashboard-contabilidad/presupuesto_gastos_fijos_operativos" colorScheme="gray">
              Volver a Presupuesto
            </Button>
          </HStack>
        </HStack>

        {isLoading ? (
          <Center h="200px"><Spinner size="xl" /></Center>
        ) : (
          <TableContainer>
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  {visibleColumns.map(colKey => (
                    <Th key={colKey}>{columnDisplayNames[colKey] || colKey}</Th>
                  ))}
                  <Th>Acciones</Th>
                </Tr>
              </Thead>
              <Tbody>
                {empresas.map((empresa) => (
                  <Tr key={empresa.id}>
                    {visibleColumns.map(colKey => (
                      <Td key={colKey}>{formatFieldValue(empresa[colKey as keyof Empresa], colKey)}</Td>
                    ))}
                    <Td>
                      <IconButton icon={<EditIcon />} aria-label="Editar" size="sm" mr={2} onClick={() => handleModalOpen(empresa)} />
                      <IconButton icon={<DeleteIcon />} aria-label="Eliminar" colorScheme="red" size="sm" onClick={() => handleDeleteConfirmation(empresa.id)} />
                    </Td>
                  </Tr>
                ))}
                {empresas.length === 0 && !isLoading && (
                    <Tr><Td colSpan={visibleColumns.length + 1} textAlign="center">No hay empresas para mostrar.</Td></Tr>
                )}
              </Tbody>
            </Table>
          </TableContainer>
        )}
      </VStack>

      {/* Modal for Add/Edit */}
      <Modal isOpen={isModalOpen} onClose={onModalClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{isEditing ? 'Editar Empresa' : 'Agregar Nueva Empresa'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl isRequired isInvalid={!currentEmpresa?.nombre_empresa}>
                <FormLabel htmlFor="nombre_empresa">Nombre Empresa</FormLabel>
                <Input
                  id="nombre_empresa"
                  value={currentEmpresa?.nombre_empresa || ''}
                  onChange={(e) => setCurrentEmpresa({ ...currentEmpresa, nombre_empresa: e.target.value })}
                />
              </FormControl>
              <FormControl>
                <FormLabel htmlFor="detalle_pago_predeterminado">Detalle de Pago Predeterminado</FormLabel>
                <Textarea
                  id="detalle_pago_predeterminado"
                  value={currentEmpresa?.detalle_pago_predeterminado || ''}
                  onChange={(e) => setCurrentEmpresa({ ...currentEmpresa, detalle_pago_predeterminado: e.target.value })}
                />
              </FormControl>
              <FormControl>
                <FormLabel htmlFor="monto_fijo_predeterminado">Monto Fijo Predeterminado</FormLabel>
                 <NumberInput 
                    value={currentEmpresa?.monto_fijo_predeterminado ?? undefined}
                    onChange={(_valueAsString, valueAsNumber) => setCurrentEmpresa({ ...currentEmpresa, monto_fijo_predeterminado: Number.isNaN(valueAsNumber) ? null : valueAsNumber })}
                    precision={2} step={0.01}
                  >
                    <NumberInputField id="monto_fijo_predeterminado" />
                    <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                    </NumberInputStepper>
                </NumberInput>
              </FormControl>
              <FormControl>
                <FormLabel htmlFor="fecha_venc_predeterminada">Fecha Venc. Predeterminada</FormLabel>
                <Input
                  id="fecha_venc_predeterminada"
                  type="date"
                  value={currentEmpresa?.fecha_venc_predeterminada || ''}
                  onChange={(e) => setCurrentEmpresa({ ...currentEmpresa, fecha_venc_predeterminada: e.target.value || null })}
                />
              </FormControl>
              <FormControl>
                <FormLabel htmlFor="numero_cliente_predeterminado">No. Cliente Predeterminado</FormLabel>
                <Input
                  id="numero_cliente_predeterminado"
                  value={currentEmpresa?.numero_cliente_predeterminado || ''}
                  onChange={(e) => setCurrentEmpresa({ ...currentEmpresa, numero_cliente_predeterminado: e.target.value })}
                />
              </FormControl>
              <FormControl>
                <FormLabel htmlFor="forma_pgo_predeterminada">Forma de Pago Predeterminada</FormLabel>
                <Input
                  id="forma_pgo_predeterminada"
                  value={currentEmpresa?.forma_pgo_predeterminada || ''}
                  onChange={(e) => setCurrentEmpresa({ ...currentEmpresa, forma_pgo_predeterminada: e.target.value })}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleModalSave}>
              Guardar
            </Button>
            <Button onClick={onModalClose}>Cancelar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog isOpen={isAlertOpen} leastDestructiveRef={undefined} onClose={onAlertClose}>
        <AlertDialogOverlay><AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">Eliminar Empresa</AlertDialogHeader>
            <AlertDialogBody>¿Está seguro de que desea eliminar esta empresa? Esta acción no se puede deshacer.</AlertDialogBody>
            <AlertDialogFooter>
              <Button onClick={onAlertClose}>Cancelar</Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3}>Eliminar</Button>
            </AlertDialogFooter>
        </AlertDialogContent></AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
} 