import React, { useEffect, useState } from 'react';
import { Box, Heading, Spinner, Alert, AlertIcon, Tabs, TabList, TabPanels, Tab, TabPanel, Table, Thead, Tbody, Tr, Th, Td, TableContainer, VStack } from '@chakra-ui/react';
import apiClient, { tables } from '../api/api';

interface ProjectCashFlowItem {
  category: string;
  months: Record<string, number>;
}

interface ProjectData {
  name: string;
  displayName: string;
  data: ProjectCashFlowItem[];
  loading: boolean;
  error: string | null;
}

function getDynamicMonthPeriods() {
  const now = new Date();
  now.setDate(1);
  const start = new Date(now);
  start.setMonth(start.getMonth() - 3);
  const end = new Date(now);
  end.setMonth(end.getMonth() + 36);
  const months: { key: string; label: string; year: number }[] = [];
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  let d = new Date(start);
  while (d <= end) {
    const year = d.getFullYear();
    const month = d.getMonth();
    const key = `${year}-${(month + 1).toString().padStart(2, '0')}`;
    const label = `${monthNames[month]} ${year}`;
    months.push({ key, label, year });
    d.setMonth(d.getMonth() + 1);
  }
  const periods: { label: string; months: typeof months }[] = [];
  for (let i = 0; i < months.length; i += 12) {
    const periodMonths = months.slice(i, i + 12);
    if (periodMonths.length > 0) {
      const label = `${periodMonths[0].label.split(' ')[1]}-${periodMonths[periodMonths.length - 1].label.split(' ')[1]}`;
      periods.push({ label, months: periodMonths });
    }
  }
  return periods;
}

const CashFlowsMercadeoPage: React.FC = () => {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [errorProjects, setErrorProjects] = useState<string | null>(null);
  const periods = getDynamicMonthPeriods();

  useEffect(() => {
    async function fetchProjectsAndData() {
      setLoadingProjects(true);
      setErrorProjects(null);
      try {
        // Use the same logic as DashboardMercadeo to get marketing projects
        const resp = await tables.listAllMarketingProjectTables();
        const tableList: string[] = resp.data.tables || [];
        const projectMap = new Map<string, string>();
        tableList.forEach((tableName: string) => {
          if (typeof tableName !== 'string' || tableName.trim() === '') return;
          const tableLower = tableName.toLowerCase().trim();
          let remainderString = '';
          let projectKeyword = '';
          if (tableLower.startsWith('presupuesto_mercadeo_')) {
            remainderString = tableLower.substring('presupuesto_mercadeo_'.length);
          } else if (tableLower.startsWith('proyecto_')) {
            remainderString = tableLower.substring('proyecto_'.length);
          } else {
            return;
          }
          if (!remainderString) return;
          const parts = remainderString.split('_');
          if (parts.length > 0 && parts[0]) {
            projectKeyword = parts[0];
          } else {
            return;
          }
          const projectId = projectKeyword;
          const displayName = projectKeyword
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          if (!projectMap.has(projectId)) {
            projectMap.set(projectId, displayName);
          }
        });
        const projectIds = Array.from(projectMap.entries());
        const projectData: ProjectData[] = await Promise.all(
          projectIds.map(async ([name, displayName]) => {
            try {
              const res = await apiClient.contabilidadApi.getProjectCashFlow(name);
              return { name, displayName, data: res.data, loading: false, error: null };
            } catch (err) {
              return { name, displayName, data: [], loading: false, error: 'Error al cargar flujo de caja' };
            }
          })
        );
        setProjects(projectData);
      } catch (err) {
        setErrorProjects('No se pudieron cargar los proyectos de marketing');
      } finally {
        setLoadingProjects(false);
      }
    }
    fetchProjectsAndData();
  }, []);

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || typeof value === 'undefined') return '-';
    return value.toLocaleString('es-ES', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <Box p={5}>
      <Heading mb={8}>Flujo de Caja Marketing (Todos los Proyectos)</Heading>
      {loadingProjects && <Spinner size="xl" />}
      {errorProjects && <Alert status="error" mb={4}><AlertIcon />{errorProjects}</Alert>}
      <VStack spacing={10} align="stretch">
        {projects.map((project) => (
          <Box key={project.name} borderWidth={1} borderRadius="md" p={4} boxShadow="md" bg="white">
            <Heading size="md" mb={4}>{project.displayName}</Heading>
            {project.loading && <Spinner size="md" />}
            {project.error && <Alert status="error" mb={4}><AlertIcon />{project.error}</Alert>}
            {!project.loading && !project.error && project.data.length > 0 && (
              <Tabs variant="enclosed" colorScheme="blue" isFitted>
                <TabList>
                  {periods.map((period) => (
                    <Tab key={period.label}>{period.label}</Tab>
                  ))}
                </TabList>
                <TabPanels>
                  {periods.map((period) => (
                    <TabPanel key={period.label} p={0}>
                      <Box overflowX="auto">
                        <TableContainer>
                          <Table variant="simple" size="sm">
                            <Thead>
                              <Tr>
                                <Th>Categoría</Th>
                                {period.months.map(month => <Th key={month.key} isNumeric>{month.label}</Th>)}
                              </Tr>
                            </Thead>
                            <Tbody>
                              {project.data.map((item, idx) => (
                                <Tr key={item.category + idx}>
                                  <Td>{item.category}</Td>
                                  {period.months.map(month => (
                                    <Td key={month.key} isNumeric>{formatCurrency(item.months[month.key])}</Td>
                                  ))}
                                </Tr>
                              ))}
                            </Tbody>
                          </Table>
                        </TableContainer>
                      </Box>
                    </TabPanel>
                  ))}
                </TabPanels>
              </Tabs>
            )}
            {!project.loading && !project.error && project.data.length === 0 && (
              <Alert status="info" mb={4}><AlertIcon />No hay datos de flujo de caja para este proyecto.</Alert>
            )}
          </Box>
        ))}
      </VStack>
    </Box>
  );
};

export default CashFlowsMercadeoPage; 