import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Select,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  Alert,
  AlertIcon,
  HStack,
  VStack,
  Text
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import apiClient from '../api/api';
import type { PlantillaComisionesVentas } from '../types';

const VistaHistorialComisiones: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1); // 0-indexed to 1-indexed
  const [data, setData] = useState<PlantillaComisionesVentas[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i); // Last 5 years and next 4 years
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1, // 1-indexed for API
    label: new Date(0, i).toLocaleString('default', { month: 'long' }),
  }));

  const fetchData = async () => {
    if (!selectedYear || !selectedMonth) {
      setError("Por favor seleccione año y mes.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // Month is 1-indexed for the API
      const response = await apiClient.plantillaComisiones.getAll(selectedYear, selectedMonth);
      setData(response || []); // Assuming response is PlantillaComisionesVentas[]
    } catch (err) {
      setError('Error al cargar los datos de comisiones. ' + (err instanceof Error ? err.message : String(err)));
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box p={5}>
      <VStack spacing={5} align="stretch">
        <HStack justifyContent="space-between">
          <Heading as="h1" size="xl">
            Historial de Comisiones
          </Heading>
          <Button as={RouterLink} to="/ventas/gestionar-tabla-comisiones" colorScheme="gray">
            Volver a Tabla Actual
          </Button>
        </HStack>

        <HStack spacing={4}>
          <Select
            placeholder="Seleccionar Año"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </Select>
          <Select
            placeholder="Seleccionar Mes"
            value={selectedMonth} // API uses 1-indexed, state uses 1-indexed
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          >
            {months.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </Select>
          <Button colorScheme="blue" onClick={fetchData} isLoading={isLoading}>
            Cargar Datos
          </Button>
        </HStack>

        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {isLoading && <Spinner size="xl" />}

        {!isLoading && !error && data.length === 0 && (
          <Text>No hay datos para el mes y año seleccionado, o aún no ha cargado.</Text>
        )}
        
        {!isLoading && !error && data.length > 0 && (
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th>ID Venta</Th>
                <Th>Fecha Venta</Th>
                <Th>Vendedor</Th>
                <Th>Identificación Cliente</Th>
                <Th>Nombre Cliente</Th>
                <Th>Monto Venta</Th>
                <Th>Producto/Servicio</Th>
                <Th>Etapa</Th>
              </Tr>
            </Thead>
            <Tbody>
              {data.map((row) => (
                <Tr key={row.id}>
                  <Td>{row.id}</Td>
                  <Td>{new Date(row.fecha_venta).toLocaleDateString()}</Td>
                  <Td>{row.vendedor || 'N/A'}</Td>
                  <Td>{row.identificacion || 'N/A'}</Td>
                  <Td>{row.cliente || 'N/A'}</Td>
                  <Td isNumeric>{row.monto_venta?.toFixed(2) || '0.00'}</Td>
                  <Td>{row.producto_servicio || 'N/A'}</Td>
                  <Td>{row.etapa || 'N/A'}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </VStack>
    </Box>
  );
};

export default VistaHistorialComisiones; 