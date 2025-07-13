import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Input,
  Grid,
  FormControl,
  FormLabel,
  FormHelperText,
  Select,
  Text,
  Box,
  Alert,
  AlertIcon,
  Divider,
  Switch,
  VStack,
} from '@chakra-ui/react';
import { projectUnits } from '../api/api';
import type { ProjectUnitsBulkCreate } from '../types/projectUnitsTypes';

interface BulkUnitsCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  onSuccess: () => void;
}

const BulkUnitsCreateModal: React.FC<BulkUnitsCreateModalProps> = ({
  isOpen,
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
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: ['quantity', 'start_number', 'number_padding', 'sales_priority'].includes(field)
        ? (value ? Number(value) : undefined)
        : value,
    }));
  };

  const handleCreate = async () => {
    setLoading(true);
    setError(null);

    try {
      let finalFormData = { ...formData };
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
    
    for (let i = 0; i < Math.min(quantity || 0, 5); i++) {
      const unitNumber = (formData.unit_number_prefix || '') + 
        String(startNum + i).padStart(formData.number_padding || 3, '0');
      examples.push(unitNumber);
    }
    
    if ((quantity || 0) > 5) {
      examples.push('...');
      const lastNumber = (formData.unit_number_prefix || '') + 
        String(startNum + (quantity || 0) - 1).padStart(formData.number_padding || 3, '0');
      examples.push(lastNumber);
    }
    
    return examples.join(', ');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Crear Múltiples Unidades</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {error && (
            <Alert status="error" mb={4}>
              <AlertIcon />
              {error}
            </Alert>
          )}

          <VStack spacing={6} align="stretch">
            <Box>
              <Text fontSize="lg" fontWeight="semibold">Configuración de Numeración</Text>
              <Grid templateColumns="repeat(2, 1fr)" gap={4} mt={2}>
                <FormControl>
                  <FormLabel>Prefijo del Número</FormLabel>
                  <Input
                    value={formData.unit_number_prefix}
                    onChange={handleInputChange('unit_number_prefix')}
                    placeholder="A-, Casa-, Apt-"
                  />
                  <FormHelperText>Prefijo para los números de unidad.</FormHelperText>
                </FormControl>
                <FormControl>
                  <FormLabel>Número Inicial</FormLabel>
                  <Input
                    type="number"
                    value={formData.start_number || ''}
                    onChange={handleInputChange('start_number')}
                  />
                  <FormHelperText>Número desde el cual comenzar.</FormHelperText>
                </FormControl>
                <FormControl>
                  <FormLabel>Padding (Ceros)</FormLabel>
                  <Input
                    type="number"
                    value={formData.number_padding || ''}
                    onChange={handleInputChange('number_padding')}
                  />
                  <FormHelperText>Cantidad de dígitos (ej: 3 = 001).</FormHelperText>
                </FormControl>
                <FormControl>
                  <FormLabel>Tipo de Unidad</FormLabel>
                  <Select
                    value={formData.unit_type}
                    onChange={handleInputChange('unit_type')}
                  >
                    <option value="APARTAMENTO">Apartamento</option>
                    <option value="CASA">Casa</option>
                    <option value="LOTE">Lote</option>
                    <option value="OFICINA">Oficina</option>
                    <option value="LOCAL">Local</option>
                  </Select>
                </FormControl>
              </Grid>
            </Box>

            <Divider />

            <Box>
              <Text fontSize="lg" fontWeight="semibold">Configuración de Cantidad</Text>
              <FormControl display="flex" alignItems="center" my={4}>
                <FormLabel htmlFor="distribution-switch" mb="0">
                  Usar distribución por pisos
                </FormLabel>
                <Switch
                  id="distribution-switch"
                  isChecked={useFloorDistribution}
                  onChange={(e) => setUseFloorDistribution(e.target.checked)}
                />
              </FormControl>

              {useFloorDistribution ? (
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <FormControl>
                    <FormLabel>Cantidad de Pisos</FormLabel>
                    <Input
                      type="number"
                      value={floorsCount}
                      onChange={(e) => setFloorsCount(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Unidades por Piso</FormLabel>
                    <Input
                      type="number"
                      value={unitsPerFloor}
                      onChange={(e) => setUnitsPerFloor(Number(e.target.value))}
                    />
                  </FormControl>
                </Grid>
              ) : (
                <FormControl>
                  <FormLabel>Cantidad de Unidades a Crear</FormLabel>
                  <Input
                    type="number"
                    value={formData.quantity || ''}
                    onChange={handleInputChange('quantity')}
                  />
                </FormControl>
              )}
            </Box>

            <Divider />

            <Box>
              <Text fontSize="lg" fontWeight="semibold">Vista Previa</Text>
              <Text color="gray.500" p={2} bg="gray.100" borderRadius="md" mt={2}>
                Se crearán {useFloorDistribution ? floorsCount * unitsPerFloor : formData.quantity || 0} unidades: {generatePreview()}
              </Text>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancelar
          </Button>
          <Button colorScheme="blue" onClick={handleCreate} isLoading={loading}>
            Crear Unidades
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default BulkUnitsCreateModal; 