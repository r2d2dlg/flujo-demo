import React from 'react';
import { Box, Heading, Text, Grid, VStack, GridItem, Button, useDisclosure, useToast, Card, CardBody, CardHeader, SimpleGrid, Badge, HStack, Stat, StatLabel, StatNumber, StatHelpText, Spinner, Center, IconButton } from '@chakra-ui/react';
import ActionButton from '../components/ActionButton';
import CreateComprehensiveProjectModal from '../components/CreateComprehensiveProjectModal';
import { FaMoneyBillWave, FaCalculator, FaChartLine, FaProjectDiagram, FaBuilding, FaCashRegister, FaCreditCard, FaTasks, FaUserFriends, FaUserTie, FaFileAlt, FaChartBar, FaClipboardList, FaCogs, FaUsers, FaPlus, FaEye, FaTrash } from 'react-icons/fa';
import { MdAccountBalance, MdShoppingCart, MdAssessment } from 'react-icons/md';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../api/api';
import { useAuth } from '../context/AuthContext';

// TypeScript interfaces
interface ApprovedProject {
  id: number;
  name: string;
  location?: string;
  status: string;
  npv?: number;
  irr?: number;
  total_units?: number;
  target_price_per_m2?: number;
  updated_at: string;
}

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
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State for approved projects
  const [approvedProjects, setApprovedProjects] = useState<ApprovedProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  
  // Check if current user is admin
  const isAdmin = user?.role === 'admin';

  const handleProjectCreated = (projectKeyword: string) => {
    toast({
      title: 'Proyecto Creado',
      description: `El proyecto "${projectKeyword}" ha sido creado exitosamente con todas las tablas necesarias.`,
      status: 'success',
      duration: 5000,
      isClosable: true,
    });
  };

  // Fetch approved projects
  const fetchApprovedProjects = async () => {
    try {
      setLoadingProjects(true);
      const response = await fetch(`${API_BASE_URL}/api/scenario-projects/`);
      if (response.ok) {
        const data = await response.json();
        // Filter only approved projects
        const approved = data.projects.filter((p: ApprovedProject) => p.status === 'APPROVED');
        setApprovedProjects(approved);
      }
    } catch (error) {
      console.error('Error fetching approved projects:', error);
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    fetchApprovedProjects();
  }, []);

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('es-PA', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (rate?: number) => {
    if (!rate) return '-';
    return `${(rate * 100).toFixed(1)}%`;
  };

  const deleteApprovedProject = async (projectId: number, projectName: string) => {
    if (!window.confirm(`¿Está seguro de que desea eliminar el proyecto "${projectName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/scenario-projects/${projectId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Proyecto Eliminado',
          description: 'El proyecto ha sido eliminado exitosamente',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        fetchApprovedProjects(); // Refresh the list
      } else {
        throw new Error('Failed to delete project');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al eliminar el proyecto',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box p={8}>
      <Heading as="h1" size="xl" mb={4} textAlign="center">
        Panel de Administración Central
      </Heading>
      
      {/* Approved Projects Section */}
      {approvedProjects.length > 0 && (
        <Box w="100%" p={5} shadow="md" borderWidth="1px" borderRadius="lg" mb={8}>
          <HStack justify="space-between" align="center" mb={4}>
            <Heading fontSize="xl" borderBottom="2px" borderColor="gray.200" pb={2}>
              Proyectos Aprobados ({approvedProjects.length})
            </Heading>
            <Button
              as={Link}
              to="/admin/scenario-projects"
              size="sm"
              colorScheme="purple"
              variant="outline"
              rightIcon={<FaEye />}
            >
              Ver Todos
            </Button>
          </HStack>
          
          {loadingProjects ? (
            <Center p={4}>
              <Spinner size="lg" color="purple.500" />
            </Center>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {approvedProjects.map((project) => (
                <Card key={project.id} variant="outline" _hover={{ shadow: "md", cursor: "pointer" }}>
                  <CardHeader pb={2}>
                    <VStack align="start" spacing={1}>
                      <HStack justify="space-between" w="100%">
                        <Text fontWeight="bold" fontSize="md" noOfLines={1}>
                          {project.name}
                        </Text>
                        <Badge colorScheme="green" size="sm">
                          Aprobado
                        </Badge>
                      </HStack>
                      {project.location && (
                        <Text fontSize="sm" color="gray.500">
                          📍 {project.location}
                        </Text>
                      )}
                    </VStack>
                  </CardHeader>
                  <CardBody pt={0}>
                    <SimpleGrid columns={2} spacing={3}>
                      <Stat size="sm">
                        <StatLabel fontSize="xs">NPV</StatLabel>
                        <StatNumber fontSize="sm" color={project.npv && project.npv > 0 ? 'green.500' : 'red.500'}>
                          {formatCurrency(project.npv)}
                        </StatNumber>
                      </Stat>
                      
                      <Stat size="sm">
                        <StatLabel fontSize="xs">TIR</StatLabel>
                        <StatNumber fontSize="sm" color={project.irr && project.irr > 0.12 ? 'green.500' : 'orange.500'}>
                          {formatPercentage(project.irr)}
                        </StatNumber>
                      </Stat>
                      
                      {project.total_units && (
                        <Stat size="sm">
                          <StatLabel fontSize="xs">Unidades</StatLabel>
                          <StatNumber fontSize="sm">
                            {project.total_units}
                          </StatNumber>
                        </Stat>
                      )}
                      
                      {project.target_price_per_m2 && (
                        <Stat size="sm">
                          <StatLabel fontSize="xs">Precio/m²</StatLabel>
                          <StatNumber fontSize="sm">
                            {formatCurrency(project.target_price_per_m2)}
                          </StatNumber>
                        </Stat>
                      )}
                    </SimpleGrid>
                    
                    <HStack spacing={2} mt={3}>
                      <Button
                        size="sm"
                        colorScheme="purple"
                        variant="outline"
                        flex={1}
                        leftIcon={<FaEye />}
                        onClick={() => navigate(`/admin/scenario-projects/${project.id}`)}
                      >
                        Ver Detalles
                      </Button>
                      <IconButton
                        icon={<FaTrash />}
                        aria-label="Eliminar proyecto"
                        size="sm"
                        colorScheme="red"
                        variant="outline"
                        onClick={() => deleteApprovedProject(project.id, project.name)}
                      />
                    </HStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          )}
        </Box>
      )}

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
        {isAdmin && (
          <GridItem>
            <ActionButton to="/admin/panel" colorScheme="red" title="Gestión de Usuarios" subtitle="Crear y administrar usuarios del sistema" icon={FaUsers} size="sm" minHeight="80px" fontSize="sm" />
          </GridItem>
        )}
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