import React from 'react';
import { Box, Heading, VStack, Grid, GridItem } from '@chakra-ui/react';
import ActionButton from '../components/ActionButton';
import { FaChartLine, FaProjectDiagram, FaMoneyBillWave, FaCreditCard, FaCogs, FaCalculator, FaClipboardList, FaBalanceScale, FaFileInvoiceDollar, FaUsers, FaBriefcase, FaCashRegister } from 'react-icons/fa';

// Helper component for section titles with grid layout
interface SectionProps {
  title: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, children }) => (
  <Box mb={8}>
    <Heading as="h3" size="md" mb={4} borderBottomWidth="1px" pb={2}>
      {title}
    </Heading>
    <Grid templateColumns="repeat(6, 1fr)" gap={4}>
      {children}
    </Grid>
  </Box>
);

const SubSection: React.FC<SectionProps> = ({ title, children }) => (
  <Box mb={6}>
    <Heading as="h4" size="sm" mb={3} color="gray.600">
      {title}
    </Heading>
    <Grid templateColumns="repeat(6, 1fr)" gap={4}>
      {children}
    </Grid>
  </Box>
);

const AnaliticaAvanzadaPage: React.FC = () => {
  return (
    <Box p={5}>
      <Heading mb={8}>Analítica Avanzada</Heading>
      <VStack spacing={10} align="stretch">
        
        <Section title="1. Flujos de Caja">
          <GridItem>
            <ActionButton 
              to="/cash-flows/mercadeo" 
              colorScheme="blue" 
              title="Flujo Marketing" 
              subtitle="Proyección por proyecto" 
              icon={FaChartLine} 
              size="sm" 
              minHeight="80px" 
              fontSize="sm" 
            />
          </GridItem>
          <GridItem>
            <ActionButton 
              to="/estudios-permisos/view" 
              colorScheme="teal" 
              title="Estudios y Permisos" 
              subtitle="Proyección de estudios" 
              icon={FaProjectDiagram} 
              size="sm" 
              minHeight="80px" 
              fontSize="sm" 
            />
          </GridItem>
          <GridItem>
            <ActionButton 
              to="/pagos-tierra/view" 
              colorScheme="green" 
              title="Pagos a Tierra" 
              subtitle="Proyección de pagos" 
              icon={FaMoneyBillWave} 
              size="sm" 
              minHeight="80px" 
              fontSize="sm" 
            />
          </GridItem>
          <GridItem>
            <ActionButton 
              to="/cash-flows/consolidado" 
              colorScheme="purple" 
              title="Flujo Consolidado" 
              subtitle="Resumen todos los flujos" 
              icon={FaCreditCard} 
              size="sm" 
              minHeight="80px" 
              fontSize="sm" 
            />
          </GridItem>
          <GridItem>
            <ActionButton 
              to="/cash-flows/egresos-preliminares" 
              colorScheme="pink" 
              title="Egresos Preliminares" 
              subtitle="Pagos y estudios" 
              icon={FaChartLine} 
              size="sm" 
              minHeight="80px" 
              fontSize="sm" 
            />
          </GridItem>
          <GridItem>
            <ActionButton 
              to="/cash-flows/costos-directos" 
              colorScheme="orange" 
              title="Costos Directos" 
              subtitle="Flujos costos directos" 
              icon={FaCogs} 
              size="sm" 
              minHeight="80px" 
              fontSize="sm" 
            />
          </GridItem>
          <GridItem>
            <ActionButton 
              to="/payroll/flujo-planillas-fijas" 
              colorScheme="cyan" 
              title="Planillas Fijas" 
              subtitle="Flujo planillas fijas" 
              icon={FaMoneyBillWave} 
              size="sm" 
              minHeight="80px" 
              fontSize="sm" 
            />
          </GridItem>
          <GridItem>
            <ActionButton 
              to="/payroll/flujo-planillas-variables" 
              colorScheme="yellow" 
              title="Planillas Variables" 
              subtitle="Flujo por proyecto" 
              icon={FaMoneyBillWave} 
              size="sm" 
              minHeight="80px" 
              fontSize="sm" 
            />
          </GridItem>
          <GridItem>
            <ActionButton 
              to="/payroll/flujo-servicios-profesionales" 
              colorScheme="orange" 
              title="Servicios Profesionales" 
              subtitle="Flujo consultorias" 
              icon={FaCogs} 
              size="sm" 
              minHeight="80px" 
              fontSize="sm" 
            />
          </GridItem>
        </Section>

        <Box>
          <Heading size="md" mb={4}>2. Analítica de Gastos</Heading>
          <VStack spacing={6} align="stretch">
            
            <SubSection title="Gastos Operativos y Fijos">
              <GridItem>
                <ActionButton 
                  to="/dashboard-contabilidad/presupuesto_gastos_fijos_operativos" 
                  colorScheme="red" 
                  title="Gastos Fijos Operativos" 
                  subtitle="Presupuesto mensual" 
                  icon={FaFileInvoiceDollar} 
                  size="sm" 
                  minHeight="80px" 
                  fontSize="sm" 
                />
              </GridItem>
              <GridItem>
                <ActionButton 
                  to="/dashboard-contabilidad/vista/gastos-fijos-con-totales" 
                  colorScheme="purple" 
                  title="Vista Gastos con Totales" 
                  subtitle="Análisis detallado" 
                  icon={FaCalculator} 
                  size="sm" 
                  minHeight="80px" 
                  fontSize="sm" 
                />
              </GridItem>
              <GridItem>
                <ActionButton 
                  to="/analitica/gastos-fijos-consolidado" 
                  colorScheme="orange" 
                  title="Gastos Fijos Consolidado" 
                  subtitle="Tendencias mensuales" 
                  icon={FaChartLine} 
                  size="sm" 
                  minHeight="80px" 
                  fontSize="sm" 
                />
              </GridItem>
            </SubSection>

            <SubSection title="Gastos por Proyecto">
              <GridItem>
                <ActionButton 
                  to="/contabilidad/gestionar-presupuesto-gastos" 
                  colorScheme="blue" 
                  title="Gastos Administrativos" 
                  subtitle="Costos por proyecto" 
                  icon={FaBriefcase} 
                  size="sm" 
                  minHeight="80px" 
                  fontSize="sm" 
                />
              </GridItem>
              <GridItem>
                <ActionButton 
                  to="/contabilidad/cuenta-proyectos" 
                  colorScheme="teal" 
                  title="Libro Mayor Proyecto" 
                  subtitle="Asientos completos" 
                  icon={FaBalanceScale} 
                  size="sm" 
                  minHeight="80px" 
                  fontSize="sm" 
                />
              </GridItem>
              <GridItem>
                <ActionButton 
                  to="/contabilidad/entradas-diario-proyecto" 
                  colorScheme="green" 
                  title="Entradas de Diario" 
                  subtitle="Movimientos recientes" 
                  icon={FaCashRegister} 
                  size="sm" 
                  minHeight="80px" 
                  fontSize="sm" 
                />
              </GridItem>
              <GridItem>
                <ActionButton 
                  to="/analitica/gastos-proyecto-comparativo" 
                  colorScheme="cyan" 
                  title="Análisis Comparativo" 
                  subtitle="Comparar proyectos" 
                  icon={FaProjectDiagram} 
                  size="sm" 
                  minHeight="80px" 
                  fontSize="sm" 
                />
              </GridItem>
            </SubSection>

            <SubSection title="Gastos de Planillas">
              <GridItem>
                <ActionButton 
                  to="/analitica/planillas-consolidado" 
                  colorScheme="yellow" 
                  title="Planillas Consolidado" 
                  subtitle="Todas las planillas" 
                  icon={FaUsers} 
                  size="sm" 
                  minHeight="80px" 
                  fontSize="sm" 
                />
              </GridItem>
              <GridItem>
                <ActionButton 
                  to="/analitica/planillas-tendencias" 
                  colorScheme="pink" 
                  title="Tendencias Personal" 
                  subtitle="Evolución costos laborales" 
                  icon={FaChartLine} 
                  size="sm" 
                  minHeight="80px" 
                  fontSize="sm" 
                />
              </GridItem>
              <GridItem>
                <ActionButton 
                  to="/analitica/planillas-vs-presupuesto" 
                  colorScheme="gray" 
                  title="Planillas vs Presupuesto" 
                  subtitle="Real vs presupuestado" 
                  icon={FaClipboardList} 
                  size="sm" 
                  minHeight="80px" 
                  fontSize="sm" 
                />
              </GridItem>
            </SubSection>

            <SubSection title="Dashboard Consolidado">
              <GridItem>
                <ActionButton 
                  to="/analitica/dashboard-gastos-ejecutivo" 
                  colorScheme="red" 
                  title="Dashboard Ejecutivo" 
                  subtitle="Vista de alto nivel" 
                  icon={FaChartLine} 
                  size="sm" 
                  minHeight="80px" 
                  fontSize="sm" 
                />
              </GridItem>
              <GridItem>
                <ActionButton 
                  to="/analitica/categoria-gastos" 
                  colorScheme="purple" 
                  title="Análisis por Categoría" 
                  subtitle="Distribución por categoría" 
                  icon={FaCalculator} 
                  size="sm" 
                  minHeight="80px" 
                  fontSize="sm" 
                />
              </GridItem>
              <GridItem>
                <ActionButton 
                  to="/analitica/alertas-presupuesto" 
                  colorScheme="red" 
                  title="Alertas Presupuestarias" 
                  subtitle="Desviaciones y alertas" 
                  icon={FaFileInvoiceDollar} 
                  size="sm" 
                  minHeight="80px" 
                  fontSize="sm" 
                />
              </GridItem>
            </SubSection>
          </VStack>
        </Box>

        <Box>
          <Heading size="md" mb={4}>3. Asistente AI</Heading>
          <Box p={4} bg="gray.50" borderRadius="md" minH="100px">
            {/* Aquí irá el asistente AI */}
          </Box>
        </Box>
      </VStack>
    </Box>
  );
};

export default AnaliticaAvanzadaPage; 