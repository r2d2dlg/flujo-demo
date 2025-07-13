import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  CardBody,
  CardHeader,
  Badge,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Switch,

  Progress,
  Alert,
  AlertIcon,
  Spinner,
  Center,
  useDisclosure,
  useToast,
  SimpleGrid,
  Divider,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaPlay,
  FaPause,
  FaCheck,
  FaExclamationTriangle,
  FaClock,
  FaCalendarAlt,
  FaBuilding,
  FaCog,
  FaHome,
  FaClipboardList,
} from 'react-icons/fa';
import { useParams } from 'react-router-dom';
import { projectStages } from '../api/api';
import { 
  ProjectStage, 
  ProjectStageCreate, 
  ProjectStageUpdate, 
  ProjectStageWithSubStages,
  StageTimelineResponse 
} from '../types/projectUnitsTypes';

// Utility functions
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const getStageIcon = (stageType: string) => {
  switch (stageType.toLowerCase()) {
    case 'planning':
    case 'permits':
      return FaClipboardList;
    case 'construction':
      return FaBuilding;
    case 'engineering':
      return FaCog;
    case 'delivery':
    case 'handover':
      return FaHome;
    default:
      return FaClock;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return 'green';
    case 'IN_PROGRESS':
      return 'blue';
    case 'DELAYED':
      return 'red';
    case 'CANCELLED':
      return 'gray';
    default:
      return 'yellow';
  }
};

const getRiskColor = (riskLevel: string) => {
  switch (riskLevel) {
    case 'LOW':
      return 'green';
    case 'MEDIUM':
      return 'yellow';
    case 'HIGH':
      return 'orange';
    case 'CRITICAL':
      return 'red';
    default:
      return 'gray';
  }
};

interface StageFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  stage?: ProjectStage | null;
  projectId: number;
  onSave: () => void;
}

