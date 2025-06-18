import { useState, useEffect } from 'react';
import { 
  Box, 
  Heading, 
  Select, 
  useToast,
  Spinner,
  Container,
  Text,
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  ModalFooter,
  Flex,
  ButtonGroup,
  IconButton,
  Tooltip,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input
} from '@chakra-ui/react';
import { ViewIcon, EditIcon } from '@chakra-ui/icons';
import { marketingApi } from '../api/marketingApi';

type Mode = 'view' | 'edit';

type TableCell = {
  rowIndex: number;
  columnKey: string;
  value: string;
};

const MarketingBudgetTanara = () => {
  const [tables, setTables] = useState<string[]>([]);
  const [views, setViews] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [selectedView, setSelectedView] = useState<string>('');
  const [tableData, setTableData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<TableCell | null>(null);
  const [cellValue, setCellValue] = useState<string>('');
  const [mode, setMode] = useState<Mode>('view');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  // Theme colors (commented out as they're not currently used)
  // const bgColor = useColorModeValue('white', 'gray.800');
  // const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Fetch tables and views on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch both tables and views in parallel
        const [tablesResponse, viewsResponse] = await Promise.all([
          marketingApi.tanara.getTables(),
          marketingApi.tanara.getViews()
        ]);
        
        setTables(tablesResponse.tables);
        setViews(viewsResponse.views);
        
        if (tablesResponse.tables.length > 0) {
          setSelectedTable(tablesResponse.tables[0]);
        }
        
        if (viewsResponse.views.length > 0) {
          setSelectedView(viewsResponse.views[0]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('No se pudieron cargar los datos. Por favor, intente de nuevo.');
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los datos',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

    // Fetch data when selected table/view or mode changes
  useEffect(() => {
    if (mode === 'edit' && selectedTable) {
      fetchTableData(selectedTable);
    } else if (mode === 'view' && selectedView) {
      fetchViewData(selectedView);
    }
  }, [selectedTable, selectedView, mode]);

  const fetchTableData = async (tableName: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await marketingApi.tanara.getTableData(tableName);
      setTableData(data.data);
      setColumns(data.columns);
    } catch (error) {
      console.error('Error fetching table data:', error);
      setError('No se pudieron cargar los datos de la tabla');
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

  const fetchViewData = async (viewName: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await marketingApi.tanara.getViewData(viewName);
      setTableData(data.data);
      setColumns(data.columns);
    } catch (error) {
      console.error('Error fetching view data:', error);
      setError('No se pudieron cargar los datos de la vista');
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos de la vista',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCellClick = (rowIndex: number, columnKey: string, value: string) => {
    if (mode === 'edit') {
      setEditingCell({ rowIndex, columnKey, value });
      setCellValue(value);
      onOpen();
    }
  };

  const handleSaveEdit = async () => {
    if (!editingCell) return;

    try {
      const { rowIndex, columnKey } = editingCell;
      const row = tableData[rowIndex];
      const actividad = row.actividad || row['Actividad'] || row['ACTIVIDAD'];
      
      if (!actividad) {
        throw new Error('No se pudo identificar la actividad a actualizar');
      }

      const updatedData = { ...row, [columnKey]: cellValue };
      
      await marketingApi.tanara.updateTableRow(
        selectedTable,
        actividad,
        updatedData
      );

      // Update local state
      const newData = [...tableData];
      newData[rowIndex] = updatedData;
      setTableData(newData);
      
      toast({
        title: 'Éxito',
        description: 'Datos actualizados correctamente',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onClose();
    } catch (error) {
      console.error('Error updating data:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron actualizar los datos',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const renderTable = () => {
    if (isLoading) {
      return (
        <Box display="flex" justifyContent="center" my={10}>
          <Spinner size="xl" />
        </Box>
      );
    }

    if (error) {
      return (
        <Box p={4} color="red.500">
          <Text>{error}</Text>
        </Box>
      );
    }

    if (tableData.length === 0) {
      return (
        <Box p={4}>
          <Text>No hay datos disponibles.</Text>
        </Box>
      );
    }

    return (
      <Box overflowX="auto" my={4}>
        <Table variant="striped" colorScheme="gray">
          <Thead>
            <Tr>
              {columns.map((column) => (
                <Th key={column} whiteSpace="nowrap">
                  {column}
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {tableData.map((row, rowIndex) => (
              <Tr key={rowIndex}>
                {columns.map((column) => (
                  <Td 
                    key={`${rowIndex}-${column}`}
                    onClick={() => handleCellClick(rowIndex, column, row[column])}
                    cursor={mode === 'edit' ? 'pointer' : 'default'}
                    _hover={mode === 'edit' ? { bg: 'gray.100' } : {}}
                  >
                    {row[column]}
                  </Td>
                ))}
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    );
  };

  const renderModeToggle = () => (
    <Flex justify="space-between" align="center" mb={4}>
      <Heading size="lg">
        Presupuesto de Mercadeo - {mode === 'view' ? 'Vista' : 'Edición'}
      </Heading>
      <ButtonGroup size="sm" isAttached variant="outline">
        <Tooltip label="Ver datos">
          <IconButton
            aria-label="Vista"
            icon={<ViewIcon />}
            colorScheme={mode === 'view' ? 'blue' : 'gray'}
            onClick={() => setMode('view')}
          />
        </Tooltip>
        <Tooltip label="Editar datos">
          <IconButton
            aria-label="Editar"
            icon={<EditIcon />}
            colorScheme={mode === 'edit' ? 'blue' : 'gray'}
            onClick={() => setMode('edit')}
          />
        </Tooltip>
      </ButtonGroup>
    </Flex>
  );

  const renderSelector = () => (
    <Box mb={4}>
      <FormControl>
        <FormLabel>
          {mode === 'view' ? 'Seleccione una vista' : 'Seleccione una tabla'}
        </FormLabel>
        <Select
          value={mode === 'view' ? selectedView : selectedTable}
          onChange={(e) => {
            if (mode === 'view') {
              setSelectedView(e.target.value);
            } else {
              setSelectedTable(e.target.value);
            }
          }}
          placeholder={`Seleccione ${mode === 'view' ? 'una vista' : 'una tabla'}`}
        >
          {mode === 'view' 
            ? views.map((view) => (
                <option key={view} value={view}>
                  {view}
                </option>
              ))
            : tables.map((table) => (
                <option key={table} value={table}>
                  {table}
                </option>
              ))}
        </Select>
      </FormControl>
    </Box>
  );

  const renderEditModal = () => (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Editar celda</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl>
            <FormLabel>Nuevo valor:</FormLabel>
            <Input
              value={cellValue}
              onChange={(e) => setCellValue(e.target.value)}
              autoFocus
            />
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancelar
          </Button>
          <Button colorScheme="blue" onClick={handleSaveEdit}>
            Guardar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );

  return (
    <Container maxW="container.xl" py={8}>
      {renderModeToggle()}
      {renderSelector()}
      {renderTable()}
      {renderEditModal()}
    </Container>
  );
};

export default MarketingBudgetTanara;
