import { useState, useEffect, useCallback } from 'react';
import {
  useToast,
  Container,
  VStack,
  Box,
  Heading,
  Select,
  FormControl,
  FormLabel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Center,
  Spinner,
  Text
} from '@chakra-ui/react';
import { marketingApi } from '../api/marketingApi';

// Types
interface TableColumn {
  key: string;
  name: string;
  editable?: boolean;
}

type TableRow = Record<string, any>;

const MarketingBudget = () => {
  // State management
  const toast = useToast();
  const [currentProject, setCurrentProject] = useState<string>('chepo');
  const [columns, setColumns] = useState<TableColumn[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [views, setViews] = useState<string[]>([]);
  const [selectedView, setSelectedView] = useState<string>('');
  const [viewData, setViewData] = useState<TableRow[]>([]);

  // Helper function to transform column names for display
  const transformColumns = useCallback((columns: string[]): TableColumn[] => {
    return columns.map(col => ({
      key: col,
      name: col === 'actividad' ? 'Actividad' : col.charAt(0).toUpperCase() + col.slice(1),
      editable: false // Views are read-only
    }));
  }, []);

  // Fetch view data
  const fetchViewData = useCallback(async (viewName: string) => {
    if (!viewName) return;
    
    try {
      setIsLoading(true);
      const project = currentProject;
      console.log(`Fetching view data for ${viewName} in project ${project}`);
      
      const response = await marketingApi[project as 'chepo' | 'tanara'].getViewData(viewName);
      console.log('View data response:', response);
      
      if (response && response.data) {
        setViewData(response.data);
        setColumns(transformColumns(response.columns || []));
      } else {
        throw new Error('No se recibieron datos de la vista');
      }
    } catch (error) {
      console.error('Error fetching view data:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos de la vista',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setViewData([]);
      setColumns([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentProject, toast, transformColumns]);

  // Get project from URL
  const getProjectFromUrl = () => {
    const pathParts = window.location.pathname.split('/');
    const project = pathParts[pathParts.length - 1].toLowerCase();
    return ['chepo', 'tanara'].includes(project) ? project : 'chepo';
  };
  
  // Set initial project from URL
  useEffect(() => {
    const project = getProjectFromUrl();
    setCurrentProject(project);
  }, []);

  // Fetch views when project changes
  useEffect(() => {
    const fetchViews = async () => {
      try {
        setIsLoading(true);
        const project = currentProject;
        console.log(`Fetching views for project: ${project}`);
        
        const response = await marketingApi[project as 'chepo' | 'tanara'].getViews();
        console.log('Views response:', response);
        
        if (response && response.views) {
          // Filter views for the current project
          const projectViews = response.views.filter(view => 
            view.toLowerCase().includes(project)
          );
          
          console.log('Filtered views:', projectViews);
          setViews(projectViews);
          
          // Select the first view by default
          if (projectViews.length > 0 && !selectedView) {
            console.log('Setting initial view to:', projectViews[0]);
            setSelectedView(projectViews[0]);
          }
        } else {
          console.warn('No views found in response:', response);
          setViews([]);
        }
      } catch (error) {
        console.error('Error fetching views:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar las vistas',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        setViews([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentProject) {
      fetchViews();
    }
  }, [currentProject, toast]);

  // Fetch view data when selected view changes
  useEffect(() => {
    if (selectedView) {
      console.log('Selected view changed to:', selectedView);
      fetchViewData(selectedView).catch(error => {
        console.error('Error in fetchViewData:', error);
        toast({
          title: 'Error',
          description: 'Error al cargar la vista: ' + error.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      });
    } else {
      console.log('No view selected');
      setViewData([]);
    }
  }, [selectedView, fetchViewData]);

  // Format view names for display
  const formatViewName = (name: string) => {
    if (!name) return '';
    // Remove project prefix if it exists
    const withoutProject = name.replace(new RegExp(`_?${currentProject}_?`, 'i'), '');
    // Remove common prefixes
    const withoutPrefix = withoutProject.replace(/^v_?/i, '');
    // Split by underscore and capitalize first letter of each word
    return withoutPrefix
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Render the data table for views
  const renderViewTable = () => (
    <TableContainer>
      <Table variant="simple" size="sm">
        <Thead>
          <Tr>
            {columns.map((column) => (
              <Th key={column.key}>{column.name}</Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {viewData.map((row, rowIndex) => (
            <Tr key={rowIndex}>
              {columns.map((column) => (
                <Td key={`${rowIndex}-${column.key}`}>
                  {row[column.key] || '-'}
                </Td>
              ))}
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );

  if (isLoading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading as="h1" size="xl" mb={2}>
            Presupuesto de Mercadeo - {currentProject.charAt(0).toUpperCase() + currentProject.slice(1)}
          </Heading>
          <Text color="gray.600" mb={6}>Visualización de datos de mercadeo</Text>
          
          <FormControl mb={6}>
            <FormLabel>Seleccionar Vista</FormLabel>
            <Select
              value={selectedView}
              onChange={(e) => setSelectedView(e.target.value)}
              placeholder="Selecciona una vista"
            >
              {views.map((view) => (
                <option key={view} value={view}>
                  {formatViewName(view)}
                </option>
              ))}
            </Select>
          </FormControl>

          {selectedView && viewData.length > 0 ? (
            <Box borderWidth="1px" borderRadius="lg" p={4} overflowX="auto">
              {renderViewTable()}
            </Box>
          ) : (
            <Text>No hay datos disponibles para la vista seleccionada.</Text>
          )}
        </Box>
      </VStack>
    </Container>
  );
};

export default MarketingBudget;
