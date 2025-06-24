import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Alert,
  Divider,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { projectUnits } from '../api/api';
import type { ProjectUnitsBulkCreate } from '../types/projectUnitsTypes';

interface BulkUnitsCreateModalProps {
  open: boolean;
  onClose: () => void;
  projectId: number;
  onSuccess: () => void;
}

const BulkUnitsCreateModal: React.FC<BulkUnitsCreateModalProps> = ({
  open,
  onClose,
  projectId,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProjectUnitsBulkCreate>({
    quantity: 10,
    unit_number_prefix: 'A-',
    start_number: 101,
    number_padding: 3,
    unit_type: 'APARTAMENTO',
    sales_priority: 1,
  });

  const [useFloorDistribution, setUseFloorDistribution] = useState(false);
  const [floorsCount, setFloorsCount] = useState(5);
  const [unitsPerFloor, setUnitsPerFloor] = useState(2);

  const handleInputChange = (field: keyof ProjectUnitsBulkCreate) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: field === 'quantity' || field === 'start_number' || field === 'number_padding' || field === 'sales_priority'
        ? (value ? Number(value) : undefined)
        : value
    }));
  };

  const handleCreate = async () => {
    setLoading(true);
    setError(null);

    try {
      let finalFormData = { ...formData };

      // Si se usa distribución por pisos, calcular la cantidad total
      if (useFloorDistribution) {
        finalFormData.quantity = floorsCount * unitsPerFloor;
        finalFormData.units_per_floor = unitsPerFloor;
      }

      await projectUnits.createUnitsInBulk(projectId, finalFormData);
      onSuccess();
      onClose();
      // Reset form
      setFormData({
        quantity: 10,
        unit_number_prefix: 'A-',
        start_number: 101,
        number_padding: 3,
        unit_type: 'APARTAMENTO',
        sales_priority: 1,
      });
      setUseFloorDistribution(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al crear las unidades');
    } finally {
      setLoading(false);
    }
  };

  const generatePreview = () => {
    const quantity = useFloorDistribution ? floorsCount * unitsPerFloor : formData.quantity;
    const examples = [];
    const startNum = formData.start_number || 1;
    
    for (let i = 0; i < Math.min(quantity, 5); i++) {
      const unitNumber = formData.unit_number_prefix + 
        String(startNum + i).padStart(formData.number_padding || 3, '0');
      examples.push(unitNumber);
    }
    
    if (quantity > 5) {
      examples.push('...');
      const lastNumber = formData.unit_number_prefix + 
        String(startNum + quantity - 1).padStart(formData.number_padding || 3, '0');
      examples.push(lastNumber);
    }
    
    return examples.join(', ');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Crear Múltiples Unidades</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Configuración de numeración */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Configuración de Numeración
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Prefijo del Número"
              value={formData.unit_number_prefix}
              onChange={handleInputChange('unit_number_prefix')}
              placeholder="A-, Casa-, Apt-"
              helperText="Prefijo para los números de unidad"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Número Inicial"
              type="number"
              value={formData.start_number || ''}
              onChange={handleInputChange('start_number')}
              helperText="Número desde el cual comenzar"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Padding (Ceros)"
              type="number"
              value={formData.number_padding || ''}
              onChange={handleInputChange('number_padding')}
              inputProps={{ min: 1, max: 5 }}
              helperText="Cantidad de dígitos (ej: 3 = 001, 002)"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Tipo de Unidad</InputLabel>
              <Select
                value={formData.unit_type}
                onChange={handleInputChange('unit_type')}
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

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Configuración de cantidad */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Configuración de Cantidad
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={useFloorDistribution}
                  onChange={(e) => setUseFloorDistribution(e.target.checked)}
                />
              }
              label="Usar distribución por pisos"
            />
          </Grid>

          {useFloorDistribution ? (
            <>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Número de Pisos"
                  type="number"
                  value={floorsCount}
                  onChange={(e) => setFloorsCount(Number(e.target.value))}
                  inputProps={{ min: 1, max: 50 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Unidades por Piso"
                  type="number"
                  value={unitsPerFloor}
                  onChange={(e) => setUnitsPerFloor(Number(e.target.value))}
                  inputProps={{ min: 1, max: 20 }}
                />
              </Grid>
              <Grid item xs={12}>
                <Alert severity="info">
                  Total de unidades: {floorsCount * unitsPerFloor}
                </Alert>
              </Grid>
            </>
          ) : (
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Cantidad de Unidades"
                type="number"
                value={formData.quantity}
                onChange={handleInputChange('quantity')}
                inputProps={{ min: 1, max: 1000 }}
                helperText="Cantidad total de unidades a crear"
              />
            </Grid>
          )}

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Características comunes */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Características Comunes (Opcional)
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Área de Construcción (m²)"
              type="number"
              value={formData.construction_area_m2 || ''}
              onChange={handleInputChange('construction_area_m2')}
              helperText="Área común para todas las unidades"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Área de Terreno (m²)"
              type="number"
              value={formData.land_area_m2 || ''}
              onChange={handleInputChange('land_area_m2')}
              helperText="Solo para casas y lotes"
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Habitaciones"
              type="number"
              value={formData.bedrooms || ''}
              onChange={handleInputChange('bedrooms')}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Baños"
              type="number"
              step="0.5"
              value={formData.bathrooms || ''}
              onChange={handleInputChange('bathrooms')}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Estacionamientos"
              type="number"
              value={formData.parking_spaces || ''}
              onChange={handleInputChange('parking_spaces')}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Precio Objetivo Total"
              type="number"
              value={formData.target_price_total || ''}
              onChange={handleInputChange('target_price_total')}
              helperText="Precio común para todas las unidades"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Prioridad de Ventas"
              type="number"
              value={formData.sales_priority}
              onChange={handleInputChange('sales_priority')}
              inputProps={{ min: 1, max: 10 }}
              helperText="1 = Alta prioridad, 10 = Baja prioridad"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Descripción"
              multiline
              rows={3}
              value={formData.description || ''}
              onChange={handleInputChange('description')}
              helperText="Descripción común para todas las unidades"
            />
          </Grid>

          {/* Preview */}
          <Grid item xs={12}>
            <Divider />
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Vista Previa de Numeración
              </Typography>
              <Typography variant="body2" sx={{ 
                p: 2, 
                bgcolor: 'grey.100', 
                borderRadius: 1,
                fontFamily: 'monospace'
              }}>
                {generatePreview()}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleCreate}
          variant="contained"
          disabled={loading || !formData.quantity || !formData.unit_number_prefix}
        >
          {loading ? 'Creando...' : `Crear ${useFloorDistribution ? floorsCount * unitsPerFloor : formData.quantity} Unidades`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkUnitsCreateModal; 