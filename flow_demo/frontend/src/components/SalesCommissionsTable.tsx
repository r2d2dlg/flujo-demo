import { useEffect, useState } from 'react';
import { api } from '../api/api';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableCaption,
  TableContainer,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Box,
  Text,
} from '@chakra-ui/react';

interface CommissionDataRow {
  id?: number | string | null; // Allow string for transaction ID from plantilla_comisiones_ventas
  tipo_fila?: string; 
  fecha_venta?: string | null; 
  cliente?: string;
  producto_servicio?: string;
  monto_venta?: number | string; // Can be string then parsed, or number
  comision_vendedor?: number | string; // For salesperson specific commission
  [key: string]: any; // Keep for overview data if needed
}

interface SalesCommissionsTableProps {
  salespersonId?: string; 
}

// Define a type for our specific salesperson data headers
interface SalespersonSpecificHeader {
  key: keyof CommissionDataRow; // Ensures keys are valid for our data
  label: string;
  isNumeric?: boolean;
}

export default function SalesCommissionsTable({ salespersonId }: SalesCommissionsTableProps) { 
  const [data, setData] = useState<CommissionDataRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const endpoint = salespersonId 
          ? `/api/ventas/comisiones-data?salespersonId=${salespersonId}`
          : '/api/ventas/comisiones-data';
        console.log(`[SalesCommissionsTable] Fetching from endpoint: ${endpoint}`); 
        const response = await api.get<CommissionDataRow[]> (endpoint, { headers: { 'ngrok-skip-browser-warning': 'true' } }); 
        if (response.data && Array.isArray(response.data)) {
          setData(response.data);
        } else {
          setData([]); 
          if (response.data && (response.data as any).message) {
            console.info('API Message:', (response.data as any).message);
          }
        }
      } catch (err: any) {
        let errorMessage = 'Failed to fetch sales commissions data.';
        if (err.response && err.response.data && err.response.data.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.message) {
          errorMessage = err.message;
        }
        setError(errorMessage);
        console.error("Error fetching sales commissions data:", err);
      }
      setIsLoading(false);
    };

    fetchData();
  }, [salespersonId]); 

  if (isLoading) {
    return (
      <Box textAlign="center" p={5}>
        <Spinner size="xl" />
        <Text mt={2}>Loading sales commissions...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        <AlertTitle>Error!</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (data.length === 0) {
    return (
      <Alert status="info">
        <AlertIcon />
        <AlertTitle>No Data</AlertTitle>
        <AlertDescription>No sales commissions data found for the current selection.</AlertDescription>
      </Alert>
    );
  }

  let tableHeaders: Array<SalespersonSpecificHeader | string>;
  let isSalespersonSpecificView = !!salespersonId;

  if (isSalespersonSpecificView) {
    tableHeaders = [
      { key: 'fecha_venta', label: 'Fecha Venta', isNumeric: false },
      { key: 'cliente', label: 'Cliente', isNumeric: false },
      { key: 'producto_servicio', label: 'Producto/Servicio', isNumeric: false },
      { key: 'monto_venta', label: 'Monto Venta', isNumeric: true },
      { key: 'comision_vendedor', label: 'Comisión Vendedor', isNumeric: true },
    ];
  } else {
    // Fallback to dynamic headers for overview (original logic)
    const columnOrder = ['fecha_venta'];
    const allKeys = Object.keys(data[0] || {});
    const dynamicColumnHeaders = allKeys.filter(
      key => key !== 'id' && key !== 'tipo_fila' && key !== 'fecha_venta'
    );
    tableHeaders = [...columnOrder, ...dynamicColumnHeaders].filter(key => allKeys.includes(key));
  }

  return (
    <TableContainer>
      <Table variant="striped" colorScheme="gray" size="sm">
        <TableCaption placement="top">
          {isSalespersonSpecificView ? 'Detalle de Comisiones por Vendedor' : 'Resumen de Comisiones'}
        </TableCaption>
        <Thead>
          <Tr>
            {tableHeaders.map((headerOrConfig) => {
              const label = typeof headerOrConfig === 'string' ? headerOrConfig.replace(/_/g, ' ').toUpperCase() : headerOrConfig.label;
              const isNumeric = typeof headerOrConfig === 'string' ? (headerOrConfig !== 'fecha_venta' && headerOrConfig !== 'tipo_fila') : headerOrConfig.isNumeric;
              return (
                <Th key={label} isNumeric={isNumeric}>
                  {label}
                </Th>
              );
            })}
          </Tr>
        </Thead>
        <Tbody>
          {data.map((row, rowIndex) => {
            // For salesperson specific view, we don't use tipo_fila for styling directly here
            // but the original view (no salespersonId) might still use it.
            const isTotalRow = !isSalespersonSpecificView && row.tipo_fila === 'TOTAL';
            return (
              <Tr 
                key={row.id || (isSalespersonSpecificView ? `salesperson-row-${rowIndex}` : `total-row-${rowIndex}`)} 
                fontWeight={isTotalRow ? 'bold' : 'normal'} 
                bg={isTotalRow ? 'gray.200' : undefined}
              >
                {tableHeaders.map((headerOrConfig) => {
                  const key = typeof headerOrConfig === 'string' ? headerOrConfig : headerOrConfig.key;
                  const isNumeric = typeof headerOrConfig === 'string' ? (headerOrConfig !== 'fecha_venta' && headerOrConfig !== 'tipo_fila') : headerOrConfig.isNumeric;
                  let cellValue = row[key];

                  // Formatting for specific view
                  if (isSalespersonSpecificView) {
                    if (key === 'fecha_venta' && cellValue) {
                      cellValue = new Date(cellValue as string).toLocaleDateString();
                    } else if (key === 'comision_vendedor') { 
                      // Extract commission from personal_comisiones object
                      if (row.personal_comisiones && salespersonId && row.personal_comisiones[salespersonId] !== undefined) {
                        const commissionAmount = row.personal_comisiones[salespersonId];
                        cellValue = (typeof commissionAmount === 'number' ? commissionAmount : parseFloat(String(commissionAmount))) 
                                      .toLocaleString(undefined, { style: 'currency', currency: 'USD' });
                      } else {
                        cellValue = '-'; // Or 0.00, or display based on context
                      }
                    } else if (key === 'monto_venta' && typeof cellValue === 'number') {
                      cellValue = cellValue.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
                    } else if (cellValue === null || cellValue === undefined) {
                        cellValue = '-';
                    }
                  } else {
                    // Original generic formatting for overview data
                    if (cellValue === null || cellValue === undefined) {
                        cellValue = '-';
                    } else if (typeof cellValue === 'number' && key !== 'id') { // Assuming 'id' from overview should not be formatted as number string
                        cellValue = cellValue.toLocaleString();
                    } 
                  }
                  
                  return (
                    <Td key={`${typeof key === 'symbol' ? String(key) : key}-${rowIndex}`} isNumeric={isNumeric}>
                      {cellValue}
                    </Td>
                  );
                })}
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </TableContainer>
  );
} 