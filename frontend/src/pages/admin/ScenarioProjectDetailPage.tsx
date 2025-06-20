import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  VStack,
  HStack,
  Text,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  IconButton,
  useToast,
  useDisclosure,
  Spinner,
  Center,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
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
  Progress
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
  FaList
} from 'react-icons/fa';
import { Link as RouterLink, useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { API_BASE_URL, projectCreditLinesApi } from '../../api/api';

// TypeScript interfaces
interface ScenarioProject {
  id: number;
  name: string;
  description?: string;
  location?: string;
  status: string;
  start_date?: string;
  end_date?: string;
  total_area_m2?: number;
  buildable_area_m2?: number;
  total_units?: number;
  avg_unit_size_m2?: number;
  target_price_per_m2?: number;
  expected_sales_period_months?: number;
  discount_rate: number;
  inflation_rate: number;
  contingency_percentage: number;
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

interface SalesScenarioConfig {
  scenario_name: string;
  period_0_6_months: number;
  period_6_12_months: number;
  period_12_18_months: number;
  period_18_24_months: number;
  period_24_plus_months?: number;
}

interface SalesScenarioMetrics {
  scenario_name: string;
  npv?: number;
  irr?: number;
  payback_months?: number;
  max_exposure?: number;
  total_revenue?: number;
  total_profit?: number;
}

interface SalesSimulationResponse {
  success: boolean;
  message: string;
  scenarios: SalesScenarioMetrics[];
  cash_flow_comparison: Array<{
    month: string;
    scenario: string;
    accumulated_flow: number;
  }>;
  company_impact: {
    min_liquidity_required: number;
    recommended_credit_line: number;
    liquidity_risk_level: string;
    critical_month: number;
    recommendations: string[];
  };
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
  const [salesSimulation, setSalesSimulation] = useState<SalesSimulationResponse | null>(null);
  const [sensitivityAnalyses, setSensitivityAnalyses] = useState<any[]>([]);
  const [baselineComparison, setBaselineComparison] = useState<any>(null);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [simulatingCashFlow, setSimulatingCashFlow] = useState(false);
  const [simulatingSales, setSimulatingSales] = useState(false);
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
    tipo_linea: 'credito_construccion',
    monto_total_linea: '',
    fecha_inicio: '',
    fecha_fin: '',
    interest_rate: '0.12',
    plazo_meses: '24',
    periodicidad_pago: 'mensual',
    valor_activo: '',
    valor_residual: '',
    porcentaje_financiamiento: '0.80',
    garantia_tipo: 'hipotecaria',
    garantia_descripcion: '',
    banco_emisor: '',
    documento_respaldo: '',
    moneda: 'USD',
    beneficiario: ''
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
    contingency_percentage: ''
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
  const [editingCostItem, setEditingCostItem] = useState<CostItem | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [simulationResults, setSimulationResults] = useState<SalesSimulationResponse | null>(null);
  const [cashFlowImpact, setCashFlowImpact] = useState<any>(null);

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Add sensitivity analysis state
  const [sensitivityResults, setSensitivityResults] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedAnalysisType, setSelectedAnalysisType] = useState<string | null>(null);
  const [analysisConfig, setAnalysisConfig] = useState({
    min_variation_pct: -30,
    max_variation_pct: 30,
    steps: 13
  });



  useEffect(() => {
    if (id) {
      fetchProjectDetails();
      fetchCostItems();
      fetchMetrics();
      fetchCashFlow();
      fetchCashFlowImpact();
      fetchSensitivityAnalyses();
      fetchCreditLines();
      fetchCreditRequirements();
    }
  }, [id]);

  // Fetch baseline comparison when project is approved
  useEffect(() => {
    if (project && project.status === 'APPROVED') {
      fetchBaselineComparison();
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
      const response = await fetch(`${API_BASE_URL}/api/scenario-projects/${id}/cash-flow`);
      if (response.ok) {
        const data = await response.json();
        setCashFlow(data);
      }
    } catch (error) {
      console.error('Cash flow not available yet');
    }
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
          fetchMetrics();
          fetchCashFlow();
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
    setEditingCostItem(item);
    
    // Map old base_costo values to new ones
    const mapBaseCosto = (baseCosto: string) => {
      const mapping: { [key: string]: string } = {
        'Monto Fijo': 'fijo',
        'Monto Fijo / por m³': 'fijo',
        'Monto Fijo Mensual': 'fijo',
        'Calculado': 'fijo',
        'por m²': 'por m²',
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
      case 'ACTIVE': return 'green';
      case 'COMPLETED': return 'blue';
      case 'ARCHIVED': return 'gray';
      default: return 'yellow';
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

  const simulateSalesScenarios = async () => {
    try {
      setSimulating(true);
      
      const optimisticScenario: SalesScenarioConfig = {
        scenario_name: 'optimista',
        period_0_6_months: 40,
        period_6_12_months: 35,
        period_12_18_months: 20,
        period_18_24_months: 5,
        period_24_plus_months: 0
      };

      const realisticScenario: SalesScenarioConfig = {
        scenario_name: 'realista',
        period_0_6_months: 25,
        period_6_12_months: 30,
        period_12_18_months: 25,
        period_18_24_months: 20,
        period_24_plus_months: 0
      };

      const conservativeScenario: SalesScenarioConfig = {
        scenario_name: 'conservador',
        period_0_6_months: 15,
        period_6_12_months: 20,
        period_12_18_months: 25,
        period_18_24_months: 25,
        period_24_plus_months: 15
      };

      const response = await fetch(`${API_BASE_URL}/api/scenario-projects/${id}/simulate-sales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          optimistic_scenario: optimisticScenario,
          realistic_scenario: realisticScenario,
          conservative_scenario: conservativeScenario
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setSimulationResults(result);
        
        if (result.success) {
          toast({
            title: 'Simulación Completada',
            description: result.message,
            status: 'success',
            duration: 5000,
            isClosable: true,
          });
        } else {
          throw new Error(result.message);
        }
      }
    } catch (error) {
      toast({
        title: 'Error en Simulación',
        description: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSimulating(false);
    }
  };

  // Prepare chart data
  const chartData = cashFlow.map(cf => ({
    period: cf.period_label,
    ingresos: cf.total_ingresos,
    egresos: cf.total_egresos,
    flujo_neto: cf.flujo_neto,
    flujo_acumulado: cf.flujo_acumulado
  }));

  const costByCategory = costItems.reduce((acc, item) => {
    const category = item.categoria;
    
    // Calculate actual cost based on cost type
    let actualCost = 0;
    if (item.base_costo === 'por m²' && item.unit_cost && project?.total_units && project?.avg_unit_size_m2) {
      // Cost per m² × total area
      actualCost = Number(item.unit_cost) * Number(project.total_units) * Number(project.avg_unit_size_m2);
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
    
    acc[category] = (acc[category] || 0) + actualCost;
    return acc;
  }, {} as Record<string, number>);

  const categoryData = Object.entries(costByCategory).map(([name, value]) => ({
    name,
    value
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
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Get existing sensitivity analyses
  const fetchSensitivityAnalyses = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/scenario-projects/${id}/sensitivity-analyses`);
      if (response.ok) {
        const analyses = await response.json();
        setSensitivityResults(analyses);
      }
    } catch (error) {
      console.error('Error fetching sensitivity analyses:', error);
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

  const addCreditLine = async () => {
    try {
      const creditLineData = {
        ...newCreditLine,
        monto_total_linea: parseFloat(newCreditLine.monto_total_linea),
        interest_rate: newCreditLine.interest_rate ? parseFloat(newCreditLine.interest_rate) : undefined,
        cargos_apertura: newCreditLine.cargos_apertura ? parseFloat(newCreditLine.cargos_apertura) : undefined,
        plazo_meses: newCreditLine.plazo_meses ? parseInt(newCreditLine.plazo_meses) : undefined,
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
        es_simulacion: true
      });
      onAddCreditClose();
      fetchCreditLines();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Error de conexión al crear la línea de crédito',
        status: 'error',
        duration: 5000,
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
      setEditProjectData({
        name: project.name || '',
        description: project.description || '',
        location: project.location || '',
        start_date: project.start_date ? project.start_date.split('T')[0] : '', // Convert to YYYY-MM-DD format
        end_date: project.end_date ? project.end_date.split('T')[0] : '', // Convert to YYYY-MM-DD format
        total_area_m2: project.total_area_m2 ? (typeof project.total_area_m2 === 'string' ? project.total_area_m2 : project.total_area_m2.toString()) : '',
        buildable_area_m2: project.buildable_area_m2 ? (typeof project.buildable_area_m2 === 'string' ? project.buildable_area_m2 : project.buildable_area_m2.toString()) : '',
        total_units: project.total_units ? project.total_units.toString() : '',
        avg_unit_size_m2: project.avg_unit_size_m2 ? (typeof project.avg_unit_size_m2 === 'string' ? project.avg_unit_size_m2 : project.avg_unit_size_m2.toString()) : '',
        target_price_per_m2: project.target_price_per_m2 ? (typeof project.target_price_per_m2 === 'string' ? project.target_price_per_m2 : project.target_price_per_m2.toString()) : '',
        expected_sales_period_months: project.expected_sales_period_months ? project.expected_sales_period_months.toString() : '',
        discount_rate: project.discount_rate ? (typeof project.discount_rate === 'string' ? (parseFloat(project.discount_rate) * 100).toString() : (project.discount_rate * 100).toString()) : '',
        inflation_rate: project.inflation_rate ? (typeof project.inflation_rate === 'string' ? (parseFloat(project.inflation_rate) * 100).toString() : (project.inflation_rate * 100).toString()) : '',
        contingency_percentage: project.contingency_percentage ? (typeof project.contingency_percentage === 'string' ? (parseFloat(project.contingency_percentage) * 100).toString() : (project.contingency_percentage * 100).toString()) : ''
      });
      onEditProjectOpen();
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
        contingency_percentage: parseFloat(editProjectData.contingency_percentage) / 100
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
        
        // Refresh metrics if they exist
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
          {project.status === 'DRAFT' && (
            <Button
              leftIcon={<FaEdit />}
              colorScheme="purple"
              variant="outline"
              onClick={openEditProject}
              size="lg"
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
          <Button
            leftIcon={<FaCalculator />}
            colorScheme="green"
            variant="outline"
            onClick={calculateFinancials}
            isLoading={calculating}
            loadingText="Calculando..."
          >
            Calcular Métricas
          </Button>
          {project.status === 'DRAFT' && (
            <Button
              leftIcon={<FaBuilding />}
              colorScheme="blue"
              variant="solid"
              onClick={proceedWithProject}
              size="lg"
            >
              Proceder con Proyecto
            </Button>
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
              <Text fontSize="sm" color="gray.500" fontWeight="semibold">TOTAL UNIDADES</Text>
              <Text fontSize="lg" fontWeight="bold">
                {project.total_units ? project.total_units.toLocaleString() : 'No especificado'}
              </Text>
            </VStack>
            
            <VStack align="start" spacing={2}>
              <Text fontSize="sm" color="gray.500" fontWeight="semibold">TAMAÑO PROMEDIO UNIDAD</Text>
              <Text fontSize="lg" fontWeight="bold">
                {project.avg_unit_size_m2 ? `${project.avg_unit_size_m2} m²` : 'No especificado'}
              </Text>
            </VStack>
            
            <VStack align="start" spacing={2}>
              <Text fontSize="sm" color="gray.500" fontWeight="semibold">PRECIO OBJETIVO/M²</Text>
              <Text fontSize="lg" fontWeight="bold">
                {formatCurrency(project.target_price_per_m2)}
              </Text>
            </VStack>
            
            <VStack align="start" spacing={2}>
              <Text fontSize="sm" color="gray.500" fontWeight="semibold">PERÍODO DE VENTAS</Text>
              <Text fontSize="lg" fontWeight="bold">
                {project.expected_sales_period_months ? `${project.expected_sales_period_months} meses` : 'No especificado'}
              </Text>
            </VStack>
            
            <VStack align="start" spacing={2}>
              <Text fontSize="sm" color="gray.500" fontWeight="semibold">TASA DE DESCUENTO</Text>
              <Text fontSize="lg" fontWeight="bold">
                {formatPercentage(project.discount_rate)}
              </Text>
            </VStack>
            
            <VStack align="start" spacing={2}>
              <Text fontSize="sm" color="gray.500" fontWeight="semibold">INFLACIÓN</Text>
              <Text fontSize="lg" fontWeight="bold">
                {formatPercentage(project.inflation_rate)}
              </Text>
            </VStack>
            
            <VStack align="start" spacing={2}>
              <Text fontSize="sm" color="gray.500" fontWeight="semibold">CONTINGENCIA</Text>
              <Text fontSize="lg" fontWeight="bold">
                {formatPercentage(project.contingency_percentage)}
              </Text>
            </VStack>
          </SimpleGrid>
        </CardBody>
      </Card>

      {/* Project Overview Cards */}
      <SimpleGrid columns={{ base: 2, md: 4, lg: 6 }} spacing={4} mb={8}>
        <Card bg={cardBg} borderColor={borderColor}>
          <CardBody>
            <Stat size="sm">
              <StatLabel>Unidades Totales</StatLabel>
              <StatNumber fontSize="xl">{project.total_units || '-'}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg={cardBg} borderColor={borderColor}>
          <CardBody>
            <Stat size="sm">
              <StatLabel>Precio/m²</StatLabel>
              <StatNumber fontSize="xl">{formatCurrency(project.target_price_per_m2)}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg={cardBg} borderColor={borderColor}>
          <CardBody>
            <Stat size="sm">
              <StatLabel>NPV</StatLabel>
              <StatNumber fontSize="xl" color={metrics?.npv && metrics.npv > 0 ? 'green.500' : 'red.500'}>
                {formatCurrency(metrics?.npv)}
              </StatNumber>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg={cardBg} borderColor={borderColor}>
          <CardBody>
            <Stat size="sm">
              <StatLabel>TIR</StatLabel>
              <StatNumber fontSize="xl" color={metrics?.irr && metrics.irr > 0.12 ? 'green.500' : 'orange.500'}>
                {formatPercentage(metrics?.irr)}
              </StatNumber>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg={cardBg} borderColor={borderColor}>
          <CardBody>
            <Stat size="sm">
              <StatLabel>Margen</StatLabel>
              <StatNumber fontSize="xl">
                {formatPercentage(metrics?.profit_margin_pct ? metrics.profit_margin_pct / 100 : undefined)}
              </StatNumber>
            </Stat>
          </CardBody>
        </Card>
        
        <Card bg={cardBg} borderColor={borderColor}>
          <CardBody>
            <Stat size="sm">
              <StatLabel>Payback</StatLabel>
              <StatNumber fontSize="xl">
                {metrics?.payback_months ? `${metrics.payback_months}m` : '-'}
              </StatNumber>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Main Content Tabs */}
      <Tabs colorScheme="purple" variant="enclosed">
        <TabList>
          <Tab>Estructura de Costos</Tab>
          <Tab>Flujo de Caja</Tab>
          <Tab>Métricas Financieras</Tab>
          <Tab>Líneas de Crédito</Tab>
          <Tab>Impacto en Cash Flow</Tab>
          <Tab>Simulación de Ventas</Tab>
          <Tab>Análisis</Tab>
          {project?.status === 'APPROVED' && (
            <Tab>
              <HStack spacing={2}>
                <Text>Seguimiento</Text>
                <Badge colorScheme="green" size="sm">BASELINE</Badge>
              </HStack>
            </Tab>
          )}
        </TabList>

        <TabPanels>
          {/* Cost Structure Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <Flex justify="space-between" align="center">
                <Heading size="md">Estructura de Costos del Proyecto</Heading>
                <Button leftIcon={<FaPlus />} colorScheme="purple" onClick={onAddCostOpen}>
                  Agregar Item de Costo
                </Button>
              </Flex>

              {/* Cost Summary */}
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <Card>
                  <CardHeader>
                    <Heading size="sm">Distribución por Categoría</Heading>
                  </CardHeader>
                  <CardBody>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={categoryData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45}
                          textAnchor="end"
                          height={100}
                          fontSize={12}
                        />
                        <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        <Bar dataKey="value" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader>
                    <Heading size="sm">Resumen de Costos</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={3} align="stretch">
                      {Object.entries(costByCategory).map(([category, amount]) => (
                        <Flex key={category} justify="space-between" align="center">
                          <HStack>
                            <Badge colorScheme={getCategoriaColor(category)} size="sm">
                              {category}
                            </Badge>
                          </HStack>
                          <Text fontWeight="semibold">{formatCurrency(amount)}</Text>
                        </Flex>
                      ))}
                      <Divider />
                      <Flex justify="space-between" align="center" fontWeight="bold" fontSize="lg">
                        <Text>Total Estimado</Text>
                        <Text color="purple.600">
                          {formatCurrency(Object.values(costByCategory).reduce((a, b) => a + b, 0))}
                        </Text>
                      </Flex>
                    </VStack>
                  </CardBody>
                </Card>
              </SimpleGrid>

              {/* Cost Items Table */}
              <Card>
                <CardHeader>
                  <Heading size="sm">Items de Costo Detallados</Heading>
                </CardHeader>
                <CardBody>
                  <TableContainer>
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Categoría</Th>
                          <Th>Subcategoría</Th>
                          <Th>Partida de Costo</Th>
                          <Th>Base de Costo</Th>
                          <Th>Monto Proyectado</Th>
                          <Th>Timing</Th>
                          <Th>Acciones</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {costItems.map((item) => (
                          <Tr key={item.id}>
                            <Td>
                              <Badge colorScheme={getCategoriaColor(item.categoria)} size="sm">
                                {item.categoria}
                              </Badge>
                            </Td>
                            <Td>{item.subcategoria}</Td>
                            <Td>{item.partida_costo}</Td>
                            <Td>{item.base_costo}</Td>
                            <Td fontWeight="semibold">
                              {item.base_costo === 'mensual' && item.unit_cost ? (
                                <VStack align="start" spacing={1}>
                                  <Text fontSize="sm" color="orange.600">
                                    ${Number(item.unit_cost).toFixed(2)}/mes
                                  </Text>
                                  <Text fontSize="xs" color="gray.500">
                                    ≈ {formatCurrency(
                                      item.duration_months && item.unit_cost
                                        ? Number(item.unit_cost) * Number(item.duration_months)
                                        : Number(item.monto_proyectado || 0)
                                    )}
                                    {item.duration_months && (
                                      <Text as="span" ml={1}>
                                        ({item.duration_months} meses)
                                      </Text>
                                    )}
                                  </Text>
                                </VStack>
                              ) : item.base_costo === 'por m²' && item.unit_cost ? (
                                <VStack align="start" spacing={1}>
                                  <Text fontSize="sm" color="blue.600">
                                    ${Number(item.unit_cost).toFixed(2)}/m²
                                  </Text>
                                  <Text fontSize="xs" color="gray.500">
                                    ≈ {formatCurrency(
                                      project?.total_units && project?.avg_unit_size_m2 && item.unit_cost
                                        ? Number(item.unit_cost) * Number(project.total_units) * Number(project.avg_unit_size_m2)
                                        : Number(item.monto_proyectado || 0)
                                    )}
                                  </Text>
                                </VStack>
                              ) : item.base_costo === 'por unidad' && item.unit_cost ? (
                                <VStack align="start" spacing={1}>
                                  <Text fontSize="sm" color="green.600">
                                    ${Number(item.unit_cost).toFixed(2)}/unidad
                                  </Text>
                                  <Text fontSize="xs" color="gray.500">
                                    ≈ {formatCurrency(
                                      project?.total_units && item.unit_cost
                                        ? Number(item.unit_cost) * Number(project.total_units)
                                        : Number(item.monto_proyectado || 0)
                                    )}
                                  </Text>
                                </VStack>
                              ) : (
                                formatCurrency(Number(item.monto_proyectado || 0))
                              )}
                            </Td>
                            <Td>
                              {item.start_month && item.duration_months && (
                                <Text fontSize="sm">
                                  Mes {item.start_month} ({item.duration_months}m)
                                </Text>
                              )}
                            </Td>
                            <Td>
                              <HStack spacing={1}>
                                <IconButton
                                  icon={<FaEdit />}
                                  aria-label="Editar"
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="purple"
                                  onClick={() => openEditCostItem(item)}
                                />
                                <IconButton
                                  icon={<FaTrash />}
                                  aria-label="Eliminar"
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="red"
                                  onClick={() => deleteCostItem(item.id, item.partida_costo)}
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
            </VStack>
          </TabPanel>

          {/* Cash Flow Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <Heading size="md">Flujo de Caja Proyectado</Heading>
              
              {cashFlow.length > 0 ? (
                <>
                  <Card>
                    <CardHeader>
                      <Heading size="sm">Flujo de Caja Mensual</Heading>
                    </CardHeader>
                    <CardBody>
                      <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={chartData.slice(0, 36)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="period"
                            angle={-45}
                            textAnchor="end"
                            height={80}
                            fontSize={10}
                          />
                          <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                          <Tooltip formatter={(value) => formatCurrency(value as number)} />
                          <Legend />
                          <Line type="monotone" dataKey="ingresos" stroke="#10b981" name="Ingresos" strokeWidth={2} />
                          <Line type="monotone" dataKey="egresos" stroke="#ef4444" name="Egresos" strokeWidth={2} />
                          <Line type="monotone" dataKey="flujo_neto" stroke="#8b5cf6" name="Flujo Neto" strokeWidth={2} />
                          <Line type="monotone" dataKey="flujo_acumulado" stroke="#f59e0b" name="Flujo Acumulado" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardHeader>
                      <Heading size="sm">Detalle del Flujo de Caja (Primeros 12 meses)</Heading>
                    </CardHeader>
                    <CardBody>
                      <TableContainer>
                        <Table variant="simple" size="sm">
                          <Thead>
                            <Tr>
                              <Th>Período</Th>
                              <Th>Ingresos</Th>
                              <Th>Egresos</Th>
                              <Th>Flujo Neto</Th>
                              <Th>Flujo Acumulado</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {cashFlow.slice(0, 12).map((cf) => (
                              <Tr key={cf.period_label}>
                                <Td>{cf.period_label}</Td>
                                <Td color="green.600">{formatCurrency(cf.total_ingresos)}</Td>
                                <Td color="red.600">{formatCurrency(cf.total_egresos)}</Td>
                                <Td color={cf.flujo_neto >= 0 ? 'green.600' : 'red.600'}>
                                  {formatCurrency(cf.flujo_neto)}
                                </Td>
                                <Td color={cf.flujo_acumulado >= 0 ? 'green.600' : 'red.600'}>
                                  {formatCurrency(cf.flujo_acumulado)}
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </TableContainer>
                    </CardBody>
                  </Card>
                </>
              ) : (
                <Alert status="warning">
                  <AlertIcon />
                  No hay datos de flujo de caja disponibles. Ejecute el cálculo financiero primero.
                </Alert>
              )}
            </VStack>
          </TabPanel>

          {/* Financial Metrics Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <Heading size="md">Métricas Financieras</Heading>
              
              {metrics ? (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  <Card>
                    <CardHeader>
                      <Heading size="sm">Rentabilidad</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <Stat>
                          <StatLabel>Inversión Total</StatLabel>
                          <StatNumber>{formatCurrency(metrics.total_investment)}</StatNumber>
                        </Stat>
                        <Stat>
                          <StatLabel>Ingresos Totales</StatLabel>
                          <StatNumber>{formatCurrency(metrics.total_revenue)}</StatNumber>
                        </Stat>
                        <Stat>
                          <StatLabel>Utilidad Total</StatLabel>
                          <StatNumber color={metrics.total_profit && metrics.total_profit > 0 ? 'green.500' : 'red.500'}>
                            {formatCurrency(metrics.total_profit)}
                          </StatNumber>
                        </Stat>
                        <Stat>
                          <StatLabel>Margen de Utilidad</StatLabel>
                          <StatNumber>
                            {formatPercentage(metrics.profit_margin_pct ? metrics.profit_margin_pct / 100 : undefined)}
                          </StatNumber>
                        </Stat>
                      </VStack>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardHeader>
                      <Heading size="sm">Análisis DCF</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <Stat>
                          <StatLabel>Valor Presente Neto (NPV)</StatLabel>
                          <StatNumber color={metrics.npv && metrics.npv > 0 ? 'green.500' : 'red.500'}>
                            {formatCurrency(metrics.npv)}
                          </StatNumber>
                          <StatHelpText>
                            {metrics.npv && metrics.npv > 0 ? 'Proyecto viable' : 'Revisar viabilidad'}
                          </StatHelpText>
                        </Stat>
                        <Stat>
                          <StatLabel>Tasa Interna de Retorno (TIR)</StatLabel>
                          <StatNumber color={metrics.irr && metrics.irr > 0.12 ? 'green.500' : 'orange.500'}>
                            {formatPercentage(metrics.irr)}
                          </StatNumber>
                          <StatHelpText>
                            {metrics.irr && metrics.irr > 0.12 ? 'Supera tasa de descuento' : 'Por debajo del objetivo'}
                          </StatHelpText>
                        </Stat>
                        <Stat>
                          <StatLabel>Período de Recuperación</StatLabel>
                          <StatNumber>
                            {metrics.payback_months ? `${metrics.payback_months} meses` : '-'}
                          </StatNumber>
                        </Stat>
                        <Stat>
                          <StatLabel>Índice de Rentabilidad</StatLabel>
                          <StatNumber>
                            {metrics.profitability_index && typeof metrics.profitability_index === 'number' ? metrics.profitability_index.toFixed(2) : '-'}
                          </StatNumber>
                        </Stat>
                      </VStack>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardHeader>
                      <Heading size="sm">Métricas por Unidad</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <Stat>
                          <StatLabel>Costo por Unidad</StatLabel>
                          <StatNumber>{formatCurrency(metrics.cost_per_unit)}</StatNumber>
                        </Stat>
                        <Stat>
                          <StatLabel>Ingreso por Unidad</StatLabel>
                          <StatNumber>{formatCurrency(metrics.revenue_per_unit)}</StatNumber>
                        </Stat>
                        <Stat>
                          <StatLabel>Utilidad por Unidad</StatLabel>
                          <StatNumber color={metrics.profit_per_unit && metrics.profit_per_unit > 0 ? 'green.500' : 'red.500'}>
                            {formatCurrency(metrics.profit_per_unit)}
                          </StatNumber>
                        </Stat>
                        <Divider />
                        <Stat>
                          <StatLabel>Costo por m²</StatLabel>
                          <StatNumber>{formatCurrency(metrics.cost_per_m2)}</StatNumber>
                        </Stat>
                        <Stat>
                          <StatLabel>Ingreso por m²</StatLabel>
                          <StatNumber>{formatCurrency(metrics.revenue_per_m2)}</StatNumber>
                        </Stat>
                        <Stat>
                          <StatLabel>Utilidad por m²</StatLabel>
                          <StatNumber color={metrics.profit_per_m2 && metrics.profit_per_m2 > 0 ? 'green.500' : 'red.500'}>
                            {formatCurrency(metrics.profit_per_m2)}
                          </StatNumber>
                        </Stat>
                      </VStack>
                    </CardBody>
                  </Card>
                </SimpleGrid>
              ) : (
                <Alert status="warning">
                  <AlertIcon />
                  No hay métricas financieras disponibles. Ejecute el cálculo financiero primero.
                </Alert>
              )}
            </VStack>
          </TabPanel>

          {/* Credit Lines Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <HStack justify="space-between" align="center">
                <VStack align="start" spacing={1}>
                  <Heading size="md">Líneas de Crédito del Proyecto</Heading>
                  <Badge colorScheme="purple" variant="outline">
                    Líneas Hipotéticas para Modelado Financiero
                  </Badge>
                </VStack>
                <Button
                                  leftIcon={<FaPlus />}
                colorScheme="purple"
                onClick={onAddCreditOpen}
                >
                  Nueva Línea Hipotética
                </Button>
              </HStack>
              
              <Alert status="info" size="sm">
                <AlertIcon />
                <Box>
                  <Text fontWeight="bold" fontSize="sm">Líneas de Crédito Hipotéticas</Text>
                  <Text fontSize="sm">
                    Configure líneas de crédito hipotéticas para modelar diferentes escenarios de financiamiento.
                    Estas líneas son para análisis y no representan compromisos reales con entidades financieras.
                  </Text>
                </Box>
              </Alert>

              {/* Credit Requirements Analysis */}
              {creditRequirements && (
                <Card>
                  <CardHeader>
                    <Heading size="sm">Análisis de Requerimientos de Financiamiento</Heading>
                  </CardHeader>
                  <CardBody>
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                      <VStack spacing={3} align="stretch">
                        <Text fontWeight="bold" color="purple.600">Desglose de Financiamiento</Text>
                        <Stat size="sm">
                          <StatLabel>Terreno</StatLabel>
                          <StatNumber>{formatCurrency(creditRequirements.financing_breakdown.terreno)}</StatNumber>
                        </Stat>
                        <Stat size="sm">
                          <StatLabel>Construcción</StatLabel>
                          <StatNumber>{formatCurrency(creditRequirements.financing_breakdown.construccion)}</StatNumber>
                        </Stat>
                        <Stat size="sm">
                          <StatLabel>Capital de Trabajo</StatLabel>
                          <StatNumber>{formatCurrency(creditRequirements.financing_breakdown.capital_trabajo)}</StatNumber>
                        </Stat>
                        <Stat size="sm">
                          <StatLabel>Contingencia</StatLabel>
                          <StatNumber>{formatCurrency(creditRequirements.financing_breakdown.contingencia)}</StatNumber>
                        </Stat>
                      </VStack>
                      
                      <VStack spacing={3} align="stretch">
                        <Text fontWeight="bold" color="purple.600">Resumen Financiero</Text>
                        <Stat size="sm">
                          <StatLabel>Costo Total del Proyecto</StatLabel>
                          <StatNumber>{formatCurrency(creditRequirements.total_project_cost)}</StatNumber>
                        </Stat>
                        <Stat size="sm">
                          <StatLabel>Financiamiento Necesario</StatLabel>
                          <StatNumber color="orange.500">{formatCurrency(creditRequirements.total_financing_needed)}</StatNumber>
                        </Stat>
                        <Stat size="sm">
                          <StatLabel>Ratio de Financiamiento</StatLabel>
                          <StatNumber>{creditRequirements.financing_ratio.toFixed(1)}%</StatNumber>
                        </Stat>
                      </VStack>
                      
                      <VStack spacing={3} align="stretch">
                        <Text fontWeight="bold" color="purple.600">Líneas Recomendadas</Text>
                        {creditRequirements.recommended_credit_lines.map((rec, index) => (
                          <Alert key={index} status="info" size="sm">
                            <AlertIcon />
                            <Box>
                              <Text fontSize="xs" fontWeight="bold">{rec.proposito}</Text>
                              <Text fontSize="xs">{formatCurrency(rec.monto_recomendado)} - {rec.tipo_linea}</Text>
                            </Box>
                          </Alert>
                        ))}
                      </VStack>
                    </SimpleGrid>
                  </CardBody>
                </Card>
              )}

              {/* Current Credit Lines */}
              <Card>
                <CardHeader>
                  <HStack justify="space-between" align="center">
                    <Heading size="sm">Líneas de Crédito Hipotéticas Configuradas</Heading>
                    <Badge colorScheme="purple" variant="outline">
                      Modelado Financiero
                    </Badge>
                  </HStack>
                </CardHeader>
                <CardBody>
                  {loadingCreditLines ? (
                    <Center p={8}>
                      <VStack spacing={4}>
                        <Spinner size="lg" color="purple.500" />
                        <Text>Cargando líneas de crédito...</Text>
                      </VStack>
                    </Center>
                  ) : creditLines.length === 0 ? (
                    <VStack spacing={4} py={8}>
                      <Text color="gray.500" textAlign="center">
                        No hay líneas de crédito hipotéticas configuradas para este proyecto.
                      </Text>
                      <Text fontSize="sm" color="gray.400" textAlign="center">
                        Agregue líneas hipotéticas para modelar diferentes escenarios de financiamiento y analizar su impacto en el flujo de caja.
                      </Text>
                      <Button
                        leftIcon={<FaPlus />}
                        colorScheme="purple"
                        variant="outline"
                        size="sm"
                        onClick={onAddCreditOpen}
                      >
                        Crear Primera Línea Hipotética
                      </Button>
                    </VStack>
                  ) : (
                    <TableContainer>
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th>Nombre</Th>
                            <Th>Tipo</Th>
                            <Th>Monto Total</Th>
                            <Th>Disponible</Th>
                            <Th>Utilizado</Th>
                            <Th>Tasa</Th>
                            <Th>Estado</Th>
                            <Th>Acciones</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {creditLines.map((line) => (
                            <Tr key={line.id}>
                              <Td>
                                <VStack align="start" spacing={1}>
                                  <Text fontWeight="bold" fontSize="sm">{line.nombre}</Text>
                                  <Text fontSize="xs" color="gray.500">
                                    {new Date(line.fecha_inicio).toLocaleDateString()} - {new Date(line.fecha_fin).toLocaleDateString()}
                                  </Text>
                                </VStack>
                              </Td>
                              <Td>
                                <Badge colorScheme="blue" size="sm">
                                  {line.tipo_linea.replace('_', ' ')}
                                </Badge>
                              </Td>
                              <Td>{formatCurrency(line.monto_total_linea)}</Td>
                              <Td>
                                <Text color={line.monto_disponible > 0 ? "green.500" : "red.500"}>
                                  {formatCurrency(line.monto_disponible)}
                                </Text>
                              </Td>
                              <Td>
                                <Text color="orange.500">
                                  {formatCurrency(line.monto_total_linea - line.monto_disponible)}
                                </Text>
                              </Td>
                              <Td>{line.interest_rate ? formatPercentage(line.interest_rate) : '-'}</Td>
                              <Td>
                                <VStack align="start" spacing={1}>
                                  <Badge 
                                    colorScheme={line.estado === 'ACTIVA' ? 'green' : 'gray'}
                                    size="sm"
                                  >
                                    {line.estado}
                                  </Badge>
                                  {line.es_simulacion && (
                                    <Badge colorScheme="purple" size="sm" variant="solid">
                                      HIPOTÉTICA
                                    </Badge>
                                  )}
                                </VStack>
                              </Td>
                              <Td>
                                <HStack spacing={1}>
                                  <IconButton
                                    icon={<FaCalendarPlus />}
                                    aria-label="Planificar uso"
                                    size="xs"
                                    colorScheme="green"
                                    variant="ghost"
                                    onClick={() => openAddUsageModal(line)}
                                    title="Planificar Uso Proyectado"
                                  />
                                  <IconButton
                                    icon={<FaList />}
                                    aria-label="Ver usos"
                                    size="xs"
                                    colorScheme="blue"
                                    variant="ghost"
                                    onClick={() => openUsageModal(line)}
                                    title="Ver Usos Planificados"
                                  />
                                  <IconButton
                                    icon={<FaTrash />}
                                    aria-label="Eliminar línea"
                                    size="xs"
                                    colorScheme="red"
                                    variant="ghost"
                                    onClick={() => deleteCreditLine(line.id, line.nombre)}
                                  />
                                </HStack>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </TableContainer>
                  )}
                </CardBody>
              </Card>

              {/* Credit Lines Summary */}
              {creditLines.length > 0 && (
                <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
                  <Card>
                    <CardBody>
                      <Stat size="sm">
                        <StatLabel>Total Líneas</StatLabel>
                        <StatNumber>{creditLines.length}</StatNumber>
                      </Stat>
                    </CardBody>
                  </Card>
                  <Card>
                    <CardBody>
                      <Stat size="sm">
                        <StatLabel>Crédito Total</StatLabel>
                        <StatNumber>{formatCurrency(creditLines.reduce((sum, line) => sum + line.monto_total_linea, 0))}</StatNumber>
                      </Stat>
                    </CardBody>
                  </Card>
                  <Card>
                    <CardBody>
                      <Stat size="sm">
                        <StatLabel>Disponible</StatLabel>
                        <StatNumber color="green.500">
                          {formatCurrency(creditLines.reduce((sum, line) => sum + line.monto_disponible, 0))}
                        </StatNumber>
                      </Stat>
                    </CardBody>
                  </Card>
                  <Card>
                    <CardBody>
                      <Stat size="sm">
                        <StatLabel>Utilizado</StatLabel>
                        <StatNumber color="orange.500">
                          {formatCurrency(creditLines.reduce((sum, line) => sum + (line.monto_total_linea - line.monto_disponible), 0))}
                        </StatNumber>
                      </Stat>
                    </CardBody>
                  </Card>
                </SimpleGrid>
              )}

              {/* Hypothetical Credit Lines Explanation */}
              <Alert status="warning" variant="left-accent">
                <AlertIcon />
                <Box>
                  <Text fontWeight="bold" fontSize="sm">Líneas de Crédito Hipotéticas</Text>
                  <Text fontSize="sm">
                    Las líneas configuradas aquí son hipotéticas y se utilizan únicamente para modelado financiero.
                    Permiten simular diferentes escenarios de financiamiento y analizar su impacto en el flujo de caja del proyecto.
                    No representan compromisos reales con entidades financieras.
                  </Text>
                </Box>
              </Alert>

              {/* Link to Main Credit Lines System */}
              <Alert status="info">
                <AlertIcon />
                <Box>
                  <Text fontWeight="bold">Sistema Principal de Líneas de Crédito</Text>
                  <Text fontSize="sm">
                    Para gestionar las líneas de crédito reales y operativas de la empresa, visite el sistema principal.
                  </Text>
                  <Button 
                    as={RouterLink} 
                    to="/dashboard/lineas_credito" 
                    colorScheme="purple" 
                    variant="outline"
                    size="sm"
                    mt={2}
                  >
                    Ir a Líneas de Crédito Reales
                  </Button>
                </Box>
              </Alert>
            </VStack>
          </TabPanel>

          {/* Cash Flow Impact Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <Heading size="md">Impacto en Cash Flow Empresarial</Heading>
              
              <Text color="gray.600">
                Analice cómo este proyecto hipotético afectará el flujo de caja consolidado de la empresa.
                Esta proyección le ayudará a tomar decisiones informadas sobre la viabilidad del proyecto.
              </Text>

              <Alert status="warning">
                <AlertIcon />
                <Box>
                  <Text fontWeight="bold">Análisis de Impacto</Text>
                  <Text fontSize="sm">
                    Esta funcionalidad mostrará la proyección del impacto del proyecto en el cash flow 
                    empresarial actual, incluyendo requerimientos de liquidez y riesgos financieros.
                  </Text>
                </Box>
              </Alert>

                             {/* Cash Flow Impact Analysis */}
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <Card>
                  <CardHeader>
                    <Heading size="sm">Proyección de Impacto</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <Stat>
                        <StatLabel>Inversión Inicial Requerida</StatLabel>
                        <StatNumber color="red.500">
                          {cashFlowImpact ? formatCurrency(cashFlowImpact.analysis.total_investment_required) : formatCurrency(Object.values(costByCategory).reduce((a, b) => a + b, 0) * 0.3)}
                        </StatNumber>
                        <StatHelpText>Total de flujos negativos</StatHelpText>
                      </Stat>
                      
                      <Stat>
                        <StatLabel>Exposición Máxima</StatLabel>
                        <StatNumber color="red.500">
                          {cashFlowImpact ? formatCurrency(cashFlowImpact.analysis.max_negative_exposure) : formatCurrency(Object.values(costByCategory).reduce((a, b) => a + b, 0) * 0.7)}
                        </StatNumber>
                        <StatHelpText>Punto de mayor riesgo</StatHelpText>
                      </Stat>
                      
                      <Stat>
                        <StatLabel>Break Even</StatLabel>
                        <StatNumber>
                          {cashFlowImpact?.analysis.break_even_month ? `Mes ${cashFlowImpact.analysis.break_even_month}` : 'Mes 8-12'}
                        </StatNumber>
                        <StatHelpText>Punto de equilibrio</StatHelpText>
                      </Stat>
                      
                      <Stat>
                        <StatLabel>Nivel de Riesgo</StatLabel>
                        <StatNumber color={
                          cashFlowImpact?.analysis.risk_level === 'HIGH' ? 'red.500' : 
                          cashFlowImpact?.analysis.risk_level === 'MEDIUM' ? 'orange.500' : 'green.500'
                        }>
                          {cashFlowImpact?.analysis.risk_level || 'MEDIUM'}
                        </StatNumber>
                        <StatHelpText>Evaluación del proyecto</StatHelpText>
                      </Stat>
                    </VStack>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader>
                    <Heading size="sm">Recomendaciones Financieras</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={3} align="stretch">
                      <Alert status="info" size="sm">
                        <AlertIcon />
                        <Text fontSize="sm">
                          <strong>Línea de Crédito Recomendada:</strong> {cashFlowImpact ? formatCurrency(cashFlowImpact.analysis.recommended_credit_line) : formatCurrency(Object.values(costByCategory).reduce((a, b) => a + b, 0) * 0.4)}
                        </Text>
                      </Alert>
                      
                      <Alert status="warning" size="sm">
                        <AlertIcon />
                        <Text fontSize="sm">
                          <strong>Reserva de Liquidez:</strong> {cashFlowImpact ? formatCurrency(cashFlowImpact.analysis.liquidity_reserve_needed) : formatCurrency(Object.values(costByCategory).reduce((a, b) => a + b, 0) * 0.15)} en efectivo
                        </Text>
                      </Alert>
                      
                      <Alert status="success" size="sm">
                        <AlertIcon />
                        <Text fontSize="sm">
                          <strong>ROI Proyectado:</strong> {metrics?.irr ? formatPercentage(metrics.irr) : '15.2%'} anual
                        </Text>
                      </Alert>
                      
                      {cashFlowImpact?.recommendations && (
                        <Box>
                          <Text fontWeight="bold" fontSize="sm" mb={2}>Recomendaciones Adicionales:</Text>
                          <UnorderedList fontSize="xs" spacing={1}>
                            {cashFlowImpact.recommendations.slice(0, 3).map((rec: string, index: number) => (
                              <ListItem key={index}>{rec}</ListItem>
                            ))}
                          </UnorderedList>
                        </Box>
                      )}
                    </VStack>
                  </CardBody>
                </Card>
              </SimpleGrid>

              {/* Impact Chart */}
              <Card>
                <CardHeader>
                  <Heading size="sm">Proyección de Impacto en Cash Flow (24 meses)</Heading>
                </CardHeader>
                <CardBody>
                  {cashFlowImpact?.monthly_impact ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={cashFlowImpact.monthly_impact}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        <Legend />
                        <Line type="monotone" dataKey="project_flow" stroke="#8b5cf6" name="Flujo del Proyecto" strokeWidth={2} />
                        <Line type="monotone" dataKey="accumulated_flow" stroke="#f59e0b" name="Flujo Acumulado" strokeWidth={2} />
                        <Line type="monotone" dataKey="impact_on_company" stroke="#10b981" name="Impacto en Empresa" strokeWidth={2} strokeDasharray="5 5" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <Center p={8}>
                      <VStack spacing={4}>
                        <Spinner size="lg" color="purple.500" />
                        <Text>Calculando impacto en cash flow...</Text>
                        <Text fontSize="sm" color="gray.500">
                          Ejecute el cálculo financiero primero para ver el análisis completo
                        </Text>
                      </VStack>
                    </Center>
                  )}
                </CardBody>
              </Card>

              {/* Action Buttons */}
              <HStack spacing={4} justify="center">
                <Button 
                  as={RouterLink} 
                  to="/cash-flows/consolidado" 
                  colorScheme="blue" 
                  leftIcon={<FaChartLine />}
                >
                  Ver Cash Flow Consolidado
                </Button>
                <Button 
                  colorScheme="purple" 
                  variant="outline"
                  leftIcon={<FaCalculator />}
                  onClick={() => toast({
                    title: "Funcionalidad en Desarrollo",
                    description: "La simulación completa de impacto estará disponible próximamente",
                    status: "info",
                    duration: 3000,
                    isClosable: true,
                  })}
                >
                  Simular Impacto Completo
                </Button>
              </HStack>
            </VStack>
          </TabPanel>

          {/* Sales Simulation Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <Heading size="md">Simulación de Cronograma de Ventas</Heading>
              
              <Text color="gray.600">
                Configure diferentes escenarios de ventas para evaluar el impacto en el flujo de caja 
                del proyecto y los requerimientos de financiamiento.
              </Text>

              {/* Sales Scenarios Configuration */}
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <Card>
                  <CardHeader>
                    <Heading size="sm">Configurar Escenarios de Venta</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <Alert status="info" size="sm">
                        <AlertIcon />
                        <Text fontSize="sm">
                          Configure el % de unidades vendidas por período de 6 meses
                        </Text>
                      </Alert>
                      
                      {/* Optimistic Scenario */}
                      <Box p={4} borderWidth={1} borderRadius="md" borderColor="green.200" bg="green.50">
                        <Text fontWeight="bold" color="green.700" mb={3}>Escenario Optimista</Text>
                        <SimpleGrid columns={2} spacing={3}>
                          <FormControl>
                            <FormLabel fontSize="sm">0-6 meses (%)</FormLabel>
                            <NumberInput size="sm" min={0} max={100} defaultValue={40}>
                              <NumberInputField />
                            </NumberInput>
                          </FormControl>
                          <FormControl>
                            <FormLabel fontSize="sm">6-12 meses (%)</FormLabel>
                            <NumberInput size="sm" min={0} max={100} defaultValue={35}>
                              <NumberInputField />
                            </NumberInput>
                          </FormControl>
                          <FormControl>
                            <FormLabel fontSize="sm">12-18 meses (%)</FormLabel>
                            <NumberInput size="sm" min={0} max={100} defaultValue={20}>
                              <NumberInputField />
                            </NumberInput>
                          </FormControl>
                          <FormControl>
                            <FormLabel fontSize="sm">18-24 meses (%)</FormLabel>
                            <NumberInput size="sm" min={0} max={100} defaultValue={5}>
                              <NumberInputField />
                            </NumberInput>
                          </FormControl>
                        </SimpleGrid>
                      </Box>

                      {/* Realistic Scenario */}
                      <Box p={4} borderWidth={1} borderRadius="md" borderColor="blue.200" bg="blue.50">
                        <Text fontWeight="bold" color="blue.700" mb={3}>Escenario Realista</Text>
                        <SimpleGrid columns={2} spacing={3}>
                          <FormControl>
                            <FormLabel fontSize="sm">0-6 meses (%)</FormLabel>
                            <NumberInput size="sm" min={0} max={100} defaultValue={25}>
                              <NumberInputField />
                            </NumberInput>
                          </FormControl>
                          <FormControl>
                            <FormLabel fontSize="sm">6-12 meses (%)</FormLabel>
                            <NumberInput size="sm" min={0} max={100} defaultValue={30}>
                              <NumberInputField />
                            </NumberInput>
                          </FormControl>
                          <FormControl>
                            <FormLabel fontSize="sm">12-18 meses (%)</FormLabel>
                            <NumberInput size="sm" min={0} max={100} defaultValue={25}>
                              <NumberInputField />
                            </NumberInput>
                          </FormControl>
                          <FormControl>
                            <FormLabel fontSize="sm">18-24 meses (%)</FormLabel>
                            <NumberInput size="sm" min={0} max={100} defaultValue={20}>
                              <NumberInputField />
                            </NumberInput>
                          </FormControl>
                        </SimpleGrid>
                      </Box>

                      {/* Pessimistic Scenario */}
                      <Box p={4} borderWidth={1} borderRadius="md" borderColor="orange.200" bg="orange.50">
                        <Text fontWeight="bold" color="orange.700" mb={3}>Escenario Conservador</Text>
                        <SimpleGrid columns={2} spacing={3}>
                          <FormControl>
                            <FormLabel fontSize="sm">0-6 meses (%)</FormLabel>
                            <NumberInput size="sm" min={0} max={100} defaultValue={15}>
                              <NumberInputField />
                            </NumberInput>
                          </FormControl>
                          <FormControl>
                            <FormLabel fontSize="sm">6-12 meses (%)</FormLabel>
                            <NumberInput size="sm" min={0} max={100} defaultValue={20}>
                              <NumberInputField />
                            </NumberInput>
                          </FormControl>
                          <FormControl>
                            <FormLabel fontSize="sm">12-18 meses (%)</FormLabel>
                            <NumberInput size="sm" min={0} max={100} defaultValue={25}>
                              <NumberInputField />
                            </NumberInput>
                          </FormControl>
                          <FormControl>
                            <FormLabel fontSize="sm">18-24 meses (%)</FormLabel>
                            <NumberInput size="sm" min={0} max={100} defaultValue={25}>
                              <NumberInputField />
                            </NumberInput>
                          </FormControl>
                          <FormControl>
                            <FormLabel fontSize="sm">24+ meses (%)</FormLabel>
                            <NumberInput size="sm" min={0} max={100} defaultValue={15}>
                              <NumberInputField />
                            </NumberInput>
                          </FormControl>
                        </SimpleGrid>
                      </Box>

                      <Button 
                        colorScheme="purple" 
                        leftIcon={<FaCalculator />}
                        onClick={simulateSalesScenarios}
                        isLoading={simulating}
                        loadingText="Simulando..."
                      >
                        Simular Escenarios
                      </Button>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Simulation Results */}
                <Card>
                  <CardHeader>
                    <Heading size="sm">Comparación de Escenarios</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <TableContainer>
                        <Table variant="simple" size="sm">
                          <Thead>
                            <Tr>
                              <Th>Métrica</Th>
                              <Th color="green.600">Optimista</Th>
                              <Th color="blue.600">Realista</Th>
                              <Th color="orange.600">Conservador</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            <Tr>
                              <Td fontWeight="medium">NPV</Td>
                              <Td color="green.600">
                                {simulationResults?.scenarios.find(s => s.scenario_name === 'optimista')?.npv 
                                  ? formatCurrency(simulationResults.scenarios.find(s => s.scenario_name === 'optimista')!.npv) 
                                  : '$2.8M'}
                              </Td>
                              <Td color="blue.600">
                                {simulationResults?.scenarios.find(s => s.scenario_name === 'realista')?.npv 
                                  ? formatCurrency(simulationResults.scenarios.find(s => s.scenario_name === 'realista')!.npv) 
                                  : '$2.1M'}
                              </Td>
                              <Td color="orange.600">
                                {simulationResults?.scenarios.find(s => s.scenario_name === 'conservador')?.npv 
                                  ? formatCurrency(simulationResults.scenarios.find(s => s.scenario_name === 'conservador')!.npv) 
                                  : '$1.4M'}
                              </Td>
                            </Tr>
                            <Tr>
                              <Td fontWeight="medium">TIR</Td>
                              <Td color="green.600">
                                {simulationResults?.scenarios.find(s => s.scenario_name === 'optimista')?.irr 
                                  ? formatPercentage(simulationResults.scenarios.find(s => s.scenario_name === 'optimista')!.irr) 
                                  : '18.5%'}
                              </Td>
                              <Td color="blue.600">
                                {simulationResults?.scenarios.find(s => s.scenario_name === 'realista')?.irr 
                                  ? formatPercentage(simulationResults.scenarios.find(s => s.scenario_name === 'realista')!.irr) 
                                  : '15.2%'}
                              </Td>
                              <Td color="orange.600">
                                {simulationResults?.scenarios.find(s => s.scenario_name === 'conservador')?.irr 
                                  ? formatPercentage(simulationResults.scenarios.find(s => s.scenario_name === 'conservador')!.irr) 
                                  : '11.8%'}
                              </Td>
                            </Tr>
                            <Tr>
                              <Td fontWeight="medium">Payback</Td>
                              <Td color="green.600">
                                {simulationResults?.scenarios.find(s => s.scenario_name === 'optimista')?.payback_months 
                                  ? `${simulationResults.scenarios.find(s => s.scenario_name === 'optimista')!.payback_months} meses`
                                  : '20 meses'}
                              </Td>
                              <Td color="blue.600">
                                {simulationResults?.scenarios.find(s => s.scenario_name === 'realista')?.payback_months 
                                  ? `${simulationResults.scenarios.find(s => s.scenario_name === 'realista')!.payback_months} meses`
                                  : '24 meses'}
                              </Td>
                              <Td color="orange.600">
                                {simulationResults?.scenarios.find(s => s.scenario_name === 'conservador')?.payback_months 
                                  ? `${simulationResults.scenarios.find(s => s.scenario_name === 'conservador')!.payback_months} meses`
                                  : '32 meses'}
                              </Td>
                            </Tr>
                            <Tr>
                              <Td fontWeight="medium">Max Exposición</Td>
                              <Td color="green.600">
                                {simulationResults?.scenarios.find(s => s.scenario_name === 'optimista')?.max_exposure 
                                  ? formatCurrency(simulationResults.scenarios.find(s => s.scenario_name === 'optimista')!.max_exposure) 
                                  : '$8.2M'}
                              </Td>
                              <Td color="blue.600">
                                {simulationResults?.scenarios.find(s => s.scenario_name === 'realista')?.max_exposure 
                                  ? formatCurrency(simulationResults.scenarios.find(s => s.scenario_name === 'realista')!.max_exposure) 
                                  : '$9.1M'}
                              </Td>
                              <Td color="orange.600">
                                {simulationResults?.scenarios.find(s => s.scenario_name === 'conservador')?.max_exposure 
                                  ? formatCurrency(simulationResults.scenarios.find(s => s.scenario_name === 'conservador')!.max_exposure) 
                                  : '$10.8M'}
                              </Td>
                            </Tr>
                          </Tbody>
                        </Table>
                      </TableContainer>

                      <Alert status="warning" size="sm">
                        <AlertIcon />
                        <Box>
                          <Text fontWeight="bold" fontSize="sm">Nota Importante</Text>
                          <Text fontSize="sm">
                            Estos son datos simulados. Ejecute el cálculo financiero para obtener valores reales.
                          </Text>
                        </Box>
                      </Alert>
                    </VStack>
                  </CardBody>
                </Card>
              </SimpleGrid>

              {/* Cash Flow Impact Chart */}
              <Card>
                <CardHeader>
                  <Heading size="sm">Impacto en Flujo de Caja del Proyecto</Heading>
                </CardHeader>
                <CardBody>
                  <Text fontSize="sm" color="gray.600" mb={4}>
                    Comparación del flujo de caja acumulado bajo diferentes escenarios de venta
                  </Text>
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={[
                      { month: 'Mes 0', optimista: 0, realista: 0, conservador: 0 },
                      { month: 'Mes 6', optimista: -2000000, realista: -3500000, conservador: -4500000 },
                      { month: 'Mes 12', optimista: 1200000, realista: -800000, conservador: -2200000 },
                      { month: 'Mes 18', optimista: 4800000, realista: 2100000, conservador: -500000 },
                      { month: 'Mes 24', optimista: 7200000, realista: 4500000, conservador: 1800000 },
                      { month: 'Mes 30', optimista: 8500000, realista: 6200000, conservador: 3400000 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend />
                      <Line type="monotone" dataKey="optimista" stroke="#10b981" name="Optimista" strokeWidth={2} />
                      <Line type="monotone" dataKey="realista" stroke="#3b82f6" name="Realista" strokeWidth={2} />
                      <Line type="monotone" dataKey="conservador" stroke="#f59e0b" name="Conservador" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardBody>
              </Card>

              {/* Company Cash Flow Impact */}
              <Card>
                <CardHeader>
                  <Heading size="sm">Impacto en Flujo de Caja Empresarial</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Text fontSize="sm" color="gray.600">
                      Análisis del impacto en la liquidez general de la empresa considerando otros proyectos en cartera
                    </Text>
                    
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                      <Stat size="sm">
                        <StatLabel>Liquidez Mínima Requerida</StatLabel>
                        <StatNumber color="red.600">
                          {simulationResults?.company_impact?.min_liquidity_required 
                            ? formatCurrency(simulationResults.company_impact.min_liquidity_required)
                            : '$12.5M'}
                        </StatNumber>
                        <StatHelpText>
                          En el mes {simulationResults?.company_impact?.critical_month || 14} (Escenario Conservador)
                        </StatHelpText>
                      </Stat>
                      <Stat size="sm">
                        <StatLabel>Línea de Crédito Recomendada</StatLabel>
                        <StatNumber color="blue.600">
                          {simulationResults?.company_impact?.recommended_credit_line 
                            ? formatCurrency(simulationResults.company_impact.recommended_credit_line)
                            : '$15.0M'}
                        </StatNumber>
                        <StatHelpText>Con 20% de buffer</StatHelpText>
                      </Stat>
                      <Stat size="sm">
                        <StatLabel>Riesgo de Liquidez</StatLabel>
                        <StatNumber color={
                          simulationResults?.company_impact?.liquidity_risk_level === 'ALTO' ? 'red.600' :
                          simulationResults?.company_impact?.liquidity_risk_level === 'MEDIO' ? 'orange.600' : 'green.600'
                        }>
                          {simulationResults?.company_impact?.liquidity_risk_level || 'Medio'}
                        </StatNumber>
                        <StatHelpText>Requiere monitoreo</StatHelpText>
                      </Stat>
                    </SimpleGrid>

                    <Alert status="info">
                      <AlertIcon />
                      <Box>
                        <Text fontWeight="bold">Recomendaciones de Gestión de Riesgo</Text>
                        <UnorderedList mt={2} fontSize="sm">
                          {simulationResults?.company_impact?.recommendations?.length ? 
                            simulationResults.company_impact.recommendations.map((recommendation, index) => (
                              <ListItem key={index}>{recommendation}</ListItem>
                            )) : 
                            <>
                              <ListItem>Asegurar línea de crédito de $15M antes del inicio</ListItem>
                              <ListItem>Acelerar ventas en primeros 6 meses con incentivos</ListItem>
                              <ListItem>Implementar escenario de preventa del 30% mínimo</ListItem>
                              <ListItem>Monitorear flujo semanal durante primeros 18 meses</ListItem>
                            </>
                          }
                        </UnorderedList>
                      </Box>
                    </Alert>
                  </VStack>
                </CardBody>
              </Card>
            </VStack>
          </TabPanel>

          {/* Analysis Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <Heading size="md">Análisis de Sensibilidad</Heading>
              
              <Alert status="info">
                <AlertIcon />
                <Box>
                  <Text fontWeight="bold">Análisis de Variables Clave</Text>
                  <Text>
                    Evalúa cómo los cambios en variables importantes afectan la rentabilidad del proyecto.
                    Configura el rango de variación y ejecuta el análisis.
                  </Text>
                </Box>
              </Alert>

              {/* Configuration Panel */}
              <Card>
                <CardHeader>
                  <Heading size="sm">Configuración del Análisis</Heading>
                </CardHeader>
                <CardBody>
                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                    <FormControl>
                      <FormLabel>Variación Mínima (%)</FormLabel>
                      <NumberInput 
                        value={analysisConfig.min_variation_pct}
                        onChange={(_, val) => setAnalysisConfig(prev => ({...prev, min_variation_pct: val || -30}))}
                        min={-50}
                        max={0}
                      >
                        <NumberInputField />
                      </NumberInput>
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Variación Máxima (%)</FormLabel>
                      <NumberInput 
                        value={analysisConfig.max_variation_pct}
                        onChange={(_, val) => setAnalysisConfig(prev => ({...prev, max_variation_pct: val || 30}))}
                        min={0}
                        max={100}
                      >
                        <NumberInputField />
                      </NumberInput>
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Número de Pasos</FormLabel>
                      <NumberInput 
                        value={analysisConfig.steps}
                        onChange={(_, val) => setAnalysisConfig(prev => ({...prev, steps: val || 13}))}
                        min={5}
                        max={25}
                      >
                        <NumberInputField />
                      </NumberInput>
                    </FormControl>
                  </SimpleGrid>
                </CardBody>
              </Card>

              {/* Analysis Buttons */}
              <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
                <Button
                  leftIcon={<FaChartLine />}
                  colorScheme="blue"
                  variant="outline"
                  h="100px"
                  isLoading={isAnalyzing && selectedAnalysisType === 'PRICE_PER_M2'}
                  loadingText="Analizando..."
                  onClick={() => runSensitivityAnalysis('PRICE_PER_M2')}
                >
                  <VStack spacing={2}>
                    <Text>Análisis de Precio</Text>
                    <Text fontSize="sm" color="gray.500">
                      Precio por m²
                    </Text>
                  </VStack>
                </Button>
                
                <Button
                  leftIcon={<FaBuilding />}
                  colorScheme="purple"
                  variant="outline"
                  h="100px"
                  isLoading={isAnalyzing && selectedAnalysisType === 'UNIT_SIZE'}
                  loadingText="Analizando..."
                  onClick={() => runSensitivityAnalysis('UNIT_SIZE')}
                >
                  <VStack spacing={2}>
                    <Text>Tamaño de Unidades</Text>
                    <Text fontSize="sm" color="gray.500">
                      m² por unidad
                    </Text>
                  </VStack>
                </Button>
                
                <Button
                  leftIcon={<FaDollarSign />}
                  colorScheme="orange"
                  variant="outline"
                  h="100px"
                  isLoading={isAnalyzing && selectedAnalysisType === 'TOTAL_UNITS'}
                  loadingText="Analizando..."
                  onClick={() => runSensitivityAnalysis('TOTAL_UNITS')}
                >
                  <VStack spacing={2}>
                    <Text>Número de Unidades</Text>
                    <Text fontSize="sm" color="gray.500">
                      Total del proyecto
                    </Text>
                  </VStack>
                </Button>
                
                <Button
                  leftIcon={<FaChartLine />}
                  colorScheme="teal"
                  variant="outline"
                  h="100px"
                  isLoading={isAnalyzing && selectedAnalysisType === 'DISCOUNT_RATE'}
                  loadingText="Analizando..."
                  onClick={() => runSensitivityAnalysis('DISCOUNT_RATE')}
                >
                  <VStack spacing={2}>
                    <Text>Tasa de Descuento</Text>
                    <Text fontSize="sm" color="gray.500">
                      Costo de capital
                    </Text>
                  </VStack>
                </Button>
              </SimpleGrid>

              {/* Results Display */}
              {sensitivityResults.length > 0 && (
                <Card>
                  <CardHeader>
                    <Heading size="sm">Resultados del Análisis</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      {sensitivityResults.map((result, index) => (
                        <Box key={index} p={4} borderWidth={1} borderRadius="md">
                          <HStack justify="space-between" mb={2}>
                            <Heading size="xs">{result.analysis_name}</Heading>
                            <Badge colorScheme="blue">
                              {new Date(result.created_at).toLocaleDateString()}
                            </Badge>
                          </HStack>
                          
                          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                            <Stat>
                              <StatLabel>Valor Base</StatLabel>
                              <StatNumber fontSize="md">
                                {formatCurrency(result.base_value)}
                              </StatNumber>
                            </Stat>
                            
                            <Stat>
                              <StatLabel>NPV Base</StatLabel>
                              <StatNumber fontSize="md">
                                {result.base_npv ? formatCurrency(result.base_npv) : 'N/A'}
                              </StatNumber>
                            </Stat>
                            
                            <Stat>
                              <StatLabel>TIR Base</StatLabel>
                              <StatNumber fontSize="md">
                                {result.base_irr ? formatPercentage(result.base_irr) : 'N/A'}
                              </StatNumber>
                            </Stat>
                            
                            <Stat>
                              <StatLabel>Payback</StatLabel>
                              <StatNumber fontSize="md">
                                {result.base_payback_months ? `${result.base_payback_months} meses` : 'N/A'}
                              </StatNumber>
                            </Stat>
                          </SimpleGrid>
                          
                          <Text fontSize="sm" color="gray.600" mt={2}>
                            Rango: {result.min_variation_pct}% a {result.max_variation_pct}% en {result.steps} pasos
                          </Text>
                          
                          {result.results && (
                            <Box mt={4}>
                              <Text fontSize="sm" fontWeight="bold" mb={2}>
                                Escenarios Analizados: {Object.keys(result.results).length}
                              </Text>
                              <Alert status="success" size="sm">
                                <AlertIcon />
                                <Text fontSize="sm">
                                  Análisis completado. Los resultados detallados incluyen variaciones de NPV, TIR y período de recuperación para cada escenario.
                                </Text>
                              </Alert>
                            </Box>
                          )}
                        </Box>
                      ))}
                    </VStack>
                  </CardBody>
                </Card>
              )}
              
              {sensitivityResults.length === 0 && !isAnalyzing && (
                <Box textAlign="center" py={8}>
                  <Text color="gray.500">
                    No hay análisis de sensibilidad disponibles. Ejecuta un análisis para ver los resultados.
                  </Text>
                </Box>
              )}
            </VStack>
          </TabPanel>

          {/* Tracking Tab - Only for approved projects */}
          {project?.status === 'APPROVED' && (
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <HStack justify="space-between" align="center">
                  <VStack align="start" spacing={1}>
                    <Heading size="md">Seguimiento: Presupuesto vs. Realidad</Heading>
                    <Text color="gray.600">
                      Comparación entre la línea base aprobada y los valores actuales del proyecto
                    </Text>
                  </VStack>
                  <Button 
                    leftIcon={<FaSync />} 
                    onClick={fetchBaselineComparison}
                    isLoading={loadingBaseline}
                    size="sm"
                  >
                    Actualizar
                  </Button>
                </HStack>

                {loadingBaseline ? (
                  <Box textAlign="center" py={8}>
                    <Spinner size="lg" color="purple.500" />
                    <Text mt={4} color="gray.500">Cargando comparación...</Text>
                  </Box>
                ) : baselineComparison ? (
                  <VStack spacing={6} align="stretch">
                    {/* Summary Cards */}
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
                      <Card>
                        <CardBody>
                          <Stat>
                            <StatLabel>Presupuesto Inicial</StatLabel>
                            <StatNumber>{formatCurrency(baselineComparison.summary.total_baseline_cost)}</StatNumber>
                            <StatHelpText>Línea base aprobada</StatHelpText>
                          </Stat>
                        </CardBody>
                      </Card>
                      
                      <Card>
                        <CardBody>
                          <Stat>
                            <StatLabel>Costo Actual</StatLabel>
                            <StatNumber>{formatCurrency(baselineComparison.summary.total_actual_cost)}</StatNumber>
                            <StatHelpText>Proyección actual</StatHelpText>
                          </Stat>
                        </CardBody>
                      </Card>
                      
                      <Card>
                        <CardBody>
                          <Stat>
                            <StatLabel>Variación Total</StatLabel>
                            <StatNumber color={baselineComparison.summary.total_variance >= 0 ? 'red.500' : 'green.500'}>
                              {formatCurrency(baselineComparison.summary.total_variance)}
                            </StatNumber>
                            <StatHelpText>
                              {baselineComparison.summary.total_variance >= 0 ? 'Sobrecosto' : 'Ahorro'}
                            </StatHelpText>
                          </Stat>
                        </CardBody>
                      </Card>
                      
                      <Card>
                        <CardBody>
                          <Stat>
                            <StatLabel>% de Variación</StatLabel>
                            <StatNumber color={baselineComparison.summary.total_variance_pct >= 0 ? 'red.500' : 'green.500'}>
                              {baselineComparison.summary.total_variance_pct.toFixed(2)}%
                            </StatNumber>
                            <StatHelpText>
                              {Math.abs(baselineComparison.summary.total_variance_pct) > 10 ? 'Desviación significativa' : 'Dentro del rango'}
                            </StatHelpText>
                          </Stat>
                        </CardBody>
                      </Card>
                    </SimpleGrid>

                    {/* Cost Comparison by Category */}
                    <Card>
                      <CardHeader>
                        <Heading size="sm">Comparación por Categoría</Heading>
                      </CardHeader>
                      <CardBody>
                        <TableContainer>
                          <Table variant="simple" size="sm">
                            <Thead>
                              <Tr>
                                <Th>Categoría</Th>
                                <Th isNumeric>Presupuesto Base</Th>
                                <Th isNumeric>Costo Actual</Th>
                                <Th isNumeric>Variación</Th>
                                <Th isNumeric>% Variación</Th>
                                <Th>Estado</Th>
                              </Tr>
                            </Thead>
                            <Tbody>
                              {baselineComparison.cost_comparison.map((category: any) => (
                                <Tr key={category.category}>
                                  <Td>
                                    <Badge colorScheme={getCategoriaColor(category.category)} size="sm">
                                      {category.category}
                                    </Badge>
                                  </Td>
                                  <Td isNumeric>{formatCurrency(category.baseline_total)}</Td>
                                  <Td isNumeric>{formatCurrency(category.actual_total)}</Td>
                                  <Td isNumeric color={category.variance >= 0 ? 'red.500' : 'green.500'}>
                                    {formatCurrency(category.variance)}
                                  </Td>
                                  <Td isNumeric color={category.variance_pct >= 0 ? 'red.500' : 'green.500'}>
                                    {category.variance_pct.toFixed(1)}%
                                  </Td>
                                  <Td>
                                    <Badge 
                                      size="sm"
                                      colorScheme={
                                        Math.abs(category.variance_pct) <= 5 ? 'green' :
                                        Math.abs(category.variance_pct) <= 15 ? 'yellow' : 'red'
                                      }
                                    >
                                      {Math.abs(category.variance_pct) <= 5 ? 'En línea' :
                                       Math.abs(category.variance_pct) <= 15 ? 'Atención' : 'Alerta'}
                                    </Badge>
                                  </Td>
                                </Tr>
                              ))}
                            </Tbody>
                          </Table>
                        </TableContainer>
                      </CardBody>
                    </Card>

                    {/* Cash Flow Comparison Chart */}
                    {baselineComparison.cashflow_comparison && baselineComparison.cashflow_comparison.length > 0 && (
                      <Card>
                        <CardHeader>
                          <Heading size="sm">Comparación de Flujo de Caja (Primeros 12 meses)</Heading>
                        </CardHeader>
                        <CardBody>
                          <ResponsiveContainer width="100%" height={400}>
                            <LineChart data={baselineComparison.cashflow_comparison}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="period"
                                angle={-45}
                                textAnchor="end"
                                height={80}
                                fontSize={10}
                              />
                              <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                              <Tooltip formatter={(value) => formatCurrency(value as number)} />
                              <Legend />
                              <Line 
                                type="monotone" 
                                dataKey="baseline.flujo_acumulado" 
                                stroke="#8b5cf6" 
                                name="Baseline - Flujo Acumulado" 
                                strokeWidth={2}
                                strokeDasharray="5 5"
                              />
                              <Line 
                                type="monotone" 
                                dataKey="actual.flujo_acumulado" 
                                stroke="#10b981" 
                                name="Actual - Flujo Acumulado" 
                                strokeWidth={2}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </CardBody>
                      </Card>
                    )}

                    {/* Project approval info */}
                    <Alert status="info">
                      <AlertIcon />
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="bold">
                          Proyecto aprobado el: {new Date(baselineComparison.approved_at).toLocaleDateString('es-ES')}
                        </Text>
                        <Text fontSize="sm">
                          La línea base fue creada en el momento de la aprobación y sirve como referencia para el seguimiento del proyecto.
                        </Text>
                      </VStack>
                    </Alert>
                  </VStack>
                ) : (
                  <Alert status="warning">
                    <AlertIcon />
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="bold">No hay datos de línea base disponibles</Text>
                      <Text fontSize="sm">
                        Aunque el proyecto está aprobado, no se encontraron datos de línea base. 
                        Esto puede ocurrir si el proyecto fue aprobado antes de implementar el sistema de seguimiento.
                      </Text>
                    </VStack>
                  </Alert>
                )}
              </VStack>
            </TabPanel>
          )}
        </TabPanels>
      </Tabs>

      {/* Edit Project Modal */}
      <Modal isOpen={isEditProjectOpen} onClose={onEditProjectClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Editar Información Básica del Proyecto</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <SimpleGrid columns={2} spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Nombre del Proyecto</FormLabel>
                  <Input
                    value={editProjectData.name}
                    onChange={(e) => setEditProjectData({...editProjectData, name: e.target.value})}
                    placeholder="Nombre del proyecto"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Ubicación</FormLabel>
                  <Input
                    value={editProjectData.location}
                    onChange={(e) => setEditProjectData({...editProjectData, location: e.target.value})}
                    placeholder="Ej: Zona Norte, Ciudad"
                  />
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={2} spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Fecha de Inicio del Proyecto</FormLabel>
                  <Input
                    type="date"
                    value={editProjectData.start_date}
                    onChange={(e) => setEditProjectData({...editProjectData, start_date: e.target.value})}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Fecha de Finalización del Proyecto</FormLabel>
                  <Input
                    type="date"
                    value={editProjectData.end_date}
                    onChange={(e) => setEditProjectData({...editProjectData, end_date: e.target.value})}
                  />
                </FormControl>
              </SimpleGrid>

              <FormControl>
                <FormLabel>Descripción</FormLabel>
                <Textarea
                  value={editProjectData.description}
                  onChange={(e) => setEditProjectData({...editProjectData, description: e.target.value})}
                  placeholder="Descripción del proyecto..."
                  rows={3}
                />
              </FormControl>

              <SimpleGrid columns={2} spacing={4}>
                <FormControl>
                  <FormLabel>Área Total (m²)</FormLabel>
                  <Input
                    type="number"
                    value={editProjectData.total_area_m2}
                    onChange={(e) => setEditProjectData({...editProjectData, total_area_m2: e.target.value})}
                    placeholder="Ej: 5000"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Área Construible (m²)</FormLabel>
                  <Input
                    type="number"
                    value={editProjectData.buildable_area_m2}
                    onChange={(e) => setEditProjectData({...editProjectData, buildable_area_m2: e.target.value})}
                    placeholder="Ej: 3500"
                  />
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={2} spacing={4}>
                <FormControl>
                  <FormLabel>Total de Unidades</FormLabel>
                  <Input
                    type="number"
                    value={editProjectData.total_units}
                    onChange={(e) => setEditProjectData({...editProjectData, total_units: e.target.value})}
                    placeholder="Ej: 50"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Tamaño Promedio por Unidad (m²)</FormLabel>
                  <Input
                    type="number"
                    value={editProjectData.avg_unit_size_m2}
                    onChange={(e) => setEditProjectData({...editProjectData, avg_unit_size_m2: e.target.value})}
                    placeholder="Ej: 70"
                  />
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={2} spacing={4}>
                <FormControl>
                  <FormLabel>Precio Objetivo por m² (USD)</FormLabel>
                  <Input
                    type="number"
                    value={editProjectData.target_price_per_m2}
                    onChange={(e) => setEditProjectData({...editProjectData, target_price_per_m2: e.target.value})}
                    placeholder="Ej: 1200"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Período de Ventas (meses)</FormLabel>
                  <Input
                    type="number"
                    min={1}
                    max={120}
                    value={editProjectData.expected_sales_period_months}
                    onChange={(e) => setEditProjectData({...editProjectData, expected_sales_period_months: e.target.value})}
                    placeholder="Ej: 36"
                  />
                </FormControl>
              </SimpleGrid>

              <Text fontWeight="semibold" fontSize="md" color="purple.600" mb={2}>
                Parámetros Financieros
              </Text>
              <Text fontSize="sm" color="gray.600" mb={4}>
                💡 Ingrese los valores como porcentajes enteros (ejemplo: 12 para 12%)
              </Text>

              <SimpleGrid columns={3} spacing={4}>
                <FormControl>
                  <FormLabel>
                    Tasa de Descuento (%)
                    <Text fontSize="xs" color="gray.500" fontWeight="normal">
                      Para análisis DCF
                    </Text>
                  </FormLabel>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={editProjectData.discount_rate}
                    onChange={(e) => setEditProjectData({...editProjectData, discount_rate: e.target.value})}
                    placeholder="12"
                  />
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Ej: 12 = 12% anual
                  </Text>
                </FormControl>

                <FormControl>
                  <FormLabel>
                    Tasa de Inflación (%)
                    <Text fontSize="xs" color="gray.500" fontWeight="normal">
                      Proyección anual
                    </Text>
                  </FormLabel>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={editProjectData.inflation_rate}
                    onChange={(e) => setEditProjectData({...editProjectData, inflation_rate: e.target.value})}
                    placeholder="3"
                  />
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Ej: 3 = 3% anual
                  </Text>
                </FormControl>

                <FormControl>
                  <FormLabel>
                    % Contingencia
                    <Text fontSize="xs" color="gray.500" fontWeight="normal">
                      Sobre costos totales
                    </Text>
                  </FormLabel>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={editProjectData.contingency_percentage}
                    onChange={(e) => setEditProjectData({...editProjectData, contingency_percentage: e.target.value})}
                    placeholder="10"
                  />
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Ej: 10 = 10% del costo
                  </Text>
                </FormControl>
              </SimpleGrid>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEditProjectClose}>
              Cancelar
            </Button>
            <Button 
              colorScheme="purple" 
              onClick={updateProject}
              isLoading={updatingProject}
              loadingText="Actualizando..."
            >
              Actualizar Proyecto
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Add Cost Item Modal */}
      <Modal isOpen={isAddCostOpen} onClose={onAddCostClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Agregar Item de Costo</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <SimpleGrid columns={2} spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Categoría</FormLabel>
                  <Select
                    value={newCostItem.categoria}
                    onChange={(e) => setNewCostItem({...newCostItem, categoria: e.target.value})}
                    placeholder="Seleccionar categoría"
                  >
                    <option value="Terreno">Terreno</option>
                    <option value="Costos Duros">Costos Duros</option>
                    <option value="Costos Blandos">Costos Blandos</option>
                    <option value="Financiación">Financiación</option>
                    <option value="Contingencia">Contingencia</option>
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Subcategoría</FormLabel>
                  <Input
                    value={newCostItem.subcategoria}
                    onChange={(e) => setNewCostItem({...newCostItem, subcategoria: e.target.value})}
                    placeholder="Ej: Construcción"
                  />
                </FormControl>
              </SimpleGrid>

              <FormControl isRequired>
                <FormLabel>Partida de Costo</FormLabel>
                <Input
                  value={newCostItem.partida_costo}
                  onChange={(e) => setNewCostItem({...newCostItem, partida_costo: e.target.value})}
                  placeholder="Ej: Estructura y Cimentación"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Base de Costo</FormLabel>
                <Select
                  value={newCostItem.base_costo}
                  onChange={(e) => setNewCostItem({...newCostItem, base_costo: e.target.value})}
                  placeholder="Seleccionar base"
                >
                  <option value="fijo">Monto Fijo</option>
                  <option value="mensual">Costo Mensual Recurrente</option>
                  <option value="por m²">por m²</option>
                  <option value="por unidad">por unidad</option>
                  <option value="% costos duros">% Costos Duros</option>
                  <option value="% ingresos por venta">% Ingresos por Venta</option>
                  <option value="% costos totales">% Costos Totales</option>
                </Select>
              </FormControl>

              {/* Smart Cost Input Field */}
              {newCostItem.base_costo === 'mensual' ? (
                <VStack spacing={4} align="stretch">
                  <FormControl isRequired>
                    <FormLabel>
                      Costo Mensual
                      <Badge ml={2} colorScheme="orange" size="xs">
                        Recurrente
                      </Badge>
                    </FormLabel>
                    <HStack>
                      <NumberInput flex={1}>
                        <NumberInputField
                          value={newCostItem.monthly_amount}
                          onChange={(e) => setNewCostItem({...newCostItem, monthly_amount: e.target.value})}
                          placeholder="Ej: 1000.00"
                        />
                      </NumberInput>
                      <Text fontSize="sm" color="gray.500" minW="fit-content">USD por mes</Text>
                    </HStack>
                    {newCostItem.monthly_amount && newCostItem.duration_months && (
                      <Text fontSize="sm" color="orange.600" mt={1}>
                        ≈ Total proyectado: ${(parseFloat(newCostItem.monthly_amount) * parseFloat(newCostItem.duration_months)).toLocaleString()} USD
                        <Text as="span" fontSize="xs" color="gray.500" ml={2}>
                          ({newCostItem.monthly_amount} × {newCostItem.duration_months} meses)
                        </Text>
                      </Text>
                    )}
                  </FormControl>
                </VStack>
              ) : newCostItem.base_costo === 'por m²' ? (
                <FormControl isRequired>
                  <FormLabel>
                    Costo por m² 
                    <Badge ml={2} colorScheme="blue" size="xs">
                      {project?.total_units && project?.avg_unit_size_m2 
                        ? `Total: ${project.total_units * project.avg_unit_size_m2} m²`
                        : 'Área Total: Por definir'
                      }
                    </Badge>
                  </FormLabel>
                  <HStack>
                    <NumberInput flex={1}>
                      <NumberInputField
                        value={newCostItem.unit_cost}
                        onChange={(e) => setNewCostItem({...newCostItem, unit_cost: e.target.value})}
                        placeholder="Ej: 50.00"
                      />
                    </NumberInput>
                    <Text fontSize="sm" color="gray.500" minW="fit-content">USD por m²</Text>
                  </HStack>
                  {project?.total_units && project?.avg_unit_size_m2 && newCostItem.unit_cost && (
                    <Text fontSize="sm" color="blue.600" mt={1}>
                      ≈ Total proyectado: ${(parseFloat(newCostItem.unit_cost) * project.total_units * project.avg_unit_size_m2).toLocaleString()} USD
                    </Text>
                  )}
                </FormControl>
              ) : newCostItem.base_costo === 'por unidad' ? (
                <FormControl isRequired>
                  <FormLabel>
                    Costo por Unidad
                    <Badge ml={2} colorScheme="green" size="xs">
                      {project?.total_units ? `Total: ${project.total_units} unidades` : 'Unidades: Por definir'}
                    </Badge>
                  </FormLabel>
                  <HStack>
                    <NumberInput flex={1}>
                      <NumberInputField
                        value={newCostItem.unit_cost}
                        onChange={(e) => setNewCostItem({...newCostItem, unit_cost: e.target.value})}
                        placeholder="Ej: 1500.00"
                      />
                    </NumberInput>
                    <Text fontSize="sm" color="gray.500" minW="fit-content">USD por unidad</Text>
                  </HStack>
                  {project?.total_units && newCostItem.unit_cost && (
                    <Text fontSize="sm" color="green.600" mt={1}>
                      ≈ Total proyectado: ${(parseFloat(newCostItem.unit_cost) * project.total_units).toLocaleString()} USD
                    </Text>
                  )}
                </FormControl>
              ) : (
                <FormControl isRequired>
                  <FormLabel>Monto Total</FormLabel>
                  <HStack>
                    <NumberInput flex={1}>
                      <NumberInputField
                        value={newCostItem.monto_proyectado}
                        onChange={(e) => setNewCostItem({...newCostItem, monto_proyectado: e.target.value})}
                        placeholder="Ej: 25000.00"
                      />
                    </NumberInput>
                    <Text fontSize="sm" color="gray.500" minW="fit-content">USD</Text>
                  </HStack>
                </FormControl>
              )}

              <SimpleGrid columns={2} spacing={4}>
                <FormControl>
                  <FormLabel>Mes de Inicio</FormLabel>
                  <NumberInput min={1} max={60}>
                    <NumberInputField
                      value={newCostItem.start_month}
                      onChange={(e) => setNewCostItem({...newCostItem, start_month: e.target.value})}
                    />
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>Duración (meses)</FormLabel>
                  <NumberInput min={1} max={60}>
                    <NumberInputField
                      value={newCostItem.duration_months}
                      onChange={(e) => setNewCostItem({...newCostItem, duration_months: e.target.value})}
                    />
                  </NumberInput>
                </FormControl>
              </SimpleGrid>

              <FormControl>
                <FormLabel>Notas</FormLabel>
                <Textarea
                  value={newCostItem.notes}
                  onChange={(e) => setNewCostItem({...newCostItem, notes: e.target.value})}
                  placeholder="Notas adicionales..."
                  rows={3}
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onAddCostClose}>
              Cancelar
            </Button>
            <Button colorScheme="purple" onClick={addCostItem}>
              Agregar Item
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Cost Item Modal */}
      <Modal isOpen={isEditCostOpen} onClose={onEditCostClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Editar Item de Costo</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <SimpleGrid columns={2} spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Categoría</FormLabel>
                  <Select
                    value={editCostItem.categoria}
                    onChange={(e) => setEditCostItem({...editCostItem, categoria: e.target.value})}
                  >
                    <option value="Terreno">Terreno</option>
                    <option value="Costos Duros">Costos Duros</option>
                    <option value="Costos Blandos">Costos Blandos</option>
                    <option value="Financiación">Financiación</option>
                    <option value="Contingencia">Contingencia</option>
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Subcategoría</FormLabel>
                  <Input
                    value={editCostItem.subcategoria}
                    onChange={(e) => setEditCostItem({...editCostItem, subcategoria: e.target.value})}
                    placeholder="Ej: Construcción"
                  />
                </FormControl>
              </SimpleGrid>

              <FormControl isRequired>
                <FormLabel>Partida de Costo</FormLabel>
                <Input
                  value={editCostItem.partida_costo}
                  onChange={(e) => setEditCostItem({...editCostItem, partida_costo: e.target.value})}
                  placeholder="Ej: Estructura y Cimentación"
                />
              </FormControl>

                              <FormControl isRequired>
                <FormLabel>Base de Costo</FormLabel>
                <Select
                  value={editCostItem.base_costo}
                  onChange={(e) => setEditCostItem({...editCostItem, base_costo: e.target.value})}
                >
                  <option value="fijo">Monto Fijo</option>
                  <option value="mensual">Costo Mensual Recurrente</option>
                  <option value="por m²">por m²</option>
                  <option value="por unidad">por unidad</option>
                  <option value="% costos duros">% Costos Duros</option>
                  <option value="% ingresos por venta">% Ingresos por Venta</option>
                  <option value="% costos totales">% Costos Totales</option>
                </Select>
              </FormControl>

              {/* Smart Cost Input Field */}
              {editCostItem.base_costo === 'mensual' ? (
                <VStack spacing={4} align="stretch">
                  <FormControl isRequired>
                    <FormLabel>
                      Costo Mensual
                      <Badge ml={2} colorScheme="orange" size="xs">
                        Recurrente
                      </Badge>
                    </FormLabel>
                    <HStack>
                      <Input
                        type="number"
                        flex={1}
                        value={editCostItem.monthly_amount}
                        onChange={(e) => setEditCostItem({...editCostItem, monthly_amount: e.target.value})}
                        placeholder="Ej: 1000.00"
                      />
                      <Text fontSize="sm" color="gray.500" minW="fit-content">USD por mes</Text>
                    </HStack>
                    {editCostItem.monthly_amount && editCostItem.duration_months && (
                      <Text fontSize="sm" color="orange.600" mt={1}>
                        ≈ Total proyectado: ${(parseFloat(editCostItem.monthly_amount) * parseFloat(editCostItem.duration_months)).toLocaleString()} USD
                        <Text as="span" fontSize="xs" color="gray.500" ml={2}>
                          ({editCostItem.monthly_amount} × {editCostItem.duration_months} meses)
                        </Text>
                      </Text>
                    )}
                  </FormControl>
                </VStack>
              ) : editCostItem.base_costo === 'por m²' ? (
                <FormControl isRequired>
                  <FormLabel>
                    Costo por m² 
                    <Badge ml={2} colorScheme="blue" size="xs">
                      {project?.total_units && project?.avg_unit_size_m2 
                        ? `Total: ${project.total_units * project.avg_unit_size_m2} m²`
                        : 'Área Total: Por definir'
                      }
                    </Badge>
                  </FormLabel>
                  <HStack>
                    <Input
                      type="number"
                      flex={1}
                      value={editCostItem.unit_cost}
                      onChange={(e) => setEditCostItem({...editCostItem, unit_cost: e.target.value})}
                      placeholder="Ej: 50.00"
                    />
                    <Text fontSize="sm" color="gray.500" minW="fit-content">USD por m²</Text>
                  </HStack>
                  {project?.total_units && project?.avg_unit_size_m2 && editCostItem.unit_cost && (
                    <Text fontSize="sm" color="blue.600" mt={1}>
                      ≈ Total proyectado: ${(parseFloat(editCostItem.unit_cost) * project.total_units * project.avg_unit_size_m2).toLocaleString()} USD
                    </Text>
                  )}
                </FormControl>
              ) : editCostItem.base_costo === 'por unidad' ? (
                <FormControl isRequired>
                  <FormLabel>
                    Costo por Unidad
                    <Badge ml={2} colorScheme="green" size="xs">
                      {project?.total_units ? `Total: ${project.total_units} unidades` : 'Unidades: Por definir'}
                    </Badge>
                  </FormLabel>
                  <HStack>
                    <Input
                      type="number"
                      flex={1}
                      value={editCostItem.unit_cost}
                      onChange={(e) => setEditCostItem({...editCostItem, unit_cost: e.target.value})}
                      placeholder="Ej: 1500.00"
                    />
                    <Text fontSize="sm" color="gray.500" minW="fit-content">USD por unidad</Text>
                  </HStack>
                  {project?.total_units && editCostItem.unit_cost && (
                    <Text fontSize="sm" color="green.600" mt={1}>
                      ≈ Total proyectado: ${(parseFloat(editCostItem.unit_cost) * project.total_units).toLocaleString()} USD
                    </Text>
                  )}
                </FormControl>
              ) : (
                <FormControl isRequired>
                  <FormLabel>Monto Total</FormLabel>
                  <HStack>
                    <Input
                      type="number"
                      flex={1}
                      value={editCostItem.monto_proyectado}
                      onChange={(e) => setEditCostItem({...editCostItem, monto_proyectado: e.target.value})}
                      placeholder="Ej: 25000.00"
                    />
                    <Text fontSize="sm" color="gray.500" minW="fit-content">USD</Text>
                  </HStack>
                </FormControl>
              )}

              <SimpleGrid columns={2} spacing={4}>
                <FormControl>
                  <FormLabel>Mes de Inicio</FormLabel>
                  <Input
                    type="number"
                    min={1}
                    max={60}
                    value={editCostItem.start_month}
                    onChange={(e) => setEditCostItem({...editCostItem, start_month: e.target.value})}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Duración (meses)</FormLabel>
                  <Input
                    type="number"
                    min={1}
                    max={60}
                    value={editCostItem.duration_months}
                    onChange={(e) => setEditCostItem({...editCostItem, duration_months: e.target.value})}
                  />
                </FormControl>
              </SimpleGrid>

              <FormControl>
                <FormLabel>Notas</FormLabel>
                <Textarea
                  value={editCostItem.notes}
                  onChange={(e) => setEditCostItem({...editCostItem, notes: e.target.value})}
                  placeholder="Notas adicionales..."
                  rows={3}
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEditCostClose}>
              Cancelar
            </Button>
            <Button colorScheme="purple" onClick={updateCostItem}>
              Actualizar Item
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Add Credit Line Modal */}
      <Modal isOpen={isAddCreditOpen} onClose={onAddCreditClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <VStack align="start" spacing={1}>
              <Text>Nueva Línea de Crédito Hipotética</Text>
              <Badge colorScheme="purple" variant="outline" size="sm">
                Para Modelado Financiero
              </Badge>
            </VStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="info" size="sm">
                <AlertIcon />
                <Text fontSize="sm">
                  Esta línea de crédito es hipotética y se utilizará únicamente para análisis financiero.
                  No representa un compromiso real con una entidad financiera.
                </Text>
              </Alert>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Nombre de la Línea</FormLabel>
                  <Input
                    value={newCreditLine.nombre}
                    onChange={(e) => setNewCreditLine({...newCreditLine, nombre: e.target.value})}
                    placeholder="Ej: Línea de Construcción - Proyecto ABC"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Tipo de Línea</FormLabel>
                  <Select
                    value={newCreditLine.tipo_linea}
                    onChange={(e) => setNewCreditLine({...newCreditLine, tipo_linea: e.target.value})}
                  >
                    <option value="LINEA_CREDITO">Línea de Crédito</option>
                    <option value="PRESTAMO_HIPOTECARIO">Préstamo Hipotecario</option>
                    <option value="PRESTAMO_CONSTRUCCION">Préstamo de Construcción</option>
                    <option value="SOBREGIRO">Sobregiro</option>
                    <option value="FACTORING">Factoring</option>
                    <option value="LEASING_FINANCIERO">Leasing Financiero</option>
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Monto Total</FormLabel>
                  <Input
                    type="number"
                    value={newCreditLine.monto_total_linea}
                    onChange={(e) => setNewCreditLine({...newCreditLine, monto_total_linea: e.target.value})}
                    placeholder="0.00"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Tasa de Interés (%)</FormLabel>
                  <Input
                    type="number"
                    step="0.01"
                    value={newCreditLine.interest_rate}
                    onChange={(e) => setNewCreditLine({...newCreditLine, interest_rate: e.target.value})}
                    placeholder="0.00"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Fecha de Inicio</FormLabel>
                  <Input
                    type="date"
                    value={newCreditLine.fecha_inicio}
                    onChange={(e) => setNewCreditLine({...newCreditLine, fecha_inicio: e.target.value})}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Fecha de Vencimiento</FormLabel>
                  <Input
                    type="date"
                    value={newCreditLine.fecha_fin}
                    onChange={(e) => setNewCreditLine({...newCreditLine, fecha_fin: e.target.value})}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Plazo (meses)</FormLabel>
                  <Input
                    type="number"
                    value={newCreditLine.plazo_meses}
                    onChange={(e) => setNewCreditLine({...newCreditLine, plazo_meses: e.target.value})}
                    placeholder="12"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Periodicidad de Pago</FormLabel>
                  <Select
                    value={newCreditLine.periodicidad_pago}
                    onChange={(e) => setNewCreditLine({...newCreditLine, periodicidad_pago: e.target.value})}
                  >
                    <option value="MENSUAL">Mensual</option>
                    <option value="TRIMESTRAL">Trimestral</option>
                    <option value="SEMESTRAL">Semestral</option>
                    <option value="ANUAL">Anual</option>
                    <option value="AL_VENCIMIENTO">Al Vencimiento</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Cargos de Apertura</FormLabel>
                  <Input
                    type="number"
                    step="0.01"
                    value={newCreditLine.cargos_apertura}
                    onChange={(e) => setNewCreditLine({...newCreditLine, cargos_apertura: e.target.value})}
                    placeholder="0.00"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Moneda</FormLabel>
                  <Select
                    value={newCreditLine.moneda}
                    onChange={(e) => setNewCreditLine({...newCreditLine, moneda: e.target.value})}
                  >
                    <option value="USD">USD - Dólares</option>
                    <option value="COP">COP - Pesos</option>
                    <option value="EUR">EUR - Euros</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Tipo de Garantía</FormLabel>
                  <Input
                    value={newCreditLine.garantia_tipo}
                    onChange={(e) => setNewCreditLine({...newCreditLine, garantia_tipo: e.target.value})}
                    placeholder="Ej: Hipotecaria, Prendaria, Personal"
                  />
                </FormControl>
              </SimpleGrid>
              
              <FormControl>
                <FormLabel>Descripción de Garantía</FormLabel>
                <Textarea
                  value={newCreditLine.garantia_descripcion}
                  onChange={(e) => setNewCreditLine({...newCreditLine, garantia_descripcion: e.target.value})}
                  placeholder="Descripción detallada de la garantía..."
                  resize="vertical"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onAddCreditClose}>
              Cancelar
            </Button>
            <Button 
              colorScheme="purple" 
              onClick={addCreditLine}
              isDisabled={!newCreditLine.nombre || !newCreditLine.monto_total_linea || !newCreditLine.fecha_inicio || !newCreditLine.fecha_fin}
            >
              Crear Línea Hipotética
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Credit Line Usage Modal */}
      <Modal isOpen={isUsageModalOpen} onClose={onUsageModalClose} size="6xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <VStack align="start" spacing={1}>
              <Text>Usos Planificados - {selectedCreditLineForUsage?.nombre}</Text>
              <Badge colorScheme="blue" variant="outline" size="sm">
                Planificación de Financiamiento
              </Badge>
            </VStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="info" size="sm">
                <AlertIcon />
                <Text fontSize="sm">
                  Estos son los usos proyectados de la línea de crédito durante el desarrollo del proyecto.
                  Ayudan a modelar cuándo y cuánto financiamiento se necesitará.
                </Text>
              </Alert>

              <HStack justify="space-between">
                <VStack align="start" spacing={1}>
                  <Text fontWeight="bold">Línea: {selectedCreditLineForUsage?.nombre}</Text>
                  <Text fontSize="sm" color="gray.600">
                    Disponible: {selectedCreditLineForUsage ? formatCurrency(selectedCreditLineForUsage.monto_disponible) : ''}
                  </Text>
                </VStack>
                <Button
                  leftIcon={<FaCalendarPlus />}
                  colorScheme="green"
                  size="sm"
                  onClick={() => {
                    onUsageModalClose();
                    openAddUsageModal(selectedCreditLineForUsage!);
                  }}
                >
                  Planificar Nuevo Uso
                </Button>
              </HStack>

              {selectedCreditLineForUsage && loadingUsage[selectedCreditLineForUsage.id] ? (
                <Center p={8}>
                  <VStack spacing={4}>
                    <Spinner size="lg" color="blue.500" />
                    <Text>Cargando usos planificados...</Text>
                  </VStack>
                </Center>
              ) : selectedCreditLineForUsage && selectedCreditLineUsage[selectedCreditLineForUsage.id]?.length === 0 ? (
                <VStack spacing={4} py={8}>
                  <Text color="gray.500" textAlign="center">
                    No hay usos planificados para esta línea de crédito.
                  </Text>
                  <Button
                    leftIcon={<FaCalendarPlus />}
                    colorScheme="green"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onUsageModalClose();
                      openAddUsageModal(selectedCreditLineForUsage!);
                    }}
                  >
                    Planificar Primer Uso
                  </Button>
                </VStack>
              ) : selectedCreditLineForUsage && selectedCreditLineUsage[selectedCreditLineForUsage.id] ? (
                <TableContainer>
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Fecha Proyectada</Th>
                        <Th>Tipo</Th>
                        <Th>Monto</Th>
                        <Th>Descripción</Th>
                        <Th>Cost Item Asociado</Th>
                        <Th>Acciones</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {selectedCreditLineUsage[selectedCreditLineForUsage.id].map((usage) => (
                        <Tr key={usage.id}>
                          <Td>
                            <Text fontWeight="bold" fontSize="sm">
                              {new Date(usage.fecha_uso).toLocaleDateString()}
                            </Text>
                          </Td>
                          <Td>
                            <Badge 
                              colorScheme={usage.tipo_transaccion === 'DRAWDOWN' ? 'red' : 'green'}
                              size="sm"
                            >
                              {usage.tipo_transaccion === 'DRAWDOWN' ? 'Desembolso' : 'Pago'}
                            </Badge>
                          </Td>
                          <Td>
                            <Text 
                              color={usage.tipo_transaccion === 'DRAWDOWN' ? 'red.500' : 'green.500'}
                              fontWeight="bold"
                            >
                              {formatCurrency(usage.monto_usado)}
                            </Text>
                          </Td>
                          <Td>
                            <Text fontSize="sm">{usage.descripcion || '-'}</Text>
                          </Td>
                          <Td>
                            {usage.scenario_cost_item_id ? (
                              <Badge colorScheme="purple" size="sm">
                                Cost Item #{usage.scenario_cost_item_id}
                              </Badge>
                            ) : (
                              <Text fontSize="sm" color="gray.500">-</Text>
                            )}
                          </Td>
                          <Td>
                            <IconButton
                              icon={<FaTrash />}
                              aria-label="Eliminar uso"
                              size="xs"
                              colorScheme="red"
                              variant="ghost"
                              onClick={() => deleteCreditLineUsage(selectedCreditLineForUsage.id, usage.id)}
                            />
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              ) : null}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onUsageModalClose}>
              Cerrar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Add Credit Line Usage Modal */}
      <Modal isOpen={isAddUsageOpen} onClose={onAddUsageClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <VStack align="start" spacing={1}>
              <Text>Planificar Uso de Línea de Crédito</Text>
              <Text fontSize="sm" color="gray.600">
                {selectedCreditLineForUsage?.nombre}
              </Text>
              <Badge colorScheme="green" variant="outline" size="sm">
                Disponible: {selectedCreditLineForUsage ? formatCurrency(selectedCreditLineForUsage.monto_disponible) : ''}
              </Badge>
            </VStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="info" size="sm">
                <AlertIcon />
                <Text fontSize="sm">
                  Planifique cuándo y cuánto de esta línea de crédito se utilizará durante el proyecto.
                  Esto ayuda a modelar el flujo de caja y los costos de financiamiento.
                </Text>
              </Alert>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Fecha Proyectada de Uso</FormLabel>
                  <Input
                    type="date"
                    value={newCreditUsage.fecha_uso}
                    onChange={(e) => setNewCreditUsage({...newCreditUsage, fecha_uso: e.target.value})}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Tipo de Transacción</FormLabel>
                  <Select
                    value={newCreditUsage.tipo_transaccion}
                    onChange={(e) => setNewCreditUsage({...newCreditUsage, tipo_transaccion: e.target.value})}
                  >
                    <option value="DRAWDOWN">Desembolso (Usar Crédito)</option>
                    <option value="PAYMENT">Pago (Abonar a Línea)</option>
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Monto</FormLabel>
                  <Input
                    type="number"
                    step="0.01"
                    value={newCreditUsage.monto_usado}
                    onChange={(e) => setNewCreditUsage({...newCreditUsage, monto_usado: e.target.value})}
                    placeholder="0.00"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Cargo por Transacción</FormLabel>
                  <Input
                    type="number"
                    step="0.01"
                    value={newCreditUsage.cargo_transaccion}
                    onChange={(e) => setNewCreditUsage({...newCreditUsage, cargo_transaccion: e.target.value})}
                    placeholder="0.00"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Cost Item Asociado</FormLabel>
                  <Select
                    value={newCreditUsage.scenario_cost_item_id}
                    onChange={(e) => setNewCreditUsage({...newCreditUsage, scenario_cost_item_id: e.target.value})}
                  >
                    <option value="">Sin asociar</option>
                    {costItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.categoria} - {item.partida_costo}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </SimpleGrid>

              <FormControl>
                <FormLabel>Descripción / Propósito</FormLabel>
                <Textarea
                  value={newCreditUsage.descripcion}
                  onChange={(e) => setNewCreditUsage({...newCreditUsage, descripcion: e.target.value})}
                  placeholder="Ej: Compra de materiales para fase de construcción, Pago a contratista principal..."
                  rows={3}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onAddUsageClose}>
              Cancelar
            </Button>
            <Button 
              colorScheme="green" 
              onClick={addCreditLineUsage}
              isDisabled={!newCreditUsage.fecha_uso || !newCreditUsage.monto_usado}
            >
              Planificar Uso
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ScenarioProjectDetailPage; 
