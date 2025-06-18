import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Heading, 
  Select, 
  useToast,
  Spinner,
  Container,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  VStack,
  HStack,
  Button,
  ButtonGroup
} from '@chakra-ui/react';
import { api } from '../api/api';

interface TableData {
  columns: string[];
  data: any[];
}

export default function ProjectBudget() {
  const { projectId = '' } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableData, setTableData] = useState<TableData>({ columns: [], data: [] });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isTableLoading, setIsTableLoading] = useState<boolean>(false);

  // Format the project name for display
  const formatProjectName = (id: string) => {
    return id
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Fetch all tables for this project
  useEffect(() => {
    const fetchTables = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/tables/list');
        const projectTables = response.data.tables.filter((table: string) => 
          table.toLowerCase().startsWith(`presupuesto_mercadeo_${projectId.toLowerCase()}`)
        );
        
        setTables(projectTables);
        if (projectTables.length > 0) {
          setSelectedTable(projectTables[0]);
        }
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

  // Fetch table data when selected table changes
  useEffect(() => {
    const fetchTableData = async () => {
      if (!selectedTable) return;
      
      try {
        setIsTableLoading(true);
        const response = await api.get(`/tables/data/${selectedTable}`);
        
        if (response.data && response.data.length > 0) {
          // Transform the data if needed
          setTableData({
            columns: Object.keys(response.data[0]),
            data: response.data
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
        setIsTableLoading(false);
      }
    };

    fetchTableData();
  }, [selectedTable, toast]);

  const handleNavigateToEdit = () => {
    navigate(`/project/${projectId}/tablas`);
  };

  if (isLoading) {
    return (
      <Container centerContent py={10}>
        <Spinner size="xl" />
        <Text mt={4}>Cargando proyecto...</Text>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between" align="center">
          <VStack align="flex-start" spacing={1}>
            <Heading size="lg">
              Presupuesto de Mercadeo - {formatProjectName(projectId)}
            </Heading>
            <Text color="gray.500">Vista de presupuesto consolidado</Text>
          </VStack>
          
          <ButtonGroup>
            <Button 
              colorScheme="blue" 
              onClick={handleNavigateToEdit}
              leftIcon={<i className="fas fa-edit"></i>}
            >
              Editar Tablas
            </Button>
          </ButtonGroup>
        </HStack>

        {tables.length > 0 ? (
          <>
            <HStack spacing={4} align="center">
              <Text fontWeight="medium">Seleccionar tabla:</Text>
              <Select 
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                maxW="md"
              >
                {tables.map((table) => (
                  <option key={table} value={table}>
                    {formatProjectName(table.replace('presupuesto_mercadeo_', '').replace(/_/g, ' '))}
                  </option>
                ))}
              </Select>
            </HStack>

            {isTableLoading ? (
              <Box textAlign="center" py={10}>
                <Spinner size="xl" />
                <Text mt={4}>Cargando datos de la tabla...</Text>
              </Box>
            ) : (
              <TableContainer>
                <Table variant="striped" colorScheme="gray">
                  <Thead>
                    <Tr>
                      {tableData.columns.map((column) => (
                        <Th key={column}>
                          {column.split('_').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ')}
                        </Th>
                      ))}
                    </Tr>
                  </Thead>
                  <Tbody>
                    {tableData.data.map((row, rowIndex) => (
                      <Tr key={rowIndex}>
                        {tableData.columns.map((column) => (
                          <Td key={`${rowIndex}-${column}`}>
                            {String(row[column] ?? '')}
                          </Td>
                        ))}
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            )}
          </>
        ) : (
          <Box textAlign="center" py={10}>
            <Text>No se encontraron tablas para este proyecto.</Text>
          </Box>
        )}
      </VStack>
    </Container>
  );
}
