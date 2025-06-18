import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  useToast,
  IconButton,
  HStack,
  VStack,
  Text,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  Input,
  NumberInput,
  NumberInputField,
  Center,
  Spinner
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import { consultoresApi } from '../../api/api';
import { NombresConsultores, CostoConsultores, CostoConsultoresCreate } from '../../types/consultoresTypes';
import { format } from 'date-fns';

export default function ConsultoresTablePage() {
  const [nombresConsultores, setNombresConsultores] = useState<NombresConsultores[]>([]);
  const [costoConsultores, setCostoConsultores] = useState<CostoConsultores[]>([]);
  const [loading, setLoading] = useState(true);
  const [newConsultor, setNewConsultor] = useState('');
  const [newCosto, setNewCosto] = useState<CostoConsultoresCreate>({
    consultor: '',
    fecha: format(new Date(), 'yyyy-MM-dd'),
    costo: 0
  });
  const toast = useToast();
  const {
    isOpen: isAddConsultorOpen,
    onOpen: onAddConsultorOpen,
    onClose: onAddConsultorClose
  } = useDisclosure();
  const {
    isOpen: isAddCostoOpen,
    onOpen: onAddCostoOpen,
    onClose: onAddCostoClose
  } = useDisclosure();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [nombresRes, costosRes] = await Promise.all([
        consultoresApi.getNombresConsultores(),
        consultoresApi.getCostoConsultores()
      ]);
      setNombresConsultores(nombresRes.data);
      setCostoConsultores(costosRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error fetching data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddConsultor = async () => {
    try {
      await consultoresApi.createNombreConsultor({ nombre: newConsultor });
      toast({
        title: 'Consultor added successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onAddConsultorClose();
      setNewConsultor('');
      fetchData();
    } catch (error) {
      console.error('Error adding consultor:', error);
      toast({
        title: 'Error adding consultor',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteConsultor = async (nombre: string) => {
    try {
      await consultoresApi.deleteNombreConsultor(nombre);
      toast({
        title: 'Consultor deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchData();
    } catch (error) {
      console.error('Error deleting consultor:', error);
      toast({
        title: 'Error deleting consultor',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleAddCosto = async () => {
    try {
      await consultoresApi.createCostoConsultor(newCosto);
      toast({
        title: 'Cost added successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onAddCostoClose();
      setNewCosto({
        consultor: '',
        fecha: format(new Date(), 'yyyy-MM-dd'),
        costo: 0
      });
      fetchData();
    } catch (error) {
      console.error('Error adding cost:', error);
      toast({
        title: 'Error adding cost',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <Box p={4}>
      <VStack spacing={6} align="stretch">
        {/* Nombres Consultores Table */}
        <Box>
          <HStack justify="space-between" mb={4}>
            <Heading size="lg">Consultores</Heading>
            <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={onAddConsultorOpen}>
              Add Consultor
            </Button>
          </HStack>
          <TableContainer>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Nombre</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {nombresConsultores.map((consultor) => (
                  <Tr key={consultor.nombre}>
                    <Td>{consultor.nombre}</Td>
                    <Td>
                      <IconButton
                        aria-label="Delete consultor"
                        icon={<DeleteIcon />}
                        colorScheme="red"
                        onClick={() => handleDeleteConsultor(consultor.nombre)}
                      />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>

        {/* Costo Consultores Table */}
        <Box>
          <HStack justify="space-between" mb={4}>
            <Heading size="lg">Costos</Heading>
            <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={onAddCostoOpen}>
              Add Cost
            </Button>
          </HStack>
          <TableContainer>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Consultor</Th>
                  <Th>Fecha</Th>
                  <Th>Costo</Th>
                </Tr>
              </Thead>
              <Tbody>
                {costoConsultores.map((costo) => (
                  <Tr key={`${costo.consultor}-${costo.fecha}`}>
                    <Td>{costo.consultor}</Td>
                    <Td>{format(new Date(costo.fecha), 'yyyy-MM-dd')}</Td>
                    <Td>{costo.costo}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>
      </VStack>

      {/* Add Consultor Modal */}
      <Modal isOpen={isAddConsultorOpen} onClose={onAddConsultorClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add New Consultor</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Nombre</FormLabel>
              <Input
                value={newConsultor}
                onChange={(e) => setNewConsultor(e.target.value)}
                placeholder="Enter consultor name"
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleAddConsultor}>
              Add
            </Button>
            <Button variant="ghost" onClick={onAddConsultorClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Add Cost Modal */}
      <Modal isOpen={isAddCostoOpen} onClose={onAddCostoClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add New Cost</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Consultor</FormLabel>
                <Input
                  value={newCosto.consultor}
                  onChange={(e) => setNewCosto({ ...newCosto, consultor: e.target.value })}
                  placeholder="Select consultor"
                  list="consultores"
                />
                <datalist id="consultores">
                  {nombresConsultores.map((consultor) => (
                    <option key={consultor.nombre} value={consultor.nombre} />
                  ))}
                </datalist>
              </FormControl>
              <FormControl>
                <FormLabel>Fecha</FormLabel>
                <Input
                  type="date"
                  value={newCosto.fecha}
                  onChange={(e) => setNewCosto({ ...newCosto, fecha: e.target.value })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Costo</FormLabel>
                <NumberInput min={0}>
                  <NumberInputField
                    value={newCosto.costo}
                    onChange={(e) => setNewCosto({ ...newCosto, costo: parseFloat(e.target.value) || 0 })}
                  />
                </NumberInput>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleAddCosto}>
              Add
            </Button>
            <Button variant="ghost" onClick={onAddCostoClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
} 