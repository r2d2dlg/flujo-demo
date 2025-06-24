import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Grid,
  VStack,
  HStack,
  Button,
  Card,
  CardBody,
  CardHeader,
  SimpleGrid,
  Badge,
  Icon,
  Divider,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Select,
  Input,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Progress,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer
} from '@chakra-ui/react';
import ActionButton from '../../components/ActionButton';
import { 
  FaArrowLeft,
  FaClipboardList,
  FaFileAlt,
  FaChartBar,
  FaMoneyBillWave,
  FaCogs,
  FaBuilding,
  FaCalculator,
  FaTable,
  FaEdit,
  FaEye,
  FaUpload,
  FaDownload,
  FaFileExcel
} from 'react-icons/fa';
import { MdAccountBalance, MdShoppingCart, MdAssessment } from 'react-icons/md';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { api } from '../../api/api';

const PlanificarGastosPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  
  // Estados para carga de Excel
  const [availableTables, setAvailableTables] = useState<Record<string, any>>({});
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [updateMode, setUpdateMode] = useState<string>('replace');
  const [previewData, setPreviewData] = useState<any>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Modales
  const { isOpen: isUploadOpen, onOpen: onUploadOpen, onClose: onUploadClose } = useDisclosure();
  const { isOpen: isPreviewOpen, onOpen: onPreviewOpen, onClose: onPreviewClose } = useDisclosure();
  const { isOpen: isResultOpen, onOpen: onResultOpen, onClose: onResultClose } = useDisclosure();
  const { isOpen: isTemplateOpen, onOpen: onTemplateOpen, onClose: onTemplateClose } = useDisclosure();

  useEffect(() => {
    fetchAvailableTables();
  }, []);

  const fetchAvailableTables = async () => {
    try {
      const response = await api.get('/api/excel-upload/tables');
      setAvailableTables(response.data.table_info);
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  };

  const costTables = [
    {
      title: "Costos Directos",
      subtitle: "Gestionar tabla de costos directos de construcción",
      icon: FaClipboardList,
      colorScheme: "orange",
      to: "/costo-directo/table",
      description: "Administra los costos directos de materiales, mano de obra y equipos para proyectos de construcción."
    },
    {
      title: "Estudios y Permisos",
      subtitle: "Gestionar tabla de estudios, diseños y permisos",
      icon: FaFileAlt,
      colorScheme: "blue",
      to: "/estudios-disenos-permisos/table",
      description: "Controla los costos de estudios técnicos, diseños arquitectónicos y permisos municipales."
    },
    {
      title: "Gastos de Equipo",
      subtitle: "Gestionar tabla de gastos de equipo",
      icon: FaBuilding,
      colorScheme: "purple",
      to: "/gastos-equipo/table",
      description: "Administra los gastos relacionados con alquiler y consumo de equipos de construcción."
    },
    {
      title: "Gastos Fijos Operativos",
      subtitle: "Gestionar tabla de gastos fijos mensuales",
      icon: FaChartBar,
      colorScheme: "red",
      to: "/dashboard-contabilidad/presupuesto_gastos_fijos_operativos",
      description: "Administra los gastos fijos operativos mensuales de la empresa."
    },
    {
      title: "Gastos Variables Fijos por Proyecto",
      subtitle: "Gestionar presupuesto de gastos por proyecto",
      icon: FaMoneyBillWave,
      colorScheme: "orange",
      to: "/contabilidad/gestionar-presupuesto-gastos",
      description: "Administra los gastos variables y fijos asignados específicamente por proyecto."
    },
    {
      title: "Misceláneos",
      subtitle: "Gestionar tabla de gastos misceláneos",
      icon: MdShoppingCart,
      colorScheme: "teal",
      to: "/miscelaneos",
      description: "Controla gastos diversos que no entran en otras categorías específicas."
    },
    {
      title: "Payroll Dashboard",
      subtitle: "Gestionar tablas de nómina y personal",
      icon: FaCalculator,
      colorScheme: "green",
      to: "/payroll/tables-dashboard",
      description: "Administra las tablas relacionadas con nómina, personal y costos laborales."
    },
    {
      title: "Comisiones de Ventas",
      subtitle: "Gestionar tabla de comisiones de ventas",
      icon: FaMoneyBillWave,
      colorScheme: "cyan",
      to: "/comisiones-ventas/table",
      description: "Administra las comisiones de ventas por mes y concepto para el equipo comercial."
    }
  ];

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
      toast({
        title: 'Error',
        description: 'No se pudo descargar el template',
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
      onUploadClose();
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

  const getTableDisplayName = (tableName: string) => {
    const names: Record<string, string> = {
      'miscelaneos': 'Misceláneos',
      'estudios_permisos': 'Estudios y Permisos',
      'gastos_equipo': 'Gastos de Equipo'
    };
    return names[tableName] || tableName;
  };

  const quickActions = [
    {
      title: "Carga Masiva Excel",
      subtitle: "Importar datos desde Excel",
      icon: FaUpload,
      colorScheme: "blue",
      action: onUploadOpen,
      description: "Importa datos masivos desde archivos Excel para actualizar las tablas de costos."
    },
    {
      title: "Descargar Templates",
      subtitle: "Templates Excel personalizados",
      icon: FaDownload,
      colorScheme: "green",
      action: onTemplateOpen,
      description: "Descarga templates Excel con el formato correcto para cada tabla."
    },
    {
      title: "Exportar Todas",
      subtitle: "Exportar tablas completas",
      icon: FaFileExcel,
      colorScheme: "orange",
      action: () => {
        toast({
          title: 'Próximamente',
          description: 'Función de exportación masiva en desarrollo',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      },
      description: "Exporta todas las tablas a formato Excel para análisis externo."
    }
  ];

  return (
    <Box p={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <HStack justifyContent="space-between" align="start">
          <VStack align="start" spacing={2}>
            <Heading as="h1" size="xl" color="blue.600">
              Planificar Gastos
            </Heading>
            <Text color="gray.600" fontSize="lg">
              Administra todas las tablas de costos y gastos para la planificación financiera de proyectos
            </Text>
            <Badge colorScheme="blue" variant="subtle" fontSize="sm" px={3} py={1}>
              Centro de Control de Costos
            </Badge>
          </VStack>
          <Button
            as={RouterLink}
            to="/admin"
            leftIcon={<FaArrowLeft />}
            colorScheme="gray"
            variant="outline"
            size="lg"
          >
            Volver al Panel Principal
          </Button>
        </HStack>

        <Divider />

        {/* Estadísticas rápidas */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          <Card>
            <CardBody textAlign="center">
              <Icon as={FaTable} boxSize={8} color="blue.500" mb={2} />
              <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                6
              </Text>
              <Text color="gray.600">Tablas de Costos</Text>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody textAlign="center">
              <Icon as={FaCalculator} boxSize={8} color="green.500" mb={2} />
              <Text fontSize="2xl" fontWeight="bold" color="green.600">
                Activo
              </Text>
              <Text color="gray.600">Sistema de Cálculos</Text>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody textAlign="center">
              <Icon as={FaBuilding} boxSize={8} color="purple.500" mb={2} />
              <Text fontSize="2xl" fontWeight="bold" color="purple.600">
                Integrado
              </Text>
              <Text color="gray.600">Con Proyectos</Text>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Tablas de Costos */}
        <Box>
          <Heading size="lg" mb={6} color="gray.700">
            📊 Tablas de Costos y Gastos
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {costTables.map((table, index) => (
              <Card 
                key={index} 
                variant="outline" 
                _hover={{ shadow: "lg", transform: "translateY(-2px)" }}
                transition="all 0.2s"
                cursor="pointer"
                onClick={() => navigate(table.to)}
              >
                <CardHeader>
                  <VStack align="start" spacing={3}>
                    <HStack>
                      <Icon as={table.icon} boxSize={6} color={`${table.colorScheme}.500`} />
                      <Badge colorScheme={table.colorScheme} variant="subtle">
                        Tabla Administrativa
                      </Badge>
                    </HStack>
                    <VStack align="start" spacing={1}>
                      <Heading size="md" color="gray.700">
                        {table.title}
                      </Heading>
                      <Text fontSize="sm" color="gray.500">
                        {table.subtitle}
                      </Text>
                    </VStack>
                  </VStack>
                </CardHeader>
                <CardBody pt={0}>
                  <VStack align="start" spacing={3}>
                    <Text fontSize="sm" color="gray.600">
                      {table.description}
                    </Text>
                    <HStack spacing={2} width="100%">
                      <Button
                        size="sm"
                        colorScheme={table.colorScheme}
                        variant="solid"
                        leftIcon={<FaEdit />}
                        flex={1}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(table.to);
                        }}
                      >
                        Administrar
                      </Button>
                      <Button
                        size="sm"
                        colorScheme={table.colorScheme}
                        variant="outline"
                        leftIcon={<FaEye />}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(table.to.replace('/table', '/view'));
                        }}
                      >
                        Ver
                      </Button>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        </Box>

        {/* Acciones Rápidas */}
        <Box>
          <Heading size="lg" mb={6} color="gray.700">
            ⚡ Acciones Rápidas
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
            {quickActions.map((action, index) => (
              <Card 
                key={index} 
                variant="outline" 
                _hover={{ shadow: "md" }}
                transition="all 0.2s"
              >
                <CardBody>
                  <VStack spacing={4}>
                    <Icon as={action.icon} boxSize={8} color={`${action.colorScheme}.500`} />
                    <VStack spacing={2}>
                      <Heading size="sm" textAlign="center">
                        {action.title}
                      </Heading>
                      <Text fontSize="sm" color="gray.600" textAlign="center">
                        {action.description}
                      </Text>
                    </VStack>
                    <Button
                      colorScheme={action.colorScheme}
                      size="sm"
                      onClick={action.action}
                      width="100%"
                    >
                      {action.subtitle}
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        </Box>

        {/* Información adicional */}
        <Card bg="blue.50" borderColor="blue.200">
          <CardBody>
            <VStack align="start" spacing={3}>
              <HStack>
                <Icon as={FaCalculator} color="blue.500" />
                <Heading size="sm" color="blue.700">
                  Información del Sistema
                </Heading>
              </HStack>
              <Text fontSize="sm" color="blue.600">
                Las tablas administrativas son la base para todos los cálculos financieros en proyectos de escenario y construcción. 
                Mantén estos datos actualizados para obtener proyecciones precisas.
              </Text>
              <Text fontSize="sm" color="blue.600">
                <strong>Tip:</strong> Revisa y actualiza las tablas mensualmente para reflejar cambios en precios de mercado y costos operativos.
              </Text>
            </VStack>
          </CardBody>
        </Card>
      </VStack>

      {/* Modal de Selección de Templates */}
      <Modal isOpen={isTemplateOpen} onClose={onTemplateClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Descargar Templates Excel</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text color="gray.600" mb={2}>
                Selecciona el template que deseas descargar:
              </Text>
              
              {Object.entries(availableTables).map(([tableName, info]) => (
                <Card 
                  key={tableName} 
                  variant="outline" 
                  cursor="pointer"
                  _hover={{ bg: "gray.50", borderColor: "blue.300" }}
                  onClick={() => {
                    downloadTemplate(tableName);
                    onTemplateClose();
                  }}
                >
                  <CardBody>
                    <HStack spacing={3}>
                      <Icon as={FaFileExcel} color="green.500" boxSize={6} />
                      <VStack align="start" spacing={1} flex={1}>
                        <Text fontWeight="bold">{getTableDisplayName(tableName)}</Text>
                        <Text fontSize="sm" color="gray.600">
                          Columnas: {info.required_columns?.join(', ')}
                        </Text>
                      </VStack>
                      <Icon as={FaDownload} color="blue.500" />
                    </HStack>
                  </CardBody>
                </Card>
              ))}

              {Object.keys(availableTables).length === 0 && (
                <Alert status="info">
                  <AlertIcon />
                  <AlertDescription>
                    Cargando templates disponibles...
                  </AlertDescription>
                </Alert>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onTemplateClose}>
              Cerrar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de Carga de Excel */}
      <Modal isOpen={isUploadOpen} onClose={onUploadClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Carga Masiva desde Excel</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
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

              {selectedTable && (
                <Alert status="warning">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Importante:</AlertTitle>
                    <AlertDescription>
                      Asegúrate de usar el template correcto para {getTableDisplayName(selectedTable)}.
                      <Button
                        size="sm"
                        ml={2}
                        colorScheme="blue"
                        variant="outline"
                        onClick={() => downloadTemplate(selectedTable)}
                      >
                        Descargar Template
                      </Button>
                    </AlertDescription>
                  </Box>
                </Alert>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onUploadClose}>
              Cancelar
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleUpload}
              isDisabled={!selectedFile || !selectedTable || isUploading}
              isLoading={isUploading}
              loadingText="Cargando..."
            >
              Cargar Archivo
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de Resultados */}
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
                        {uploadResult.results?.created || 0}
                      </Text>
                      <Text fontSize="sm">Creados</Text>
                    </CardBody>
                  </Card>
                  <Card>
                    <CardBody textAlign="center">
                      <Text fontSize="xl" fontWeight="bold" color="blue.500">
                        {uploadResult.results?.updated || 0}
                      </Text>
                      <Text fontSize="sm">Actualizados</Text>
                    </CardBody>
                  </Card>
                  <Card>
                    <CardBody textAlign="center">
                      <Text fontSize="xl" fontWeight="bold" color="orange.500">
                        {uploadResult.results?.skipped || 0}
                      </Text>
                      <Text fontSize="sm">Omitidos</Text>
                    </CardBody>
                  </Card>
                  <Card>
                    <CardBody textAlign="center">
                      <Text fontSize="xl" fontWeight="bold">
                        {uploadResult.results?.processed || 0}
                      </Text>
                      <Text fontSize="sm">Total procesados</Text>
                    </CardBody>
                  </Card>
                </SimpleGrid>

                {uploadResult.results?.errors?.length > 0 && (
                  <Box>
                    <Heading size="sm" mb={2}>Errores:</Heading>
                    <Box maxH="200px" overflowY="auto" bg="red.50" p={3} borderRadius="md">
                      {uploadResult.results.errors.map((error: string, index: number) => (
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
    </Box>
  );
};

export default PlanificarGastosPage; 