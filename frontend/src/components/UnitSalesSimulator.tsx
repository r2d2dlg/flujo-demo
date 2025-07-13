import React, { useState, useEffect } from 'react';
import {
  Box,
  Text,
  Button,
  Grid,
  SimpleGrid,
  Alert,
  AlertIcon,
  Tag,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Input,
  FormControl,
  FormLabel,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Switch,
  Heading,
  VStack,
  HStack,
  Spinner,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  TableCaption,
  Progress,
  useToast,
  Select,
  Divider,
} from '@chakra-ui/react';
import {
  FaPlay as PlayIcon,
  FaChartLine as TrendingUpIcon,
  FaUniversity as BankIcon,
  FaMoneyBillWave as MoneyIcon,
} from 'react-icons/fa';
import { useParams } from 'react-router-dom';
import { projectUnits, unitSalesSimulations, salesProjections } from '../api/api';
import type {
  ProjectUnit,
  UnitSalesSimulationRequest,
  UnitSalesSimulationResponse,
  UnitSalesScenarioConfig,
  PaymentDistributionConfig,
  UnitSalesPaymentFlow,
} from '../types/projectUnitsTypes';
import type { SalesProjectionWithImpact } from '../api/api';
import { formatCurrency, formatNumber } from '../utils/formatters';

// Utility function to get scenario color
function getScenarioColor(scenarioName: string) {
  switch (scenarioName) {
    case 'optimista':
      return 'green';
    case 'realista':
      return 'blue';
    case 'conservador':
      return 'yellow';
    default:
      return 'gray';
  }
}

interface ScenarioBuilderProps {
  units: ProjectUnit[];
  scenarioName: 'optimista' | 'realista' | 'conservador';
  onScenarioChange: (scenario: UnitSalesScenarioConfig) => void;
}

