import { Box, Heading, VStack, Button, Grid, GridItem } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import ActionButton from '../components/ActionButton';
import { FaMoneyBillWave, FaChartLine, FaFileInvoiceDollar, FaProjectDiagram, FaClipboardList, FaCashRegister, FaUniversity, FaFileContract, FaStream, FaUsersCog, FaListAlt, FaCalculator } from 'react-icons/fa';

// Helper component for section titles with grid layout
interface SectionProps {
  title: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, children }) => (
  <Box mb={8}>
    <Heading as="h2" size="md" mb={4} borderBottomWidth="1px" pb={2}>
      {title}
    </Heading>
    <Grid templateColumns="repeat(6, 1fr)" gap={4}>
      {children}
    </Grid>
  </Box>
);

const DashboardContabilidadPage: React.FC = () => {
  return (
    <Box p={5}>
      <Heading mb={6} textAlign="center">Dashboard de Contabilidad</Heading>
      
      <VStack spacing={8} align="stretch">
        <Section title="Gestión de Presupuestos y Proyectos">
          <GridItem>
            <ActionButton
              to="/dashboard-contabilidad/presupuesto_gastos_fijos_operativos"
              icon={FaFileInvoiceDollar}
              colorScheme="teal"
              title="Gastos Fijos Operativos"
              size="sm"
              minHeight="80px"
              fontSize="sm"
            />
          </GridItem>
          <GridItem>
            <ActionButton
                to="/contabilidad/gestionar-presupuesto-gastos"
                icon={FaMoneyBillWave}
                colorScheme="orange"
                title="Gastos por Proyecto"
                size="sm"
                minHeight="80px"
                fontSize="sm"
            />
          </GridItem>
          <GridItem>
            <ActionButton 
              to="/contabilidad/cuenta-proyectos"
              icon={FaProjectDiagram}
              colorScheme="purple"
              title="Cuenta de Proyectos"
              size="sm"
              minHeight="80px"
              fontSize="sm"
            />
          </GridItem>
          <GridItem>
            <ActionButton
                to="/contabilidad/entradas-diario-proyecto"
                icon={FaCashRegister}
                colorScheme="red"
                title="Entradas de Diario"
                size="sm"
                minHeight="80px"
                fontSize="sm"
            />
          </GridItem>
        </Section>

        <Section title="Análisis y Vistas Consolidadas">
          <GridItem>
            <ActionButton
              to="/dashboard-contabilidad/vista/gastos-fijos-con-totales"
              icon={FaChartLine}
              colorScheme="cyan"
              title="Gastos Fijos Detallado"
              size="sm"
              minHeight="80px"
              fontSize="sm"
            />
          </GridItem>
          <GridItem>
            <ActionButton
              to="/dashboard-contabilidad/vista/gastos-fijos-resumen"
              icon={FaClipboardList}
              colorScheme="blue"
              title="Resumen Gastos Fijos"
              size="sm"
              minHeight="80px"
              fontSize="sm"
            />
          </GridItem>
        </Section>

        <Section title="Flujo de Efectivo y Financiamiento">
          <GridItem>
            <ActionButton
              to="/dashboard/lineas_credito"
              icon={FaUniversity}
              colorScheme="pink"
              title="Líneas de Crédito"
              size="sm"
              minHeight="80px"
              fontSize="sm"
            />
          </GridItem>
          <GridItem>
            <ActionButton
              to="/dashboard/cash-flow-lineas-credito"
              icon={FaFileContract}
              colorScheme="yellow"
              title="Flujo Líneas Crédito"
              size="sm"
              minHeight="80px"
              fontSize="sm"
            />
          </GridItem>
          <GridItem>
            <ActionButton
              to="/contabilidad/flujo-general-empresa"
              icon={FaStream}
              colorScheme="green"
              title="Flujo General Empresa"
              size="sm"
              minHeight="80px"
              fontSize="sm"
            />
          </GridItem>
        </Section>

        <Section title="Nóminas">
          <GridItem>
            <ActionButton
              to="/payroll/tables-dashboard"
              icon={FaUsersCog}
              colorScheme="green"
              title="Tablas de Nómina"
              subtitle="Crear, editar registros"
              size="sm"
              minHeight="80px"
              fontSize="sm"
            />
          </GridItem>
          <GridItem>
            <ActionButton
              to="/payroll/views-dashboard"
              icon={FaListAlt}
              colorScheme="blue"
              title="Vistas de Nómina"
              subtitle="Reportes consolidados"
              size="sm"
              minHeight="80px"
              fontSize="sm"
            />
          </GridItem>
        </Section>

        <Button as={RouterLink} to="/dashboard" colorScheme="gray" alignSelf="flex-start" mt={6} size="sm">
          Volver a Dashboard Principal
        </Button>
      </VStack>
    </Box>
  );
};

export default DashboardContabilidadPage; 