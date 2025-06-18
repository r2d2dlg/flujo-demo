import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Text,
  Badge,
  VStack,
  HStack,
  Divider,
  Box
} from '@chakra-ui/react';
import { LineaCredito } from '../types/lineasDeCredito';
import { calcularLinea, formatCurrency } from '../utils/lineaCreditoCalculations';

interface CalendarioPagosModalProps {
  isOpen: boolean;
  onClose: () => void;
  linea: LineaCredito;
}

const CalendarioPagosModal: React.FC<CalendarioPagosModalProps> = ({
  isOpen,
  onClose,
  linea
}) => {
  const resultados = calcularLinea(linea);
  
  if (!resultados.calendario_pagos || resultados.calendario_pagos.length === 0) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Calendario de Pagos - {linea.nombre}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>Este tipo de línea no genera un calendario de pagos fijo.</Text>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>Cerrar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }

  const totalIntereses = resultados.calendario_pagos.reduce((sum, cuota) => sum + cuota.interes, 0);
  const totalCapital = resultados.calendario_pagos.reduce((sum, cuota) => sum + cuota.capital, 0);
  const totalPagos = totalIntereses + totalCapital;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl">
      <ModalOverlay />
      <ModalContent maxW="90vw">
        <ModalHeader>
          <VStack align="start" spacing={2}>
            <Text fontSize="lg">Calendario de Pagos - {linea.nombre}</Text>
            <HStack spacing={4}>
              <Badge colorScheme="blue">
                Cuota: {formatCurrency(resultados.cuota_mensual || 0, linea.moneda || 'USD')}
              </Badge>
              <Badge colorScheme="green">
                Plazo: {linea.plazo_meses} meses
              </Badge>
              <Badge colorScheme="purple">
                Tasa: {linea.interest_rate}% anual
              </Badge>
            </HStack>
          </VStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {/* Resumen financiero */}
            <Box p={4} bg="gray.50" borderRadius="md">
              <HStack justify="space-between">
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" color="gray.600">Total Capital</Text>
                  <Text fontWeight="bold" color="blue.600">
                    {formatCurrency(totalCapital, linea.moneda || 'USD')}
                  </Text>
                </VStack>
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" color="gray.600">Total Intereses</Text>
                  <Text fontWeight="bold" color="orange.600">
                    {formatCurrency(totalIntereses, linea.moneda || 'USD')}
                  </Text>
                </VStack>
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" color="gray.600">Total a Pagar</Text>
                  <Text fontWeight="bold" color="green.600">
                    {formatCurrency(totalPagos, linea.moneda || 'USD')}
                  </Text>
                </VStack>
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" color="gray.600">Ahorro en Intereses</Text>
                  <Text fontWeight="bold" color="red.600">
                    {((totalIntereses / totalCapital) * 100).toFixed(2)}%
                  </Text>
                </VStack>
              </HStack>
            </Box>

            <Divider />

            {/* Tabla de amortización */}
            <TableContainer maxHeight="400px" overflowY="auto">
              <Table variant="striped" colorScheme="gray" size="sm">
                <Thead position="sticky" top={0} bg="white" zIndex={1}>
                  <Tr>
                    <Th>Cuota #</Th>
                    <Th>Fecha</Th>
                    <Th isNumeric>Saldo Inicial</Th>
                    <Th isNumeric>Interés</Th>
                    <Th isNumeric>Capital</Th>
                    <Th isNumeric>Cuota Total</Th>
                    <Th isNumeric>Saldo Final</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {resultados.calendario_pagos.map((cuota, index) => (
                    <Tr key={index}>
                      <Td fontWeight="medium">{cuota.numero}</Td>
                      <Td>{cuota.fecha.toLocaleDateString('es-ES')}</Td>
                      <Td isNumeric fontSize="sm">
                        {formatCurrency(cuota.saldo_inicial, linea.moneda || 'USD')}
                      </Td>
                      <Td isNumeric fontSize="sm" color="orange.600">
                        {formatCurrency(cuota.interes, linea.moneda || 'USD')}
                      </Td>
                      <Td isNumeric fontSize="sm" color="blue.600">
                        {formatCurrency(cuota.capital, linea.moneda || 'USD')}
                      </Td>
                      <Td isNumeric fontSize="sm" fontWeight="bold">
                        {formatCurrency(cuota.cuota_total, linea.moneda || 'USD')}
                      </Td>
                      <Td isNumeric fontSize="sm">
                        {formatCurrency(cuota.saldo_final, linea.moneda || 'USD')}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={onClose}>
            Cerrar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CalendarioPagosModal; 