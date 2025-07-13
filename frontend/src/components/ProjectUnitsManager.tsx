import React, { useState, useEffect } from 'react';
import {
  Box,
  Text,
  Button,
  Grid,
  Card,
  CardBody,
  Tag,
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
  Alert,
  AlertIcon,
  List,
  ListItem,
  ListIcon,
  Divider,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  useDisclosure,
  Icon,
  HStack,
  VStack,
  Badge,
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  Tab,
} from '@chakra-ui/react';
import {
  AddIcon,
  EditIcon,
  DeleteIcon,
  ViewIcon,
  TimeIcon,
  CheckCircleIcon,
  WarningIcon,
} from '@chakra-ui/icons';
import { FaHome, FaBuilding, FaMapMarkerAlt, FaStore, FaFileExcel, FaDownload, FaUpload } from 'react-icons/fa';
import { projectUnits, salesProjections } from '../api/api';
import type {
  ProjectUnit,
  ProjectUnitCreate,
  ProjectUnitUpdate,
  ProjectUnitsStats,
  ExcelUploadResponse,
} from '../types/projectUnitsTypes';
import { formatCurrency, formatNumber, formatNumberWithTwoDecimals } from '../utils/formatters';
import BulkUnitsCreateModal from './BulkUnitsCreateModal';
import UnitSalesSimulator from './UnitSalesSimulator';

// Units Analysis Component
interface UnitsAnalysisTabProps {
  units: ProjectUnit[];
  simulationResults: any;
  project: any;
  activeSalesProjection: any; // Now passed from parent
}

