import { Box, Button, Heading, Grid, GridItem, Flex } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import ActionButton from '../components/ActionButton'; // Assuming ActionButton is in components
import { FaDollarSign, FaUsers, FaChartBar, FaHistory, FaHome } from 'react-icons/fa';
import { ArrowBackIcon } from '@chakra-ui/icons'; // For the back button

export default function CobrosDashboard() {
  // Placeholder actions - these would link to actual pages or trigger modals
  const cobrosActions = [
    {
      to: '/cobros/registrar-pago',
      title: 'Registrar Pago Recibido',
      subtitle: 'Ingresar nuevo pago cliente',
      icon: FaDollarSign,
      colorScheme: 'green',
    },
    {
      to: '/cobros/estado-cuenta',
      title: 'Estado de Cuenta',
      subtitle: 'Ver pagos y saldos clientes',
      icon: FaUsers,
      colorScheme: 'blue',
    },
    {
      to: '/cobros/reporte-antiguedad',
      title: 'Reporte de Antigüedad',
      subtitle: 'Reporte saldos vencidos',
      icon: FaChartBar,
      colorScheme: 'orange',
    },
    {
      to: '/cobros/historial-pagos',
      title: 'Historial de Pagos',
      subtitle: 'Consultar pagos registrados',
      icon: FaHistory,
      colorScheme: 'purple',
    },
  ];

  return (
    <Box p={8}>
      <Flex justifyContent="space-between" alignItems="center" mb={10}>
        <Heading as="h1" size="xl">Dashboard de Cobros</Heading>
      </Flex>

      <Heading size="lg" mb={6}>Acciones Principales de Cobros</Heading>
      <Grid templateColumns="repeat(6, 1fr)" gap={4} mb={10}>
        {cobrosActions.map((action, index) => (
          <GridItem key={index}>
            <ActionButton
              to={action.to}
              title={action.title}
              subtitle={action.subtitle}
              icon={action.icon}
              colorScheme={action.colorScheme}
              size="sm"
              minHeight="80px"
              fontSize="sm"
            />
          </GridItem>
        ))}
      </Grid>

      {/* You can add more sections here, e.g., KPIs, quick stats, etc. */}

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