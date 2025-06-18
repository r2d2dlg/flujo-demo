import { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Heading,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  VStack,
  HStack,
  useToast,
  Spinner,
  Flex,
  Alert,
  AlertIcon,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import { ArrowBackIcon, AddIcon } from '@chakra-ui/icons';
import apiClient, { projectsApi } from '../../api/api'; // Corrected import path
import type { PagoCreate, Cliente } from '../../api/api'; // Import PagoCreate, Cliente types
import type { LineaCredito } from '../../types/lineasDeCredito'; // Import LineaCredito from correct location
import CreateClienteModal from '../../components/CreateClienteModal';

// Placeholder types - these would ideally come from a shared types file
interface Proyecto {
  keyword: string;
  display_name: string;
}

interface PagoFormState {
  clienteId: string; // Keep as string for form, parse to number before sending
  proyectoKeyword: string;
  monto: string; // Input type="number" typically gives string, backend expects number | string
  fechaPago: string;
  metodoPago: string;
  referencia: string;
  notas: string;
  lineaCreditoIdAbono?: string; // Added for the new dropdown
  origenPago: string; // New field for payment origin
}

export default function RegistrarPagoPage() {
  const toast = useToast();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [lineasCredito, setLineasCredito] = useState<LineaCredito[]>([]); // State for credit lines
  const [abonoPorcentaje, setAbonoPorcentaje] = useState<number>(90); // New state for percentage
  const [formState, setFormState] = useState<PagoFormState>({
    clienteId: '',
    proyectoKeyword: '',
    monto: '',
    fechaPago: new Date().toISOString().split('T')[0], // Default to today
    metodoPago: 'transferencia', // Default payment method
    referencia: '',
    notas: '',
    lineaCreditoIdAbono: '', // Initialize
    origenPago: 'CLIENTE', // Default payment origin
  });
  const [isLoadingClientes, setIsLoadingClientes] = useState(true);
  const [errorClientes, setErrorClientes] = useState<string | null>(null);
  const [isLoadingLineasCredito, setIsLoadingLineasCredito] = useState(true); // Loading state for credit lines
  const [errorLineasCredito, setErrorLineasCredito] = useState<string | null>(null); // Error state for credit lines
  const [isLoadingProyectos, setIsLoadingProyectos] = useState(true); // Loading state for projects
  const [errorProyectos, setErrorProyectos] = useState<string | null>(null); // Error state for projects
  const [isLoading, setIsLoading] = useState(false);
  const { isOpen: isCreateClienteOpen, onOpen: onCreateClienteOpen, onClose: onCreateClienteClose } = useDisclosure();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchClientes = async () => {
    setIsLoadingClientes(true);
    setErrorClientes(null);
    try {
      const clientesResponse = await apiClient.clientesApi.getAll();
      setClientes(clientesResponse.data);
    } catch (err: any) {
      setErrorClientes(err.response?.data?.detail || 'Error al cargar clientes.');
      toast({ title: 'Error al cargar clientes', description: err.response?.data?.detail || err.message, status: 'error' });
    } finally {
      setIsLoadingClientes(false);
    }
  };

  // Placeholder: Fetch clientes and proyectos - In a real app, these would call an API
  useEffect(() => {
    const fetchInitialData = async () => {
      fetchClientes();

      setIsLoadingLineasCredito(true);
      setErrorLineasCredito(null);
      try {
        const lineasCreditoResponse = await apiClient.lineasCreditoApi.getAll();
        setLineasCredito(lineasCreditoResponse.data);
      } catch (err: any) {
        setErrorLineasCredito(err.response?.data?.detail || 'Error al cargar líneas de crédito.');
        toast({ title: 'Error al cargar líneas de crédito', description: err.response?.data?.detail || err.message, status: 'error' });
      } finally {
        setIsLoadingLineasCredito(false);
      }

      // Fetch projects dynamically from the API
      setIsLoadingProyectos(true);
      setErrorProyectos(null);
      try {
        const proyectosResponse = await projectsApi.getAll();
        setProyectos(proyectosResponse.data.projects);
      } catch (err: any) {
        setErrorProyectos(err.response?.data?.detail || 'Error al cargar proyectos.');
        toast({ title: 'Error al cargar proyectos', description: err.response?.data?.detail || err.message, status: 'error' });
      } finally {
        setIsLoadingProyectos(false);
      }
    };

    fetchInitialData();
  }, [toast]);

  const handleClienteCreated = (newCliente: Cliente) => {
    fetchClientes(); // Refetch the list of clients
    setFormState(prev => ({ ...prev, clienteId: newCliente.id.toString() })); // Select the new client
    onCreateClienteClose(); // Close the modal
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handlePorcentajeChange = (valueAsString: string, valueAsNumber: number) => {
    setAbonoPorcentaje(isNaN(valueAsNumber) ? 0 : valueAsNumber); // Handle NaN if input is cleared
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formState.clienteId) {
        toast({
            title: 'Campo Requerido',
            description: 'Por favor, seleccione un cliente.',
            status: 'warning',
            duration: 3000,
            isClosable: true,
        });
        return;
    }
    if (!formState.monto) {
        toast({
            title: 'Campo Requerido',
            description: 'Por favor, ingrese el monto.',
            status: 'warning',
            duration: 3000,
            isClosable: true,
        });
        return;
    }

    setIsSubmitting(true);

    const payload: PagoCreate & { abono_porcentaje_linea_credito?: number } = {
      cliente_id: parseInt(formState.clienteId, 10),
      proyecto_keyword: formState.proyectoKeyword || undefined, // Send undefined if empty
      monto: parseFloat(formState.monto), // Ensure monto is a number
      fecha_pago: formState.fechaPago,
      metodo_pago: formState.metodoPago,
      referencia: formState.referencia || undefined,
      notas: formState.notas || undefined,
      linea_credito_id_abono: formState.lineaCreditoIdAbono ? parseInt(formState.lineaCreditoIdAbono, 10) : undefined,
      origen_pago: formState.origenPago, // Add to payload
    };

    if (payload.linea_credito_id_abono && abonoPorcentaje > 0) {
      payload.abono_porcentaje_linea_credito = abonoPorcentaje;
    }

    console.log('Datos del pago a enviar:', payload);

    try {
        await apiClient.pagosApi.create(payload);
        toast({
            title: 'Pago Registrado',
            description: 'El pago ha sido registrado exitosamente.',
            status: 'success',
            duration: 5000,
            isClosable: true,
        });
        // Reset form
        setFormState({
            clienteId: '',
            proyectoKeyword: '',
            monto: '',
            fechaPago: new Date().toISOString().split('T')[0],
            metodoPago: 'transferencia',
            referencia: '',
            notas: '',
            lineaCreditoIdAbono: '',
            origenPago: 'CLIENTE', // Reset to default
        });
        setAbonoPorcentaje(90); // Reset percentage as well
    } catch (error: any) {
        console.error("Error al registrar el pago:", error);
        const errorMessage = error.response?.data?.detail || 'Hubo un error al registrar el pago.';
        toast({
            title: 'Error al Registrar Pago',
            description: typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage),
            status: 'error',
            duration: 7000,
            isClosable: true,
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <Box p={8}>
      <Flex justifyContent="space-between" alignItems="center" mb={6}>
        <Heading as="h1" size="lg">Registrar Nuevo Pago</Heading>
        <Button as={RouterLink} to="/cobros-dashboard" leftIcon={<ArrowBackIcon />} variant="outline">
          Volver a Dashboard de Cobros
        </Button>
      </Flex>

      <CreateClienteModal
        isOpen={isCreateClienteOpen}
        onClose={onCreateClienteClose}
        onClienteCreated={handleClienteCreated}
      />

      <Box as="form" onSubmit={handleSubmit}>
        <VStack spacing={4} align="stretch">
          <FormControl isRequired isInvalid={!formState.clienteId}>
            <FormLabel htmlFor="clienteId">Cliente</FormLabel>
            <HStack>
              <Select
                id="clienteId"
                name="clienteId"
                value={formState.clienteId}
                onChange={handleChange}
                placeholder="Seleccione un cliente"
              >
                {clientes.map(cliente => (
                  <option key={String(cliente.id)} value={String(cliente.id)}>{cliente.nombre} (RUC: {cliente.ruc || 'N/A'})</option>
                ))}
              </Select>
              <Button onClick={onCreateClienteOpen} leftIcon={<AddIcon />} colorScheme="teal" variant="outline">
                Nuevo Cliente
              </Button>
            </HStack>
            {isLoadingClientes && <Text fontSize="sm" color="gray.500">Cargando clientes...</Text>}
            {errorClientes && <Text fontSize="sm" color="red.500">{errorClientes}</Text>}
          </FormControl>

          <FormControl>
            <FormLabel htmlFor="proyectoKeyword">Proyecto Asociado (Opcional)</FormLabel>
            {isLoadingProyectos ? (
              <Spinner />
            ) : errorProyectos ? (
              <Alert status="error">
                <AlertIcon />
                {errorProyectos}
              </Alert>
            ) : (
              <Select id="proyectoKeyword" name="proyectoKeyword" value={formState.proyectoKeyword} onChange={handleChange} placeholder="Seleccione un proyecto">
                {proyectos.map(proyecto => (
                  <option key={proyecto.keyword} value={proyecto.keyword}>{proyecto.display_name}</option>
                ))}
              </Select>
            )}
          </FormControl>

          <FormControl>
            <FormLabel htmlFor="lineaCreditoIdAbono">Abonar a Línea de Crédito (Opcional)</FormLabel>
            {isLoadingLineasCredito ? (
              <Spinner size="sm" />
            ) : errorLineasCredito ? (
              <Alert status="error" fontSize="sm"><AlertIcon />{errorLineasCredito}</Alert>
            ) : (
              <HStack spacing={4}>
                <Select 
                  id="lineaCreditoIdAbono" 
                  name="lineaCreditoIdAbono" 
                  value={formState.lineaCreditoIdAbono || ''} 
                  onChange={handleChange} 
                  placeholder="No abonar a línea de crédito"
                  flex={2}
                >
                  {lineasCredito.map(lc => (
                    <option key={lc.id} value={lc.id}>
                      {lc.nombre} (Disp: {lc.monto_disponible}) 
                    </option>
                  ))}
                </Select>
                {formState.lineaCreditoIdAbono && (
                  <HStack flex={1}>
                    <Text whiteSpace="nowrap">Porcentaje (%):</Text>
                    <NumberInput 
                      value={abonoPorcentaje} 
                      onChange={handlePorcentajeChange}
                      min={0} 
                      max={100}
                      clampValueOnBlur={false}
                      width="100px"
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </HStack>
                )}
              </HStack>
            )}
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Origen del Pago</FormLabel>
            <Select name="origenPago" value={formState.origenPago} onChange={handleChange}>
              <option value="CLIENTE">Cliente</option>
              <option value="BANCO">Banco</option>
              <option value="OTRO">Otro</option>
            </Select>
          </FormControl>

          <FormControl isRequired>
            <FormLabel htmlFor="monto">Monto Recibido</FormLabel>
            {/* Input type="number" can still have its value read as string. onChange handles it. */}
            <Input id="monto" name="monto" type="number" value={formState.monto} onChange={handleChange} placeholder="0.00" />
          </FormControl>

          <FormControl isRequired>
            <FormLabel htmlFor="fechaPago">Fecha del Pago</FormLabel>
            <Input id="fechaPago" name="fechaPago" type="date" value={formState.fechaPago} onChange={handleChange} />
          </FormControl>

          <FormControl isRequired>
            <FormLabel htmlFor="metodoPago">Método de Pago</FormLabel>
            <Select id="metodoPago" name="metodoPago" value={formState.metodoPago} onChange={handleChange}>
              <option value="transferencia">Transferencia Bancaria</option>
              <option value="efectivo">Efectivo</option>
              <option value="cheque">Cheque</option>
              <option value="tarjeta_credito">Tarjeta de Crédito</option>
              <option value="yappy">Yappy</option>
              <option value="otro">Otro</option>
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel htmlFor="referencia">Referencia / No. de Transacción</FormLabel>
            <Input id="referencia" name="referencia" value={formState.referencia} onChange={handleChange} placeholder="Ej: CH12345, Factura #789" />
          </FormControl>

          <FormControl>
            <FormLabel htmlFor="notas">Notas Adicionales</FormLabel>
            <Textarea id="notas" name="notas" value={formState.notas} onChange={handleChange} placeholder="Cualquier detalle adicional sobre el pago..." />
          </FormControl>

          <HStack justifyContent="flex-end">
            <Button type="submit" colorScheme="blue" isLoading={isSubmitting} loadingText="Registrando...">
              Registrar Pago
            </Button>
          </HStack>
        </VStack>
      </Box>
    </Box>
  );
} 