const StageFormModal: React.FC<StageFormModalProps> = ({
  isOpen,
  onClose,
  stage,
  projectId,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<ProjectStageCreate>>({
    stage_name: '',
    stage_type: 'PLANNING',
    description: '',
    stage_order: 1,
    planned_start_date: '',
    planned_end_date: '',
    status: 'PLANNED',
    progress_percentage: 0,
    allows_overlap: true,
    min_overlap_days: 0,
    estimated_cost: 0,
    risk_level: 'MEDIUM',
    contingency_days: 0,
  });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (stage) {
      setFormData({
        stage_name: stage.stage_name,
        stage_type: stage.stage_type,
        description: stage.description || '',
        stage_order: stage.stage_order,
        planned_start_date: stage.planned_start_date,
        planned_end_date: stage.planned_end_date,
        status: stage.status || 'PLANNED',
        progress_percentage: stage.progress_percentage || 0,
        allows_overlap: stage.allows_overlap ?? true,
        min_overlap_days: stage.min_overlap_days || 0,
        estimated_cost: stage.estimated_cost || 0,
        risk_level: stage.risk_level || 'MEDIUM',
        contingency_days: stage.contingency_days || 0,
      });
    } else {
      setFormData({
        stage_name: '',
        stage_type: 'PLANNING',
        description: '',
        stage_order: 1,
        planned_start_date: '',
        planned_end_date: '',
        status: 'PLANNED',
        progress_percentage: 0,
        allows_overlap: true,
        min_overlap_days: 0,
        estimated_cost: 0,
        risk_level: 'MEDIUM',
        contingency_days: 0,
      });
    }
  }, [stage]);

  const handleSave = async () => {
    try {
      setLoading(true);

      if (stage) {
        await projectStages.updateStage(projectId, stage.id, formData as ProjectStageUpdate);
      } else {
        await projectStages.createStage(projectId, formData as Omit<ProjectStageCreate, 'scenario_project_id'>);
      }

      toast({
        title: stage ? 'Etapa actualizada' : 'Etapa creada',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onSave();
      onClose();
    } catch (error: any) {
      console.error('Error saving stage:', error);
      let errorMessage = 'Error al guardar la etapa';
      
      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail;
        } else if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail.map((err: any) => err.msg || err).join(', ');
        } else {
          errorMessage = 'Error de validación en los datos';
        }
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {stage ? 'Editar Etapa' : 'Nueva Etapa'}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <SimpleGrid columns={2} spacing={4} w="full">
              <FormControl isRequired>
                <FormLabel>Nombre de la Etapa</FormLabel>
                <Input
                  value={formData.stage_name}
                  onChange={(e) => setFormData({ ...formData, stage_name: e.target.value })}
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Tipo de Etapa</FormLabel>
                <Select
                  value={formData.stage_type}
                  onChange={(e) => setFormData({ ...formData, stage_type: e.target.value })}
                >
                  <option value="PLANNING">Planificación</option>
                  <option value="PERMITS">Permisos</option>
                  <option value="ENGINEERING">Ingeniería</option>
                  <option value="CONSTRUCTION">Construcción</option>
                  <option value="DELIVERY">Entrega</option>
                  <option value="OTHER">Otro</option>
                </Select>
              </FormControl>
            </SimpleGrid>

            <FormControl>
              <FormLabel>Descripción</FormLabel>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </FormControl>

            <SimpleGrid columns={3} spacing={4} w="full">
              <FormControl isRequired>
                <FormLabel>Orden</FormLabel>
                <Input
                  type="number"
                  value={formData.stage_order}
                  onChange={(e) => setFormData({ ...formData, stage_order: parseInt(e.target.value) })}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Fecha de Inicio</FormLabel>
                <Input
                  type="date"
                  value={formData.planned_start_date}
                  onChange={(e) => setFormData({ ...formData, planned_start_date: e.target.value })}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Fecha de Finalización</FormLabel>
                <Input
                  type="date"
                  value={formData.planned_end_date}
                  onChange={(e) => setFormData({ ...formData, planned_end_date: e.target.value })}
                />
              </FormControl>
            </SimpleGrid>

            <SimpleGrid columns={2} spacing={4} w="full">
              <FormControl>
                <FormLabel>Estado</FormLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="PLANNED">Planificada</option>
                  <option value="IN_PROGRESS">En Progreso</option>
                  <option value="COMPLETED">Completada</option>
                  <option value="DELAYED">Retrasada</option>
                  <option value="CANCELLED">Cancelada</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Nivel de Riesgo</FormLabel>
                <Select
                  value={formData.risk_level}
                  onChange={(e) => setFormData({ ...formData, risk_level: e.target.value })}
                >
                  <option value="LOW">Bajo</option>
                  <option value="MEDIUM">Medio</option>
                  <option value="HIGH">Alto</option>
                  <option value="CRITICAL">Crítico</option>
                </Select>
              </FormControl>
            </SimpleGrid>

            <SimpleGrid columns={2} spacing={4} w="full">
              <FormControl>
                <FormLabel>Costo Estimado ($)</FormLabel>
                <Input
                  type="number"
                  value={formData.estimated_cost}
                  onChange={(e) => setFormData({ ...formData, estimated_cost: parseFloat(e.target.value) })}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Días de Contingencia</FormLabel>
                <Input
                  type="number"
                  value={formData.contingency_days}
                  onChange={(e) => setFormData({ ...formData, contingency_days: parseInt(e.target.value) })}
                />
              </FormControl>
            </SimpleGrid>

            <FormControl display="flex" alignItems="center">
              <FormLabel mb="0">
                Permite Traslape con Otras Etapas
              </FormLabel>
              <Switch
                isChecked={formData.allows_overlap}
                onChange={(e) => setFormData({ ...formData, allows_overlap: e.target.checked })}
              />
            </FormControl>

            {formData.allows_overlap && (
              <FormControl>
                <FormLabel>Días Mínimos de Traslape</FormLabel>
                <Input
                  type="number"
                  value={formData.min_overlap_days}
                  onChange={(e) => setFormData({ ...formData, min_overlap_days: parseInt(e.target.value) })}
                />
              </FormControl>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            colorScheme="purple" 
            onClick={handleSave} 
            isLoading={loading}
          >
            Guardar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

interface ProjectStagesManagerProps {
  projectId: string;
}

const ProjectStagesManager: React.FC<ProjectStagesManagerProps> = ({ projectId }) => {
  
  const [stages, setStages] = useState<ProjectStageWithSubStages[]>([]);
  const [timeline, setTimeline] = useState<StageTimelineResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingStage, setEditingStage] = useState<ProjectStage | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const loadStages = async () => {
    if (!projectId || isNaN(Number(projectId))) {
      console.error('Invalid projectId:', projectId);
      return;
    }

    try {
      setLoading(true);
      const response = await projectStages.getProjectStages(Number(projectId));
      setStages(response.data);
    } catch (error: any) {
      console.error('Error loading stages:', error);
      let errorMessage = 'Error al cargar las etapas';
      
      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail;
        } else if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail.map((err: any) => err.msg || err).join(', ');
        } else {
          errorMessage = 'Error de validación en los datos';
        }
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTimeline = async () => {
    if (!projectId || isNaN(Number(projectId))) {
      console.error('Invalid projectId:', projectId);
      return;
    }

    try {
      const response = await projectStages.getStageTimeline(Number(projectId));
      setTimeline(response.data);
    } catch (error: any) {
      console.error('Error loading timeline:', error);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadStages();
      loadTimeline();
    }
  }, [projectId]);

  const handleCreateDefaultStages = async () => {
    if (!projectId || isNaN(Number(projectId))) {
      toast({
        title: 'Error',
        description: 'ID de proyecto no válido',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      setLoading(true);
      await projectStages.createDefaultStages(Number(projectId), 'RESIDENTIAL');
      await loadStages();
      await loadTimeline();
      toast({
        title: 'Etapas creadas',
        description: 'Se han creado las etapas por defecto exitosamente',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error('Error creating default stages:', error);
      let errorMessage = 'Error al crear etapas por defecto';
      
      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail;
        } else if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail.map((err: any) => err.msg || err).join(', ');
        } else {
          errorMessage = 'Error de validación en los datos';
        }
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStage = async (stageId: number) => {
    if (!projectId || isNaN(Number(projectId))) {
      toast({
        title: 'Error',
        description: 'ID de proyecto no válido',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (window.confirm('¿Está seguro de que desea eliminar esta etapa?')) {
      try {
        await projectStages.deleteStage(Number(projectId), stageId);
        await loadStages();
        await loadTimeline();
        toast({
          title: 'Etapa eliminada',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
             } catch (error: any) {
         console.error('Error deleting stage:', error);
         let errorMessage = 'Error al eliminar la etapa';
         
         if (error.response?.data?.detail) {
           if (typeof error.response.data.detail === 'string') {
             errorMessage = error.response.data.detail;
           } else if (Array.isArray(error.response.data.detail)) {
             errorMessage = error.response.data.detail.map((err: any) => err.msg || err).join(', ');
           } else {
             errorMessage = 'Error de validación en los datos';
           }
         }
         
         toast({
           title: 'Error',
           description: errorMessage,
           status: 'error',
           duration: 5000,
           isClosable: true,
         });
       }
    }
  };

  const openCreateModal = () => {
    setEditingStage(null);
    onOpen();
  };

  const openEditModal = (stage: ProjectStage) => {
    setEditingStage(stage);
    onOpen();
  };

  const handleModalSave = async () => {
    await loadStages();
    await loadTimeline();
  };

  if (loading && stages.length === 0) {
    return (
      <Center minH="400px">
        <VStack spacing={4}>
          <Spinner size="xl" color="purple.500" />
          <Text>Cargando etapas del proyecto...</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <Box>
      {/* Header */}
      <HStack justify="space-between" align="center" mb={6}>
        <Text fontSize="2xl" fontWeight="bold">
          Etapas del Proyecto
        </Text>
        <HStack spacing={3}>
          <Button
            leftIcon={<FaCalendarAlt />}
            variant="outline"
            onClick={() => setViewMode(viewMode === 'list' ? 'timeline' : 'list')}
          >
            {viewMode === 'list' ? 'Ver Cronograma' : 'Ver Lista'}
          </Button>
          {stages.length === 0 && (
            <Button
              variant="outline"
              onClick={handleCreateDefaultStages}
              isLoading={loading}
            >
              Crear Etapas por Defecto
            </Button>
          )}
          <Button
            leftIcon={<FaPlus />}
            colorScheme="purple"
            onClick={openCreateModal}
          >
            Nueva Etapa
          </Button>
        </HStack>
      </HStack>

      {/* Content */}
      {stages.length === 0 ? (
        <Card>
          <CardBody>
            <VStack spacing={4} py={8}>
              <FaClock size={64} color="gray" />
              <Text fontSize="lg" fontWeight="semibold">
                No hay etapas definidas
              </Text>
              <Text color="gray.500" textAlign="center">
                Comience creando etapas para organizar su proyecto o use las etapas por defecto.
              </Text>
              <HStack spacing={3}>
                <Button
                  variant="outline"
                  onClick={handleCreateDefaultStages}
                  isLoading={loading}
                >
                  Crear Etapas por Defecto
                </Button>
                <Button
                  leftIcon={<FaPlus />}
                  colorScheme="purple"
                  onClick={openCreateModal}
                >
                  Nueva Etapa
                </Button>
              </HStack>
            </VStack>
          </CardBody>
        </Card>
      ) : (
        <Tabs variant="enclosed" colorScheme="purple">
          <TabList>
            <Tab>Vista de Lista</Tab>
            <Tab>Cronograma</Tab>
          </TabList>
          <TabPanels>
            {/* List View */}
            <TabPanel>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                {stages.map((stage) => {
                  const StageIcon = getStageIcon(stage.stage_type);
                  return (
                    <Card key={stage.id}>
                      <CardHeader>
                        <HStack justify="space-between" align="flex-start">
                          <HStack spacing={3}>
                            <StageIcon size={20} />
                            <Text fontSize="lg" fontWeight="bold">
                              {stage.stage_name}
                            </Text>
                          </HStack>
                          <HStack>
                            <IconButton
                              aria-label="Editar"
                              icon={<FaEdit />}
                              size="sm"
                              variant="ghost"
                              onClick={() => openEditModal(stage)}
                            />
                            <IconButton
                              aria-label="Eliminar"
                              icon={<FaTrash />}
                              size="sm"
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => handleDeleteStage(stage.id)}
                            />
                          </HStack>
                        </HStack>
                      </CardHeader>
                      <CardBody>
                        <VStack align="stretch" spacing={4}>
                          <HStack spacing={2}>
                            <Badge colorScheme={getStatusColor(stage.status || 'PLANNED')}>
                              {stage.status}
                            </Badge>
                            <Badge colorScheme={getRiskColor(stage.risk_level || 'MEDIUM')} variant="outline">
                              Riesgo: {stage.risk_level}
                            </Badge>
                          </HStack>

                          {stage.description && (
                            <Text fontSize="sm" color="gray.600">
                              {stage.description}
                            </Text>
                          )}

                          <VStack align="stretch" spacing={2}>
                            <Text fontSize="xs" color="gray.500">
                              Inicio: {formatDate(stage.planned_start_date)}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              Fin: {formatDate(stage.planned_end_date)}
                            </Text>
                          </VStack>

                          <Box>
                            <HStack justify="space-between" mb={2}>
                              <Text fontSize="sm">Progreso</Text>
                              <Text fontSize="sm">{stage.progress_percentage || 0}%</Text>
                            </HStack>
                            <Progress
                              value={stage.progress_percentage || 0}
                              colorScheme={getStatusColor(stage.status || 'PLANNED')}
                              size="sm"
                              borderRadius="md"
                            />
                          </Box>

                          {stage.estimated_cost && (
                            <Text fontSize="sm" color="gray.600">
                              Costo estimado: ${stage.estimated_cost.toLocaleString()}
                            </Text>
                          )}
                        </VStack>
                      </CardBody>
                    </Card>
                  );
                })}
              </SimpleGrid>
            </TabPanel>

            {/* Timeline View */}
            <TabPanel>
              <Card>
                <CardHeader>
                  <Text fontSize="lg" fontWeight="bold">
                    Cronograma del Proyecto
                  </Text>
                </CardHeader>
                <CardBody>
                  {timeline && (
                    <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4} mb={6}>
                      <VStack>
                        <Text fontSize="sm" color="gray.500">Duración Total</Text>
                        <Text fontSize="lg" fontWeight="bold">{timeline.total_duration_days} días</Text>
                      </VStack>
                      <VStack>
                        <Text fontSize="sm" color="gray.500">Inicio Más Temprano</Text>
                        <Text fontSize="lg" fontWeight="bold">{formatDate(timeline.earliest_start)}</Text>
                      </VStack>
                      <VStack>
                        <Text fontSize="sm" color="gray.500">Fin Más Tardío</Text>
                        <Text fontSize="lg" fontWeight="bold">{formatDate(timeline.latest_end)}</Text>
                      </VStack>
                      <VStack>
                        <Text fontSize="sm" color="gray.500">Etapas en Ruta Crítica</Text>
                        <Text fontSize="lg" fontWeight="bold">{timeline.critical_path_stages.length}</Text>
                      </VStack>
                    </SimpleGrid>
                  )}

                  <Divider mb={6} />

                  {/* Custom Timeline */}
                  <VStack align="stretch" spacing={4}>
                    {stages.map((stage, index) => {
                      const StageIcon = getStageIcon(stage.stage_type);
                      return (
                        <HStack key={stage.id} align="flex-start" spacing={4}>
                          {/* Timeline dot and line */}
                          <VStack spacing={0}>
                            <Box
                              bg={`${getStatusColor(stage.status || 'PLANNED')}.500`}
                              color="white"
                              borderRadius="full"
                              w={8}
                              h={8}
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                            >
                              <StageIcon size={16} />
                            </Box>
                            {index < stages.length - 1 && (
                              <Box w={0.5} h={16} bg="gray.300" />
                            )}
                          </VStack>

                          {/* Timeline content */}
                          <Card flex={1} variant="outline">
                            <CardBody>
                              <HStack justify="space-between" align="flex-start" mb={2}>
                                <Text fontSize="lg" fontWeight="bold">
                                  {stage.stage_name}
                                </Text>
                                <Text fontSize="sm" color="gray.500">
                                  {formatDate(stage.planned_start_date)}
                                </Text>
                              </HStack>
                              
                              {stage.description && (
                                <Text fontSize="sm" color="gray.600" mb={3}>
                                  {stage.description}
                                </Text>
                              )}
                              
                              <HStack justify="space-between" mb={2}>
                                <Text fontSize="sm">Progreso</Text>
                                <Text fontSize="sm">{stage.progress_percentage || 0}%</Text>
                              </HStack>
                              <Progress
                                value={stage.progress_percentage || 0}
                                colorScheme={getStatusColor(stage.status || 'PLANNED')}
                                size="sm"
                                borderRadius="md"
                                mb={3}
                              />
                              
                              <HStack spacing={2}>
                                <Badge colorScheme={getStatusColor(stage.status || 'PLANNED')}>
                                  {stage.status}
                                </Badge>
                                {stage.risk_level && (
                                  <Badge colorScheme={getRiskColor(stage.risk_level)} variant="outline">
                                    Riesgo: {stage.risk_level}
                                  </Badge>
                                )}
                              </HStack>
                            </CardBody>
                          </Card>
                        </HStack>
                      );
                    })}
                  </VStack>
                </CardBody>
              </Card>
            </TabPanel>
          </TabPanels>
        </Tabs>
      )}

      {/* Create/Edit Modal */}
      <StageFormModal
        isOpen={isOpen}
        onClose={onClose}
        stage={editingStage}
        projectId={Number(projectId)}
        onSave={handleModalSave}
      />
    </Box>
  );
};

export default ProjectStagesManager; 