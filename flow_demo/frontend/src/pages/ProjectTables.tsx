import { useState, useEffect, useRef } from 'react';
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
  TabPanel
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
  const [columns, setColumns] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const toast = useToast();
  const [isSubmittingRow, setIsSubmittingRow] = useState(false);

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
      const response = await api.get(`/api/marketing/${keyword}/table/${selectedTable}/raw`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      
      if (response.data && response.data.columns) {
        // Extract column names from the response
        setTableColumns(response.data.columns);
        
        if (response.data.data && response.data.data.length > 0) {
          // Get columns from the first row
          const firstRow = response.data.data[0];
          const columns = Object.keys(firstRow);
          setColumns(columns);
          setTableData(response.data.data);
        } else {
          // Table exists but is empty
          setColumns([]);
          setTableData([]);
        }
      } else {
        setColumns([]);
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
    // Add a small delay to allow the tables to be created
    const timer = setTimeout(() => {
      fetchTableData();
    }, 1000);

    return () => clearTimeout(timer);
  }, [selectedTable, projectId, toast]);

  const executeDeleteRow = async (rowId: any) => {
    if (!selectedTable || !projectId || rowId === null) return;
    const keyword = projectId.startsWith('proyecto_') ? projectId.substring('proyecto_'.length) : projectId;
    setIsDeletingRow(true);
    try {
      await api.delete(`/api/marketing/${keyword}/table/${selectedTable}/row/${rowId}`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      toast({
        title: 'Fila eliminada',
        description: 'La fila ha sido eliminada correctamente.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setTableData(prevData => prevData.filter(row => row.id !== rowId));
      onDeleteRowClose();
    } catch (error) {
      console.error('Error deleting row:', error);
      toast({
        title: 'Error al eliminar fila',
        description: 'No se pudo eliminar la fila.',
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
      await api.delete(`/api/marketing/${keyword}/table/${tableName}`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      
      // Remove the table from the list
      const updatedTables = tables.filter(table => table !== tableName);
      setTables(updatedTables);
      
      // If the deleted table was selected, select the first available table or clear selection
      if (selectedTable === tableName) {
        setSelectedTable(updatedTables[0] || '');
      }
      
      toast({
        title: 'Tabla eliminada',
        description: `La tabla "${formatTableName(tableName)}" ha sido eliminada correctamente`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error deleting table:', error);
      toast({
        title: 'Error al eliminar la tabla',
        description: 'No se pudo eliminar la tabla. Por favor, inténtalo de nuevo.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
      onClose();
    }
  };

  const handleAddRow = async (data: Record<string, any>) => {
    if (!selectedTable || !projectId) return;
    const keyword = projectId.startsWith('proyecto_') ? projectId.substring('proyecto_'.length) : projectId;
    
    setIsSubmittingRow(true);
    try {
      const response = await api.post(`/api/marketing/${keyword}/table/${selectedTable}/data`, data, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      
      await fetchTableData();
      
      toast({
        title: 'Fila agregada',
        description: 'La nueva fila se ha agregado correctamente',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      setIsAddRowOpen(false);
    } catch (error) {
      console.error('Error adding row:', error);
      toast({
        title: 'Error al agregar fila',
        description: 'No se pudo agregar la fila. Por favor, inténtalo de nuevo.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmittingRow(false);
    }
  };

  const executeUpdateRow = async (data: Record<string, any>) => {
    if (!selectedTable || !projectId || !rowToEdit || !rowToEdit.id) return;
    const keyword = projectId.startsWith('proyecto_') ? projectId.substring('proyecto_'.length) : projectId;
    setIsSubmittingRow(true);
    try {
      await api.put(`/api/marketing/${keyword}/table/${selectedTable}/${rowToEdit.id}/raw`, data, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      toast({
        title: 'Fila actualizada',
        description: 'La fila ha sido actualizada correctamente.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setTableData(prevData => prevData.map(row => row.id === rowToEdit.id ? { ...row, ...data } : row));
      setIsAddRowOpen(false);
      setRowToEdit(null);
    } catch (error) {
      console.error('Error updating row:', error);
      toast({
        title: 'Error al actualizar fila',
        description: 'No se pudo actualizar la fila.',
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

  // Format the project name for display
  const formatProjectName = (id: string) => {
    return id
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Format table name for display
  const formatTableName = (tableName: string) => {
    try {
      // Extract the part after the project ID
      const parts = tableName.split('_');
      if (parts.length < 4) return tableName; // Not a valid table name format
      
      // Get the table type (everything after presupuesto_mercadeo_[project_id]_)
      const tableType = parts.slice(3).join('_');
      
      // Map of table type suffixes to display names
      const displayNames: Record<string, string> = {
        'gastos_publicitarios': 'Gastos Publicitarios',
        'gastos_casa_modelo': 'Gastos Casa Modelo',
        'ferias_eventos': 'Ferias y Eventos',
        'redes_sociales': 'Redes Sociales',
        'promociones_bonos': 'Promociones y Bonos',
        'gastos_tramites': 'Gastos de Trámites'
      };
      
      // Return the display name if it exists, otherwise format the key
      return displayNames[tableType] || 
        tableType
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
    } catch (error) {
      console.error('Error formatting table name:', error);
      return tableName; // Return original name if there's an error
    }
  };

  // 1. Add a function to generate periods: previous 3 months + next 36 months
  function generatePeriods() {
    const now = dayjs();
    const months: string[] = [];
    // Previous 3 months
    for (let i = 3; i > 0; i--) {
      months.push(now.subtract(i, 'month').format('YYYY_MM'));
    }
    // Current + next 36 months
    for (let i = 0; i < 37; i++) {
      months.push(now.add(i, 'month').format('YYYY_MM'));
    }
    // Group by 12 months per period
    const periods = [];
    for (let i = 0; i < months.length; i += 12) {
      periods.push({
        label: `${months[i].replace('_', '-')}` + (months[i + 11] ? ` / ${months[i + 11].replace('_', '-')}` : ''),
        months: months.slice(i, i + 12)
      });
    }
    return periods;
  }

  const periods = generatePeriods();

  // Helper to format project name for display
  const getProjectDisplayName = () => {
    const keyword = projectId.startsWith('proyecto_') ? projectId.substring('proyecto_'.length) : projectId;
    return keyword.charAt(0).toUpperCase() + keyword.slice(1);
  };

  // Handle empty table state
  if (tables.length === 0) {
    return (
      <Box p={4} textAlign="center">
        <Heading mb={4}>
          Tablas de Presupuesto - Proyecto {formatProjectName(projectId)}
        </Heading>
        <Text mb={4} fontSize="lg">No se encontraron tablas para este proyecto.</Text>
        <Button 
          colorScheme="blue" 
          onClick={() => window.location.reload()}
        >
          Recargar
        </Button>
      </Box>
    );
  }

  // Helper function to format column names for display
  const formatColumnName = (name: string): string => {
    // Handle special column names
    if (name === 'CONCEPTO') return 'Concepto';
    if (name === 'id') return 'ID';
    if (name === 'created_at') return 'Creado';
    if (name === 'updated_at') return 'Actualizado';
    
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

  // Display raw table data exactly as it exists in the database
  return (
    <Box maxW="100vw" p={4}>
      <Heading size="lg" mb={2}>
        Proyecto: {getProjectDisplayName()}
      </Heading>
      <Heading size="md" mb={4} color="gray.600">
        Tablas de Proyecto
      </Heading>
      {isLoading ? (
        <Center h="200px">
          <Spinner size="xl" />
        </Center>
      ) : (
        <>
          {tables.length > 0 && (
            <Box mb={4} maxW="400px">
              <Select
                value={selectedTable}
                onChange={e => setSelectedTable(e.target.value)}
                placeholder="Seleccione una tabla"
              >
                {tables.map((table) => {
                  // Format table name for display
                  let display = table;
                  const prefix = `presupuesto_mercadeo_${projectId.startsWith('proyecto_') ? projectId.substring('proyecto_'.length) : projectId}_`;
                  if (table.startsWith(prefix)) {
                    display = table.substring(prefix.length);
                  }
                  display = display.replace(/_/g, ' ')
                    .replace(/\b\w/g, c => c.toUpperCase());
                  return (
                    <option key={table} value={table}>{display}</option>
                  );
                })}
              </Select>
            </Box>
          )}
          
          {selectedTable && tableData.length === 0 && (
            <Text>No hay datos disponibles para la tabla seleccionada.</Text>
          )}
          
          {selectedTable && columns.length > 0 && (
            <Box overflowX="auto" p={4}>
              <TableContainer>
                <Table variant="simple" size="sm">
                  <Thead bg="gray.50">
                    <Tr>
                      {columns.map((column) => (
                        <Th key={column} whiteSpace="nowrap" fontSize="xs">
                          {formatColumnName(column)}
                        </Th>
                      ))}
                      <Th whiteSpace="nowrap" fontSize="xs">Acciones</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {tableData.map((row, rowIdx) => (
                      <Tr key={row.id || rowIdx}>
                        {columns.map((column) => (
                          <Td 
                            key={`${rowIdx}-${column}`}
                            borderWidth="1px"
                            borderColor="gray.200"
                            p={2}
                            fontSize="sm"
                          >
                            <Box p={2}>
                              {String(row[column] || '')}
                            </Box>
                          </Td>
                        ))}
                        <Td borderWidth="1px" borderColor="gray.200">
                          <HStack spacing={2}>
                            <IconButton 
                              aria-label="Editar" 
                              icon={<EditIcon />} 
                              size="sm" 
                              colorScheme="blue"
                              variant="ghost"
                              onClick={() => setRowToEdit(row)} 
                            />
                            <IconButton 
                              aria-label="Eliminar" 
                              icon={<DeleteIcon />} 
                              colorScheme="red" 
                              size="sm" 
                              variant="ghost"
                              onClick={() => { setRowToDeleteId(row.id); onDeleteRowOpen(); }} 
                            />
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
              <Button leftIcon={<AddIcon />} colorScheme="teal" mt={4} onClick={() => setIsAddRowOpen(true)}>
                Agregar Fila
              </Button>
            </Box>
          )}
          
          {/* Row form/modal logic - updated to use raw columns */}
          <TableRowForm
            isOpen={isAddRowOpen || !!rowToEdit}
            onClose={() => { setIsAddRowOpen(false); setRowToEdit(null); }}
            onSubmit={handleSaveRow}
            columns={columns}
            initialData={rowToEdit}
          />
          
          {/* Delete row dialog remains as before */}
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
                <Button colorScheme="red" onClick={() => executeDeleteRow(rowToDeleteId)} ml={3} isLoading={isDeletingRow}>Eliminar</Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </Box>
  );
}
