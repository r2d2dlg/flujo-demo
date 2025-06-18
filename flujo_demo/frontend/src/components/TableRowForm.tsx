import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Textarea,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';

interface TableRowFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, any>) => void;
  columns: string[];
  initialData?: Record<string, any> | null;
}

export default function TableRowForm({
  isOpen,
  onClose,
  onSubmit,
  columns,
  initialData,
}: TableRowFormProps) {
  const { register, handleSubmit, reset } = useForm({
    defaultValues: initialData || {},
  });

  const handleFormSubmit = (data: Record<string, any>) => {
    onSubmit(data);
    reset();
  };

  const handleClose = () => {
    onClose();
    reset();
  };

  const renderInput = (column: string) => {
    // You can add more sophisticated type detection based on your needs
    const value = initialData?.[column] || '';
    const isNumber = typeof value === 'number' || /^(amount|price|quantity|total|amount)$/i.test(column);
    
    if (isNumber) {
      return (
        <NumberInput defaultValue={value} min={0}>
          <NumberInputField {...register(column)} />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
      );
    }

    if (typeof value === 'string' && value.length > 100) {
      return <Textarea {...register(column)} defaultValue={value} />;
    }

    // Simple text input by default
    return <Input {...register(column)} defaultValue={value} />;
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <ModalOverlay />
      <ModalContent as="form" onSubmit={handleSubmit(handleFormSubmit)}>
        <ModalHeader>
          {initialData ? 'Editar Fila' : 'Agregar Nueva Fila'}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            {columns.map((column) => (
              <FormControl key={column} isRequired={column === 'actividad'}>
                <FormLabel>{column.replace(/_/g, ' ')}</FormLabel>
                {renderInput(column)}
              </FormControl>
            ))}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" mr={3} onClick={handleClose}>
            Cancelar
          </Button>
          <Button colorScheme="blue" type="submit">
            {initialData ? 'Actualizar' : 'Guardar'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
