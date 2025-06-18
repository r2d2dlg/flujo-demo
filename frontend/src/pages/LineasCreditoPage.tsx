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
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  Tab,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { ArrowBackIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { FaPlus, FaMoneyBillWave, FaCalendarAlt, FaList } from 'react-icons/fa';
import { lineasCreditoApi } from '../api/api';
import type { LineaCredito, LineaCreditoCreate, LineaCreditoUpdate, LineaCreditoUsoCreate, LineaCreditoUso, TipoLineaCredito, PeriodicidadPago, TipoGarantia, Moneda } from '../types/lineasDeCredito';
import { TIPOS_LINEA_CREDITO, PERIODICIDAD_PAGO, TIPOS_GARANTIA, MONEDAS } from '../types/lineasDeCredito';
import { LINEA_CREDITO_RULES, validateLineaCredito, getDefaultValuesForTipo } from '../utils/lineaCreditoRules';
import { calcularLinea, calcularMetricas, formatCurrency } from '../utils/lineaCreditoCalculations';
import CalendarioPagosModal from '../components/CalendarioPagosModal';

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Helper to format month year
const formatMonthYear = (date: Date) => {
  return date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
};

// Generate periods: previous 3 months + next 36 months, grouped by 12
function generatePeriods() {
  const now = new Date();
  now.setDate(1);
  const start = new Date(now);
  start.setMonth(start.getMonth() - 3);
  const end = new Date(now);
  end.setMonth(end.getMonth() + 36);
  
  const months = [];
  let d = new Date(start);
  while (d <= end) {
    const year = d.getFullYear();
    const month = d.getMonth();
    const key = `${year}_${(month + 1).toString().padStart(2, '0')}`;
    const label = `${MONTHS_ES[month]} ${year}`;
    months.push({ 
      key, 
      label, 
      year, 
      month,
      date: new Date(d),
      display: formatMonthYear(new Date(d))
    });
    d.setMonth(d.getMonth() + 1);
  }
  
  const periods = [];
  for (let i = 0; i < months.length; i += 12) {
    const periodMonths = months.slice(i, i + 12);
    periods.push({
      label: `${periodMonths[0].label} - ${periodMonths[periodMonths.length - 1].label}`,
      months: periodMonths
    });
  }
  
  return periods;
}

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
  const [isDeletingUso, setIsDeletingUso] = useState(false);

  const [currentLineaIdForUso, setCurrentLineaIdForUso] = useState<number | null>(null);
  const [currentLineaToEdit, setCurrentLineaToEdit] = useState<LineaCredito | null>(null);
  const [lineaToDelete, setLineaToDelete] = useState<LineaCredito | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [calendarioModalOpen, setCalendarioModalOpen] = useState(false);
  const [selectedLineaForCalendario, setSelectedLineaForCalendario] = useState<LineaCredito | null>(null);
  const [selectedLineaForUsos, setSelectedLineaForUsos] = useState<LineaCredito | null>(null);
  const [usoToDelete, setUsoToDelete] = useState<LineaCreditoUso | null>(null);
  const [deleteUsoConfirmOpen, setDeleteUsoConfirmOpen] = useState(false);

  const [nombre, setNombre] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [montoTotal, setMontoTotal] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [esRevolvente, setEsRevolvente] = useState(false);
  const [tipoLinea, setTipoLinea] = useState<TipoLineaCredito>('LINEA_CREDITO');
  const [cargosApertura, setCargosApertura] = useState('');

  // Nuevos campos específicos
  const [plazoMeses, setPlazoMeses] = useState('');
  const [periodicidadPago, setPeriodicidadPago] = useState<PeriodicidadPago>('MENSUAL');
  const [valorActivo, setValorActivo] = useState('');
  const [valorResidual, setValorResidual] = useState('');
  const [porcentajeFinanciamiento, setPorcentajeFinanciamiento] = useState('');
  const [garantiaTipo, setGarantiaTipo] = useState<TipoGarantia>('NINGUNA');
  const [garantiaDescripcion, setGarantiaDescripcion] = useState('');
  const [limiteSobregiro, setLimiteSobregiro] = useState('');
  const [moneda, setMoneda] = useState<Moneda>('USD');
  const [beneficiario, setBeneficiario] = useState('');
  const [bancoEmisor, setBancoEmisor] = useState('');
  const [documentoRespaldo, setDocumentoRespaldo] = useState('');

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
  const [editTipoLinea, setEditTipoLinea] = useState<TipoLineaCredito>('LINEA_CREDITO');
  const [editCargosApertura, setEditCargosApertura] = useState('');

  // Estados para edición de campos específicos
  const [editPlazoMeses, setEditPlazoMeses] = useState('');
  const [editPeriodicidadPago, setEditPeriodicidadPago] = useState<PeriodicidadPago>('MENSUAL');
  const [editValorActivo, setEditValorActivo] = useState('');
  const [editValorResidual, setEditValorResidual] = useState('');
  const [editPorcentajeFinanciamiento, setEditPorcentajeFinanciamiento] = useState('');
  const [editGarantiaTipo, setEditGarantiaTipo] = useState<TipoGarantia>('NINGUNA');
  const [editGarantiaDescripcion, setEditGarantiaDescripcion] = useState('');
  const [editLimiteSobregiro, setEditLimiteSobregiro] = useState('');
  const [editMoneda, setEditMoneda] = useState<Moneda>('USD');
  const [editBeneficiario, setEditBeneficiario] = useState('');
  const [editBancoEmisor, setEditBancoEmisor] = useState('');
  const [editDocumentoRespaldo, setEditDocumentoRespaldo] = useState('');

  const cancelRef = React.useRef<HTMLButtonElement>(null);

  const periods = useMemo(() => generatePeriods(), []);

  const resetCreateForm = () => {
    setNombre('');
    setFechaInicio('');
    setMontoTotal('');
    setFechaFin('');
    setInterestRate('');
    setEsRevolvente(false);
    setTipoLinea('LINEA_CREDITO');
    setCargosApertura('');
    
    // Reset campos específicos
    setPlazoMeses('');
    setPeriodicidadPago('MENSUAL');
    setValorActivo('');
    setValorResidual('');
    setPorcentajeFinanciamiento('');
    setGarantiaTipo('NINGUNA');
    setGarantiaDescripcion('');
    setLimiteSobregiro('');
    setMoneda('USD');
    setBeneficiario('');
    setBancoEmisor('');
    setDocumentoRespaldo('');
  };

  // Función para manejar cambio de tipo de línea y aplicar valores por defecto
  const handleTipoLineaChange = (nuevoTipo: TipoLineaCredito) => {
    setTipoLinea(nuevoTipo);
    
    // Aplicar valores por defecto según el tipo
    const defaultValues = getDefaultValuesForTipo(nuevoTipo);
    
    if (defaultValues.es_revolvente !== undefined) {
      setEsRevolvente(defaultValues.es_revolvente);
    }
    if (defaultValues.moneda) {
      setMoneda(defaultValues.moneda as Moneda);
    }
    if (defaultValues.periodicidad_pago) {
      setPeriodicidadPago(defaultValues.periodicidad_pago as PeriodicidadPago);
    }
    if (defaultValues.garantia_tipo) {
      setGarantiaTipo(defaultValues.garantia_tipo as TipoGarantia);
    }
    if (defaultValues.porcentaje_financiamiento) {
      setPorcentajeFinanciamiento(defaultValues.porcentaje_financiamiento.toString());
    }
    if (defaultValues.valor_residual) {
      setValorResidual(defaultValues.valor_residual.toString());
    }
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
    setEditTipoLinea('LINEA_CREDITO');
    setEditCargosApertura('');
    setCurrentLineaToEdit(null);
  };

  const handleCalendarioModalOpen = (linea: LineaCredito) => {
    setSelectedLineaForCalendario(linea);
    setCalendarioModalOpen(true);
  };

  const handleCalendarioModalClose = () => {
    setCalendarioModalOpen(false);
    setSelectedLineaForCalendario(null);
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
    
    // Crear objeto con todos los datos
    const formData: Partial<LineaCreditoBase> = {
      nombre,
      fecha_inicio: fechaInicio,
      monto_total_linea: montoTotal ? parseFloat(montoTotal) : undefined,
      monto_disponible: montoTotal ? parseFloat(montoTotal) : undefined,
      fecha_fin: fechaFin,
      interest_rate: interestRate ? parseFloat(interestRate) : null,
      es_revolvente: esRevolvente,
      tipo_linea: tipoLinea,
      cargos_apertura: cargosApertura ? parseFloat(cargosApertura) : null,
      plazo_meses: plazoMeses ? parseInt(plazoMeses) : null,
      periodicidad_pago: periodicidadPago,
      valor_activo: valorActivo ? parseFloat(valorActivo) : null,
      valor_residual: valorResidual ? parseFloat(valorResidual) : null,
      porcentaje_financiamiento: porcentajeFinanciamiento ? parseFloat(porcentajeFinanciamiento) : null,
      garantia_tipo: garantiaTipo !== 'NINGUNA' ? garantiaTipo : null,
      garantia_descripcion: garantiaDescripcion || null,
      limite_sobregiro: limiteSobregiro ? parseFloat(limiteSobregiro) : null,
      moneda,
      beneficiario: beneficiario || null,
      banco_emisor: bancoEmisor || null,
      documento_respaldo: documentoRespaldo || null
    };

    // Validar según las reglas del tipo
    const validationErrors = validateLineaCredito(formData);
    if (validationErrors.length > 0) {
      toast({
        title: "Errores de validación",
        description: validationErrors.join(', '),
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setIsSubmittingCreate(false);
      return;
    }

    const newLinea: LineaCreditoCreate = formData as LineaCreditoCreate;
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
    setEditTipoLinea(linea.tipo_linea || 'LINEA_CREDITO');
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
      tipo_linea: editTipoLinea,
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

  // Funciones para gestionar usos individuales
  const handleViewUsos = (linea: LineaCredito) => {
    setSelectedLineaForUsos(linea);
  };

  const handleCloseUsos = () => {
    setSelectedLineaForUsos(null);
  };

  const handleDeleteUso = (uso: LineaCreditoUso) => {
    setUsoToDelete(uso);
    setDeleteUsoConfirmOpen(true);
  };

  const confirmDeleteUso = async () => {
    if (!usoToDelete) return;
    
    setIsDeletingUso(true);
    try {
      await lineasCreditoApi.deleteUso(usoToDelete.id);
      toast({
        title: "Uso Eliminado",
        description: "El uso de la línea de crédito ha sido eliminado exitosamente.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      
      // Refresh the data
      await fetchLineasCreditoAndUsos();
      
      setDeleteUsoConfirmOpen(false);
      setUsoToDelete(null);
    } catch (error) {
      console.error("Error deleting uso:", error);
      toast({
        title: "Error al Eliminar",
        description: "No se pudo eliminar el uso. Intente nuevamente.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsDeletingUso(false);
    }
  };

  const cancelDeleteUso = () => {
    setDeleteUsoConfirmOpen(false);
    setUsoToDelete(null);
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
                  <FormLabel>Tipo de Línea</FormLabel>
                  <Select value={tipoLinea} onChange={(e) => handleTipoLineaChange(e.target.value as TipoLineaCredito)}>
                    {Object.entries(TIPOS_LINEA_CREDITO).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </Select>
                  <Text fontSize="sm" color="gray.600" mt={1}>
                    {LINEA_CREDITO_RULES[tipoLinea]?.description}
                  </Text>
                </FormControl>
              </HStack>
                             <FormControl>
                 <FormLabel>Cargos de Apertura (Opcional)</FormLabel>
                 <Input type="number" value={cargosApertura} onChange={(e) => setCargosApertura(e.target.value)} placeholder="Ej: 150.00" />
               </FormControl>

               {/* Campos específicos según el tipo de línea */}
               {(tipoLinea === 'TERMINO_FIJO' || tipoLinea === 'LEASING_OPERATIVO' || tipoLinea === 'LEASING_FINANCIERO' || 
                 tipoLinea === 'PRESTAMO_HIPOTECARIO' || tipoLinea === 'PRESTAMO_VEHICULAR') && (
                 <HStack spacing={4} w="full">
                   <FormControl isRequired>
                     <FormLabel>Plazo (meses)</FormLabel>
                     <Input type="number" value={plazoMeses} onChange={(e) => setPlazoMeses(e.target.value)} placeholder="Ej: 60" />
                   </FormControl>
                   <FormControl>
                     <FormLabel>Periodicidad de Pago</FormLabel>
                     <Select value={periodicidadPago} onChange={(e) => setPeriodicidadPago(e.target.value as PeriodicidadPago)}>
                       {Object.entries(PERIODICIDAD_PAGO).map(([key, label]) => (
                         <option key={key} value={key}>{label}</option>
                       ))}
                     </Select>
                   </FormControl>
                 </HStack>
               )}

               {(tipoLinea === 'LEASING_OPERATIVO' || tipoLinea === 'LEASING_FINANCIERO') && (
                 <HStack spacing={4} w="full">
                   <FormControl isRequired>
                     <FormLabel>Valor del Activo</FormLabel>
                     <Input type="number" value={valorActivo} onChange={(e) => setValorActivo(e.target.value)} placeholder="Ej: 50000" />
                   </FormControl>
                   {tipoLinea === 'LEASING_OPERATIVO' && (
                     <FormControl isRequired>
                       <FormLabel>Valor Residual</FormLabel>
                       <Input type="number" value={valorResidual} onChange={(e) => setValorResidual(e.target.value)} placeholder="Ej: 15000" />
                     </FormControl>
                   )}
                 </HStack>
               )}

               {tipoLinea === 'FACTORING' && (
                 <FormControl isRequired>
                   <FormLabel>Porcentaje de Financiamiento (%)</FormLabel>
                   <Input type="number" value={porcentajeFinanciamiento} onChange={(e) => setPorcentajeFinanciamiento(e.target.value)} 
                          placeholder="Ej: 80" min="0" max="100" />
                 </FormControl>
               )}

               {(tipoLinea === 'PRESTAMO_HIPOTECARIO' || tipoLinea === 'PRESTAMO_VEHICULAR') && (
                 <VStack spacing={4} w="full">
                   <FormControl isRequired>
                     <FormLabel>Tipo de Garantía</FormLabel>
                     <Select value={garantiaTipo} onChange={(e) => setGarantiaTipo(e.target.value as TipoGarantia)}>
                       {Object.entries(TIPOS_GARANTIA).map(([key, label]) => (
                         <option key={key} value={key}>{label}</option>
                       ))}
                     </Select>
                   </FormControl>
                   <FormControl isRequired>
                     <FormLabel>Descripción de la Garantía</FormLabel>
                     <Textarea value={garantiaDescripcion} onChange={(e) => setGarantiaDescripcion(e.target.value)} 
                               placeholder="Describa la garantía (dirección, modelo, año, etc.)" />
                   </FormControl>
                 </VStack>
               )}

               {tipoLinea === 'SOBREGIRO' && (
                 <FormControl isRequired>
                   <FormLabel>Límite de Sobregiro</FormLabel>
                   <Input type="number" value={limiteSobregiro} onChange={(e) => setLimiteSobregiro(e.target.value)} 
                          placeholder="Ej: 10000" />
                 </FormControl>
               )}

               {tipoLinea === 'CARTA_CREDITO' && (
                 <VStack spacing={4} w="full">
                   <HStack spacing={4} w="full">
                     <FormControl isRequired>
                       <FormLabel>Beneficiario</FormLabel>
                       <Input value={beneficiario} onChange={(e) => setBeneficiario(e.target.value)} 
                              placeholder="Nombre del beneficiario" />
                     </FormControl>
                     <FormControl isRequired>
                       <FormLabel>Banco Emisor</FormLabel>
                       <Input value={bancoEmisor} onChange={(e) => setBancoEmisor(e.target.value)} 
                              placeholder="Banco que emite la carta" />
                     </FormControl>
                   </HStack>
                   <FormControl isRequired>
                     <FormLabel>Documento de Respaldo</FormLabel>
                     <Input value={documentoRespaldo} onChange={(e) => setDocumentoRespaldo(e.target.value)} 
                            placeholder="Tipo de documento que respalda (factura, conocimiento de embarque, etc.)" />
                   </FormControl>
                 </VStack>
               )}

               <FormControl>
                 <FormLabel>Moneda</FormLabel>
                 <Select value={moneda} onChange={(e) => setMoneda(e.target.value as Moneda)}>
                   {Object.entries(MONEDAS).map(([key, label]) => (
                     <option key={key} value={key}>{label}</option>
                   ))}
                 </Select>
               </FormControl>
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
                  <FormLabel>Tipo de Línea</FormLabel>
                  <Select value={editTipoLinea} onChange={(e) => setEditTipoLinea(e.target.value as TipoLineaCredito)}>
                    {Object.entries(TIPOS_LINEA_CREDITO).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </Select>
                </FormControl>
              </HStack>
              <FormControl>
                <FormLabel>Cargos de Apertura</FormLabel>
                <Input type="number" value={editCargosApertura} onChange={(e) => setEditCargosApertura(e.target.value)} placeholder="Ej: 150.00" />
              </FormControl>
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
                  <Text><strong>Monto Total:</strong> {formatCurrency(linea.monto_total_linea, linea.moneda || 'USD')}</Text>
                  <Text><strong>Monto Disponible:</strong> {formatCurrency(linea.monto_disponible, linea.moneda || 'USD')}</Text>
                  {linea.interest_rate !== null && linea.interest_rate !== undefined && (
                    <Text><strong>Tasa Interés:</strong> {linea.interest_rate}%</Text>
                  )}
                  <Text><strong>Tipo:</strong> {TIPOS_LINEA_CREDITO[linea.tipo_linea as TipoLineaCredito] || linea.tipo_linea || 'Línea de Crédito'}</Text>
                  
                  {/* Información específica según el tipo */}
                  {linea.plazo_meses && (
                    <Text><strong>Plazo:</strong> {linea.plazo_meses} meses</Text>
                  )}
                  {linea.periodicidad_pago && (
                    <Text><strong>Periodicidad:</strong> {PERIODICIDAD_PAGO[linea.periodicidad_pago as keyof typeof PERIODICIDAD_PAGO] || linea.periodicidad_pago}</Text>
                  )}
                  {linea.valor_activo && (
                    <Text><strong>Valor Activo:</strong> {formatCurrency(linea.valor_activo, linea.moneda || 'USD')}</Text>
                  )}
                  {linea.valor_residual && linea.valor_residual > 1 && (
                    <Text><strong>Valor Residual:</strong> {formatCurrency(linea.valor_residual, linea.moneda || 'USD')}</Text>
                  )}
                  {linea.porcentaje_financiamiento && (
                    <Text><strong>% Financiamiento:</strong> {linea.porcentaje_financiamiento}%</Text>
                  )}
                  {linea.garantia_tipo && linea.garantia_tipo !== 'NINGUNA' && (
                    <Text><strong>Garantía:</strong> {TIPOS_GARANTIA[linea.garantia_tipo as keyof typeof TIPOS_GARANTIA] || linea.garantia_tipo}</Text>
                  )}
                  {linea.limite_sobregiro && (
                    <Text><strong>Límite Sobregiro:</strong> {formatCurrency(linea.limite_sobregiro, linea.moneda || 'USD')}</Text>
                  )}
                  {linea.beneficiario && (
                    <Text><strong>Beneficiario:</strong> {linea.beneficiario}</Text>
                  )}
                  
                  {/* Cálculos financieros */}
                  {(() => {
                    try {
                      const resultados = calcularLinea(linea);
                      const metricas = calcularMetricas(linea);
                      return (
                        <VStack align="start" spacing={1} mt={2} pt={2} borderTop="1px solid" borderColor="gray.200">
                          <Text fontSize="sm" fontWeight="bold" color="blue.600">Análisis Financiero:</Text>
                          {resultados.cuota_mensual && (
                            <Text fontSize="sm"><strong>Cuota Mensual:</strong> {formatCurrency(resultados.cuota_mensual, linea.moneda || 'USD')}</Text>
                          )}
                          <Text fontSize="sm"><strong>Costo Efectivo Anual:</strong> {metricas.costo_efectivo_anual.toFixed(2)}%</Text>
                          <Text fontSize="sm"><strong>Aprovechamiento Est.:</strong> {metricas.aprovechamiento_estimado}%</Text>
                          <Text fontSize="sm">
                            <strong>Nivel de Riesgo:</strong> 
                            <Text as="span" 
                                  color={metricas.riesgo_nivel === 'BAJO' ? 'green.500' : 
                                        metricas.riesgo_nivel === 'MEDIO' ? 'yellow.500' : 'red.500'}
                                  ml={1}>
                              {metricas.riesgo_nivel}
                            </Text>
                          </Text>
                        </VStack>
                      );
                    } catch (error) {
                      return null;
                    }
                  })()}
                  
                  {linea.cargos_apertura !== null && linea.cargos_apertura !== undefined && linea.cargos_apertura > 0 && (
                    <Text><strong>Cargos Apertura:</strong> {formatCurrency(linea.cargos_apertura, linea.moneda || 'USD')}</Text>
                  )}
                  <Text><strong>Fecha Inicio:</strong> {new Date(linea.fecha_inicio + 'T00:00:00').toLocaleDateString()}</Text>
                  <Text><strong>Fecha Fin:</strong> {new Date(linea.fecha_fin + 'T00:00:00').toLocaleDateString()}</Text>
                </VStack>
                <HStack spacing={2} w="full">
                  <Button 
                    size="sm" 
                    colorScheme="teal" 
                    leftIcon={<FaMoneyBillWave />}
                    onClick={() => handleRecordUsoModalOpen(linea.id)}
                    flex="1"
                  >
                    Registrar Uso/Pago
                  </Button>
                  <Button 
                    size="sm" 
                    colorScheme="purple" 
                    variant="outline"
                    leftIcon={<FaList />}
                    onClick={() => handleViewUsos(linea)}
                    flex="1"
                  >
                    Ver Usos
                  </Button>
                  {/* Solo mostrar botón de calendario si el tipo de línea genera calendario */}
                  {['TERMINO_FIJO', 'PRESTAMO_HIPOTECARIO', 'PRESTAMO_VEHICULAR', 'LEASING_OPERATIVO', 'LEASING_FINANCIERO'].includes(linea.tipo_linea || '') && (
                    <Button 
                      size="sm" 
                      colorScheme="blue" 
                      variant="outline"
                      leftIcon={<FaCalendarAlt />}
                      onClick={() => handleCalendarioModalOpen(linea)}
                      flex="1"
                    >
                      Ver Calendario
                    </Button>
                  )}
                </HStack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      )}

      <Heading size="lg" mb={6} mt={12}>Planificación Mensual de Líneas de Crédito</Heading>
      {(isLoading || isLoadingUsos) ? (
        <Center><Spinner size="xl" /></Center>
      ) : (
        <Tabs variant="enclosed" colorScheme="blue">
          <TabList>
            {periods.map((period, index) => (
              <Tab key={index}>{period.label}</Tab>
            ))}
          </TabList>
          <TabPanels>
            {periods.map((period, periodIndex) => (
              <TabPanel key={periodIndex} p={0} pt={4}>
                <TableContainer>
                  <Table variant="striped" colorScheme="gray" size="sm">
                    <TableCaption placement="top">
                      Vista mensual: {period.label}
                    </TableCaption>
                    <Thead>
                      <Tr>
                        <Th position="sticky" left={0} bg="gray.100" zIndex={1} minW="200px">
                          Línea de Crédito
                        </Th>
                        {period.months.map(month => (
                          <Th key={month.key} isNumeric minW="120px">
                            {month.display}
                          </Th>
                        ))}
                      </Tr>
                    </Thead>
                    <Tbody>
                      {lineas.length === 0 && !isLoading ? (
                        <Tr>
                          <Td colSpan={period.months.length + 1} textAlign="center">
                            No hay líneas de crédito para mostrar.
                          </Td>
                        </Tr>
                      ) : (
                        lineas.map((linea) => (
                          <Tr key={linea.id}>
                            <Td 
                              position="sticky" 
                              left={0} 
                              bg="white" 
                              zIndex={1} 
                              shadow="md"
                              fontWeight="medium"
                            >
                              {linea.nombre}
                            </Td>
                            {period.months.map(month => {
                              const netChange = getNetChangeForMonth(linea.id, month.date);
                              return (
                                <Td 
                                  key={`${linea.id}-${month.key}`} 
                                  isNumeric 
                                  color={
                                    netChange < 0 
                                      ? 'red.500' 
                                      : netChange > 0 
                                        ? 'green.500' 
                                        : 'gray.500'
                                  }
                                  fontWeight={netChange !== 0 ? "medium" : "normal"}
                                >
                                  {netChange !== 0 
                                    ? netChange.toLocaleString(undefined, { 
                                        style: 'currency', 
                                        currency: 'USD' 
                                      }) 
                                    : '-'
                                  }
                                </Td>
                              );
                            })}
                          </Tr>
                        ))
                      )}
                    </Tbody>
                  </Table>
                </TableContainer>
              </TabPanel>
            ))}
          </TabPanels>
        </Tabs>
      )}

      {/* Modal del Calendario de Pagos */}
      {selectedLineaForCalendario && (
        <CalendarioPagosModal
          isOpen={calendarioModalOpen}
          onClose={handleCalendarioModalClose}
          linea={selectedLineaForCalendario}
        />
      )}

      {/* Modal para Ver Usos Detallados */}
      <Modal isOpen={!!selectedLineaForUsos} onClose={handleCloseUsos} size="6xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Usos Detallados - {selectedLineaForUsos?.nombre}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedLineaForUsos && (
              <>
                <VStack spacing={4} align="start" mb={6}>
                  <Text><strong>Monto Total:</strong> {formatCurrency(selectedLineaForUsos.monto_total_linea, selectedLineaForUsos.moneda || 'USD')}</Text>
                  <Text><strong>Monto Disponible:</strong> {formatCurrency(selectedLineaForUsos.monto_disponible, selectedLineaForUsos.moneda || 'USD')}</Text>
                  <Text><strong>Monto Usado:</strong> {formatCurrency(selectedLineaForUsos.monto_total_linea - selectedLineaForUsos.monto_disponible, selectedLineaForUsos.moneda || 'USD')}</Text>
                </VStack>
                
                <TableContainer>
                  <Table variant="striped" colorScheme="gray" size="sm">
                    <Thead>
                      <Tr>
                        <Th>ID</Th>
                        <Th>Fecha</Th>
                        <Th>Tipo</Th>
                        <Th isNumeric>Monto</Th>
                        <Th>Descripción</Th>
                        <Th isNumeric>Cargo Transacción</Th>
                        <Th>Acciones</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {usosPorLinea[selectedLineaForUsos.id]?.length > 0 ? (
                        usosPorLinea[selectedLineaForUsos.id].map((uso: any) => (
                          <Tr key={uso.id}>
                            <Td>{uso.id}</Td>
                            <Td>{new Date(uso.fecha_uso + 'T00:00:00').toLocaleDateString()}</Td>
                            <Td>
                              <Text 
                                color={uso.tipo_transaccion === 'DRAWDOWN' ? 'red.500' : 'green.500'}
                                fontWeight="medium"
                              >
                                {uso.tipo_transaccion === 'DRAWDOWN' ? 'Disposición' : 
                                 uso.tipo_transaccion === 'PAYMENT' ? 'Pago' : 
                                 'Abono Cliente'}
                              </Text>
                            </Td>
                            <Td isNumeric>
                              <Text 
                                color={uso.tipo_transaccion === 'DRAWDOWN' ? 'red.500' : 'green.500'}
                                fontWeight="medium"
                              >
                                {uso.tipo_transaccion === 'DRAWDOWN' ? '+' : '-'}
                                {formatCurrency(Math.abs(uso.monto_usado), selectedLineaForUsos.moneda || 'USD')}
                              </Text>
                            </Td>
                            <Td>{uso.descripcion || '-'}</Td>
                            <Td isNumeric>
                              {uso.cargo_transaccion ? formatCurrency(uso.cargo_transaccion, selectedLineaForUsos.moneda || 'USD') : '-'}
                            </Td>
                            <Td>
                              <IconButton
                                aria-label="Eliminar uso"
                                icon={<DeleteIcon />}
                                size="sm"
                                colorScheme="red"
                                variant="outline"
                                onClick={() => handleDeleteUso(uso)}
                              />
                            </Td>
                          </Tr>
                        ))
                      ) : (
                        <Tr>
                          <Td colSpan={7} textAlign="center">
                            No hay usos registrados para esta línea de crédito.
                          </Td>
                        </Tr>
                      )}
                    </Tbody>
                  </Table>
                </TableContainer>
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={handleCloseUsos}>Cerrar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Diálogo de Confirmación para Eliminar Uso */}
      <AlertDialog
        isOpen={deleteUsoConfirmOpen}
        leastDestructiveRef={cancelRef}
        onClose={cancelDeleteUso}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Eliminar Uso de Línea de Crédito
            </AlertDialogHeader>

            <AlertDialogBody>
              {usoToDelete && (
                <>
                  <Text mb={4}>¿Está seguro que desea eliminar este uso? Esta acción no se puede deshacer.</Text>
                  <VStack align="start" spacing={2} p={4} borderRadius="md" bg="gray.50">
                    <Text><strong>Fecha:</strong> {new Date(usoToDelete.fecha_uso + 'T00:00:00').toLocaleDateString()}</Text>
                    <Text><strong>Tipo:</strong> {usoToDelete.tipo_transaccion === 'DRAWDOWN' ? 'Disposición' : 
                                                    usoToDelete.tipo_transaccion === 'PAYMENT' ? 'Pago' : 'Abono Cliente'}</Text>
                    <Text><strong>Monto:</strong> {formatCurrency(Math.abs(usoToDelete.monto_usado), selectedLineaForUsos?.moneda || 'USD')}</Text>
                    {usoToDelete.descripcion && <Text><strong>Descripción:</strong> {usoToDelete.descripcion}</Text>}
                  </VStack>
                </>
              )}
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={cancelDeleteUso}>
                Cancelar
              </Button>
              <Button 
                colorScheme="red" 
                onClick={confirmDeleteUso} 
                ml={3} 
                isLoading={isDeletingUso}
              >
                Eliminar Uso
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default LineasCreditoPage; 