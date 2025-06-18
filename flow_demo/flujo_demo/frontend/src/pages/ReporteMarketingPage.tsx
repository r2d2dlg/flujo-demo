import { useState, useEffect, useCallback, useMemo } from 'react';
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
  IconButton,
  Input,
  useToast,
  Spinner,
  Center,
  Button,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Select,
  Checkbox,
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon, AddIcon } from '@chakra-ui/icons';
// import { api, ApiResponse } from '../api/api'; // ApiResponse will be defined locally
import { api, tables } from '../api/api'; // Import tables
import type { AxiosResponse } from 'axios'; // For type safety

// Local ApiResponse definition
interface ApiResponse<T> {
  columns: string[];
  data: T;
  // Add other common fields like 'message' or 'success' if your API consistently returns them
}

interface TableRow {
  id?: number; 
  [key: string]: any;
}

// Add new DiscoveredProject interface (similar to other pages)
interface DiscoveredProject {
  keyword: string;      // e.g., "argentina"
  displayName: string;  // e.g., "Argentina"
}

const HIDDEN_COLUMNS = ['id', 'created_at', 'updated_at'];

// Helper to extract all month columns from a row (e.g., amount_2024_03, 2024_03, ENERO, etc.)
function extractMonthColumns(row: any) {
  const MONTHS_ES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return Object.keys(row).filter(
    col =>
      /^amount_\d{4}_\d{2}$/.test(col) || // amount_2024_03
      /^\d{4}_\d{2}$/.test(col) ||       // 2024_03
      MONTHS_ES.map(m => m.toUpperCase()).includes(col.toUpperCase())
  );
}

// Helper to convert column name to 'Mes Año'
function tidyMonthCol(col: string) {
  const MONTHS_ES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  let match = col.match(/(\d{4})_(\d{2})$/);
  if (!match) match = col.match(/amount_(\d{4})_(\d{2})$/);
  if (match) {
    const year = match[1];
    const monthIdx = parseInt(match[2], 10) - 1;
    return `${MONTHS_ES[monthIdx]} ${year}`;
  }
  const idx = MONTHS_ES.map(m => m.toUpperCase()).indexOf(col.toUpperCase());
  if (idx !== -1) {
    const year = new Date().getFullYear();
    return `${MONTHS_ES[idx]} ${year}`;
  }
  return col;
}

// Generate periods: previous 3 months + next 36 months, grouped by 12
function generatePeriods(allMonthCols: string[]) {
  const MONTHS_ES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const sorted = [...allMonthCols].sort((a, b) => {
    const parse = (col: string) => {
      let m = col.match(/(\d{4})_(\d{2})$/);
      if (!m) m = col.match(/amount_(\d{4})_(\d{2})$/);
      if (m) return parseInt(m[1]) * 100 + parseInt(m[2]);
      return 99999999;
    };
    return parse(a) - parse(b);
  });
  const periods = [];
  for (let i = 0; i < sorted.length; i += 12) {
    periods.push({
      label: `${tidyMonthCol(sorted[i])} - ${tidyMonthCol(sorted[Math.min(i+11, sorted.length-1)])}`,
      months: sorted.slice(i, i+12)
    });
  }
  return periods;
}

