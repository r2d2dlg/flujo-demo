import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  Flex,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  CircularProgress,
  useToast,
  TableContainer,
  TableCaption,
  HStack
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { contabilidadApi } from '../../api/api';
import type { LedgerEntry } from '../../api/api'; // Changed from ProjectCashFlowItem

interface Project {
  id: string;
  name: string;
}

const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || typeof value === 'undefined' || isNaN(value)) return '-';
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '-';
  try {
    // Assuming dateString is YYYY-MM-DD from backend
    const date = new Date(dateString + 'T00:00:00'); // Ensure parsing as local date
    return date.toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' });
  } catch (e) {
    return dateString; // fallback
  }
};

// Helper to get YYYY-MM-DD string
const toYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const EntradasDiarioProyectoPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState<boolean>(true);
  const toast = useToast();

  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoadingProjects(true);
      try {
        const response = await contabilidadApi.getDistinctProjectNames();
        const projectNames = response.data;
        const formattedProjects = projectNames.map(name => ({ id: name, name: name }));
        setProjects(formattedProjects);
        if (formattedProjects.length > 0) {
          // setSelectedProject(formattedProjects[0].id); // User can select manually
        } else {
          setSelectedProject('');
        }
      } catch (error) {
        console.error('Error fetching project names:', error);
        toast({ title: "Error", description: "No se pudo cargar la lista de proyectos.", status: "error", duration: 5000, isClosable: true });
        setProjects([]);
        setSelectedProject('');
      } finally {
        setIsLoadingProjects(false);
      }
    };
    fetchProjects();
  }, [toast]);

  const fetchLedgerEntries = useCallback(async () => {
    if (!selectedProject) {
      setLedgerEntries([]);
      return;
    }
    setIsLoading(true);

    const today = new Date();
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0); // End of current month
    const startDate = new Date(today.getFullYear(), today.getMonth() - 2, 1); // Start of 2 months ago

    try {
      const response = await contabilidadApi.getLedgerEntries(
        selectedProject,
        toYYYYMMDD(startDate),
        toYYYYMMDD(endDate)
      );
      setLedgerEntries(response.data);
    } catch (error) {
      console.error(`Error fetching ledger entries for ${selectedProject}:`, error);
      toast({
        title: "Error",
        description: `No se pudieron cargar las entradas del diario para ${selectedProject}.`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setLedgerEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedProject, toast]);

  useEffect(() => {
    if (selectedProject) { // Fetch only if a project is selected
        fetchLedgerEntries();
    }
  }, [fetchLedgerEntries, selectedProject]); // Add selectedProject to dependency array

  const handleProjectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProject(event.target.value);
    if (!event.target.value) { // If placeholder is selected
        setLedgerEntries([]); // Clear entries
    }
  };

  return (
    <Box p={5}>
      <VStack spacing={6} align="stretch">
        <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
          <Heading as="h1" size="lg">
            Entradas de Diario por Proyecto
          </Heading>
          <HStack spacing={4}>
            <Select 
              value={selectedProject} 
              onChange={handleProjectChange}
              w="250px"
              placeholder="Seleccione un Proyecto"
              isDisabled={isLoadingProjects || projects.length === 0}
            >
              {isLoadingProjects ? (
                <option>Cargando proyectos...</option>
              ) : projects.length === 0 ? (
                <option>No hay proyectos disponibles</option>
              ) : (
                projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))
              )}
            </Select>
            <Button as={RouterLink} to="/dashboard-contabilidad" colorScheme="gray">
              Dashboard Contabilidad
            </Button>
          </HStack>
        </Flex>

        {isLoading ? (
          <Flex justify="center" align="center" h="200px">
            <CircularProgress isIndeterminate color="blue.300" />
            <Text ml={4}>Cargando entradas del diario...</Text>
          </Flex>
        ) : !selectedProject ? (
            <Text>Por favor, seleccione un proyecto para ver las entradas del diario.</Text>
        ) : ledgerEntries.length === 0 && !isLoading ? (
          <Text>No hay entradas de diario para mostrar para el proyecto y período seleccionados.</Text>
        ) : (
          <TableContainer>
            <Table variant="striped" size="sm">
              <TableCaption placement="top">Entradas de Diario para {selectedProject} (Últimos 3 meses)</TableCaption>
              <Thead>
                <Tr>
                  <Th>Fecha</Th>
                  <Th>Cuenta</Th>
                  <Th>Referencia</Th>
                  <Th>Descripción Trans.</Th>
                  <Th isNumeric>Débito</Th>
                  <Th isNumeric>Crédito</Th>
                  <Th isNumeric>Saldo</Th>
                </Tr>
              </Thead>
              <Tbody>
                {ledgerEntries.map((entry, index) => (
                  <Tr key={entry.id || index}>
                    <Td whiteSpace="nowrap">{formatDate(entry.entry_date)}</Td>
                    <Td>{entry.account_description || entry.account_id || 'N/A'}</Td>
                    <Td>{entry.reference || '-'}</Td>
                    <Td whiteSpace="normal" wordBreak="break-word">{entry.transaction_description || '-'}</Td>
                    <Td isNumeric whiteSpace="nowrap">{formatCurrency(entry.debit_amount)}</Td>
                    <Td isNumeric whiteSpace="nowrap">{formatCurrency(entry.credit_amount)}</Td>
                    <Td isNumeric whiteSpace="nowrap">{formatCurrency(entry.balance)}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        )}
      </VStack>
    </Box>
  );
};

export default EntradasDiarioProyectoPage; 