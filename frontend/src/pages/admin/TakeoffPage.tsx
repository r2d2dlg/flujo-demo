import React, { useState, useEffect, useRef } from 'react';
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
  Flex,
  IconButton,
  NumberInput,
  NumberInputField,
  Alert,
  AlertIcon,
  ButtonGroup,
  Tooltip,
  useColorModeValue,
  Checkbox,
  FormHelperText
} from '@chakra-ui/react';
import { 
  FaArrowLeft, 
  FaUpload, 
  FaTrash,
  FaRuler,
  FaSquare,
  FaCube,
  FaDotCircle,
  FaMousePointer,
  FaUndo,
  FaDownload,
  FaCheckCircle
} from 'react-icons/fa';
import { useParams, useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Types
interface ProjectTakeoff {
  id: number;
  construction_project_id: number;
  takeoff_name: string;
  plan_reference?: string;
  discipline: string;
  measurement_type: string;
  measured_quantity: number;
  unit_of_measure: string;
  measurement_method?: string;
  scale_factor?: string;
  coordinates_data?: any;
  area_polygon?: any;
  verified: boolean;
  verified_by?: string;
  verification_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface MeasurementTool {
  type: string;
  name: string;
  icon: any;
  description: string;
  color: string;
}

interface Coordinate {
  x: number;
  y: number;
  height?: number;
}

interface MeasurementSession {
  tool: string;
  coordinates: Coordinate[];
  isActive: boolean;
  calculatedQuantity?: number;
  unitOfMeasure: string;
}

interface ConstructionQuote {
  id: number;
  quote_name: string;
  status: string;
}

const TakeoffPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [takeoffs, setTakeoffs] = useState<ProjectTakeoff[]>([]);
  const [quotes, setQuotes] = useState<ConstructionQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [planImage, setPlanImage] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<string>('pointer');
  const [currentMeasurement, setCurrentMeasurement] = useState<MeasurementSession>({
    tool: '',
    coordinates: [],
    isActive: false,
    unitOfMeasure: 'm'
  });
  const [scaleFactor, setScaleFactor] = useState<number>(1.0);
  const [planScale, setPlanScale] = useState<string>('1:100');
  
  // Modal states
  const { 
    isOpen: isUploadOpen, 
    onOpen: onUploadOpen, 
    onClose: onUploadClose 
  } = useDisclosure();
  
  const { 
    isOpen: isSaveOpen, 
    onOpen: onSaveOpen, 
    onClose: onSaveClose 
  } = useDisclosure();

  const { 
    isOpen: isQuoteModalOpen, 
    onOpen: onQuoteModalOpen, 
    onClose: onQuoteModalClose 
  } = useDisclosure();

  // Form states
  const [newTakeoff, setNewTakeoff] = useState({
    name: '',
    discipline: 'ARCHITECTURAL',
    measurement_type: 'AREA',
    unit_of_measure: 'm2',
    notes: ''
  });

  const [selectedTakeoffs, setSelectedTakeoffs] = useState<number[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<number | null>(null);

  // Measurement tools configuration
  const measurementTools: MeasurementTool[] = [
    {
      type: 'pointer',
      name: 'Seleccionar',
      icon: FaMousePointer,
      description: 'Herramienta de selección',
      color: 'gray.500'
    },
    {
      type: 'COUNT',
      name: 'Contar',
      icon: FaDotCircle,
      description: 'Contar elementos (puertas, ventanas, luminarias)',
      color: 'blue.500'
    },
    {
      type: 'LINEAR',
      name: 'Lineal',
      icon: FaRuler,
      description: 'Medir longitudes (tuberías, molduras)',
      color: 'green.500'
    },
    {
      type: 'AREA',
      name: 'Área',
      icon: FaSquare,
      description: 'Medir superficies (muros, pisos)',
      color: 'orange.500'
    },
    {
      type: 'VOLUME',
      name: 'Volumen',
      icon: FaCube,
      description: 'Medir volúmenes (concreto, excavación)',
      color: 'purple.500'
    }
  ];

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');

  useEffect(() => {
    if (projectId) {
      fetchTakeoffs();
      fetchQuotes();
    }
  }, [projectId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      drawCanvas();
    }
  }, [planImage, currentMeasurement, takeoffs]);

  const fetchTakeoffs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/takeoffs/projects/${projectId}/takeoffs`);
      if (response.ok) {
        const data = await response.json();
        setTakeoffs(data);
      }
    } catch (error) {
      console.error('Error fetching takeoffs:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las cubicaciones',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchQuotes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/construction-quotes/projects/${projectId}/quotes`);
      if (response.ok) {
        const data = await response.json();
        setQuotes(data);
      }
    } catch (error) {
      console.error('Error fetching quotes:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    
    try {
      // Create image preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPlanImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      toast({
        title: 'Plano Cargado',
        description: 'El plano se ha cargado correctamente',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onUploadClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar el plano',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setUploading(false);
    }
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw plan image if available
    if (planImage) {
      const img = new Image();
      img.onload = () => {
        // Scale image to fit canvas
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
        const width = img.width * scale;
        const height = img.height * scale;
        const x = (canvas.width - width) / 2;
        const y = (canvas.height - height) / 2;
        
        ctx.drawImage(img, x, y, width, height);
        
        // Draw existing takeoffs
        drawExistingTakeoffs(ctx);
        
        // Draw current measurement
        drawCurrentMeasurement(ctx);
      };
      img.src = planImage;
    } else {
      // Draw placeholder
      ctx.fillStyle = '#f7fafc';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#a0aec0';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        'Carga un plano para comenzar las mediciones',
        canvas.width / 2,
        canvas.height / 2
      );
    }
  };

  const drawExistingTakeoffs = (ctx: CanvasRenderingContext2D) => {
    takeoffs.forEach((takeoff) => {
      if (!takeoff.coordinates_data) return;

      const coordinates = takeoff.coordinates_data;
      const color = measurementTools.find(t => t.type === takeoff.measurement_type)?.color || 'blue.500';
      
      ctx.strokeStyle = getColorValue(color);
      ctx.lineWidth = 2;
      ctx.setLineDash([]);

      if (takeoff.measurement_type === 'COUNT') {
        coordinates.forEach((coord: Coordinate) => {
          ctx.beginPath();
          ctx.arc(coord.x, coord.y, 5, 0, 2 * Math.PI);
          ctx.fill();
        });
      } else if (takeoff.measurement_type === 'LINEAR') {
        ctx.beginPath();
        coordinates.forEach((coord: Coordinate, i: number) => {
          if (i === 0) {
            ctx.moveTo(coord.x, coord.y);
          } else {
            ctx.lineTo(coord.x, coord.y);
          }
        });
        ctx.stroke();
      } else if (takeoff.measurement_type === 'AREA') {
        ctx.beginPath();
        coordinates.forEach((coord: Coordinate, i: number) => {
          if (i === 0) {
            ctx.moveTo(coord.x, coord.y);
          } else {
            ctx.lineTo(coord.x, coord.y);
          }
        });
        ctx.closePath();
        ctx.fillStyle = getColorValue(color) + '20';
        ctx.fill();
        ctx.stroke();
      }

      // Draw label
      if (coordinates.length > 0) {
        const firstCoord = coordinates[0];
        ctx.fillStyle = '#1a202c';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(
          `${takeoff.takeoff_name}: ${takeoff.measured_quantity} ${takeoff.unit_of_measure}`,
          firstCoord.x + 10,
          firstCoord.y - 5
        );
      }
    });
  };

  const drawCurrentMeasurement = (ctx: CanvasRenderingContext2D) => {
    if (!currentMeasurement.isActive || currentMeasurement.coordinates.length === 0) return;

    const tool = measurementTools.find(t => t.type === currentMeasurement.tool);
    if (!tool) return;

    ctx.strokeStyle = getColorValue(tool.color);
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    const coords = currentMeasurement.coordinates;

    if (currentMeasurement.tool === 'COUNT') {
      coords.forEach((coord) => {
        ctx.beginPath();
        ctx.arc(coord.x, coord.y, 5, 0, 2 * Math.PI);
        ctx.stroke();
      });
    } else if (currentMeasurement.tool === 'LINEAR') {
      ctx.beginPath();
      coords.forEach((coord, i) => {
        if (i === 0) {
          ctx.moveTo(coord.x, coord.y);
        } else {
          ctx.lineTo(coord.x, coord.y);
        }
      });
      ctx.stroke();
    } else if (currentMeasurement.tool === 'AREA' && coords.length >= 2) {
      ctx.beginPath();
      coords.forEach((coord, i) => {
        if (i === 0) {
          ctx.moveTo(coord.x, coord.y);
        } else {
          ctx.lineTo(coord.x, coord.y);
        }
      });
      if (coords.length > 2) {
        ctx.closePath();
        ctx.fillStyle = getColorValue(tool.color) + '20';
        ctx.fill();
      }
      ctx.stroke();
    }
  };

  const getColorValue = (colorStr: string): string => {
    const colorMap: { [key: string]: string } = {
      'gray.500': '#718096',
      'blue.500': '#3182ce',
      'green.500': '#38a169',
      'orange.500': '#dd6b20',
      'purple.500': '#805ad5'
    };
    return colorMap[colorStr] || '#3182ce';
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedTool === 'pointer' || !planImage) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const newCoord: Coordinate = { x, y };

    if (!currentMeasurement.isActive) {
      setCurrentMeasurement({
        tool: selectedTool,
        coordinates: [newCoord],
        isActive: true,
        unitOfMeasure: getDefaultUnit(selectedTool)
      });
    } else {
      setCurrentMeasurement(prev => ({
        ...prev,
        coordinates: [...prev.coordinates, newCoord]
      }));
    }
  };

  const handleCanvasDoubleClick = () => {
    if (currentMeasurement.isActive && currentMeasurement.coordinates.length > 0) {
      calculateMeasurement();
    }
  };

  const calculateMeasurement = async () => {
    if (!currentMeasurement.isActive || currentMeasurement.coordinates.length === 0) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/takeoffs/calculate-measurement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          measurement_type: currentMeasurement.tool,
          coordinates: currentMeasurement.coordinates,
          scale_factor: scaleFactor,
          unit_of_measure: currentMeasurement.unitOfMeasure
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setCurrentMeasurement(prev => ({
          ...prev,
          calculatedQuantity: result.calculated_quantity,
          isActive: false
        }));
        
        setNewTakeoff(prev => ({
          ...prev,
          measurement_type: currentMeasurement.tool,
          unit_of_measure: currentMeasurement.unitOfMeasure
        }));
        onSaveOpen();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al calcular la medición',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const saveTakeoff = async () => {
    if (!currentMeasurement.calculatedQuantity || !newTakeoff.name) {
      toast({
        title: 'Error',
        description: 'Completa todos los campos requeridos',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/takeoffs/projects/${projectId}/takeoffs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          construction_project_id: parseInt(projectId!),
          takeoff_name: newTakeoff.name,
          discipline: newTakeoff.discipline,
          measurement_type: newTakeoff.measurement_type,
          measured_quantity: currentMeasurement.calculatedQuantity,
          unit_of_measure: newTakeoff.unit_of_measure,
          coordinates_data: currentMeasurement.coordinates,
          notes: newTakeoff.notes
        }),
      });

      if (response.ok) {
        toast({
          title: 'Éxito',
          description: 'Cubicación guardada correctamente',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        fetchTakeoffs();
        resetMeasurement();
        onSaveClose();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al guardar la cubicación',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const convertToQuote = async () => {
    if (selectedTakeoffs.length === 0 || !selectedQuote) {
      toast({
        title: 'Error',
        description: 'Selecciona cubicaciones y una cotización',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/takeoffs/takeoffs-to-quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          takeoff_ids: selectedTakeoffs,
          quote_id: selectedQuote,
          section: 'Cubicaciones'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'Éxito',
          description: result.message,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        setSelectedTakeoffs([]);
        onQuoteModalClose();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al convertir a cotización',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const resetMeasurement = () => {
    setCurrentMeasurement({
      tool: '',
      coordinates: [],
      isActive: false,
      unitOfMeasure: 'm'
    });
    setSelectedTool('pointer');
  };

  const getDefaultUnit = (measurementType: string): string => {
    switch (measurementType) {
      case 'COUNT': return 'c/u';
      case 'LINEAR': return 'm';
      case 'AREA': return 'm2';
      case 'VOLUME': return 'm3';
      default: return 'm';
    }
  };

  const deleteTakeoff = async (takeoffId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/takeoffs/takeoffs/${takeoffId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Éxito',
          description: 'Cubicación eliminada',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        fetchTakeoffs();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al eliminar cubicación',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const formatQuantity = (quantity: number, unit: string): string => {
    return `${quantity.toFixed(2)} ${unit}`;
  };

  return (
    <Box minH="100vh" bg={bgColor} p={4}>
      <VStack spacing={6} align="stretch" maxW="7xl" mx="auto">
        {/* Header */}
        <HStack justify="space-between">
          <HStack>
            <IconButton
              aria-label="Volver"
              icon={<FaArrowLeft />}
              onClick={() => navigate(`/admin/construction-projects/${projectId}`)}
              variant="ghost"
            />
            <Heading size="lg">Herramientas de Cubicación</Heading>
          </HStack>
          
          <ButtonGroup>
            <Button
              leftIcon={<FaUpload />}
              colorScheme="blue"
              onClick={onUploadOpen}
            >
              Cargar Plano
            </Button>
            {selectedTakeoffs.length > 0 && (
              <Button
                leftIcon={<FaDownload />}
                colorScheme="green"
                onClick={onQuoteModalOpen}
              >
                Convertir a Cotización
              </Button>
            )}
          </ButtonGroup>
        </HStack>

        <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={6}>
          {/* Canvas Area */}
          <Card bg={cardBg}>
            <CardHeader>
              <HStack justify="space-between">
                <Heading size="md">Plano de Trabajo</Heading>
                <HStack>
                  <Text fontSize="sm">Escala:</Text>
                  <Select 
                    size="sm" 
                    w="100px" 
                    value={planScale}
                    onChange={(e) => setPlanScale(e.target.value)}
                  >
                    <option value="1:50">1:50</option>
                    <option value="1:100">1:100</option>
                    <option value="1:200">1:200</option>
                    <option value="1:500">1:500</option>
                  </Select>
                </HStack>
              </HStack>
            </CardHeader>
            <CardBody>
              {/* Measurement Tools */}
              <HStack mb={4} flexWrap="wrap">
                {measurementTools.map((tool) => (
                  <Tooltip key={tool.type} label={tool.description}>
                    <Button
                      leftIcon={<tool.icon />}
                      size="sm"
                      variant={selectedTool === tool.type ? "solid" : "outline"}
                      colorScheme={selectedTool === tool.type ? "blue" : "gray"}
                      onClick={() => {
                        setSelectedTool(tool.type);
                        if (tool.type === 'pointer') {
                          resetMeasurement();
                        }
                      }}
                    >
                      {tool.name}
                    </Button>
                  </Tooltip>
                ))}
                
                {currentMeasurement.isActive && (
                  <ButtonGroup size="sm">
                    <Button
                      leftIcon={<FaUndo />}
                      onClick={resetMeasurement}
                      colorScheme="red"
                      variant="outline"
                    >
                      Cancelar
                    </Button>
                    <Button
                      leftIcon={<FaCheckCircle />}
                      onClick={calculateMeasurement}
                      colorScheme="green"
                      isDisabled={currentMeasurement.coordinates.length === 0}
                    >
                      Finalizar
                    </Button>
                  </ButtonGroup>
                )}
              </HStack>

              {/* Canvas */}
              <Box
                border="2px dashed"
                borderColor="gray.300"
                borderRadius="md"
                position="relative"
                bg="white"
              >
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={600}
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                    cursor: selectedTool === 'pointer' ? 'default' : 'crosshair'
                  }}
                  onClick={handleCanvasClick}
                  onDoubleClick={handleCanvasDoubleClick}
                />
              </Box>

              {/* Current Measurement Info */}
              {currentMeasurement.isActive && (
                <Alert status="info" mt={4}>
                  <AlertIcon />
                  <VStack align="start" spacing={1}>
                    <Text fontSize="sm" fontWeight="bold">
                      Medición en progreso: {measurementTools.find(t => t.type === currentMeasurement.tool)?.name}
                    </Text>
                    <Text fontSize="xs">
                      Puntos: {currentMeasurement.coordinates.length} | 
                      {currentMeasurement.tool === 'COUNT' ? ' Haz clic para contar elementos' :
                       currentMeasurement.tool === 'LINEAR' ? ' Haz clic para trazar líneas, doble clic para finalizar' :
                       ' Haz clic para crear polígono, doble clic para finalizar'}
                    </Text>
                  </VStack>
                </Alert>
              )}
            </CardBody>
          </Card>

          {/* Takeoffs List */}
          <Card bg={cardBg}>
            <CardHeader>
              <HStack justify="space-between">
                <Heading size="md">Cubicaciones del Proyecto</Heading>
                <Badge colorScheme="blue">{takeoffs.length} mediciones</Badge>
              </HStack>
            </CardHeader>
            <CardBody>
              {loading ? (
                <Flex justify="center" p={8}>
                  <Spinner />
                </Flex>
              ) : takeoffs.length === 0 ? (
                <Box textAlign="center" py={8} color="gray.500">
                  <Text>No hay cubicaciones registradas</Text>
                  <Text fontSize="sm">Carga un plano y comienza a medir</Text>
                </Box>
              ) : (
                <VStack spacing={3} align="stretch">
                  {takeoffs.map((takeoff) => (
                    <Card key={takeoff.id} size="sm" variant="outline">
                      <CardBody>
                        <HStack justify="space-between">
                          <VStack align="start" spacing={1} flex={1}>
                            <HStack>
                              <Checkbox
                                isChecked={selectedTakeoffs.includes(takeoff.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedTakeoffs([...selectedTakeoffs, takeoff.id]);
                                  } else {
                                    setSelectedTakeoffs(selectedTakeoffs.filter(id => id !== takeoff.id));
                                  }
                                }}
                              />
                              <Text fontWeight="bold" fontSize="sm">
                                {takeoff.takeoff_name}
                              </Text>
                              <Badge 
                                size="sm" 
                                colorScheme={measurementTools.find(t => t.type === takeoff.measurement_type)?.color.split('.')[0] || 'blue'}
                              >
                                {takeoff.measurement_type}
                              </Badge>
                            </HStack>
                            <Text fontSize="sm" color="gray.600">
                              {formatQuantity(takeoff.measured_quantity, takeoff.unit_of_measure)}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              {takeoff.discipline} | {new Date(takeoff.created_at).toLocaleDateString()}
                            </Text>
                          </VStack>
                          
                          <VStack>
                            {takeoff.verified && (
                              <Badge colorScheme="green" size="sm">
                                <FaCheckCircle style={{ marginRight: '4px' }} />
                                Verificado
                              </Badge>
                            )}
                            <IconButton
                              aria-label="Eliminar"
                              icon={<FaTrash />}
                              size="sm"
                              colorScheme="red"
                              variant="ghost"
                              onClick={() => deleteTakeoff(takeoff.id)}
                            />
                          </VStack>
                        </HStack>
                      </CardBody>
                    </Card>
                  ))}
                </VStack>
              )}
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Upload Plan Modal */}
        <Modal isOpen={isUploadOpen} onClose={onUploadClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Cargar Plano de Construcción</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel>Archivo del Plano</FormLabel>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    p={1}
                  />
                  <FormHelperText>
                    Formatos soportados: JPG, PNG, PDF
                  </FormHelperText>
                </FormControl>
                
                <FormControl>
                  <FormLabel>Factor de Escala</FormLabel>
                  <NumberInput
                    value={scaleFactor}
                    onChange={(_, val) => setScaleFactor(val || 1.0)}
                    step={0.1}
                    min={0.1}
                    max={10}
                  >
                    <NumberInputField />
                  </NumberInput>
                  <FormHelperText>
                    Relación entre píxeles y unidades reales
                  </FormHelperText>
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <ButtonGroup>
                <Button variant="ghost" onClick={onUploadClose}>
                  Cancelar
                </Button>
                <Button 
                  colorScheme="blue" 
                  isLoading={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Seleccionar Archivo
                </Button>
              </ButtonGroup>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Save Takeoff Modal */}
        <Modal isOpen={isSaveOpen} onClose={onSaveClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Guardar Cubicación</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <Alert status="success">
                  <AlertIcon />
                  <VStack align="start" spacing={1}>
                    <Text fontSize="sm" fontWeight="bold">
                      Medición calculada: {currentMeasurement.calculatedQuantity?.toFixed(2)} {currentMeasurement.unitOfMeasure}
                    </Text>
                  </VStack>
                </Alert>

                <FormControl isRequired>
                  <FormLabel>Nombre de la Cubicación</FormLabel>
                  <Input
                    value={newTakeoff.name}
                    onChange={(e) => setNewTakeoff({...newTakeoff, name: e.target.value})}
                    placeholder="Ej: Muros Planta Baja"
                  />
                </FormControl>

                <SimpleGrid columns={2} spacing={4} w="full">
                  <FormControl>
                    <FormLabel>Disciplina</FormLabel>
                    <Select
                      value={newTakeoff.discipline}
                      onChange={(e) => setNewTakeoff({...newTakeoff, discipline: e.target.value})}
                    >
                      <option value="ARCHITECTURAL">Arquitectónico</option>
                      <option value="STRUCTURAL">Estructural</option>
                      <option value="MEP">MEP</option>
                      <option value="CIVIL">Civil</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Unidad</FormLabel>
                    <Select
                      value={newTakeoff.unit_of_measure}
                      onChange={(e) => setNewTakeoff({...newTakeoff, unit_of_measure: e.target.value})}
                    >
                      {newTakeoff.measurement_type === 'COUNT' && (
                        <>
                          <option value="c/u">c/u</option>
                          <option value="pcs">pcs</option>
                        </>
                      )}
                      {newTakeoff.measurement_type === 'LINEAR' && (
                        <>
                          <option value="m">m</option>
                          <option value="ml">ml</option>
                          <option value="ft">ft</option>
                        </>
                      )}
                      {newTakeoff.measurement_type === 'AREA' && (
                        <>
                          <option value="m2">m²</option>
                          <option value="ft2">ft²</option>
                        </>
                      )}
                      {newTakeoff.measurement_type === 'VOLUME' && (
                        <>
                          <option value="m3">m³</option>
                          <option value="ft3">ft³</option>
                        </>
                      )}
                    </Select>
                  </FormControl>
                </SimpleGrid>

                <FormControl>
                  <FormLabel>Notas</FormLabel>
                  <Textarea
                    value={newTakeoff.notes}
                    onChange={(e) => setNewTakeoff({...newTakeoff, notes: e.target.value})}
                    placeholder="Observaciones adicionales..."
                    rows={3}
                  />
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <ButtonGroup>
                <Button variant="ghost" onClick={onSaveClose}>
                  Cancelar
                </Button>
                <Button colorScheme="blue" onClick={saveTakeoff}>
                  Guardar Cubicación
                </Button>
              </ButtonGroup>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Convert to Quote Modal */}
        <Modal isOpen={isQuoteModalOpen} onClose={onQuoteModalClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Convertir a Cotización</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <Alert status="info">
                  <AlertIcon />
                  <Text fontSize="sm">
                    Se convertirán {selectedTakeoffs.length} cubicaciones seleccionadas a líneas de cotización
                  </Text>
                </Alert>

                <FormControl isRequired>
                  <FormLabel>Cotización Destino</FormLabel>
                  <Select
                    placeholder="Selecciona una cotización"
                    value={selectedQuote || ''}
                    onChange={(e) => setSelectedQuote(parseInt(e.target.value))}
                  >
                    {quotes.map((quote) => (
                      <option key={quote.id} value={quote.id}>
                        {quote.quote_name} ({quote.status})
                      </option>
                    ))}
                  </Select>
                </FormControl>

                {quotes.length === 0 && (
                  <Alert status="warning">
                    <AlertIcon />
                    <Text fontSize="sm">
                      No hay cotizaciones disponibles. Crea una cotización primero.
                    </Text>
                  </Alert>
                )}
              </VStack>
            </ModalBody>
            <ModalFooter>
              <ButtonGroup>
                <Button variant="ghost" onClick={onQuoteModalClose}>
                  Cancelar
                </Button>
                <Button 
                  colorScheme="green" 
                  onClick={convertToQuote}
                  isDisabled={!selectedQuote}
                >
                  Convertir a Cotización
                </Button>
              </ButtonGroup>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Box>
  );
};

export default TakeoffPage; 