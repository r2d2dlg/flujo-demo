import { Box, Heading, VStack, Grid, GridItem, Text } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import ActionButton from '../../components/ActionButton'; // Adjust path as necessary
import { FaEye } from 'react-icons/fa'; // Example icon

const PayrollViewsDashboardPage: React.FC = () => {
  const viewPages = [
    {
      to: '/payroll/views/administracion',
      title: 'Vista Planilla Administración',
      subtitle: 'Ver planilla administración',
      icon: FaEye,
      colorScheme: 'teal'
    },
    {
      to: '/payroll/views/fija-construccion',
      title: 'Vista Planilla Fija Construcción',
      subtitle: 'Ver planilla fija construcción',
      icon: FaEye,
      colorScheme: 'blue'
    },
    {
      to: '/payroll/views/gerencial',
      title: 'Vista Planilla Gerencial',
      subtitle: 'Ver planilla gerencial',
      icon: FaEye,
      colorScheme: 'purple'
    },
    {
      to: '/payroll/views/servicio-profesionales',
      title: 'Vista Servicios Profesionales',
      subtitle: 'Ver servicios profesionales',
      icon: FaEye,
      colorScheme: 'orange'
    },
    {
      to: '/payroll/views/variable-construccion',
      title: 'Vista Variable Construcción',
      subtitle: 'Ver variable construcción',
      icon: FaEye,
      colorScheme: 'red'
    },
    {
      to: '/payroll/views/total',
      title: 'Vista Planilla Total',
      subtitle: 'Ver planilla total',
      icon: FaEye,
      colorScheme: 'yellow'
    },
  ];

  return (
    <Box p={5}>
      <Heading mb={6} textAlign="center">Ver Vistas de Nómina</Heading>
      <Grid templateColumns="repeat(6, 1fr)" gap={4}>
        {viewPages.map(page => (
          <GridItem key={page.to}>
            <ActionButton
              to={page.to}
              title={page.title}
              subtitle={page.subtitle}
              icon={page.icon}
              colorScheme={page.colorScheme}
              size="sm"
              minHeight="80px"
              fontSize="sm"
            />
          </GridItem>
        ))}
      </Grid>
      <VStack mt={10}>
        <ActionButton
            to="/dashboard-contabilidad"
            title="Volver a Dashboard Contabilidad"
            colorScheme="gray"
            size="sm"
            minHeight="80px"
            fontSize="sm"
        />
      </VStack>
    </Box>
  );
};

export default PayrollViewsDashboardPage; 