export const UnitsAnalysisTab: React.FC<UnitsAnalysisTabProps> = ({ units, simulationResults, project, activeSalesProjection }) => {
  console.log("--- UnitsAnalysisTab RENDER ---");
  console.log("Props received -> activeSalesProjection:", activeSalesProjection);
  console.log("Props received -> simulationResults:", simulationResults);

  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [enhancedCashFlow, setEnhancedCashFlow] = useState<any[]>([]);

  // Fetch enhanced cash flow data with separation and delivery rows
  const fetchEnhancedCashFlow = async () => {
    if (!project?.id) return;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/scenario-projects/${project.id}/cash-flow-with-projections`);
      if (response.ok) {
        const data = await response.json();
        if (data.has_active_projection) {
          setEnhancedCashFlow(data.cash_flow || []);
          console.log("Enhanced cash flow data:", data.cash_flow);
        }
      }
    } catch (error) {
      console.error("Error fetching enhanced cash flow:", error);
    }
  };

  // Fetch enhanced cash flow when component mounts or when active projection changes
  useEffect(() => {
    if (activeSalesProjection && project?.id) {
      fetchEnhancedCashFlow();
    }
  }, [activeSalesProjection, project?.id]);

  // Helper functions for timeline highlighting
  const isConstructionMonth = (periodLabel: string) => {
    if (!project?.start_date || !project?.end_date) return false;
    const periodDate = new Date(periodLabel + '-01');
    const startDate = new Date(project.start_date);
    const endDate = new Date(project.end_date);
    return periodDate >= startDate && periodDate <= endDate;
  };

  const isSalesMonth = (periodLabel: string) => {
    if (!project?.delivery_start_date || !project?.delivery_end_date) return false;
    const periodDate = new Date(periodLabel + '-01');
    const deliveryStartDate = new Date(project.delivery_start_date);
    const deliveryEndDate = new Date(project.delivery_end_date);
    return periodDate >= deliveryStartDate && periodDate <= deliveryEndDate;
  };

  // This new logic robustly selects the best available data source.
  const getDataSource = () => {
    // This new logic robustly selects the best available data source.
    // Priority 1: The active projection, but ONLY if it has the detailed payment flows.
    if (activeSalesProjection && activeSalesProjection.payment_flows && activeSalesProjection.payment_flows.length > 0) {
      console.log("getDataSource: Using activeSalesProjection");
      return { data: activeSalesProjection, mode: 'Proyección Activa' };
    }
    // Priority 2: The fresh simulation results, if the active projection is missing details.
    if (simulationResults && simulationResults.payment_flows && simulationResults.payment_flows.length > 0) {
      // Find the 'realista' scenario within the simulation results as a default view.
      const realisticScenario = simulationResults.scenarios?.find((s: any) => s.scenario_name === 'realista');
      console.log("getDataSource: Using simulationResults");
      return { data: { ...simulationResults, payment_flows: realisticScenario?.payment_flows || simulationResults.payment_flows }, mode: 'Simulación' };
    }
    // No valid data source found.
    console.log("getDataSource: No valid data source found");
    return { data: null, mode: 'N/A' };
  };

  const { data: dataSource, mode: titleMode } = getDataSource();
  console.log("Data source selected:", { dataSource, titleMode });

  const monthlyCashFlow = React.useMemo(() => {
    const paymentFlows = dataSource?.payment_flows;
    console.log("Calculating monthlyCashFlow. Payment flows available:", !!paymentFlows);

    if (!project?.start_date || !project?.delivery_end_date || !paymentFlows) {
      return [];
    }

    const allMonths: Array<{ month: number; year: number; periodLabel: string; unitsSold: number; totalRevenue: number; unitsDelivered: number }> = [];
    const startDate = new Date(project.start_date);
    const endDate = new Date(project.delivery_end_date);
    let currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

    while (currentDate <= endDate) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const periodLabel = `${year}-${String(month).padStart(2, '0')}`;
      allMonths.push({
        month,
        year,
        periodLabel,
        unitsSold: 0,
        totalRevenue: 0,
        unitsDelivered: 0,
      });
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    paymentFlows.forEach((flow: any) => {
      const deliveryAmount = Number(flow.developer_delivery) || 0;
      const salePrice = Number(flow.sale_price) || 0;
      const saleMonth = flow.sale_month;
      
      if (saleMonth && project.delivery_start_date && project.delivery_end_date) {
        const saleMonthOffset = saleMonth - 1;
        const saleDate = new Date(startDate.getFullYear(), startDate.getMonth() + saleMonthOffset, 1);
        const saleMonthLabel = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`;
        const saleMonthIndex = allMonths.findIndex(m => m.periodLabel === saleMonthLabel);

        if (saleMonthIndex !== -1) {
            allMonths[saleMonthIndex].unitsSold += 1;
        }

        const deliveryEndDate = new Date(project.delivery_end_date);
        const isLateSale = saleDate > deliveryEndDate;
        
        if (isLateSale) {
          // Late sale: revenue recognized in sale month
          if (saleMonthIndex !== -1) {
            allMonths[saleMonthIndex].totalRevenue += salePrice;
            allMonths[saleMonthIndex].unitsDelivered += 1;
          }
        } else {
          // Normal sale
          if (deliveryAmount > 0) {
            // Unit with delivery, recognize revenue on delivery
            const deliveryStartDate = new Date(project.delivery_start_date);
            const deliveryPeriodMonths = ((deliveryEndDate.getFullYear() - deliveryStartDate.getFullYear()) * 12) + 
                                       (deliveryEndDate.getMonth() - deliveryStartDate.getMonth()) + 1;
            
            const unitId = flow.unit_id || 0;
            const deliveryOffset = unitId % deliveryPeriodMonths;
            const unitDeliveryDate = new Date(deliveryStartDate.getFullYear(), deliveryStartDate.getMonth() + deliveryOffset, 1);
            const deliveryMonthLabel = `${unitDeliveryDate.getFullYear()}-${String(unitDeliveryDate.getMonth() + 1).padStart(2, '0')}`;
            const deliveryMonthIndex = allMonths.findIndex(m => m.periodLabel === deliveryMonthLabel);

            if (deliveryMonthIndex !== -1) {
                allMonths[deliveryMonthIndex].totalRevenue += salePrice;
                allMonths[deliveryMonthIndex].unitsDelivered += 1;
            }
          } else {
            // Unit without delivery (e.g. lot), recognize revenue on sale
            if (saleMonthIndex !== -1) {
                allMonths[saleMonthIndex].totalRevenue += salePrice;
            }
          }
        }
      }
    });
    return allMonths;
  }, [project, dataSource]);

  useEffect(() => {
    if (monthlyCashFlow.length > 0 && selectedYear === null) {
      setSelectedYear(monthlyCashFlow?.[0]?.year ?? null);
    }
  }, [monthlyCashFlow, selectedYear]);

  const priceAnalysis = units.reduce((acc, unit) => {
    const area = unit.total_area_m2 || unit.construction_area_m2;
    if (unit.target_price_total && area) {
      const pricePerM2 = unit.target_price_total / area;
      acc.prices.push(unit.target_price_total);
      acc.pricesPerM2.push(pricePerM2);
      acc.areas.push(area);
    }
    return acc;
  }, { prices: [] as number[], pricesPerM2: [] as number[], areas: [] as number[] });

  const avgPrice = priceAnalysis.prices.length > 0 ? priceAnalysis.prices.reduce((sum, price) => sum + price, 0) / priceAnalysis.prices.length : 0;
  const avgPricePerM2 = priceAnalysis.pricesPerM2.length > 0 ? priceAnalysis.pricesPerM2.reduce((sum, price) => sum + price, 0) / priceAnalysis.pricesPerM2.length : 0;
  const avgArea = priceAnalysis.areas.length > 0 ? priceAnalysis.areas.reduce((sum, area) => sum + area, 0) / priceAnalysis.areas.length : 0;

  const minPrice = priceAnalysis.prices.length > 0 ? Math.min(...priceAnalysis.prices) : 0;
  const maxPrice = priceAnalysis.prices.length > 0 ? Math.max(...priceAnalysis.prices) : 0;
  const minPricePerM2 = priceAnalysis.pricesPerM2.length > 0 ? Math.min(...priceAnalysis.pricesPerM2) : 0;
  const maxPricePerM2 = priceAnalysis.pricesPerM2.length > 0 ? Math.max(...priceAnalysis.pricesPerM2) : 0;

  const salesVelocityData = React.useMemo(() => {
    const paymentFlows = dataSource?.payment_flows;
    const scenarioName = dataSource?.scenario_name || (simulationResults ? 'Simulación Actual' : null);

    if (!paymentFlows || paymentFlows.length === 0) {
      return { salesByMonth: {}, salesMonths: [], totalSalesPeriod: 0, avgMonthlySales: 0, totalUnitsPlanned: 0, scenarioName: null, totalSellableArea: 0, salesProgress: 0 };
    }

    const monthlyRevenueData: Record<string, { units_sold: number; revenue: number }> = {};
      
    paymentFlows.forEach((flow: any) => {
        if (flow.developer_separation > 0 || flow.credit_line_separation > 0) {
            const monthKey = `month_${flow.sale_month}`;
            if (!monthlyRevenueData[monthKey]) {
                monthlyRevenueData[monthKey] = { units_sold: 0, revenue: 0 };
            }
            monthlyRevenueData[monthKey].units_sold += 1;
            monthlyRevenueData[monthKey].revenue += flow.sale_price;
        }
    });

    const salesByMonth: Record<number, number> = {};
    let totalUnitsPlanned = 0;
    Object.entries(monthlyRevenueData).forEach(([monthKey, monthData]: [string, any]) => {
      const monthNumber = parseInt(monthKey.replace('month_', ''));
      const unitsSold = monthData.units_sold || 0;
      if (unitsSold > 0) {
        salesByMonth[monthNumber] = unitsSold;
        totalUnitsPlanned += unitsSold;
      }
    });
    const salesMonths = Object.keys(salesByMonth).map(Number).sort((a, b) => a - b);
    const totalSalesPeriod = salesMonths.length > 0 ? Math.max(...salesMonths) - Math.min(...salesMonths) + 1 : 0;
    const avgMonthlySales = totalUnitsPlanned > 0 && totalSalesPeriod > 0 ? totalUnitsPlanned / totalSalesPeriod : 0;
    const totalSellableArea = units.reduce((sum, unit) => {
      const area = unit.total_area_m2 || unit.construction_area_m2 || 0;
      return sum + area;
    }, 0);
    const salesProgress = units.length > 0 ? (totalUnitsPlanned / units.length) * 100 : 0;
    
    return { salesByMonth, salesMonths, totalSalesPeriod, avgMonthlySales, totalUnitsPlanned, scenarioName: scenarioName, totalSellableArea, salesProgress };
  }, [dataSource, units]);

  const uniqueYears = Array.from(new Set(monthlyCashFlow.map(row => row.year))).sort();

  return (
    <Box p={4}>
      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={6}>
        {/* Price Analysis */}
        <Card>
          <CardBody>
            <Text fontSize="lg" fontWeight="bold" mb={3}>Análisis de Precios</Text>
            <VStack align="stretch" spacing={2}>
              <HStack justify="space-between"><Text>Precio Promedio:</Text><Text fontWeight="semibold">{formatCurrency(avgPrice)}</Text></HStack>
              <HStack justify="space-between"><Text>Precio Promedio por m²:</Text><Text fontWeight="semibold">{formatCurrency(avgPricePerM2)}</Text></HStack>
              <Divider />
              <HStack justify="space-between"><Text>Precio Mínimo:</Text><Text>{formatCurrency(minPrice)}</Text></HStack>
              <HStack justify="space-between"><Text>Precio Máximo:</Text><Text>{formatCurrency(maxPrice)}</Text></HStack>
              <Divider />
              <HStack justify="space-between"><Text>Precio Mínimo por m²:</Text><Text>{formatCurrency(minPricePerM2)}</Text></HStack>
              <HStack justify="space-between"><Text>Precio Máximo por m²:</Text><Text>{formatCurrency(maxPricePerM2)}</Text></HStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Area Analysis */}
        <Card>
          <CardBody>
            <Text fontSize="lg" fontWeight="bold" mb={3}>Análisis de Áreas</Text>
            <VStack align="stretch" spacing={2}>
              <HStack justify="space-between"><Text>Área Promedio:</Text><Text fontWeight="semibold">{formatNumber(avgArea, 2)} m²</Text></HStack>
              <HStack justify="space-between"><Text>Área Vendible Total:</Text><Text fontWeight="semibold">{formatNumber(salesVelocityData.totalSellableArea, 2)} m²</Text></HStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Sales Velocity */}
        <Card>
          <CardBody>
            <Text fontSize="lg" fontWeight="bold" mb={3}>Velocidad de Ventas (Proyectada)</Text>
            {salesVelocityData.scenarioName ? (
              <VStack align="stretch" spacing={2}>
                <HStack justify="space-between"><Text>Escenario Activo:</Text><Badge colorScheme="green">{salesVelocityData.scenarioName}</Badge></HStack>
                <HStack justify="space-between"><Text>Unidades Planeadas:</Text><Text fontWeight="semibold">{salesVelocityData.totalUnitsPlanned} / {units.length}</Text></HStack>
                <HStack justify="space-between"><Text>Progreso de Ventas:</Text><Text fontWeight="semibold">{formatNumber(salesVelocityData.salesProgress, 2)}%</Text></HStack>
                <HStack justify="space-between"><Text>Ventas Mensuales Promedio:</Text><Text fontWeight="semibold">{formatNumber(salesVelocityData.avgMonthlySales, 2)}</Text></HStack>
                <HStack justify="space-between"><Text>Duración Periodo de Ventas:</Text><Text fontWeight="semibold">{salesVelocityData.totalSalesPeriod} meses</Text></HStack>
              </VStack>
            ) : (
              <Alert status="info">
                <AlertIcon />
                No hay una proyección de ventas activa para este proyecto.
              </Alert>
            )}
          </CardBody>
        </Card>
      </Grid>

      {/* Enhanced Cash Flow Table with Year Tabs */}
      <Card mt={6}>
        <CardBody>
          <Text fontSize="lg" fontWeight="bold" mb={3}>Flujo de Caja por Ventas (Proyección Activa)</Text>
          {enhancedCashFlow.length > 0 ? (
            (() => {
              // Group cash flow data by year
              const cashFlowByYear = enhancedCashFlow.reduce((acc, row) => {
                const year = row.year;
                if (!acc[year]) acc[year] = [];
                acc[year].push(row);
                return acc;
              }, {} as Record<number, any[]>);

              const years = Object.keys(cashFlowByYear).map(Number).sort();

              return (
                <Tabs>
                  <TabList>
                    {years.map(year => <Tab key={year}>{year}</Tab>)}
                  </TabList>
                  <TabPanels>
                    {years.map(year => (
                      <TabPanel key={year}>
                        <TableContainer>
                          <Table variant="simple" size="sm">
                            <Thead>
                              <Tr>
                                <Th>Mes</Th>
                                <Th>Actividad</Th>
                                <Th isNumeric>Unidades Vendidas</Th>
                                <Th isNumeric>Unidades Entregadas</Th>
                                <Th isNumeric>Números de Unidades</Th>
                                <Th isNumeric>Ingresos Ventas</Th>
                                <Th isNumeric>Flujo Neto</Th>
                                <Th isNumeric>Flujo Acumulado</Th>
                              </Tr>
                            </Thead>
                            <Tbody>
                              {cashFlowByYear[year].map((row, index) => {
                                // All rows are now specific revenue type rows
                                const isSeparationRow = row.row_type === 'INGRESO_POR_SEPARACION';
                                const isDeliveryRow = row.row_type === 'INGRESO_POR_ENTREGA';
                                const bgColor = isSeparationRow ? 'green.50' : 
                                               isDeliveryRow ? 'blue.50' : 'gray.50';
                                
                                // Extract month name from period_label (YYYY-MM format)
                                const monthNames = [
                                  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                                  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
                                ];
                                const monthNumber = parseInt(row.period_label.split('-')[1]) - 1;
                                const monthName = monthNames[monthNumber] || row.period_label;
                                
                                return (
                                  <Tr key={row.id || index} bg={bgColor}>
                                    <Td fontWeight="bold">{monthName}</Td>
                                    <Td fontWeight="bold">
                                      {row.activity_name}
                                    </Td>
                                    <Td isNumeric>{row.units_sold || 0}</Td>
                                    <Td isNumeric>{row.units_delivered || 0}</Td>
                                    <Td isNumeric>
                                      {row.unit_numbers && row.unit_numbers.length > 0 
                                        ? row.unit_numbers.join(', ') 
                                        : '-'
                                      }
                                    </Td>
                                    <Td isNumeric>{formatCurrency(row.ingresos_ventas || 0)}</Td>
                                    <Td isNumeric>{formatCurrency(row.flujo_neto || 0)}</Td>
                                    <Td isNumeric>{formatCurrency(row.flujo_acumulado || 0)}</Td>
                                  </Tr>
                                );
                              })}
                            </Tbody>
                          </Table>
                        </TableContainer>
                      </TabPanel>
                    ))}
                  </TabPanels>
                </Tabs>
              );
            })()
          ) : (
            <Alert status="info">
              <AlertIcon />
              No hay datos de flujo de caja de ventas disponibles. Active una proyección para ver los detalles de separación y entrega.
            </Alert>
          )}
        </CardBody>
      </Card>
    </Box>
  );
}

