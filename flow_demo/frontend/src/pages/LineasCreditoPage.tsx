import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box, Heading, Button, FormControl, FormLabel, Input, VStack, HStack, Text, useToast, 
  SimpleGrid, Card, CardHeader, CardBody, Divider, Spinner, Center,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, useDisclosure,
  Flex,
  Table, Thead, Tbody, Tr, Th, Td, TableContainer, TableCaption,
  Select,
  Textarea,
  Switch,
  IconButton,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { ArrowBackIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { FaPlus, FaMoneyBillWave } from 'react-icons/fa';
import { lineasCreditoApi } from '../api/api';
import type { LineaCredito, LineaCreditoCreate, LineaCreditoUpdate, LineaCreditoUsoCreate } from '../types/lineasDeCredito';

// Helper to format month year
const formatMonthYear = (date: Date) => {
  return date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
};

const LineasCreditoPage: React.FC = () => {
  const toast = useToast();
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isRecordUsoOpen, onOpen: onRecordUsoOpen, onClose: onRecordUsoClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isDeleteConfirmOpen, onOpen: onDeleteConfirmOpen, onClose: onDeleteConfirmClose } = useDisclosure();
  
  const [lineas, setLineas] = useState<LineaCredito[]>([]);
  const [usosPorLinea, setUsosPorLinea] = useState<{[lineaId: number]: LineaCreditoUsoCreate[]}>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingUsos, setIsLoadingUsos] = useState(false);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [isSubmittingUso, setIsSubmittingUso] = useState(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [currentLineaIdForUso, setCurrentLineaIdForUso] = useState<number | null>(null);
  const [currentLineaToEdit, setCurrentLineaToEdit] = useState<LineaCredito | null>(null);
  const [lineaToDelete, setLineaToDelete] = useState<LineaCredito | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const [nombre, setNombre] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [montoTotal, setMontoTotal] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [esRevolvente, setEsRevolvente] = useState(false);
  const [cargosApertura, setCargosApertura] = useState('');

  const [fechaUso, setFechaUso] = useState('');
  const [montoUsado, setMontoUsado] = useState('');
  const [tipoTransaccion, setTipoTransaccion] = useState<'DRAWDOWN' | 'PAYMENT'>('DRAWDOWN');
  const [descripcionUso, setDescripcionUso] = useState('');
  const [cargoTransaccion, setCargoTransaccion] = useState('');

  const [editNombre, setEditNombre] = useState('');
  const [editFechaInicio, setEditFechaInicio] = useState('');
  const [editMontoTotal, setEditMontoTotal] = useState('');
  const [editFechaFin, setEditFechaFin] = useState('');
  const [editInterestRate, setEditInterestRate] = useState('');
  const [editEsRevolvente, setEditEsRevolvente] = useState(false);
  const [editCargosApertura, setEditCargosApertura] = useState('');

  const cancelRef = React.useRef<HTMLButtonElement>(null);

  const monthColumns = useMemo(() => {
    const cols = [];
    const today = new Date();
    today.setDate(1);

    // Last 3 months
    for (let i = 3; i > 0; i--) {
      const date = new Date(today);
      date.setMonth(today.getMonth() - i);
      cols.push({ key: `prev-${i}`, display: formatMonthYear(date), date });
    }

    // Current month + next 35 months (total 36 future months including current)
    for (let i = 0; i < 36; i++) {
      const date = new Date(today);
      date.setMonth(today.getMonth() + i);
      cols.push({ key: `next-${i}`, display: formatMonthYear(date), date });
    }
    return cols;
  }, []);

  const resetCreateForm = () => {
    setNombre('');
    setFechaInicio('');
    setMontoTotal('');
    setFechaFin('');
    setInterestRate('');
    setEsRevolvente(false);
    setCargosApertura('');
  };

  const resetUsoForm = () => {
    setFechaUso('');
    setMontoUsado('');
    setTipoTransaccion('DRAWDOWN');
    setDescripcionUso('');
    setCargoTransaccion('');
  };

  const resetEditForm = () => {
    setEditNombre('');
    setEditFechaInicio('');
    setEditMontoTotal('');
    setEditFechaFin('');
    setEditInterestRate('');
    setEditEsRevolvente(false);
    setEditCargosApertura('');
    setCurrentLineaToEdit(null);
  };

  const fetchLineaUsos = useCallback(async (lineaId: number) => {
    try {
      const response = await lineasCreditoApi.getUsosByLineaId(lineaId);
      setUsosPorLinea(prevUsos => ({
        ...prevUsos,
        [lineaId]: response.data || []
      }));
    } catch (error) {
      console.error(`Error fetching usos for linea ${lineaId}:`, error);
    }
  }, []);

  const fetchLineasCreditoAndUsos = useCallback(async () => {
    setIsLoading(true);
    setIsLoadingUsos(true);
    try {
      const response = await lineasCreditoApi.getAll();
      const fetchedLineas = response.data || [];
      setLineas(fetchedLineas);
      
      if (fetchedLineas.length > 0) {
        const newUsosPorLinea: {[lineaId: number]: LineaCreditoUsoCreate[]} = {}; 
        await Promise.all(fetchedLineas.map(async (linea) => {
          const usosResponse = await lineasCreditoApi.getUsosByLineaId(linea.id);
          newUsosPorLinea[linea.id] = usosResponse.data || [];
        }));
        setUsosPorLinea(newUsosPorLinea);
      } else {
        setUsosPorLinea({});
      }

    } catch (error) {
      console.error("Error fetching lineas de credito:", error);
      toast({ title: "Error al cargar líneas de crédito", status: "error", duration: 5000, isClosable: true });
      setLineas([]);
      setUsosPorLinea({});
    } finally {
      setIsLoading(false);
      setIsLoadingUsos(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchLineasCreditoAndUsos();
  }, [fetchLineasCreditoAndUsos]);

  const handleCreateModalSubmit = async () => {
    setIsSubmittingCreate(true);
    if (!nombre || !fechaInicio || !montoTotal || !fechaFin) {
        toast({
            title: "Campos requeridos",
            description: "Por favor, complete nombre, fecha inicio, monto total y fecha fin.",
            status: "warning",
            duration: 3000,
            isClosable: true,
        });
        setIsSubmittingCreate(false);
        return;
    }
    const newLinea: LineaCreditoCreate = {
      nombre,
      fecha_inicio: fechaInicio,
      monto_total_linea: parseFloat(montoTotal),
      monto_disponible: parseFloat(montoTotal),
      fecha_fin: fechaFin,
      interest_rate: interestRate ? parseFloat(interestRate) : null,
      es_revolvente: esRevolvente,
      cargos_apertura: cargosApertura ? parseFloat(cargosApertura) : null,
    };
    try {
      const response = await lineasCreditoApi.create(newLinea);
      toast({
        title: "Línea de Crédito Creada",
        description: `La línea "${response.data.nombre}" ha sido creada exitosamente.`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      resetCreateForm();
      fetchLineasCreditoAndUsos();
      onCreateClose();
    } catch (error) {
      console.error("Error creating linea de credito:", error);
      toast({
        title: "Error al crear línea de crédito",
        description: "No se pudo guardar la nueva línea. Verifique los datos o intente más tarde.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  const handleCreateModalOpen = () => {
    resetCreateForm();
    onCreateOpen();
  };

  const handleEditModalOpen = (linea: LineaCredito) => {
    setCurrentLineaToEdit(linea);
    setEditNombre(linea.nombre);
    setEditFechaInicio(linea.fecha_inicio.split('T')[0]);
    setEditMontoTotal(linea.monto_total_linea.toString());
    setEditFechaFin(linea.fecha_fin.split('T')[0]);
    setEditInterestRate(linea.interest_rate?.toString() || '');
    setEditEsRevolvente(linea.es_revolvente || false);
    setEditCargosApertura(linea.cargos_apertura?.toString() || '');
    onEditOpen();
  };

  const handleEditModalSubmit = async () => {
    if (!currentLineaToEdit) return;
    setIsSubmittingEdit(true);
    const updatedData: LineaCreditoUpdate = {
      nombre: editNombre,
      fecha_inicio: editFechaInicio,
      monto_total_linea: editMontoTotal ? parseFloat(editMontoTotal) : undefined,
      fecha_fin: editFechaFin,
      interest_rate: editInterestRate ? parseFloat(editInterestRate) : null,
      es_revolvente: editEsRevolvente,
      cargos_apertura: editCargosApertura ? parseFloat(editCargosApertura) : null,
    };
    try {
      await lineasCreditoApi.update(currentLineaToEdit.id, updatedData);
      toast({ title: "Línea de Crédito Actualizada", status: "success", duration: 5000, isClosable: true });
      fetchLineasCreditoAndUsos();
      onEditClose();
      resetEditForm();
    } catch (error) {
      console.error("Error updating linea de credito:", error);
      toast({ title: "Error al actualizar", description: "No se pudo actualizar la línea.", status: "error", duration: 5000, isClosable: true });
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleRecordUsoModalOpen = (lineaId: number) => {
    setCurrentLineaIdForUso(lineaId);
    resetUsoForm();
    onRecordUsoOpen();
  };

  const handleRecordUsoSubmit = async () => {
    if (!currentLineaIdForUso) return;
    setIsSubmittingUso(true);
    if (!fechaUso || !montoUsado) {
      toast({
        title: "Campos requeridos",
        description: "Por favor, complete fecha del uso y monto.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      setIsSubmittingUso(false);
      return;
    }
    const monto = parseFloat(montoUsado);
    const finalMontoUsado = tipoTransaccion === 'PAYMENT' ? -Math.abs(monto) : Math.abs(monto);
    const newUso: LineaCreditoUsoCreate = {
      fecha_uso: fechaUso,
      monto_usado: finalMontoUsado,
      tipo_transaccion: tipoTransaccion,
      descripcion: descripcionUso || undefined,
      cargo_transaccion: cargoTransaccion ? parseFloat(cargoTransaccion) : (tipoTransaccion === 'DRAWDOWN' ? null : undefined),
    };
    try {
      await lineasCreditoApi.createUsoLineaCredito(currentLineaIdForUso, newUso);
      toast({
        title: "Uso/Pago Registrado",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      resetUsoForm();
      fetchLineasCreditoAndUsos();
      onRecordUsoClose();
    } catch (error: any) {
      console.error("Error recording uso/pago:", error);
      let errorMsg = "No se pudo registrar el uso/pago. Verifique los datos o intente más tarde.";
      if (error.response && error.response.data && error.response.data.detail) {
        if (Array.isArray(error.response.data.detail)) {
          errorMsg = error.response.data.detail.map((err: any) => err.msg || JSON.stringify(err)).join('; ');
        } else if (typeof error.response.data.detail === 'object') {
          errorMsg = JSON.stringify(error.response.data.detail);
        } else {
          errorMsg = error.response.data.detail;
        }
      }
      toast({
        title: "Error al Registrar Uso/Pago",
        description: errorMsg,
        status: "error",
        duration: 7000, 
        isClosable: true,
      });
    } finally {
      setIsSubmittingUso(false);
    }
  };

  const openDeleteConfirmModal = (linea: LineaCredito) => {
    setLineaToDelete(linea);
    setDeleteConfirmText('');
    onDeleteConfirmOpen();
  };

  const handleDeleteLinea = async () => {
    if (!lineaToDelete || deleteConfirmText.toLowerCase() !== 'eliminar') {
      toast({
        title: "Confirmación incorrecta",
        description: 'Debe escribir "eliminar" para confirmar.',
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    setIsDeleting(true);
    try {
      await lineasCreditoApi.delete(lineaToDelete.id);
      toast({
        title: "Línea de Crédito Eliminada",
        description: `La línea "${lineaToDelete.nombre}" ha sido eliminada.`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      fetchLineasCreditoAndUsos();
      onDeleteConfirmClose();
      setLineaToDelete(null);
    } catch (error) {
      console.error("Error deleting linea de credito:", error);
      toast({ title: "Error al eliminar", description: "No se pudo eliminar la línea.", status: "error", duration: 5000, isClosable: true });
    } finally {
      setIsDeleting(false);
    }
  };

  const getNetChangeForMonth = useCallback((lineaId: number, targetMonthDate: Date): number => {
    const usos = usosPorLinea[lineaId] || [];
    let netChange = 0;
    const targetYear = targetMonthDate.getFullYear();
    const targetMonth = targetMonthDate.getMonth();

    for (const uso of usos) {
      const usoDate = new Date(uso.fecha_uso + 'T00:00:00');
      if (usoDate.getFullYear() === targetYear && usoDate.getMonth() === targetMonth) {
        if (uso.tipo_transaccion === 'DRAWDOWN') {
          netChange += uso.monto_usado;
        } else if (uso.tipo_transaccion === 'PAYMENT') {
          netChange -= uso.monto_usado;
        }
      }
    }
    return netChange;
  }, [usosPorLinea]);

  const calculateMonthlyInterest = useCallback((linea: LineaCredito, targetMonthDate: Date): number => {
    if (!linea.interest_rate || linea.interest_rate === 0) {
      return 0;
    }

    const usos = usosPorLinea[linea.id] || [];
    const monthlyRate = linea.interest_rate / 100 / 12; 

    let outstandingPrincipalAtMonthStart = 0;
    const firstDayOfMonth = new Date(targetMonthDate.getFullYear(), targetMonthDate.getMonth(), 1);
    const daysInMonth = new Date(targetMonthDate.getFullYear(), targetMonthDate.getMonth() + 1, 0).getDate();

    // Calculate outstanding principal at the start of the target month
    for (const uso of usos) {
      const usoDate = new Date(uso.fecha_uso + 'T00:00:00');
      if (usoDate < firstDayOfMonth) {
        if (uso.tipo_transaccion === 'DRAWDOWN') {
          outstandingPrincipalAtMonthStart += uso.monto_usado;
        } else if (uso.tipo_transaccion === 'PAYMENT') {
          outstandingPrincipalAtMonthStart -= uso.monto_usado;
        }
      }
    }
    outstandingPrincipalAtMonthStart = Math.max(0, outstandingPrincipalAtMonthStart); // Cannot be negative

    let interestForMonth = outstandingPrincipalAtMonthStart * monthlyRate;

    // Add interest for drawdowns made within the current month (pro-rata)
    for (const uso of usos) {
      const usoDate = new Date(uso.fecha_uso + 'T00:00:00');
      if (
        uso.tipo_transaccion === 'DRAWDOWN' &&
        usoDate.getFullYear() === targetMonthDate.getFullYear() &&
        usoDate.getMonth() === targetMonthDate.getMonth()
      ) {
        const dayOfDrawdown = usoDate.getDate();
        const daysPrestamoWasActive = daysInMonth - dayOfDrawdown + 1;
        const dailyRate = linea.interest_rate / 100 / 365; // Or 360 depending on convention
        interestForMonth += uso.monto_usado * dailyRate * daysPrestamoWasActive;
      }
    }
    return Math.max(0, interestForMonth); // Interest cannot be negative
  }, [usosPorLinea]);

  return (
    <Box p={8}>
      <Flex justifyContent="space-between" alignItems="center" mb={8}>
        <HStack spacing={4}>
          <Button as={RouterLink} to="/dashboard" variant="link" leftIcon={<ArrowBackIcon />}>
            Volver al Dashboard
          </Button>
          <Heading as="h1" size="xl">
            Gestión de Líneas de Crédito
          </Heading>
        </HStack>
        <Button onClick={handleCreateModalOpen} colorScheme="blue" leftIcon={<FaPlus />}>
          + Crear Línea de Crédito
        </Button>
      </Flex>

      <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Crear Nueva Línea de Crédito</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Nombre de la Línea</FormLabel>
                <Input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Banco General Préstamo #123" />
              </FormControl>
              <HStack spacing={4} w="full">
                <FormControl isRequired>
                  <FormLabel>Fecha de Inicio</FormLabel>
                  <Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Fecha de Fin</FormLabel>
                  <Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
                </FormControl>
              </HStack>
              <HStack spacing={4} w="full">
                <FormControl isRequired>
                  <FormLabel>Monto Total de la Línea</FormLabel>
                  <Input type="number" value={montoTotal} onChange={(e) => setMontoTotal(e.target.value)} placeholder="Ej: 50000.00" />
                </FormControl>
                <FormControl>
                  <FormLabel>Tasa de Interés Anual (%)</FormLabel>
                  <Input type="number" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} placeholder="Ej: 12.5 (opcional)" />
                </FormControl>
              </HStack>
              <HStack spacing={4} w="full" alignItems="center">
                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="esRevolvente" mb="0">
                    ¿Es Línea Revolvente?
                  </FormLabel>
                  <Switch id="esRevolvente" isChecked={esRevolvente} onChange={(e) => setEsRevolvente(e.target.checked)} />
                </FormControl>
                <FormControl>
                  <FormLabel>Cargos de Apertura (Opcional)</FormLabel>
                  <Input type="number" value={cargosApertura} onChange={(e) => setCargosApertura(e.target.value)} placeholder="Ej: 150.00" />
                </FormControl>
              </HStack>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleCreateModalSubmit} isLoading={isSubmittingCreate}>
              Guardar
            </Button>
            <Button variant="ghost" onClick={onCreateClose}>Cancelar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isEditOpen} onClose={() => { onEditClose(); resetEditForm(); }} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Editar Línea de Crédito: {currentLineaToEdit?.nombre}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Nombre de la Línea</FormLabel>
                <Input type="text" value={editNombre} onChange={(e) => setEditNombre(e.target.value)} />
              </FormControl>
              <HStack spacing={4} w="full">
                <FormControl isRequired>
                  <FormLabel>Fecha de Inicio</FormLabel>
                  <Input type="date" value={editFechaInicio} onChange={(e) => setEditFechaInicio(e.target.value)} />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Fecha de Fin</FormLabel>
                  <Input type="date" value={editFechaFin} onChange={(e) => setEditFechaFin(e.target.value)} />
                </FormControl>
              </HStack>
              <HStack spacing={4} w="full">
                <FormControl isRequired>
                  <FormLabel>Monto Total de la Línea</FormLabel>
                  <Input type="number" value={editMontoTotal} onChange={(e) => setEditMontoTotal(e.target.value)} />
                </FormControl>
                <FormControl>
                  <FormLabel>Tasa de Interés Anual (%)</FormLabel>
                  <Input type="number" value={editInterestRate} onChange={(e) => setEditInterestRate(e.target.value)} placeholder="Ej: 12.5" />
                </FormControl>
              </HStack>
              <HStack spacing={4} w="full" alignItems="center">
                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="editEsRevolvente" mb="0">
                    ¿Es Línea Revolvente?
                  </FormLabel>
                  <Switch id="editEsRevolvente" isChecked={editEsRevolvente} onChange={(e) => setEditEsRevolvente(e.target.checked)} />
                </FormControl>
                <FormControl>
                  <FormLabel>Cargos de Apertura</FormLabel>
                  <Input type="number" value={editCargosApertura} onChange={(e) => setEditCargosApertura(e.target.value)} placeholder="Ej: 150.00" />
                </FormControl>
              </HStack>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleEditModalSubmit} isLoading={isSubmittingEdit}>
              Guardar Cambios
            </Button>
            <Button variant="ghost" onClick={() => { onEditClose(); resetEditForm(); }}>Cancelar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isRecordUsoOpen} onClose={onRecordUsoClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Registrar Uso de Línea de Crédito</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Fecha de Uso</FormLabel>
                <Input type="date" value={fechaUso} onChange={(e) => setFechaUso(e.target.value)} />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Monto</FormLabel>
                <Input type="number" value={montoUsado} onChange={(e) => setMontoUsado(e.target.value)} placeholder="Ej: 500.00" />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Tipo de Transacción</FormLabel>
                <Select value={tipoTransaccion} onChange={(e) => setTipoTransaccion(e.target.value as 'DRAWDOWN' | 'PAYMENT')}>
                  <option value="DRAWDOWN">Disposición (Drawdown)</option>
                  <option value="PAYMENT">Pago</option>
                </Select>
              </FormControl>
              {tipoTransaccion === 'DRAWDOWN' && (
                <FormControl>
                  <FormLabel>Cargo por Transacción (Opcional)</FormLabel>
                  <Input type="number" value={cargoTransaccion} onChange={(e) => setCargoTransaccion(e.target.value)} placeholder="Ej: 25.00" />
                </FormControl>
              )}
              <FormControl>
                <FormLabel>Descripción (Opcional)</FormLabel>
                <Textarea value={descripcionUso} onChange={(e) => setDescripcionUso(e.target.value)} placeholder="Detalles adicionales" />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="teal" mr={3} onClick={handleRecordUsoSubmit} isLoading={isSubmittingUso}>
              Registrar Uso
            </Button>
            <Button variant="ghost" onClick={onRecordUsoClose}>Cancelar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <AlertDialog
        isOpen={isDeleteConfirmOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteConfirmClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Eliminar Línea de Crédito: {lineaToDelete?.nombre}
            </AlertDialogHeader>

            <AlertDialogBody>
              <Text mb={4}>¿Está seguro? Esta acción no se puede deshacer. Todos los usos asociados también serán eliminados.</Text>
              <Text mb={2}>Para confirmar, escriba <strong>eliminar</strong> en el campo de abajo:</Text>
              <Input 
                placeholder='eliminar'
                value={deleteConfirmText} 
                onChange={(e) => setDeleteConfirmText(e.target.value)}
              />
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteConfirmClose}>
                Cancelar
              </Button>
              <Button 
                colorScheme="red" 
                onClick={handleDeleteLinea} 
                ml={3} 
                isLoading={isDeleting}
                isDisabled={deleteConfirmText.toLowerCase() !== 'eliminar'}
              >
                Eliminar Línea
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      <Heading size="lg" mb={6} mt={8}>Líneas de Crédito Existentes (Tarjetas)</Heading>
      {isLoading ? (
        <Center><Spinner size="xl" /></Center>
      ) : lineas.length === 0 ? (
        <Text>No hay líneas de crédito registradas.</Text>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} mb={12}>
          {lineas.map((linea) => (
            <Card key={linea.id} variant="outline">
              <CardHeader>
                <Flex justifyContent="space-between" alignItems="center">
                  <Heading size="md">{linea.nombre}</Heading>
                  <HStack spacing={1}>
                    <IconButton 
                      aria-label="Editar línea" 
                      icon={<EditIcon />} 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleEditModalOpen(linea)}
                    />
                    <IconButton 
                      aria-label="Eliminar línea" 
                      icon={<DeleteIcon />} 
                      size="sm" 
                      variant="ghost"
                      colorScheme="red"
                      onClick={() => openDeleteConfirmModal(linea)}
                    />
                  </HStack>
                </Flex>
              </CardHeader>
              <Divider />
              <CardBody>
                <VStack align="start" spacing={1} mb={3}>
                  <Text><strong>ID:</strong> {linea.id}</Text>
                  <Text><strong>Monto Total:</strong> ${linea.monto_total_linea.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                  <Text><strong>Monto Disponible:</strong> ${linea.monto_disponible.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                  {linea.interest_rate !== null && linea.interest_rate !== undefined && (
                    <Text><strong>Tasa Interés:</strong> {linea.interest_rate}%</Text>
                  )}
                  <Text><strong>Tipo:</strong> {linea.es_revolvente ? 'Revolvente' : 'Plazo Fijo'}</Text>
                  {linea.cargos_apertura !== null && linea.cargos_apertura !== undefined && linea.cargos_apertura > 0 && (
                    <Text><strong>Cargos Apertura:</strong> ${linea.cargos_apertura.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                  )}
                  <Text><strong>Fecha Inicio:</strong> {new Date(linea.fecha_inicio + 'T00:00:00').toLocaleDateString()}</Text>
                  <Text><strong>Fecha Fin:</strong> {new Date(linea.fecha_fin + 'T00:00:00').toLocaleDateString()}</Text>
                </VStack>
                <Button 
                  size="sm" 
                  colorScheme="teal" 
                  leftIcon={<FaMoneyBillWave />}
                  onClick={() => handleRecordUsoModalOpen(linea.id)}
                >
                  Registrar Uso/Pago
                </Button>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      )}

      <Heading size="lg" mb={6} mt={12}>Planificación Mensual de Líneas de Crédito</Heading>
      {(isLoading || isLoadingUsos) ? (
        <Center><Spinner size="xl" /></Center>
      ) : (
        <TableContainer>
          <Table variant="striped" colorScheme="gray" size="sm">
            <TableCaption placement="top">Vista mensual: Últimos 3 meses y Próximos 36 meses (Neto Usos)</TableCaption>
            <Thead>
              <Tr>
                <Th position="sticky" left={0} bg="gray.100" zIndex={1}>Línea de Crédito</Th>
                {monthColumns.map(col => (
                  <Th key={col.key} isNumeric>{col.display}</Th>
                ))}
              </Tr>
            </Thead>
            <Tbody>
              {lineas.length === 0 && !isLoading ? (
                <Tr><Td colSpan={monthColumns.length + 1} textAlign="center">No hay líneas de crédito para mostrar.</Td></Tr>
              ) : (
                lineas.map((linea) => (
                  <Tr key={linea.id}>
                    <Td position="sticky" left={0} bg="white" zIndex={1} shadow={lineas.length > 0 ? "md" : "none"}>{linea.nombre}</Td>
                    {monthColumns.map(col => {
                      const netChange = getNetChangeForMonth(linea.id, col.date);
                      return (
                        <Td key={`${linea.id}-${col.key}`} isNumeric color={netChange < 0 ? 'red.500' : (netChange > 0 ? 'green.500' : 'gray.500')}>
                          {netChange !== 0 ? netChange.toLocaleString(undefined, { style: 'currency', currency: 'USD' }) : '-'}
                        </Td>
                      );
                    })}
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default LineasCreditoPage; 