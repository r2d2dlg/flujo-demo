import { useState, useEffect } from 'react';
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
  useToast,
  Text,
  VStack,
  HStack,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  Button,
  Tabs, 
  TabList, 
  TabPanels, 
  Tab, 
  TabPanel
} from '@chakra-ui/react';
import { formatCurrency } from '../../utils/formatters';
import apiClient, { 
  costoDirecto, 
  type CostoDirectoView, 
  type CostoXViviendaView,
  type CostosDirectosTotales
} from '../../api/api';
import { Link as RouterLink } from 'react-router-dom';

const CostoDirectoGeneralView = () => {
  const [data, setData] = useState<CostoDirectoView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await costoDirecto.getView();
        setData(response.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los datos de Costo Directo',
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

  if (isLoading || !data) {
    return <Box p={4}>Cargando...</Box>;
  }

  return (
    <VStack spacing={6} align="stretch">
      <StatGroup>
        <Stat>
          <StatLabel>Total Infraestructura</StatLabel>
          <StatNumber>{formatCurrency(data.totals.infraestructura)}</StatNumber>
        </Stat>
        <Stat>
          <StatLabel>Total Materiales</StatLabel>
          <StatNumber>{formatCurrency(data.totals.materiales)}</StatNumber>
        </Stat>
        <Stat>
          <StatLabel>Total MO</StatLabel>
          <StatNumber>{formatCurrency(data.totals.mo)}</StatNumber>
        </Stat>
        <Stat>
          <StatLabel>Total Equipos</StatLabel>
          <StatNumber>{formatCurrency(data.totals.equipos)}</StatNumber>
        </Stat>
        <Stat>
          <StatLabel>Total General</StatLabel>
          <StatNumber>{formatCurrency(data.totals.total)}</StatNumber>
        </Stat>
      </StatGroup>

      <TableContainer>
        <Table variant="striped" size="sm">
          <Thead>
            <Tr>
              <Th>Actividad</Th>
              <Th isNumeric>Infraestructura</Th>
              <Th isNumeric>Materiales</Th>
              <Th isNumeric>MO</Th>
              <Th isNumeric>Equipos</Th>
              <Th isNumeric>Total</Th>
            </Tr>
          </Thead>
          <Tbody>
            {data.rows.map((row, index) => (
              <Tr key={index}>
                <Td>{row.actividad}</Td>
                <Td isNumeric>{formatCurrency(row.infraestructura)}</Td>
                <Td isNumeric>{formatCurrency(row.materiales)}</Td>
                <Td isNumeric>{formatCurrency(row.mo)}</Td>
                <Td isNumeric>{formatCurrency(row.equipos)}</Td>
                <Td isNumeric>{formatCurrency(row.total)}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </VStack>
  );
};

const CostoViviendaView = () => {
  const [data, setData] = useState<CostoXViviendaView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.costoXViviendaApi.getView();
        setData(response.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los datos de Costo por Vivienda',
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

  if (isLoading || !data) {
    return <Box p={4}>Cargando...</Box>;
  }

  return (
    <TableContainer>
      <Table variant="striped" size="sm">
        <Thead>
          <Tr>
            <Th isNumeric>Viviendas</Th>
            <Th isNumeric>Materiales</Th>
            <Th isNumeric>M.O</Th>
            <Th isNumeric>Otros</Th>
            <Th isNumeric>Total</Th>
          </Tr>
        </Thead>
        <Tbody>
          {data.map((row) => (
            <Tr key={row.id}>
              <Td isNumeric>{row.viviendas}</Td>
              <Td isNumeric>{formatCurrency(row.materiales)}</Td>
              <Td isNumeric>{formatCurrency(row.mo)}</Td>
              <Td isNumeric>{formatCurrency(row.otros)}</Td>
              <Td isNumeric>{formatCurrency(row.total)}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
};

const CostoDirectoTotalesView = () => {
  const [data, setData] = useState<CostosDirectosTotales | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await costoDirecto.getTotals();
        setData(response.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los datos de Totales',
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

  if (isLoading || !data) {
    return <Box p={4}>Cargando...</Box>;
  }

  const tableData = [
    { label: 'Costo total materiales infraestructura', value: data.costo_total_materiales_infraestructura },
    { label: 'Costo total materiales viviendas', value: data.costo_total_materiales_viviendas },
    { label: 'Mano de obra infraestructura', value: data.mano_de_obra_infraestructura },
    { label: 'Mano de obra vivienda', value: data.mano_de_obra_vivienda },
  ];

  const total = tableData.reduce((sum, item) => sum + item.value, 0);

  return (
    <TableContainer>
      <Table variant="simple">
        <Tbody>
          {tableData.map((row) => (
            <Tr key={row.label}>
              <Td fontWeight="bold">{row.label}</Td>
              <Td isNumeric>{formatCurrency(row.value)}</Td>
            </Tr>
          ))}
          <Tr>
            <Td fontWeight="bold" borderTop="2px" borderColor="gray.400">Total</Td>
            <Td isNumeric fontWeight="bold" borderTop="2px" borderColor="gray.400">{formatCurrency(data.total)}</Td>
          </Tr>
        </Tbody>
      </Table>
    </TableContainer>
  );
};

export default function CostoDirectoCombinedViewPage() {
  return (
    <Box p={4}>
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between">
          <Heading size="lg">Vista de Costos Directos</Heading>
          <Button as={RouterLink} to="/costo-directo/table" colorScheme="blue">
            Gestionar Datos
          </Button>
        </HStack>
        <Tabs isFitted variant="enclosed">
          <TabList mb="1em">
            <Tab>Costo Directo General</Tab>
            <Tab>Costo por Vivienda</Tab>
            <Tab>Totales</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <CostoDirectoGeneralView />
            </TabPanel>
            <TabPanel>
              <CostoViviendaView />
            </TabPanel>
            <TabPanel>
              <CostoDirectoTotalesView />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Box>
  );
} 