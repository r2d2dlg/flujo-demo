import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  useToast,
  IconButton,
  HStack,
  Spinner,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { tables } from '../api/api';
import TableRowForm from '../components/TableRowForm';

interface TableData {
  id: number;
  [key: string]: any;
}

export default function TableViewer() {
  const { tableName } = useParams<{ tableName: string }>();
  const [data, setData] = useState<TableData[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingRow, setEditingRow] = useState<TableData | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const navigate = useNavigate();

  const fetchTableData = async () => {
    if (!tableName) return;
    
    try {
      setIsLoading(true);
      const response = await tables.getTable(tableName);
      setData(response.data.rows || []);
      
      // Extract column names from the first row if available
      if (response.data.rows && response.data.rows.length > 0) {
        setColumns(Object.keys(response.data.rows[0]).filter(key => key !== 'id'));
      }
    } catch (error) {
      console.error('Error fetching table data:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la tabla',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTableData();
  }, [tableName]);

  const handleAddRow = () => {
    setEditingRow(null);
    onOpen();
  };

  const handleEditRow = (row: TableData) => {
    setEditingRow(row);
    onOpen();
  };

  const handleDeleteRow = async (id: number) => {
    if (!tableName) return;
    
    if (window.confirm('¿Estás seguro de que deseas eliminar esta fila?')) {
      try {
        await tables.deleteRow(tableName, id);
        toast({
          title: 'Fila eliminada',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        fetchTableData();
      } catch (error) {
        console.error('Error deleting row:', error);
        toast({
          title: 'Error',
          description: 'No se pudo eliminar la fila',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  const handleFormSubmit = async (formData: Record<string, any>) => {
    if (!tableName) return;
    
    try {
      if (editingRow) {
        // Update existing row
        await tables.updateRow(tableName, editingRow.id, formData);
        toast({
          title: 'Fila actualizada',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Add new row
        await tables.addRow(tableName, formData);
        toast({
          title: 'Fila agregada',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      
      onClose();
      fetchTableData();
    } catch (error) {
      console.error('Error saving row:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar la fila',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (isLoading) {
    return (
      <Box p={4}>
        <HStack spacing={4}>
          <Spinner />
          <Text>Cargando tabla...</Text>
        </HStack>
      </Box>
    );
  }

  return (
    <Box p={4}>
      <HStack justify="space-between" mb={6}>
        <Heading as="h1" size="lg">
          {tableName?.replace(/_/g, ' ')}
        </Heading>
        <Button
          leftIcon={<AddIcon />}
          colorScheme="blue"
          onClick={handleAddRow}
        >
          Agregar Fila
        </Button>
      </HStack>

      <TableContainer>
        <Table variant="striped">
          <Thead>
            <Tr>
              {columns.map((column) => (
                <Th key={column}>{column}</Th>
              ))}
              <Th>Acciones</Th>
            </Tr>
          </Thead>
          <Tbody>
            {data.length === 0 ? (
              <Tr>
                <Td colSpan={columns.length + 1} textAlign="center">
                  No hay datos para mostrar
                </Td>
              </Tr>
            ) : (
              data.map((row) => (
                <Tr key={row.id}>
                  {columns.map((column) => (
                    <Td key={`${row.id}-${column}`}>
                      {String(row[column] || '')}
                    </Td>
                  ))}
                  <Td>
                    <HStack spacing={2}>
                      <IconButton
                        aria-label="Editar fila"
                        icon={<EditIcon />}
                        size="sm"
                        onClick={() => handleEditRow(row)}
                      />
                      <IconButton
                        aria-label="Eliminar fila"
                        icon={<DeleteIcon />}
                        colorScheme="red"
                        size="sm"
                        onClick={() => handleDeleteRow(row.id)}
                      />
                    </HStack>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </TableContainer>

      <TableRowForm
        isOpen={isOpen}
        onClose={onClose}
        onSubmit={handleFormSubmit}
        columns={columns}
        initialData={editingRow}
      />
    </Box>
  );
}
