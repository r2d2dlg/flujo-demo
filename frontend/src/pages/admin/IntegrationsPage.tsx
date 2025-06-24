import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  Card,
  CardBody,
  CardHeader,
  SimpleGrid,
  Badge,
  Icon,
  HStack,
  VStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Input,
  Select,
  Switch,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Divider
} from '@chakra-ui/react';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSync,
  FaCheck,
  FaTimes,
  FaExclamationTriangle,
  FaCog,
  FaDatabase,
  FaCloud,
  FaArrowLeft,
  FaPlay,
  FaStop
} from 'react-icons/fa';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { api } from '../../api/api';

interface Integration {
  id: string;
  name: string;
  system_type: string;
  enabled: boolean;
  last_sync: string | null;
  auto_sync: boolean;
}

interface IntegrationStatus {
  system_type: string;
  name: string;
  enabled: boolean;
  connection_status: string;
  last_sync: string | null;
  auto_sync: boolean;
  sync_frequency_hours: number | null;
}

interface SyncResult {
  status: string;
  total_records: number;
  successful_records: number;
  failed_records: number;
  errors: string[];
  warnings: string[];
  sync_timestamp: string;
  execution_time_seconds: number | null;
}

interface SupportedSystem {
  type: string;
  name: string;
}

const IntegrationsPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  
  // State
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [supportedSystems, setSupportedSystems] = useState<SupportedSystem[]>([]);
  const [integrationStatuses, setIntegrationStatuses] = useState<Record<string, IntegrationStatus>>({});
  const [syncResults, setSyncResults] = useState<Record<string, SyncResult>>({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});
  
  // Modal states
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isSyncOpen, onOpen: onSyncOpen, onClose: onSyncClose } = useDisclosure();
  
  // Form states
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [formData, setFormData] = useState({
    integration_id: '',
    system_type: '',
    name: '',
    enabled: false,
    config_data: {}
  });
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadIntegrations(),
        loadSupportedSystems(),
        loadIntegrationStatuses()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Error al cargar los datos de integraciones',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  const loadIntegrations = async () => {
    const response = await api.get('/api/integrations/');
    setIntegrations(response.data);
  };
  
  const loadSupportedSystems = async () => {
    const response = await api.get('/api/integrations/systems');
    setSupportedSystems(response.data);
  };
  
  const loadIntegrationStatuses = async () => {
    const response = await api.get('/api/integrations/status');
    setIntegrationStatuses(response.data);
  };
  
  const handleCreateIntegration = async () => {
    try {
      await api.post('/api/integrations/', formData);
      toast({
        title: 'Éxito',
        description: 'Integración creada exitosamente',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onCreateClose();
      loadData();
      resetForm();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al crear la integración',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  const handleDeleteIntegration = async (integrationId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta integración?')) {
      return;
    }
    
    try {
      await api.delete(`/api/integrations/${integrationId}`);
      toast({
        title: 'Éxito',
        description: 'Integración eliminada exitosamente',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      loadData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al eliminar la integración',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  const handleTestConnection = async (integrationId: string) => {
    try {
      const response = await api.post(`/api/integrations/${integrationId}/test-connection`);
      const result = response.data;
      
      toast({
        title: result.connected ? 'Conexión exitosa' : 'Error de conexión',
        description: result.message,
        status: result.connected ? 'success' : 'error',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al probar la conexión',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  const handleSync = async (integrationId: string) => {
    try {
      setSyncing(prev => ({ ...prev, [integrationId]: true }));
      const response = await api.post(`/api/integrations/${integrationId}/sync`);
      const result = response.data;
      
      setSyncResults(prev => ({ ...prev, [integrationId]: result }));
      
      toast({
        title: 'Sincronización completada',
        description: `${result.successful_records} registros sincronizados exitosamente`,
        status: result.status === 'success' ? 'success' : 'warning',
        duration: 5000,
        isClosable: true,
      });
      
      loadIntegrationStatuses();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error durante la sincronización',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSyncing(prev => ({ ...prev, [integrationId]: false }));
    }
  };
  
  const handleSyncAll = async () => {
    try {
      setSyncing({ all: true });
      const response = await api.post('/api/integrations/sync');
      const results = response.data;
      
      setSyncResults(results);
      
      const totalSuccessful = Object.values(results).reduce(
        (sum: number, result: any) => sum + result.successful_records, 0
      );
      
      toast({
        title: 'Sincronización masiva completada',
        description: `${totalSuccessful} registros sincronizados en total`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      loadIntegrationStatuses();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error durante la sincronización masiva',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSyncing({});
    }
  };
  
  const resetForm = () => {
    setFormData({
      integration_id: '',
      system_type: '',
      name: '',
      enabled: false,
      config_data: {}
    });
    setSelectedIntegration(null);
  };
  
  const getSystemIcon = (systemType: string) => {
    switch (systemType.toLowerCase()) {
      case 'sap':
        return FaDatabase;
      case 'quickbooks':
        return FaCloud;
      default:
        return FaCog;
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'green';
      case 'disconnected':
        return 'red';
      default:
        return 'gray';
    }
  };
  
  const getSyncStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'green';
      case 'partial':
        return 'yellow';
      case 'failed':
        return 'red';
      default:
        return 'gray';
    }
  };

  if (loading) {
    return (
      <Box p={8} textAlign="center">
        <Spinner size="xl" />
        <Text mt={4}>Cargando integraciones...</Text>
      </Box>
    );
  }

  return (
    <Box p={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <HStack justifyContent="space-between" align="start">
          <VStack align="start" spacing={2}>
            <Heading as="h1" size="xl" color="blue.600">
              Integraciones Contables
            </Heading>
            <Text color="gray.600" fontSize="lg">
              Gestiona las integraciones con sistemas de contabilidad externos como SAP, QuickBooks, Xero y otros
            </Text>
            <Badge colorScheme="purple" variant="subtle" fontSize="sm" px={3} py={1}>
              Centro de Integraciones
            </Badge>
          </VStack>
          <HStack>
            <Button
              leftIcon={<FaSync />}
              colorScheme="purple"
              variant="outline"
              onClick={handleSyncAll}
              isLoading={syncing.all}
              loadingText="Sincronizando..."
            >
              Sincronizar Todo
            </Button>
            <Button
              leftIcon={<FaPlus />}
              colorScheme="blue"
              onClick={onCreateOpen}
            >
              Nueva Integración
            </Button>
            <Button
              as={RouterLink}
              to="/admin"
              leftIcon={<FaArrowLeft />}
              colorScheme="gray"
              variant="outline"
            >
              Volver
            </Button>
          </HStack>
        </HStack>

        <Divider />

        {/* Statistics */}
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6}>
          <Card>
            <CardBody textAlign="center">
              <Stat>
                <StatLabel>Total Integraciones</StatLabel>
                <StatNumber color="blue.600">{integrations.length}</StatNumber>
                <StatHelpText>Configuradas</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody textAlign="center">
              <Stat>
                <StatLabel>Activas</StatLabel>
                <StatNumber color="green.600">
                  {integrations.filter(i => i.enabled).length}
                </StatNumber>
                <StatHelpText>Habilitadas</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody textAlign="center">
              <Stat>
                <StatLabel>Conectadas</StatLabel>
                <StatNumber color="purple.600">
                  {Object.values(integrationStatuses).filter(s => s.connection_status === 'connected').length}
                </StatNumber>
                <StatHelpText>En línea</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody textAlign="center">
              <Stat>
                <StatLabel>Sistemas Soportados</StatLabel>
                <StatNumber color="orange.600">{supportedSystems.length}</StatNumber>
                <StatHelpText>Disponibles</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Integrations Grid */}
        <Box>
          <Heading size="lg" mb={6} color="gray.700">
            🔗 Integraciones Configuradas
          </Heading>
          
          {integrations.length === 0 ? (
            <Card>
              <CardBody textAlign="center" py={12}>
                <Icon as={FaDatabase} boxSize={12} color="gray.400" mb={4} />
                <Heading size="md" color="gray.500" mb={2}>
                  No hay integraciones configuradas
                </Heading>
                <Text color="gray.500" mb={6}>
                  Comienza creando tu primera integración con un sistema contable
                </Text>
                <Button
                  leftIcon={<FaPlus />}
                  colorScheme="blue"
                  onClick={onCreateOpen}
                >
                  Crear Primera Integración
                </Button>
              </CardBody>
            </Card>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {integrations.map((integration) => {
                const status = integrationStatuses[integration.id];
                const syncResult = syncResults[integration.id];
                const SystemIcon = getSystemIcon(integration.system_type);
                
                return (
                  <Card 
                    key={integration.id} 
                    variant="outline" 
                    _hover={{ shadow: "lg" }}
                    transition="all 0.2s"
                  >
                    <CardHeader>
                      <HStack justify="space-between">
                        <HStack>
                          <Icon as={SystemIcon} boxSize={6} color="blue.500" />
                          <VStack align="start" spacing={0}>
                            <Heading size="sm">{integration.name}</Heading>
                            <Text fontSize="xs" color="gray.500">
                              {integration.system_type.toUpperCase()}
                            </Text>
                          </VStack>
                        </HStack>
                        <VStack spacing={1}>
                          <Badge 
                            colorScheme={integration.enabled ? 'green' : 'gray'}
                            variant="subtle"
                            fontSize="xs"
                          >
                            {integration.enabled ? 'Activa' : 'Inactiva'}
                          </Badge>
                          {status && (
                            <Badge 
                              colorScheme={getStatusColor(status.connection_status)}
                              variant="subtle"
                              fontSize="xs"
                            >
                              {status.connection_status === 'connected' ? 'Conectada' : 'Desconectada'}
                            </Badge>
                          )}
                        </VStack>
                      </HStack>
                    </CardHeader>
                    
                    <CardBody pt={0}>
                      <VStack align="stretch" spacing={3}>
                        {/* Last Sync Info */}
                        {integration.last_sync && (
                          <Box>
                            <Text fontSize="xs" color="gray.500">
                              Última sincronización:
                            </Text>
                            <Text fontSize="sm">
                              {new Date(integration.last_sync).toLocaleString('es-ES')}
                            </Text>
                          </Box>
                        )}
                        
                        {/* Sync Result */}
                        {syncResult && (
                          <Box>
                            <Badge 
                              colorScheme={getSyncStatusColor(syncResult.status)}
                              variant="subtle"
                              fontSize="xs"
                              mb={1}
                            >
                              {syncResult.status.toUpperCase()}
                            </Badge>
                            <Text fontSize="xs" color="gray.600">
                              {syncResult.successful_records} exitosos, {syncResult.failed_records} fallidos
                            </Text>
                            {syncResult.execution_time_seconds && (
                              <Text fontSize="xs" color="gray.500">
                                Tiempo: {syncResult.execution_time_seconds.toFixed(2)}s
                              </Text>
                            )}
                          </Box>
                        )}
                        
                        {/* Action Buttons */}
                        <HStack spacing={2}>
                          <Button
                            size="sm"
                            colorScheme="blue"
                            variant="outline"
                            leftIcon={<FaCheck />}
                            onClick={() => handleTestConnection(integration.id)}
                            flex={1}
                          >
                            Probar
                          </Button>
                          <Button
                            size="sm"
                            colorScheme="green"
                            leftIcon={syncing[integration.id] ? <Spinner size="xs" /> : <FaSync />}
                            onClick={() => handleSync(integration.id)}
                            isDisabled={!integration.enabled || syncing[integration.id]}
                            flex={1}
                          >
                            {syncing[integration.id] ? 'Sync...' : 'Sync'}
                          </Button>
                        </HStack>
                        
                        <HStack spacing={2}>
                          <Button
                            size="sm"
                            colorScheme="orange"
                            variant="outline"
                            leftIcon={<FaEdit />}
                            onClick={() => {
                              setSelectedIntegration(integration);
                              onEditOpen();
                            }}
                            flex={1}
                          >
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            colorScheme="red"
                            variant="outline"
                            leftIcon={<FaTrash />}
                            onClick={() => handleDeleteIntegration(integration.id)}
                            flex={1}
                          >
                            Eliminar
                          </Button>
                        </HStack>
                      </VStack>
                    </CardBody>
                  </Card>
                );
              })}
            </SimpleGrid>
          )}
        </Box>

        {/* Supported Systems */}
        <Box>
          <Heading size="lg" mb={6} color="gray.700">
            💼 Sistemas Soportados
          </Heading>
          <SimpleGrid columns={{ base: 2, md: 4, lg: 6 }} spacing={4}>
            {supportedSystems.map((system) => (
              <Card key={system.type} variant="outline" size="sm">
                <CardBody textAlign="center">
                  <Icon as={getSystemIcon(system.type)} boxSize={8} color="gray.600" mb={2} />
                  <Text fontSize="sm" fontWeight="bold">
                    {system.name}
                  </Text>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        </Box>
      </VStack>

      {/* Create Integration Modal */}
      <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Nueva Integración</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>ID de Integración</FormLabel>
                <Input
                  placeholder="ej: quickbooks-main"
                  value={formData.integration_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, integration_id: e.target.value }))}
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Sistema</FormLabel>
                <Select
                  placeholder="Selecciona un sistema"
                  value={formData.system_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, system_type: e.target.value }))}
                >
                  {supportedSystems.map((system) => (
                    <option key={system.type} value={system.type}>
                      {system.name}
                    </option>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Nombre</FormLabel>
                <Input
                  placeholder="ej: QuickBooks Principal"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </FormControl>
              
              <FormControl>
                <HStack justify="space-between">
                  <FormLabel mb={0}>Habilitar integración</FormLabel>
                  <Switch
                    isChecked={formData.enabled}
                    onChange={(e) => setFormData(prev => ({ ...prev, enabled: e.target.checked }))}
                  />
                </HStack>
              </FormControl>
              
              <Alert status="info">
                <AlertIcon />
                <Box>
                  <AlertTitle>Configuración adicional requerida</AlertTitle>
                  <AlertDescription>
                    Después de crear la integración, deberás configurar los parámetros de conexión específicos del sistema.
                  </AlertDescription>
                </Box>
              </Alert>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCreateClose}>
              Cancelar
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleCreateIntegration}
              isDisabled={!formData.integration_id || !formData.system_type || !formData.name}
            >
              Crear Integración
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default IntegrationsPage; 