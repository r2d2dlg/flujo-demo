import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Box, 
  Heading, 
  Table, 
  Thead, 
  Tbody, 
  Tr, 
  Th, 
  Td, 
  TableContainer, 
  Select, 
  useToast, 
  Spinner, 
  Center, 
  Text, 
  HStack, 
  Button, 
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  IconButton,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  VStack,
  FormControl,
  FormLabel
} from '@chakra-ui/react';
import { DeleteIcon, AddIcon, EditIcon } from '@chakra-ui/icons';
import TableRowForm from '../components/TableRowForm';
import { api } from '../api/api';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
dayjs.extend(advancedFormat);

interface TableRow {
  [key: string]: any;
}

interface Period {
  label: string;
  months: string[];
}

const HIDDEN_COLUMNS = ['id', 'created_at', 'updated_at'];

export default function ProjectTables() {
  console.log('[ProjectTables] Component function invoked.');
  const { projectId = '' } = useParams<{ projectId: string }>();
  console.log('[ProjectTables] Rendering with projectId from URL:', projectId);

  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [tableToDelete, setTableToDelete] = useState<string | null>(null);
  const [isAddRowOpen, setIsAddRowOpen] = useState(false);
  const [tableColumns, setTableColumns] = useState<string[]>([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { 
    isOpen: isDeleteRowOpen, 
    onOpen: onDeleteRowOpen, 
    onClose: onDeleteRowClose 
  } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [rowToDeleteId, setRowToDeleteId] = useState<any | null>(null);
  const [isDeletingRow, setIsDeletingRow] = useState(false);
  const [rowToEdit, setRowToEdit] = useState<TableRow | null>(null);
  const [tableData, setTableData] = useState<TableRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const toast = useToast();
  const [isSubmittingRow, setIsSubmittingRow] = useState(false);

  // Helper function to format period labels (2025_01 -> Ene 2025)
  const formatPeriodLabel = (period: string): string => {
    const [year, month] = period.split('_');
    const monthNames = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];
    const monthIndex = parseInt(month) - 1;
    return `${monthNames[monthIndex]} ${year}`;
  };

  // Generate periods for tabs (groups of 12 months)
  const periods = useMemo(() => {
    const now = new Date();
    const months: string[] = [];
    
    // Generate 39 months (current + 38 future)
    for (let i = 0; i < 39; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      months.push(`${date.getFullYear()}_${String(date.getMonth() + 1).padStart(2, '0')}`);
    }
    
    // Group by 12 months per period
    const periods: Period[] = [];
    for (let i = 0; i < months.length; i += 12) {
      const periodStart = months[i];
      const periodEnd = months[Math.min(i + 11, months.length - 1)];
      
      periods.push({
        label: `${formatPeriodLabel(periodStart)} - ${formatPeriodLabel(periodEnd)}`,
        months: months.slice(i, i + 12)
      });
    }
    return periods;
  }, []);

  // Helper function to format column names for display
  const formatColumnName = (name: string): string => {
    // Handle special column names
    if (name === 'CONCEPTO') return 'Concepto';
    if (name === 'actividad') return 'Actividad';
    if (name === 'id') return 'ID';
    if (name === 'created_at') return 'Creado';
    if (name === 'updated_at') return 'Actualizado';
    
    // Handle period columns (2025_01 -> Ene 2025)
    if (/^\d{4}_\d{2}$/.test(name)) {
      return formatPeriodLabel(name);
    }
    
    // Handle amount columns (amount_2025_03 -> Mar 2025)
    if (name.startsWith('amount_')) {
      const [, year, month] = name.split('_');
      const monthNames = [
        'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
        'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
      ];
      const monthIndex = parseInt(month) - 1;
      if (monthIndex >= 0 && monthIndex < 12) {
        return `${monthNames[monthIndex]} ${year}`;
      }
    }
    
    // Default formatting
    return name
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  useEffect(() => {
    console.log('[ProjectTables] fetchTables useEffect triggered. projectId:', projectId);
    const fetchTables = async () => {
      if (!projectId) {
        console.log('[ProjectTables] fetchTables: projectId is empty, returning.');
        return;
      }
      
      const keyword = projectId.startsWith('proyecto_') ? projectId.substring('proyecto_'.length) : projectId;
      console.log('[ProjectTables] fetchTables: using keyword (derived from projectId):', keyword);

      try {
        setIsLoading(true);
        const response = await api.get(`/api/marketing/${keyword}/tables`, {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        
        if (!response.data.tables || response.data.tables.length === 0) {
          toast({
            title: 'No se encontraron tablas',
            description: `No se encontraron tablas para el proyecto ${keyword}`,
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
          setTables([]);
          return;
        }
        
        // Filter out the consolidated views and system tables, and only include tables for this project
        const prefix = `presupuesto_mercadeo_${keyword}_`;
        const validTables = response.data.tables.filter((table: string) => {
          return table.startsWith(prefix) &&
                 !table.endsWith('_consolidado') &&
                 !table.startsWith('v_');
        });
        
        if (validTables.length === 0) {
          toast({
            title: 'No se encontraron tablas válidas',
            description: 'Las tablas encontradas no tienen el formato esperado',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
          setTables([]);
          return;
        }
        
        setTables(validTables);
        setSelectedTable(validTables[0]);
      } catch (error) {
        console.error('Error fetching tables:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar las tablas del proyecto',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId) {
      fetchTables();
    }
  }, [projectId, toast]);

  const fetchTableData = async () => {
    console.log('[ProjectTables] fetchTableData triggered. SelectedTable:', selectedTable, 'projectId:', projectId);
    if (!selectedTable || !projectId) {
      console.log('[ProjectTables] fetchTableData: selectedTable or projectId is empty, returning.');
      return;
    }
    const keyword = projectId.startsWith('proyecto_') ? projectId.substring('proyecto_'.length) : projectId;
    console.log('[ProjectTables] fetchTableData: using keyword (derived from projectId):', keyword, 'for table:', selectedTable);
    
    try {
      setIsLoading(true);
      // Use the regular table endpoint instead of /raw
      const response = await api.get(`/api/marketing/${keyword}/table/${selectedTable}`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      
      if (response.data && response.data.columns && response.data.data) {
        // Transform array data to object format for easier handling
        const columns = response.data.columns;
        const transformedData = response.data.data.map((row: any[], index: number) => {
          const rowObj: any = { id: index };
          columns.forEach((col: string, colIndex: number) => {
            rowObj[col] = row[colIndex];
          });
          return rowObj;
        });
        
        setTableColumns(columns);
        setTableData(transformedData);
      } else {
        setTableColumns([]);
        setTableData([]);
        toast({
          title: 'Tabla no disponible',
          description: 'La tabla aún no está lista. Por favor, intente recargar la página en unos momentos.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error fetching table data:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos de la tabla',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch table data when selected table changes
  useEffect(() => {
    console.log('[ProjectTables] fetchTableData useEffect triggered (for table data). SelectedTable:', selectedTable, 'projectId:', projectId);
    if (selectedTable) {
      const timer = setTimeout(() => {
        fetchTableData();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedTable, projectId]);

  // Get non-month columns (for left side of table)
  const nonMonthColumns = useMemo(() => {
    return tableColumns.filter(col => 
      !HIDDEN_COLUMNS.includes(col) && 
      !/^\d{4}_\d{2}$/.test(col) && 
      !col.startsWith('amount_')
    );
  }, [tableColumns]);

  // Get value for a specific cell
  const getCellValue = (row: TableRow, column: string) => {
    const value = row[column];
    if (typeof value === 'number') {
      return value.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
      });
    }
    return value || '';
  };

  // Calculate column total
  const getColumnTotal = (column: string) => {
    const total = tableData.reduce((sum, row) => {
      const value = row[column];
      return sum + (typeof value === 'number' ? value : 0);
    }, 0);
    return total.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    });
  };

  const executeDeleteRow = async (rowId: any) => {
    if (!selectedTable || !projectId) return;
    
    const keyword = projectId.startsWith('proyecto_') ? projectId.substring('proyecto_'.length) : projectId;
    
    try {
      setIsDeletingRow(true);
      console.log(`Deleting row ${rowId} from table ${selectedTable}`);
      
      await api.delete(`/api/marketing/${keyword}/table/${selectedTable}/row/${rowId}`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      
      toast({
        title: 'Fila eliminada',
        description: 'La fila ha sido eliminada exitosamente',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      fetchTableData();
      onDeleteRowClose();
    } catch (error) {
      console.error('Error deleting row:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la fila',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsDeletingRow(false);
      setRowToDeleteId(null);
    }
  };

  const handleDeleteTable = async (tableName: string) => {
    if (!projectId) return;
    
    const keyword = projectId.startsWith('proyecto_') ? projectId.substring('proyecto_'.length) : projectId;
    
    try {
      setIsDeleting(true);
      console.log(`Deleting table: ${tableName}`);
      
      await api.delete(`/api/marketing/${keyword}/table/${tableName}`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      
      toast({
        title: 'Tabla eliminada',
        description: `La tabla ${tableName} ha sido eliminada exitosamente`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Refresh tables list
      const response = await api.get(`/api/marketing/${keyword}/tables`);
      if (response.data.tables) {
        setTables(response.data.tables);
        setSelectedTable(response.data.tables[0] || '');
      }
      
      onClose();
    } catch (error) {
      console.error('Error deleting table:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la tabla',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
      setTableToDelete(null);
    }
  };

  const handleAddRow = async (data: Record<string, any>) => {
    if (!selectedTable || !projectId) return;
    
    const keyword = projectId.startsWith('proyecto_') ? projectId.substring('proyecto_'.length) : projectId;
    
    try {
      setIsSubmittingRow(true);
      console.log('Adding row to table:', selectedTable, 'Data:', data);
      
      await api.post(`/api/marketing/${keyword}/table/${selectedTable}/row`, data, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      
      toast({
        title: 'Fila agregada',
        description: 'La nueva fila ha sido agregada exitosamente',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      fetchTableData();
      setIsAddRowOpen(false);
    } catch (error) {
      console.error('Error adding row:', error);
      toast({
        title: 'Error',
        description: 'No se pudo agregar la fila',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmittingRow(false);
    }
  };

  const executeUpdateRow = async (data: Record<string, any>) => {
    if (!selectedTable || !projectId || !rowToEdit) return;
    
    const keyword = projectId.startsWith('proyecto_') ? projectId.substring('proyecto_'.length) : projectId;
    
    try {
      setIsSubmittingRow(true);
      console.log('Updating row in table:', selectedTable, 'Data:', data);
      
      await api.put(`/api/marketing/${keyword}/table/${selectedTable}/row/${rowToEdit.id}`, data, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      
      toast({
        title: 'Fila actualizada',
        description: 'La fila ha sido actualizada exitosamente',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      fetchTableData();
      setRowToEdit(null);
    } catch (error) {
      console.error('Error updating row:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la fila',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmittingRow(false);
    }
  };

  const handleSaveRow = (data: Record<string, any>) => {
    if (rowToEdit) {
      executeUpdateRow(data);
    } else {
      handleAddRow(data);
    }
  };

  // Helper to format project name for display
  const getProjectDisplayName = () => {
    const keyword = projectId.startsWith('proyecto_') ? projectId.substring('proyecto_'.length) : projectId;
    return keyword.charAt(0).toUpperCase() + keyword.slice(1);
  };

  // Helper to format table name for display
  const formatTableName = (tableName: string) => {
    const keyword = projectId.startsWith('proyecto_') ? projectId.substring('proyecto_'.length) : projectId;
    const prefix = `presupuesto_mercadeo_${keyword}_`;
    
    if (tableName.startsWith(prefix)) {
      const suffix = tableName.substring(prefix.length);
      return suffix.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }
    
    return tableName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  // Handle empty table state
  if (tables.length === 0 && !isLoading) {
    return (
      <Box p={8}>
        <Heading as="h1" size="xl" mb={6}>
          Tablas de Presupuesto - {getProjectDisplayName()}
        </Heading>
        <Center h="200px">
          <VStack>
            <Text fontSize="lg" color="gray.500">No se encontraron tablas para este proyecto.</Text>
            <Button colorScheme="blue" onClick={() => window.location.reload()}>
              Recargar
            </Button>
          </VStack>
        </Center>
      </Box>
    );
  }

  // Render main content with tabs
  return (
    <Box p={8}>
      <Heading as="h1" size="xl" mb={6}>
        Tablas de Presupuesto - {getProjectDisplayName()}
      </Heading>
      
      {isLoading ? (
        <Center h="200px">
          <Spinner size="xl" />
        </Center>
      ) : (
        <VStack spacing={6} align="stretch">
          {/* Table Selector */}
          <FormControl maxW="md">
            <FormLabel>Seleccionar Tabla</FormLabel>
            <Select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              placeholder="Selecciona una tabla"
            >
              {tables.map((table) => (
                <option key={table} value={table}>
                  {formatTableName(table)}
                </option>
              ))}
            </Select>
          </FormControl>

          {/* Table Data with Tabs */}
          {selectedTable && tableData.length > 0 && (
            <>
              <Tabs variant="enclosed" colorScheme="blue" isFitted>
                <TabList>
                  {periods.map(period => (
                    <Tab key={period.label}>{period.label}</Tab>
                  ))}
                </TabList>
                <TabPanels>
                  {periods.map(period => (
                    <TabPanel key={period.label} p={0}>
                      <TableContainer>
                        <Table variant="simple" size="sm">
                          <Thead bg="gray.50">
                            <Tr>
                              {nonMonthColumns.map(col => (
                                <Th key={col}>{formatColumnName(col)}</Th>
                              ))}
                              {period.months.map(month => (
                                <Th key={month} isNumeric>{formatColumnName(month)}</Th>
                              ))}
                              <Th>Acciones</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {tableData.map((row, rowIndex) => (
                              <Tr key={row.id || rowIndex}>
                                {nonMonthColumns.map(col => (
                                  <Td key={col}>{getCellValue(row, col)}</Td>
                                ))}
                                {period.months.map(month => (
                                  <Td key={month} isNumeric>{getCellValue(row, month)}</Td>
                                ))}
                                <Td>
                                  <HStack spacing={1}>
                                    <IconButton 
                                      aria-label="Editar" 
                                      icon={<EditIcon />} 
                                      size="xs" 
                                      colorScheme="blue"
                                      variant="ghost"
                                      onClick={() => setRowToEdit(row)} 
                                    />
                                    <IconButton 
                                      aria-label="Eliminar" 
                                      icon={<DeleteIcon />} 
                                      colorScheme="red" 
                                      size="xs" 
                                      variant="ghost"
                                      onClick={() => { setRowToDeleteId(row.id); onDeleteRowOpen(); }} 
                                    />
                                  </HStack>
                                </Td>
                              </Tr>
                            ))}
                            {/* Totals Row */}
                            <Tr fontWeight="bold" bg="gray.100">
                              {nonMonthColumns.map((col, index) => (
                                <Td key={col}>{index === 0 ? 'Total' : ''}</Td>
                              ))}
                              {period.months.map(month => (
                                <Td key={month} isNumeric>{getColumnTotal(month)}</Td>
                              ))}
                              <Td></Td>
                            </Tr>
                          </Tbody>
                        </Table>
                      </TableContainer>
                    </TabPanel>
                  ))}
                </TabPanels>
              </Tabs>
              
              {/* Add Row Button */}
              <Button 
                leftIcon={<AddIcon />} 
                colorScheme="teal" 
                onClick={() => setIsAddRowOpen(true)}
              >
                Agregar Fila
              </Button>
            </>
          )}
          
          {selectedTable && tableData.length === 0 && !isLoading && (
            <Text textAlign="center" color="gray.500">
              No hay datos disponibles para la tabla seleccionada.
            </Text>
          )}
          
          {/* Row form/modal */}
          <TableRowForm
            isOpen={isAddRowOpen || !!rowToEdit}
            onClose={() => { setIsAddRowOpen(false); setRowToEdit(null); }}
            onSubmit={handleSaveRow}
            columns={tableColumns}
            initialData={rowToEdit}
          />
          
          {/* Delete row dialog */}
          <AlertDialog
            isOpen={isDeleteRowOpen}
            leastDestructiveRef={cancelRef}
            onClose={onDeleteRowClose}
          >
            <AlertDialogOverlay />
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">Eliminar Fila</AlertDialogHeader>
              <AlertDialogBody>¿Estás seguro de que deseas eliminar esta fila?</AlertDialogBody>
              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onDeleteRowClose}>Cancelar</Button>
                <Button 
                  colorScheme="red" 
                  onClick={() => executeDeleteRow(rowToDeleteId)} 
                  ml={3} 
                  isLoading={isDeletingRow}
                >
                  Eliminar
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </VStack>
      )}
    </Box>
  );
}
