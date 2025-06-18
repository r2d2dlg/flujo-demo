import { useState } from 'react';
import { Box, Button, Heading, Text, Grid, GridItem, useToast, Flex } from '@chakra-ui/react';
import type { TextProps } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { api } from '../api/api';
import ActionButton from '../components/ActionButton';
import { FaSyncAlt, FaPlusSquare, FaEdit, FaUserFriends, FaChartPie, FaEye, FaHome } from 'react-icons/fa';
import { ArrowBackIcon } from '@chakra-ui/icons';

export default function VentasDashboard() {
  const [refreshing, setRefreshing] = useState(false);
  const toast = useToast();

  const handleRefreshView = async () => {
    setRefreshing(true);
    try {
      await api.post('/ventas/refresh-comisiones-view', {});
      toast({
        title: 'Vista actualizada',
        description: 'La vista de comisiones de ventas ha sido actualizada.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error('Error refreshing sales commissions view:', error);
      toast({
        title: 'Error al actualizar',
        description: error.response?.data?.detail || 'No se pudo actualizar la vista de comisiones.',
        status: 'error',
        duration: 9000,
        isClosable: true,
      });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Box p={8}>
      <Flex justifyContent="space-between" alignItems="center" mb={10}>
        <Heading as="h1" size="xl">Dashboard de Ventas</Heading>
      </Flex>

      <Heading size="lg" mb={6}>Gestión de Tablas de Ventas</Heading>
      <Grid templateColumns="repeat(6, 1fr)" gap={4} mb={10}>
        <GridItem>
          <ActionButton 
            onClick={handleRefreshView}
            colorScheme="green"
            title="Actualizar Vista Comisiones"
            subtitle="Refresca datos comisiones"
            isLoading={refreshing}
            icon={FaSyncAlt}
            size="sm"
            minHeight="80px"
            fontSize="sm"
          />
        </GridItem>
        <GridItem>
          <ActionButton
            to="/ventas/nueva-tabla"
            colorScheme="blue"
            title="Crear Nueva Tabla Venta"
            subtitle="Configurar nueva tabla"
            icon={FaPlusSquare}
            size="sm"
            minHeight="80px"
            fontSize="sm"
          />
        </GridItem>
      </Grid>

      <Heading size="lg" mb={6}>Tablas de Ventas</Heading>
      <Grid templateColumns="repeat(6, 1fr)" gap={4} mb={10}>
        <GridItem>
          <ActionButton
            to="/ventas/gestionar-tabla-comisiones"
            colorScheme="teal"
            title="Gestionar Tabla Comisiones"
            subtitle="Editar registros comisiones"
            icon={FaEdit}
            size="sm"
            minHeight="80px"
            fontSize="sm"
          />
        </GridItem>
      </Grid>
      
      <Heading size="lg" mb={6}>Vistas de Ventas</Heading>
      <Grid templateColumns="repeat(6, 1fr)" gap={4} mb={10}>
        <GridItem>
          <ActionButton
            to="/ventas/vista/comisiones-vendedores"
            colorScheme="purple"
            title="Comisiones Vendedores"
            subtitle="Informe por vendedor"
            icon={FaUserFriends}
            size="sm"
            minHeight="80px"
            fontSize="sm"
          />
        </GridItem>
      </Grid>

      <Heading size="lg" mb={6}>Flujo de Efectivo</Heading>
      <Grid templateColumns="repeat(6, 1fr)" gap={4} mb={10}>
        <GridItem>
          <ActionButton
            to="/ventas/gestionar-proyeccion-flujo"
            colorScheme="cyan"
            title="Gestionar Proyección Flujo"
            subtitle="Editar proyecciones mensuales"
            icon={FaChartPie}
            size="sm"
            minHeight="80px"
            fontSize="sm"
          />
        </GridItem>
        <GridItem>
          <ActionButton
            to="/ventas/vista/flujo-efectivo"
            colorScheme="orange"
            title="Ver Proyección Flujo"
            subtitle="Visualizar reporte flujo"
            icon={FaEye}
            size="sm"
            minHeight="80px"
            fontSize="sm"
          />
        </GridItem>
      </Grid>

      <Box mt={10} pt={6} borderTop="1px solid" borderColor="gray.200">
        <RouterLink to="/">
          <Button colorScheme="gray" variant="outline" leftIcon={<ArrowBackIcon />}>
            Volver al Dashboard Principal
          </Button>
        </RouterLink>
      </Box>

    </Box>
  );
} 