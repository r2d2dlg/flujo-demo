import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  HStack,
  Select,
  Spinner,
  Alert,
  AlertIcon,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  TableCaption,
  Button,
  Center,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { ArrowBackIcon } from '@chakra-ui/icons';
import apiClient from '../../api/api';
import type { FlujoGeneralIngresosResponse } from '../../api/api';

// Function to get a list of years (e.g., last 5 years to next 5 years)
const getYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear - 5; i <= currentYear + 5; i++) {
    years.push(i);
  }
  return years;
};

const monthNames = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

// Helper function to format currency
const formatCurrency = (value: string | number | undefined | null) => {
  const num = parseFloat(String(value || 0));
  return `L. ${num.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const FlujoGeneralEmpresaPage: React.FC = () => {
  const toast = useToast();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-indexed

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth + 1); // 1-indexed
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [ingresosData, setIngresosData] = useState<FlujoGeneralIngresosResponse | null>(null);
  // Placeholder states for other sections - these would eventually be fetched or calculated
  const [saldoInicialDelPeriodo, setSaldoInicialDelPeriodo] = useState<number>(0);
  const [totalEgresosOperativos, setTotalEgresosOperativos] = useState<number>(0);
  const [flujoNetoDeFinanciamiento, setFlujoNetoDeFinanciamiento] = useState<number>(0);

  const yearOptions = getYearOptions();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      setIngresosData(null);
      
      console.log(`Fetching ingresos data for ${selectedMonth}/${selectedYear}`);
      try {
        const response = await apiClient.contabilidadFlujoGeneralApi.getIngresosPorCobros(selectedYear, selectedMonth);
        setIngresosData(response.data);

        // Simulate fetching/setting other data for now
        // TODO: Replace with actual data fetching for these items
        setSaldoInicialDelPeriodo(5000);
        setTotalEgresosOperativos(1500);
        setFlujoNetoDeFinanciamiento(200);

      } catch (err: any) {
        const errorMessage = err.response?.data?.detail || "Error al cargar los datos de ingresos.";
        setError(errorMessage);
        toast({ title: 'Error de Carga', description: errorMessage, status: 'error', duration: 5000, isClosable: true });
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedYear, selectedMonth, toast]);

  // Calculate derived financial figures
  const totalIngresosOperativosNum = ingresosData?.total_cobros_mes ? parseFloat(String(ingresosData.total_cobros_mes)) : 0;
  const flujoEfectivoOperaciones = totalIngresosOperativosNum - totalEgresosOperativos;
  const saldoFinalDelPeriodo = saldoInicialDelPeriodo + flujoEfectivoOperaciones + flujoNetoDeFinanciamiento;

  return (
    <Box p={8}>
      <HStack justifyContent="space-between" alignItems="center" mb={8}>
        <Button as={RouterLink} to="/dashboard/contabilidad" variant="link" leftIcon={<ArrowBackIcon />}>
          Volver al Panel de Contabilidad
        </Button>
        <Heading as="h1" size="xl" textAlign="center" flexGrow={1}>
          Flujo General de Empresa
        </Heading>
      </HStack>

      <HStack spacing={4} mb={6} justifyContent="center">
        {/* Year and Month Selectors */}
        <Box>
          <Text mb={1} fontSize="sm">Año:</Text>
          <Select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            width="120px"
          >
            {yearOptions.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </Select>
        </Box>
        <Box>
          <Text mb={1} fontSize="sm">Mes:</Text>
          <Select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            width="150px"
          >
            {monthNames.map((name, index) => (
              <option key={index + 1} value={index + 1}>{name}</option>
            ))}
          </Select>
        </Box>
      </HStack>

      {isLoading && (
        <Center>
          <Spinner size="xl" />
          <Text mt={2}>Cargando datos...</Text>
        </Center>
      )}

      {error && !isLoading && (
        <Alert status="error" mb={6}>
          <AlertIcon />
          {error}
        </Alert>
      )}

      {!isLoading && !error && (
        <TableContainer mt={8}>
          <Table variant="striped" colorScheme="gray" size="md">
            <TableCaption placement="top">
              Flujo de Efectivo - {monthNames[selectedMonth - 1]} {selectedYear}
            </TableCaption>
            <Thead>
              <Tr>
                <Th position="sticky" left={0} bg="gray.100" zIndex={1} width="300px">
                  Concepto
                </Th>
                <Th isNumeric>Monto</Th>
              </Tr>
            </Thead>
            <Tbody>
              {/* Saldo Inicial */}
              <Tr>
                <Td position="sticky" left={0} bg="gray.50" zIndex={1} fontWeight="bold">
                  Saldo Inicial del Periodo
                </Td>
                <Td isNumeric fontWeight="bold" color="blue.600">
                  {formatCurrency(saldoInicialDelPeriodo)}
                </Td>
              </Tr>

              {/* Ingresos Header */}
              <Tr>
                <Td position="sticky" left={0} bg="green.50" zIndex={1} fontWeight="bold" color="green.700">
                  (+) INGRESOS OPERATIVOS
                </Td>
                <Td bg="green.50" />
              </Tr>

              {/* Ingresos Detail */}
              {ingresosData?.cobros_por_origen && ingresosData.cobros_por_origen.length > 0 ? (
                ingresosData.cobros_por_origen.map((ingreso, index) => (
                  <Tr key={index}>
                    <Td position="sticky" left={0} bg="gray.50" zIndex={1} pl={8}>
                      Cobros ({ingreso.origen_pago})
                    </Td>
                    <Td isNumeric color="green.600">
                      {formatCurrency(ingreso.total_monto)}
                    </Td>
                  </Tr>
                ))
              ) : (
                <Tr>
                  <Td position="sticky" left={0} bg="gray.50" zIndex={1} pl={8} fontStyle="italic" color="gray.500">
                    No se registraron cobros para este periodo
                  </Td>
                  <Td isNumeric color="green.600">
                    {formatCurrency(0)}
                  </Td>
                </Tr>
              )}

              {/* Total Ingresos */}
              <Tr fontWeight="bold">
                <Td position="sticky" left={0} bg="green.100" zIndex={1}>
                  Total Ingresos Operativos
                </Td>
                <Td isNumeric color="green.600" fontSize="lg">
                  {formatCurrency(totalIngresosOperativosNum)}
                </Td>
              </Tr>

              {/* Egresos Header */}
              <Tr>
                <Td position="sticky" left={0} bg="red.50" zIndex={1} fontWeight="bold" color="red.700">
                  (-) EGRESOS OPERATIVOS
                </Td>
                <Td bg="red.50" />
              </Tr>

              {/* Egresos Detail - Placeholder data */}
              <Tr>
                <Td position="sticky" left={0} bg="gray.50" zIndex={1} pl={8}>
                  Gastos de Marketing
                </Td>
                <Td isNumeric color="red.600">
                  {formatCurrency(0)}
                </Td>
              </Tr>
              <Tr>
                <Td position="sticky" left={0} bg="gray.50" zIndex={1} pl={8}>
                  Gastos Fijos Operativos
                </Td>
                <Td isNumeric color="red.600">
                  {formatCurrency(0)}
                </Td>
              </Tr>
              <Tr>
                <Td position="sticky" left={0} bg="gray.50" zIndex={1} pl={8}>
                  Gastos Variables/Otros
                </Td>
                <Td isNumeric color="red.600">
                  {formatCurrency(0)}
                </Td>
              </Tr>

              {/* Total Egresos */}
              <Tr fontWeight="bold">
                <Td position="sticky" left={0} bg="red.100" zIndex={1}>
                  Total Egresos Operativos
                </Td>
                <Td isNumeric color="red.600" fontSize="lg">
                  {formatCurrency(totalEgresosOperativos)}
                </Td>
              </Tr>

              {/* Flujo Operativo */}
              <Tr fontWeight="bold">
                <Td position="sticky" left={0} bg="gray.100" zIndex={1}>
                  Flujo de Efectivo de Operaciones
                </Td>
                <Td isNumeric color={flujoEfectivoOperaciones >= 0 ? 'green.600' : 'red.600'} fontSize="lg">
                  {formatCurrency(flujoEfectivoOperaciones)}
                </Td>
              </Tr>

              {/* Financiamiento Header */}
              <Tr>
                <Td position="sticky" left={0} bg="blue.50" zIndex={1} fontWeight="bold" color="blue.700">
                  (+/-) ACTIVIDADES DE FINANCIAMIENTO
                </Td>
                <Td bg="blue.50" />
              </Tr>

              {/* Financiamiento Detail - Placeholder data */}
              <Tr>
                <Td position="sticky" left={0} bg="gray.50" zIndex={1} pl={8}>
                  Desembolsos de Préstamos/Líneas de Crédito
                </Td>
                <Td isNumeric color="green.600">
                  {formatCurrency(0)}
                </Td>
              </Tr>
              <Tr>
                <Td position="sticky" left={0} bg="gray.50" zIndex={1} pl={8}>
                  Pagos de Préstamos/Líneas de Crédito (Capital)
                </Td>
                <Td isNumeric color="red.600">
                  {formatCurrency(0)}
                </Td>
              </Tr>
              <Tr>
                <Td position="sticky" left={0} bg="gray.50" zIndex={1} pl={8}>
                  Intereses Pagados
                </Td>
                <Td isNumeric color="red.600">
                  {formatCurrency(0)}
                </Td>
              </Tr>

              {/* Total Financiamiento */}
              <Tr fontWeight="bold">
                <Td position="sticky" left={0} bg="blue.100" zIndex={1}>
                  Flujo Neto de Financiamiento
                </Td>
                <Td isNumeric color={flujoNetoDeFinanciamiento >= 0 ? 'green.600' : 'red.600'} fontSize="lg">
                  {formatCurrency(flujoNetoDeFinanciamiento)}
                </Td>
              </Tr>

              {/* Saldo Final */}
              <Tr fontWeight="bold" bg="gray.100">
                <Td position="sticky" left={0} bg="gray.200" zIndex={1} fontSize="lg">
                  SALDO FINAL DEL PERIODO
                </Td>
                <Td isNumeric color="blue.700" fontSize="2xl" fontWeight="extrabold">
                  {formatCurrency(saldoFinalDelPeriodo)}
                </Td>
              </Tr>
            </Tbody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default FlujoGeneralEmpresaPage; 