interface ExcelUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  onUploadSuccess: () => void;
}

export const ExcelUploadModal: React.FC<ExcelUploadModalProps> = ({ isOpen, onClose, projectId, onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<ExcelUploadResponse | null>(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) { setSelectedFile(file); setUploadResult(null); }
  };

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    try { await projectUnits.downloadTemplate(projectId); } 
    catch (error) { console.error('Error downloading template:', error); } 
    finally { setDownloadingTemplate(false); }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const response = await projectUnits.uploadExcel(projectId, selectedFile);
      setUploadResult(response.data);
      if (response.data.success) { onUploadSuccess(); }
    } catch (error: any) {
      setUploadResult({ success: false, message: error.response?.data?.detail || 'Error al subir el archivo', created_units: [], errors: [error.response?.data?.detail || 'Error desconocido'], summary: { total_rows: 0, created_count: 0, error_count: 1 } });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setUploadResult(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader><Icon as={FaFileExcel} mr={2} />Carga Masiva de Unidades desde Excel</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {!uploadResult ? (
            <Box>
              <Alert status="info" mb={3}>
                <AlertIcon />
                <Text>Para cargar unidades masivamente, primero descarga la plantilla de Excel, 
                llénala con los datos de tus unidades y luego súbela aquí.</Text>
              </Alert>

              <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
                <Card variant="outline">
                  <CardBody textAlign="center">
                    <Icon as={FaDownload} fontSize="4xl" color="blue.500" mb={2} />
                    <Text fontSize="lg" fontWeight="semibold">1. Descargar Plantilla</Text>
                    <Text fontSize="sm" color="gray.500" mb={2}>Descarga la plantilla de Excel con el formato correcto y ejemplos</Text>
                    <Button variant="solid" colorScheme="blue" leftIcon={<FaFileExcel />} onClick={handleDownloadTemplate} isLoading={downloadingTemplate} w="100%"><Text>{downloadingTemplate ? 'Descargando...' : 'Descargar Plantilla'}</Text></Button>
                  </CardBody>
                </Card>

                <Card variant="outline">
                  <CardBody textAlign="center">
                    <Icon as={FaUpload} fontSize="4xl" color="green.500" mb={2} />
                    <Text fontSize="lg" fontWeight="semibold">2. Subir Archivo</Text>
                    <Text fontSize="sm" color="gray.500" mb={2}>Selecciona el archivo Excel completado con tus unidades</Text>
                    
                    <input
                      accept=".xlsx,.xls"
                      style={{ display: 'none' }}
                      id="excel-file-input"
                      type="file"
                      onChange={handleFileSelect}
                    />
                    <label htmlFor="excel-file-input">
                      <Button variant="outline" as="span" w="100%" mb={2}>
                        Seleccionar Archivo
                      </Button>
                    </label>

                    {selectedFile && (
                      <Alert status="success" mb={2}>
                        <AlertIcon />
                        <Text fontSize="sm">Archivo: {selectedFile.name}</Text>
                      </Alert>
                    )}

                    <Button variant="solid" colorScheme="green" leftIcon={<FaFileExcel />} onClick={handleUpload} isDisabled={!selectedFile || uploading} isLoading={uploading} w="100%"><Text>{uploading ? 'Subiendo...' : 'Subir y Procesar'}</Text></Button>
                  </CardBody>
                </Card>
              </Grid>
            </Box>
          ) : (
            <Box>
              <Alert 
                status={uploadResult.success ? 'success' : 'error'} 
                mb={3}
              >
                <AlertIcon />
                <Text fontSize="lg" fontWeight="semibold">{uploadResult.message}</Text>
              </Alert>

              <Grid templateColumns={{ base: 'repeat(3, 1fr)', md: 'repeat(3, 1fr)' }} gap={3} mb={3}>
                  <Card variant="outline"><CardBody textAlign="center"><Text fontSize="2xl">{uploadResult.summary.total_rows}</Text><Text fontSize="sm" color="gray.500">Filas Procesadas</Text></CardBody></Card>
                  <Card variant="outline"><CardBody textAlign="center"><Text fontSize="2xl" color="green.500">{uploadResult.summary.created_count}</Text><Text fontSize="sm" color="gray.500">Unidades Creadas</Text></CardBody></Card>
                  <Card variant="outline"><CardBody textAlign="center"><Text fontSize="2xl" color="red.500">{uploadResult.summary.error_count}</Text><Text fontSize="sm" color="gray.500">Errores</Text></CardBody></Card>
              </Grid>

              {uploadResult.created_units.length > 0 && (
                <Box mb={3}>
                  <Text fontSize="lg" fontWeight="semibold" mb={2}>Unidades Creadas Exitosamente</Text>
                  <List spacing={1}>
                    {uploadResult.created_units.slice(0, 10).map((unit, index) => (
                      <ListItem key={index} display="flex" alignItems="center">
                        <ListIcon as={CheckCircleIcon} color="green.500" />
                        <Text fontSize="sm">{`${unit.unit_number} - ${unit.unit_type}`}</Text>
                        <Text fontSize="sm" color="gray.500" ml="auto">{unit.target_price_total ? formatCurrency(unit.target_price_total) : 'Sin precio'}</Text>
                      </ListItem>
                    ))}
                    {uploadResult.created_units.length > 10 && (
                      <ListItem>
                        <Text textAlign="center" fontStyle="italic" width="100%">... y {uploadResult.created_units.length - 10} unidades más</Text>
                      </ListItem>
                    )}
                  </List>
                </Box>
              )}

              {uploadResult.errors.length > 0 && (
                <Box>
                  <Text fontSize="lg" fontWeight="semibold" color="red.500" mb={2}>Errores Encontrados</Text>
                  <List spacing={1}>
                    {uploadResult.errors.slice(0, 10).map((error, index) => (
                      <ListItem key={index} display="flex" alignItems="center">
                        <ListIcon as={WarningIcon} color="red.500" />
                        <Text fontSize="sm">{error}</Text>
                      </ListItem>
                    ))}
                    {uploadResult.errors.length > 10 && (
                      <ListItem>
                        <Text textAlign="center" fontStyle="italic" width="100%">... y {uploadResult.errors.length - 10} errores más</Text>
                      </ListItem>
                    )}
                  </List>
                </Box>
              )}
            </Box>
          )}
        </ModalBody>
        <ModalFooter>
          <Button onClick={handleClose}>{uploadResult ? 'Cerrar' : 'Cancelar'}</Button>
          {uploadResult && uploadResult.success && (
            <Button variant="solid" onClick={handleClose}>Continuar</Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

interface ProjectUnitsManagerProps {
  projectId: string | number;
  onFinancialsRecalculated: () => void;
  project: any; // Add this prop
}

const ProjectUnitsManager: React.FC<ProjectUnitsManagerProps> = ({ projectId, onFinancialsRecalculated, project }) => {
  const [units, setUnits] = useState<ProjectUnit[]>([]);
  const [stats, setStats] = useState<ProjectUnitsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [simulationResults, setSimulationResults] = useState<any>(null);
  const [activeSalesProjection, setActiveSalesProjection] = useState<any>(null);
  const { isOpen: isUnitModalOpen, onOpen: onUnitModalOpen, onClose: onUnitModalClose } = useDisclosure();
  const { isOpen: isBulkModalOpen, onOpen: onBulkModalOpen, onClose: onBulkModalClose } = useDisclosure();
  const { isOpen: isExcelModalOpen, onOpen: onExcelModalOpen, onClose: onExcelModalClose } = useDisclosure();
  const [editingUnit, setEditingUnit] = useState<ProjectUnit | null>(null);
  const [unitForm, setUnitForm] = useState<Partial<ProjectUnitCreate>>({ unit_number: '', unit_type: 'APARTAMENTO', status: 'AVAILABLE', sales_priority: 1, is_active: true });

  // This is a new dependency to help trigger data reloads across sibling tabs.
  const [dataVersion, setDataVersion] = useState(0);

  const handleDataRefresh = () => {
    // We no longer clear simulation results here.
    // We will let the new active projection data overwrite it if necessary.
    setDataVersion(prevVersion => prevVersion + 1);
    if (onFinancialsRecalculated) {
      onFinancialsRecalculated();
    }
  };

  const loadData = async (id: string | number) => {
    setLoading(true);
    setError(null);
    try {
      console.log("loadData: Fetching data...");
      // Fetch projection first to see what we get
      const projectionRes = await salesProjections.getActiveProjection(Number(id)).catch(err => {
        console.error("Error fetching active projection:", err.response?.data || err.message);
        return null; // Return null on error so Promise.all doesn't fail
      });
      console.log("loadData: Fetched active projection response:", projectionRes);

      const [unitsRes, statsRes] = await Promise.all([
        projectUnits.getProjectUnits(Number(id)),
        projectUnits.getUnitsStats(Number(id)),
      ]);
      
      setUnits(unitsRes.data);
      setStats(statsRes.data);
      
      const newProjection = projectionRes ? projectionRes.data : null;
      console.log("loadData: Setting active projection state with:", newProjection);
      setActiveSalesProjection(newProjection);

      // If the newly activated projection has the detailed flows,
      // we can clear the temporary simulation results.
      if (newProjection?.payment_flows) {
        setSimulationResults(null);
      }
      
    } catch (err) {
      console.error("Error in loadData:", err);
      setError('Error al cargar datos de unidades.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadData(projectId);
    } else {
      setLoading(false);
      setError("No se ha proporcionado un ID de proyecto.");
    }
    // The dependency on dataVersion ensures this hook re-runs when handleDataRefresh is called.
  }, [projectId, dataVersion]);

  const handleSaveUnit = async () => {
    if (!projectId) return;
    try {
      if (editingUnit) {
        await projectUnits.updateUnit(Number(projectId), editingUnit.id, unitForm as ProjectUnitUpdate);
      } else {
        await projectUnits.createUnit(Number(projectId), unitForm as ProjectUnitCreate);
      }
      onUnitModalClose();
      handleDataRefresh(); // Refresh data after saving
    } catch (err) {
      setError('Error al guardar la unidad.');
    }
  };

  const handleDeleteUnit = async (unitId: number) => {
    if (!window.confirm('¿Está seguro de eliminar esta unidad?')) return;
    if (!projectId) return;
    try {
      await projectUnits.deleteUnit(Number(projectId), unitId);
      handleDataRefresh(); // Refresh data after deleting
    } catch (err) {
      setError('Error al eliminar la unidad');
    }
  };

  const openEditModal = (unit: ProjectUnit) => {
    setEditingUnit(unit);
    setUnitForm({ ...unit });
    onUnitModalOpen();
  };

  const openCreateModal = () => {
    setEditingUnit(null);
    setUnitForm({ unit_number: '', unit_type: 'APARTAMENTO', status: 'AVAILABLE', sales_priority: 1, is_active: true });
    onUnitModalOpen();
  };

  const getUnitTypeIcon = (type: string) => {
    switch (type) {
      case 'APARTAMENTO': return FaHome;
      case 'CASA': return FaHome;
      case 'LOTE': return FaMapMarkerAlt;
      case 'OFICINA': return FaBuilding;
      case 'LOCAL': return FaStore;
      default: return ViewIcon;
    }
  };
  
  const getStatusColorScheme = (status?: string) => {
    switch (status) {
      case 'AVAILABLE': return 'green';
      case 'RESERVED': return 'yellow';
      case 'SOLD': return 'blue';
      case 'DELIVERED': return 'purple';
      case 'CANCELLED': return 'red';
      default: return 'gray';
    }
  };

  if (loading) return <Box textAlign="center" p={10}><Text>Cargando unidades...</Text></Box>;

  return (
    <Box p={5}>
      {error && <Alert status="error" mb={4}><AlertIcon />{error}</Alert>}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Text fontSize="2xl" fontWeight="bold">Gestión de Unidades</Text>
        <Box><Button leftIcon={<FaFileExcel />} colorScheme="green" onClick={onExcelModalOpen} mr={2}>Carga Masiva</Button><Button leftIcon={<AddIcon />} colorScheme="blue" onClick={onBulkModalOpen} mr={2}>Crear Múltiples</Button><Button leftIcon={<AddIcon />} colorScheme="teal" onClick={openCreateModal}>Nueva Unidad</Button></Box>
      </Box>

      {stats && (
        <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' }} gap={4} mb={6}>
          <Card><CardBody textAlign="center"><Text fontSize="2xl" fontWeight="bold">{stats.total_units}</Text><Text>Total</Text></CardBody></Card>
          <Card><CardBody textAlign="center"><Text fontSize="2xl" fontWeight="bold" color="green.500">{stats.available_units}</Text><Text>Disponibles</Text></CardBody></Card>
          <Card><CardBody textAlign="center"><Text fontSize="2xl" fontWeight="bold" color="yellow.500">{stats.reserved_units}</Text><Text>Reservadas</Text></CardBody></Card>
          <Card><CardBody textAlign="center"><Text fontSize="2xl" fontWeight="bold" color="blue.500">{stats.sold_units}</Text><Text>Vendidas</Text></CardBody></Card>
          <Card><CardBody textAlign="center"><Text fontSize="2xl" fontWeight="bold" color="purple.500">{stats.delivered_units}</Text><Text>Entregadas</Text></CardBody></Card>
          <Card><CardBody textAlign="center"><Text fontSize="2xl" fontWeight="bold">{formatCurrency(stats.total_value)}</Text><Text>Valor Total</Text></CardBody></Card>
        </Grid>
      )}

      <Tabs isLazy>
        <TabList>
          <Tab><ViewIcon mr={2} />Vista de Unidades</Tab>
          <Tab><TimeIcon mr={2} />Simulador de Ventas</Tab>
          <Tab><CheckCircleIcon mr={2} />Análisis</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', xl: 'repeat(4, 1fr)' }} gap={4}>
              {units.map((unit) => (
                <Card key={unit.id}>
                  <CardBody>
                    <Box display="flex" justifyContent="space-between" alignItems="start">
                      <Box display="flex" alignItems="center"><Icon as={getUnitTypeIcon(unit.unit_type)} mr={2} /><Text fontSize="lg" fontWeight="bold">{unit.unit_number}</Text></Box>
                      <Tag colorScheme={getStatusColorScheme(unit.status)} size="sm">{unit.status}</Tag>
                    </Box>
                    <Text fontSize="sm" color="gray.500">{unit.unit_type}</Text>
                    {unit.total_area_m2 && <Text>Área: {formatNumber(unit.total_area_m2)} m²</Text>}
                    {unit.target_price_total && <Text fontWeight="bold" mt={2}>Precio: {formatCurrency(unit.target_price_total)}</Text>}
                    <Box textAlign="right" mt={2}>
                      <IconButton aria-label="Edit" icon={<EditIcon />} size="sm" onClick={() => openEditModal(unit)} mr={1} />
                      <IconButton aria-label="Delete" icon={<DeleteIcon />} size="sm" colorScheme="red" onClick={() => handleDeleteUnit(unit.id)} />
                    </Box>
                  </CardBody>
                </Card>
              ))}
            </Grid>
          </TabPanel>
          <TabPanel>
            <UnitSalesSimulator units={units} projectId={projectId} onFinancialsRecalculated={handleDataRefresh} setSimulationResults={setSimulationResults} />
          </TabPanel>
          <TabPanel>
            <UnitsAnalysisTab 
              units={units} 
              simulationResults={simulationResults} 
              project={project} 
              activeSalesProjection={activeSalesProjection} 
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
      
      <BulkUnitsCreateModal isOpen={isBulkModalOpen} onClose={onBulkModalClose} projectId={Number(projectId)} onSuccess={() => handleDataRefresh()} />
      <ExcelUploadModal isOpen={isExcelModalOpen} onClose={onExcelModalClose} projectId={Number(projectId)} onUploadSuccess={() => handleDataRefresh()} />
      
      <Modal isOpen={isUnitModalOpen} onClose={onUnitModalClose} size="2xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editingUnit ? 'Editar Unidad' : 'Crear Nueva Unidad'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Grid templateColumns="repeat(2, 1fr)" gap={4} mt={2}>
              <FormControl isRequired>
                <FormLabel>Número de Unidad</FormLabel>
                <Input 
                  value={unitForm.unit_number || ''}
                  onChange={(e) => setUnitForm({ ...unitForm, unit_number: e.target.value })}
                  placeholder="Ej: A-101"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Tipo de Unidad</FormLabel>
                <Select
                  value={unitForm.unit_type || 'APARTAMENTO'}
                  onChange={(e) => setUnitForm({ ...unitForm, unit_type: e.target.value as any })}
                >
                  <option value="APARTAMENTO">Apartamento</option>
                  <option value="CASA">Casa</option>
                  <option value="LOTE">Lote</option>
                  <option value="OFICINA">Oficina</option>
                  <option value="LOCAL">Local</option>
                </Select>
              </FormControl>
               <FormControl>
                <FormLabel>Área de Construcción (m²)</FormLabel>
                <Input
                  type="number"
                  value={unitForm.construction_area_m2 || ''}
                  onChange={(e) => setUnitForm({ ...unitForm, construction_area_m2: e.target.value ? Number(e.target.value) : undefined })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Área de Terreno (m²)</FormLabel>
                <Input
                  type="number"
                  value={unitForm.land_area_m2 || ''}
                  onChange={(e) => setUnitForm({ ...unitForm, land_area_m2: e.target.value ? Number(e.target.value) : undefined })}
                />
              </FormControl>
               <FormControl>
                <FormLabel>Habitaciones</FormLabel>
                <Input
                  type="number"
                  value={unitForm.bedrooms || ''}
                  onChange={(e) => setUnitForm({ ...unitForm, bedrooms: e.target.value ? Number(e.target.value) : undefined })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Baños</FormLabel>
                <Input
                  type="number"
                  value={unitForm.bathrooms || ''}
                  onChange={(e) => setUnitForm({ ...unitForm, bathrooms: e.target.value ? Number(e.target.value) : undefined })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Estacionamientos</FormLabel>
                <Input
                  type="number"
                  value={unitForm.parking_spaces || ''}
                  onChange={(e) => setUnitForm({ ...unitForm, parking_spaces: e.target.value ? Number(e.target.value) : undefined })}
                />
              </FormControl>
               <FormControl>
                <FormLabel>Precio Objetivo Total</FormLabel>
                <Input
                  type="number"
                  value={unitForm.target_price_total || ''}
                  onChange={(e) => setUnitForm({ ...unitForm, target_price_total: e.target.value ? Number(e.target.value) : undefined })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Mes Venta Planificada</FormLabel>
                <Input
                  type="number"
                  value={unitForm.planned_sale_month || ''}
                  onChange={(e) => setUnitForm({ ...unitForm, planned_sale_month: e.target.value ? Number(e.target.value) : undefined })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Fecha de Entrega</FormLabel>
                <Input
                  type="date"
                  value={unitForm.delivery_date || ''}
                  onChange={(e) => setUnitForm({ ...unitForm, delivery_date: e.target.value || null })}
                />
              </FormControl>
               <FormControl>
                <FormLabel>Descripción</FormLabel>
                <Input
                  value={unitForm.description || ''}
                  onChange={(e) => setUnitForm({ ...unitForm, description: e.target.value })}
                />
              </FormControl>
            </Grid>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onUnitModalClose} mr={3}>Cancelar</Button>
            <Button colorScheme="blue" onClick={handleSaveUnit}>Guardar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </Box>
  );
};

export default ProjectUnitsManager;