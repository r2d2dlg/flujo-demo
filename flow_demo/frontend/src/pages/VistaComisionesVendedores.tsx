import { useState, useEffect } from 'react';
import { Box, Heading, Button, Select, VStack, Text, Spinner } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import SalesCommissionsTable from '../components/SalesCommissionsTable';
import { vendedoresApi, type Vendedor } from '../api/api';

export default function VistaComisionesVendedores() {
  const [salespeople, setSalespeople] = useState<Vendedor[]>([]);
  const [selectedSalespersonId, setSelectedSalespersonId] = useState<number | ''>( '');
  const [isLoadingSalespeople, setIsLoadingSalespeople] = useState<boolean>(true);
  const [errorSalespeople, setErrorSalespeople] = useState<string | null>(null);

  useEffect(() => {
    const fetchSalespeople = async () => {
      setIsLoadingSalespeople(true);
      setErrorSalespeople(null);
      try {
        const response = await vendedoresApi.getAll();
        if (response.data && Array.isArray(response.data)) {
          setSalespeople(response.data);
          if (response.data.length > 0) {
            setSelectedSalespersonId(response.data[0].id);
          }
        } else {
          setSalespeople([]);
          setErrorSalespeople('Formato de respuesta inesperado para la lista de vendedores.');
        }
      } catch (err) {
        console.error("Error fetching salespeople:", err);
        setErrorSalespeople('No se pudo cargar la lista de vendedores.');
      }
      setIsLoadingSalespeople(false);
    };

    fetchSalespeople();
  }, []);

  return (
    <Box p={8}>
      <Heading as="h1" size="xl" mb={6}>
        Vista de Comisiones de Vendedores
      </Heading>

      <VStack spacing={4} align="stretch" mb={8}>
        <Heading as="h2" size="md">Seleccionar Vendedor</Heading>
        {isLoadingSalespeople && (
          <Box textAlign="center">
            <Spinner />
            <Text>Cargando vendedores...</Text>
          </Box>
        )}
        {errorSalespeople && (
          <Text color="red.500">Error: {errorSalespeople}</Text>
        )}
        {!isLoadingSalespeople && !errorSalespeople && salespeople.length === 0 && (
          <Text>No se encontraron vendedores.</Text>
        )}
        {!isLoadingSalespeople && !errorSalespeople && salespeople.length > 0 && (
          <Select 
            placeholder="Seleccione un vendedor"
            value={selectedSalespersonId}
            onChange={(e) => setSelectedSalespersonId(parseInt(e.target.value, 10))}
          >
            {salespeople.map((sp) => (
              <option key={sp.id} value={sp.id}>
                {sp.nombre}
              </option>
            ))}
          </Select>
        )}
      </VStack>
      
      {selectedSalespersonId !== '' ? (
         <SalesCommissionsTable salespersonId={String(selectedSalespersonId)} />
      ) : (
        !isLoadingSalespeople && !errorSalespeople && <Text>Por favor, seleccione un vendedor para ver sus comisiones.</Text>
      )}

      <Box mt={10} pt={6} borderTop="1px solid" borderColor="gray.200">
        <Button as={RouterLink} to="/ventas-dashboard" colorScheme="blue" variant="outline">
          Volver al Dashboard de Ventas
        </Button>
      </Box>
    </Box>
  );
} 