const ScenarioBuilder: React.FC<ScenarioBuilderProps> = ({
  units,
  scenarioName,
  onScenarioChange,
}) => {
  const [unitsSchedule, setUnitsSchedule] = useState<Record<string, number>>({});
  const [description, setDescription] = useState('');

  const generateAutoScenario = () => {
    const newSchedule: Record<string, number> = {};
    const totalUnits = units.length;
    let salesPeriod: number;
    
    switch (scenarioName) {
      case 'optimista':
        salesPeriod = Math.max(12, totalUnits * 0.5);
        break;
      case 'realista':
        salesPeriod = Math.max(18, totalUnits * 0.8);
        break;
      case 'conservador':
        salesPeriod = Math.max(24, totalUnits * 1.2);
        break;
    }

    units.forEach((unit, index) => {
      if (unit.planned_sale_month) {
        newSchedule[unit.id.toString()] = unit.planned_sale_month;
      } else {
        const baseMonth = Math.floor((index / totalUnits) * salesPeriod) + 1;
        const variation = Math.floor(Math.random() * 3) - 1;
        newSchedule[unit.id.toString()] = Math.max(1, baseMonth + variation);
      }
    });

    setUnitsSchedule(newSchedule);
    
    const scenarioConfig: UnitSalesScenarioConfig = {
      scenario_name: scenarioName,
      units_schedule: newSchedule,
      description: description || `Escenario ${scenarioName} generado automáticamente`,
    };
    
    onScenarioChange(scenarioConfig);
  };

  const handleUnitMonthChange = (unitId: string, month: number) => {
    const newSchedule = { ...unitsSchedule, [unitId]: month };
    setUnitsSchedule(newSchedule);
    
    const scenarioConfig: UnitSalesScenarioConfig = {
      scenario_name: scenarioName,
      units_schedule: newSchedule,
      description: description,
    };
    
    onScenarioChange(scenarioConfig);
  };

  useEffect(() => {
    if (units.length > 0) {
      generateAutoScenario();
    }
  }, [units, scenarioName]);

  const getScenarioColor = () => {
    switch (scenarioName) {
      case 'optimista': return 'green';
      case 'realista': return 'blue';
      case 'conservador': return 'yellow';
      default: return 'gray';
    }
  };

  const getSalesDistribution = () => {
    const distribution: Record<number, ProjectUnit[]> = {};
    
    units.forEach(unit => {
      const month = unitsSchedule[unit.id.toString()] || 1;
      if (!distribution[month]) {
        distribution[month] = [];
      }
      distribution[month].push(unit);
    });

    return distribution;
  };

  const distribution = getSalesDistribution();
  const maxMonth = Math.max(...Object.keys(distribution).map(Number), 1);

  return (
    <Box>
      <HStack justifyContent="space-between" alignItems="center" mb={2}>
        <Heading as="h6" size="md">
          Escenario {scenarioName.charAt(0).toUpperCase() + scenarioName.slice(1)}
        </Heading>
        <Button
          variant="outline"
          size="sm"
          onClick={generateAutoScenario}
          colorScheme={getScenarioColor()}
        >
          Generar Auto
        </Button>
      </HStack>

      <Input
        placeholder="Descripción del Escenario"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        mb={2}
      />

      <Text fontWeight="bold" mb={2}>
        Distribución de Ventas por Mes
      </Text>
      
      <Box maxHeight="300px" overflowY="auto">
        {Array.from({ length: maxMonth }, (_, i) => i + 1).map(month => {
          const monthUnits = distribution[month] || [];
          const monthRevenue = monthUnits.reduce((sum, unit) => 
            sum + (unit.target_price_total || 0), 0);

          return (
            <Box key={month} mb={1} p={2} borderWidth="1px" borderRadius="md" bg={monthUnits.length > 0 ? 'gray.50' : 'transparent'}>
              <HStack justifyContent="space-between" alignItems="center">
                <Text fontSize="sm">
                  Mes {month}
                </Text>
                <HStack alignItems="center" spacing={4}>
                  <Text fontSize="sm">
                    {monthUnits.length} unidades
                  </Text>
                  <Text fontSize="sm" color="blue.500">
                    {formatCurrency(monthRevenue)}
                  </Text>
                </HStack>
              </HStack>
              
              {monthUnits.length > 0 && (
                <Box mt={1}>
                  {monthUnits.map(unit => (
                    <Tag
                      key={unit.id}
                      size="sm"
                      mr={1}
                      mb={1}
                      colorScheme={getScenarioColor()}
                      variant="outline"
                    >
                      {unit.unit_number}
                    </Tag>
                  ))}
                </Box>
              )}
            </Box>
          );
        })}
      </Box>

      <Accordion allowToggle mt={2}>
        <AccordionItem>
          <AccordionButton>
            <Box flex="1" textAlign="left" fontWeight="bold">
              Editar Unidades Individualmente
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={4}>
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={2}>
              {units.map(unit => (
                <HStack key={unit.id} spacing={2}>
                  <Text fontSize="sm" minW="80px">
                    {unit.unit_number}
                  </Text>
                  <Input
                    size="sm"
                    type="number"
                    placeholder="Mes"
                    value={unitsSchedule[unit.id.toString()] || ''}
                    onChange={(e) => handleUnitMonthChange(
                      unit.id.toString(), 
                      Number(e.target.value)
                    )}
                    maxW="80px"
                  />
                </HStack>
              ))}
            </SimpleGrid>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </Box>
  );
};

interface PaymentDistributionBuilderProps {
  onConfigChange: (config: PaymentDistributionConfig) => void;
  initialConfig?: PaymentDistributionConfig;
}

