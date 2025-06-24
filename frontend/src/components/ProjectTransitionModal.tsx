import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Select,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Alert,
  AlertIcon,
  Badge,
  Box,
  Flex,
  useToast,
  Divider,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText
} from '@chakra-ui/react';
import { FaTrophy, FaTimes, FaTools, FaCheckCircle } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface Quote {
  id: number;
  name: string;
  total_amount: number;
  status: string;
  line_items_count: number;
}

interface TransitionOption {
  action: string;
  label: string;
  description: string;
  color: string;
  requires_data: boolean;
  available_quotes?: Quote[];
}

interface ProjectTransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  projectName: string;
  currentStatus: string;
  onSuccess: () => void;
}

const ProjectTransitionModal: React.FC<ProjectTransitionModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
  currentStatus,
  onSuccess
}) => {
  const [transitions, setTransitions] = useState<TransitionOption[]>([]);
  const [selectedTransition, setSelectedTransition] = useState<TransitionOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form data for different transition types
  const [awardData, setAwardData] = useState({
    winning_quote_id: '',
    award_amount: '',
    award_date: new Date().toISOString().split('T')[0],
    contract_duration_days: '',
    notes: ''
  });
  
  const [constructionData, setConstructionData] = useState({
    start_date: new Date().toISOString().split('T')[0],
    estimated_completion_date: '',
  });

  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchTransitionOptions();
    }
  }, [isOpen, projectId]);

  const fetchTransitionOptions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/construction-quotes/projects/${projectId}/transition-options`);
      if (response.ok) {
        const data = await response.json();
        setTransitions(data.available_transitions);
      } else {
        throw new Error('Error cargando opciones de transición');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las opciones de transición',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTransitionSubmit = async () => {
    if (!selectedTransition) return;

    setSubmitting(true);
    try {
      let endpoint = '';
      let data = {};

      switch (selectedTransition.action) {
        case 'award_project':
          endpoint = `/api/construction-quotes/projects/${projectId}/award-project`;
          data = {
            ...awardData,
            winning_quote_id: awardData.winning_quote_id ? parseInt(awardData.winning_quote_id) : undefined,
            award_amount: awardData.award_amount ? parseFloat(awardData.award_amount) : undefined,
            contract_duration_days: awardData.contract_duration_days ? parseInt(awardData.contract_duration_days) : undefined
          };
          break;
        
        case 'start_construction':
          endpoint = `/api/construction-quotes/projects/${projectId}/start-construction`;
          data = constructionData;
          break;
        
        default:
          throw new Error('Acción no implementada');
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'Éxito',
          description: result.message,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error en la transición');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error procesando transición',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (action: string) => {
    switch (action) {
      case 'award_project': return <FaTrophy />;
      case 'reject_project': return <FaTimes />;
      case 'start_construction': return <FaTools />;
      case 'complete_project': return <FaCheckCircle />;
      default: return null;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PA', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      'BIDDING': 'En Licitación',
      'AWARDED': 'Adjudicado',
      'IN_PROGRESS': 'En Construcción',
      'COMPLETED': 'Completado',
      'REJECTED': 'No Ganado'
    };
    return statusMap[status] || status;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <VStack align="start" spacing={2}>
            <Text>Transición de Estado del Proyecto</Text>
            <HStack>
              <Text fontSize="sm" color="gray.600">{projectName}</Text>
              <Badge colorScheme="blue">{getStatusLabel(currentStatus)}</Badge>
            </HStack>
          </VStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          {loading ? (
            <Text>Cargando opciones...</Text>
          ) : (
            <VStack spacing={6} align="stretch">
              {!selectedTransition ? (
                <>
                  <Text>Seleccione la acción que desea realizar:</Text>
                  <VStack spacing={3} align="stretch">
                    {transitions.map((transition, index) => (
                      <Box
                        key={index}
                        p={4}
                        border="1px"
                        borderColor="gray.200"
                        borderRadius="md"
                        cursor="pointer"
                        _hover={{ borderColor: transition.color + '.300', bg: transition.color + '.50' }}
                        onClick={() => setSelectedTransition(transition)}
                      >
                        <HStack spacing={3}>
                          <Box color={transition.color + '.500'}>
                            {getStatusIcon(transition.action)}
                          </Box>
                          <VStack align="start" spacing={1} flex={1}>
                            <Text fontWeight="medium">{transition.label}</Text>
                            <Text fontSize="sm" color="gray.600">{transition.description}</Text>
                          </VStack>
                        </HStack>
                      </Box>
                    ))}
                  </VStack>
                </>
              ) : (
                <VStack spacing={6} align="stretch">
                  <HStack>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedTransition(null)}>
                      ← Volver
                    </Button>
                    <Text fontWeight="medium">{selectedTransition.label}</Text>
                  </HStack>

                  <Divider />

                  {/* Award Project Form */}
                  {selectedTransition.action === 'award_project' && (
                    <VStack spacing={4} align="stretch">
                      <Alert status="success">
                        <AlertIcon />
                        ¡Felicitaciones! Marcar este proyecto como ganado transferirá automáticamente los datos al sistema de seguimiento.
                      </Alert>

                      <FormControl isRequired>
                        <FormLabel>Cotización Ganadora</FormLabel>
                        <Select 
                          value={awardData.winning_quote_id} 
                          onChange={(e) => setAwardData({...awardData, winning_quote_id: e.target.value})}
                          placeholder="Seleccionar cotización"
                        >
                          {selectedTransition.available_quotes?.map(quote => (
                            <option key={quote.id} value={quote.id}>
                              {quote.name} - {formatCurrency(quote.total_amount)} ({quote.line_items_count} items)
                            </option>
                          ))}
                        </Select>
                      </FormControl>

                      <SimpleGrid columns={2} spacing={4}>
                        <FormControl>
                          <FormLabel>Monto Adjudicado</FormLabel>
                          <Input
                            type="number"
                            step="0.01"
                            value={awardData.award_amount}
                            onChange={(e) => setAwardData({...awardData, award_amount: e.target.value})}
                            placeholder="Monto final adjudicado"
                          />
                        </FormControl>

                        <FormControl>
                          <FormLabel>Fecha de Adjudicación</FormLabel>
                          <Input
                            type="date"
                            value={awardData.award_date}
                            onChange={(e) => setAwardData({...awardData, award_date: e.target.value})}
                          />
                        </FormControl>
                      </SimpleGrid>

                      <FormControl>
                        <FormLabel>Duración del Contrato (días)</FormLabel>
                        <Input
                          type="number"
                          value={awardData.contract_duration_days}
                          onChange={(e) => setAwardData({...awardData, contract_duration_days: e.target.value})}
                          placeholder="Ej: 120"
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>Notas de Adjudicación</FormLabel>
                        <Textarea
                          value={awardData.notes}
                          onChange={(e) => setAwardData({...awardData, notes: e.target.value})}
                          placeholder="Detalles adicionales sobre la adjudicación..."
                        />
                      </FormControl>

                      {awardData.winning_quote_id && (
                        <Alert status="info">
                          <AlertIcon />
                          <Box>
                            <Text fontSize="sm">
                              Se transferirán automáticamente {selectedTransition.available_quotes?.find(q => q.id.toString() === awardData.winning_quote_id)?.line_items_count || 0} items 
                              de la cotización seleccionada al módulo de seguimiento de costos.
                            </Text>
                          </Box>
                        </Alert>
                      )}
                    </VStack>
                  )}

                  {/* Start Construction Form */}
                  {selectedTransition.action === 'start_construction' && (
                    <VStack spacing={4} align="stretch">
                      <Alert status="info">
                        <AlertIcon />
                        Marcar el inicio de construcción activará el seguimiento detallado del proyecto.
                      </Alert>

                      <SimpleGrid columns={2} spacing={4}>
                        <FormControl isRequired>
                          <FormLabel>Fecha de Inicio</FormLabel>
                          <Input
                            type="date"
                            value={constructionData.start_date}
                            onChange={(e) => setConstructionData({...constructionData, start_date: e.target.value})}
                          />
                        </FormControl>

                        <FormControl>
                          <FormLabel>Fecha Estimada de Terminación</FormLabel>
                          <Input
                            type="date"
                            value={constructionData.estimated_completion_date}
                            onChange={(e) => setConstructionData({...constructionData, estimated_completion_date: e.target.value})}
                          />
                        </FormControl>
                      </SimpleGrid>
                    </VStack>
                  )}
                </VStack>
              )}
            </VStack>
          )}
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            {selectedTransition && (
              <Button
                colorScheme={selectedTransition.color}
                onClick={handleTransitionSubmit}
                isLoading={submitting}
                loadingText="Procesando..."
              >
                {selectedTransition.action === 'award_project' && 'Marcar como Ganado'}
                {selectedTransition.action === 'start_construction' && 'Iniciar Construcción'}
                {selectedTransition.action === 'complete_project' && 'Completar Proyecto'}
                {selectedTransition.action === 'reject_project' && 'Marcar como No Ganado'}
              </Button>
            )}
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ProjectTransitionModal; 