export default function ReporteMarketingPage() {
  const toast = useToast();
  const tableName = "inversion_mercadeo"; // Hardcoded table name

  const [tableData, setTableData] = useState<TableRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [editingRow, setEditingRow] = useState<TableRow | null>(null);
  const [isLoadingTable, setIsLoadingTable] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false); // State for delete operation
  
  const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure();

  const { isOpen: isDeleteConfirmOpen, onOpen: onDeleteConfirmOpen, onClose: onDeleteConfirmClose } = useDisclosure();
  const [idToDelete, setIdToDelete] = useState<any | null>(null);

  // Update state to use DiscoveredProject interface
  const [discoveredProyectos, setDiscoveredProyectos] = useState<DiscoveredProject[]>([]); 

  // Fetch all data for the table (no month filter)
  const fetchTableData = useCallback(async () => {
    setIsLoadingTable(true);
    try {
      const response = await api.get<ApiResponse<TableRow[]>>(
        `/api/tables/${tableName}/data`,
        { headers: { 'ngrok-skip-browser-warning': 'true' } }
      );
      if (response.data.columns && response.data.data) {
        const fetchedCols = response.data.columns;
        setColumns(fetchedCols.filter(col => !HIDDEN_COLUMNS.includes(col)));
        setTableData(response.data.data);
      } else {
        setColumns([]);
        setTableData([]);
        toast({ title: 'Datos no recibidos', description: 'La respuesta del API no contuvo columnas o datos.', status: 'warning' });
      }
    } catch (error) {
      toast({ title: 'Error al cargar datos', description: String(error), status: 'error' });
      setColumns([]); 
      setTableData([]); 
    } finally {
      setIsLoadingTable(false);
    }
  }, [tableName, toast]);

  // Fetch marketing proyectos list - renamed and refactored
  const fetchDiscoveredProyectos = useCallback(async () => {
    try {
      // Logic adapted from Dashboard.tsx/ManageMarketingProyectosPage.tsx
      const response: AxiosResponse<{ tables: string[] }> = await tables.listAllMarketingProjectTables();
      const tableList = response.data.tables || [];
      
      const projectMap = new Map<string, string>(); // Stores keyword -> displayName
      
      tableList.forEach((tableName: string) => {
        if (typeof tableName !== 'string' || tableName.trim() === '') {
          return;
        }
        
        const tableLower = tableName.toLowerCase().trim();
        let remainderString = '';
        let currentKeyword = '';

        const prefix = 'presupuesto_mercadeo_';
        if (tableLower.startsWith(prefix)) {
          remainderString = tableLower.substring(prefix.length);
        } else {
          return; 
        }
        
        if (!remainderString) {
          return;
        }

        const parts = remainderString.split('_');
        if (parts.length > 0 && parts[0]) {
          currentKeyword = parts[0];
        } else {
          return; 
        }
        
        if (currentKeyword) {
          const displayName = currentKeyword
              .split('_')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
          
          if (!projectMap.has(currentKeyword)) {
            projectMap.set(currentKeyword, displayName);
          }
        }
      });

      const newDiscoveredProyectos: DiscoveredProject[] = Array.from(projectMap.entries()).map(([keyword, displayName]) => ({
        keyword,
        displayName,
      }));
      
      setDiscoveredProyectos(newDiscoveredProyectos.sort((a, b) => a.displayName.localeCompare(b.displayName)));

    } catch (error) {
      console.error('Error fetching or processing discovered projects:', error);
      toast({
        title: 'Error al cargar lista de proyectos de marketing',
        description: String(error),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setDiscoveredProyectos([]); // Clear on error
    }
  }, [toast]);

  useEffect(() => {
    fetchTableData();
  }, [fetchTableData]);

  useEffect(() => {
    fetchDiscoveredProyectos(); // Call the renamed and refactored function
  }, [fetchDiscoveredProyectos]);

  const openAddNewModal = () => {
    const newRow: TableRow = {};
    // Ensure all current columns are initialized
    const allDisplayAndHiddenCols = [...new Set([...columns, ...HIDDEN_COLUMNS])]; 
    allDisplayAndHiddenCols.forEach(colKey => {
      if (colKey === 'fecha_prevista') {
        newRow[colKey] = '';
      } else if (colKey === 'nuevos') { 
        newRow[colKey] = false; 
      } else {
        newRow[colKey] = ''; 
      }
    });
    // Explicitly add proyecto_keyword for new entries, defaulting to the first discovered project or empty
    newRow.proyecto_keyword = discoveredProyectos.length > 0 ? discoveredProyectos[0].keyword : '';

    setEditingRow(newRow);
    onModalOpen();
  };

  const openEditModal = (row: TableRow) => {
    // When editing, if the row comes from a table that had proyecto_id,
    // we might need a migration strategy or ensure new entries use proyecto_keyword.
    // For now, assume row might or might not have proyecto_keyword.
    // If it has proyecto_id, it will be preserved unless overwritten by a Select change.
    setEditingRow({ ...row }); 
    onModalOpen();
  };

  const handleModalSave = async () => {
    if (!editingRow) return;
    setIsSaving(true);

    let rowToSubmit = { ...editingRow };

    // Ensure fecha_prevista is YYYY-MM-DD
    if (rowToSubmit.fecha_prevista && String(rowToSubmit.fecha_prevista).length === 7) { // YYYY-MM input
        rowToSubmit.fecha_prevista = `${rowToSubmit.fecha_prevista}-01`;
    } else if (rowToSubmit.fecha_prevista) {
        rowToSubmit.fecha_prevista = String(rowToSubmit.fecha_prevista).split('T')[0];
    }

    // Convert numeric fields
    const numericFields = ['monto']; // Add other numeric fields from your table schema
    numericFields.forEach(field => {
      if (rowToSubmit[field] && typeof rowToSubmit[field] === 'string') {
        rowToSubmit[field] = parseFloat(rowToSubmit[field] as string) || 0;
      } else if (rowToSubmit[field] === undefined || rowToSubmit[field] === null || rowToSubmit[field] === '') {
        rowToSubmit[field] = 0; // Default to 0 if empty or null for numeric fields
      }
    });
    
    // Convert boolean fields (example, if you had a boolean column 'nuevos')
    const booleanFields = ['nuevos'];
    booleanFields.forEach(field => {
        // Ensure that if the field exists, it's a proper boolean before sending to backend
        if (field in rowToSubmit) {
            rowToSubmit[field] = !!rowToSubmit[field]; 
        }
    });

    try {
      if (editingRow.id) {
        const { id, created_at, updated_at, ...dataToPut } = rowToSubmit;
        await api.put(`/api/tables/${tableName}/rows/${editingRow.id}`, dataToPut,
          { headers: { 'ngrok-skip-browser-warning': 'true' } }
        );
        toast({ title: 'Inversión actualizada', status: 'success' });
      } else {
        const { id, created_at, updated_at, ...dataToPost } = rowToSubmit; // Exclude auto-generated fields
        await api.post(`/api/tables/${tableName}/rows`, dataToPost,
          { headers: { 'ngrok-skip-browser-warning': 'true' } }
        );
        toast({ title: 'Inversión agregada', status: 'success' });
      }
      fetchTableData();
      onModalClose();
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || String(error);
      toast({ title: 'Error al guardar', description: errorMsg, status: 'error' });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleModalInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!editingRow) return;
    const { name, value, type } = e.target;
    let processedValue: any = value;
    if (type === 'checkbox' && e.target instanceof HTMLInputElement) {
      processedValue = e.target.checked;
    }
    setEditingRow(prev => (prev ? { ...prev, [name]: processedValue } : null));
  };

  const confirmDeleteRow = (rowId: any) => {
    setIdToDelete(rowId);
    onDeleteConfirmOpen();
  };

  const handleDeleteConfirmed = async () => {
    if (idToDelete === null) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/tables/${tableName}/rows/${idToDelete}`,
        { headers: { 'ngrok-skip-browser-warning': 'true' } }
      );
      toast({ title: 'Fila Eliminada', status: 'success' });
      fetchTableData();
    } catch (error: any) {
      toast({ title: 'Error al Eliminar', description: error.response?.data?.detail || 'No se pudo eliminar la fila.', status: 'error' });
    } finally {
      setIsDeleting(false);
      onDeleteConfirmClose();
      setIdToDelete(null);
    }
  };

  // Memoize month columns and periods
  const allMonthCols = useMemo(() => {
    if (!tableData || tableData.length === 0) return [];
    return Array.from(new Set(tableData.flatMap(row => extractMonthColumns(row))));
  }, [tableData]);

  const periods = useMemo(() => {
    if (!allMonthCols.length) return [];
    return generatePeriods(allMonthCols);
  }, [allMonthCols]);

  // Get non-month columns (excluding hidden)
  const nonMonthCols = useMemo(() => {
    if (!columns) return [];
    return columns.filter(col => !allMonthCols.includes(col) && !HIDDEN_COLUMNS.includes(col));
  }, [columns, allMonthCols]);

  const renderPeriodTabs = () => {
    if (!periods.length) return renderTable(); // fallback to old table if no periods
    return (
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
                  <Thead>
                    <Tr>
                      {nonMonthCols.map(col => (
                        <Th key={col}>{col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Th>
                      ))}
                      {period.months.map(col => (
                        <Th key={col}>{tidyMonthCol(col)}</Th>
                      ))}
                      <Th>Acciones</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {tableData.map((row, rowIndex) => (
                      <Tr key={row.id || rowIndex}>
                        {nonMonthCols.map(col => (
                          <Td key={`${col}-${row.id || rowIndex}`}>{row[col]}</Td>
                        ))}
                        {period.months.map(col => (
                          <Td key={`${col}-${row.id || rowIndex}`}>{row[col] ?? ''}</Td>
                        ))}
                        <Td>
                          <HStack spacing={2}>
                            <IconButton icon={<EditIcon />} aria-label="Editar" size="sm" onClick={() => openEditModal(row)} />
                            <IconButton icon={<DeleteIcon />} aria-label="Eliminar" size="sm" colorScheme="red" onClick={() => confirmDeleteRow(row.id!)} />
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                    {tableData.length === 0 && !isLoadingTable && (
                      <Tr>
                        <Td colSpan={nonMonthCols.length + periods[0].months.length + 1} textAlign="center">
                          No hay datos disponibles para la tabla {tableName}.
                        </Td>
                      </Tr>
                    )}
                  </Tbody>
                </Table>
              </TableContainer>
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>
    );
  };

  const renderTable = () => {
    if (isLoadingTable) return <Center h="200px"><Spinner size="xl" /></Center>;
    if (!columns || columns.length === 0) return <Text>La tabla '{tableName}' podría no existir, estar vacía o no tener columnas definidas.</Text>;
    // Removed check for tableData.length === 0 && !isLoadingTable as it's covered by columns check for initial state

    return (
      <TableContainer>
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              {columns.map((column) => (
                <Th key={column}>{column.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Th>
              ))}
              <Th>Acciones</Th>
            </Tr>
          </Thead>
          <Tbody>
            {tableData.map((row, rowIndex) => (
              <Tr key={row.id || rowIndex}>
                {columns.map((column) => (
                  <Td key={`${column}-${row.id || rowIndex}`}>
                    {editingRow === row ? (
                      <Input size="sm" value={editingRow[column] || ''} onChange={handleModalInputChange} />
                    ) : (
                      column === 'fecha_prevista' ? new Date(row[column] + 'T00:00:00').toLocaleDateString() :
                      column === 'nuevos' ? (row[column] ? 'Sí' : 'No') :
                      row[column]
                    )}
                  </Td>
                ))}
                <Td>
                  <HStack spacing={2}>
                    <IconButton icon={<EditIcon />} aria-label="Editar" size="sm" onClick={() => openEditModal(row)} />
                    <IconButton icon={<DeleteIcon />} aria-label="Eliminar" size="sm" colorScheme="red" onClick={() => confirmDeleteRow(row.id!)} />
                  </HStack>
                </Td>
              </Tr>
            ))}
             {tableData.length === 0 && !isLoadingTable && (
              <Tr>
                <Td colSpan={columns.length + 1} textAlign="center">
                  No hay datos disponibles para la tabla {tableName}.
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
              Reporte de Inversión en Mercadeo
          </Heading>
          <Button as={RouterLink} to="/dashboard" colorScheme="gray">
            Volver a Dashboard Mercadeo
          </Button>
        </HStack>
        
        <HStack justifyContent="space-between" mt={4}>
            <Text fontSize="xl" fontWeight="semibold">Tabla: {tableName}</Text>
        </HStack>

        <Button 
          leftIcon={<AddIcon />} 
          colorScheme="blue" 
          onClick={openAddNewModal} 
          alignSelf="flex-start"
          mt={4}
        >
          Agregar Inversión
        </Button>

        {renderPeriodTabs()}
      </VStack>

      {/* Unified Modal for Add/Edit */} 
      <Modal isOpen={isModalOpen} onClose={onModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editingRow ? 'Editar Inversión' : 'Agregar Nueva Inversión'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {columns.map(column => {
              const label = column.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              if (column === 'fecha_prevista') {
                return (
                  <FormControl key={column} mt={4}>
                    <FormLabel>{label}</FormLabel>
                    <Input 
                      type="date"
                      name={column} 
                      value={editingRow?.[column]?.split('T')[0] || ''} // Ensure only date part for input type=date
                      onChange={handleModalInputChange} 
                    />
                  </FormControl>
                );
              }
              if (column === 'proyectos') {
                return (
                  <FormControl key={column} mt={4}>
                    <FormLabel>{label}</FormLabel>
                    <Select
                      name={column}
                      value={editingRow?.[column] || ''}
                      onChange={handleModalInputChange}
                      placeholder="Seleccione un proyecto"
                    >
                      {discoveredProyectos.map(proyecto => (
                        <option key={proyecto.keyword} value={proyecto.keyword}>
                          {proyecto.displayName}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                );
              }
              // Explicitly render Checkbox for 'nuevos' column
              if (column === 'nuevos') {
                return (
                  <FormControl key={column} mt={4} display="flex" alignItems="center">
                    <FormLabel mb="0">{label}</FormLabel>
                    <Checkbox 
                      name={column} 
                      isChecked={!!editingRow?.[column]} // Ensure boolean conversion for isChecked
                      onChange={handleModalInputChange} 
                      ml={2}
                    />
                  </FormControl>
                );
              }
              return (
                <FormControl key={column} mt={4}>
                  <FormLabel>{label}</FormLabel>
                  <Input 
                    name={column} 
                    value={editingRow?.[column] || ''} 
                    onChange={handleModalInputChange} 
                    placeholder={label} 
                    type={column === 'monto' ? 'number' : 'text'} // Example: set type number for monto
                  />
                </FormControl>
              );
            })}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleModalSave} isLoading={isSaving}>Guardar</Button>
            <Button onClick={onModalClose}>Cancelar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteConfirmOpen} onClose={onDeleteConfirmClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirmar Eliminación</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>¿Estás seguro de que deseas eliminar esta fila? Esta acción no se puede deshacer.</Text>
            {/* Optionally display some row data here if needed */}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="red" mr={3} onClick={handleDeleteConfirmed} isLoading={isDeleting}>Eliminar</Button>
            <Button variant="ghost" onClick={onDeleteConfirmClose}>Cancelar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
} 