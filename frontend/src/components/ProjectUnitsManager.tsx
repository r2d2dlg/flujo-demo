import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Fab,
  Tooltip,
  Tabs,
  Tab,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Home as HomeIcon,
  Business as BusinessIcon,
  Terrain as TerrainIcon,
  Store as StoreIcon,
  ViewModule as ViewModuleIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  CloudUpload as UploadIcon,
  CloudDownload as DownloadIcon,
  TableChart as ExcelIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  House as HouseIcon,
  Landscape as LandscapeIcon,
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { projectUnits } from '../api/api';
import type {
  ProjectUnit,
  ProjectUnitCreate,
  ProjectUnitUpdate,
  ProjectUnitsStats,
  ExcelUploadResponse,
} from '../types/projectUnitsTypes';
import { formatCurrency, formatNumber } from '../utils/formatters';
import BulkUnitsCreateModal from './BulkUnitsCreateModal';
import UnitSalesSimulator from './UnitSalesSimulator';

// Units Analysis Component
interface UnitsAnalysisTabProps {
  units: ProjectUnit[];
  stats: ProjectUnitsStats | null;
}

const UnitsAnalysisTab: React.FC<UnitsAnalysisTabProps> = ({ units, stats }) => {
  // Calculate analysis metrics
  const unitsByType = units.reduce((acc, unit) => {
    acc[unit.unit_type] = (acc[unit.unit_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const unitsByStatus = units.reduce((acc, unit) => {
    acc[unit.status] = (acc[unit.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const priceAnalysis = units.reduce((acc, unit) => {
    if (unit.target_price_total && unit.total_area_m2) {
      const pricePerM2 = unit.target_price_total / unit.total_area_m2;
      acc.prices.push(unit.target_price_total);
      acc.pricesPerM2.push(pricePerM2);
      acc.areas.push(unit.total_area_m2);
    }
    return acc;
  }, { prices: [] as number[], pricesPerM2: [] as number[], areas: [] as number[] });

  const avgPrice = priceAnalysis.prices.length > 0 
    ? priceAnalysis.prices.reduce((sum, price) => sum + price, 0) / priceAnalysis.prices.length 
    : 0;

  const avgPricePerM2 = priceAnalysis.pricesPerM2.length > 0 
    ? priceAnalysis.pricesPerM2.reduce((sum, price) => sum + price, 0) / priceAnalysis.pricesPerM2.length 
    : 0;

  const avgArea = priceAnalysis.areas.length > 0 
    ? priceAnalysis.areas.reduce((sum, area) => sum + area, 0) / priceAnalysis.areas.length 
    : 0;

  const minPrice = priceAnalysis.prices.length > 0 ? Math.min(...priceAnalysis.prices) : 0;
  const maxPrice = priceAnalysis.prices.length > 0 ? Math.max(...priceAnalysis.prices) : 0;
  const minPricePerM2 = priceAnalysis.pricesPerM2.length > 0 ? Math.min(...priceAnalysis.pricesPerM2) : 0;
  const maxPricePerM2 = priceAnalysis.pricesPerM2.length > 0 ? Math.max(...priceAnalysis.pricesPerM2) : 0;

  // Sales velocity analysis
  const unitsWithPlannedSales = units.filter(unit => unit.planned_sale_month);
  const salesByMonth = unitsWithPlannedSales.reduce((acc, unit) => {
    const month = unit.planned_sale_month!;
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const salesMonths = Object.keys(salesByMonth).map(Number).sort((a, b) => a - b);
  const totalSalesPeriod = salesMonths.length > 0 ? Math.max(...salesMonths) - Math.min(...salesMonths) + 1 : 0;
  const avgMonthlySales = unitsWithPlannedSales.length > 0 && totalSalesPeriod > 0 
    ? unitsWithPlannedSales.length / totalSalesPeriod 
    : 0;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Análisis Detallado de Unidades
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="primary">
                {units.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Unidades
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="success.main">
                {formatCurrency(avgPrice)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Precio Promedio
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="info.main">
                {formatCurrency(avgPricePerM2)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Precio Promedio/m²
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4">
                {formatNumber(avgArea)} m²
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Área Promedio
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Analysis Sections */}
      <Grid container spacing={3}>
        {/* Unit Distribution by Type */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Distribución por Tipo
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Tipo</TableCell>
                    <TableCell align="right">Cantidad</TableCell>
                    <TableCell align="right">Porcentaje</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(unitsByType).map(([type, count]) => (
                    <TableRow key={type}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          {type === 'APARTAMENTO' && <HomeIcon fontSize="small" />}
                          {type === 'CASA' && <HouseIcon fontSize="small" />}
                          {type === 'LOTE' && <LandscapeIcon fontSize="small" />}
                          {type}
                        </Box>
                      </TableCell>
                      <TableCell align="right">{count}</TableCell>
                      <TableCell align="right">
                        {((count / units.length) * 100).toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Unit Distribution by Status */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Distribución por Estado
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Estado</TableCell>
                    <TableCell align="right">Cantidad</TableCell>
                    <TableCell align="right">Porcentaje</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(unitsByStatus).map(([status, count]) => (
                    <TableRow key={status}>
                      <TableCell>
                        <Chip 
                          label={status} 
                          color={status === 'AVAILABLE' ? 'success' : 
                                 status === 'RESERVED' ? 'warning' : 
                                 status === 'SOLD' ? 'primary' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">{count}</TableCell>
                      <TableCell align="right">
                        {((count / units.length) * 100).toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Price Analysis */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Análisis de Precios
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Precio Mínimo
                </Typography>
                <Typography variant="h6">
                  {formatCurrency(minPrice)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Precio Máximo
                </Typography>
                <Typography variant="h6">
                  {formatCurrency(maxPrice)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Precio/m² Mínimo
                </Typography>
                <Typography variant="h6">
                  {formatCurrency(minPricePerM2)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Precio/m² Máximo
                </Typography>
                <Typography variant="h6">
                  {formatCurrency(maxPricePerM2)}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Rango de Precios
                </Typography>
                <Typography variant="body1">
                  {formatCurrency(maxPrice - minPrice)} ({((maxPrice - minPrice) / avgPrice * 100).toFixed(1)}% del promedio)
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Sales Velocity Analysis */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Análisis de Velocidad de Ventas
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Unidades Planificadas
                </Typography>
                <Typography variant="h6">
                  {unitsWithPlannedSales.length}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Período de Ventas
                </Typography>
                <Typography variant="h6">
                  {totalSalesPeriod} meses
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Velocidad Promedio
                </Typography>
                <Typography variant="h6">
                  {avgMonthlySales.toFixed(1)} unidades/mes
                </Typography>
              </Grid>
              {salesMonths.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Distribución Mensual
                  </Typography>
                  <Box sx={{ maxHeight: 150, overflow: 'auto' }}>
                    {salesMonths.map(month => (
                      <Box key={month} display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2">Mes {month}</Typography>
                        <Chip 
                          label={`${salesByMonth[month]} unidades`} 
                          size="small" 
                          color="primary"
                        />
                      </Box>
                    ))}
                  </Box>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>

        {/* Top Performing Units */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Unidades de Mayor Valor
            </Typography>
            <TableContainer sx={{ maxHeight: 300 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Unidad</TableCell>
                    <TableCell align="right">Precio Total</TableCell>
                    <TableCell align="right">Precio/m²</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {units
                    .filter(unit => unit.target_price_total && unit.total_area_m2)
                    .sort((a, b) => (b.target_price_total || 0) - (a.target_price_total || 0))
                    .slice(0, 10)
                    .map((unit) => (
                      <TableRow key={unit.id}>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Chip 
                              label={unit.unit_number} 
                              size="small" 
                              color="primary"
                            />
                            <Typography variant="caption" color="text.secondary">
                              {unit.unit_type}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="bold">
                            {formatCurrency(unit.target_price_total || 0)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {formatCurrency((unit.target_price_total || 0) / (unit.total_area_m2 || 1))}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Unit Size Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Distribución por Tamaño
            </Typography>
            <Grid container spacing={2}>
              {(() => {
                const sizeRanges = [
                  { min: 0, max: 50, label: 'Pequeñas (≤50m²)' },
                  { min: 51, max: 80, label: 'Medianas (51-80m²)' },
                  { min: 81, max: 120, label: 'Grandes (81-120m²)' },
                  { min: 121, max: Infinity, label: 'Extra Grandes (>120m²)' }
                ];
                
                return sizeRanges.map(range => {
                  const count = units.filter(unit => 
                    unit.total_area_m2 && 
                    unit.total_area_m2 >= range.min && 
                    unit.total_area_m2 <= range.max
                  ).length;
                  
                  return (
                    <Grid item xs={12} key={range.label}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2">{range.label}</Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2" fontWeight="bold">
                            {count}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ({((count / units.length) * 100).toFixed(1)}%)
                          </Typography>
                        </Box>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={(count / units.length) * 100}
                        sx={{ mt: 0.5, mb: 1 }}
                      />
                    </Grid>
                  );
                });
              })()}
            </Grid>
          </Paper>
        </Grid>

        {/* Financial Projections */}
        {stats && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Proyecciones Financieras
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Valor Total del Proyecto
                  </Typography>
                  <Typography variant="h5" color="primary">
                    {formatCurrency(stats.total_value)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Ingresos Potenciales
                  </Typography>
                  <Typography variant="h5" color="success.main">
                    {formatCurrency(stats.total_value * (stats.available_units / units.length))}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Área Total Vendible
                  </Typography>
                  <Typography variant="h5">
                    {formatNumber(stats.total_area)} m²
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Progreso de Ventas
                  </Typography>
                  <Typography variant="h5">
                    {((stats.sold_units / units.length) * 100).toFixed(1)}%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={(stats.sold_units / units.length) * 100}
                    sx={{ mt: 1 }}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`units-tabpanel-${index}`}
      aria-labelledby={`units-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface ExcelUploadModalProps {
  open: boolean;
  onClose: () => void;
  projectId: number;
  onUploadSuccess: () => void;
}

const ExcelUploadModal: React.FC<ExcelUploadModalProps> = ({
  open,
  onClose,
  projectId,
  onUploadSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<ExcelUploadResponse | null>(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      setDownloadingTemplate(true);
      await projectUnits.downloadTemplate(projectId);
    } catch (error) {
      console.error('Error downloading template:', error);
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      const response = await projectUnits.uploadExcelUnits(projectId, selectedFile);
      setUploadResult(response.data);
      
      if (response.data.success) {
        onUploadSuccess();
      }
    } catch (error: any) {
      setUploadResult({
        success: false,
        message: error.response?.data?.detail || 'Error al subir el archivo',
        created_units: [],
        errors: [error.response?.data?.detail || 'Error desconocido'],
        summary: { total_rows: 0, created_count: 0, error_count: 1 }
      });
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
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <ExcelIcon />
          Carga Masiva de Unidades desde Excel
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {!uploadResult ? (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                Para cargar unidades masivamente, primero descarga la plantilla de Excel, 
                llénala con los datos de tus unidades y luego súbela aquí.
              </Typography>
            </Alert>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <DownloadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      1. Descargar Plantilla
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Descarga la plantilla de Excel con el formato correcto y ejemplos
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<DownloadIcon />}
                      onClick={handleDownloadTemplate}
                      disabled={downloadingTemplate}
                      fullWidth
                    >
                      {downloadingTemplate ? 'Descargando...' : 'Descargar Plantilla'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <UploadIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      2. Subir Archivo
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Selecciona el archivo Excel completado con tus unidades
                    </Typography>
                    
                    <input
                      accept=".xlsx,.xls"
                      style={{ display: 'none' }}
                      id="excel-file-input"
                      type="file"
                      onChange={handleFileSelect}
                    />
                    <label htmlFor="excel-file-input">
                      <Button variant="outlined" component="span" fullWidth sx={{ mb: 2 }}>
                        Seleccionar Archivo
                      </Button>
                    </label>

                    {selectedFile && (
                      <Alert severity="success" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                          Archivo seleccionado: {selectedFile.name}
                        </Typography>
                      </Alert>
                    )}

                    <Button
                      variant="contained"
                      startIcon={<UploadIcon />}
                      onClick={handleUpload}
                      disabled={!selectedFile || uploading}
                      fullWidth
                      color="success"
                    >
                      {uploading ? 'Subiendo...' : 'Subir y Procesar'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {uploading && (
              <Box sx={{ mt: 3 }}>
                <LinearProgress />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                  Procesando archivo Excel...
                </Typography>
              </Box>
            )}
          </Box>
        ) : (
          <Box>
            <Alert 
              severity={uploadResult.success ? 'success' : 'error'} 
              sx={{ mb: 3 }}
              icon={uploadResult.success ? <CheckIcon /> : <ErrorIcon />}
            >
              <Typography variant="h6">
                {uploadResult.message}
              </Typography>
            </Alert>

            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={4}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {uploadResult.summary.total_rows}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Filas Procesadas
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={4}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">
                      {uploadResult.summary.created_count}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Unidades Creadas
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={4}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="error.main">
                      {uploadResult.summary.error_count}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Errores
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {uploadResult.created_units.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Unidades Creadas Exitosamente
                </Typography>
                <List dense>
                  {uploadResult.created_units.slice(0, 10).map((unit, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <CheckIcon color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary={`${unit.unit_number} - ${unit.unit_type}`}
                        secondary={unit.target_price_total ? formatCurrency(unit.target_price_total) : 'Sin precio'}
                      />
                    </ListItem>
                  ))}
                  {uploadResult.created_units.length > 10 && (
                    <ListItem>
                      <ListItemText
                        primary={`... y ${uploadResult.created_units.length - 10} unidades más`}
                        sx={{ textAlign: 'center', fontStyle: 'italic' }}
                      />
                    </ListItem>
                  )}
                </List>
              </Box>
            )}

            {uploadResult.errors.length > 0 && (
              <Box>
                <Typography variant="h6" gutterBottom color="error">
                  Errores Encontrados
                </Typography>
                <List dense>
                  {uploadResult.errors.slice(0, 10).map((error, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <ErrorIcon color="error" />
                      </ListItemIcon>
                      <ListItemText primary={error} />
                    </ListItem>
                  ))}
                  {uploadResult.errors.length > 10 && (
                    <ListItem>
                      <ListItemText
                        primary={`... y ${uploadResult.errors.length - 10} errores más`}
                        sx={{ textAlign: 'center', fontStyle: 'italic' }}
                      />
                    </ListItem>
                  )}
                </List>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          {uploadResult ? 'Cerrar' : 'Cancelar'}
        </Button>
        {uploadResult && uploadResult.success && (
          <Button variant="contained" onClick={handleClose}>
            Continuar
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

const ProjectUnitsManager: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [units, setUnits] = useState<ProjectUnit[]>([]);
  const [stats, setStats] = useState<ProjectUnitsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  // Dialog states
  const [unitDialogOpen, setUnitDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<ProjectUnit | null>(null);
  const [bulkCreateDialogOpen, setBulkCreateDialogOpen] = useState(false);
  const [excelUploadDialogOpen, setExcelUploadDialogOpen] = useState(false);

  // Form states
  const [unitForm, setUnitForm] = useState<Partial<ProjectUnitCreate>>({
    unit_number: '',
    unit_type: 'APARTAMENTO',
    status: 'AVAILABLE',
    sales_priority: 1,
    is_active: true,
  });

  useEffect(() => {
    if (projectId) {
      loadUnits();
      loadStats();
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

  const loadStats = async () => {
    try {
      const response = await projectUnits.getUnitsStats(Number(projectId));
      setStats(response.data);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const handleCreateUnit = async () => {
    try {
      await projectUnits.createUnit(Number(projectId), unitForm as ProjectUnitCreate);
      setUnitDialogOpen(false);
      setUnitForm({
        unit_number: '',
        unit_type: 'APARTAMENTO',
        status: 'AVAILABLE',
        sales_priority: 1,
        is_active: true,
      });
      loadUnits();
      loadStats();
    } catch (err) {
      setError('Error al crear la unidad');
      console.error('Error creating unit:', err);
    }
  };

  const handleUpdateUnit = async () => {
    if (!editingUnit) return;
    
    try {
      await projectUnits.updateUnit(
        Number(projectId),
        editingUnit.id,
        unitForm as ProjectUnitUpdate
      );
      setUnitDialogOpen(false);
      setEditingUnit(null);
      setUnitForm({
        unit_number: '',
        unit_type: 'APARTAMENTO',
        status: 'AVAILABLE',
        sales_priority: 1,
        is_active: true,
      });
      loadUnits();
      loadStats();
    } catch (err) {
      setError('Error al actualizar la unidad');
      console.error('Error updating unit:', err);
    }
  };

  const handleDeleteUnit = async (unitId: number) => {
    if (!confirm('¿Está seguro de eliminar esta unidad?')) return;
    
    try {
      await projectUnits.deleteUnit(Number(projectId), unitId);
      loadUnits();
      loadStats();
    } catch (err) {
      setError('Error al eliminar la unidad');
      console.error('Error deleting unit:', err);
    }
  };

  const openEditDialog = (unit: ProjectUnit) => {
    setEditingUnit(unit);
    setUnitForm({ ...unit });
    setUnitDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingUnit(null);
    setUnitForm({
      unit_number: '',
      unit_type: 'APARTAMENTO',
      status: 'AVAILABLE',
      sales_priority: 1,
      is_active: true,
    });
    setUnitDialogOpen(true);
  };

  const handleExcelUploadSuccess = () => {
    loadUnits();
    loadStats();
    setExcelUploadDialogOpen(false);
  };

  const getUnitTypeIcon = (type: string) => {
    switch (type) {
      case 'APARTAMENTO': return <HomeIcon />;
      case 'CASA': return <HomeIcon />;
      case 'LOTE': return <TerrainIcon />;
      case 'OFICINA': return <BusinessIcon />;
      case 'LOCAL': return <StoreIcon />;
      default: return <ViewModuleIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'success';
      case 'RESERVED': return 'warning';
      case 'SOLD': return 'info';
      case 'DELIVERED': return 'primary';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'Disponible';
      case 'RESERVED': return 'Reservada';
      case 'SOLD': return 'Vendida';
      case 'DELIVERED': return 'Entregada';
      case 'CANCELLED': return 'Cancelada';
      default: return status;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Cargando unidades...</Typography>
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

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Gestión de Unidades
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<ExcelIcon />}
            onClick={() => setExcelUploadDialogOpen(true)}
            color="success"
          >
            Carga Masiva Excel
          </Button>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setBulkCreateDialogOpen(true)}
          >
            Crear Múltiples
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreateDialog}
          >
            Nueva Unidad
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary">
                  {stats.total_units}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Unidades
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="success.main">
                  {stats.available_units}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Disponibles
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="warning.main">
                  {stats.reserved_units}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Reservadas
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="info.main">
                  {stats.sold_units}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Vendidas
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary.main">
                  {stats.delivered_units}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Entregadas
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Card>
              <CardContent>
                <Typography variant="h6">
                  {formatCurrency(stats.total_value)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Valor Total
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Vista de Unidades" icon={<ViewModuleIcon />} />
          <Tab label="Simulador de Ventas" icon={<TimelineIcon />} />
          <Tab label="Análisis" icon={<AssessmentIcon />} />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        {/* Units Grid */}
        <Grid container spacing={2}>
          {units.map((unit) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={unit.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                      {getUnitTypeIcon(unit.unit_type)}
                      <Typography variant="h6">
                        {unit.unit_number}
                      </Typography>
                    </Box>
                    <Chip
                      label={getStatusLabel(unit.status || 'AVAILABLE')}
                      color={getStatusColor(unit.status || 'AVAILABLE') as any}
                      size="small"
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {unit.unit_type}
                  </Typography>

                  {unit.total_area_m2 && (
                    <Typography variant="body2">
                      Área: {formatNumber(unit.total_area_m2)} m²
                    </Typography>
                  )}

                  {unit.bedrooms && (
                    <Typography variant="body2">
                      Habitaciones: {unit.bedrooms}
                    </Typography>
                  )}

                  {unit.target_price_total && (
                    <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 1 }}>
                      Precio: {formatCurrency(unit.target_price_total)}
                    </Typography>
                  )}

                  {unit.planned_sale_month && (
                    <Typography variant="body2" color="primary">
                      Venta planificada: Mes {unit.planned_sale_month}
                    </Typography>
                  )}

                  <Box display="flex" justifyContent="flex-end" mt={2}>
                    <IconButton
                      size="small"
                      onClick={() => openEditDialog(unit)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteUnit(unit.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <UnitSalesSimulator />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <UnitsAnalysisTab units={units} stats={stats} />
      </TabPanel>

      {/* Create/Edit Unit Dialog */}
      <Dialog
        open={unitDialogOpen}
        onClose={() => setUnitDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingUnit ? 'Editar Unidad' : 'Crear Nueva Unidad'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Número de Unidad"
                value={unitForm.unit_number || ''}
                onChange={(e) => setUnitForm({ ...unitForm, unit_number: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Unidad</InputLabel>
                <Select
                  value={unitForm.unit_type || 'APARTAMENTO'}
                  onChange={(e) => setUnitForm({ ...unitForm, unit_type: e.target.value as any })}
                  label="Tipo de Unidad"
                >
                  <MenuItem value="APARTAMENTO">Apartamento</MenuItem>
                  <MenuItem value="CASA">Casa</MenuItem>
                  <MenuItem value="LOTE">Lote</MenuItem>
                  <MenuItem value="OFICINA">Oficina</MenuItem>
                  <MenuItem value="LOCAL">Local</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Área de Construcción (m²)"
                type="number"
                value={unitForm.construction_area_m2 || ''}
                onChange={(e) => setUnitForm({ 
                  ...unitForm, 
                  construction_area_m2: e.target.value ? Number(e.target.value) : undefined 
                })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Área de Terreno (m²)"
                type="number"
                value={unitForm.land_area_m2 || ''}
                onChange={(e) => setUnitForm({ 
                  ...unitForm, 
                  land_area_m2: e.target.value ? Number(e.target.value) : undefined 
                })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Habitaciones"
                type="number"
                value={unitForm.bedrooms || ''}
                onChange={(e) => setUnitForm({ 
                  ...unitForm, 
                  bedrooms: e.target.value ? Number(e.target.value) : undefined 
                })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Baños"
                type="number"
                step="0.5"
                value={unitForm.bathrooms || ''}
                onChange={(e) => setUnitForm({ 
                  ...unitForm, 
                  bathrooms: e.target.value ? Number(e.target.value) : undefined 
                })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Estacionamientos"
                type="number"
                value={unitForm.parking_spaces || ''}
                onChange={(e) => setUnitForm({ 
                  ...unitForm, 
                  parking_spaces: e.target.value ? Number(e.target.value) : undefined 
                })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Precio Objetivo Total"
                type="number"
                value={unitForm.target_price_total || ''}
                onChange={(e) => setUnitForm({ 
                  ...unitForm, 
                  target_price_total: e.target.value ? Number(e.target.value) : undefined 
                })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Mes de Venta Planificada"
                type="number"
                inputProps={{ min: 1, max: 60 }}
                value={unitForm.planned_sale_month || ''}
                onChange={(e) => setUnitForm({ 
                  ...unitForm, 
                  planned_sale_month: e.target.value ? Number(e.target.value) : undefined 
                })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción"
                multiline
                rows={3}
                value={unitForm.description || ''}
                onChange={(e) => setUnitForm({ ...unitForm, description: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUnitDialogOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={editingUnit ? handleUpdateUnit : handleCreateUnit}
            variant="contained"
          >
            {editingUnit ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Create Modal */}
      <BulkUnitsCreateModal
        open={bulkCreateDialogOpen}
        onClose={() => setBulkCreateDialogOpen(false)}
        projectId={Number(projectId)}
        onSuccess={() => {
          loadUnits();
          loadStats();
        }}
      />

      {/* Excel Upload Modal */}
      <ExcelUploadModal
        open={excelUploadDialogOpen}
        onClose={() => setExcelUploadDialogOpen(false)}
        projectId={Number(projectId)}
        onUploadSuccess={handleExcelUploadSuccess}
      />

      {/* Floating Action Button for Bulk Create */}
      <Tooltip title="Crear Múltiples Unidades">
        <Fab
          color="secondary"
          aria-label="bulk-create"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => setBulkCreateDialogOpen(true)}
        >
          <AddIcon />
        </Fab>
      </Tooltip>
    </Box>
  );
};

export default ProjectUnitsManager; 