const PaymentDistributionBuilder: React.FC<PaymentDistributionBuilderProps> = ({
  onConfigChange,
  initialConfig
}) => {
  const [config, setConfig] = useState<PaymentDistributionConfig>({
    separation_payment_percentage: 10,
    separation_credit_line_percentage: 90,
    delivery_payment_percentage: 10,
    delivery_credit_line_percentage: 90,
    cash_payment_percentage: 100,
    mortgage_usage_percentage: 80,
    ...initialConfig
  });

  const handleConfigChange = (field: keyof PaymentDistributionConfig, value: number) => {
    const newConfig = { ...config, [field]: value };
    
    // Auto-adjust complementary percentages
    if (field === 'separation_payment_percentage') {
      newConfig.separation_credit_line_percentage = 100 - value;
    } else if (field === 'separation_credit_line_percentage') {
      newConfig.separation_payment_percentage = 100 - value;
    } else if (field === 'delivery_payment_percentage') {
      newConfig.delivery_credit_line_percentage = 100 - value;
    } else if (field === 'delivery_credit_line_percentage') {
      newConfig.delivery_payment_percentage = 100 - value;
    }
    
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  return (
    <Box p={4} mb={3} borderWidth="1px" borderRadius="md">
      <HStack alignItems="center" mb={2}>
        <BankIcon color="blue.500" />
        <Heading as="h6" size="md">
          Configuración de Distribución de Pagos
        </Heading>
      </HStack>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <Box p={4} borderWidth="1px" borderRadius="md">
          <Heading as="h6" size="md" color="blue.500" mb={2}>
            <MoneyIcon style={{ fontSize: 16, marginRight: 8 }} />
            Pago de Separación
          </Heading>
          <Text fontSize="sm" color="gray.600" mb={2}>
            Distribución del pago inicial cuando el cliente separa la unidad
          </Text>
          
          <FormControl mb={4}>
            <FormLabel>Porcentaje al Desarrollador: {config.separation_payment_percentage}%</FormLabel>
            <Slider
              value={config.separation_payment_percentage || 10}
              onChange={(value) => handleConfigChange('separation_payment_percentage', value as number)}
              min={0}
              max={100}
              step={5}
              colorScheme="blue"
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb />
            </Slider>
          </FormControl>

          <Text fontSize="sm" color="gray.600">
            A línea de crédito: {config.separation_credit_line_percentage}%
          </Text>
        </Box>

        <Box p={4} borderWidth="1px" borderRadius="md">
          <Heading as="h6" size="md" color="blue.500" mb={2}>
            <BankIcon color="blue.500" />
            Pago de Entrega
          </Heading>
          <Text fontSize="sm" color="gray.600" mb={2}>
            Distribución del pago final cuando se entrega la unidad (hipoteca bancaria)
          </Text>
          
          <FormControl mb={4}>
            <FormLabel>Porcentaje al Desarrollador: {config.delivery_payment_percentage}%</FormLabel>
            <Slider
              value={config.delivery_payment_percentage || 10}
              onChange={(value) => handleConfigChange('delivery_payment_percentage', value as number)}
              min={0}
              max={100}
              step={5}
              colorScheme="blue"
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb />
            </Slider>
          </FormControl>

          <Text fontSize="sm" color="gray.600">
            A línea de crédito: {config.delivery_credit_line_percentage}%
          </Text>
        </Box>

        <Box p={4} borderWidth="1px" borderRadius="md">
          <FormControl>
            <FormLabel>Porcentaje de Unidades con Hipoteca: {config.mortgage_usage_percentage}%</FormLabel>
            <Slider
              value={config.mortgage_usage_percentage || 80}
              onChange={(value) => handleConfigChange('mortgage_usage_percentage', value as number)}
              min={0}
              max={100}
              step={10}
              colorScheme="blue"
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb />
            </Slider>
            <Text fontSize="sm" color="gray.600" mt={2}>
              Las unidades restantes se pagan en efectivo (100% al desarrollador)
            </Text>
          </FormControl>
        </Box>

        <Box p={4} borderWidth="1px" borderRadius="md">
          <Alert status="info" variant="subtle">
            <HStack alignItems="center">
              <AlertIcon />
              <Text fontSize="sm">
                <strong>Ejemplo:</strong> Si una unidad cuesta $100,000 y usa hipoteca:
                <br />• Separación: ${((config.separation_payment_percentage || 10) * 1000).toLocaleString()} al desarrollador, ${((config.separation_credit_line_percentage || 90) * 1000).toLocaleString()} a línea de crédito
                <br />• Entrega: ${((config.delivery_payment_percentage || 10) * 900).toLocaleString()} al desarrollador, ${((config.delivery_credit_line_percentage || 90) * 900).toLocaleString()} a línea de crédito
              </Text>
            </HStack>
          </Alert>
        </Box>
      </SimpleGrid>
    </Box>
  );
};

interface ScenarioManagerProps {
  projectId: number;
  onScenarioActivated?: () => void;
}

const ScenarioManager: React.FC<ScenarioManagerProps> = ({ projectId, onScenarioActivated }) => {
  const [projections, setProjections] = useState<SalesProjectionWithImpact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProjections = async () => {
    try {
      setLoading(true);
      const response = await salesProjections.getProjections(projectId);
      setProjections(response.data);
    } catch (err: any) {
      setError('Error al cargar las proyecciones');
      console.error('Error loading projections:', err);
    } finally {
      setLoading(false);
    }
  };

  const activateProjection = async (projectionId: number) => {
    try {
      setLoading(true);
      await salesProjections.activateProjection(projectId, projectionId);
      await loadProjections(); // Reload to update active status
      onScenarioActivated?.();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al activar la proyección');
    } finally {
      setLoading(false);
    }
  };

  const deleteProjection = async (projectionId: number) => {
    if (!confirm('¿Está seguro de que desea eliminar esta proyección?')) {
      return;
    }

    try {
      setLoading(true);
      await salesProjections.deleteProjection(projectId, projectionId);
      await loadProjections(); // Reload after deletion
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al eliminar la proyección');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjections();
  }, [projectId]);

  const getScenarioColor = (scenarioName: string) => {
    if (scenarioName.toLowerCase().includes('optimista')) return 'green';
    if (scenarioName.toLowerCase().includes('realista')) return 'blue';
    if (scenarioName.toLowerCase().includes('conservador')) return 'yellow';
    return 'gray';
  };

  const formatScenarioName = (scenarioName: string) => {
    return scenarioName.replace('_simulation', '').replace('_', ' ').toUpperCase();
  };

  if (projections.length === 0 && !loading) {
    return (
      <Alert status="info" mb={2}>
        <HStack alignItems="center">
          <AlertIcon />
          <Heading as="h6" size="sm" mb={1}>
            No hay escenarios guardados
          </Heading>
          <Text fontSize="sm">
            Ejecute una simulación para crear escenarios que puedan impactar el flujo de caja del proyecto.
          </Text>
        </HStack>
      </Alert>
    );
  }

  return (
    <Box p={4} mb={3} borderWidth="1px" borderRadius="md">
      {error && (
        <Alert status="error" mb={2}>
          {error}
        </Alert>
      )}

      <HStack justifyContent="space-between" alignItems="center" mb={2}>
        <Heading as="h6" size="md">
          🎯 Gestión de Escenarios
        </Heading>
        <Button
          variant="outline"
          size="sm"
          onClick={loadProjections}
          isDisabled={loading}
        >
          Actualizar
        </Button>
      </HStack>

      <Text fontSize="sm" color="gray.600" mb={2}>
        Los escenarios activos reemplazan el flujo de caja genérico con datos detallados de la simulación de ventas.
      </Text>

      {loading && <Progress size="sm" mb={2} />}

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
        {projections.map((projection) => (
          <Box key={projection.id} p={4} borderWidth="1px" borderRadius="md" borderColor={projection.is_active ? 'blue.200' : 'gray.200'} bg={projection.is_active ? 'blue.50' : 'white'}>
            <HStack justifyContent="space-between" alignItems="flex-start" mb={1}>
              <HStack alignItems="center" spacing={1}>
                <Tag
                  colorScheme={getScenarioColor(projection.scenario_name)}
                  size="sm"
                  variant={projection.is_active ? "solid" : "outline"}
                >
                  {formatScenarioName(projection.scenario_name)}
                </Tag>
                {projection.is_active && (
                  <Tag colorScheme="blue" size="sm"><PlayIcon style={{ marginRight: 4 }} />ACTIVO</Tag>
                )}
              </HStack>
            </HStack>

            {projection.impact_summary && (
              <Box mt={2}>
                <Text fontSize="sm" color="gray.600" mb={1}>
                  Resumen del Impacto:
                </Text>
                <VStack align="stretch" spacing={1} fontSize="0.875rem">
                  <Text>
                    <strong>Ingresos:</strong> {formatCurrency(projection.impact_summary.total_revenue)}
                  </Text>
                  <Text>
                    <strong>Unidades:</strong> {projection.impact_summary.total_units}
                  </Text>
                  <Text>
                    <strong>Duración:</strong> {projection.impact_summary.project_duration_months} meses
                  </Text>
                </VStack>
              </Box>
            )}

            <Text fontSize="xs" color="gray.600" mt={1} display="block">
              Creado: {new Date(projection.created_at).toLocaleDateString()}
            </Text>

            <HStack justifyContent="space-between" alignItems="center" mt={2}>
              {!projection.is_active ? (
                <Button
                  colorScheme="blue"
                  size="sm"
                  onClick={() => activateProjection(projection.id)}
                  isDisabled={loading}
                  leftIcon={<PlayIcon />}
                >
                  Activar
                </Button>
              ) : (
                <Tag colorScheme="green" size="sm"><TrendingUpIcon style={{ marginRight: 4 }} />EN USO EN FLUJO DE CAJA</Tag>
              )}
              
              <Button
                variant="outline"
                size="sm"
                color="red"
                onClick={() => deleteProjection(projection.id)}
                isDisabled={loading}
              >
                Eliminar
              </Button>
            </HStack>
          </Box>
        ))}
      </SimpleGrid>

      {projections.some(p => p.is_active) && (
        <Alert status="success" mt={2}>
          <HStack alignItems="center">
            <AlertIcon />
            <Heading as="h6" size="sm" mb={1}>
              ✅ Escenario Activo Detectado
            </Heading>
            <Text fontSize="sm">
              El flujo de caja del proyecto está usando datos detallados de la simulación en lugar del flujo genérico.
              Los ingresos por ventas incluyen pagos de separación, entrega, y flujos de hipotecas.
            </Text>
          </HStack>
        </Alert>
      )}
    </Box>
  );
};

interface UnitSalesSimulatorProps {
  units: ProjectUnit[];
  projectId: string | number;
  onFinancialsRecalculated: () => void;
  setSimulationResults: (results: any) => void;
}

const UnitSalesSimulator: React.FC<UnitSalesSimulatorProps> = ({ units, projectId, onFinancialsRecalculated, setSimulationResults }) => {
  // Remove useParams and internal units state
  // const { projectId } = useParams<{ projectId: string }>();
  // const [units, setUnits] = useState<ProjectUnit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simulationResults, setSimulationResultsLocal] = useState<UnitSalesSimulationResponse | null>(null);
  const [scenarioManagerKey, setScenarioManagerKey] = useState(0);
  
  const [optimisticScenario, setOptimisticScenario] = useState<UnitSalesScenarioConfig | null>(null);
  const [realisticScenario, setRealisticScenario] = useState<UnitSalesScenarioConfig | null>(null);
  const [conservativeScenario, setConservativeScenario] = useState<UnitSalesScenarioConfig | null>(null);
  const [paymentDistribution, setPaymentDistribution] = useState<PaymentDistributionConfig | null>(null);
  const [useAdvancedSimulation, setUseAdvancedSimulation] = useState(true);

  // Remove useEffect that loads units
  // useEffect(() => {
  //   if (projectId) {
  //     loadUnits();
  //   }
  // }, [projectId]);

  // Remove loadUnits function

  const runSimulation = async () => {
    if (!optimisticScenario || !realisticScenario || !conservativeScenario) {
      setError('Debe configurar los tres escenarios antes de ejecutar la simulación');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const request: UnitSalesSimulationRequest = {
        optimistic_scenario: optimisticScenario,
        realistic_scenario: realisticScenario,
        conservative_scenario: conservativeScenario,
        payment_distribution: useAdvancedSimulation ? paymentDistribution : undefined,
      };

      // Always use the new simulation endpoint
      const response = await unitSalesSimulations.simulateUnitSalesWithPaymentDistribution(Number(projectId), request);
      
      setSimulationResultsLocal(response.data); // Update parent
      setSimulationResults(response.data); // Update local state
      
      // Force scenario manager to reload after simulation
      setScenarioManagerKey(prev => prev + 1);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al ejecutar la simulación');
      console.error('Error running simulation:', err);
    } finally {
      setLoading(false);
    }
  };

  if (units.length === 0 && !loading) {
    return (
      <Box p={3} textAlign="center">
        <Heading as="h6" color="gray.600">
          No hay unidades creadas para este proyecto
        </Heading>
        <Text fontSize="sm" color="gray.600" mt={1}>
          Primero debe crear las unidades del proyecto para poder simular las ventas
        </Text>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {error && (
        <Alert status="error" mb={2}>
          {error}
        </Alert>
      )}

      <HStack justifyContent="space-between" alignItems="center" mb={3}>
        <Heading as="h4" size="lg">
          Simulador de Ventas por Unidades
        </Heading>
        <HStack alignItems="center" spacing={2}>
          <FormControl display="flex" alignItems="center" mb={0}>
            <Switch
              isChecked={useAdvancedSimulation}
              onChange={(e) => setUseAdvancedSimulation(e.target.checked)}
              colorScheme="blue"
            />
            <FormLabel mb="0" htmlFor="use-advanced-simulation" fontSize="sm">
              Simulación Avanzada con Líneas de Crédito
            </FormLabel>
          </FormControl>
          <Button
            colorScheme="blue"
            leftIcon={<PlayIcon />}
            onClick={runSimulation}
            isDisabled={loading || !optimisticScenario || !realisticScenario || !conservativeScenario}
          >
            {loading ? 'Simulando...' : 'Ejecutar Simulación'}
          </Button>
        </HStack>
      </HStack>

      {loading && <Progress size="sm" mb={2} />}

      {/* Scenario Management */}
      <ScenarioManager
        key={scenarioManagerKey}
        projectId={Number(projectId)}
        onScenarioActivated={() => {
          console.log('Scenario activated! Calling onFinancialsRecalculated to refresh project metrics.');
          // Call the callback to notify parent components that financials have changed
          onFinancialsRecalculated();
          // Also dispatch the custom event for backward compatibility
          window.dispatchEvent(new CustomEvent('scenarioActivated'));
          // If we're in an iframe, notify the parent window as well
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'scenarioActivated', projectId }, '*');
          }
        }}
      />

      {/* Payment Distribution Configuration */}
      {useAdvancedSimulation && (
        <PaymentDistributionBuilder
          onConfigChange={setPaymentDistribution}
          initialConfig={paymentDistribution || undefined}
        />
      )}

      <Box p={2} mb={3} borderWidth="1px" borderRadius="md">
        <Heading as="h6" mb={2}>
          Resumen del Proyecto
        </Heading>
        <SimpleGrid columns={{ base: 2, sm: 4 }} spacing={2}>
          <Box p={2} borderWidth="1px" borderRadius="md" textAlign="center">
            <Heading as="h4" color="blue.500">
              {units.length}
            </Heading>
            <Text fontSize="sm" color="gray.600">
              Total Unidades
            </Text>
          </Box>
          <Box p={2} borderWidth="1px" borderRadius="md" textAlign="center">
            <Heading as="h4" color="green.500">
              {formatCurrency(units.reduce((sum, unit) => sum + (unit.target_price_total || 0), 0))}
            </Heading>
            <Text fontSize="sm" color="gray.600">
              Valor Total
            </Text>
          </Box>
          <Box p={2} borderWidth="1px" borderRadius="md" textAlign="center">
            <Heading as="h4">
              {formatNumber(units.reduce((sum, unit) => sum + (unit.total_area_m2 || 0), 0))}
            </Heading>
            <Text fontSize="sm" color="gray.600">
              Área Total m²
            </Text>
          </Box>
          <Box p={2} borderWidth="1px" borderRadius="md" textAlign="center">
            <Heading as="h4">
              {units.length > 0 ? formatCurrency(units.reduce((sum, unit) => sum + (unit.target_price_total || 0), 0) / units.length) : '$0'}
            </Heading>
            <Text fontSize="sm" color="gray.600">
              Precio Promedio
            </Text>
          </Box>
        </SimpleGrid>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3} mb={3}>
        <Box p={2} borderWidth="1px" borderRadius="md" height="100%">
          <ScenarioBuilder
            units={units}
            scenarioName="optimista"
            onScenarioChange={setOptimisticScenario}
          />
        </Box>
        <Box p={2} borderWidth="1px" borderRadius="md" height="100%">
          <ScenarioBuilder
            units={units}
            scenarioName="realista"
            onScenarioChange={setRealisticScenario}
          />
        </Box>
        <Box p={2} borderWidth="1px" borderRadius="md" height="100%">
          <ScenarioBuilder
            units={units}
            scenarioName="conservador"
            onScenarioChange={setConservativeScenario}
          />
        </Box>
      </SimpleGrid>
 
      {simulationResults && (
        <Box p={3} borderWidth="1px" borderRadius="md">
          <Heading as="h5" mb={2}>
            Resultados de la Simulación
          </Heading>
            
            {simulationResults.scenarios.map((scenario, index) => (
             <Accordion allowToggle key={index}>
               <AccordionItem>
                 <AccordionButton>
                   <HStack alignItems="center" spacing={2}>
                     <TrendingUpIcon />
                     <Heading as="h6" size="md">
                       Escenario {scenario.scenario_name}
                     </Heading>
                     <Tag 
                       colorScheme={scenario.scenario_name === 'optimista' ? 'green' : 
                            scenario.scenario_name === 'realista' ? 'blue' : 'yellow'}
                       size="sm"
                     >
                       {scenario.total_units_sold} unidades
                     </Tag>
                   </HStack>
                 </AccordionButton>
                 <AccordionPanel pb={4}>
                   <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={3}>
                     <Box p={2} borderWidth="1px" borderRadius="md" textAlign="center">
                       <Heading as="h6" color="blue.500">
                         {formatCurrency(scenario.total_revenue)}
                       </Heading>
                       <Text fontSize="sm" color="gray.600">
                         Ingresos Totales
                       </Text>
                     </Box>
                     <Box p={2} borderWidth="1px" borderRadius="md" textAlign="center">
                       <Heading as="h6" size="md">
                         {scenario.sales_period_months} meses
                       </Heading>
                       <Text fontSize="sm" color="gray.600">
                         Período de Ventas
                       </Text>
                     </Box>
                     <Box p={2} borderWidth="1px" borderRadius="md" textAlign="center">
                       <Heading as="h6" size="md">
                         {formatNumber(scenario.average_monthly_sales)} unidades
                       </Heading>
                       <Text fontSize="sm" color="gray.600">
                         Promedio Mensual
                       </Text>
                     </Box>
                     <Box p={2} borderWidth="1px" borderRadius="md" textAlign="center">
                       <Heading as="h6" size="md">
                         {scenario.npv ? formatCurrency(scenario.npv) : 'N/A'}
                       </Heading>
                       <Text fontSize="sm" color="gray.600">
                         VPN
                       </Text>
                     </Box>
                   </SimpleGrid>
 
                   {/* Advanced simulation results */}
                   {useAdvancedSimulation && scenario.developer_cash_flow && (
                     <>
                       <Divider my={3} />
                       
                       <Heading as="h6" mb={2}>
                         <MoneyIcon style={{ fontSize: 20, marginRight: 8 }} />
                         Flujo de Caja del Desarrollador
                       </Heading>
                       
                       <TableContainer>
                         <Table size="sm">
                           <Thead>
                             <Tr>
                               <Th>Mes</Th>
                               <Th textAlign="right">Pagos Separación</Th>
                               <Th textAlign="right">Pagos Entrega</Th>
                               <Th textAlign="right">Total Mensual</Th>
                             </Tr>
                           </Thead>
                           <Tbody>
                             {scenario.developer_cash_flow.slice(0, 10).map((flow, idx) => (
                               <Tr key={idx}>
                                 <Td>Mes {flow.month}</Td>
                                 <Td textAlign="right">{formatCurrency(flow.separation || 0)}</Td>
                                 <Td textAlign="right">{formatCurrency(flow.delivery || 0)}</Td>
                                 <Td textAlign="right" fontWeight="bold">
                                   {formatCurrency(flow.total || 0)}
                                 </Td>
                               </Tr>
                             ))}
                           </Tbody>
                         </Table>
                       </TableContainer>
 
                       {scenario.credit_line_impact && scenario.credit_line_impact.length > 0 && (
                         <>
                           <Heading as="h6" mb={2} mt={3}>
                             <BankIcon style={{ fontSize: 20, marginRight: 8 }} />
                             Impacto en Líneas de Crédito
                           </Heading>
                           
                           <TableContainer>
                             <Table size="sm">
                               <Thead>
                                 <Tr>
                                   <Th>Mes</Th>
                                   <Th textAlign="right">Pagos Separación</Th>
                                   <Th textAlign="right">Pagos Entrega</Th>
                                   <Th textAlign="right">Total a Línea</Th>
                                 </Tr>
                               </Thead>
                               <Tbody>
                                 {scenario.credit_line_impact.slice(0, 10).map((impact, idx) => (
                                   <Tr key={idx}>
                                     <Td>Mes {impact.month}</Td>
                                     <Td textAlign="right">{formatCurrency(impact.separation_payment || 0)}</Td>
                                     <Td textAlign="right">{formatCurrency(impact.delivery_payment || 0)}</Td>
                                     <Td textAlign="right" fontWeight="bold" color="green.500">
                                       {formatCurrency(impact.total_payment || 0)}
                                     </Td>
                                   </Tr>
                                 ))}
                               </Tbody>
                             </Table>
                           </TableContainer>
                         </>
                       )}
                     </>
                   )}
 
                   <Divider my={2} />
                   
                   <Heading as="h6" mb={1}>
                     Distribución de Ventas por Mes
                   </Heading>
                   <Box maxHeight="200px" overflowY="auto">
                     {Object.entries(scenario.monthly_sales_distribution).map(([month, count]) => (
                       <Tag
                         key={month}
                         size="sm"
                         variant="outline"
                         mr={1}
                         mb={1}
                       >
                         Mes {month}: {count} unidades
                       </Tag>
                     ))}
                   </Box>
                 </AccordionPanel>
               </AccordionItem>
             </Accordion>
           ))}
 
           {/* Payment Flows Summary for Advanced Simulation */}
           {useAdvancedSimulation && simulationResults.payment_flows && (
             <Accordion allowToggle mt={2}>
               <AccordionItem>
                 <AccordionButton>
                   <HStack alignItems="center" spacing={2}>
                     <BankIcon color="blue.500" />
                     <Heading as="h6" size="md">
                       Detalle de Flujos de Pago por Unidad
                     </Heading>
                     <Tag 
                       colorScheme="info"
                       size="sm"
                     >
                       {simulationResults.payment_flows.length} flujos
                     </Tag>
                   </HStack>
                 </AccordionButton>
                 <AccordionPanel pb={4}>
                   <TableContainer maxHeight="400px">
                     <Table size="sm">
                       <Thead>
                         <Tr>
                           <Th>Unidad</Th>
                           <Th>Mes Venta</Th>
                           <Th textAlign="right">Precio</Th>
                           <Th textAlign="center">Hipoteca</Th>
                           <Th textAlign="right">Dev. Separación</Th>
                           <Th textAlign="right">Dev. Entrega</Th>
                           <Th textAlign="right">Línea Separación</Th>
                           <Th textAlign="right">Línea Entrega</Th>
                         </Tr>
                       </Thead>
                       <Tbody>
                         {simulationResults.payment_flows.slice(0, 50).map((flow, idx) => (
                           <Tr key={idx}>
                             <Td>{flow.unit_number}</Td>
                             <Td>{flow.sale_month}</Td>
                             <Td textAlign="right">{formatCurrency(flow.sale_price)}</Td>
                             <Td textAlign="center">
                               <Tag 
                                 colorScheme={flow.uses_mortgage ? 'green' : 'gray'}
                                 size="sm"
                               >
                                 {flow.uses_mortgage ? 'Sí' : 'No'}
                               </Tag>
                             </Td>
                             <Td textAlign="right">{formatCurrency(flow.developer_separation)}</Td>
                             <Td textAlign="right">{formatCurrency(flow.developer_delivery)}</Td>
                             <Td textAlign="right">{formatCurrency(flow.credit_line_separation)}</Td>
                             <Td textAlign="right">{formatCurrency(flow.credit_line_delivery)}</Td>
                           </Tr>
                         ))}
                       </Tbody>
                     </Table>
                   </TableContainer>
                   
                   {simulationResults.payment_flows.length > 50 && (
                     <Alert status="info" mt={2}>
                       Mostrando los primeros 50 flujos de {simulationResults.payment_flows.length} total
                     </Alert>
                   )}
                 </AccordionPanel>
               </AccordionItem>
             </Accordion>
           )}
 
           {/* Company Impact Summary */}
           {simulationResults.company_impact && (
             <Box mt={3}>
               <Heading as="h6" mb={2}>
                 Impacto en la Empresa
               </Heading>
               <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={2}>
                 <Box p={2} borderWidth="1px" borderRadius="md" textAlign="center">
                   <Heading as="h6" color="blue.500">
                     {formatCurrency(simulationResults.company_impact.max_capital_exposure || 0)}
                   </Heading>
                   <Text fontSize="sm" color="gray.600">
                     Máxima Exposición de Capital
                   </Text>
                 </Box>
                 <Box p={2} borderWidth="1px" borderRadius="md" textAlign="center">
                   <Heading as="h6" color="yellow.500">
                     {formatCurrency(simulationResults.company_impact.liquidity_impact?.recommended_credit_line || 0)}
                   </Heading>
                   <Text fontSize="sm" color="gray.600">
                     Línea de Crédito Recomendada
                   </Text>
                 </Box>
                 <Box p={2} borderWidth="1px" borderRadius="md" textAlign="center">
                   <Heading as="h6" color="blue.500">
                     {formatCurrency(simulationResults.company_impact.liquidity_impact?.cash_reserve_needed || 0)}
                   </Heading>
                   <Text fontSize="sm" color="gray.600">
                     Reserva de Efectivo
                   </Text>
                 </Box>
                 <Box p={2} borderWidth="1px" borderRadius="md" textAlign="center">
                   <Tag 
                     colorScheme={
                       simulationResults.company_impact.liquidity_impact?.risk_level === 'LOW' ? 'green' :
                       simulationResults.company_impact.liquidity_impact?.risk_level === 'HIGH' ? 'red' : 'yellow'
                     }
                     size="sm"
                   >
                     {simulationResults.company_impact.liquidity_impact?.risk_level || 'MEDIO'}
                   </Tag>
                   <Text fontSize="sm" color="gray.600" mt={1}>
                     Nivel de Riesgo
                   </Text>
                 </Box>
               </SimpleGrid>
 
               {simulationResults.company_impact.recommendations && (
                 <Alert status="info" mt={2}>
                   <Heading as="h6" size="sm" mb={1}>Recomendaciones:</Heading>
                   <VStack align="stretch" spacing={1} fontSize="sm">
                     {simulationResults.company_impact.recommendations.map((rec: string, idx: number) => (
                       <Text key={idx}>{rec}</Text>
                     ))}
                   </VStack>
                 </Alert>
               )}
             </Box>
           )}
         </Box>
       )}
     </Box>
   );
 };
 
 export default UnitSalesSimulator;