import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  VStack,
  HStack,
  Text,
  Button,
  Table,
  Badge,
  IconButton,
  useDisclosure,
  useToast,
  Spinner,
  Center,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  SimpleGrid,
  Alert,
  AlertIcon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
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
  NumberInput,
  NumberInputField,
  Select,
  Textarea,
  Divider,
  useColorModeValue,
  UnorderedList,
  ListItem,
  Progress,
  AlertTitle,
  AlertDescription,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper
} from '@chakra-ui/react';
import { 
  FaArrowLeft, 
  FaEdit, 
  FaTrash, 
  FaPlus, 
  FaCalculator, 
  FaChartLine,
  FaDollarSign,
  FaBuilding,
  FaSync,
  FaCreditCard,
  FaCalendarPlus,
  FaList,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaRocket,
  FaClipboardCheck,
  FaEye,
  FaFileInvoiceDollar,
  FaMoneyBillWave,
  FaProjectDiagram
} from 'react-icons/fa';
import { Link as RouterLink, useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { API_BASE_URL, projectCreditLinesApi, projectStatusTransitions } from '../../api/api';
import type { 
  ProjectStatusTransitionsResponse, 
  ProjectTransitionResponse, 
  ProjectStatusTransition,
  ProjectUnit
} from '../../types';
import type {
  LineaCreditoProyectoUso,
  LineaCreditoProyecto,
  ScenarioCostItem
} from '../../types/scenarioProjectTypes';
import ProjectUnitsManager from '../../components/ProjectUnitsManager';
import ProjectStagesManager from '../../components/ProjectStagesManager';

// TypeScript interfaces
interface ScenarioProject {
  id: number;
  name: string;
  description?: string;
  location?: string;
  status: string;
  start_date?: string;
  end_date?: string;
  delivery_start_date?: string;
  delivery_end_date?: string;
  total_area_m2?: number;
  buildable_area_m2?: number;
  total_units?: number;
  avg_unit_size_m2?: number;
  target_price_per_m2?: number;
  expected_sales_period_months?: number; // To be deprecated
  discount_rate: number;
  inflation_rate: number;
  contingency_percentage: number;
  payment_distribution_config?: PaymentDistributionConfig;
  cost_items: ScenarioCostItem[];
  units: ProjectUnit[];
  credit_lines: LineaCreditoProyecto[];
  created_at: string;
  updated_at: string;
}

interface CostItem {
  id: number;
  categoria: string;
  subcategoria: string;
  partida_costo: string;
  base_costo: string;
  monto_proyectado?: number;
  monto_real?: number;
  unit_cost?: number;
  quantity?: number;
  percentage_of_base?: number;
  base_reference?: string;
  start_month?: number;
  duration_months?: number;
  notes?: string;
  is_active: boolean;
}

interface ProjectMetrics {
  total_investment?: number;
  total_revenue?: number;
  total_profit?: number;
  profit_margin_pct?: number;
  npv?: number;
  irr?: number;
  payback_months?: number;
  profitability_index?: number;
  cost_per_unit?: number;
  revenue_per_unit?: number;
  profit_per_unit?: number;
  cost_per_m2?: number;
  revenue_per_m2?: number;
  profit_per_m2?: number;
  break_even_units?: number;
  break_even_price_per_m2?: number;
  max_drawdown?: number;
}

interface CashFlowItem {
  year: number;
  month: number;
  period_label: string;
  ingresos_ventas: number;
  total_ingresos: number;
  costos_terreno: number;
  costos_duros: number;
  costos_blandos: number;
  costos_financiacion: number;
  costos_marketing: number;
  total_egresos: number;
  flujo_neto: number;
  flujo_acumulado: number;
  flujo_descontado: number;
}



interface ProjectCreditLine {
  id: number;
  scenario_project_id: number;
  nombre: string;
  fecha_inicio: string;
  monto_total_linea: number;
  monto_disponible: number;
  fecha_fin: string;
  interest_rate?: number;
  tipo_linea: string;
  cargos_apertura?: number;
  plazo_meses?: number;
  periodicidad_pago?: string;
  valor_activo?: number;
  valor_residual?: number;
  porcentaje_financiamiento?: number;
  garantia_tipo?: string;
  garantia_descripcion?: string;
  limite_sobregiro?: number;
  moneda: string;
  beneficiario?: string;
  banco_emisor?: string;
  documento_respaldo?: string;
  estado: string;
  es_simulacion: boolean;
  created_at: string;
  updated_at: string;
}

interface CreditLineUsage {
  id: number;
  linea_credito_proyecto_id: number;
  fecha_uso: string;
  monto_usado: number;
  tipo_transaccion: string;
  descripcion?: string;
  cargo_transaccion?: number;
  scenario_cost_item_id?: number;
  es_simulacion: boolean;
  created_at: string;
  updated_at: string;
}

interface CreditRequirementsAnalysis {
  project_id: number;
  project_name: string;
  total_project_cost: number;
  financing_breakdown: {
    terreno: number;
    construccion: number;
    capital_trabajo: number;
    contingencia: number;
  };
  total_financing_needed: number;
  recommended_credit_lines: Array<{
    tipo_linea: string;
    proposito: string;
    monto_recomendado: number;
    plazo_meses: number;
    garantia_tipo: string;
    justificacion: string;
  }>;
  financing_ratio: number;
}

interface CreditLineMonthlyData {
  credit_line_id: number;
  credit_line_name: string;
  tipo_linea: string;
  withdrawals: number;
  payments: number;
  interest: number;
  transaction_charges: number;
  ending_balance: number;
  available_credit: number;
  usage_records_count: number;
}

interface MonthlyTimelineItem {
  year: number;
  month: number;
  period_label: string;
  credit_lines: CreditLineMonthlyData[];
  total_withdrawals: number;
  total_payments: number;
  total_interest: number;
  total_balance: number;
  sales_revenue: number;
  automatic_payments: number;
}

interface CreditLinesMonthlyTimeline {
  timeline: MonthlyTimelineItem[];
  summary: {
    total_lines: number;
    total_credit_limit: number;
    final_total_balance: number;
    total_interest_projected: number;
    total_withdrawals_projected: number;
    total_payments_projected: number;
    total_automatic_payments_projected?: number;
    total_sales_revenue_projected?: number;
    timeline_months: number;
    payment_distribution_config?: any;
    credit_lines_detail: Array<{
      id: number;
      name: string;
      total_limit: number;
      final_balance: number;
      available_credit: number;
      interest_rate: number;
    }>;
  };
}

interface PaymentDistributionConfig {
  separation_payment_percentage: number;
  separation_credit_line_percentage: number;
  delivery_payment_percentage: number;
  delivery_credit_line_percentage: number;
}

const ScenarioProjectDetailPage: React.FC = () => {
  console.log('<<<<< ScenarioProjectDetailPage.tsx MODULE IS BEING LOADED >>>>>');
  const { id } = useParams<{ id: string }>();
  console.log('[ScenarioProjectDetailPage] URL Parameter ID:', id);
  const navigate = useNavigate();
  const toast = useToast();
  
  // State management
  const [project, setProject] = useState<ScenarioProject | null>(null);
  const [costItems, setCostItems] = useState<CostItem[]>([]);
  const [metrics, setMetrics] = useState<ProjectMetrics | null>(null);
  const [cashFlow, setCashFlow] = useState<CashFlowItem[]>([]);
  const [creditLines, setCreditLines] = useState<ProjectCreditLine[]>([]);
  const [creditRequirements, setCreditRequirements] = useState<CreditRequirementsAnalysis | null>(null);
  const [selectedCreditLineUsage, setSelectedCreditLineUsage] = useState<{[creditLineId: number]: CreditLineUsage[]}>({});
  const [loadingUsage, setLoadingUsage] = useState<{[creditLineId: number]: boolean}>({});
  const [monthlyTimeline, setMonthlyTimeline] = useState<CreditLinesMonthlyTimeline | null>(null);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  const [sensitivityAnalyses, setSensitivityAnalyses] = useState<any[]>([]);
  const [baselineComparison, setBaselineComparison] = useState<any>(null);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  const [loadingCreditLines, setLoadingCreditLines] = useState(false);
  const [loadingCreditRequirements, setLoadingCreditRequirements] = useState(false);
  const [loadingSensitivity, setLoadingSensitivity] = useState(false);
  const [loadingBaseline, setLoadingBaseline] = useState(false);
  
  // Modal states
  const { isOpen: isAddCostOpen, onOpen: onAddCostOpen, onClose: onAddCostClose } = useDisclosure();
  const { isOpen: isEditCostOpen, onOpen: onEditCostOpen, onClose: onEditCostClose } = useDisclosure();
  const { isOpen: isAddCreditOpen, onOpen: onAddCreditOpen, onClose: onAddCreditClose } = useDisclosure();
  const { isOpen: isEditProjectOpen, onOpen: onEditProjectOpen, onClose: onEditProjectClose } = useDisclosure();
  const { isOpen: isUsageModalOpen, onOpen: onUsageModalOpen, onClose: onUsageModalClose } = useDisclosure();
  const { isOpen: isAddUsageOpen, onOpen: onAddUsageOpen, onClose: onAddUsageClose } = useDisclosure();
  
  // Form states
  const [newCostItem, setNewCostItem] = useState({
    categoria: '',
    subcategoria: '',
    partida_costo: '',
    base_costo: 'fijo',
    monto_proyectado: '',
    unit_cost: '',
    quantity: '',
    percentage_of_base: '',
    base_reference: '',
    start_month: '1',
    duration_months: '1',
    monthly_amount: '',
    notes: ''
  });
  
  const [editCostItem, setEditCostItem] = useState({
    id: 0,
    categoria: '',
    subcategoria: '',
    partida_costo: '',
    base_costo: 'fijo',
    monto_proyectado: '',
    unit_cost: '',
    quantity: '',
    percentage_of_base: '',
    base_reference: '',
    start_month: '1',
    duration_months: '1',
    monthly_amount: '',
    notes: ''
  });

  const [newCreditLine, setNewCreditLine] = useState({
    nombre: '',
    tipo_linea: 'LINEA_CREDITO',
    monto_total_linea: '',
    fecha_inicio: '',
    fecha_fin: '',
    interest_rate: '0.12',
    plazo_meses: '24',
    periodicidad_pago: 'MENSUAL',
    valor_activo: '',
    valor_residual: '',
    porcentaje_financiamiento: '0.80',
    garantia_tipo: '',
    garantia_descripcion: '',
    banco_emisor: '',
    documento_respaldo: '',
    moneda: 'USD',
    beneficiario: '',
    estado: 'ACTIVA',
    es_simulacion: true,
    cargos_apertura: ''
  });

  // New state for editing project basic info
  const [editProjectData, setEditProjectData] = useState({
    name: '',
    description: '',
    location: '',
    start_date: '',
    end_date: '',
    total_area_m2: '',
    buildable_area_m2: '',
    total_units: '',
    avg_unit_size_m2: '',
    target_price_per_m2: '',
    expected_sales_period_months: '',
    discount_rate: '',
    inflation_rate: '',
    contingency_percentage: '',
    delivery_start_date: '',
    delivery_end_date: '',
    payment_distribution_config: {
      separation_payment_percentage: 0,
      separation_credit_line_percentage: 0,
      delivery_payment_percentage: 0,
      delivery_credit_line_percentage: 0,
    }
  });

  const [updatingProject, setUpdatingProject] = useState(false);

  // Credit line usage form state
  const [selectedCreditLineForUsage, setSelectedCreditLineForUsage] = useState<ProjectCreditLine | null>(null);
  const [newCreditUsage, setNewCreditUsage] = useState({
    fecha_uso: '',
    monto_usado: '',
    tipo_transaccion: 'DRAWDOWN',
    descripcion: '',
    cargo_transaccion: '',
    scenario_cost_item_id: ''
  });

  // Additional state variables that were missing

  const [cashFlowImpact, setCashFlowImpact] = useState<any>(null);

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  // Financing timeline table colors
  const timelineTableBg = useColorModeValue('white', 'gray.800');
  const timelineHeaderBg = useColorModeValue('gray.50', 'gray.700');
  const timelinePhaseHeaderBg = useColorModeValue('blue.100', 'blue.900');
  const timelineTotalRowBg = useColorModeValue('gray.200', 'gray.500');

  // Add sensitivity analysis state
  const [sensitivityResults, setSensitivityResults] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedAnalysisType, setSelectedAnalysisType] = useState<string | null>(null);
  const [analysisConfig, setAnalysisConfig] = useState({
    min_variation_pct: -30,
    max_variation_pct: 30,
    steps: 13
  });

  // Status Transitions State
  const [statusTransitions, setStatusTransitions] = useState<ProjectStatusTransitionsResponse | null>(null);
  const [transitioning, setTransitioning] = useState(false);



  useEffect(() => {
    if (id) {
      fetchProjectDetails();
      fetchCostItems();
      fetchMetrics();
      fetchCashFlow();
      fetchStandardCashFlow();
      fetchCashFlowImpact();
      fetchSensitivityAnalyses();
      fetchCreditLines();
      fetchCreditRequirements();
      fetchMonthlyTimeline();
    }

    const handleScenarioActivation = () => {
      console.log('Event `scenarioActivated` received. Refreshing financials...');
      toast({
        title: 'Escenario Activado',
        description: 'Actualizando el flujo de caja y las métricas con la nueva proyección de ventas.',
        status: 'info',
        duration: 5000,
        isClosable: true,
      });
      fetchCashFlow();
      fetchMetrics();
    };

    // Listen for iframe messages about scenario activation
    const handleIframeMessage = (event: MessageEvent) => {
      if (event.data?.type === 'scenarioActivated' && event.data?.projectId === id) {
        console.log('Received scenario activation message from iframe');
        handleScenarioActivation();
      }
    };

    window.addEventListener('scenarioActivated', handleScenarioActivation);
    window.addEventListener('message', handleIframeMessage);

    return () => {
      window.removeEventListener('scenarioActivated', handleScenarioActivation);
      window.removeEventListener('message', handleIframeMessage);
    };
  }, [id]);

  // Fetch baseline comparison when project is approved
  useEffect(() => {
    if (project && project.status === 'APPROVED') {
      fetchBaselineComparison();
    }
  }, [project?.status]);

  // Fetch status transitions when project changes
  useEffect(() => {
    if (project) {
      fetchStatusTransitions();
    }
  }, [project?.status]);

  const fetchProjectDetails = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/scenario-projects/${id}`);
      if (response.ok) {
        const data = await response.json();
        setProject(data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cargar el proyecto',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const fetchCostItems = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/scenario-projects/${id}/cost-items`);
      if (response.ok) {
        const data = await response.json();
        setCostItems(data);
      }
    } catch (error) {
      console.error('Error fetching cost items:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/scenario-projects/${id}/metrics`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Metrics not available yet');
    }
  };

  const fetchCashFlow = async () => {
    try {
      // First try to get enhanced cash flow with projections
      const enhancedResponse = await fetch(`${API_BASE_URL}/api/scenario-projects/${id}/cash-flow-with-projections`);
      if (enhancedResponse.ok) {
        const enhancedData = await enhancedResponse.json();
        if (enhancedData.has_active_projection) {
          // Use enhanced cash flow if there's an active projection
          console.log('🎯 Using enhanced cash flow with sales projections:', enhancedData.scenario_name);
          setCashFlow(enhancedData.cash_flow);
          return;
        }
      }
      
      // Fall back to standard cash flow if no active projections
      console.log('📊 Using standard cash flow (no active projections)');
      const response = await fetch(`${API_BASE_URL}/api/scenario-projects/${id}/cash-flow`);
      if (response.ok) {
        const data = await response.json();
        setCashFlow(data);
      }
    } catch (error) {
      console.error('Cash flow not available yet');
    }
  };

  // Fetch standard cash flow specifically for cost breakdown
  const fetchStandardCashFlow = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/scenario-projects/${id}/cash-flow`);
      if (response.ok) {
        const data = await response.json();
        setStandardCashFlow(data);
        console.log('Standard cash flow for cost breakdown:', data);
        console.log('Sample cost data:', data[0]?.costos_terreno, data[0]?.costos_duros, data[0]?.costos_blandos);
      }
    } catch (error) {
      console.error('Standard cash flow not available yet');
    }
  };

  const onFinancialsRecalculated = () => {
    fetchMetrics();
    fetchCashFlow();
    fetchStandardCashFlow();
  };

  const fetchCashFlowImpact = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/scenario-projects/${id}/cash-flow-impact`);
      if (response.ok) {
        const data = await response.json();
        setCashFlowImpact(data);
      }
    } catch (error) {
      console.error('Error fetching cash flow impact:', error);
    }
  };

  const calculateFinancials = async () => {
    try {
      setCalculating(true);
      const response = await fetch(`${API_BASE_URL}/api/scenario-projects/${id}/calculate-financials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scenario_project_id: parseInt(id!),
          recalculate_cash_flow: true,
          recalculate_metrics: true
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast({
            title: 'Cálculo Completado',
            description: result.message,
            status: 'success',
            duration: 5000,
            isClosable: true,
          });
          if (result.metrics) {
            setMetrics(result.metrics);
          }
          if (result.cash_flow) {
            setCashFlow(result.cash_flow);
          }
          // Also refresh the standard cash flow for cost breakdown
          fetchStandardCashFlow();
        } else {
          throw new Error(result.message);
        }
      }
    } catch (error) {
      toast({
        title: 'Error en Cálculo',
        description: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`, 
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setCalculating(false);
    }
  };

  const addCostItem = async () => {
    try {
      // Helper function to safely parse numbers
      const safeParseFloat = (value: string | number) => {
        if (value === '' || value === null || value === undefined) return null;
        const parsed = typeof value === 'string' ? parseFloat(value) : value;
        return isNaN(parsed) ? null : parsed;
      };
      
      const safeParseInt = (value: string | number) => {
        if (value === '' || value === null || value === undefined) return null;
        const parsed = typeof value === 'string' ? parseInt(value) : value;
        return isNaN(parsed) ? null : parsed;
      };

      // For monthly recurring costs, calculate the total amount
      let calculatedMontoProyectado = safeParseFloat(newCostItem.monto_proyectado);
      let unitCost = safeParseFloat(newCostItem.unit_cost);
      
      if (newCostItem.base_costo === 'mensual') {
        const monthlyAmount = safeParseFloat(newCostItem.monthly_amount);
        const durationMonths = safeParseInt(newCostItem.duration_months);
        
        if (monthlyAmount && durationMonths) {
          calculatedMontoProyectado = monthlyAmount * durationMonths;
          unitCost = monthlyAmount; // Store monthly amount in unit_cost field
        }
      }

      const payload = {
        ...newCostItem,
        scenario_project_id: parseInt(id!),
        monto_proyectado: calculatedMontoProyectado,
        unit_cost: unitCost,
        quantity: safeParseFloat(newCostItem.quantity),
        percentage_of_base: safeParseFloat(newCostItem.percentage_of_base),
        start_month: safeParseInt(newCostItem.start_month),
        duration_months: safeParseInt(newCostItem.duration_months),
      };

      console.log('Adding cost item with payload:', payload);

      const response = await fetch(`${API_BASE_URL}/api/scenario-projects/${id}/cost-items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({
          title: 'Item Agregado',
          description: 'El item de costo ha sido agregado exitosamente',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        setNewCostItem({
          categoria: '',
          subcategoria: '',
          partida_costo: '',
          base_costo: 'fijo',
          monto_proyectado: '',
          unit_cost: '',
          quantity: '',
          percentage_of_base: '',
          base_reference: '',
          start_month: '1',
          duration_months: '1',
          monthly_amount: '',
          notes: ''
        });
        onAddCostClose();
        fetchCostItems();
        calculateFinancials();
      } else {
        // Handle HTTP error responses
        const errorData = await response.json().catch(() => ({}));
        toast({
          title: 'Error',
          description: errorData.detail || `Error ${response.status}: ${response.statusText}`,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al agregar el item de costo',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const deleteCostItem = async (itemId: number, itemName: string) => {
    if (!window.confirm(`¿Eliminar "${itemName}"?`)) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/scenario-projects/${id}/cost-items/${itemId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Item Eliminado',
          description: 'El item de costo ha sido eliminado',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        fetchCostItems();
        calculateFinancials();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al eliminar el item',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const openEditCostItem = (item: CostItem) => {
    console.log('Cost item data for editing:', item);
    
    // Map old base_costo values to new ones
    const mapBaseCosto = (baseCosto: string) => {
      const mapping: { [key: string]: string } = {
        'Monto Fijo': 'fijo',
        'Monto Fijo / por m³': 'fijo',
        'Monto Fijo Mensual': 'fijo',
        'Calculado': 'fijo',
        'por m²': 'por m² construcción', // Map old "por m²" to construction type for backward compatibility
        'por m² construcción': 'por m² construcción',
        'por m² propiedad': 'por m² propiedad',
        'por unidad': 'por unidad',
        '% Costos Duros': '% costos duros',
        '% Ingresos por Venta': '% ingresos por venta',
        '% Costos Totales': '% costos totales'
      };
      return mapping[baseCosto] || baseCosto;
    };

    setEditCostItem({
      id: item.id,
      categoria: item.categoria,
      subcategoria: item.subcategoria,
      partida_costo: item.partida_costo,
      base_costo: mapBaseCosto(item.base_costo),
      monto_proyectado: String(item.monto_proyectado || ''),
      unit_cost: String(item.unit_cost || ''),
      quantity: String(item.quantity || ''),
      percentage_of_base: String(item.percentage_of_base || ''),
      base_reference: item.base_reference || '',
      start_month: String(item.start_month || '1'),
      duration_months: String(item.duration_months || '1'),
      monthly_amount: String(item.unit_cost || ''), // Use unit_cost as monthly amount for existing items
      notes: item.notes || ''
    });
    onEditCostOpen();
  };

  const updateCostItem = async () => {
    if (!editCostItem.id) return;

    try {
      // Helper function to safely parse numbers
      const safeParseFloat = (value: string | number) => {
        if (value === '' || value === null || value === undefined) return null;
        const parsed = typeof value === 'string' ? parseFloat(value) : value;
        return isNaN(parsed) ? null : parsed;
      };
      
      const safeParseInt = (value: string | number) => {
        if (value === '' || value === null || value === undefined) return null;
        const parsed = typeof value === 'string' ? parseInt(value) : value;
        return isNaN(parsed) ? null : parsed;
      };

      // For monthly recurring costs, calculate the total amount
      let calculatedMontoProyectado = safeParseFloat(editCostItem.monto_proyectado);
      let unitCost = safeParseFloat(editCostItem.unit_cost);
      
      if (editCostItem.base_costo === 'mensual') {
        const monthlyAmount = safeParseFloat(editCostItem.monthly_amount);
        const durationMonths = safeParseInt(editCostItem.duration_months);
        
        if (monthlyAmount && durationMonths) {
          calculatedMontoProyectado = monthlyAmount * durationMonths;
          unitCost = monthlyAmount; // Store monthly amount in unit_cost field
        }
      }

      const payload = {
        ...editCostItem,
        monto_proyectado: calculatedMontoProyectado,
        unit_cost: unitCost,
        quantity: safeParseFloat(editCostItem.quantity),
        percentage_of_base: safeParseFloat(editCostItem.percentage_of_base),
        start_month: safeParseInt(editCostItem.start_month),
        duration_months: safeParseInt(editCostItem.duration_months),
      };

      console.log('Updating cost item with payload:', payload);

      const response = await fetch(`${API_BASE_URL}/api/scenario-projects/${id}/cost-items/${editCostItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({
          title: 'Item Actualizado',
          description: 'El item de costo ha sido actualizado exitosamente',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        setEditCostItem({
          id: 0,
          categoria: '',
          subcategoria: '',
          partida_costo: '',
          base_costo: 'fijo',
          monto_proyectado: '',
          unit_cost: '',
          quantity: '',
          percentage_of_base: '',
          base_reference: '',
          start_month: '1',
          duration_months: '1',
          monthly_amount: '',
          notes: ''
        });
        onEditCostClose();
        fetchCostItems();
        calculateFinancials();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast({
          title: 'Error',
          description: errorData.detail || `Error ${response.status}: ${response.statusText}`,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al actualizar el item de costo',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const formatCurrency = (amount?: number | string) => {
    if (amount === null || amount === undefined) return '-';
    
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (isNaN(numAmount)) return '-';
    if (numAmount === 0) return 'USD 0';
    
    return new Intl.NumberFormat('es-PA', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numAmount);
  };

  const formatPercentage = (rate?: number | string) => {
    if (!rate || rate === '0' || rate === '0.00') return '0.00%';
    const numRate = typeof rate === 'string' ? parseFloat(rate) : rate;
    if (isNaN(numRate)) return '-';
    return `${(numRate * 100).toFixed(2)}%`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNING': return 'yellow';
      case 'DRAFT': return 'blue';
      case 'UNDER_REVIEW': return 'purple';
      case 'APPROVED': return 'green';
      case 'ACTIVE': return 'teal';
      case 'COMPLETED': return 'gray';
      case 'ARCHIVED': return 'gray';
      default: return 'gray';
    }
  };

  const getCategoriaColor = (categoria: string) => {
    switch (categoria.toLowerCase()) {
      case 'terreno': return 'brown';
      case 'costos duros': return 'blue';
      case 'costos blandos': return 'purple';
      case 'financiación': return 'orange';
      case 'contingencia': return 'red';
      default: return 'gray';
    }
  };



  // Prepare chart data - handle both standard and enhanced cash flow formats
  const chartData = React.useMemo(() => {
    if (!cashFlow || cashFlow.length === 0) return [];
    
    console.log('Raw cash flow data:', cashFlow);
    
    // Check if this is enhanced cash flow data (has row_type property)
    const isEnhancedCashFlow = cashFlow.some(cf => 'row_type' in cf);
    console.log('Is enhanced cash flow:', isEnhancedCashFlow);
    
    if (isEnhancedCashFlow) {
      // For enhanced cash flow, aggregate by period
      const periodMap = new Map();
      
      cashFlow.forEach(cf => {
        const cfAny = cf as any; // Type assertion for enhanced cash flow properties
        const period = cfAny.period_label;
        if (!periodMap.has(period)) {
          periodMap.set(period, {
            period: period,
            ingresos: 0,
            egresos: 0,
            flujo_neto: 0,
            flujo_acumulado: Number(cfAny.flujo_acumulado) || 0 // Use the last accumulated value
          });
        }
        
        const periodData = periodMap.get(period);
        // Sum up all revenues and expenses for this period - ensure numeric conversion
        periodData.ingresos += Number(cfAny.total_ingresos) || 0;
        periodData.egresos += Number(cfAny.total_egresos) || 0;
        periodData.flujo_neto += Number(cfAny.flujo_neto) || 0;
        // Keep the latest accumulated flow value
        if (cfAny.flujo_acumulado) {
          periodData.flujo_acumulado = Number(cfAny.flujo_acumulado);
        }
      });
      
      // Convert to array and sort by period
      const result = Array.from(periodMap.values()).sort((a, b) => a.period.localeCompare(b.period));
      console.log('Enhanced cash flow chart data:', result);
      return result;
    } else {
      // Standard cash flow format
      return cashFlow.map(cf => {
        const cfAny = cf as any; // Type assertion for cash flow properties
        return {
          period: cfAny.period_label || `${cfAny.year}-${String(cfAny.month).padStart(2, '0')}`,
          ingresos: cfAny.total_ingresos || 0,
          egresos: cfAny.total_egresos || 0,
          flujo_neto: cfAny.flujo_neto || 0,
          flujo_acumulado: cfAny.flujo_acumulado || 0
        };
      });
    }
  }, [cashFlow]);

  // Debug: Log chart data to console
  console.log('Chart data for graph:', chartData);

  // Comprehensive cash flow calculation (moved to top level to follow Rules of Hooks)
  const comprehensiveCashFlow = React.useMemo(() => {
    if (!monthlyTimeline || !monthlyTimeline.timeline) return [];
    
    // Group cost items by month using start_month and duration_months
    const costsByMonth = {};
    costItems.forEach(item => {
      const startMonth = item.start_month || 1; // Default to month 1 if no start month specified
      const durationMonths = item.duration_months || 1; // Default to 1 month if no duration specified
      const totalCost = Number(item.monto_proyectado) || Number(item.monto_real) || 0;
      const monthlyCost = totalCost / durationMonths; // Distribute cost across duration
      
      // Distribute the cost across the specified duration
      for (let i = 0; i < durationMonths; i++) {
        const currentMonth = startMonth + i;
        const year = project?.start_date ? new Date(project.start_date).getFullYear() : 2025;
        const month = ((currentMonth - 1) % 12) + 1; // Handle year overflow
        const adjustedYear = year + Math.floor((currentMonth - 1) / 12);
        const periodLabel = `${adjustedYear}-${String(month).padStart(2, '0')}`;
        
        if (!costsByMonth[periodLabel]) {
          costsByMonth[periodLabel] = 0;
        }
        costsByMonth[periodLabel] += monthlyCost;
      }
    });
    
    // Create comprehensive cash flow combining financing and costs
    const combinedFlow = monthlyTimeline.timeline.map(month => {
      const periodCosts = costsByMonth[month.period_label] || 0;
      const salesRevenue = month.sales_revenue || 0;
      const automaticPayments = month.automatic_payments || 0;
      const interestExpense = month.total_interest || 0;
      const totalExpenses = periodCosts + interestExpense;
      const netCashFlow = salesRevenue - automaticPayments - totalExpenses;
      
      return {
        period: month.period_label,
        year: month.year,
        month: month.month,
        salesRevenue: salesRevenue,
        automaticPayments: automaticPayments,
        projectCosts: periodCosts,
        interestExpense: interestExpense,
        totalExpenses: totalExpenses,
        netCashFlow: netCashFlow,
        creditLineBalance: month.total_balance || 0
      };
    }).filter(row => row.salesRevenue > 0 || row.totalExpenses > 0); // Only show periods with activity
    
    // Calculate cumulative cash flow
    let cumulativeCashFlow = 0;
    return combinedFlow.map(row => {
      cumulativeCashFlow += row.netCashFlow;
      return {
        ...row,
        cumulativeCashFlow: cumulativeCashFlow
      };
    });
  }, [monthlyTimeline, costItems, project]);

  const costByCategory = React.useMemo(() => {
    // Start with cost items (excluding financing items)
    const categories = costItems.reduce((acc, item) => {
      const category = item.categoria;
      
      // Skip financing category items as they're calculated from cash flow
      if (category.toLowerCase().includes('financiacion')) {
        return acc;
      }
      
      // Calculate actual cost based on cost type
      let actualCost = 0;
      if (item.base_costo === 'por m² construcción' && item.unit_cost && project?.buildable_area_m2) {
        // Cost per m² construcción × buildable area
        actualCost = Number(item.unit_cost) * Number(project.buildable_area_m2);
      } else if (item.base_costo === 'por m² propiedad' && item.unit_cost && project?.total_units && project?.avg_unit_size_m2) {
        // Cost per m² propiedad × sellable area
        actualCost = Number(item.unit_cost) * Number(project.total_units) * Number(project.avg_unit_size_m2);
      } else if (item.base_costo === 'por m²' && item.unit_cost && project?.buildable_area_m2) {
        // Backward compatibility: treat old "por m²" as construcción
        actualCost = Number(item.unit_cost) * Number(project.buildable_area_m2);
      } else if (item.base_costo === 'por unidad' && item.unit_cost && project?.total_units) {
        // Cost per unit × total units
        actualCost = Number(item.unit_cost) * Number(project.total_units);
      } else {
        // Fixed amount or other types
        actualCost = typeof item.monto_proyectado === 'string' 
          ? parseFloat(item.monto_proyectado) || 0 
          : Number(item.monto_proyectado || 0);
      }
      
      // Ensure actualCost is a valid number
      if (isNaN(actualCost)) {
        actualCost = 0;
      }
      
      if (!acc[category]) {
        acc[category] = {
          count: 0,
          projected: 0,
          actual: 0,
          percentage: 0
        };
      }
      
      acc[category].count += 1;
      acc[category].projected += typeof item.monto_proyectado === 'string' 
        ? parseFloat(item.monto_proyectado) || 0 
        : Number(item.monto_proyectado || 0);
      acc[category].actual += actualCost;
      
      return acc;
    }, {} as Record<string, { count: number; projected: number; actual: number; percentage: number }>);
    
    // Add financing costs from cash flow data
    if (standardCashFlow.length > 0) {
      const totalFinancingCosts = standardCashFlow.reduce((sum, cf) => sum + (cf.costos_financiacion || 0), 0);
      
      if (totalFinancingCosts > 0) {
        categories['Financiación'] = {
          count: 1,
          projected: totalFinancingCosts,
          actual: totalFinancingCosts, // Using same value for actual since it's calculated
          percentage: 0 // Will be calculated below
        };
      }
    }
    
    return categories;
  }, [costItems, standardCashFlow, project]);

  // Calculate percentages for each category
  const totalProjected = Object.values(costByCategory).reduce((sum, cat) => sum + cat.projected, 0);
  Object.values(costByCategory).forEach(cat => {
    cat.percentage = totalProjected > 0 ? (cat.projected / totalProjected) * 100 : 0;
  });

  const categoryData = Object.entries(costByCategory).map(([name, data]) => ({
    name,
    value: data.projected
  }));

  // For cost breakdown, always use standard cash flow data to get detailed cost categories
  const [standardCashFlow, setStandardCashFlow] = useState<CashFlowItem[]>([]);
  
  const monthlyCostData = standardCashFlow.map(cf => ({
    period: cf.period_label,
    terreno: cf.costos_terreno || 0,
    duros: cf.costos_duros || 0,
    blandos: cf.costos_blandos || 0,
    financiacion: cf.costos_financiacion || 0,
    marketing: cf.costos_marketing || 0,
    total: cf.total_egresos || 0
  }));

  // Sensitivity analysis function
  const runSensitivityAnalysis = async (variableType: string) => {
    try {
      setIsAnalyzing(true);
      setSelectedAnalysisType(variableType);
      
      const response = await fetch(`${API_BASE_URL}/api/scenario-projects/${id}/sensitivity-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          variable_type: variableType,
          min_variation_pct: analysisConfig.min_variation_pct,
          max_variation_pct: analysisConfig.max_variation_pct,
          steps: analysisConfig.steps
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setSensitivityResults(prev => [...prev, result]);
        
        toast({
          title: 'Análisis Completado',
          description: `Análisis de ${getVariableName(variableType)} completado exitosamente`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      toast({
        title: 'Error en Análisis',
        description: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`, 
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };


  // Get existing sensitivity analyses
  const fetchSensitivityAnalyses = async () => {
    try {
      console.log('Fetching sensitivity analyses from:', `${API_BASE_URL}/api/scenario-projects/${id}/sensitivity-analyses`);
      const response = await fetch(`${API_BASE_URL}/api/scenario-projects/${id}/sensitivity-analyses`);
      console.log('Sensitivity analyses response status:', response.status);
      if (response.ok) {
        const analyses = await response.json();
        console.log('Sensitivity analyses data:', analyses);
        setSensitivityResults(analyses);
      } else {
        console.error('Sensitivity analyses response not ok:', response.status, response.statusText);
        // Set empty array to prevent errors
        setSensitivityResults([]);
      }
    } catch (error) {
      console.error('Error fetching sensitivity analyses:', error);
      // Set empty array to prevent errors
      setSensitivityResults([]);
    }
  };

  // Helper function to get variable display name
  const getVariableName = (variableType: string) => {
    switch (variableType) {
      case 'PRICE_PER_M2': return 'Precio por m²';
      case 'UNIT_SIZE': return 'Tamaño de Unidades';
      case 'TOTAL_UNITS': return 'Número de Unidades';
      case 'DISCOUNT_RATE': return 'Tasa de Descuento';
      default: return variableType;
    }
  };

  const proceedWithProject = async () => {
    if (!window.confirm(
      '¿Está seguro de que desea proceder con este proyecto?\n\n' +
      'Esta acción:\n' +
      '• Cambiará el estado del proyecto de "DRAFT" a "APPROVED"\n' +
      '• Creará una línea base (baseline) con las proyecciones actuales\n' +
      '• Permitirá seguimiento de presupuesto vs. realidad\n' +
      '• Comenzará a impactar el cash flow consolidado de la empresa\n\n' +
      'Asegúrese de haber revisado todas las métricas financieras y el análisis de impacto.'
    )) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/scenario-projects/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scenario_project_id: parseInt(id!),
          recalculate_cash_flow: true,
          recalculate_metrics: true
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        toast({
          title: 'Proyecto Aprobado',
          description: `${result.message}\n\nLínea base creada: ${result.baseline_items_created} items de costo, ${result.baseline_cashflow_created} períodos de cash flow.`,
          status: 'success',
          duration: 8000,
          isClosable: true,
        });
        
        // Refresh project data
        fetchProjectDetails();
        
        // Show additional info about next steps
        setTimeout(() => {
          toast({
            title: 'Línea Base Creada',
            description: 'Ahora puede comparar presupuesto vs. realidad mes a mes. La pestaña "Seguimiento" estará disponible.',
            status: 'info',
            duration: 8000,
            isClosable: true,
          });
        }, 3000);
        
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to approve project');
      }
    } catch (error) {
      console.error('Error approving project:', error);
      toast({
        title: 'Error',
        description: `No se pudo aprobar el proyecto: ${error instanceof Error ? error.message : 'Error desconocido'}`, 
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const fetchCreditLines = async () => {
    try {
      setLoadingCreditLines(true);
      const response = await projectCreditLinesApi.getProjectCreditLines(parseInt(id!));
      setCreditLines(response.data);
    } catch (error) {
      console.error('Error fetching credit lines:', error);
    } finally {
      setLoadingCreditLines(false);
    }
  };

  const fetchCreditRequirements = async () => {
    try {
      const response = await projectCreditLinesApi.getProjectCreditRequirements(parseInt(id!));
      setCreditRequirements(response.data);
    } catch (error) {
      console.error('Error fetching credit requirements:', error);
    }
  };

  const fetchMonthlyTimeline = async () => {
    if (!id) return;
    setLoadingTimeline(true);
    try {
      const response = await projectCreditLinesApi.getCreditLinesMonthlyTimeline(parseInt(id));
      setMonthlyTimeline(response.data);
    } catch (error) {
      console.error('Error fetching monthly timeline:', error);
      toast({
        title: 'Error',
        description: 'Error al cargar la línea de tiempo mensual',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoadingTimeline(false);
    }
  };

  const addCreditLine = async () => {
    try {
      const totalAmount = parseFloat(newCreditLine.monto_total_linea);
      
      const creditLineData = {
        ...newCreditLine,
        monto_total_linea: totalAmount,
        // Remove monto_disponible and scenario_project_id - they will be set by backend
        interest_rate: newCreditLine.interest_rate ? parseFloat(newCreditLine.interest_rate) : undefined,
        cargos_apertura: newCreditLine.cargos_apertura ? parseFloat(newCreditLine.cargos_apertura) : undefined,
        plazo_meses: newCreditLine.plazo_meses ? parseInt(newCreditLine.plazo_meses) : undefined,
        valor_activo: newCreditLine.valor_activo ? parseFloat(newCreditLine.valor_activo) : undefined,
        valor_residual: newCreditLine.valor_residual ? parseFloat(newCreditLine.valor_residual) : undefined,
        porcentaje_financiamiento: newCreditLine.porcentaje_financiamiento ? parseFloat(newCreditLine.porcentaje_financiamiento) : undefined,
      };

      await projectCreditLinesApi.createProjectCreditLine(parseInt(id!), creditLineData);

      toast({
        title: 'Línea de Crédito Creada',
        description: 'La línea de crédito ha sido creada exitosamente',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setNewCreditLine({
        nombre: '',
        fecha_inicio: '',
        monto_total_linea: '',
        fecha_fin: '',
        interest_rate: '',
        tipo_linea: 'LINEA_CREDITO',
        cargos_apertura: '',
        plazo_meses: '',
        periodicidad_pago: 'MENSUAL',
        garantia_tipo: '',
        garantia_descripcion: '',
        moneda: 'USD',
        es_simulacion: true,
        estado: 'ACTIVA',
        valor_activo: '',
        valor_residual: '',
        porcentaje_financiamiento: '',
        banco_emisor: '',
        beneficiario: '',
        documento_respaldo: ''
      });
      onAddCreditClose();
      fetchCreditLines();
      fetchMonthlyTimeline();
    } catch (error: any) {
      console.error('Error creating credit line:', error);
      
      let errorMessage = 'Error de conexión al crear la línea de crédito';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Handle Pydantic validation errors (422)
        if (Array.isArray(errorData)) {
          errorMessage = 'Errores de validación:\n' +
            errorData.map(err => `• ${err.msg || err.message || JSON.stringify(err)}`).join('\n');
        } else if (errorData.detail) {
          // Handle string detail
          if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          } else if (Array.isArray(errorData.detail)) {
            errorMessage = 'Errores de validación:\n' +
              errorData.detail.map(err => `• ${err.msg || err.message || JSON.stringify(err)}`).join('\n');
          } else {
            errorMessage = JSON.stringify(errorData.detail);
          }
        } else {
          errorMessage = JSON.stringify(errorData);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 8000,
        isClosable: true,
      });
    }
  };

  const deleteCreditLine = async (creditLineId: number, creditLineName: string) => {
    try {
      await projectCreditLinesApi.deleteProjectCreditLine(parseInt(id!), creditLineId);

      toast({
        title: 'Línea de Crédito Eliminada',
        description: `La línea "${creditLineName}" ha sido eliminada`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchCreditLines();
      fetchMonthlyTimeline();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Error de conexión al eliminar la línea de crédito',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Credit Line Usage Functions
  const fetchCreditLineUsage = async (creditLineId: number) => {
    try {
      setLoadingUsage(prev => ({ ...prev, [creditLineId]: true }));
      const response = await projectCreditLinesApi.getCreditLineUsage(parseInt(id!), creditLineId);
      setSelectedCreditLineUsage(prev => ({ ...prev, [creditLineId]: response.data }));
    } catch (error) {
      console.error('Error fetching credit line usage:', error);
    } finally {
      setLoadingUsage(prev => ({ ...prev, [creditLineId]: false }));
    }
  };

  const openUsageModal = (creditLine: ProjectCreditLine) => {
    setSelectedCreditLineForUsage(creditLine);
    fetchCreditLineUsage(creditLine.id);
    onUsageModalOpen();
  };

  const openAddUsageModal = (creditLine: ProjectCreditLine) => {
    setSelectedCreditLineForUsage(creditLine);
    setNewCreditUsage({
      fecha_uso: '',
      monto_usado: '',
      tipo_transaccion: 'DRAWDOWN',
      descripcion: '',
      cargo_transaccion: '',
      scenario_cost_item_id: ''
    });
    onAddUsageOpen();
  };

  const addCreditLineUsage = async () => {
    if (!selectedCreditLineForUsage) return;

    try {
      const usageData = {
        fecha_uso: newCreditUsage.fecha_uso,
        monto_usado: parseFloat(newCreditUsage.monto_usado),
        tipo_transaccion: newCreditUsage.tipo_transaccion,
        descripcion: newCreditUsage.descripcion || undefined,
        cargo_transaccion: newCreditUsage.cargo_transaccion ? parseFloat(newCreditUsage.cargo_transaccion) : undefined,
        scenario_cost_item_id: newCreditUsage.scenario_cost_item_id ? parseInt(newCreditUsage.scenario_cost_item_id) : undefined
      };

      await projectCreditLinesApi.createCreditLineUsage(
        parseInt(id!), 
        selectedCreditLineForUsage.id, 
        usageData
      );

      toast({
        title: 'Uso de Línea de Crédito Creado',
        description: 'El uso proyectado ha sido registrado exitosamente',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Reset form
      setNewCreditUsage({
        fecha_uso: '',
        monto_usado: '',
        tipo_transaccion: 'DRAWDOWN',
        descripcion: '',
        cargo_transaccion: '',
        scenario_cost_item_id: ''
      });

      onAddUsageClose();
      
      // Refresh data
      fetchCreditLineUsage(selectedCreditLineForUsage.id);
      fetchCreditLines(); // Refresh to update available amounts
      fetchMonthlyTimeline();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Error al crear el uso de línea de crédito',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const deleteCreditLineUsage = async (creditLineId: number, usageId: number) => {
    try {
      await projectCreditLinesApi.deleteCreditLineUsage(parseInt(id!), creditLineId, usageId);
      
      toast({
        title: 'Uso Eliminado',
        description: 'El uso proyectado ha sido eliminado',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Refresh data
      fetchCreditLineUsage(creditLineId);
      fetchCreditLines(); // Refresh to update available amounts
      fetchMonthlyTimeline();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Error al eliminar el uso',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const fetchBaselineComparison = async () => {
    if (!project || project.status !== 'APPROVED') return;
    
    try {
      setLoadingBaseline(true);
      const response = await fetch(`${API_BASE_URL}/api/scenario-projects/${id}/baseline-comparison`);
      if (response.ok) {
        const data = await response.json();
        setBaselineComparison(data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error fetching baseline comparison:', errorData);
      }
    } catch (error) {
      console.error('Error fetching baseline comparison:', error);
    } finally {
      setLoadingBaseline(false);
    }
  };

  // Function to open edit project modal with current data
  const openEditProject = () => {
    if (project) {
      console.log('Opening edit project with data:', project);
      setEditProjectData({
        name: project.name || '',
        description: project.description || '',
        location: project.location || '',
        start_date: project.start_date ? project.start_date.split('T')[0] : '',
        end_date: project.end_date ? project.end_date.split('T')[0] : '',
        total_area_m2: project.total_area_m2 !== null && project.total_area_m2 !== undefined ? project.total_area_m2.toString() : '',
        buildable_area_m2: project.buildable_area_m2 !== null && project.buildable_area_m2 !== undefined ? project.buildable_area_m2.toString() : '',
        total_units: project.total_units !== null && project.total_units !== undefined ? project.total_units.toString() : '',
        avg_unit_size_m2: project.avg_unit_size_m2 !== null && project.avg_unit_size_m2 !== undefined ? project.avg_unit_size_m2.toString() : '',
        target_price_per_m2: project.target_price_per_m2 !== null && project.target_price_per_m2 !== undefined ? project.target_price_per_m2.toString() : '',
        expected_sales_period_months: project.expected_sales_period_months !== null && project.expected_sales_period_months !== undefined ? project.expected_sales_period_months.toString() : '',
        discount_rate: project.discount_rate !== null && project.discount_rate !== undefined ? (typeof project.discount_rate === 'string' ? (parseFloat(project.discount_rate) * 100).toString() : (project.discount_rate * 100).toString()) : '',
        inflation_rate: project.inflation_rate !== null && project.inflation_rate !== undefined ? (typeof project.inflation_rate === 'string' ? (parseFloat(project.inflation_rate) * 100).toString() : (project.inflation_rate * 100).toString()) : '',
        contingency_percentage: project.contingency_percentage !== null && project.contingency_percentage !== undefined ? (typeof project.contingency_percentage === 'string' ? (parseFloat(project.contingency_percentage) * 100).toString() : (project.contingency_percentage * 100).toString()) : '',
        delivery_start_date: project.delivery_start_date ? project.delivery_start_date.split('T')[0] : '',
        delivery_end_date: project.delivery_end_date ? project.delivery_end_date.split('T')[0] : '',
        payment_distribution_config: {
          ...project.payment_distribution_config,
          separation_payment_percentage: project.payment_distribution_config?.separation_payment_percentage !== undefined ? project.payment_distribution_config.separation_payment_percentage * 100 : 0,
          separation_credit_line_percentage: project.payment_distribution_config?.separation_credit_line_percentage !== undefined ? project.payment_distribution_config.separation_credit_line_percentage * 100 : 0,
          delivery_payment_percentage: project.payment_distribution_config?.delivery_payment_percentage !== undefined ? project.payment_distribution_config.delivery_payment_percentage * 100 : 0,
          delivery_credit_line_percentage: project.payment_distribution_config?.delivery_credit_line_percentage !== undefined ? project.payment_distribution_config.delivery_credit_line_percentage * 100 : 0,
        }
      });
      console.log('Edit project data set to:', {
        name: project.name || '',
        description: project.description || '',
        delivery_start_date: project.delivery_start_date ? project.delivery_start_date.split('T')[0] : '',
        delivery_end_date: project.delivery_end_date ? project.delivery_end_date.split('T')[0] : ''
      });
      onEditProjectOpen();
    } else {
      console.error('Cannot open edit project - project data is undefined');
    }
  };

  // Function to update project basic info
  const updateProject = async () => {
    try {
      setUpdatingProject(true);
      
      const projectData = {
        name: editProjectData.name,
        description: editProjectData.description || null,
        location: editProjectData.location || null,
        start_date: editProjectData.start_date || null,
        end_date: editProjectData.end_date || null,
        total_area_m2: editProjectData.total_area_m2 ? parseFloat(editProjectData.total_area_m2) : null,
        buildable_area_m2: editProjectData.buildable_area_m2 ? parseFloat(editProjectData.buildable_area_m2) : null,
        total_units: editProjectData.total_units ? parseInt(editProjectData.total_units) : null,
        avg_unit_size_m2: editProjectData.avg_unit_size_m2 ? parseFloat(editProjectData.avg_unit_size_m2) : null,
        target_price_per_m2: editProjectData.target_price_per_m2 ? parseFloat(editProjectData.target_price_per_m2) : null,
        expected_sales_period_months: editProjectData.expected_sales_period_months ? parseInt(editProjectData.expected_sales_period_months) : null,
        // Convert percentage values to decimal for backend (12 -> 0.12)
        discount_rate: parseFloat(editProjectData.discount_rate) / 100,
        inflation_rate: parseFloat(editProjectData.inflation_rate) / 100,
        contingency_percentage: parseFloat(editProjectData.contingency_percentage) / 100,
        delivery_start_date: editProjectData.delivery_start_date && editProjectData.delivery_start_date !== '' ? new Date(editProjectData.delivery_start_date).toISOString().split('T')[0] : null,
        delivery_end_date: editProjectData.delivery_end_date && editProjectData.delivery_end_date !== '' ? new Date(editProjectData.delivery_end_date).toISOString().split('T')[0] : null,
        payment_distribution_config: {
          separation_payment_percentage: editProjectData.payment_distribution_config.separation_payment_percentage / 100,
          separation_credit_line_percentage: editProjectData.payment_distribution_config.separation_credit_line_percentage / 100,
          delivery_payment_percentage: editProjectData.payment_distribution_config.delivery_payment_percentage / 100,
          delivery_credit_line_percentage: editProjectData.payment_distribution_config.delivery_credit_line_percentage / 100,
        }
      };

      const response = await fetch(`${API_BASE_URL}/api/scenario-projects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });

      if (response.ok) {
        const updatedProject = await response.json();
        
        setProject(updatedProject);
        toast({
          title: 'Proyecto Actualizado',
          description: 'Los datos básicos del proyecto han sido actualizados exitosamente',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        onEditProjectClose();
        
        // Refresh project details and metrics
        fetchProjectDetails();
        if (metrics) {
          fetchMetrics();
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update project');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo actualizar el proyecto',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUpdatingProject(false);
    }
  };

  // Status Transitions Functions
  const fetchStatusTransitions = async () => {
    if (!id) return;
    
    try {
      const response = await projectStatusTransitions.getAvailableTransitions(parseInt(id));
      setStatusTransitions(response.data);
    } catch (error) {
      console.error('Error fetching status transitions:', error);
    }
  };

  const executeTransition = async (transition: ProjectStatusTransition) => {
    if (!id) return;

    // Show confirmation dialog for important transitions
    const isDestructive = transition.action === 'reject' || transition.action === 'activate';
    const isApproval = transition.action === 'approve';
    
    let confirmMessage = `¿Está seguro de que desea ${transition.label}?`;
    
    if (isApproval) {
      confirmMessage = `¿Está seguro de que desea aprobar este proyecto?\n\n` +
        `Esta acción:\n` +
        `• Creará una línea base (baseline) con las proyecciones actuales\n` +
        `• Permitirá seguimiento de presupuesto vs. realidad\n` +
        `• El proyecto podrá ser activado posteriormente\n\n` +
        `Asegúrese de haber revisado todas las métricas financieras.`;
    } else if (transition.action === 'activate') {
      confirmMessage = `¿Está seguro de que desea activar este proyecto?\n\n` +
        `Esta acción:\n` +
        `• Comenzará a impactar el cash flow consolidado de la empresa\n` +
        `• Activará todas las líneas de crédito del proyecto\n` +
        `• No se puede deshacer fácilmente\n\n` +
        `Solo active el proyecto cuando esté listo para ejecutar.`;
    }
    
    // Handle rejection separately for reason input
    if (transition.action === 'reject') {
      const reason = window.prompt(
        'Por favor ingrese la razón del rechazo (opcional):'
      );
      
      if (!window.confirm(confirmMessage + `\n\nRazón: ${reason || 'Sin razón específica'}`)) {
        return;
      }
      
      try {
        setTransitioning(true);
        const response = await projectStatusTransitions.rejectProject(parseInt(id), reason || undefined);
        
        if (response.data.success) {
          toast({
            title: 'Proyecto Rechazado',
            description: response.data.message,
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
          
          // Refresh project data
          fetchProjectDetails();
          fetchStatusTransitions();
        }
      } catch (error) {
        console.error('Error rejecting project:', error);
        toast({
          title: 'Error',
          description: 'No se pudo rechazar el proyecto',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setTransitioning(false);
      }
      return;
    }
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setTransitioning(true);
      let response: { data: ProjectTransitionResponse };
      
      switch (transition.action) {
        case 'transition-to-draft':
          response = await projectStatusTransitions.transitionToDraft(parseInt(id));
          break;
        case 'transition-to-review':
          response = await projectStatusTransitions.transitionToReview(parseInt(id));
          break;
        case 'approve':
          response = await projectStatusTransitions.approveProject(parseInt(id));
          break;
        case 'activate':
          response = await projectStatusTransitions.activateProject(parseInt(id));
          break;
        default:
          throw new Error(`Acción no reconocida: ${transition.action}`);
      }
      
      if (response.data.success) {
        toast({
          title: 'Transición Exitosa',
          description: response.data.message,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        // Show warnings if any
        if (response.data.warnings && response.data.warnings.length > 0) {
          setTimeout(() => {
            response.data.warnings.forEach((warning: string) => {
              toast({
                title: 'Advertencia',
                description: warning,
                status: 'warning',
                duration: 8000,
                isClosable: true,
              });
            });
          }, 1000);
        }
        
        // Show additional info for approvals
        if (response.data.baseline_items_created || response.data.credit_lines_activated) {
          setTimeout(() => {
            let additionalInfo = '';
            if (response.data.baseline_items_created) {
              additionalInfo += `Línea base creada: ${response.data.baseline_items_created} items de costo. `;
            }
            if (response.data.credit_lines_activated) {
              additionalInfo += `${response.data.credit_lines_activated} líneas de crédito activadas.`;
            }
            
            toast({
              title: 'Información Adicional',
              description: additionalInfo,
              status: 'info',
              duration: 8000,
              isClosable: true,
            });
          }, 2000);
        }
        
        // Refresh project data
        fetchProjectDetails();
        fetchStatusTransitions();
      }
    } catch (error: any) {
      console.error('Error executing transition:', error);
      
      // Extract detailed error message
      let errorMessage = 'Error desconocido';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 8000,
        isClosable: true,
      });
    } finally {
      setTransitioning(false);
    }
  };

  const getTransitionIcon = (action: string) => {
    switch (action) {
      case 'transition-to-draft':
        return FaEdit;
      case 'transition-to-review':
        return FaEye;
      case 'approve':
        return FaCheckCircle;
      case 'reject':
        return FaTimesCircle;
      case 'activate':
        return FaRocket;
      default:
        return FaClipboardCheck;
    }
  };

  const handlePaymentDistChange = (field: keyof PaymentDistributionConfig, value: string) => {
    const numericValue = parseFloat(value) || 0;
    setEditProjectData(prev => ({
      ...prev,
      payment_distribution_config: {
        ...prev.payment_distribution_config,
        [field]: numericValue
      }
    }));
  };

  // Helper functions for timeline highlighting
  const isConstructionMonth = (periodLabel: string) => {
    if (!project?.start_date || !project?.end_date) return false;
    const periodDate = new Date(periodLabel + '-01'); // Convert "YYYY-MM" to a Date object (first day of month)
    const startDate = new Date(project.start_date);
    const endDate = new Date(project.end_date);
    // Compare year and month only
    return periodDate.getFullYear() >= startDate.getFullYear() &&
           periodDate.getMonth() >= startDate.getMonth() &&
           periodDate.getFullYear() <= endDate.getFullYear() &&
           periodDate.getMonth() <= endDate.getMonth();
  };

  const isSalesMonth = (periodLabel: string) => {
    if (!project?.delivery_start_date || !project?.delivery_end_date) return false;
    const periodDate = new Date(periodLabel + '-01');
    const deliveryStartDate = new Date(project.delivery_start_date);
    const deliveryEndDate = new Date(project.delivery_end_date);
    return periodDate.getFullYear() >= deliveryStartDate.getFullYear() &&
           periodDate.getMonth() >= deliveryStartDate.getMonth() &&
           periodDate.getFullYear() <= deliveryEndDate.getFullYear() &&
           periodDate.getMonth() <= deliveryEndDate.getMonth();
  };

  if (loading) {
    return (
      <Center p={8}>
        <VStack spacing={4}>
          <Spinner size="xl" color="purple.500" />
          <Text>Cargando detalles del proyecto...</Text>
        </VStack>
      </Center>
    );
  }

  if (!project) {
    return (
      <Center p={8}>
        <VStack spacing={4}>
          <Text fontSize="lg" color="red.500">Proyecto no encontrado</Text>
          <Button as={RouterLink} to="/admin/scenario-projects" leftIcon={<FaArrowLeft />}>
            Volver a Proyectos
          </Button>
        </VStack>
      </Center>
    );
  }

  return (
    <Box p={8}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={8}>
        <VStack align="start" spacing={2}>
          <HStack spacing={4}>
            <IconButton
              as={RouterLink}
              to="/admin/scenario-projects"
              icon={<FaArrowLeft />}
              aria-label="Volver a proyectos"
              variant="ghost"
              size="lg"
            />
            <VStack align="start" spacing={1}>
              <Heading as="h1" size="xl" color="purple.600">
                {project.name}
              </Heading>
              <HStack spacing={4}>
                <Badge colorScheme={getStatusColor(project.status)} size="lg">
                  {project.status}
                </Badge>
                {project.location && (
                  <Text color="gray.600">{project.location}</Text>
                )}
              </HStack>
            </VStack>
          </HStack>
          {project.description && (
            <Text color="gray.600" maxW="600px">
              {project.description}
            </Text>
          )}
        </VStack>
        
        <VStack spacing={2}>
          {project && (project.status === 'PLANNING' || project.status === 'DRAFT') && (
            <Button
              leftIcon={<FaEdit />}
              colorScheme="purple"
              variant="outline"
              onClick={openEditProject}
              size="lg"
              isDisabled={!(project.status === 'PLANNING' || project.status === 'DRAFT')}
            >
              Editar Proyecto
            </Button>
          )}
          
          <Button
            leftIcon={<FaCalculator />}
            colorScheme="green"
            onClick={calculateFinancials}
            isLoading={calculating}
            loadingText="Calculando..."
            size="lg"
          >
            Calcular Financieros
          </Button>
          
          {/* Status Transitions */}
          {statusTransitions && statusTransitions.available_transitions.length > 0 && (
            <VStack spacing={2} width="100%">
              <Text fontSize="sm" color="gray.500" fontWeight="semibold">
                ACCIONES DISPONIBLES
              </Text>
              
              {statusTransitions.available_transitions.map((transition, index) => {
                const TransitionIcon = getTransitionIcon(transition.action);
                
                return (
          <Button
                    key={index}
                    leftIcon={<TransitionIcon />}
                    colorScheme={transition.button_color}
              variant="solid"
                    onClick={() => executeTransition(transition)}
                    isLoading={transitioning}
                    isDisabled={!transition.can_transition || transitioning}
              size="lg"
                    width="100%"
            >
                    {transition.label}
            </Button>
                );
              })}
              
              {/* Show validation errors and warnings */}
              {statusTransitions.available_transitions.some(t => t.validation_errors.length > 0) && (
                <VStack spacing={2} width="100%">
                  {/* Blocking errors */}
                  {statusTransitions.available_transitions.some(t => !t.can_transition && t.validation_errors.some(e => !e.includes('⚠️'))) && (
                    <Alert status="error" size="sm">
                      <AlertIcon />
                      <VStack align="start" spacing={1}>
                        <AlertTitle>Requisitos Pendientes:</AlertTitle>
                        <AlertDescription>
                          {statusTransitions.available_transitions
                            .filter(t => !t.can_transition)
                            .map(t => t.validation_errors.filter(e => !e.includes('⚠️')))
                            .flat()
                            .map((error, i) => (
                              <Text key={i} fontSize="xs">• {error}</Text>
                            ))}
                        </AlertDescription>
                      </VStack>
                    </Alert>
                  )}
                  
                  {/* Warnings */}
                  {statusTransitions.available_transitions.some(t => t.validation_errors.some(e => e.includes('⚠️'))) && (
                    <Alert status="warning" size="sm">
                      <AlertIcon />
                      <VStack align="start" spacing={1}>
                        <AlertTitle>Advertencias:</AlertTitle>
                        <AlertDescription>
                          {statusTransitions.available_transitions
                            .map(t => t.validation_errors.filter(e => e.includes('⚠️')))
                            .flat()
                            .map((warning, i) => (
                              <Text key={i} fontSize="xs">• {warning}</Text>
                            ))}
                        </AlertDescription>
                      </VStack>
                    </Alert>
                  )}
                </VStack>
              )}
            </VStack>
          )}
        </VStack>
      </Flex>

      {/* Project Basic Information */}
      <Card mb={8} bg={cardBg} borderColor={borderColor}>
        <CardHeader>
          <Flex justify="space-between" align="center">
            <Heading size="md">Información Básica del Proyecto</Heading>
            {project.status === 'DRAFT' && (
              <Button
                leftIcon={<FaEdit />}
                size="sm"
                colorScheme="purple"
                variant="ghost"
                onClick={openEditProject}
              >
                Editar
              </Button>
            )}
          </Flex>
        </CardHeader>
        <CardBody>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            <VStack align="start" spacing={2}>
              <Text fontSize="sm" color="gray.500" fontWeight="semibold">ÁREA TOTAL</Text>
              <Text fontSize="lg" fontWeight="bold">
                {project.total_area_m2 ? `${project.total_area_m2.toLocaleString()} m²` : 'No especificado'}
              </Text>
            </VStack>
            
            <VStack align="start" spacing={2}>
              <Text fontSize="sm" color="gray.500" fontWeight="semibold">ÁREA CONSTRUIBLE</Text>
              <Text fontSize="lg" fontWeight="bold">
                {project.buildable_area_m2 ? `${project.buildable_area_m2.toLocaleString()} m²` : 'No especificado'}
              </Text>
            </VStack>

            <VStack align="start" spacing={2}>
              <Text fontSize="sm" color="gray.500" fontWeight="semibold">FECHA DE INICIO</Text>
              <Text fontSize="lg" fontWeight="bold">
                {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'No especificado'}
              </Text>
            </VStack>
            
            <VStack align="start" spacing={2}>
              <Text fontSize="sm" color="gray.500" fontWeight="semibold">FECHA DE FINALIZACIÓN</Text>
              <Text fontSize="lg" fontWeight="bold">
                {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'No especificado'}
              </Text>
            </VStack>
            
            <VStack align="start" spacing={2}>
              <Text fontSize="sm" color="gray.500" fontWeight="semibold">INICIO DE ENTREGAS</Text>
              <Text fontSize="lg" fontWeight="bold">
                {project.delivery_start_date ? new Date(project.delivery_start_date).toLocaleDateString() : 'No especificado'}
              </Text>
            </VStack>
            
            <VStack align="start" spacing={2}>
              <Text fontSize="sm" color="gray.500" fontWeight="semibold">FIN DE ENTREGAS</Text>
              <Text fontSize="lg" fontWeight="bold">
                {project.delivery_end_date ? new Date(project.delivery_end_date).toLocaleDateString() : 'No especificado'}
              </Text>
            </VStack>
            
            <VStack align="start" spacing={2}>
              <Text fontSize="sm" color="gray.500" fontWeight="semibold">TOTAL UNIDADES</Text>
              <Text fontSize="lg" fontWeight="bold">
                {project.total_units ? project.total_units.toLocaleString() : 'No especificado'}
              </Text>
            </VStack>
          </SimpleGrid>
        </CardBody>
      </Card>

      {/* Main Content Tabs */}
      <Tabs isLazy colorScheme="purple">
        <TabList>
          <Tab><FaDollarSign /> Resumen Financiero</Tab>
          <Tab><FaList /> Costos</Tab>
          <Tab><FaBuilding /> Unidades</Tab>
          <Tab><FaProjectDiagram /> Etapas</Tab>
          <Tab><FaCreditCard /> Financiamiento</Tab>
          <Tab><FaChartLine /> Análisis de Sensibilidad</Tab>
        </TabList>

        <TabPanels>
          {/* Financial Summary Tab */}
          <TabPanel>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
              <Card>
                <CardBody>
                  <Text fontSize="sm" color="gray.500" fontWeight="semibold">INVERSIÓN TOTAL</Text>
                  <Text fontSize="2xl" fontWeight="bold">{formatCurrency(metrics?.total_investment)}</Text>
                </CardBody>
              </Card>
              <Card>
                <CardBody>
                  <Text fontSize="sm" color="gray.500" fontWeight="semibold">INGRESOS TOTALES</Text>
                  <Text fontSize="2xl" fontWeight="bold">{formatCurrency(metrics?.total_revenue)}</Text>
                </CardBody>
              </Card>
              <Card>
                <CardBody>
                  <Text fontSize="sm" color="gray.500" fontWeight="semibold">GANANCIA TOTAL</Text>
                  <Text fontSize="2xl" fontWeight="bold" color={metrics && metrics.total_profit && metrics.total_profit < 0 ? 'red.500' : 'green.500'}>
                    {formatCurrency(metrics?.total_profit)}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    Margen: {formatPercentage(metrics?.profit_margin_pct)}
                  </Text>
                </CardBody>
              </Card>
              <Card>
                <CardBody>
                  <Text fontSize="sm" color="gray.500" fontWeight="semibold">VAN / TIR</Text>
                  <Text fontSize="2xl" fontWeight="bold">{formatCurrency(metrics?.npv)}</Text>
                  <Text fontSize="sm" color="gray.500">
                    TIR: {formatPercentage(metrics?.irr)}
                  </Text>
                </CardBody>
              </Card>
            </SimpleGrid>
            
            <Card bg={cardBg} borderColor={borderColor}>
              <CardHeader>
                <Heading size="md">Flujo de Caja del Proyecto</Heading>
              </CardHeader>
              <CardBody>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis allowDataOverflow={true} domain={['auto', 'auto']} tickFormatter={(value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Line type="monotone" dataKey="ingresos" stroke="#48BB78" name="Ingresos" />
                    <Line type="monotone" dataKey="egresos" stroke="#F56565" name="Egresos" />
                    <Line type="monotone" dataKey="flujo_neto" stroke="#4299E1" name="Flujo Neto" />
                    <Line type="monotone" dataKey="flujo_acumulado" stroke="#9F7AEA" name="Flujo Acumulado" />
                  </LineChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>

            {/* Comprehensive Cash Flow Table */}
            <Card bg={cardBg} borderColor={borderColor} mt={6}>
              <CardHeader>
                <Heading size="md">Flujo de Caja Completo del Proyecto</Heading>
                <Text fontSize="sm" color="gray.600">
                  Combina ingresos por ventas, financiamiento y todos los costos del proyecto
                </Text>
              </CardHeader>
              <CardBody>
                {(() => {
                  // Group by year for tabs
                  const cashFlowByYear = comprehensiveCashFlow.reduce((acc, row) => {
                    if (!acc[row.year]) acc[row.year] = [];
                    acc[row.year].push(row);
                    return acc;
                  }, {});
                  
                  const years = Object.keys(cashFlowByYear).map(Number).sort();
                  
                  if (years.length === 0) {
                    return (
                      <Alert status="info">
                        <AlertIcon />
                        No hay datos de flujo de caja disponibles. Configure líneas de crédito y costos para ver el flujo completo.
                      </Alert>
                    );
                  }
                  
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
                                    <Th isNumeric>Ingresos por Ventas</Th>
                                    <Th isNumeric>Pagos a Líneas de Crédito</Th>
                                    <Th isNumeric>Costos del Proyecto</Th>
                                    <Th isNumeric>Gastos por Intereses</Th>
                                    <Th isNumeric>Total Egresos</Th>
                                    <Th isNumeric>Flujo Neto</Th>
                                    <Th isNumeric>Flujo Acumulado</Th>
                                    <Th isNumeric>Balance Líneas Crédito</Th>
                                  </Tr>
                                </Thead>
                                <Tbody>
                                  {cashFlowByYear[year].map((row, index) => {
                                    const monthNames = [
                                      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                                      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
                                    ];
                                    const monthName = monthNames[row.month - 1] || row.period;
                                    
                                    return (
                                      <Tr key={row.period} bg={row.netCashFlow < 0 ? 'red.50' : 'green.50'}>
                                        <Td fontWeight="bold">{monthName}</Td>
                                        <Td isNumeric color="green.600">
                                          {row.salesRevenue > 0 ? formatCurrency(row.salesRevenue) : '-'}
                                        </Td>
                                        <Td isNumeric color="blue.600">
                                          {row.automaticPayments > 0 ? formatCurrency(row.automaticPayments) : '-'}
                                        </Td>
                                        <Td isNumeric color="orange.600">
                                          {row.projectCosts > 0 ? formatCurrency(row.projectCosts) : '-'}
                                        </Td>
                                        <Td isNumeric color="red.600">
                                          {row.interestExpense > 0 ? formatCurrency(row.interestExpense) : '-'}
                                        </Td>
                                        <Td isNumeric color="red.600" fontWeight="semibold">
                                          {row.totalExpenses > 0 ? formatCurrency(row.totalExpenses) : '-'}
                                        </Td>
                                        <Td isNumeric fontWeight="bold" color={row.netCashFlow >= 0 ? 'green.600' : 'red.600'}>
                                          {formatCurrency(row.netCashFlow)}
                                        </Td>
                                        <Td isNumeric fontWeight="bold" color={row.cumulativeCashFlow >= 0 ? 'green.600' : 'red.600'}>
                                          {formatCurrency(row.cumulativeCashFlow)}
                                        </Td>
                                        <Td isNumeric color="purple.600">
                                          {row.creditLineBalance > 0 ? formatCurrency(row.creditLineBalance) : '-'}
                                        </Td>
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
                })()}
              </CardBody>
            </Card>
          </TabPanel>

          {/* Cost Items Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              {/* Cost Summary Cards */}
              <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
                <Card>
                  <CardBody>
                    <Text fontSize="sm" color="gray.500" fontWeight="semibold">TOTAL COSTOS PROYECTADOS</Text>
                    <Text fontSize="2xl" fontWeight="bold" color="red.500">
                      {formatCurrency(costItems.reduce((sum, item) => sum + (Number(item.monto_proyectado) || 0), 0))}
                    </Text>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody>
                    <Text fontSize="sm" color="gray.500" fontWeight="semibold">TOTAL COSTOS REALES</Text>
                    <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                      {formatCurrency(costItems.reduce((sum, item) => sum + (Number(item.monto_real) || 0), 0))}
                    </Text>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody>
                    <Text fontSize="sm" color="gray.500" fontWeight="semibold">VARIACIÓN</Text>
                    <Text fontSize="2xl" fontWeight="bold" color={
                      (costItems.reduce((sum, item) => sum + (Number(item.monto_real) || 0), 0) - 
                       costItems.reduce((sum, item) => sum + (Number(item.monto_proyectado) || 0), 0)) <= 0 ? 'green.500' : 'red.500'
                    }>
                      {formatCurrency(
                        costItems.reduce((sum, item) => sum + (Number(item.monto_real) || 0), 0) - 
                        costItems.reduce((sum, item) => sum + (Number(item.monto_proyectado) || 0), 0)
                      )}
                    </Text>
                    <Text fontSize="sm" color="gray.500">Real vs Proyectado</Text>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody>
                    <Text fontSize="sm" color="gray.500" fontWeight="semibold">ITEMS DE COSTO</Text>
                    <Text fontSize="2xl" fontWeight="bold">{costItems.length}</Text>
                    <Text fontSize="sm" color="gray.500">Partidas activas</Text>
                  </CardBody>
                </Card>
              </SimpleGrid>

              {/* Cost by Category Analysis */}
              <Card bg={cardBg} borderColor={borderColor}>
                <CardHeader>
                  <Heading size="md">Análisis por Categoría</Heading>
                </CardHeader>
                <CardBody>
                  <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                    {/* Category Summary Table */}
                    <Box>
                      <Heading size="sm" mb={4}>Resumen por Categoría</Heading>
                      <TableContainer>
                        <Table variant="simple" size="sm">
                          <Thead>
                            <Tr>
                              <Th>Categoría</Th>
                              <Th isNumeric>Items</Th>
                              <Th isNumeric>Proyectado</Th>
                              <Th isNumeric>Real</Th>
                              <Th isNumeric>% del Total</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {Object.entries(costByCategory).map(([category, data]) => (
                              <Tr key={category}>
                                <Td>
                                  <Badge colorScheme={getCategoriaColor(category)} size="sm">
                                    {category}
                                  </Badge>
                                </Td>
                                <Td isNumeric>{data.count}</Td>
                                <Td isNumeric>{formatCurrency(data.projected)}</Td>
                                <Td isNumeric>{formatCurrency(data.actual)}</Td>
                                <Td isNumeric>{formatPercentage(data.percentage)}</Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </TableContainer>
                    </Box>

                    {/* Visual Chart Placeholder */}
                    <Box>
                      <Heading size="sm" mb={4}>Distribución de Costos</Heading>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={Object.entries(costByCategory).map(([category, data]) => ({
                          categoria: category,
                          proyectado: data.projected,
                          real: data.actual
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="categoria" />
                          <YAxis />
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                          <Legend />
                          <Bar dataKey="proyectado" fill="#3182CE" name="Proyectado" />
                          <Bar dataKey="real" fill="#E53E3E" name="Real" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </SimpleGrid>
                </CardBody>
              </Card>

              {/* Detailed Cost Items */}
              <Card bg={cardBg} borderColor={borderColor}>
                <CardHeader>
                  <Flex justify="space-between" align="center">
                    <Heading size="md">Detalle de Items de Costo</Heading>
                    <Button leftIcon={<FaPlus />} colorScheme="teal" onClick={onAddCostOpen}>
                      Agregar Item
                    </Button>
                  </Flex>
                </CardHeader>
                <CardBody>
                  <TableContainer>
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Categoría</Th>
                          <Th>Subcategoría</Th>
                          <Th>Partida</Th>
                          <Th>Base de Costo</Th>
                          <Th isNumeric>Mes Inicio</Th>
                          <Th isNumeric>Duración</Th>
                          <Th isNumeric>Monto Proyectado</Th>
                          <Th isNumeric>Monto Real</Th>
                          <Th isNumeric>Variación</Th>
                          <Th>Estado</Th>
                          <Th>Acciones</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {costItems.map((item) => {
                          const projected = Number(item.monto_proyectado) || 0;
                          const actual = Number(item.monto_real) || 0;
                          const variance = actual - projected;
                          
                          return (
                            <Tr key={item.id}>
                              <Td>
                                <Badge colorScheme={getCategoriaColor(item.categoria)} size="sm">
                                  {item.categoria}
                                </Badge>
                              </Td>
                              <Td fontSize="sm">{item.subcategoria}</Td>
                              <Td fontWeight="medium">{item.partida_costo}</Td>
                              <Td fontSize="sm">
                                <Badge variant="outline" size="sm">
                                  {item.base_costo}
                                </Badge>
                              </Td>
                              <Td isNumeric fontSize="sm">{item.start_month || '-'}</Td>
                              <Td isNumeric fontSize="sm">{item.duration_months || '-'}</Td>
                              <Td isNumeric>{formatCurrency(projected)}</Td>
                              <Td isNumeric>{actual > 0 ? formatCurrency(actual) : '-'}</Td>
                              <Td isNumeric>
                                {actual > 0 ? (
                                  <Text color={variance > 0 ? 'red.500' : variance < 0 ? 'green.500' : 'gray.500'}>
                                    {formatCurrency(variance)}
                                  </Text>
                                ) : '-'}
                              </Td>
                              <Td>
                                <Badge 
                                  colorScheme={item.is_active ? 'green' : 'gray'} 
                                  size="sm"
                                >
                                  {item.is_active ? 'Activo' : 'Inactivo'}
                                </Badge>
                              </Td>
                              <Td>
                                <HStack spacing={1}>
                                  <IconButton
                                    icon={<FaEdit />}
                                    aria-label="Editar item"
                                    size="xs"
                                    variant="ghost"
                                    onClick={() => openEditCostItem(item)}
                                  />
                                  <IconButton
                                    icon={<FaTrash />}
                                    aria-label="Eliminar item"
                                    size="xs"
                                    variant="ghost"
                                    colorScheme="red"
                                    onClick={() => deleteCostItem(item.id, item.partida_costo)}
                                  />
                                </HStack>
                              </Td>
                            </Tr>
                          );
                        })}
                      </Tbody>
                    </Table>
                  </TableContainer>
                </CardBody>
              </Card>

              {/* Monthly Cost Breakdown Table */}
              <Card bg={cardBg} borderColor={borderColor}>
                <CardHeader>
                  <HStack justify="space-between">
                    <Heading size="md">Desglose de Costos Mensuales</Heading>
                    <Button 
                      size="sm" 
                      colorScheme="orange" 
                      variant="outline"
                      onClick={async () => {
                        try {
                          const response = await fetch(`${API_BASE_URL}/api/scenario-projects/${id}/financing-debug`);
                          const debugData = await response.json();
                          console.log('Financing Debug Data:', debugData);
                          
                          const deliveryEndInfo = project?.delivery_end_date 
                            ? new Date(project.delivery_end_date).toLocaleDateString()
                            : 'No especificado';
                          
                          toast({
                            title: 'Debug Info',
                            description: `Líneas: ${debugData.credit_lines_count}, Costos: $${debugData.sample_financing_costs}. Entrega hasta: ${deliveryEndInfo}`,
                            status: 'info',
                            duration: 7000,
                            isClosable: true,
                          });
                        } catch (error) {
                          console.error('Debug error:', error);
                        }
                      }}
                    >
                      Debug Financiación
                    </Button>
                  </HStack>
                </CardHeader>
                <CardBody>
                  <TableContainer>
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Período</Th>
                          <Th isNumeric>Terreno</Th>
                          <Th isNumeric>Costos Duros</Th>
                          <Th isNumeric>Costos Blandos</Th>
                          <Th isNumeric>Financiación</Th>
                          <Th isNumeric>Marketing</Th>
                          <Th isNumeric>Total Egresos</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {monthlyCostData.map((cf, index) => (
                          <Tr key={`${cf.period}-${index}`}>
                            <Td>{cf.period}</Td>
                            <Td isNumeric>{formatCurrency(cf.terreno)}</Td>
                            <Td isNumeric>{formatCurrency(cf.duros)}</Td>
                            <Td isNumeric>{formatCurrency(cf.blandos)}</Td>
                            <Td isNumeric>{formatCurrency(cf.financiacion)}</Td>
                            <Td isNumeric>{formatCurrency(cf.marketing)}</Td>
                            <Td isNumeric fontWeight="bold">{formatCurrency(cf.total)}</Td>
                          </Tr>
                        ))}
                        {/* TOTAL Row */}
                        {monthlyCostData.length > 0 && (
                          <Tr bg="gray.50" borderTop="2px solid" borderColor="gray.300">
                            <Td fontWeight="bold">TOTAL</Td>
                            <Td isNumeric fontWeight="bold">
                              {formatCurrency(monthlyCostData.reduce((sum, cf) => sum + cf.terreno, 0))}
                            </Td>
                            <Td isNumeric fontWeight="bold">
                              {formatCurrency(monthlyCostData.reduce((sum, cf) => sum + cf.duros, 0))}
                            </Td>
                            <Td isNumeric fontWeight="bold">
                              {formatCurrency(monthlyCostData.reduce((sum, cf) => sum + cf.blandos, 0))}
                            </Td>
                            <Td isNumeric fontWeight="bold">
                              {formatCurrency(monthlyCostData.reduce((sum, cf) => sum + cf.financiacion, 0))}
                            </Td>
                            <Td isNumeric fontWeight="bold">
                              {formatCurrency(monthlyCostData.reduce((sum, cf) => sum + cf.marketing, 0))}
                            </Td>
                            <Td isNumeric fontWeight="bold" color="red.600">
                              {formatCurrency(monthlyCostData.reduce((sum, cf) => sum + cf.total, 0))}
                            </Td>
                          </Tr>
                        )}
                      </Tbody>
                    </Table>
                  </TableContainer>
                </CardBody>
              </Card>
            </VStack>
          </TabPanel>

          {/* Units Tab */}
          <TabPanel>
            <ProjectUnitsManager 
              projectId={id!} 
              onFinancialsRecalculated={onFinancialsRecalculated}
              project={project}
            />
          </TabPanel>

          {/* Stages Tab */}
          <TabPanel>
            <ProjectStagesManager projectId={id!} />
          </TabPanel>

          {/* Financing Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              {/* Credit Lines */}
              <Card bg={cardBg} borderColor={borderColor}>
                <CardHeader>
                  <Flex justify="space-between" align="center">
                    <Heading size="md">Líneas de Crédito</Heading>
                    <Button leftIcon={<FaPlus />} colorScheme="blue" onClick={onAddCreditOpen}>
                      Agregar Línea
                    </Button>
                  </Flex>
                </CardHeader>
                <CardBody>
                  {loadingCreditLines ? (
                    <Center><Spinner /></Center>
                  ) : (
                    <TableContainer>
                      <Table variant="simple">
                        <Thead>
                          <Tr>
                            <Th>Nombre</Th>
                            <Th>Tipo</Th>
                            <Th isNumeric>Monto Total</Th>
                            <Th isNumeric>Monto Disponible</Th>
                            <Th isNumeric>Tasa Interés</Th>
                            <Th>Acciones</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {creditLines.map((line) => (
                            <Tr key={line.id}>
                              <Td>{line.nombre}</Td>
                              <Td>{line.tipo_linea}</Td>
                              <Td isNumeric>{formatCurrency(line.monto_total_linea)}</Td>
                              <Td isNumeric>{formatCurrency(line.monto_disponible)}</Td>
                              <Td isNumeric>{formatPercentage(line.interest_rate)}</Td>
                              <Td>
                                <IconButton
                                  icon={<FaCalendarPlus />}
                                  aria-label="Ver/Agregar Usos"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openUsageModal(line)}
                                />
                                <IconButton
                                  icon={<FaTrash />}
                                  aria-label="Eliminar línea"
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="red"
                                  onClick={() => deleteCreditLine(line.id, line.nombre)}
                                />
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </TableContainer>
                  )}
                </CardBody>
              </Card>

              {/* Credit Requirements */}
              <Card bg={cardBg} borderColor={borderColor}>
                <CardHeader>
                  <Heading size="md">Requerimientos de Financiamiento</Heading>
                </CardHeader>
                <CardBody>
                  {loadingCreditRequirements ? (
                    <Center><Spinner /></Center>
                  ) : creditRequirements ? (
                    <VStack align="stretch" spacing={4}>
                      <Text>
                        Basado en los costos del proyecto, se estima una necesidad de financiamiento de{' '}
                        <Text as="b" color="blue.500" fontSize="lg">
                          {formatCurrency(creditRequirements.total_financing_needed)}
                        </Text>
                        , lo que representa un{' '}
                        <Text as="b">{formatPercentage(creditRequirements.financing_ratio)}</Text> del costo total.
                      </Text>
                      <Heading size="sm" mt={4}>Líneas de Crédito Recomendadas</Heading>
                      <UnorderedList spacing={3}>
                        {creditRequirements.recommended_credit_lines.map((rec, index) => (
                          <ListItem key={index}>
                            <Text as="b">{rec.tipo_linea} - {formatCurrency(rec.monto_recomendado)}</Text>
                            <Text fontSize="sm" color="gray.600">{rec.justificacion}</Text>
                          </ListItem>
                        ))}
                      </UnorderedList>
                    </VStack>
                  ) : (
                    <Text>No se pudieron calcular los requerimientos de financiamiento.</Text>
                  )}
                </CardBody>
              </Card>

              {/* Monthly Timeline */}
              <Card bg={cardBg} borderColor={borderColor}>
                <CardHeader>
                  <Heading size="md">Línea de Tiempo Mensual del Financiamiento</Heading>
                </CardHeader>
                <CardBody>
                  {loadingTimeline ? (
                    <Center><Spinner /></Center>
                  ) : monthlyTimeline ? (
                    <VStack spacing={4} align="stretch">
                      {/* Summary */}
                      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                        <Card>
                          <CardBody>
                            <Text fontSize="sm" color="gray.500" fontWeight="semibold">TOTAL LÍNEAS DE CRÉDITO</Text>
                            <Text fontSize="2xl" fontWeight="bold">{monthlyTimeline.summary.total_lines}</Text>
                          </CardBody>
                        </Card>
                        <Card>
                          <CardBody>
                            <Text fontSize="sm" color="gray.500" fontWeight="semibold">LÍMITE TOTAL DE CRÉDITO</Text>
                            <Text fontSize="2xl" fontWeight="bold">{formatCurrency(monthlyTimeline.summary.total_credit_limit)}</Text>
                          </CardBody>
                        </Card>
                        <Card>
                          <CardBody>
                            <Text fontSize="sm" color="gray.500" fontWeight="semibold">BALANCE FINAL PROYECTADO</Text>
                            <Text fontSize="2xl" fontWeight="bold" color={monthlyTimeline.summary.final_total_balance > 0 ? 'red.500' : 'green.500'}>
                              {formatCurrency(monthlyTimeline.summary.final_total_balance)}
                            </Text>
                          </CardBody>
                        </Card>
                      </SimpleGrid>
                      
                      <Divider />
                      
                      {/* Year-based Tabs matching Flujo de Caja por Ventas format */}
                      {(() => {
                        // Group timeline data by year similar to cash flow format
                        const timelineByYear = monthlyTimeline.timeline.reduce((acc, row) => {
                          const year = parseInt(row.period_label.split('-')[0]);
                          if (!acc[year]) acc[year] = [];
                          acc[year].push(row);
                          return acc;
                        }, {} as Record<number, any[]>);

                        const years = Object.keys(timelineByYear).map(Number).sort();
                        
                        if (years.length === 0) {
                          return (
                            <Text>No hay datos de línea de tiempo disponibles.</Text>
                          );
                        }
                        
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
                                          <Th isNumeric>Ingresos Totales</Th>
                                          <Th isNumeric>Pagos Automáticos a Líneas de Crédito</Th>
                                          <Th isNumeric>Gastos por Intereses</Th>
                                          <Th isNumeric>Balance de Líneas de Crédito</Th>
                                        </Tr>
                                      </Thead>
                                      <Tbody>
                                        {timelineByYear[year].map((row, index) => {
                                          // Extract month name from period_label (YYYY-MM format)
                                          const monthNames = [
                                            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                                            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
                                          ];
                                          const monthNumber = parseInt(row.period_label.split('-')[1]) - 1;
                                          const monthName = monthNames[monthNumber] || row.period_label;
                                          
                                          // Create separate rows for different financing activities if there's data
                                          const activities = [];
                                          
                                          if (row.sales_revenue > 0) {
                                            activities.push({
                                              activity_name: 'INGRESOS POR VENTAS',
                                              value: row.sales_revenue,
                                              bgColor: 'green.50'
                                            });
                                          }
                                          
                                          if (row.automatic_payments > 0) {
                                            activities.push({
                                              activity_name: 'PAGOS AUTOMÁTICOS',
                                              value: row.automatic_payments,
                                              bgColor: 'blue.50'
                                            });
                                          }
                                          
                                          if (row.total_interest > 0) {
                                            activities.push({
                                              activity_name: 'GASTOS POR INTERESES',
                                              value: row.total_interest,
                                              bgColor: 'red.50'
                                            });
                                          }
                                          
                                          // If no specific activities, show a summary row
                                          if (activities.length === 0 && (row.sales_revenue > 0 || row.automatic_payments > 0 || row.total_interest > 0 || row.total_balance !== 0)) {
                                            activities.push({
                                              activity_name: 'FINANCIAMIENTO MENSUAL',
                                              value: 0,
                                              bgColor: 'gray.50'
                                            });
                                          }
                                          
                                          return activities.map((activity, activityIndex) => (
                                            <Tr key={`${row.period_label}-${activityIndex}`} bg={activity.bgColor}>
                                              <Td fontWeight="bold">{monthName}</Td>
                                              <Td fontWeight="bold">{activity.activity_name}</Td>
                                              <Td isNumeric>
                                                {row.sales_revenue ? formatCurrency(row.sales_revenue) : '-'}
                                              </Td>
                                              <Td isNumeric>
                                                {row.automatic_payments ? formatCurrency(row.automatic_payments) : '-'}
                                              </Td>
                                              <Td isNumeric>
                                                {row.total_interest ? formatCurrency(row.total_interest) : '-'}
                                              </Td>
                                              <Td isNumeric>
                                                {row.total_balance ? formatCurrency(row.total_balance) : '-'}
                                              </Td>
                                            </Tr>
                                          ));
                                        })}
                                      </Tbody>
                                    </Table>
                                  </TableContainer>
                                </TabPanel>
                              ))}
                            </TabPanels>
                          </Tabs>
                        );
                      })()}
                      
                      {/* Financial Summary */}
                      <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4} mt={4}>
                        <Card>
                          <CardBody>
                            <Text fontSize="sm" color="gray.500" fontWeight="semibold">TOTAL INTERESES PROYECTADOS</Text>
                            <Text fontSize="2xl" fontWeight="bold" color="red.500">
                              {formatCurrency(monthlyTimeline.summary.total_interest_projected)}
                            </Text>
                          </CardBody>
                        </Card>
                        <Card>
                          <CardBody>
                            <Text fontSize="sm" color="gray.500" fontWeight="semibold">TOTAL DESEMBOLSOS PROYECTADOS</Text>
                            <Text fontSize="2xl" fontWeight="bold">
                              {formatCurrency(monthlyTimeline.summary.total_withdrawals_projected)}
                            </Text>
                          </CardBody>
                        </Card>
                        <Card>
                          <CardBody>
                            <Text fontSize="sm" color="gray.500" fontWeight="semibold">TOTAL PAGOS AUTOMÁTICOS</Text>
                            <Text fontSize="2xl" fontWeight="bold" color="teal.500">
                              {formatCurrency(monthlyTimeline.summary.total_automatic_payments_projected || 0)}
                            </Text>
                            <Text fontSize="sm" color="gray.500">Desde ingresos por ventas</Text>
                          </CardBody>
                        </Card>
                        <Card>
                          <CardBody>
                            <Text fontSize="sm" color="gray.500" fontWeight="semibold">TOTAL INGRESOS VENTAS</Text>
                            <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                              {formatCurrency(monthlyTimeline.summary.total_sales_revenue_projected || 0)}
                            </Text>
                          </CardBody>
                        </Card>
                      </SimpleGrid>
                      
                      {/* Payment Distribution Configuration Display */}
                      {monthlyTimeline.summary.payment_distribution_config && (
                        <Box mt={4} p={4} border="1px" borderColor="gray.200" borderRadius="md">
                          <Text fontSize="sm" fontWeight="semibold" mb={3}>Configuración de Distribución de Pagos:</Text>
                          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                            <Text fontSize="xs">
                              <Text as="span" fontWeight="bold">Separación:</Text> {' '}
                              {(monthlyTimeline.summary.payment_distribution_config.separation_payment_percentage * 100).toFixed(1)}% al desarrollador, {' '}
                              {(monthlyTimeline.summary.payment_distribution_config.separation_credit_line_percentage * 100).toFixed(1)}% a líneas de crédito
                            </Text>
                            <Text fontSize="xs">
                              <Text as="span" fontWeight="bold">Entrega:</Text> {' '}
                              {(monthlyTimeline.summary.payment_distribution_config.delivery_payment_percentage * 100).toFixed(1)}% al desarrollador, {' '}
                              {(monthlyTimeline.summary.payment_distribution_config.delivery_credit_line_percentage * 100).toFixed(1)}% a líneas de crédito
                            </Text>
                          </SimpleGrid>
                        </Box>
                      )}
                    </VStack>
                  ) : (
                    <Text>No hay datos de línea de tiempo disponibles.</Text>
                  )}
                </CardBody>
              </Card>
            </VStack>
          </TabPanel>

          {/* Sensitivity Analysis Tab */}
          <TabPanel>
            <Card bg={cardBg} borderColor={borderColor}>
              <CardHeader>
                <Heading size="md">Análisis de Sensibilidad</Heading>
              </CardHeader>
              <CardBody>
                <HStack spacing={4} mb={6}>
                  <Button
                    onClick={() => runSensitivityAnalysis('PRICE_PER_M2')}
                    isLoading={isAnalyzing && selectedAnalysisType === 'PRICE_PER_M2'}
                  >
                    Analizar Precio por m²
                  </Button>
                  <Button
                    onClick={() => runSensitivityAnalysis('TOTAL_UNITS')}
                    isLoading={isAnalyzing && selectedAnalysisType === 'TOTAL_UNITS'}
                  >
                    Analizar # de Unidades
                  </Button>
                  <Button
                    onClick={() => runSensitivityAnalysis('DISCOUNT_RATE')}
                    isLoading={isAnalyzing && selectedAnalysisType === 'DISCOUNT_RATE'}
                  >
                    Analizar Tasa de Descuento
                  </Button>
                </HStack>
                
                {sensitivityResults.length > 0 && (
                  <VStack spacing={8} align="stretch">
                    {sensitivityResults.map((analysis, index) => (
                      <Box key={index}>
                        <Heading size="sm" mb={4}>
                          {analysis.variable_name} vs. VAN y TIR
                        </Heading>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={analysis.results}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="variation_pct" 
                              tickFormatter={(value) => `${value}%`}
                              label={{ value: 'Variación %', position: 'insideBottom', offset: -5 }}
                            />
                            <YAxis yAxisId="left" label={{ value: 'VAN', angle: -90, position: 'insideLeft' }} />
                            <YAxis yAxisId="right" orientation="right" label={{ value: 'TIR', angle: -90, position: 'insideRight' }} />
                            <Tooltip 
                              formatter={(value: unknown, name: string) => {
                                // Recharts passes value as (string | number)[] for stacked/combined series, or as string|number for single series
                                if (Array.isArray(value)) {
                                  // Take the first value for display
                                  value = value[0];
                                }
                                return name === 'irr' ? formatPercentage(value as number) : formatCurrency(value as number);
                              }}
                              labelFormatter={(label: unknown) => `Variación: ${label}%`}
                            />
                            <Legend />
                            <Line yAxisId="left" type="monotone" dataKey="npv" stroke="#8884d8" name="VAN" />
                            <Line yAxisId="right" type="monotone" dataKey="irr" stroke="#82ca9d" name="TIR" />
                          </LineChart>
                        </ResponsiveContainer>
                      </Box>
                    ))}
                  </VStack>
                )}
              </CardBody>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Edit Cost Item Modal */}
      <Modal isOpen={isEditCostOpen} onClose={onEditCostClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Editar Item de Costo</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Categoría</FormLabel>
                <Select
                  value={editCostItem.categoria}
                  onChange={(e) => setEditCostItem({...editCostItem, categoria: e.target.value})}
                >
                  <option value="COSTOS DUROS">COSTOS DUROS</option>
                  <option value="COSTOS BLANDOS">COSTOS BLANDOS</option>
                  <option value="TERRENO">TERRENO</option>
                  <option value="CONTINGENCIA">CONTINGENCIA</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Subcategoría</FormLabel>
                <Input
                  value={editCostItem.subcategoria}
                  onChange={(e) => setEditCostItem({...editCostItem, subcategoria: e.target.value})}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Partida</FormLabel>
                <Input
                  value={editCostItem.partida_costo}
                  onChange={(e) => setEditCostItem({...editCostItem, partida_costo: e.target.value})}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Base de Costo</FormLabel>
                <Select
                  value={editCostItem.base_costo}
                  onChange={(e) => setEditCostItem({...editCostItem, base_costo: e.target.value})}
                >
                  <option value="fijo">Monto Fijo</option>
                  <option value="por m² construcción">Por m² Construcción</option>
                  <option value="por m² propiedad">Por m² Propiedad</option>
                  <option value="por unidad">Por Unidad</option>
                  <option value="mensual">Mensual</option>
                  <option value="porcentaje">Porcentaje</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Monto Proyectado</FormLabel>
                <Input
                  value={editCostItem.monto_proyectado}
                  onChange={(e) => setEditCostItem({...editCostItem, monto_proyectado: e.target.value})}
                  placeholder="0.00"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Costo Unitario</FormLabel>
                <Input
                  value={editCostItem.unit_cost}
                  onChange={(e) => setEditCostItem({...editCostItem, unit_cost: e.target.value})}
                  placeholder="0.00"
                />
              </FormControl>

              <HStack spacing={4} width="100%">
                <FormControl>
                  <FormLabel>Cantidad</FormLabel>
                  <Input
                    value={editCostItem.quantity}
                    onChange={(e) => setEditCostItem({...editCostItem, quantity: e.target.value})}
                    placeholder="1"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>% de Base</FormLabel>
                  <Input
                    value={editCostItem.percentage_of_base}
                    onChange={(e) => setEditCostItem({...editCostItem, percentage_of_base: e.target.value})}
                    placeholder="0"
                  />
                </FormControl>
              </HStack>

              <HStack spacing={4} width="100%">
                <FormControl>
                  <FormLabel>Mes Inicio</FormLabel>
                  <Input
                    value={editCostItem.start_month}
                    onChange={(e) => setEditCostItem({...editCostItem, start_month: e.target.value})}
                    placeholder="1"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Duración (meses)</FormLabel>
                  <Input
                    value={editCostItem.duration_months}
                    onChange={(e) => setEditCostItem({...editCostItem, duration_months: e.target.value})}
                    placeholder="1"
                  />
                </FormControl>
              </HStack>

              <FormControl>
                <FormLabel>Notas</FormLabel>
                <Textarea
                  value={editCostItem.notes}
                  onChange={(e) => setEditCostItem({...editCostItem, notes: e.target.value})}
                  placeholder="Notas adicionales..."
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEditCostClose}>
              Cancelar
            </Button>
            <Button colorScheme="blue" onClick={updateCostItem}>
              Guardar Cambios
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ScenarioProjectDetailPage;
