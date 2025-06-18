import { useState, useEffect, useRef } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Heading,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Spinner,
  Alert,
  AlertIcon,
  Flex,
  Text,
  IconButton,
  useToast,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react';
import { ArrowBackIcon, DeleteIcon } from '@chakra-ui/icons';
import { pagosApi } from '../../api/api';
import type { Pago } from '../../api/api';

export default function HistorialPagosPage() {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [selectedPagoId, setSelectedPagoId] = useState<number | null>(null);

  const fetchPagos = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await pagosApi.getAll();
      setPagos(response.data);
    } catch (err: any) {
      console.error("Error fetching pagos:", err);
      setError(err.response?.data?.detail || err.message || 'Error al cargar el historial de pagos.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPagos();
  }, []);

  const handleDeleteClick = (pagoId: number) => {
    setSelectedPagoId(pagoId);
    onOpen();
  };

  const confirmDelete = async () => {
    if (selectedPagoId === null) return;
    try {
      await pagosApi.delete(selectedPagoId);
      toast({
        title: 'Pago eliminado',
        description: `El pago con ID ${selectedPagoId} ha sido eliminado exitosamente.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      fetchPagos();
    } catch (err: any) {
      console.error("Error deleting pago:", err);
      toast({
        title: 'Error al eliminar pago',
        description: err.response?.data?.detail || err.message || 'No se pudo eliminar el pago.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      onClose();
      setSelectedPagoId(null);
    }
  };

  return (
    <Box p={8}>
      <Flex justifyContent="space-between" alignItems="center" mb={6}>
        <Heading as="h1" size="lg">Historial de Pagos Recibidos</Heading>
        <Button as={RouterLink} to="/cobros-dashboard" leftIcon={<ArrowBackIcon />} variant="outline">
          Volver a Dashboard de Cobros
        </Button>
      </Flex>

      {isLoading && (
        <Flex justifyContent="center" alignItems="center" height="200px">
          <Spinner size="xl" />
        </Flex>
      )}

      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
      )}

      {!isLoading && !error && pagos.length === 0 && (
        <Text>No se encontraron pagos registrados.</Text>
      )}

      {!isLoading && !error && pagos.length > 0 && (
        <TableContainer>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>ID Pago</Th><Th>Cliente</Th><Th>Proyecto</Th><Th isNumeric>Monto</Th><Th>Fecha Pago</Th><Th>Método</Th><Th>Referencia</Th><Th>Notas</Th><Th>Acciones</Th>
              </Tr>
            </Thead>
            <Tbody>
              {pagos.map((pago) => (
                <Tr key={pago.id}>
                  <Td>{pago.id}</Td>
                  <Td>{pago.cliente_nombre || `ID: ${pago.cliente_id}`}</Td>
                  <Td>{pago.proyecto_keyword || 'N/A'}</Td>
                  <Td isNumeric>
                    {typeof pago.monto === 'string' ? parseFloat(pago.monto).toFixed(2) : pago.monto.toFixed(2)}
                  </Td>
                  <Td>{new Date(pago.fecha_pago + 'T00:00:00').toLocaleDateString()}</Td>
                  <Td>{pago.metodo_pago}</Td>
                  <Td>{pago.referencia || 'N/A'}</Td>
                  <Td>{pago.notas || 'N/A'}</Td>
                  <Td>
                    <IconButton 
                      aria-label="Eliminar pago"
                      icon={<DeleteIcon />}
                      colorScheme="red"
                      variant="ghost"
                      onClick={() => handleDeleteClick(pago.id)}
                    />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      )}
      
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Confirmar Eliminación
            </AlertDialogHeader>
            <AlertDialogBody>
              ¿Está seguro de que desea eliminar el pago con ID {selectedPagoId}? Esta acción no se puede deshacer.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancelar
              </Button>
              <Button colorScheme="red" onClick={confirmDelete} ml={3}>
                Eliminar
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
} 