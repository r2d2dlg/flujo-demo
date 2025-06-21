import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  CardBody,
  Badge,
  SimpleGrid,
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
  Select,
  Textarea,
  useToast,
  Spinner,
  IconButton,
  Tooltip,
  Divider,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { FaPlus, FaEye, FaCopy, FaEdit, FaBuilding, FaHome, FaIndustry, FaCog, FaPaintBrush } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface QuoteTemplate {
  id: number;
  template_name: string;
  project_type: string;
  template_sections: Record<string, any>;
  default_assemblies?: Record<string, any>;
  default_overhead: number;
  default_profit: number;
  default_contingency: number;
  usage_count: number;
  is_active: boolean;
  is_system_template: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

interface ConstructionAssembly {
  id: number;
  assembly_code: string;
  assembly_name: string;
  description?: string;
  assembly_type: string;
  system_category: string;
  unit_of_measure: string;
  parameters_schema?: Record<string, any>;
  default_parameters?: Record<string, any>;
  usage_count: number;
  last_used?: string;
  is_active: boolean;
  is_parametric: boolean;
  is_custom: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  components?: AssemblyComponent[];
}

interface AssemblyComponent {
  id: number;
  assembly_id: number;
  cost_item_id: number;
  quantity_formula: string;
  base_quantity?: number;
  waste_factor_override?: number;
  productivity_factor: number;
  parameter_dependencies?: Record<string, any>;
  is_optional: boolean;
  sequence_order: number;
  cost_item?: CostItem;
}

interface CostItem {
  id: number;
  item_code: string;
  description: string;
  item_type: string;
  category: string;
  subcategory?: string;
  unit_of_measure: string;
  base_cost: number;
  currency: string;
  waste_factor: number;
  labor_factor?: number;
  preferred_supplier?: string;
  supplier_contact?: string;
  is_active: boolean;
  is_custom: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

const QuoteTemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<QuoteTemplate[]>([]);
  const [assemblies, setAssemblies] = useState<ConstructionAssembly[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<QuoteTemplate | null>(null);
  const [selectedAssembly, setSelectedAssembly] = useState<ConstructionAssembly | null>(null);
  const [projectTypeFilter, setProjectTypeFilter] = useState<string>('');
  const [assemblyTypeFilter, setAssemblyTypeFilter] = useState<string>('');
  
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isViewAssemblyOpen, onOpen: onViewAssemblyOpen, onClose: onViewAssemblyClose } = useDisclosure();
  const { isOpen: isCreateAssemblyOpen, onOpen: onCreateAssemblyOpen, onClose: onCreateAssemblyClose } = useDisclosure();
  
  const toast = useToast();

  const [newTemplate, setNewTemplate] = useState({
    template_name: '',
    project_type: 'RESIDENTIAL',
    description: '',
    default_overhead: 15.00,
    default_profit: 10.00,
    default_contingency: 5.00
  });

  useEffect(() => {
    fetchTemplates();
    fetchAssemblies();
  }, [projectTypeFilter, assemblyTypeFilter]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (projectTypeFilter) params.append('project_type', projectTypeFilter);
      
      const response = await fetch(`${API_BASE_URL}/api/construction-quotes/templates?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las plantillas',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAssemblies = async () => {
    try {
      const params = new URLSearchParams();
      if (assemblyTypeFilter) params.append('assembly_type', assemblyTypeFilter);
      
      const response = await fetch(`${API_BASE_URL}/api/construction-quotes/assemblies?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAssemblies(data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los ensamblajes',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const getProjectTypeIcon = (type: string) => {
    switch (type) {
      case 'RESIDENTIAL': return <FaHome color="#4299E1" />;
      case 'COMMERCIAL': return <FaBuilding color="#38A169" />;
      case 'INDUSTRIAL': return <FaIndustry color="#D53F8C" />;
      default: return <FaBuilding color="#718096" />;
    }
  };

  const getProjectTypeColor = (type: string) => {
    switch (type) {
      case 'RESIDENTIAL': return 'blue';
      case 'COMMERCIAL': return 'green';
      case 'INDUSTRIAL': return 'purple';
      case 'INSTITUTIONAL': return 'orange';
      case 'INFRASTRUCTURE': return 'red';
      default: return 'gray';
    }
  };

  const getProjectTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'RESIDENTIAL': 'Residencial',
      'COMMERCIAL': 'Comercial',
      'INDUSTRIAL': 'Industrial',
      'INSTITUTIONAL': 'Institucional',
      'INFRASTRUCTURE': 'Infraestructura'
    };
    return labels[type] || type;
  };

  const getAssemblyTypeIcon = (type: string) => {
    switch (type) {
      case 'STRUCTURAL': return <FaBuilding color="#4299E1" />;
      case 'ARCHITECTURAL': return <FaHome color="#38A169" />;
      case 'MEP': return <FaCog color="#D53F8C" />;
      case 'FINISHES': return <FaPaintBrush color="#ED8936" />;
      default: return <FaCog color="#718096" />;
    }
  };

  const getAssemblyTypeColor = (type: string) => {
    switch (type) {
      case 'STRUCTURAL': return 'blue';
      case 'ARCHITECTURAL': return 'green';
      case 'MEP': return 'purple';
      case 'FINISHES': return 'orange';
      default: return 'gray';
    }
  };

  const getAssemblyTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'STRUCTURAL': 'Estructural',
      'ARCHITECTURAL': 'Arquitectónico',
      'MEP': 'MEP',
      'FINISHES': 'Acabados'
    };
    return labels[type] || type;
  };

  const viewTemplate = (template: QuoteTemplate) => {
    setSelectedTemplate(template);
    onViewOpen();
  };

  const viewAssembly = (assembly: ConstructionAssembly) => {
    setSelectedAssembly(assembly);
    onViewAssemblyOpen();
  };

  const calculateTemplateTotal = (template: QuoteTemplate) => {
    let total = 0;
    
    Object.values(template.template_sections).forEach((section: any) => {
      if (section.items) {
        section.items.forEach((item: any) => {
          total += (item.quantity || 0) * (item.unit_cost || 0);
        });
      }
    });

    // Apply overhead, profit, contingency
    const overhead = total * (template.default_overhead / 100);
    const profit = (total + overhead) * (template.default_profit / 100);
    const contingency = (total + overhead + profit) * (template.default_contingency / 100);
    
    return total + overhead + profit + contingency;
  };

  const filteredTemplates = templates.filter(template => 
    !projectTypeFilter || template.project_type === projectTypeFilter
  );

  const filteredAssemblies = assemblies.filter(assembly => 
    !assemblyTypeFilter || assembly.assembly_type === assemblyTypeFilter
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <VStack>
          <Spinner size="xl" color="blue.500" />
          <Text>Cargando plantillas...</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <VStack align="start" spacing={1}>
          <Heading size="lg">Plantillas & Eficiencia</Heading>
          <Text color="gray.600">
            Gestiona plantillas y ensamblajes para cotizaciones más rápidas y consistentes
          </Text>
        </VStack>

        <Tabs colorScheme="blue">
          <TabList>
            <Tab>Plantillas de Cotización</Tab>
            <Tab>Ensamblajes</Tab>
          </TabList>

          <TabPanels>
            <TabPanel px={0}>
              <VStack spacing={6} align="stretch">
                {/* Templates Header */}
                <HStack justify="space-between" align="center">
                  <Text fontSize="lg" fontWeight="medium">
                    Plantillas Disponibles ({filteredTemplates.length})
                  </Text>
                  <Button
                    leftIcon={<FaPlus />}
                    colorScheme="blue"
                    onClick={onCreateOpen}
                  >
                    Nueva Plantilla
                  </Button>
                </HStack>

        {/* Filters */}
        <HStack spacing={4}>
          <FormControl maxW="250px">
            <FormLabel fontSize="sm">Filtrar por tipo:</FormLabel>
            <Select
              value={projectTypeFilter}
              onChange={(e) => setProjectTypeFilter(e.target.value)}
              placeholder="Todos los tipos"
            >
              <option value="RESIDENTIAL">Residencial</option>
              <option value="COMMERCIAL">Comercial</option>
              <option value="INDUSTRIAL">Industrial</option>
              <option value="INSTITUTIONAL">Institucional</option>
              <option value="INFRASTRUCTURE">Infraestructura</option>
            </Select>
          </FormControl>
        </HStack>

        {/* Templates Grid */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {filteredTemplates.map((template) => (
            <Card key={template.id} shadow="md" _hover={{ shadow: 'lg' }} transition="all 0.2s">
              <CardBody>
                <VStack align="start" spacing={4}>
                  <HStack justify="space-between" w="full">
                    <HStack>
                      {getProjectTypeIcon(template.project_type)}
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="bold" fontSize="lg">
                          {template.template_name}
                        </Text>
                        <Badge colorScheme={getProjectTypeColor(template.project_type)}>
                          {getProjectTypeLabel(template.project_type)}
                        </Badge>
                      </VStack>
                    </HStack>
                    {template.is_system_template && (
                      <Badge colorScheme="gray" variant="outline">
                        Sistema
                      </Badge>
                    )}
                  </HStack>

                  <VStack align="start" spacing={2} w="full">
                    <HStack justify="space-between" w="full">
                      <Text fontSize="sm" color="gray.600">Secciones:</Text>
                      <Text fontSize="sm" fontWeight="medium">
                        {Object.keys(template.template_sections).length}
                      </Text>
                    </HStack>
                    <HStack justify="space-between" w="full">
                      <Text fontSize="sm" color="gray.600">Usado:</Text>
                      <Text fontSize="sm" fontWeight="medium">
                        {template.usage_count} veces
                      </Text>
                    </HStack>
                    <HStack justify="space-between" w="full">
                      <Text fontSize="sm" color="gray.600">Total estimado:</Text>
                      <Text fontSize="sm" fontWeight="bold" color="green.600">
                        ${calculateTemplateTotal(template).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </Text>
                    </HStack>
                  </VStack>

                  <Divider />

                  <HStack spacing={2} w="full">
                    <Tooltip label="Ver detalles">
                      <IconButton
                        icon={<FaEye />}
                        size="sm"
                        variant="ghost"
                        colorScheme="blue"
                        onClick={() => viewTemplate(template)}
                        aria-label="Ver plantilla"
                      />
                    </Tooltip>
                    <Tooltip label="Duplicar plantilla">
                      <IconButton
                        icon={<FaCopy />}
                        size="sm"
                        variant="ghost"
                        colorScheme="green"
                        aria-label="Duplicar plantilla"
                      />
                    </Tooltip>
                    {!template.is_system_template && (
                      <Tooltip label="Editar plantilla">
                        <IconButton
                          icon={<FaEdit />}
                          size="sm"
                          variant="ghost"
                          colorScheme="orange"
                          aria-label="Editar plantilla"
                        />
                      </Tooltip>
                    )}
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>

        {filteredTemplates.length === 0 && (
          <Box textAlign="center" py={10}>
            <Text color="gray.500" fontSize="lg">
              No se encontraron plantillas
            </Text>
            <Text color="gray.400" fontSize="sm" mt={2}>
              {projectTypeFilter 
                ? `No hay plantillas para el tipo "${getProjectTypeLabel(projectTypeFilter)}"`
                : "Crea tu primera plantilla para empezar"
              }
            </Text>
          </Box>
        )}
              </VStack>
            </TabPanel>

            {/* Assemblies Tab */}
            <TabPanel px={0}>
              <VStack spacing={6} align="stretch">
                <HStack justify="space-between" align="center">
                  <VStack align="start" spacing={1}>
                    <Text fontSize="lg" fontWeight="medium">
                      Ensamblajes Paramétricos
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      Sistemas constructivos con cálculo automático de cantidades
                    </Text>
                  </VStack>
                  <HStack spacing={3}>
                    <Select
                      placeholder="Filtrar por tipo"
                      size="sm"
                      maxW="200px"
                      value={assemblyTypeFilter}
                      onChange={(e) => setAssemblyTypeFilter(e.target.value)}
                    >
                      <option value="STRUCTURAL">Estructural</option>
                      <option value="ARCHITECTURAL">Arquitectónico</option>
                      <option value="MEP">MEP</option>
                      <option value="FINISHES">Acabados</option>
                    </Select>
                    <Button
                      leftIcon={<FaPlus />}
                      colorScheme="green"
                      onClick={onCreateAssemblyOpen}
                    >
                      Nuevo Ensamblaje
                    </Button>
                  </HStack>
                </HStack>

                {/* Assemblies Grid */}
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  {filteredAssemblies.map((assembly) => (
                    <Card key={assembly.id} cursor="pointer" _hover={{ shadow: 'md' }}>
                      <CardBody>
                        <VStack align="start" spacing={3}>
                          <HStack justify="space-between" w="full">
                            <VStack align="start" spacing={1}>
                              <HStack>
                                {getAssemblyTypeIcon(assembly.assembly_type)}
                                <Text fontWeight="bold" fontSize="md">
                                  {assembly.assembly_name}
                                </Text>
                              </HStack>
                              <Text fontSize="xs" color="gray.500">
                                {assembly.assembly_code}
                              </Text>
                            </VStack>
                            <Badge 
                              colorScheme={getAssemblyTypeColor(assembly.assembly_type)}
                              size="sm"
                            >
                              {getAssemblyTypeLabel(assembly.assembly_type)}
                            </Badge>
                          </HStack>
                          
                          <Text fontSize="sm" color="gray.600" noOfLines={2}>
                            {assembly.description}
                          </Text>
                          
                          <HStack justify="space-between" w="full">
                            <VStack align="start" spacing={0}>
                              <Text fontSize="xs" color="gray.500">Unidad</Text>
                              <Text fontSize="sm" fontWeight="medium">
                                {assembly.unit_of_measure}
                              </Text>
                            </VStack>
                            <VStack align="start" spacing={0}>
                              <Text fontSize="xs" color="gray.500">Categoría</Text>
                              <Text fontSize="sm" fontWeight="medium">
                                {assembly.system_category}
                              </Text>
                            </VStack>
                            <VStack align="end" spacing={0}>
                              <Text fontSize="xs" color="gray.500">Usos</Text>
                              <Text fontSize="sm" fontWeight="medium">
                                {assembly.usage_count}
                              </Text>
                            </VStack>
                          </HStack>

                          {assembly.is_parametric && (
                            <Badge colorScheme="purple" size="sm">
                              <HStack spacing={1}>
                                <Text>⚙️</Text>
                                <Text>Paramétrico</Text>
                              </HStack>
                            </Badge>
                          )}

                          <HStack spacing={2} w="full">
                            <Button
                              size="sm"
                              variant="outline"
                              flex={1}
                              onClick={() => viewAssembly(assembly)}
                            >
                              Ver Detalles
                            </Button>
                            <Button
                              size="sm"
                              colorScheme="blue"
                              flex={1}
                              onClick={() => {
                                toast({
                                  title: 'Ensamblaje seleccionado',
                                  description: `${assembly.assembly_name} listo para usar en cotizaciones`,
                                  status: 'success',
                                  duration: 2000,
                                  isClosable: true,
                                });
                              }}
                            >
                              Usar
                            </Button>
                          </HStack>
                        </VStack>
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>

                {filteredAssemblies.length === 0 && (
                  <Box textAlign="center" py={10}>
                    <Text color="gray.500" fontSize="lg">
                      No se encontraron ensamblajes
                    </Text>
                    <Text color="gray.400" fontSize="sm" mt={2}>
                      {assemblyTypeFilter 
                        ? `No hay ensamblajes del tipo "${getAssemblyTypeLabel(assemblyTypeFilter)}"`
                        : "Crea tu primer ensamblaje para empezar"
                      }
                    </Text>
                  </Box>
                )}
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>

        {/* View Template Modal */}
        <Modal isOpen={isViewOpen} onClose={onViewClose} size="6xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              <HStack>
                {selectedTemplate && getProjectTypeIcon(selectedTemplate.project_type)}
                <VStack align="start" spacing={0}>
                  <Text>{selectedTemplate?.template_name}</Text>
                  <Badge colorScheme={getProjectTypeColor(selectedTemplate?.project_type || '')}>
                    {getProjectTypeLabel(selectedTemplate?.project_type || '')}
                  </Badge>
                </VStack>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {selectedTemplate && (
                <VStack spacing={6} align="stretch">
                  {/* Template Info */}
                  <SimpleGrid columns={3} spacing={4}>
                    <Box>
                      <Text fontSize="sm" color="gray.600">Overhead</Text>
                      <Text fontWeight="bold">{selectedTemplate.default_overhead}%</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600">Ganancia</Text>
                      <Text fontWeight="bold">{selectedTemplate.default_profit}%</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600">Contingencia</Text>
                      <Text fontWeight="bold">{selectedTemplate.default_contingency}%</Text>
                    </Box>
                  </SimpleGrid>

                  <Divider />

                  {/* Template Sections */}
                  <Box>
                    <Heading size="md" mb={4}>Secciones de la Plantilla</Heading>
                    <Accordion allowMultiple>
                      {Object.entries(selectedTemplate.template_sections).map(([sectionName, sectionData]: [string, any]) => (
                        <AccordionItem key={sectionName}>
                          <AccordionButton>
                            <Box flex="1" textAlign="left">
                              <HStack justify="space-between">
                                <Text fontWeight="medium">{sectionName}</Text>
                                <Badge colorScheme="blue">
                                  {sectionData.items?.length || 0} items
                                </Badge>
                              </HStack>
                            </Box>
                            <AccordionIcon />
                          </AccordionButton>
                          <AccordionPanel pb={4}>
                            {sectionData.description && (
                              <Text fontSize="sm" color="gray.600" mb={3}>
                                {sectionData.description}
                              </Text>
                            )}
                            {sectionData.items && (
                              <TableContainer>
                                <Table size="sm">
                                  <Thead>
                                    <Tr>
                                      <Th>Descripción</Th>
                                      <Th>Cantidad</Th>
                                      <Th>Unidad</Th>
                                      <Th>Costo Unit.</Th>
                                      <Th>Tipo</Th>
                                      <Th>Total</Th>
                                    </Tr>
                                  </Thead>
                                  <Tbody>
                                    {sectionData.items.map((item: any, index: number) => (
                                      <Tr key={index}>
                                        <Td>{item.description}</Td>
                                        <Td>{item.quantity}</Td>
                                        <Td>{item.unit}</Td>
                                        <Td>${item.unit_cost?.toFixed(2)}</Td>
                                        <Td>
                                          <Badge 
                                            size="sm" 
                                            colorScheme={
                                              item.type === 'MATERIAL' ? 'blue' :
                                              item.type === 'LABOR' ? 'green' :
                                              item.type === 'EQUIPMENT' ? 'orange' :
                                              item.type === 'SUBCONTRACT' ? 'purple' : 'gray'
                                            }
                                          >
                                            {item.type}
                                          </Badge>
                                        </Td>
                                        <Td fontWeight="medium">
                                          ${((item.quantity || 0) * (item.unit_cost || 0)).toFixed(2)}
                                        </Td>
                                      </Tr>
                                    ))}
                                  </Tbody>
                                </Table>
                              </TableContainer>
                            )}
                          </AccordionPanel>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </Box>
                </VStack>
              )}
            </ModalBody>
            <ModalFooter>
              <Button onClick={onViewClose}>Cerrar</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Create Template Modal */}
        <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Nueva Plantilla de Cotización</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Nombre de la Plantilla</FormLabel>
                  <Input
                    value={newTemplate.template_name}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, template_name: e.target.value }))}
                    placeholder="Ej: Casa Residencial Premium"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Tipo de Proyecto</FormLabel>
                  <Select
                    value={newTemplate.project_type}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, project_type: e.target.value }))}
                  >
                    <option value="RESIDENTIAL">Residencial</option>
                    <option value="COMMERCIAL">Comercial</option>
                    <option value="INDUSTRIAL">Industrial</option>
                    <option value="INSTITUTIONAL">Institucional</option>
                    <option value="INFRASTRUCTURE">Infraestructura</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Descripción</FormLabel>
                  <Textarea
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descripción opcional de la plantilla"
                    rows={3}
                  />
                </FormControl>

                <SimpleGrid columns={3} spacing={4} w="full">
                  <FormControl>
                    <FormLabel>Overhead (%)</FormLabel>
                    <Input
                      type="number"
                      step="0.01"
                      value={newTemplate.default_overhead}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, default_overhead: parseFloat(e.target.value) || 0 }))}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Ganancia (%)</FormLabel>
                    <Input
                      type="number"
                      step="0.01"
                      value={newTemplate.default_profit}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, default_profit: parseFloat(e.target.value) || 0 }))}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Contingencia (%)</FormLabel>
                    <Input
                      type="number"
                      step="0.01"
                      value={newTemplate.default_contingency}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, default_contingency: parseFloat(e.target.value) || 0 }))}
                    />
                  </FormControl>
                </SimpleGrid>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onCreateClose}>
                Cancelar
              </Button>
              <Button colorScheme="blue">
                Crear Plantilla
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* View Assembly Modal */}
        <Modal isOpen={isViewAssemblyOpen} onClose={onViewAssemblyClose} size="6xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              <HStack>
                {selectedAssembly && getAssemblyTypeIcon(selectedAssembly.assembly_type)}
                <VStack align="start" spacing={0}>
                  <Text>{selectedAssembly?.assembly_name}</Text>
                  <HStack>
                    <Badge colorScheme={getAssemblyTypeColor(selectedAssembly?.assembly_type || '')}>
                      {getAssemblyTypeLabel(selectedAssembly?.assembly_type || '')}
                    </Badge>
                    <Badge variant="outline">
                      {selectedAssembly?.assembly_code}
                    </Badge>
                  </HStack>
                </VStack>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {selectedAssembly && (
                <VStack spacing={6} align="stretch">
                  {/* Assembly Info */}
                  <SimpleGrid columns={4} spacing={4}>
                    <Box>
                      <Text fontSize="sm" color="gray.600">Unidad de Medida</Text>
                      <Text fontWeight="bold">{selectedAssembly.unit_of_measure}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600">Categoría</Text>
                      <Text fontWeight="bold">{selectedAssembly.system_category}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600">Usos</Text>
                      <Text fontWeight="bold">{selectedAssembly.usage_count}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600">Tipo</Text>
                      <HStack>
                        <Text fontWeight="bold">{selectedAssembly.is_parametric ? 'Paramétrico' : 'Fijo'}</Text>
                        {selectedAssembly.is_parametric && <Text>⚙️</Text>}
                      </HStack>
                    </Box>
                  </SimpleGrid>

                  {selectedAssembly.description && (
                    <Box>
                      <Text fontSize="sm" color="gray.600" mb={2}>Descripción</Text>
                      <Text>{selectedAssembly.description}</Text>
                    </Box>
                  )}

                  <Divider />

                  {/* Parameters Schema */}
                  {selectedAssembly.is_parametric && selectedAssembly.parameters_schema && (
                    <Box>
                      <Heading size="md" mb={4}>Parámetros del Ensamblaje</Heading>
                      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                        {Object.entries(selectedAssembly.parameters_schema).map(([paramName, paramData]: [string, any]) => (
                          <Card key={paramName} size="sm">
                            <CardBody>
                              <VStack align="start" spacing={2}>
                                <Text fontWeight="bold" fontSize="sm">{paramName}</Text>
                                <Text fontSize="xs" color="gray.600">{paramData.description}</Text>
                                <HStack>
                                  <Badge size="sm" colorScheme="blue">
                                    {paramData.type}
                                  </Badge>
                                  <Text fontSize="xs">
                                    Defecto: {paramData.default} {paramData.unit}
                                  </Text>
                                </HStack>
                                {paramData.options && (
                                  <Text fontSize="xs" color="gray.500">
                                    Opciones: {paramData.options.join(', ')}
                                  </Text>
                                )}
                              </VStack>
                            </CardBody>
                          </Card>
                        ))}
                      </SimpleGrid>
                    </Box>
                  )}

                  {/* Components */}
                  {selectedAssembly.components && selectedAssembly.components.length > 0 && (
                    <Box>
                      <Heading size="md" mb={4}>Componentes del Ensamblaje</Heading>
                      <TableContainer>
                        <Table size="sm">
                          <Thead>
                            <Tr>
                              <Th>Orden</Th>
                              <Th>Descripción</Th>
                              <Th>Fórmula/Cantidad</Th>
                              <Th>Factor Productividad</Th>
                              <Th>Opcional</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {selectedAssembly.components
                              .sort((a, b) => a.sequence_order - b.sequence_order)
                              .map((component) => (
                              <Tr key={component.id}>
                                <Td>{component.sequence_order}</Td>
                                <Td>
                                  <VStack align="start" spacing={1}>
                                    <Text fontWeight="medium">
                                      {component.cost_item?.description || 'Item no encontrado'}
                                    </Text>
                                    <Text fontSize="xs" color="gray.500">
                                      {component.cost_item?.item_code}
                                    </Text>
                                  </VStack>
                                </Td>
                                <Td>
                                  <Text fontSize="sm" fontFamily="mono">
                                    {component.quantity_formula || component.base_quantity}
                                  </Text>
                                </Td>
                                <Td>{component.productivity_factor}x</Td>
                                <Td>
                                  {component.is_optional ? (
                                    <Badge colorScheme="orange" size="sm">Opcional</Badge>
                                  ) : (
                                    <Badge colorScheme="green" size="sm">Requerido</Badge>
                                  )}
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </TableContainer>
                    </Box>
                  )}

                  {/* Enhanced Assembly Cost Calculator */}
                  {selectedAssembly && selectedAssembly.is_parametric && (
                    <Box>
                      <Divider my={6} />
                      <Heading size="md" mb={4}>Calculadora de Costos</Heading>
                      
                      <AssemblyCostCalculator 
                        assembly={selectedAssembly}
                        onCostCalculated={(calculation) => {
                          console.log('Cost calculated:', calculation);
                        }}
                      />
                    </Box>
                  )}

                  {/* Usage Examples */}
                  <Box>
                    <Heading size="md" mb={4}>Ejemplos de Uso</Heading>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <Card size="sm">
                        <CardBody>
                          <VStack align="start" spacing={2}>
                            <HStack>
                              <Text fontSize="sm" fontWeight="bold">Casa Residencial</Text>
                              <Badge size="sm" colorScheme="green">Típico</Badge>
                            </HStack>
                            <Text fontSize="xs" color="gray.600">
                              Parámetros comunes para vivienda unifamiliar
                            </Text>
                            {selectedAssembly.default_parameters && (
                              <VStack align="start" spacing={1}>
                                {Object.entries(selectedAssembly.default_parameters).map(([key, value]) => (
                                  <Text key={key} fontSize="xs">
                                    {key}: {String(value)}
                                  </Text>
                                ))}
                              </VStack>
                            )}
                          </VStack>
                        </CardBody>
                      </Card>
                      
                      <Card size="sm">
                        <CardBody>
                          <VStack align="start" spacing={2}>
                            <HStack>
                              <Text fontSize="sm" fontWeight="bold">Proyecto Comercial</Text>
                              <Badge size="sm" colorScheme="blue">Optimizado</Badge>
                            </HStack>
                            <Text fontSize="xs" color="gray.600">
                              Parámetros ajustados para eficiencia comercial
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              Configure parámetros según especificaciones del proyecto
                            </Text>
                          </VStack>
                        </CardBody>
                      </Card>
                    </SimpleGrid>
                  </Box>
                </VStack>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onViewAssemblyClose}>
                Cerrar
              </Button>
              {selectedAssembly && selectedAssembly.is_parametric && (
                <Button colorScheme="blue" leftIcon={<AddIcon />}>
                  Agregar a Cotización
                </Button>
              )}
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Create Assembly Modal */}
        <Modal isOpen={isCreateAssemblyOpen} onClose={onCreateAssemblyClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Nuevo Ensamblaje</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <Text color="gray.600" textAlign="center">
                  La creación de ensamblajes personalizados estará disponible próximamente.
                </Text>
                <Text fontSize="sm" color="gray.500" textAlign="center">
                  Por ahora, puedes usar los ensamblajes del sistema y solicitar nuevos ensamblajes 
                  a través del soporte técnico.
                </Text>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button onClick={onCreateAssemblyClose}>Cerrar</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Box>
  );
};

// Enhanced Assembly Cost Calculator Component
interface AssemblyCalculation {
  assembly_id: number;
  assembly_name: string;
  unit_of_measure: string;
  parameters_used: Record<string, any>;
  total_unit_cost: number | string;
  material_cost: number | string;
  labor_cost: number | string;
  equipment_cost: number | string;
  subcontract_cost: number | string;
  component_breakdown: Array<{
    cost_item_code: string;
    description: string;
    item_type: string;
    base_quantity: number | string;
    adjusted_quantity: number | string;
    unit_cost: number | string;
    total_cost: number | string;
    unit_of_measure: string;
  }>;
}

interface AssemblyCostCalculatorProps {
  assembly: ConstructionAssembly;
  onCostCalculated: (calculation: AssemblyCalculation) => void;
}

const AssemblyCostCalculator: React.FC<AssemblyCostCalculatorProps> = ({ 
  assembly, 
  onCostCalculated 
}) => {
  const [parameters, setParameters] = useState<Record<string, any>>(
    assembly.default_parameters || {}
  );
  const [calculation, setCalculation] = useState<AssemblyCalculation | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [locationFactor, setLocationFactor] = useState(1.0);
  const [complexityFactor, setComplexityFactor] = useState(1.0);
  const toast = useToast();

  const calculateCost = async () => {
    setIsCalculating(true);
    try {
      const response = await fetch('/api/construction-quotes/assemblies/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assembly_id: assembly.id,
          parameters,
          location_factor: locationFactor,
          complexity_factor: complexityFactor
        })
      });

      if (response.ok) {
        const result = await response.json();
        setCalculation(result);
        onCostCalculated(result);
      } else {
        throw new Error('Error calculating assembly cost');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo calcular el costo del ensamblaje',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const updateParameter = (paramName: string, value: any) => {
    setParameters(prev => ({
      ...prev,
      [paramName]: value
    }));
  };

  const resetToDefaults = () => {
    setParameters(assembly.default_parameters || {});
    setCalculation(null);
  };

  useEffect(() => {
    // Auto-calculate when parameters change
    const timer = setTimeout(() => {
      if (Object.keys(parameters).length > 0) {
        calculateCost();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [parameters, locationFactor, complexityFactor]);

  return (
    <VStack spacing={6} align="stretch">
      {/* Parameter Inputs */}
      <Box>
        <HStack justify="space-between" mb={4}>
          <Heading size="sm">Configurar Parámetros</Heading>
          <Button size="sm" variant="outline" onClick={resetToDefaults}>
            Restablecer
          </Button>
        </HStack>
        
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          {assembly.parameters_schema && Object.entries(assembly.parameters_schema).map(([paramName, paramData]: [string, any]) => (
            <FormControl key={paramName}>
              <FormLabel fontSize="sm">{paramName}</FormLabel>
              <VStack align="start" spacing={2}>
                {paramData.type === 'select' ? (
                  <Select
                    size="sm"
                    value={parameters[paramName] || paramData.default}
                    onChange={(e) => updateParameter(paramName, e.target.value)}
                  >
                    {paramData.options?.map((option: string) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </Select>
                ) : (
                  <Input
                    size="sm"
                    type="number"
                    step="0.01"
                    value={parameters[paramName] || paramData.default}
                    onChange={(e) => updateParameter(paramName, parseFloat(e.target.value) || 0)}
                  />
                )}
                <Text fontSize="xs" color="gray.500">
                  {paramData.description} {paramData.unit && `(${paramData.unit})`}
                </Text>
              </VStack>
            </FormControl>
          ))}
        </SimpleGrid>
      </Box>

      {/* Location and Complexity Factors */}
      <Box>
        <Heading size="sm" mb={4}>Factores de Ajuste</Heading>
        <SimpleGrid columns={2} spacing={4}>
          <FormControl>
            <FormLabel fontSize="sm">Factor de Ubicación</FormLabel>
            <Input
              size="sm"
              type="number"
              step="0.01"
              value={locationFactor}
              onChange={(e) => setLocationFactor(parseFloat(e.target.value) || 1.0)}
            />
            <Text fontSize="xs" color="gray.500">
              Ajuste por ubicación geográfica (1.0 = base)
            </Text>
          </FormControl>
          <FormControl>
            <FormLabel fontSize="sm">Factor de Complejidad</FormLabel>
            <Input
              size="sm"
              type="number"
              step="0.01"
              value={complexityFactor}
              onChange={(e) => setComplexityFactor(parseFloat(e.target.value) || 1.0)}
            />
            <Text fontSize="xs" color="gray.500">
              Ajuste por complejidad del proyecto (1.0 = estándar)
            </Text>
          </FormControl>
        </SimpleGrid>
      </Box>

      {/* Cost Calculation Results */}
      {calculation && (
        <Box>
          <Heading size="sm" mb={4}>Resultado del Cálculo</Heading>
          
          {/* Cost Summary */}
          <Card mb={4}>
            <CardBody>
              <SimpleGrid columns={{ base: 2, md: 5 }} spacing={4}>
                <Box textAlign="center">
                  <Text fontSize="xs" color="gray.600">COSTO TOTAL</Text>
                  <Text fontSize="lg" fontWeight="bold" color="blue.600">
                    ${Number(calculation.total_unit_cost || 0).toFixed(2)}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    por {calculation.unit_of_measure}
                  </Text>
                </Box>
                <Box textAlign="center">
                  <Text fontSize="xs" color="gray.600">MATERIALES</Text>
                  <Text fontSize="md" fontWeight="bold" color="green.600">
                    ${Number(calculation.material_cost || 0).toFixed(2)}
                  </Text>
                </Box>
                <Box textAlign="center">
                  <Text fontSize="xs" color="gray.600">MANO DE OBRA</Text>
                  <Text fontSize="md" fontWeight="bold" color="orange.600">
                    ${Number(calculation.labor_cost || 0).toFixed(2)}
                  </Text>
                </Box>
                <Box textAlign="center">
                  <Text fontSize="xs" color="gray.600">EQUIPOS</Text>
                  <Text fontSize="md" fontWeight="bold" color="purple.600">
                    ${Number(calculation.equipment_cost || 0).toFixed(2)}
                  </Text>
                </Box>
                <Box textAlign="center">
                  <Text fontSize="xs" color="gray.600">SUBCONTRATOS</Text>
                  <Text fontSize="md" fontWeight="bold" color="red.600">
                    ${Number(calculation.subcontract_cost || 0).toFixed(2)}
                  </Text>
                </Box>
              </SimpleGrid>
            </CardBody>
          </Card>

          {/* Component Breakdown */}
          {calculation.component_breakdown.length > 0 && (
            <Box>
              <Text fontSize="sm" fontWeight="bold" mb={2}>Desglose por Componentes</Text>
              <TableContainer>
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th>Componente</Th>
                      <Th>Tipo</Th>
                      <Th>Cantidad</Th>
                      <Th>Costo Unit.</Th>
                      <Th>Total</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {calculation.component_breakdown.map((component, index) => (
                      <Tr key={index}>
                        <Td>
                          <VStack align="start" spacing={0}>
                            <Text fontSize="xs" fontWeight="medium">
                              {component.description}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              {component.cost_item_code}
                            </Text>
                          </VStack>
                        </Td>
                        <Td>
                          <Badge 
                            size="sm" 
                            colorScheme={
                              component.item_type === 'MATERIAL' ? 'green' :
                              component.item_type === 'LABOR' ? 'orange' :
                              component.item_type === 'EQUIPMENT' ? 'purple' : 'red'
                            }
                          >
                            {component.item_type}
                          </Badge>
                        </Td>
                        <Td>
                          <Text fontSize="xs">
                            {Number(component.adjusted_quantity || 0).toFixed(2)} {component.unit_of_measure}
                          </Text>
                        </Td>
                        <Td>${Number(component.unit_cost || 0).toFixed(2)}</Td>
                        <Td fontWeight="medium">${Number(component.total_cost || 0).toFixed(2)}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Box>
      )}

      {isCalculating && (
        <Box textAlign="center" py={4}>
          <Spinner size="sm" mr={2} />
          <Text fontSize="sm" color="gray.600">Calculando costos...</Text>
        </Box>
      )}
    </VStack>
  );
};

export default QuoteTemplatesPage; 