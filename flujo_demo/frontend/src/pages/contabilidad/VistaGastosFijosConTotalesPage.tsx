import { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Heading,
  Text,
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
  VStack,
  HStack,
} from '@chakra-ui/react';
import { api } from '../../api/api'; // Adjusted path

interface ApiResponse<T> {
  columns: string[];
  data: T;
}

interface ViewRow {
  [key: string]: any;
}

const VIEW_NAME = "v_presupuesto_gastos_fijos_operativos_resumen";

// Helper function to get month and year, e.g., "Jul 2024"
const getMonthYearString = (date: Date): string => {
  return date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
};

export default function VistaGastosFijosConTotalesPage() {
  const toast = useToast();
  const [viewData, setViewData] = useState<ViewRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [dynamicColumnHeaders, setDynamicColumnHeaders] = useState<{[key: string]: string}>({});

  useEffect(() => {
    const currentDate = new Date();
    const currentMonthStr = getMonthYearString(currentDate);
    const past1MonthStr = getMonthYearString(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const past2MonthStr = getMonthYearString(new Date(currentDate.getFullYear(), currentDate.getMonth() - 2, 1));
    const past3MonthStr = getMonthYearString(new Date(currentDate.getFullYear(), currentDate.getMonth() - 3, 1));

    setDynamicColumnHeaders({
      "Corriente": currentMonthStr,
      "Pasado_1": past1MonthStr,
      "Pasado_2": past2MonthStr,
      "Pasado_3": past3MonthStr,
    });
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Use the new generic view endpoint, adjust path if needed
      const response = await api.get<ApiResponse<ViewRow[]>>(`/api/tables/${VIEW_NAME}/data`,
        { headers: { 'ngrok-skip-browser-warning': 'true' } }
      );
      if (response.data && response.data.columns && response.data.data) {
        setColumns(response.data.columns);
        setViewData(response.data.data);
      } else {
        setColumns([]);
        setViewData([]);
        toast({ title: 'Datos no recibidos', description: 'La respuesta del API no contuvo columnas o datos.', status: 'warning' });
      }
    } catch (error) {
      toast({ title: 'Error al cargar datos de la vista', description: String(error), status: 'error' });
      setColumns([]);
      setViewData([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const renderTable = () => {
    if (isLoading) return <Center h="200px"><Spinner size="xl" /></Center>;
    if (!columns || columns.length === 0) return <Text>La vista '{VIEW_NAME}' podría no existir, estar vacía o no tener columnas definidas.</Text>;

    // Define the order of columns as they should appear in the table
    const displayColumns = [
      "CONCEPTO",
      "ENERO",
      "FEBRERO",
      "MARZO",
      "ABRIL",
      "MAYO",
      "JUNIO",
      "JULIO",
      "AGOSTO",
      "SEPTIEMBRE",
      "OCTUBRE",
      "NOVIEMBRE",
      "DICIEMBRE",
      "TOTAL_ANUAL"
    ];

    // Filter out columns that are not present in the API response, just in case
    const availableDisplayColumns = displayColumns.filter(col => columns.includes(col));

    return (
      <TableContainer>
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              {availableDisplayColumns.map((column) => (
                <Th key={column}>
                  {dynamicColumnHeaders[column] || column.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {viewData.map((row, rowIndex) => (
              <Tr key={rowIndex}>
                {availableDisplayColumns.map((column) => (
                  <Td key={`${column}-${rowIndex}`}>
                    {typeof row[column] === 'boolean' ? (row[column] ? 'Sí' : 'No') : 
                     typeof row[column] === 'number' ? row[column].toLocaleString('es-ES', {minimumFractionDigits: 2, maximumFractionDigits: 2}) :
                     row[column]}
                  </Td>
                ))}
              </Tr>
            ))}
            {viewData.length === 0 && !isLoading && (
              <Tr>
                <Td colSpan={availableDisplayColumns.length} textAlign="center">
                  No hay datos disponibles para la vista {VIEW_NAME}.
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box p={5}>
      <VStack spacing={5} align="stretch">
        <HStack justifyContent="space-between" alignItems="center">
          <Heading as="h1" size="lg">
            Vista: {VIEW_NAME.replace(/_/g, ' ').replace(/^v /i, '').replace(/\b\w/g, l => l.toUpperCase())}
          </Heading>
          <Button as={RouterLink} to="/dashboard-contabilidad" colorScheme="gray">
            Volver a Dashboard Contabilidad
          </Button>
        </HStack>
        
        {renderTable()}
      </VStack>
    </Box>
  );
} 