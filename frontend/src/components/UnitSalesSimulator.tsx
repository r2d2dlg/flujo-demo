import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  LinearProgress,
  TextField,
  FormControl,
  FormLabel,
  Slider,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  ExpandMore as ExpandMoreIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as BankIcon,
  MonetizationOn as MoneyIcon,
} from '@mui/icons-material';
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
      case 'optimista': return 'success';
      case 'realista': return 'primary';
      case 'conservador': return 'warning';
      default: return 'default';
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          Escenario {scenarioName.charAt(0).toUpperCase() + scenarioName.slice(1)}
        </Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={generateAutoScenario}
          color={getScenarioColor() as any}
        >
          Generar Auto
        </Button>
      </Box>

      <TextField
        fullWidth
        label="Descripción del Escenario"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        sx={{ mb: 2 }}
      />

      <Typography variant="subtitle2" gutterBottom>
        Distribución de Ventas por Mes
      </Typography>
      
      <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
        {Array.from({ length: maxMonth }, (_, i) => i + 1).map(month => {
          const monthUnits = distribution[month] || [];
          const monthRevenue = monthUnits.reduce((sum, unit) => 
            sum + (unit.target_price_total || 0), 0);

          return (
            <Card key={month} sx={{ mb: 1, bgcolor: monthUnits.length > 0 ? 'action.hover' : 'transparent' }}>
              <CardContent sx={{ py: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">
                    Mes {month}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Typography variant="body2">
                      {monthUnits.length} unidades
                    </Typography>
                    <Typography variant="body2" color="primary">
                      {formatCurrency(monthRevenue)}
                    </Typography>
                  </Box>
                </Box>
                
                {monthUnits.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    {monthUnits.map(unit => (
                      <Chip
                        key={unit.id}
                        label={unit.unit_number}
                        size="small"
                        sx={{ mr: 0.5, mb: 0.5 }}
                        color={getScenarioColor() as any}
                        variant="outlined"
                      />
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Box>

      <Accordion sx={{ mt: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle2">
            Editar Unidades Individualmente
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {units.map(unit => (
              <Grid item xs={12} sm={6} md={4} key={unit.id}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2" sx={{ minWidth: 80 }}>
                    {unit.unit_number}
                  </Typography>
                  <TextField
                    size="small"
                    type="number"
                    label="Mes"
                    value={unitsSchedule[unit.id.toString()] || ''}
                    onChange={(e) => handleUnitMonthChange(
                      unit.id.toString(), 
                      Number(e.target.value)
                    )}
                    inputProps={{ min: 1, max: 60 }}
                    sx={{ width: 80 }}
                  />
                </Box>
              </Grid>
            ))}
          </Grid>
        </AccordionDetails>
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
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <BankIcon color="primary" />
        <Typography variant="h6">
          Configuración de Distribución de Pagos
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom color="primary">
                <MoneyIcon sx={{ fontSize: 16, mr: 1 }} />
                Pago de Separación
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Distribución del pago inicial cuando el cliente separa la unidad
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <FormLabel>Porcentaje al Desarrollador: {config.separation_payment_percentage}%</FormLabel>
                <Slider
                  value={config.separation_payment_percentage || 10}
                  onChange={(_, value) => handleConfigChange('separation_payment_percentage', value as number)}
                  min={0}
                  max={100}
                  step={5}
                  marks={[
                    { value: 0, label: '0%' },
                    { value: 25, label: '25%' },
                    { value: 50, label: '50%' },
                    { value: 75, label: '75%' },
                    { value: 100, label: '100%' }
                  ]}
                />
              </FormControl>

              <Typography variant="body2" color="text.secondary">
                A línea de crédito: {config.separation_credit_line_percentage}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom color="primary">
                <BankIcon sx={{ fontSize: 16, mr: 1 }} />
                Pago de Entrega
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Distribución del pago final cuando se entrega la unidad (hipoteca bancaria)
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <FormLabel>Porcentaje al Desarrollador: {config.delivery_payment_percentage}%</FormLabel>
                <Slider
                  value={config.delivery_payment_percentage || 10}
                  onChange={(_, value) => handleConfigChange('delivery_payment_percentage', value as number)}
                  min={0}
                  max={100}
                  step={5}
                  marks={[
                    { value: 0, label: '0%' },
                    { value: 25, label: '25%' },
                    { value: 50, label: '50%' },
                    { value: 75, label: '75%' },
                    { value: 100, label: '100%' }
                  ]}
                />
              </FormControl>

              <Typography variant="body2" color="text.secondary">
                A línea de crédito: {config.delivery_credit_line_percentage}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <FormLabel>Porcentaje de Unidades con Hipoteca: {config.mortgage_usage_percentage}%</FormLabel>
            <Slider
              value={config.mortgage_usage_percentage || 80}
              onChange={(_, value) => handleConfigChange('mortgage_usage_percentage', value as number)}
              min={0}
              max={100}
              step={10}
              marks={[
                { value: 0, label: '0%' },
                { value: 50, label: '50%' },
                { value: 80, label: '80%' },
                { value: 100, label: '100%' }
              ]}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Las unidades restantes se pagan en efectivo (100% al desarrollador)
            </Typography>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <Alert severity="info">
            <Typography variant="body2">
              <strong>Ejemplo:</strong> Si una unidad cuesta $100,000 y usa hipoteca:
              <br />• Separación: ${((config.separation_payment_percentage || 10) * 1000).toLocaleString()} al desarrollador, ${((config.separation_credit_line_percentage || 90) * 1000).toLocaleString()} a línea de crédito
              <br />• Entrega: ${((config.delivery_payment_percentage || 10) * 900).toLocaleString()} al desarrollador, ${((config.delivery_credit_line_percentage || 90) * 900).toLocaleString()} a línea de crédito
            </Typography>
          </Alert>
        </Grid>
      </Grid>
    </Paper>
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
    if (scenarioName.toLowerCase().includes('optimista')) return 'success';
    if (scenarioName.toLowerCase().includes('realista')) return 'primary';
    if (scenarioName.toLowerCase().includes('conservador')) return 'warning';
    return 'default';
  };

  const formatScenarioName = (scenarioName: string) => {
    return scenarioName.replace('_simulation', '').replace('_', ' ').toUpperCase();
  };

  if (projections.length === 0 && !loading) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          No hay escenarios guardados
        </Typography>
        <Typography variant="body2">
          Ejecute una simulación para crear escenarios que puedan impactar el flujo de caja del proyecto.
        </Typography>
      </Alert>
    );
  }

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          🎯 Gestión de Escenarios
        </Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={loadProjections}
          disabled={loading}
        >
          Actualizar
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Los escenarios activos reemplazan el flujo de caja genérico con datos detallados de la simulación de ventas.
      </Typography>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Grid container spacing={2}>
        {projections.map((projection) => (
          <Grid item xs={12} md={6} lg={4} key={projection.id}>
            <Card 
              variant={projection.is_active ? "elevation" : "outlined"}
              sx={{ 
                border: projection.is_active ? 2 : 1,
                borderColor: projection.is_active ? 'primary.main' : 'divider',
                bgcolor: projection.is_active ? 'primary.50' : 'background.paper'
              }}
            >
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip
                      label={formatScenarioName(projection.scenario_name)}
                      color={getScenarioColor(projection.scenario_name) as any}
                      size="small"
                      variant={projection.is_active ? "filled" : "outlined"}
                    />
                    {projection.is_active && (
                      <Chip
                        label="ACTIVO"
                        color="primary"
                        size="small"
                        icon={<PlayIcon />}
                      />
                    )}
                  </Box>
                </Box>

                {projection.impact_summary && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Resumen del Impacto:
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, fontSize: '0.875rem' }}>
                      <Typography variant="caption">
                        <strong>Ingresos:</strong> {formatCurrency(projection.impact_summary.total_revenue)}
                      </Typography>
                      <Typography variant="caption">
                        <strong>Unidades:</strong> {projection.impact_summary.total_units}
                      </Typography>
                      <Typography variant="caption" sx={{ gridColumn: '1 / -1' }}>
                        <strong>Duración:</strong> {projection.impact_summary.project_duration_months} meses
                      </Typography>
                    </Box>
                  </Box>
                )}

                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Creado: {new Date(projection.created_at).toLocaleDateString()}
                </Typography>

                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
                  {!projection.is_active ? (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => activateProjection(projection.id)}
                      disabled={loading}
                      startIcon={<PlayIcon />}
                    >
                      Activar
                    </Button>
                  ) : (
                    <Chip
                      label="En uso en Flujo de Caja"
                      color="success"
                      size="small"
                      icon={<TrendingUpIcon />}
                    />
                  )}
                  
                  <Button
                    variant="outlined"
                    size="small"
                    color="error"
                    onClick={() => deleteProjection(projection.id)}
                    disabled={loading}
                  >
                    Eliminar
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {projections.some(p => p.is_active) && (
        <Alert severity="success" sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            ✅ Escenario Activo Detectado
          </Typography>
          <Typography variant="body2">
            El flujo de caja del proyecto está usando datos detallados de la simulación en lugar del flujo genérico.
            Los ingresos por ventas incluyen pagos de separación, entrega, y flujos de hipotecas.
          </Typography>
        </Alert>
      )}
    </Paper>
  );
};

const UnitSalesSimulator: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [units, setUnits] = useState<ProjectUnit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simulationResults, setSimulationResults] = useState<UnitSalesSimulationResponse | null>(null);
  const [scenarioManagerKey, setScenarioManagerKey] = useState(0);
  
  const [optimisticScenario, setOptimisticScenario] = useState<UnitSalesScenarioConfig | null>(null);
  const [realisticScenario, setRealisticScenario] = useState<UnitSalesScenarioConfig | null>(null);
  const [conservativeScenario, setConservativeScenario] = useState<UnitSalesScenarioConfig | null>(null);
  const [paymentDistribution, setPaymentDistribution] = useState<PaymentDistributionConfig | null>(null);
  const [useAdvancedSimulation, setUseAdvancedSimulation] = useState(true);

  useEffect(() => {
    if (projectId) {
      loadUnits();
    }
  }, [projectId]);

  const loadUnits = async () => {
    try {
      setLoading(true);
      const response = await projectUnits.getProjectUnits(Number(projectId));
      setUnits(response.data);
    } catch (err) {
      setError('Error al cargar las unidades');
      console.error('Error loading units:', err);
    } finally {
      setLoading(false);
    }
  };

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
      
      setSimulationResults(response.data);
      
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
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No hay unidades creadas para este proyecto
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Primero debe crear las unidades del proyecto para poder simular las ventas
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Simulador de Ventas por Unidades
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <FormControlLabel
            control={
              <Switch
                checked={useAdvancedSimulation}
                onChange={(e) => setUseAdvancedSimulation(e.target.checked)}
                color="primary"
              />
            }
            label="Simulación Avanzada con Líneas de Crédito"
          />
          <Button
            variant="contained"
            startIcon={<PlayIcon />}
            onClick={runSimulation}
            disabled={loading || !optimisticScenario || !realisticScenario || !conservativeScenario}
          >
            {loading ? 'Simulando...' : 'Ejecutar Simulación'}
          </Button>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Scenario Management */}
      <ScenarioManager 
        key={scenarioManagerKey}
        projectId={Number(projectId)} 
        onScenarioActivated={() => {
          // Optional: Could trigger a refresh of cash flow data in parent component
          console.log('Scenario activated - cash flow should be updated');
        }}
      />

      {/* Payment Distribution Configuration */}
      {useAdvancedSimulation && (
        <PaymentDistributionBuilder
          onConfigChange={setPaymentDistribution}
          initialConfig={paymentDistribution || undefined}
        />
      )}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Resumen del Proyecto
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Typography variant="h4" color="primary">
              {units.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Unidades
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="h4" color="success.main">
              {formatCurrency(units.reduce((sum, unit) => sum + (unit.target_price_total || 0), 0))}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Valor Total
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="h4">
              {formatNumber(units.reduce((sum, unit) => sum + (unit.total_area_m2 || 0), 0))}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Área Total m²
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="h4">
              {units.length > 0 ? formatCurrency(units.reduce((sum, unit) => sum + (unit.target_price_total || 0), 0) / units.length) : '$0'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Precio Promedio
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <ScenarioBuilder
              units={units}
              scenarioName="optimista"
              onScenarioChange={setOptimisticScenario}
            />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <ScenarioBuilder
              units={units}
              scenarioName="realista"
              onScenarioChange={setRealisticScenario}
            />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <ScenarioBuilder
              units={units}
              scenarioName="conservador"
              onScenarioChange={setConservativeScenario}
            />
          </Paper>
        </Grid>
      </Grid>

      {simulationResults && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Resultados de la Simulación
          </Typography>
          
          {simulationResults.scenarios.map((scenario, index) => (
            <Accordion key={index}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" gap={2}>
                  <TrendingUpIcon />
                  <Typography variant="h6">
                    Escenario {scenario.scenario_name}
                  </Typography>
                  <Chip 
                    label={`${scenario.total_units_sold} unidades`}
                    color={scenario.scenario_name === 'optimista' ? 'success' : 
                           scenario.scenario_name === 'realista' ? 'primary' : 'warning'}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="h6" color="primary">
                      {formatCurrency(scenario.total_revenue)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Ingresos Totales
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="h6">
                      {scenario.sales_period_months} meses
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Período de Ventas
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="h6">
                      {formatNumber(scenario.average_monthly_sales)} unidades
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Promedio Mensual
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="h6">
                      {scenario.npv ? formatCurrency(scenario.npv) : 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      VPN
                    </Typography>
                  </Grid>
                </Grid>

                {/* Advanced simulation results */}
                {useAdvancedSimulation && scenario.developer_cash_flow && (
                  <>
                    <Divider sx={{ my: 3 }} />
                    
                    <Typography variant="h6" gutterBottom>
                      <MoneyIcon sx={{ fontSize: 20, mr: 1 }} />
                      Flujo de Caja del Desarrollador
                    </Typography>
                    
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Mes</TableCell>
                            <TableCell align="right">Pagos Separación</TableCell>
                            <TableCell align="right">Pagos Entrega</TableCell>
                            <TableCell align="right">Total Mensual</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {scenario.developer_cash_flow.slice(0, 10).map((flow, idx) => (
                            <TableRow key={idx}>
                              <TableCell>Mes {flow.month}</TableCell>
                              <TableCell align="right">{formatCurrency(flow.separation || 0)}</TableCell>
                              <TableCell align="right">{formatCurrency(flow.delivery || 0)}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                {formatCurrency(flow.total || 0)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {scenario.credit_line_impact && scenario.credit_line_impact.length > 0 && (
                      <>
                        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                          <BankIcon sx={{ fontSize: 20, mr: 1 }} />
                          Impacto en Líneas de Crédito
                        </Typography>
                        
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Mes</TableCell>
                                <TableCell align="right">Pagos Separación</TableCell>
                                <TableCell align="right">Pagos Entrega</TableCell>
                                <TableCell align="right">Total a Línea</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {scenario.credit_line_impact.slice(0, 10).map((impact, idx) => (
                                <TableRow key={idx}>
                                  <TableCell>Mes {impact.month}</TableCell>
                                  <TableCell align="right">{formatCurrency(impact.separation_payment || 0)}</TableCell>
                                  <TableCell align="right">{formatCurrency(impact.delivery_payment || 0)}</TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                                    {formatCurrency(impact.total_payment || 0)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </>
                    )}
                  </>
                )}

                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" gutterBottom>
                  Distribución de Ventas por Mes
                </Typography>
                <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                  {Object.entries(scenario.monthly_sales_distribution).map(([month, count]) => (
                    <Chip
                      key={month}
                      label={`Mes ${month}: ${count} unidades`}
                      variant="outlined"
                      size="small"
                      sx={{ mr: 1, mb: 1 }}
                    />
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}

          {/* Payment Flows Summary for Advanced Simulation */}
          {useAdvancedSimulation && simulationResults.payment_flows && (
            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" gap={2}>
                  <BankIcon />
                  <Typography variant="h6">
                    Detalle de Flujos de Pago por Unidad
                  </Typography>
                  <Chip 
                    label={`${simulationResults.payment_flows.length} flujos`}
                    color="info"
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Unidad</TableCell>
                        <TableCell>Mes Venta</TableCell>
                        <TableCell align="right">Precio</TableCell>
                        <TableCell align="center">Hipoteca</TableCell>
                        <TableCell align="right">Dev. Separación</TableCell>
                        <TableCell align="right">Dev. Entrega</TableCell>
                        <TableCell align="right">Línea Separación</TableCell>
                        <TableCell align="right">Línea Entrega</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {simulationResults.payment_flows.slice(0, 50).map((flow, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{flow.unit_number}</TableCell>
                          <TableCell>{flow.sale_month}</TableCell>
                          <TableCell align="right">{formatCurrency(flow.sale_price)}</TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={flow.uses_mortgage ? 'Sí' : 'No'}
                              color={flow.uses_mortgage ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">{formatCurrency(flow.developer_separation)}</TableCell>
                          <TableCell align="right">{formatCurrency(flow.developer_delivery)}</TableCell>
                          <TableCell align="right">{formatCurrency(flow.credit_line_separation)}</TableCell>
                          <TableCell align="right">{formatCurrency(flow.credit_line_delivery)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                {simulationResults.payment_flows.length > 50 && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Mostrando los primeros 50 flujos de {simulationResults.payment_flows.length} total
                  </Alert>
                )}
              </AccordionDetails>
            </Accordion>
          )}

          {/* Company Impact Summary */}
          {simulationResults.company_impact && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Impacto en la Empresa
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" color="primary">
                        {formatCurrency(simulationResults.company_impact.max_capital_exposure || 0)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Máxima Exposición de Capital
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" color="warning.main">
                        {formatCurrency(simulationResults.company_impact.liquidity_impact?.recommended_credit_line || 0)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Línea de Crédito Recomendada
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" color="info.main">
                        {formatCurrency(simulationResults.company_impact.liquidity_impact?.cash_reserve_needed || 0)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Reserva de Efectivo
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Chip 
                        label={simulationResults.company_impact.liquidity_impact?.risk_level || 'MEDIO'}
                        color={
                          simulationResults.company_impact.liquidity_impact?.risk_level === 'LOW' ? 'success' :
                          simulationResults.company_impact.liquidity_impact?.risk_level === 'HIGH' ? 'error' : 'warning'
                        }
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Nivel de Riesgo
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {simulationResults.company_impact.recommendations && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Recomendaciones:</Typography>
                  <ul>
                    {simulationResults.company_impact.recommendations.map((rec: string, idx: number) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </Alert>
              )}
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default UnitSalesSimulator;
