import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Heading,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  VStack,
  Spinner,
  Text,
  Alert,
  AlertIcon,
  Button,
  Input,
  FormControl,
  FormLabel,
  useToast,
  HStack,
  Flex,
} from '@chakra-ui/react';
import { contabilidadApi, type LedgerEntry } from '../../api/api'; // Ensure type-only import for LedgerEntry

const PROJECTS = [
  { id: 'Villas del Este', name: 'Villas del Este' },
  // Add more projects here in the future
];

const CuentaProyectosPage: React.FC = () => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(PROJECTS[0].id);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof LedgerEntry | null; direction: 'ascending' | 'descending' }>({ key: 'entry_date', direction: 'descending' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const fetchEntries = async (projectId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await contabilidadApi.getLedgerEntries(projectId);
      const transformedData = response.data.map((item: any) => ({
        id: item.id,
        account_id: item.account_id,
        account_description: item.account_description,
        entry_date: item.entry_date,
        reference: item.reference,
        journal: item.journal,
        transaction_description: item.transaction_description,
        debit_amount: item.debit_amount,
        credit_amount: item.credit_amount,
        balance: item.balance,
        project_name: item.project_name
      }));
      setLedgerEntries(transformedData);
    } catch (err) {
      console.error('Error fetching ledger entries:', err);
      setError('Error al cargar los asientos contables. Por favor, inténtelo de nuevo.');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (selectedProjectId) {
      fetchEntries(selectedProjectId);
    } else {
      setLedgerEntries([]);
    }
  }, [selectedProjectId]);

  const sortedLedgerEntries = useMemo(() => {
    let sortableItems = [...ledgerEntries];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        // Ensure a[sortConfig.key] and b[sortConfig.key] are not null/undefined before accessing properties or methods
        const valA = a[sortConfig.key!];
        const valB = b[sortConfig.key!];

        // Handle null or undefined values by placing them at the end or beginning
        if (valA === null || valA === undefined) return sortConfig.direction === 'ascending' ? 1 : -1;
        if (valB === null || valB === undefined) return sortConfig.direction === 'ascending' ? -1 : 1;

        if (sortConfig.key === 'entry_date') {
          // Date comparison
          const dateA = new Date(valA as string).getTime();
          const dateB = new Date(valB as string).getTime();
          if (dateA < dateB) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if (dateA > dateB) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
          return 0;
        } else if (typeof valA === 'number' && typeof valB === 'number') {
          // Numeric comparison
          if (valA < valB) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if (valA > valB) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
          return 0;
        } else {
          // String comparison (case-insensitive)
          const strA = String(valA).toLowerCase();
          const strB = String(valB).toLowerCase();
          if (strA < strB) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if (strA > strB) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
          return 0;
        }
      });
    }
    return sortableItems;
  }, [ledgerEntries, sortConfig]);

  const requestSort = (key: keyof LedgerEntry) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select an Excel file to upload.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    if (!selectedProjectId) {
        toast({
            title: "No project selected",
            description: "Please select a project first.",
            status: "warning",
            duration: 5000,
            isClosable: true,
          });
          return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const response = await contabilidadApi.uploadAndReplaceLedger(selectedFile, selectedProjectId);
      toast({
        title: "Upload Successful",
        description: response.data.message || "Ledger data replaced successfully.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      setSelectedFile(null); // Clear the selected file
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Reset the file input
      }
      fetchEntries(selectedProjectId); // Refresh the table data
    } catch (err: any) {
      console.error('Error uploading ledger file:', err);
      const errorMessage = err.response?.data?.detail || 'Error al subir el archivo. Por favor, inténtelo de nuevo.';
      setError(errorMessage);
      toast({
        title: "Upload Failed",
        description: errorMessage,
        status: "error",
        duration: 9000,
        isClosable: true,
      });
    }
    setIsUploading(false);
  };

  return (
    <Box p={5}>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading as="h2" size="lg">Libro Mayor por Proyecto</Heading>
        <Button as={RouterLink} to="/dashboard-contabilidad" colorScheme="teal">
          Dashboard Contabilidad
        </Button>
      </Flex>

      <HStack spacing={4} mb={4} align="flex-start">
        <FormControl id="project-select" maxWidth="300px">
          <FormLabel htmlFor='project-select'>Seleccionar Proyecto</FormLabel>
          <Select 
            id='project-select'
            value={selectedProjectId} 
            onChange={(e) => setSelectedProjectId(e.target.value)}
            placeholder="Seleccione un proyecto"
          >
            {PROJECTS.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </Select>
        </FormControl>
      </HStack>

      <Box borderWidth="1px" borderRadius="lg" p={4} mt={4}>
          <Heading as="h2" size="md" mb={3}>
              Reemplazar Libro Mayor del Proyecto
          </Heading>
          <Text fontSize="sm" mb={3}>Seleccione un archivo Excel (.xlsx o .xls) para reemplazar el libro mayor del proyecto actual. Los datos actuales se archivarán antes del reemplazo.</Text>
          <HStack spacing={4}>
              <FormControl flexGrow={1}>
                  <FormLabel htmlFor='ledger-file-upload' srOnly>Seleccionar archivo Excel</FormLabel>
                  <Input 
                      type="file" 
                      id='ledger-file-upload'
                      accept=".xlsx, .xls"
                      onChange={handleFileChange}
                      ref={fileInputRef}
                      p={1.5} // Adjust padding for better appearance
                      borderWidth="1px"
                      borderRadius="md"
                  />
              </FormControl>
              <Button 
                  colorScheme="blue" 
                  onClick={handleUpload} 
                  isLoading={isUploading}
                  loadingText="Subiendo..."
              >
                  Subir y Reemplazar
              </Button>
          </HStack>
      </Box>

      {isLoading && (
        <VStack justifyContent="center" alignItems="center" height="200px">
          <Spinner size="xl" />
          <Text mt={2}>Cargando datos del proyecto...</Text>
        </VStack>
      )}

      {error && (
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      )}

      {!isLoading && !error && ledgerEntries.length > 0 && (
        <TableContainer>
          <Table variant="striped" colorScheme="gray" size="sm">
            <Thead>
              <Tr>
                <Th width="10%" onClick={() => requestSort('entry_date')} cursor="pointer">
                  Fecha {sortConfig.key === 'entry_date' ? (sortConfig.direction === 'ascending' ? '🔼' : '🔽') : ''}
                </Th>
                <Th width="15%" onClick={() => requestSort('reference')} cursor="pointer">
                  Referencia {sortConfig.key === 'reference' ? (sortConfig.direction === 'ascending' ? '🔼' : '🔽') : ''}
                </Th>
                <Th width="35%" onClick={() => requestSort('transaction_description')} cursor="pointer">
                  Descripción {sortConfig.key === 'transaction_description' ? (sortConfig.direction === 'ascending' ? '🔼' : '🔽') : ''}
                </Th>
                <Th width="15%" isNumeric onClick={() => requestSort('debit_amount')} cursor="pointer">
                  Débito {sortConfig.key === 'debit_amount' ? (sortConfig.direction === 'ascending' ? '🔼' : '🔽') : ''}
                </Th>
                <Th width="15%" isNumeric onClick={() => requestSort('credit_amount')} cursor="pointer">
                  Crédito {sortConfig.key === 'credit_amount' ? (sortConfig.direction === 'ascending' ? '🔼' : '🔽') : ''}
                </Th>
                <Th width="10%" isNumeric onClick={() => requestSort('balance')} cursor="pointer">
                  Saldo {sortConfig.key === 'balance' ? (sortConfig.direction === 'ascending' ? '🔼' : '🔽') : ''}
                </Th>
                {/* <Th>Acciones</Th> Will be added in Phase 2 */}
              </Tr>
            </Thead>
            <Tbody>
              {sortedLedgerEntries.map((entry, index) => (
                <Tr key={entry.id !== undefined ? entry.id : index}>
                  <Td width="10%">{entry.entry_date}</Td>
                  <Td width="15%">{entry.reference}</Td>
                  <Td width="35%" whiteSpace="normal" wordBreak="break-word">{entry.transaction_description}</Td>
                  <Td width="15%" isNumeric>{entry.debit_amount?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</Td>
                  <Td width="15%" isNumeric>{entry.credit_amount?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</Td>
                  <Td width="10%" isNumeric>{entry.balance?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      )}
      {!isLoading && !error && ledgerEntries.length === 0 && selectedProjectId && (
          <Text>No hay asientos contables para el proyecto seleccionado.</Text>
      )}
    </Box>
  );
};

export default CuentaProyectosPage; 