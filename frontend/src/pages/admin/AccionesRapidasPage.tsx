import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Heading,
  VStack,
  HStack,
  Card,
  CardBody,
  CardHeader,
  FormControl,
  FormLabel,
  Select,
  Input,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Progress,
  Divider,
  SimpleGrid,
  Icon,
  Flex
} from '@chakra-ui/react';
import { DownloadIcon, ViewIcon, CheckIcon, WarningIcon, AttachmentIcon } from '@chakra-ui/icons';
import { FaFileExcel, FaTable, FaUpload } from 'react-icons/fa';
import { api } from '../../api/api';

interface TableInfo {
  required_columns: string[];
  table_name: string;
}

interface PreviewData {
  success: boolean;
  preview: any[];
  total_rows: number;
  columns: string[];
  required_columns: string[];
  missing_columns: string[];
  month_columns_found: string[];
  is_valid: boolean;
}

interface UploadResult {
  success: boolean;
  message: string;
  results: {
    processed: number;
    errors: string[];
    created: number;
    updated: number;
    skipped: number;
  };
}

export default function AccionesRapidasPage() {
  const [availableTables, setAvailableTables] = useState<Record<string, TableInfo>>({});
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [updateMode, setUpdateMode] = useState<string>('replace');
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const { isOpen: isPreviewOpen, onOpen: onPreviewOpen, onClose: onPreviewClose } = useDisclosure();
  const { isOpen: isResultOpen, onOpen: onResultOpen, onClose: onResultClose } = useDisclosure();
  
  const toast = useToast();

  useEffect(() => {
    fetchAvailableTables();
  }, []);

  const fetchAvailableTables = async () => {
    try {
      const response = await api.get('/api/excel-upload/tables');
      setAvailableTables(response.data.table_info);
    } catch (error) {
      console.error('Error fetching tables:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las tablas disponibles',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        toast({
          title: 'Archivo no válido',
          description: 'Solo se permiten archivos Excel (.xlsx, .xls)',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      setSelectedFile(file);
      setPreviewData(null);
      setUploadResult(null);
    }
  };

  const handlePreview = async () => {
    if (!selectedFile || !selectedTable) {
      toast({
        title: 'Datos incompletos',
        description: 'Selecciona una tabla y un archivo',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const response = await api.post(`/api/excel-upload/preview/${selectedTable}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setPreviewData(response.data);
      onPreviewOpen();
    } catch (error: any) {
      console.error('Error previewing file:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Error al procesar el archivo',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedTable) {
      toast({
        title: 'Datos incompletos',
        description: 'Selecciona una tabla y un archivo',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    
    // Simular progreso
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 10, 90));
    }, 200);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('update_mode', updateMode);
      
      const response = await api.post(`/api/excel-upload/upload/${selectedTable}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setUploadResult(response.data);
      onPreviewClose();
      onResultOpen();
      
      toast({
        title: 'Éxito',
        description: 'Archivo cargado correctamente',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      clearInterval(progressInterval);
      console.error('Error uploading file:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Error al cargar el archivo',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const downloadTemplate = async (tableName: string) => {
    try {
      const response = await api.get(`/api/excel-upload/template/${tableName}`, {
        responseType: 'blob',
      });
      
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `template_${tableName}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: 'Descarga iniciada',
        description: 'El template se está descargando',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error downloading template:', error);
      toast({
        title: 'Error',
        description: 'No se pudo descargar el template',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const getTableDisplayName = (tableName: string) => {
    const names: Record<string, string> = {
      'miscelaneos': 'Misceláneos',
      'estudios_permisos': 'Estudios y Permisos',
      'gastos_equipo': 'Gastos de Equipo'
    };
    return names[tableName] || tableName;
  };

  const PreviewModal = () => (
    <Modal isOpen={isPreviewOpen} onClose={onPreviewClose} size="6xl">
      <ModalOverlay />
      <ModalContent maxW="90vw">
        <ModalHeader>Vista Previa del Archivo</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {previewData && (
            <VStack spacing={4} align="stretch">
              {/* Información general */}
              <SimpleGrid columns={4} spacing={4}>
                <Card>
                  <CardBody textAlign="center">
                    <Text fontSize="2xl" fontWeight="bold">{previewData.total_rows}</Text>
                    <Text fontSize="sm" color="gray.600">Filas totales</Text>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody textAlign="center">
                    <Text fontSize="2xl" fontWeight="bold">{previewData.columns.length}</Text>
                    <Text fontSize="sm" color="gray.600">Columnas</Text>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody textAlign="center">
                    <Text fontSize="2xl" fontWeight="bold">{previewData.month_columns_found.length}</Text>
                    <Text fontSize="sm" color="gray.600">Meses encontrados</Text>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody textAlign="center">
                    <Icon as={previewData.is_valid ? CheckIcon : WarningIcon} 
                          fontSize="2xl" 
                          color={previewData.is_valid ? "green.500" : "red.500"} />
                    <Text fontSize="sm" color="gray.600">
                      {previewData.is_valid ? "Válido" : "Errores"}
                    </Text>
                  </CardBody>
                </Card>
              </SimpleGrid>

              {/* Alertas */}
              {!previewData.is_valid && (
                <Alert status="error">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Columnas faltantes:</AlertTitle>
                    <AlertDescription>
                      {previewData.missing_columns.join(', ')}
                    </AlertDescription>
                  </Box>
                </Alert>
              )}

              {/* Vista previa de datos */}
              <Box>
                <Heading size="md" mb={2}>Vista Previa (primeras 10 filas)</Heading>
                <TableContainer maxH="400px" overflowY="auto">
                  <Table variant="simple" size="sm">
                    <Thead bg="gray.50" position="sticky" top={0} zIndex={1}>
                      <Tr>
                        {previewData.columns.slice(0, 10).map((col, index) => (
                          <Th key={index}>{col}</Th>
                        ))}
                        {previewData.columns.length > 10 && <Th>...</Th>}
                      </Tr>
                    </Thead>
                    <Tbody>
                      {previewData.preview.map((row, index) => (
                        <Tr key={index}>
                          {previewData.columns.slice(0, 10).map((col, colIndex) => (
                            <Td key={colIndex}>{String(row[col] || '')}</Td>
                          ))}
                          {previewData.columns.length > 10 && <Td>...</Td>}
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </Box>
            </VStack>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onPreviewClose}>
            Cancelar
          </Button>
          <Button 
            colorScheme="blue" 
            onClick={handleUpload}
            isDisabled={!previewData?.is_valid || isUploading}
            isLoading={isUploading}
            loadingText="Cargando..."
          >
            Confirmar Carga
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );

  const ResultModal = () => (
    <Modal isOpen={isResultOpen} onClose={onResultClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Resultado de la Carga</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {uploadResult && (
            <VStack spacing={4} align="stretch">
              <Alert status={uploadResult.success ? "success" : "error"}>
                <AlertIcon />
                <AlertTitle>{uploadResult.message}</AlertTitle>
              </Alert>

              <SimpleGrid columns={2} spacing={4}>
                <Card>
                  <CardBody textAlign="center">
                    <Text fontSize="xl" fontWeight="bold" color="green.500">
                      {uploadResult.results.created}
                    </Text>
                    <Text fontSize="sm">Creados</Text>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody textAlign="center">
                    <Text fontSize="xl" fontWeight="bold" color="blue.500">
                      {uploadResult.results.updated}
                    </Text>
                    <Text fontSize="sm">Actualizados</Text>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody textAlign="center">
                    <Text fontSize="xl" fontWeight="bold" color="orange.500">
                      {uploadResult.results.skipped}
                    </Text>
                    <Text fontSize="sm">Omitidos</Text>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody textAlign="center">
                    <Text fontSize="xl" fontWeight="bold">
                      {uploadResult.results.processed}
                    </Text>
                    <Text fontSize="sm">Total procesados</Text>
                  </CardBody>
                </Card>
              </SimpleGrid>

              {uploadResult.results.errors.length > 0 && (
                <Box>
                  <Heading size="sm" mb={2}>Errores:</Heading>
                  <Box maxH="200px" overflowY="auto" bg="red.50" p={3} borderRadius="md">
                    {uploadResult.results.errors.map((error, index) => (
                      <Text key={index} fontSize="sm" color="red.600">
                        {error}
                      </Text>
                    ))}
                  </Box>
                </Box>
              )}
            </VStack>
          )}
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="blue" onClick={onResultClose}>
            Cerrar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        <Heading size="lg">Acciones Rápidas - Carga Masiva Excel</Heading>
        
        <Text color="gray.600">
          Carga y actualiza múltiples registros desde archivos Excel de manera rápida y eficiente.
        </Text>

        {/* Sección de Templates */}
        <Card>
          <CardHeader>
            <Heading size="md">📋 Descargar Templates</Heading>
          </CardHeader>
          <CardBody>
            <Text mb={4} color="gray.600">
              Descarga los templates Excel con el formato correcto para cada tabla:
            </Text>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              {Object.entries(availableTables).map(([tableName, info]) => (
                <Card key={tableName} variant="outline">
                  <CardBody>
                    <VStack spacing={3}>
                      <Icon as={FaFileExcel} fontSize="2xl" color="green.500" />
                      <Text fontWeight="bold">{getTableDisplayName(tableName)}</Text>
                      <Text fontSize="sm" color="gray.600" textAlign="center">
                        Columnas requeridas: {info.required_columns.join(', ')}
                      </Text>
                      <Button
                        size="sm"
                        leftIcon={<DownloadIcon />}
                        colorScheme="green"
                        variant="outline"
                        onClick={() => downloadTemplate(tableName)}
                      >
                        Descargar Template
                      </Button>
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Sección de Carga */}
        <Card>
          <CardHeader>
            <Heading size="md">📤 Cargar Archivo Excel</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl>
                  <FormLabel>Tabla destino</FormLabel>
                  <Select 
                    placeholder="Selecciona una tabla"
                    value={selectedTable}
                    onChange={(e) => setSelectedTable(e.target.value)}
                  >
                    {Object.keys(availableTables).map((tableName) => (
                      <option key={tableName} value={tableName}>
                        {getTableDisplayName(tableName)}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Modo de actualización</FormLabel>
                  <Select 
                    value={updateMode}
                    onChange={(e) => setUpdateMode(e.target.value)}
                  >
                    <option value="replace">Reemplazar todo</option>
                    <option value="append">Agregar nuevos</option>
                    <option value="update">Actualizar existentes</option>
                  </Select>
                </FormControl>
              </SimpleGrid>

              <FormControl>
                <FormLabel>Archivo Excel</FormLabel>
                <Input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  p={1}
                />
              </FormControl>

              {selectedFile && (
                <Alert status="info">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Archivo seleccionado:</AlertTitle>
                    <AlertDescription>{selectedFile.name}</AlertDescription>
                  </Box>
                </Alert>
              )}

              {isUploading && (
                <Box>
                  <Text mb={2}>Cargando archivo...</Text>
                  <Progress value={uploadProgress} colorScheme="blue" />
                </Box>
              )}

              <HStack spacing={4}>
                <Button
                  leftIcon={<ViewIcon />}
                  colorScheme="blue"
                  variant="outline"
                  onClick={handlePreview}
                  isDisabled={!selectedFile || !selectedTable || isUploading}
                >
                  Vista Previa
                </Button>
                
                <Button
                  leftIcon={<AttachmentIcon />}
                  colorScheme="blue"
                  onClick={handleUpload}
                  isDisabled={!selectedFile || !selectedTable || isUploading}
                  isLoading={isUploading}
                  loadingText="Cargando..."
                >
                  Cargar Directamente
                </Button>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Instrucciones */}
        <Card variant="outline">
          <CardHeader>
            <Heading size="md">💡 Instrucciones</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={2} align="start">
              <Text>1. <strong>Descarga el template</strong> de la tabla que quieres actualizar</Text>
              <Text>2. <strong>Llena el Excel</strong> con tus datos siguiendo el formato del template</Text>
              <Text>3. <strong>Selecciona la tabla destino</strong> y el modo de actualización</Text>
              <Text>4. <strong>Sube tu archivo</strong> y usa "Vista Previa" para verificar antes de cargar</Text>
              <Text>5. <strong>Confirma la carga</strong> una vez que todo esté correcto</Text>
            </VStack>
          </CardBody>
        </Card>
      </VStack>

      <PreviewModal />
      <ResultModal />
    </Box>
  );
} 