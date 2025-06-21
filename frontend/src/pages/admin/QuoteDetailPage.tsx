import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  VStack,
  HStack,
  Text,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  useToast,
  Spinner,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Flex,
  Spacer,
  IconButton,
  Divider,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Alert,
  AlertIcon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Editable,
  EditableInput,
  EditablePreview,
  useEditableControls,
  ButtonGroup,
  Tooltip,
  Progress
} from '@chakra-ui/react';
import { 
  FaArrowLeft, 
  FaEdit, 
  FaPlus, 
  FaTrash,
  FaSave,
  FaCalculator,
  FaFileDownload,
  FaPrint,
  FaCheck,
  FaTimes,
  FaCopy,
  FaMoneyBillWave,
  FaTools,
  FaHardHat,
  FaTruck,
  FaHandshake
} from 'react-icons/fa';
import { useParams, useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Types
interface ConstructionQuote {
  id: number;
  construction_project_id: number;
  quote_name: string;
  description?: string;
  status: string;
  version: number;
  total_material_costs: number;
  total_labor_costs: number;
  total_equipment_costs: number;
  total_subcontract_costs: number;
  total_direct_costs: number;
  overhead_percentage: number;
  overhead_amount: number;
  profit_margin_percentage: number;
  profit_margin_amount: number;
  contingency_percentage: number;
  contingency_amount: number;
  subtotal: number;
  itbms_percentage: number;
  itbms_amount: number;
  total_quote_amount: number;
  created_at: string;
  updated_at: string;
}

interface QuoteLineItem {
  id: number;
  construction_quote_id: number;
  cost_item_id?: number;
  assembly_id?: number;
  line_number: number;
  item_description: string;
  unit_of_measure: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  material_cost: number;
  labor_cost: number;
  equipment_cost: number;
  subcontract_cost: number;
  notes?: string;
}

interface ProjectInfo {
  id: number;
  project_name: string;
  client_name: string;
  total_area_m2?: number;
  location?: string;
  location_cost_factor: number;
  complexity_factor: number;
}

const QuoteDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [quote, setQuote] = useState<ConstructionQuote | null>(null);
  const [project, setProject] = useState<ProjectInfo | null>(null);
  const [lineItems, setLineItems] = useState<QuoteLineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [calculating, setCalculating] = useState(false);
  
  const { 
    isOpen: isAddItemOpen, 
    onOpen: onAddItemOpen, 
    onClose: onAddItemClose 
  } = useDisclosure();

  const { 
    isOpen: isEditItemOpen, 
    onOpen: onEditItemOpen, 
    onClose: onEditItemClose 
  } = useDisclosure();

  const [newLineItem, setNewLineItem] = useState({
    description: '',
    unit: 'UN',
    quantity: '1',
    unit_cost: '0',
    notes: '',
    item_type: 'MATERIAL'
  });

  const [editingLineItem, setEditingLineItem] = useState<QuoteLineItem | null>(null);
  const [editLineItem, setEditLineItem] = useState({
    description: '',
    unit: 'UN',
    quantity: '1',
    unit_cost: '0',
    notes: '',
    item_type: 'MATERIAL'
  });

  useEffect(() => {
    if (id) {
      fetchQuote();
      fetchLineItems();
    }
  }, [id]);

  const fetchQuote = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/construction-quotes/quotes/${id}`);
      if (response.ok) {
        const quoteData = await response.json();
        setQuote(quoteData);
        
        // Fetch project info
        const projectResponse = await fetch(`${API_BASE_URL}/api/construction-quotes/projects/${quoteData.construction_project_id}`);
        if (projectResponse.ok) {
          const projectData = await projectResponse.json();
          setProject(projectData);
        }
      } else {
        throw new Error('Failed to fetch quote');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cargar la cotización',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      navigate('/admin/construction-projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchLineItems = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/construction-quotes/quotes/${id}/line-items`);
      if (response.ok) {
        const data = await response.json();
        setLineItems(data);
      }
    } catch (error) {
      console.error('Error fetching line items:', error);
    }
  };

  const saveQuote = async () => {
    if (!quote) return;

    try {
      setSaving(true);
      const response = await fetch(`${API_BASE_URL}/api/construction-quotes/quotes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quote),
      });

      if (response.ok) {
        toast({
          title: 'Éxito',
          description: 'Cotización guardada exitosamente',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        fetchQuote(); // Refresh data
      } else {
        throw new Error('Failed to save quote');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo guardar la cotización',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const calculateCosts = async () => {
    if (!quote) return;

    try {
      setCalculating(true);
      const response = await fetch(`${API_BASE_URL}/api/construction-quotes/quotes/${id}/calculate`, {
        method: 'POST',
      });

      if (response.ok) {
        const updatedQuote = await response.json();
        setQuote(updatedQuote);
        toast({
          title: 'Éxito',
          description: 'Costos calculados exitosamente',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error('Failed to calculate costs');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron calcular los costos',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setCalculating(false);
    }
  };

  const addLineItem = async () => {
    if (!newLineItem.description.trim()) {
      toast({
        title: 'Error',
        description: 'La descripción es requerida',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/construction-quotes/line-items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newLineItem,
          construction_quote_id: parseInt(id!),
          item_description: newLineItem.description,
          unit_of_measure: newLineItem.unit,
          quantity: parseFloat(newLineItem.quantity),
          unit_cost: parseFloat(newLineItem.unit_cost),
          item_type: newLineItem.item_type
        }),
      });

      if (response.ok) {
        toast({
          title: 'Éxito',
          description: 'Partida agregada exitosamente',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        fetchLineItems();
        calculateCosts(); // Recalculate after adding item
        onAddItemClose();
        setNewLineItem({
          description: '',
          unit: 'UN',
          quantity: '1',
          unit_cost: '0',
          notes: '',
          item_type: 'MATERIAL'
        });
      } else {
        throw new Error('Failed to add line item');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo agregar la partida',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const deleteLineItem = async (itemId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/construction-quotes/line-items/${itemId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Éxito',
          description: 'Partida eliminada exitosamente',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        fetchLineItems();
        calculateCosts(); // Recalculate after deletion
      } else {
        throw new Error('Failed to delete line item');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la partida',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const openEditLineItem = (item: QuoteLineItem) => {
    setEditingLineItem(item);
    
    // Determine current item type based on cost breakdown
    let currentType = 'MATERIAL';
    if (item.labor_cost > 0) currentType = 'LABOR';
    else if (item.equipment_cost > 0) currentType = 'EQUIPMENT';
    else if (item.subcontract_cost > 0) currentType = 'SUBCONTRACT';
    
    setEditLineItem({
      description: item.item_description,
      unit: item.unit_of_measure,
      quantity: item.quantity.toString(),
      unit_cost: item.unit_cost.toString(),
      notes: item.notes || '',
      item_type: currentType
    });
    onEditItemOpen();
  };

  const updateLineItem = async () => {
    if (!editingLineItem || !editLineItem.description.trim()) {
      toast({
        title: 'Error',
        description: 'La descripción es requerida',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/construction-quotes/line-items/${editingLineItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          item_description: editLineItem.description,
          unit_of_measure: editLineItem.unit,
          quantity: parseFloat(editLineItem.quantity),
          unit_cost: parseFloat(editLineItem.unit_cost),
          notes: editLineItem.notes,
          item_type: editLineItem.item_type
        }),
      });

      if (response.ok) {
        toast({
          title: 'Éxito',
          description: 'Partida actualizada exitosamente',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        fetchLineItems();
        calculateCosts(); // Recalculate after updating
        onEditItemClose();
        setEditingLineItem(null);
      } else {
        throw new Error('Failed to update line item');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la partida',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const updateQuoteField = (field: keyof ConstructionQuote, value: any) => {
    if (!quote) return;
    setQuote(prev => prev ? { ...prev, [field]: value } : null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'gray';
      case 'PENDING': return 'yellow';
      case 'APPROVED': return 'green';
      case 'REJECTED': return 'red';
      case 'REVISION': return 'orange';
      default: return 'gray';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'Borrador';
      case 'PENDING': return 'Pendiente';
      case 'APPROVED': return 'Aprobada';
      case 'REJECTED': return 'Rechazada';
      case 'REVISION': return 'En Revisión';
      default: return status;
    }
  };

  const getCostTypeIcon = (item: QuoteLineItem) => {
    if (item.material_cost > 0) return <FaTools color="#3182CE" />;
    if (item.labor_cost > 0) return <FaHardHat color="#38A169" />;
    if (item.equipment_cost > 0) return <FaTruck color="#D69E2E" />;
    if (item.subcontract_cost > 0) return <FaHandshake color="#805AD5" />;
    return <FaMoneyBillWave />;
  };

  const getCostTypeColor = (item: QuoteLineItem) => {
    if (item.material_cost > 0) return 'blue';
    if (item.labor_cost > 0) return 'green';
    if (item.equipment_cost > 0) return 'yellow';
    if (item.subcontract_cost > 0) return 'purple';
    return 'gray';
  };

  const getCostTypeText = (item: QuoteLineItem) => {
    if (item.material_cost > 0) return 'MATERIAL';
    if (item.labor_cost > 0) return 'LABOR';
    if (item.equipment_cost > 0) return 'EQUIPMENT';
    if (item.subcontract_cost > 0) return 'SUBCONTRACT';
    return 'MIXED';
  };

  const formatCurrency = (amount?: number) => {
    return new Intl.NumberFormat('es-PA', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString?: string) => {
    return dateString ? new Date(dateString).toLocaleDateString('es-ES') : '-';
  };

  // Editable Controls Component
  function EditableControls() {
    const {
      isEditing,
      getSubmitButtonProps,
      getCancelButtonProps,
      getEditButtonProps,
    } = useEditableControls();

    return isEditing ? (
      <ButtonGroup justifyContent="center" size="sm">
        <IconButton aria-label="Save" icon={<FaCheck />} {...getSubmitButtonProps()} />
        <IconButton aria-label="Cancel" icon={<FaTimes />} {...getCancelButtonProps()} />
      </ButtonGroup>
    ) : (
      <Flex justifyContent="center">
        <IconButton size="sm" aria-label="Edit" icon={<FaEdit />} {...getEditButtonProps()} />
      </Flex>
    );
  }

  if (loading) {
    return (
      <Flex justify="center" align="center" h="50vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (!quote || !project) {
    return (
      <Box p={6}>
        <Alert status="error">
          <AlertIcon />
          Cotización no encontrada
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={6}>
      {/* Header */}
      <HStack mb={6} spacing={4}>
        <IconButton
          icon={<FaArrowLeft />}
          aria-label="Volver"
          onClick={() => navigate(`/admin/construction-projects/${project.id}`)}
        />
        <VStack align="start" spacing={1} flex={1}>
          <HStack spacing={3}>
            <Editable
              value={quote.quote_name}
              onSubmit={(value) => updateQuoteField('quote_name', value)}
              fontSize="xl"
              fontWeight="bold"
            >
              <EditablePreview />
              <EditableInput />
              <EditableControls />
            </Editable>
            <Badge colorScheme={getStatusColor(quote.status)} size="lg">
              {getStatusText(quote.status)}
            </Badge>
            <Badge variant="outline">v{quote.version}</Badge>
          </HStack>
          <Text color="gray.600">
            {project.project_name} • {project.client_name}
          </Text>
        </VStack>
        <HStack spacing={2}>
          <Button
            leftIcon={<FaCalculator />}
            colorScheme="green"
            onClick={calculateCosts}
            isLoading={calculating}
            loadingText="Calculando..."
          >
            Recalcular
          </Button>
          <Button
            leftIcon={<FaSave />}
            colorScheme="blue"
            onClick={saveQuote}
            isLoading={saving}
            loadingText="Guardando..."
          >
            Guardar
          </Button>
          <Button
            leftIcon={<FaFileDownload />}
            variant="outline"
            onClick={() => {/* TODO: Export functionality */}}
          >
            Exportar
          </Button>
        </HStack>
      </HStack>

      {/* Cost Summary Cards */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 5 }} spacing={4} mb={8}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>
                <HStack>
                  <FaTools color="#3182CE" />
                  <Text>Materiales</Text>
                </HStack>
              </StatLabel>
              <StatNumber fontSize="lg" color="blue.600">
                {formatCurrency(quote.total_material_costs)}
              </StatNumber>
              <StatHelpText>
                {quote.total_direct_costs > 0 ? 
                  `${((quote.total_material_costs / quote.total_direct_costs) * 100).toFixed(1)}%` : 
                  '0%'
                }
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>
                <HStack>
                  <FaHardHat color="#38A169" />
                  <Text>Mano de Obra</Text>
                </HStack>
              </StatLabel>
              <StatNumber fontSize="lg" color="green.600">
                {formatCurrency(quote.total_labor_costs)}
              </StatNumber>
              <StatHelpText>
                {quote.total_direct_costs > 0 ? 
                  `${((quote.total_labor_costs / quote.total_direct_costs) * 100).toFixed(1)}%` : 
                  '0%'
                }
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>
                <HStack>
                  <FaTruck color="#D69E2E" />
                  <Text>Equipos</Text>
                </HStack>
              </StatLabel>
              <StatNumber fontSize="lg" color="yellow.600">
                {formatCurrency(quote.total_equipment_costs)}
              </StatNumber>
              <StatHelpText>
                {quote.total_direct_costs > 0 ? 
                  `${((quote.total_equipment_costs / quote.total_direct_costs) * 100).toFixed(1)}%` : 
                  '0%'
                }
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>
                <HStack>
                  <FaHandshake color="#805AD5" />
                  <Text>Subcontratos</Text>
                </HStack>
              </StatLabel>
              <StatNumber fontSize="lg" color="purple.600">
                {formatCurrency(quote.total_subcontract_costs)}
              </StatNumber>
              <StatHelpText>
                {quote.total_direct_costs > 0 ? 
                  `${((quote.total_subcontract_costs / quote.total_direct_costs) * 100).toFixed(1)}%` : 
                  '0%'
                }
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg="blue.50" border="2px solid" borderColor="blue.200">
          <CardBody>
            <Stat>
              <StatLabel>
                <HStack>
                  <FaMoneyBillWave color="#3182CE" />
                  <Text fontWeight="bold">Total</Text>
                </HStack>
              </StatLabel>
              <StatNumber fontSize="xl" fontWeight="bold" color="blue.700">
                {formatCurrency(quote.total_quote_amount)}
              </StatNumber>
              <StatHelpText>
                {project.total_area_m2 && quote.cost_per_m2 ? 
                  `${formatCurrency(quote.cost_per_m2)}/m²` : 
                  'Precio final'
                }
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Main Content Tabs */}
      <Tabs>
        <TabList>
          <Tab>Partidas ({lineItems.length})</Tab>
          <Tab>Cálculos</Tab>
          <Tab>Configuración</Tab>
        </TabList>

        <TabPanels>
          {/* Line Items Tab */}
          <TabPanel px={0}>
            <VStack spacing={6} align="stretch">
              <Flex justify="space-between" align="center">
                <Heading size="md">Partidas de la Cotización</Heading>
                <Button
                  leftIcon={<FaPlus />}
                  colorScheme="blue"
                  onClick={onAddItemOpen}
                >
                  Agregar Partida
                </Button>
              </Flex>

              {lineItems.length === 0 ? (
                <Card>
                  <CardBody>
                    <Text textAlign="center" py={8} color="gray.500">
                      No hay partidas en esta cotización.
                      ¡Agrega tu primera partida para comenzar!
                    </Text>
                  </CardBody>
                </Card>
              ) : (
                <Card>
                  <CardBody p={0}>
                    <TableContainer>
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th>Tipo</Th>
                            <Th>Descripción</Th>
                            <Th>Unidad</Th>
                            <Th isNumeric>Cantidad</Th>
                            <Th isNumeric>Precio Unit.</Th>
                            <Th isNumeric>Total</Th>
                            <Th>Acciones</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {lineItems.map((item) => (
                            <Tr key={item.id}>
                              <Td>
                                <HStack spacing={2}>
                                  {getCostTypeIcon(item)}
                                  <Badge 
                                    colorScheme={getCostTypeColor(item)}
                                    size="sm"
                                  >
                                    {getCostTypeText(item)}
                                  </Badge>
                                </HStack>
                              </Td>
                              <Td>
                                <VStack align="start" spacing={1}>
                                  <Text fontWeight="medium">{item.item_description}</Text>
                                  {item.notes && (
                                    <Text fontSize="xs" color="gray.500">
                                      {item.notes}
                                    </Text>
                                  )}
                                </VStack>
                              </Td>
                              <Td>{item.unit_of_measure}</Td>
                              <Td isNumeric>{item.quantity.toLocaleString()}</Td>
                              <Td isNumeric>{formatCurrency(item.unit_cost)}</Td>
                              <Td isNumeric fontWeight="bold">
                                {formatCurrency(item.total_cost)}
                              </Td>
                              <Td>
                                <HStack spacing={1}>
                                  <IconButton
                                    icon={<FaEdit />}
                                    aria-label="Editar partida"
                                    size="sm"
                                    variant="ghost"
                                    colorScheme="blue"
                                    onClick={() => openEditLineItem(item)}
                                  />
                                  <IconButton
                                    icon={<FaTrash />}
                                    aria-label="Eliminar partida"
                                    size="sm"
                                    variant="ghost"
                                    colorScheme="red"
                                    onClick={() => deleteLineItem(item.id)}
                                  />
                                </HStack>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </TableContainer>
                  </CardBody>
                </Card>
              )}
            </VStack>
          </TabPanel>

          {/* Calculations Tab */}
          <TabPanel px={0}>
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
              <Card>
                <CardHeader>
                  <Heading size="md">Costos Directos</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={3} align="stretch">
                    <HStack justify="space-between">
                      <Text>Materiales:</Text>
                      <Text fontWeight="bold">{formatCurrency(quote.total_material_costs)}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text>Mano de Obra:</Text>
                      <Text fontWeight="bold">{formatCurrency(quote.total_labor_costs)}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text>Equipos:</Text>
                      <Text fontWeight="bold">{formatCurrency(quote.total_equipment_costs)}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text>Subcontratos:</Text>
                      <Text fontWeight="bold">{formatCurrency(quote.total_subcontract_costs)}</Text>
                    </HStack>
                    <Divider />
                    <HStack justify="space-between">
                      <Text fontWeight="bold">Total Costos Directos:</Text>
                      <Text fontWeight="bold" fontSize="lg">
                        {formatCurrency(quote.total_direct_costs)}
                      </Text>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <Heading size="md">Costos Indirectos</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={3} align="stretch">
                    <HStack justify="space-between">
                      <Text>Gastos Generales ({quote.overhead_percentage}%):</Text>
                      <Text fontWeight="bold">{formatCurrency(quote.overhead_amount)}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text>Utilidad ({quote.profit_margin_percentage}%):</Text>
                      <Text fontWeight="bold">{formatCurrency(quote.profit_margin_amount)}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text>Contingencia ({quote.contingency_percentage}%):</Text>
                      <Text fontWeight="bold">{formatCurrency(quote.contingency_amount)}</Text>
                    </HStack>
                    <Divider />
                    <HStack justify="space-between">
                      <Text>Subtotal antes de impuesto:</Text>
                      <Text fontWeight="bold">{formatCurrency(quote.subtotal)}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text>ITBMS ({quote.itbms_percentage}%):</Text>
                      <Text fontWeight="bold">{formatCurrency(quote.itbms_amount)}</Text>
                    </HStack>
                    <Divider />
                    <HStack justify="space-between">
                      <Text fontWeight="bold" fontSize="lg">Total Final:</Text>
                      <Text fontWeight="bold" fontSize="lg" color="blue.600">
                        {formatCurrency(quote.total_quote_amount)}
                      </Text>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            </SimpleGrid>
          </TabPanel>

          {/* Configuration Tab */}
          <TabPanel px={0}>
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
              <Card>
                <CardHeader>
                  <Heading size="md">Información de la Cotización</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <FormControl>
                      <FormLabel>Nombre de la Cotización</FormLabel>
                      <Input
                        value={quote.quote_name}
                        onChange={(e) => updateQuoteField('quote_name', e.target.value)}
                      />
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Descripción</FormLabel>
                      <Textarea
                        value={quote.description || ''}
                        onChange={(e) => updateQuoteField('description', e.target.value)}
                        placeholder="Descripción de la cotización (opcional)"
                      />
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Estado</FormLabel>
                      <Select
                        value={quote.status}
                        onChange={(e) => updateQuoteField('status', e.target.value)}
                      >
                        <option value="DRAFT">Borrador</option>
                        <option value="PENDING">Pendiente</option>
                        <option value="APPROVED">Aprobada</option>
                        <option value="REJECTED">Rechazada</option>
                        <option value="REVISION">En Revisión</option>
                      </Select>
                    </FormControl>
                  </VStack>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <Heading size="md">Porcentajes de Cálculo</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <FormControl>
                      <FormLabel>Gastos Generales (%)</FormLabel>
                      <NumberInput
                        value={quote.overhead_percentage}
                        onChange={(_, value) => updateQuoteField('overhead_percentage', value)}
                        min={0}
                        max={100}
                        precision={2}
                        step={0.5}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Utilidad (%)</FormLabel>
                      <NumberInput
                        value={quote.profit_margin_percentage}
                        onChange={(_, value) => updateQuoteField('profit_margin_percentage', value)}
                        min={0}
                        max={100}
                        precision={2}
                        step={0.5}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Contingencia (%)</FormLabel>
                      <NumberInput
                        value={quote.contingency_percentage}
                        onChange={(_, value) => updateQuoteField('contingency_percentage', value)}
                        min={0}
                        max={100}
                        precision={2}
                        step={0.5}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>

                    <FormControl>
                      <FormLabel>ITBMS (%)</FormLabel>
                      <NumberInput
                        value={quote.itbms_percentage}
                        onChange={(_, value) => updateQuoteField('itbms_percentage', value)}
                        min={0}
                        max={100}
                        precision={2}
                        step={0.5}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>
                  </VStack>
                </CardBody>
              </Card>
            </SimpleGrid>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Add Line Item Modal */}
      <Modal isOpen={isAddItemOpen} onClose={onAddItemClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Agregar Nueva Partida</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>

              <FormControl isRequired>
                <FormLabel>Descripción</FormLabel>
                <Input
                  value={newLineItem.description}
                  onChange={(e) => setNewLineItem(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción de la partida"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Tipo</FormLabel>
                <Select
                  value={newLineItem.item_type}
                  onChange={(e) => setNewLineItem(prev => ({ ...prev, item_type: e.target.value }))}
                >
                  <option value="MATERIAL">🔧 Material</option>
                  <option value="LABOR">👷 Mano de Obra</option>
                  <option value="EQUIPMENT">🚛 Equipos</option>
                  <option value="SUBCONTRACT">🤝 Subcontrato</option>
                </Select>
              </FormControl>

              <SimpleGrid columns={3} spacing={4} w="full">
                <FormControl isRequired>
                  <FormLabel>Unidad</FormLabel>
                  <Select
                    value={newLineItem.unit}
                    onChange={(e) => setNewLineItem(prev => ({ ...prev, unit: e.target.value }))}
                  >
                    <option value="UN">Unidad</option>
                    <option value="M2">Metro Cuadrado</option>
                    <option value="M3">Metro Cúbico</option>
                    <option value="ML">Metro Lineal</option>
                    <option value="KG">Kilogramo</option>
                    <option value="TON">Tonelada</option>
                    <option value="GL">Global</option>
                    <option value="DIA">Día</option>
                    <option value="HR">Hora</option>
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Cantidad</FormLabel>
                  <NumberInput
                    value={newLineItem.quantity}
                    onChange={(value) => setNewLineItem(prev => ({ ...prev, quantity: value }))}
                    min={0}
                    precision={2}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Precio Unitario</FormLabel>
                  <NumberInput
                    value={newLineItem.unit_cost}
                    onChange={(value) => setNewLineItem(prev => ({ ...prev, unit_cost: value }))}
                    min={0}
                    precision={2}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
              </SimpleGrid>

              <FormControl>
                <FormLabel>Notas</FormLabel>
                <Textarea
                  value={newLineItem.notes}
                  onChange={(e) => setNewLineItem(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Notas adicionales (opcional)"
                />
              </FormControl>

              <Box w="full" p={4} bg="gray.50" borderRadius="md">
                <HStack justify="space-between">
                  <Text fontWeight="bold">Total:</Text>
                  <Text fontWeight="bold" fontSize="lg">
                    {formatCurrency(parseFloat(newLineItem.quantity) * parseFloat(newLineItem.unit_cost))}
                  </Text>
                </HStack>
              </Box>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onAddItemClose}>
              Cancelar
            </Button>
            <Button colorScheme="blue" onClick={addLineItem}>
              Agregar Partida
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Line Item Modal */}
      <Modal isOpen={isEditItemOpen} onClose={onEditItemClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Editar Partida</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Descripción</FormLabel>
                <Input
                  value={editLineItem.description}
                  onChange={(e) => setEditLineItem(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción de la partida"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Tipo</FormLabel>
                <Select
                  value={editLineItem.item_type}
                  onChange={(e) => setEditLineItem(prev => ({ ...prev, item_type: e.target.value }))}
                >
                  <option value="MATERIAL">🔧 Material</option>
                  <option value="LABOR">👷 Mano de Obra</option>
                  <option value="EQUIPMENT">🚛 Equipos</option>
                  <option value="SUBCONTRACT">🤝 Subcontrato</option>
                </Select>
              </FormControl>

              <SimpleGrid columns={3} spacing={4} w="full">
                <FormControl isRequired>
                  <FormLabel>Unidad</FormLabel>
                  <Select
                    value={editLineItem.unit}
                    onChange={(e) => setEditLineItem(prev => ({ ...prev, unit: e.target.value }))}
                  >
                    <option value="UN">Unidad</option>
                    <option value="M2">Metro Cuadrado</option>
                    <option value="M3">Metro Cúbico</option>
                    <option value="ML">Metro Lineal</option>
                    <option value="KG">Kilogramo</option>
                    <option value="TON">Tonelada</option>
                    <option value="GL">Global</option>
                    <option value="DIA">Día</option>
                    <option value="HR">Hora</option>
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Cantidad</FormLabel>
                  <NumberInput
                    value={editLineItem.quantity}
                    onChange={(value) => setEditLineItem(prev => ({ ...prev, quantity: value }))}
                    min={0}
                    precision={2}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Precio Unitario</FormLabel>
                  <NumberInput
                    value={editLineItem.unit_cost}
                    onChange={(value) => setEditLineItem(prev => ({ ...prev, unit_cost: value }))}
                    min={0}
                    precision={2}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
              </SimpleGrid>

              <FormControl>
                <FormLabel>Notas</FormLabel>
                <Textarea
                  value={editLineItem.notes}
                  onChange={(e) => setEditLineItem(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Notas adicionales (opcional)"
                />
              </FormControl>

              <Box w="full" p={4} bg="gray.50" borderRadius="md">
                <HStack justify="space-between">
                  <Text fontWeight="bold">Total:</Text>
                  <Text fontWeight="bold" fontSize="lg">
                    {formatCurrency(parseFloat(editLineItem.quantity) * parseFloat(editLineItem.unit_cost))}
                  </Text>
                </HStack>
              </Box>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEditItemClose}>
              Cancelar
            </Button>
            <Button colorScheme="blue" onClick={updateLineItem}>
              Actualizar Partida
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default QuoteDetailPage; 