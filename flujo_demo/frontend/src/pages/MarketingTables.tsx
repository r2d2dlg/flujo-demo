import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
  Select,
  FormControl,
  FormLabel,
  IconButton,
  Input,
  useToast,
  Spinner,
  Center
} from '@chakra-ui/react';
import { EditIcon, CheckIcon, CloseIcon } from '@chakra-ui/icons';
import { marketingApi } from '../api/marketingApi';

interface TableRow {
  [key: string]: any;
}

export default function MarketingTables() {
  const { project = 'chepo' } = useParams<{ project: string }>();
  const projectApi = project === 'tanara' ? marketingApi.tanara : marketingApi.chepo;
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableData, setTableData] = useState<TableRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editingValues, setEditingValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const toast = useToast();

  useEffect(() => {
    const fetchTables = async () => {
      try {
        setIsLoading(true);
        const response = await projectApi.getTables();
        const projectTables = response.tables.filter(table => 
          table.toLowerCase().includes(project.toLowerCase())
        );
        setTables(projectTables);
        if (projectTables.length > 0) {
          setSelectedTable(projectTables[0]);
        }
      } catch (error) {
        console.error('Error fetching tables:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar las tablas',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTables();
  }, [project, toast]);

  useEffect(() => {
    if (selectedTable) {
      console.log('Selected table changed to:', selectedTable);
      fetchTableData();
    } else {
      console.log('No table selected');
    }
  }, [selectedTable]);

  const fetchTableData = async () => {
    if (!selectedTable) return;
    
    try {
      console.log('Fetching table data for:', selectedTable);
      setIsLoading(true);
      const response = await projectApi.getTableData(selectedTable);
      console.log('Raw API response:', JSON.stringify(response, null, 2));
      
      let columnsToSet: string[] = [];
      let dataToSet: any[] = [];
      
      if (response && response.columns && response.data) {
        console.log('Using response.columns and response.data');
        columnsToSet = response.columns;
        
        // Data is already in the correct format (array of objects)
        if (Array.isArray(response.data)) {
          dataToSet = response.data;
        } else {
          dataToSet = [];
        }
      }
      
      console.log('Setting columns:', columnsToSet);
      console.log('Setting table data:', dataToSet);
      
      setColumns(columnsToSet);
      setTableData(dataToSet);
      setEditingRow(null);
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

  const handleEditClick = (rowIndex: number) => {
    console.log('Starting edit for row:', rowIndex);
    const row = tableData[rowIndex];
    const values: Record<string, string> = {};
    
    // Convert all row values to strings for editing
    Object.entries(row).forEach(([key, value]) => {
      values[key] = value === null || value === undefined ? '' : String(value);
    });
    
    setEditingRow(rowIndex);
    setEditingValues(values);
  };

  const handleSaveClick = async (rowIndex: number) => {
    if (editingRow === null) return;
    
    const primaryKey = columns[0];
    const rowId = tableData[rowIndex][primaryKey];

    try {
      // Prepare update data with only changed values
      const updateData: Record<string, string> = {};
      const originalRow = tableData[rowIndex];
      
      Object.entries(editingValues).forEach(([key, value]) => {
        if (String(originalRow[key]) !== value) {
          updateData[key] = value;
        }
      });
      
      if (Object.keys(updateData).length > 0) {
        await projectApi.updateTableRow(selectedTable, rowId, updateData);
        
        // Update local data
        const newData = [...tableData];
        newData[rowIndex] = {
          ...newData[rowIndex],
          ...updateData
        };
        setTableData(newData);
        
        toast({
          title: 'Actualizado',
          description: 'Los cambios se guardaron correctamente',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      
      setEditingRow(null);
      setEditingValues({});
      
    } catch (error) {
      console.error('Error updating row:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar los cambios',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleCancelClick = () => {
    console.log('Canceling edit');
    setEditingRow(null);
    setEditingValues({});
  };

  const formatTableName = (name: string): string => {
    return name
      .replace(/^presupuesto_mercadeo_/, '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

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


  const renderTable = () => {
    console.log('Rendering table with data:', {
      columns,
      tableData: tableData.slice(0, 2), // Only log first 2 rows
      editingRow,
      editingValues
    });
    if (isLoading) {
      return (
        <Center h="200px">
          <Spinner size="xl" />
        </Center>
      );
    }

    if (tableData.length === 0) {
      return <Text>No hay datos disponibles para la tabla seleccionada.</Text>;
    }

    return (
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
              {tableData.map((row, rowIndex) => (
                <Tr key={rowIndex}>
                  {columns.map((column) => (
                    <Td 
                      key={`${rowIndex}-${column}`}
                      bg={editingRow === rowIndex ? 'blue.50' : 'white'}
                      borderWidth="1px"
                      borderColor="gray.200"
                      p={2}
                      fontSize="sm"
                    >
                      {editingRow === rowIndex ? (
                        <Input
                          value={editingValues[column] || ''}
                          onChange={(e) => {
                            setEditingValues(prev => ({
                              ...prev,
                              [column]: e.target.value
                            }));
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveClick(rowIndex);
                            if (e.key === 'Escape') handleCancelClick();
                          }}
                          size="sm"
                          w="100%"
                        />
                                              ) : (
                        <Box p={2}>
                          {String(row[column] || '')}
                        </Box>
                      )}
                    </Td>
                  ))}
                  <Td borderWidth="1px" borderColor="gray.200">
                    {editingRow === rowIndex ? (
                      <Box display="flex" gap={2}>
                        <IconButton
                          aria-label="Guardar"
                          icon={<CheckIcon />}
                          onClick={() => handleSaveClick(rowIndex)}
                          colorScheme="green"
                          size="sm"
                        />
                        <IconButton
                          aria-label="Cancelar"
                          icon={<CloseIcon />}
                          onClick={handleCancelClick}
                          colorScheme="red"
                          size="sm"
                        />
                      </Box>
                    ) : (
                      <IconButton
                        aria-label="Editar fila"
                        icon={<EditIcon />}
                        onClick={() => handleEditClick(rowIndex)}
                        size="sm"
                        colorScheme="blue"
                        variant="ghost"
                      />
                    )}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  return (
    <Box p={8}>
      <Heading as="h1" size="xl" mb={6}>
        Tablas de Presupuesto - {project.charAt(0).toUpperCase() + project.slice(1)}
      </Heading>
      
      <FormControl mb={6} maxW="md">
        <FormLabel>Seleccionar Tabla</FormLabel>
        <Select
          value={selectedTable}
          onChange={(e) => setSelectedTable(e.target.value)}
          placeholder="Selecciona una tabla"
          mb={4}
        >
          {tables.map((table) => (
            <option key={table} value={table}>
              {formatTableName(table)}
            </option>
          ))}
        </Select>
      </FormControl>

      {renderTable()}
    </Box>
  );
}
