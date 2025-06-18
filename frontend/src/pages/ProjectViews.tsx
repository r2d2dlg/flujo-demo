import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Heading, Spinner, Center, Table, Thead, Tbody, Tr, Th, Td, SimpleGrid, Text, Button, TableContainer } from '@chakra-ui/react';
import { api } from '../api/api';

interface TableRow {
  [key: string]: any;
}

// Original function to identify any column that looks like a month
function getDynamicMonthColumns(allColumns: string[]): string[] {
  // Regex to match formats like 'YYYY/MM', 'YYYY-MM', 'YYYY_MM'
  const monthRegex = /^\d{4}[-_\/](0[1-9]|1[0-2])$/;
  return allColumns.filter(col => monthRegex.test(col));
}

// Original function to parse, sort, and filter month columns to a rolling window
function getDynamicMonthRange(monthCols: string[]): string[] {
  const parseMonth = (col: string): Date | null => {
    // Replace underscore or slash with dash for consistent parsing
    const normalized = col.replace(/[_\/]/, '-');
    const d = new Date(`${normalized}-01T00:00:00`);
    // Check if the date is valid
    return isNaN(d.getTime()) ? null : d;
  };

  const sorted = monthCols
    .map(col => ({ col, date: parseMonth(col) }))
    .filter(x => x.date)
    .sort((a, b) => a.date!.getTime() - b.date!.getTime());

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Find the index of the current or first future month
  let currentMonthIndex = sorted.findIndex(x => x.date && x.date >= now);
  if (currentMonthIndex === -1) {
    currentMonthIndex = sorted.length; // All months are in the past
  }

  // Set window: 3 months before the current month, and 36 months after
  const start = Math.max(0, currentMonthIndex - 3);
  const end = Math.min(sorted.length, currentMonthIndex + 36);

  return sorted.slice(start, end).map(x => x.col);
}

function ViewTable({ title, viewName, projectKeyword }: { title: string; viewName: string; projectKeyword: string }) {
  const [columns, setColumns] = useState<string[]>([]);
  const [data, setData] = useState<TableRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchView = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get(`/api/marketing/${projectKeyword}/view/${viewName}`);
        setColumns(response.data.columns || []);
        setData(response.data.data || []);
        console.log('Fetched columns:', response.data.columns);
      } catch (e) {
        setError('No se pudo cargar la vista.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchView();
  }, [projectKeyword, viewName]);

  if (isLoading) return <Spinner size="md" />;
  if (error) return <Text color="red.500">{error}</Text>;
  if (!data.length) return <Text color="gray.500">Sin datos.</Text>;

  // Identify month columns from the backend
  const allMonthCols = getDynamicMonthColumns(columns);
  // Filter to the dynamic rolling window
  const dynamicMonths = getDynamicMonthRange(allMonthCols);
  // Identify non-month columns
  const alwaysShowCols = columns.filter(col => !allMonthCols.includes(col));
  // Combine for display
  const displayCols = [...alwaysShowCols, ...dynamicMonths];

  return (
    <Box mb={8}>
      <Heading as="h3" size="md" mb={2}>{title}</Heading>
      <TableContainer>
        <Table variant="striped" size="sm">
          <Thead>
            <Tr>
              {displayCols.map(col => <Th key={col}>{col}</Th>)}
            </Tr>
          </Thead>
          <Tbody>
            {data.map((row, i) => (
              <Tr key={i}>
                {displayCols.map(col => <Td key={col}>{row[col] || '-'}</Td>)}
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default function ProjectViews() {
  const { projectId = '' } = useParams<{ projectId: string }>();
  // Extract keyword: 'proyecto_brazil' -> 'brazil', 'presupuesto_mercadeo_chepo' -> 'chepo'
  let keyword = projectId;
  if (projectId.startsWith('proyecto_')) {
    keyword = projectId.substring('proyecto_'.length);
  } else if (projectId.startsWith('presupuesto_mercadeo_')) {
    keyword = projectId.substring('presupuesto_mercadeo_'.length);
  }

  const fullView = `vista_presupuesto_mercadeo_${keyword}_full`;
  const resumenView = `vista_presupuesto_mercadeo_${keyword}_resumen`;

  return (
    <Box p={8}>
      <Heading as="h1" size="lg" mb={8}>
        Vistas de Proyecto: {projectId}
      </Heading>
      <Box>
        <ViewTable title="Vista Consolidada (Todas las filas)" viewName={fullView} projectKeyword={keyword} />
        <ViewTable title="Vista Resumida (Totales por tabla + Gran Total)" viewName={resumenView} projectKeyword={keyword} />
      </Box>
      <Button mt={8} as="a" href="/dashboard" colorScheme="blue">Volver al Dashboard</Button>
    </Box>
  );
} 