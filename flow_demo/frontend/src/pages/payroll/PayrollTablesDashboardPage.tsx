import { Box, Heading, VStack, Grid, GridItem, Text } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import ActionButton from '../../components/ActionButton'; // Adjust path as necessary
import { FaTable, FaRegEdit, FaUserCog, FaChartLine } from 'react-icons/fa'; // Example icons
import { AddIcon } from '@chakra-ui/icons';

const PayrollTablesDashboardPage: React.FC = () => {
  const tablePages = [
    {
      to: '/payroll/tables/administracion',
      title: 'Planilla Administración',
      subtitle: 'Gestionar planilla administración',
      icon: FaRegEdit,
      colorScheme: 'teal'
    },
    {
      to: '/payroll/tables/fija-construccion',
      title: 'Planilla Fija Construcción',
      subtitle: 'Gestionar planilla fija',
      icon: FaRegEdit,
      colorScheme: 'blue'
    },
    {
      to: '/payroll/tables/gerencial',
      title: 'Planilla Gerencial',
      subtitle: 'Gestionar planilla gerencial',
      icon: FaRegEdit,
      colorScheme: 'purple'
    },
    {
      to: '/payroll/tables/servicio-profesionales',
      title: 'Servicios Profesionales',
      subtitle: 'Gestionar servicios profesionales',
      icon: FaRegEdit,
      colorScheme: 'orange'
    },
    {
      to: '/payroll/tables/variable-construccion',
      title: 'Variable Construcción',
      subtitle: 'Gestionar planilla variable',
      icon: FaRegEdit,
      colorScheme: 'red'
    },
    {
      to: '/payroll/assign-project-payroll',
      title: 'Asignar Planilla a Proyecto',
      subtitle: 'Asignar planilla variable',
      icon: FaUserCog,
      colorScheme: 'green'
    },
  ];

  const cashFlowPages = [
    {
      to: '/payroll/flujo-planillas-fijas',
      title: 'Flujo Planillas Fijas',
      subtitle: 'Ver y editar flujo fijas',
      icon: FaChartLine,
      colorScheme: 'cyan'
    },
    {
      to: '/payroll/flujo-planillas-variables',
      title: 'Flujo Planillas Variables',
      subtitle: 'Ver y editar flujo variables',
      icon: FaChartLine,
      colorScheme: 'pink'
    }
  ];

  return (
    <Box p={5}>
      <Heading mb={6} textAlign="center">Gestionar Tablas de Nómina</Heading>
      
      <Heading size="md" mb={4}>Tablas de Planillas</Heading>
      <Grid templateColumns="repeat(6, 1fr)" gap={4} mb={8}>
        {tablePages.map(page => (
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

      <Heading size="md" mb={4}>Flujos de Planillas</Heading>
      <Grid templateColumns="repeat(6, 1fr)" gap={4} mb={8}>
        {cashFlowPages.map(page => (
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

export default PayrollTablesDashboardPage; 