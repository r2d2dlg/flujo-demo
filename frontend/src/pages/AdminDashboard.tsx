import React from 'react';
import { Box, Heading, Text, Grid, VStack, GridItem, Button, useDisclosure, useToast } from '@chakra-ui/react';
import ActionButton from '../components/ActionButton';
import CreateComprehensiveProjectModal from '../components/CreateComprehensiveProjectModal';
import { FaMoneyBillWave, FaCalculator, FaChartLine, FaProjectDiagram, FaBuilding, FaCashRegister, FaCreditCard, FaTasks, FaUserFriends, FaUserTie, FaFileAlt, FaChartBar, FaClipboardList, FaCogs, FaUsers, FaPlus } from 'react-icons/fa';
import { MdAccountBalance, MdShoppingCart, MdAssessment } from 'react-icons/md';
import { Link } from 'react-router-dom';

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, children }) => (
    <Box w="100%" p={5} shadow="md" borderWidth="1px" borderRadius="lg" mb={8}>
        <Heading fontSize="xl" mb={4} borderBottom="2px" borderColor="gray.200" pb={2}>{title}</Heading>
        <Grid templateColumns="repeat(6, 1fr)" gap={4}>
            {children}
        </Grid>
    </Box>
);

const AdminDashboard: React.FC = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const handleProjectCreated = (projectKeyword: string) => {
    toast({
      title: 'Proyecto Creado',
      description: `El proyecto "${projectKeyword}" ha sido creado exitosamente con todas las tablas necesarias.`,
      status: 'success',
      duration: 5000,
      isClosable: true,
    });
  };

  return (
    <Box p={8}>
      <Heading as="h1" size="xl" mb={4} textAlign="center">
        Panel de Administración Central
      </Heading>
      
      <Section title="Gestión de Proyectos">
        <GridItem>
          <ActionButton 
            onClick={onOpen}
            colorScheme="green" 
            title="Crear Nuevo Proyecto" 
            subtitle="Crear proyecto completo" 
            icon={FaPlus} 
            size="sm"
            minHeight="80px"
            fontSize="sm"
          />
        </GridItem>
        <GridItem>
          <ActionButton 
            to="/admin/gestionar-proyectos"
            colorScheme="red" 
            title="Gestionar Proyectos" 
            subtitle="Ver y eliminar proyectos" 
            icon={FaCogs} 
            size="sm"
            minHeight="80px"
            fontSize="sm"
          />
        </GridItem>
        <GridItem>
          <ActionButton 
            to="/admin/scenario-projects"
            colorScheme="purple" 
            title="Proyectos de Escenario" 
            subtitle="Modelado financiero FCF/DCF" 
            icon={FaProjectDiagram} 
            size="sm"
            minHeight="80px"
            fontSize="sm"
          />
        </GridItem>
      </Section>

      <Section title="Dashboards Principales">
        <GridItem>
          <ActionButton to="/ventas-dashboard" colorScheme="blue" title="Ventas" subtitle="Gestión ventas y comisiones" icon={FaMoneyBillWave} size="sm" minHeight="80px" fontSize="sm" />
        </GridItem>
        <GridItem>
          <ActionButton to="/mercadeo-dashboard" colorScheme="green" title="Mercadeo" subtitle="Presupuestos marketing" icon={FaChartLine} size="sm" minHeight="80px" fontSize="sm" />
        </GridItem>
        <GridItem>
          <ActionButton to="/dashboard-contabilidad" colorScheme="purple" title="Contabilidad" subtitle="Control gastos y finanzas" icon={FaCalculator} size="sm" minHeight="80px" fontSize="sm" />
        </GridItem>
        <GridItem>
          <ActionButton to="/cobros-dashboard" colorScheme="teal" title="Cobros" subtitle="Gestión cuentas por cobrar" icon={FaCashRegister} size="sm" minHeight="80px" fontSize="sm" />
        </GridItem>
      </Section>

      <Section title="Tablas Administrativas">
        <GridItem>
          <ActionButton to="/costo-directo/table" colorScheme="orange" title="Costos Directos" subtitle="Gestionar tabla" icon={FaClipboardList} size="sm" minHeight="80px" fontSize="sm" />
        </GridItem>
        <GridItem>
          <ActionButton to="/estudios-disenos-permisos/table" colorScheme="blue" title="Estudios y Permisos" subtitle="Gestionar tabla" icon={FaFileAlt} size="sm" minHeight="80px" fontSize="sm" />
        </GridItem>
        <GridItem>
          <ActionButton to="/pagos-tierra/table" colorScheme="orange" title="Pagos a Tierra" subtitle="Gestionar tabla pagos" icon={FaMoneyBillWave} size="sm" minHeight="80px" fontSize="sm" />
        </GridItem>
        <GridItem>
          <ActionButton to="/dashboard/lineas_credito" colorScheme="teal" title="Líneas de Crédito" subtitle="Administrar datos" icon={FaCreditCard} size="sm" minHeight="80px" fontSize="sm" />
        </GridItem>
        <GridItem>
          <ActionButton to="/miscelaneos" colorScheme="purple" title="Misceláneos" subtitle="Gestionar tabla" icon={FaCogs} size="sm" minHeight="80px" fontSize="sm" />
        </GridItem>
        <GridItem>
          <ActionButton to="/proveedores" colorScheme="cyan" title="Proveedores" subtitle="Gestionar tablas" icon={FaUsers} size="sm" minHeight="80px" fontSize="sm" />
        </GridItem>
      </Section>

      <Section title="Reportes">
        <GridItem>
          <ActionButton to="/costo-directo/view" colorScheme="red" title="Reporte de Costos" subtitle="Resumen y totales" icon={FaChartBar} size="sm" minHeight="80px" fontSize="sm" />
        </GridItem>
        <GridItem>
          <ActionButton to="/pagos-tierra/view" colorScheme="yellow" title="Reporte de Pagos" subtitle="Resumen y totales" icon={FaChartLine} size="sm" minHeight="80px" fontSize="sm" />
        </GridItem>
        <GridItem>
          <ActionButton to="/vista-proveedores" colorScheme="blue" title="Vista Proveedores" subtitle="Ver estado de cuenta" icon={MdAssessment} size="sm" minHeight="80px" fontSize="sm" />
        </GridItem>
      </Section>

      <Section title="Flujos de Efectivo">
        <GridItem>
          <ActionButton to="/contabilidad/flujo-general-empresa" colorScheme="blue" title="Flujo General" subtitle="Proyecciones flujo caja" icon={FaChartLine} size="sm" minHeight="80px" fontSize="sm" />
        </GridItem>
        <GridItem>
          <ActionButton to="/dashboard/cash-flow-lineas-credito" colorScheme="purple" title="Flujo Líneas Crédito" subtitle="Proyección y saldos" icon={MdAccountBalance} size="sm" minHeight="80px" fontSize="sm" />
        </GridItem>
      </Section>

      <Section title="Gestión de Datos Maestros">
        <GridItem>
          <ActionButton to="/admin/manage-clientes" colorScheme="cyan" title="Clientes" subtitle="Administrar datos clientes" icon={FaUserFriends} size="sm" minHeight="80px" fontSize="sm" />
        </GridItem>
        <GridItem>
          <ActionButton to="/admin/vendedores" colorScheme="pink" title="Vendedores" subtitle="Administrar vendedores" icon={FaUserTie} size="sm" minHeight="80px" fontSize="sm" />
        </GridItem>
        <GridItem>
          <ActionButton to="/contabilidad/consultores/tables" colorScheme="purple" title="Consultores" subtitle="Administrar datos" icon={FaUserTie} size="sm" minHeight="80px" fontSize="sm" />
        </GridItem>
        <GridItem>
          <ActionButton to="/contabilidad/consultores/view" colorScheme="teal" title="Vista Consultores" subtitle="Ver matriz de costos" icon={FaCalculator} size="sm" minHeight="80px" fontSize="sm" />
        </GridItem>
        <GridItem>
          <ActionButton to="/admin/marketing-proyectos" colorScheme="orange" title="Proyectos Marketing" subtitle="Administrar proyectos" icon={FaProjectDiagram} size="sm" minHeight="80px" fontSize="sm" />
        </GridItem>
        <GridItem>
          <ActionButton to="/admin/manage-empresas" colorScheme="yellow" title="Empresas" subtitle="Administrar empresas" icon={FaBuilding} size="sm" minHeight="80px" fontSize="sm" />
        </GridItem>
      </Section>

      <Section title="Analítica">
        <GridItem>
          <ActionButton to="/admin/analitica-avanzada" colorScheme="purple" title="Analítica Avanzada" subtitle="Explora análisis avanzados" icon={FaChartBar} size="sm" minHeight="80px" fontSize="sm" />
        </GridItem>
      </Section>

      <CreateComprehensiveProjectModal
        isOpen={isOpen}
        onClose={onClose}
        onProjectCreated={handleProjectCreated}
      />

    </Box>
  );
};

export default AdminDashboard;