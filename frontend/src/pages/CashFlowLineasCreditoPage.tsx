import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Heading,
  Text,
  Spinner,
  Center,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  TableCaption
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { Button, HStack } from '@chakra-ui/react';

import { lineasCreditoApi } from '../api/api';
import type { LineaCredito, LineaCreditoUso } from '../types/lineasDeCredito';

interface LineaCreditoWithUsos extends LineaCredito {
  usos: LineaCreditoUso[];
}

interface MonthlyProjectionData {
  month: Date;
  monthDisplay: string;
  openingBalanceGlobal: number;
  totalAbonosClienteGlobal: number;
  totalDrawdownsGlobal: number;
  totalPaymentsGlobal: number;
  totalOriginationChargesGlobal: number;
  totalTransactionChargesGlobal: number;
  totalInterestCalculatedGlobal: number;
  netCashFlowGlobal: number;
  closingBalanceGlobal: number;
  // We can add per-line details later if needed for drilling down
  // detailsByLinea: { [lineaId: number]: MonthlyLineaDetail }
}

// Helper to format month year for table headers
const formatMonthYearTable = (date: Date) => {
  return date.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
};

// Helper to format currency
const formatCurrency = (value: number) => {
  return value.toLocaleString('es-PA', { style: 'currency', currency: 'PAB', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  // Using PAB for Panamanian Balboa, adjust if USD is preferred or make it dynamic
};

const CashFlowLineasCreditoPage: React.FC = () => {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lineasConUsos, setLineasConUsos] = useState<LineaCreditoWithUsos[]>([]);
  const [projectedCashFlow, setProjectedCashFlow] = useState<MonthlyProjectionData[]>([]);
  const PROJECTION_MONTHS_COUNT = 24; // Project for 24 months

  const projectionMonths = useMemo(() => {
    const months = [];
    const today = new Date();
    today.setDate(1); // Start from the first day of the current month
    for (let i = 0; i < PROJECTION_MONTHS_COUNT; i++) {
      const monthDate = new Date(today);
      monthDate.setMonth(today.getMonth() + i);
      months.push(monthDate);
    }
    return months;
  }, [PROJECTION_MONTHS_COUNT]);

  const calculateProjection = useCallback((data: LineaCreditoWithUsos[]) => {
    if (data.length === 0) {
      setProjectedCashFlow([]);
      return;
    }
    console.log("Calculating projection with data:", JSON.parse(JSON.stringify(data))); // DEBUG

    let runningBalances: { [lineaId: number]: number } = {};
    data.forEach(linea => {
      // Initial drawn balance: total line - available. If available is somehow > total, assume 0 drawn.
      runningBalances[linea.id] = Math.max(0, linea.monto_total_linea - linea.monto_disponible);
    });

    const monthlyProjections: MonthlyProjectionData[] = projectionMonths.map(monthDate => {
      console.log(`Processing month: ${monthDate.toISOString()}`); // DEBUG
      let openingBalanceGlobalForMonth = 0;
      let totalAbonosClienteForMonth = 0;
      let totalDrawdownsForMonth = 0;
      let totalPaymentsForMonth = 0;
      let totalOriginationChargesForMonth = 0;
      let totalTransactionChargesForMonth = 0;
      let totalInterestForMonth = 0;

      data.forEach(linea => {
        const lineaOpeningDrawnBalance = runningBalances[linea.id];
        openingBalanceGlobalForMonth += lineaOpeningDrawnBalance;
        console.log(`Linea ID: ${linea.id}, Nombre: ${linea.nombre}, Opening Drawn: ${lineaOpeningDrawnBalance}, Usos for this linea:`, JSON.parse(JSON.stringify(linea.usos))); // DEBUG

        let drawdownsThisMonth = 0;
        let paymentsThisMonth = 0;
        let transactionChargesThisMonth = 0;
        let originationChargeThisMonth = 0;

        // Process usos for the current month and linea
        linea.usos.forEach(uso => {
          const usoDate = new Date(uso.fecha_uso + 'T00:00:00');
          if (usoDate.getFullYear() === monthDate.getFullYear() && usoDate.getMonth() === monthDate.getMonth()) {
            console.log(`  Processing uso for current month:`, JSON.parse(JSON.stringify(uso))); // DEBUG
            if (uso.tipo_transaccion === 'DRAWDOWN') {
              drawdownsThisMonth += uso.monto_usado;
              if (uso.cargo_transaccion && uso.cargo_transaccion > 0) {
                transactionChargesThisMonth += uso.cargo_transaccion;
              }
            } else if (uso.tipo_transaccion === 'PAYMENT') {
              paymentsThisMonth += uso.monto_usado;
            } else if (uso.tipo_transaccion === 'ABONO_COBRO_CLIENTE') {
              console.log(`    Found ABONO_COBRO_CLIENTE: ${uso.monto_usado}. totalAbonosClienteForMonth before adding: ${totalAbonosClienteForMonth}`); // DEBUG
              totalAbonosClienteForMonth += Math.abs(uso.monto_usado);
              console.log(`    totalAbonosClienteForMonth AFTER adding: ${totalAbonosClienteForMonth}`); // DEBUG
            }
          }
        });

        // Process origination charge for the current month and linea
        const inicioDate = new Date(linea.fecha_inicio + 'T00:00:00');
        if (linea.cargos_apertura && linea.cargos_apertura > 0 && 
            inicioDate.getFullYear() === monthDate.getFullYear() && inicioDate.getMonth() === monthDate.getMonth()) {
          originationChargeThisMonth = linea.cargos_apertura;
        }

        totalDrawdownsForMonth += drawdownsThisMonth;
        totalPaymentsForMonth += paymentsThisMonth; // payments are negative
        totalTransactionChargesForMonth += transactionChargesThisMonth;
        totalOriginationChargesForMonth += originationChargeThisMonth;

        // Update running balance for interest calculation (EOM before interest)
        // Drawn balance increases with drawdowns and charges, decreases with payments
        let eomBalanceBeforeInterest = lineaOpeningDrawnBalance + drawdownsThisMonth + transactionChargesThisMonth + originationChargeThisMonth + paymentsThisMonth;
        // Ensure balance isn't negative (can't overpay the principal in this model for interest calc)
        eomBalanceBeforeInterest = Math.max(0, eomBalanceBeforeInterest); 

        let interestThisMonth = 0;
        if (linea.interest_rate && linea.interest_rate > 0 && eomBalanceBeforeInterest > 0) {
          const monthlyRate = linea.interest_rate / 100 / 12;
          interestThisMonth = eomBalanceBeforeInterest * monthlyRate;
        }
        totalInterestForMonth += interestThisMonth;

        // Update running balance for the next month (EOM after interest)
        runningBalances[linea.id] = eomBalanceBeforeInterest + interestThisMonth;
      });
      console.log(`Month: ${monthDate.toISOString()}, Final totalAbonosClienteForMonth for this month: ${totalAbonosClienteForMonth}`); // DEBUG

      const netCashFlowForMonth = totalAbonosClienteForMonth + totalDrawdownsForMonth + totalPaymentsForMonth - totalOriginationChargesForMonth - totalTransactionChargesForMonth - totalInterestForMonth;
      // Note: payments are negative, so adding them reduces cash. Drawdowns are positive. Charges and interest are subtracted.
      
      let closingBalanceGlobalForMonth = 0;
      Object.values(runningBalances).forEach(bal => closingBalanceGlobalForMonth += bal);

      return {
        month: monthDate,
        monthDisplay: formatMonthYearTable(monthDate),
        openingBalanceGlobal: openingBalanceGlobalForMonth,
        totalAbonosClienteGlobal: totalAbonosClienteForMonth,
        totalDrawdownsGlobal: totalDrawdownsForMonth,
        totalPaymentsGlobal: totalPaymentsForMonth, // Will be negative or zero
        totalOriginationChargesGlobal: totalOriginationChargesForMonth,
        totalTransactionChargesGlobal: totalTransactionChargesForMonth,
        totalInterestCalculatedGlobal: totalInterestForMonth,
        netCashFlowGlobal: netCashFlowForMonth, 
        closingBalanceGlobal: closingBalanceGlobalForMonth,
      };
    });
    setProjectedCashFlow(monthlyProjections);
  }, [projectionMonths, PROJECTION_MONTHS_COUNT]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const lineasResponse = await lineasCreditoApi.getAll();
      const fetchedLineas = lineasResponse.data || [];
      
      const populatedLineas: LineaCreditoWithUsos[] = [];

      for (const linea of fetchedLineas) {
        try {
          const usosResponse = await lineasCreditoApi.getUsosByLineaId(linea.id);
          populatedLineas.push({
            ...linea,
            usos: usosResponse.data || [],
          });
        } catch (usosError) {
          console.error(`Error fetching usos for linea ${linea.id}:`, usosError);
          populatedLineas.push({
            ...linea,
            usos: [],
          });
          toast({
            title: `Error al cargar usos para línea "${linea.nombre}"`, 
            status: "warning", 
            duration: 3000, 
            isClosable: true
          });
        }
      }
      setLineasConUsos(populatedLineas);
      if (populatedLineas.length > 0) {
        calculateProjection(populatedLineas); // Calculate projection after data is fetched
      } else {
        setProjectedCashFlow([]); // Clear projection if no lines
      }
    } catch (err) {
      console.error("Error fetching lineas de credito data:", err);
      setError("No se pudieron cargar los datos de las líneas de crédito.");
      toast({ title: "Error General", description: "No se pudieron cargar los datos completos.", status: "error", duration: 5000, isClosable: true });
      setLineasConUsos([]);
      setProjectedCashFlow([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast, calculateProjection]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <Box p={8}>
      <HStack justifyContent="space-between" alignItems="center" mb={8}>
        <Button as={RouterLink} to="/dashboard" variant="link" leftIcon={<ArrowBackIcon />}>
          Volver al Panel de Administración
        </Button>
        <Heading as="h1" size="xl" textAlign="center" flexGrow={1}>
          Proyección de Flujo de Efectivo - Líneas de Crédito
        </Heading>
      </HStack>

      {isLoading ? (
        <Center><Spinner size="xl" mt={20} /></Center>
      ) : error ? (
        <Center><Text color="red.500" mt={20}>{error}</Text></Center>
      ) : (
        <Box>
          {lineasConUsos.length === 0 ? (
            <Text mt={10} textAlign="center">No hay líneas de crédito para proyectar. Agregue algunas en la página de gestión.</Text>
          ) : projectedCashFlow.length > 0 ? (
            <TableContainer mt={8}>
              <Table variant="striped" colorScheme="gray" size="sm">
                <TableCaption placement="top">Proyección de Flujo de Efectivo Global para Líneas de Crédito ({PROJECTION_MONTHS_COUNT} meses)</TableCaption>
                <Thead>
                  <Tr>
                    <Th position="sticky" left={0} bg="gray.100" zIndex={1}>Concepto</Th>
                    {projectedCashFlow.map(item => (
                      <Th key={item.monthDisplay} isNumeric>{item.monthDisplay}</Th>
                    ))}
                  </Tr>
                </Thead>
                <Tbody>
                  <Tr>
                    <Td position="sticky" left={0} bg="gray.50" zIndex={1}>Saldo Inicial Global</Td>
                    {projectedCashFlow.map(item => (
                      <Td key={`${item.monthDisplay}-opening`} isNumeric>{formatCurrency(item.openingBalanceGlobal)}</Td>
                    ))}
                  </Tr>

                  {/* Ingresos Operativos para Líneas */}
                  <Tr>
                    <Td position="sticky" left={0} bg="gray.50" zIndex={1} fontWeight="bold">Ingresos Operativos (Líneas)</Td>
                    {projectedCashFlow.map(item => (<Td key={`${item.monthDisplay}-ingresos-header`} bg="gray.50" />))}
                  </Tr>
                  <Tr>
                    <Td position="sticky" left={0} bg="gray.50" zIndex={1} pl={8}>Disposiciones (Drawdowns)</Td>
                    {projectedCashFlow.map(item => (
                      <Td key={`${item.monthDisplay}-drawdowns`} isNumeric color="green.600">{formatCurrency(item.totalDrawdownsGlobal)}</Td>
                    ))}
                  </Tr>
                  <Tr>
                    <Td position="sticky" left={0} bg="gray.50" zIndex={1} pl={8}>Abonos de Clientes a Líneas</Td>
                    {projectedCashFlow.map(item => (
                      <Td key={`${item.monthDisplay}-abonoscliente`} isNumeric color="green.600">{formatCurrency(item.totalAbonosClienteGlobal)}</Td>
                    ))}
                  </Tr>

                  {/* Egresos Operativos para Líneas */}
                  <Tr>
                    <Td position="sticky" left={0} bg="gray.50" zIndex={1} fontWeight="bold">Egresos Operativos (Líneas)</Td>
                    {projectedCashFlow.map(item => (<Td key={`${item.monthDisplay}-egresos-header`} bg="gray.50" />))}
                  </Tr>
                  <Tr>
                    <Td position="sticky" left={0} bg="gray.50" zIndex={1} pl={8}>Pagos a Líneas (Directos)</Td>
                    {projectedCashFlow.map(item => (
                      <Td key={`${item.monthDisplay}-payments`} isNumeric color="red.600">{formatCurrency(-item.totalPaymentsGlobal)}</Td>
                    ))}
                  </Tr>
                  <Tr>
                    <Td position="sticky" left={0} bg="gray.50" zIndex={1} pl={8}>Cargos por Originación</Td>
                    {projectedCashFlow.map(item => (
                      <Td key={`${item.monthDisplay}-origination`} isNumeric color="red.600">{formatCurrency(item.totalOriginationChargesGlobal)}</Td>
                    ))}
                  </Tr>
                  <Tr>
                    <Td position="sticky" left={0} bg="gray.50" zIndex={1} pl={8}>Cargos por Transacción (en Disposiciones)</Td>
                    {projectedCashFlow.map(item => (
                      <Td key={`${item.monthDisplay}-transactioncharges`} isNumeric color="red.600">{formatCurrency(item.totalTransactionChargesGlobal)}</Td>
                    ))}
                  </Tr>
                  <Tr>
                    <Td position="sticky" left={0} bg="gray.50" zIndex={1} pl={8}>Intereses Calculados</Td>
                    {projectedCashFlow.map(item => (
                      <Td key={`${item.monthDisplay}-interest`} isNumeric color="red.600">{formatCurrency(item.totalInterestCalculatedGlobal)}</Td>
                    ))}
                  </Tr>

                  {/* Flujo Neto y Saldo Final */}
                  <Tr fontWeight="bold">
                    <Td position="sticky" left={0} bg="gray.100" zIndex={1}>Flujo de Efectivo Neto del Mes</Td>
                    {projectedCashFlow.map(item => (
                      <Td key={`${item.monthDisplay}-netflow`} isNumeric color={item.netCashFlowGlobal >= 0 ? 'green.600' : 'red.600'}>{formatCurrency(item.netCashFlowGlobal)}</Td>
                    ))}
                  </Tr>
                  <Tr fontWeight="bold">
                    <Td position="sticky" left={0} bg="gray.100" zIndex={1}>Saldo Final Global (Deuda)</Td>
                    {projectedCashFlow.map(item => (
                      <Td key={`${item.monthDisplay}-closing`} isNumeric>{formatCurrency(item.closingBalanceGlobal)}</Td>
                    ))}
                  </Tr>
                </Tbody>
              </Table>
            </TableContainer>
          ) : (
            <Text mt={10} textAlign="center">Calculando proyección o no hay datos suficientes...</Text>
          )}
        </Box>
      )}
    </Box>
  );
};

export default CashFlowLineasCreditoPage; 