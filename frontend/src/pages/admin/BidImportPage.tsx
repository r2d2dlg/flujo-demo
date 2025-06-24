import React, { useState, useRef } from 'react';
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
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
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
  Checkbox,
  Flex,
  IconButton,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  useDisclosure,
  Divider,
  List,
  ListItem,
  ListIcon,
  Code
} from '@chakra-ui/react';
import {
  FaUpload,
  FaDownload,
  FaFileExcel,
  FaCheck,
  FaTimes,
  FaExclamationTriangle,
  FaArrowLeft,
  FaEye,
  FaDatabase,
  FaCheckCircle
} from 'react-icons/fa';
import { useParams, useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// TypeScript interfaces
interface BidItemPreview {
  row_number: number;
  codigo?: string;
  descripcion: string;
  unidad: string;
  cantidad: number;
  precio_unitario?: number;
  subtotal?: number;
  categoria?: string;
  subcategoria?: string;
  notes?: string;
  is_valid: boolean;
  validation_errors: string[];
}

interface BidImportPreview {
  filename: string;
  total_rows: number;
  valid_items: number;
  invalid_items: number;
  items: BidItemPreview[];
  summary: {
    total_items: number;
    estimated_value: number;
    categories: string[];
    units: string[];
  };
  template_compliance: boolean;
  suggestions: string[];
}

interface StandardTemplate {
  required_columns: string[];
  optional_columns: string[];
  expected_headers: Record<string, string>;
}

const BidImportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [template, setTemplate] = useState<StandardTemplate | null>(null);
  const [preview, setPreview] = useState<BidImportPreview | null>(null);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [importOptions, setImportOptions] = useState({
    create_quote: true,
    quote_name: '',
    default_markup_percentage: 15
  });

  // Modal states
  const { isOpen: isTemplateModalOpen, onOpen: onTemplateModalOpen, onClose: onTemplateModalClose } = useDisclosure();
  const { isOpen: isImportModalOpen, onOpen: onImportModalOpen, onClose: onImportModalClose } = useDisclosure();

  // Fetch template info on mount
  React.useEffect(() => {
    fetchTemplate();
  }, []);

  const fetchTemplate = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/bid-import/template`);
      if (response.ok) {
        const data = await response.json();
        setTemplate(data);
      }
    } catch (error) {
      console.error('Error fetching template:', error);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/bid-import/template/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'template_licitacion.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: 'Template Descargado',
          description: 'El template de Excel ha sido descargado exitosamente',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo descargar el template',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setPreview(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('project_id', id!);

      const response = await fetch(`${API_BASE_URL}/api/bid-import/preview`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const previewData = await response.json();
        setPreview(previewData);
        
        // Auto-select all valid items
        const validItemRows = previewData.items
          .filter((item: BidItemPreview) => item.is_valid)
          .map((item: BidItemPreview) => item.row_number);
        setSelectedItems(new Set(validItemRows));

        toast({
          title: 'Archivo Procesado',
          description: `${previewData.valid_items} items válidos encontrados`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error procesando archivo');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error procesando archivo Excel',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUploading(false);
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImport = async () => {
    if (!preview || selectedItems.size === 0) return;

    setImporting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/bid-import/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: parseInt(id!),
          items_to_import: Array.from(selectedItems),
          create_quote: importOptions.create_quote,
          quote_name: importOptions.quote_name || undefined,
          default_markup_percentage: importOptions.default_markup_percentage
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.success) {
          toast({
            title: 'Importación Exitosa',
            description: result.message,
            status: 'success',
            duration: 5000,
            isClosable: true,
          });

          // Navigate to quote if created
          if (result.quote_id) {
            setTimeout(() => {
              navigate(`/admin/construction-quotes/${result.quote_id}`);
            }, 2000);
          } else {
            // Navigate back to project
            setTimeout(() => {
              navigate(`/admin/construction-projects/${id}`);
            }, 2000);
          }
        } else {
          throw new Error(result.message);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error en importación');
      }
    } catch (error) {
      toast({
        title: 'Error en Importación',
        description: error instanceof Error ? error.message : 'Error importando items',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setImporting(false);
      onImportModalClose();
    }
  };

  const toggleItemSelection = (rowNumber: number) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(rowNumber)) {
      newSelection.delete(rowNumber);
    } else {
      newSelection.add(rowNumber);
    }
    setSelectedItems(newSelection);
  };

  const selectAllValid = () => {
    if (!preview) return;
    const validRows = preview.items
      .filter(item => item.is_valid)
      .map(item => item.row_number);
    setSelectedItems(new Set(validRows));
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PA', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Box p={6}>
      {/* Header */}
      <HStack mb={6} spacing={4}>
        <IconButton
          icon={<FaArrowLeft />}
          aria-label="Volver"
          onClick={() => navigate(`/admin/construction-projects/${id}`)}
        />
        <VStack align="start" spacing={1} flex={1}>
          <Heading size="lg">Importar Licitación</Heading>
          <Text color="gray.600">Subir archivo Excel con partidas de licitación</Text>
        </VStack>
        <HStack spacing={3}>
          <Button
            leftIcon={<FaEye />}
            colorScheme="blue"
            variant="outline"
            onClick={onTemplateModalOpen}
          >
            Ver Template
          </Button>
          <Button
            leftIcon={<FaDownload />}
            colorScheme="green"
            onClick={downloadTemplate}
          >
            Descargar Template
          </Button>
        </HStack>
      </HStack>

      {/* Upload Section */}
      <Card mb={6}>
        <CardHeader>
          <Heading size="md">1. Subir Archivo de Licitación</Heading>
        </CardHeader>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Alert status="info">
              <AlertIcon />
              <Box>
                <AlertTitle>Formato Requerido</AlertTitle>
                <AlertDescription>
                  El archivo Excel debe seguir el formato estándar. Descargue el template para ver la estructura requerida.
                </AlertDescription>
              </Box>
            </Alert>

            <HStack spacing={4}>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                disabled={uploading}
                style={{ display: 'none' }}
              />
              <Button
                leftIcon={<FaUpload />}
                colorScheme="purple"
                onClick={() => fileInputRef.current?.click()}
                isLoading={uploading}
                loadingText="Procesando..."
                size="lg"
              >
                Seleccionar Archivo Excel
              </Button>
              {uploading && (
                <HStack>
                  <Spinner size="sm" />
                  <Text>Procesando archivo...</Text>
                </HStack>
              )}
            </HStack>
          </VStack>
        </CardBody>
      </Card>

      {/* Preview Section */}
      {preview && (
        <>
          {/* Summary */}
          <Card mb={6}>
            <CardHeader>
              <Heading size="md">2. Resumen del Archivo</Heading>
            </CardHeader>
            <CardBody>
              <SimpleGrid columns={{ base: 2, md: 4 }} spacing={6}>
                <Stat>
                  <StatLabel>Total Items</StatLabel>
                  <StatNumber>{preview.total_rows}</StatNumber>
                  <StatHelpText>En archivo</StatHelpText>
                </Stat>
                <Stat>
                  <StatLabel>Items Válidos</StatLabel>
                  <StatNumber color="green.500">{preview.valid_items}</StatNumber>
                  <StatHelpText>Sin errores</StatHelpText>
                </Stat>
                <Stat>
                  <StatLabel>Items con Errores</StatLabel>
                  <StatNumber color="red.500">{preview.invalid_items}</StatNumber>
                  <StatHelpText>Requieren corrección</StatHelpText>
                </Stat>
                <Stat>
                  <StatLabel>Valor Estimado</StatLabel>
                  <StatNumber fontSize="lg">
                    {formatCurrency(preview.summary.estimated_value)}
                  </StatNumber>
                  <StatHelpText>Total licitación</StatHelpText>
                </Stat>
              </SimpleGrid>

              {preview.suggestions.length > 0 && (
                <Alert status="warning" mt={4}>
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Sugerencias:</AlertTitle>
                    <List spacing={1} mt={2}>
                      {preview.suggestions.map((suggestion, index) => (
                        <ListItem key={index} fontSize="sm">
                          • {suggestion}
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </Alert>
              )}
            </CardBody>
          </Card>

          {/* Items Table */}
          <Card mb={6}>
            <CardHeader>
              <Flex justify="space-between" align="center">
                <Heading size="md">3. Preview de Items</Heading>
                <HStack spacing={2}>
                  <Text fontSize="sm" color="gray.600">
                    {selectedItems.size} de {preview.total_rows} seleccionados
                  </Text>
                  <Button size="sm" onClick={selectAllValid}>
                    Seleccionar Válidos
                  </Button>
                  <Button size="sm" variant="ghost" onClick={clearSelection}>
                    Limpiar
                  </Button>
                </HStack>
              </Flex>
            </CardHeader>
            <CardBody>
              <TableContainer maxHeight="500px" overflowY="auto">
                <Table variant="simple" size="sm">
                  <Thead position="sticky" top={0} bg="white" zIndex={1}>
                    <Tr>
                      <Th>Sel.</Th>
                      <Th>Fila</Th>
                      <Th>Estado</Th>
                      <Th>Código</Th>
                      <Th>Descripción</Th>
                      <Th>Unidad</Th>
                      <Th>Cantidad</Th>
                      <Th>Precio Unit.</Th>
                      <Th>Subtotal</Th>
                      <Th>Categoría</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {preview.items.map((item) => (
                      <Tr
                        key={item.row_number}
                        bg={!item.is_valid ? 'red.50' : selectedItems.has(item.row_number) ? 'blue.50' : undefined}
                      >
                        <Td>
                          <Checkbox
                            isChecked={selectedItems.has(item.row_number)}
                            onChange={() => toggleItemSelection(item.row_number)}
                            isDisabled={!item.is_valid}
                          />
                        </Td>
                        <Td>{item.row_number}</Td>
                        <Td>
                          {item.is_valid ? (
                            <Badge colorScheme="green" size="sm">
                              <FaCheck style={{ marginRight: '4px' }} />
                              Válido
                            </Badge>
                          ) : (
                            <Badge colorScheme="red" size="sm">
                              <FaTimes style={{ marginRight: '4px' }} />
                              Error
                            </Badge>
                          )}
                        </Td>
                        <Td>{item.codigo || '-'}</Td>
                        <Td maxWidth="300px" overflow="hidden" textOverflow="ellipsis">
                          {item.descripcion}
                          {item.validation_errors.length > 0 && (
                            <Text color="red.500" fontSize="xs" mt={1}>
                              {item.validation_errors.join(', ')}
                            </Text>
                          )}
                        </Td>
                        <Td>{item.unidad}</Td>
                        <Td>{item.cantidad.toLocaleString()}</Td>
                        <Td>{item.precio_unitario ? formatCurrency(item.precio_unitario) : '-'}</Td>
                        <Td>{item.subtotal ? formatCurrency(item.subtotal) : '-'}</Td>
                        <Td>
                          {item.categoria && (
                            <Badge colorScheme="blue" size="sm">
                              {item.categoria}
                            </Badge>
                          )}
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </CardBody>
          </Card>

          {/* Import Button */}
          <Card>
            <CardBody>
              <Flex justify="space-between" align="center">
                <Box>
                  <Heading size="sm" mb={2}>4. Confirmar Importación</Heading>
                  <Text color="gray.600" fontSize="sm">
                    Se importarán {selectedItems.size} items seleccionados
                  </Text>
                </Box>
                <Button
                  leftIcon={<FaDatabase />}
                  colorScheme="green"
                  size="lg"
                  onClick={onImportModalOpen}
                  isDisabled={selectedItems.size === 0}
                >
                  Importar Items
                </Button>
              </Flex>
            </CardBody>
          </Card>
        </>
      )}

      {/* Template Information Modal */}
      <Modal isOpen={isTemplateModalOpen} onClose={onTemplateModalClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Formato de Template Excel</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {template && (
              <VStack spacing={6} align="stretch">
                <Alert status="info">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Estructura Requerida</AlertTitle>
                    <AlertDescription>
                      El archivo Excel debe tener una hoja llamada "LICITACION" con las siguientes columnas:
                    </AlertDescription>
                  </Box>
                </Alert>

                <Box>
                  <Heading size="sm" mb={3} color="green.600">Columnas Obligatorias</Heading>
                  <VStack spacing={2} align="stretch">
                    {template.required_columns.map((col) => (
                      <HStack key={col}>
                        <FaCheckCircle color="green" />
                        <Code>{col}</Code>
                        <Text fontSize="sm">{template.expected_headers[col]}</Text>
                      </HStack>
                    ))}
                  </VStack>
                </Box>

                <Box>
                  <Heading size="sm" mb={3} color="blue.600">Columnas Opcionales</Heading>
                  <VStack spacing={2} align="stretch">
                    {template.optional_columns.map((col) => (
                      <HStack key={col}>
                        <FaCheck color="blue" />
                        <Code>{col}</Code>
                        <Text fontSize="sm">{template.expected_headers[col]}</Text>
                      </HStack>
                    ))}
                  </VStack>
                </Box>

                <Alert status="warning">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Importante:</AlertTitle>
                    <List spacing={1} mt={2}>
                      <ListItem fontSize="sm">• No cambie los nombres de las columnas</ListItem>
                      <ListItem fontSize="sm">• Use exactamente la hoja "LICITACION"</ListItem>
                      <ListItem fontSize="sm">• Las cantidades deben ser números positivos</ListItem>
                      <ListItem fontSize="sm">• Las unidades son texto libre (m², m³, kg, etc.)</ListItem>
                    </List>
                  </Box>
                </Alert>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button mr={3} onClick={onTemplateModalClose}>
              Cerrar
            </Button>
            <Button colorScheme="green" onClick={downloadTemplate}>
              Descargar Template
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Import Confirmation Modal */}
      <Modal isOpen={isImportModalOpen} onClose={onImportModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirmar Importación</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text>
                ¿Está seguro de que desea importar {selectedItems.size} items de licitación?
              </Text>

              <FormControl>
                <Checkbox
                  isChecked={importOptions.create_quote}
                  onChange={(e) => setImportOptions({
                    ...importOptions,
                    create_quote: e.target.checked
                  })}
                >
                  Crear cotización automáticamente
                </Checkbox>
              </FormControl>

              {importOptions.create_quote && (
                <FormControl>
                  <FormLabel>Nombre de la Cotización (opcional)</FormLabel>
                  <Input
                    value={importOptions.quote_name}
                    onChange={(e) => setImportOptions({
                      ...importOptions,
                      quote_name: e.target.value
                    })}
                    placeholder="Se generará automáticamente si se deja vacío"
                  />
                </FormControl>
              )}

              <Alert status="success">
                <AlertIcon />
                <Box>
                  <AlertTitle>Resultado Esperado:</AlertTitle>
                  <AlertDescription fontSize="sm">
                    • {selectedItems.size} items serán agregados al proyecto
                    {importOptions.create_quote && '• Se creará una nueva cotización'}
                    • Podrá editar los precios posteriormente
                  </AlertDescription>
                </Box>
              </Alert>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onImportModalClose}>
              Cancelar
            </Button>
            <Button
              colorScheme="green"
              onClick={handleImport}
              isLoading={importing}
              loadingText="Importando..."
            >
              Confirmar Importación
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default BidImportPage; 