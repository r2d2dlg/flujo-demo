import React, { useEffect, useState } from 'react';
import { Box, Heading, Tabs, TabList, TabPanels, Tab, TabPanel, VStack, Text, Table, Thead, Tbody, Tr, Th, Td, TableContainer, Spinner } from '@chakra-ui/react';
import { formatCurrency } from '../utils/formatters';
import { getInfraestructuraPagos, getViviendaPagos } from '../api/api';
import { api } from '../api/api';

// Dynamic period logic (3 months before, 36 after current month)
const getDynamicPeriods = () => {
  const now = new Date();
  const months: string[] = [];
  const start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  for (let i = 0; i < 39; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    months.push(`${d.getFullYear()}_${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  // Group by 12 months per tab
  const periods = [];
  for (let i = 0; i < months.length; i += 12) {
    periods.push(months.slice(i, i + 12));
  }
  return periods;
};
const dynamicPeriods = getDynamicPeriods();
const formatMonth = (monthKey: string) => {
  const [year, month] = monthKey.split('_');
  const monthNames = {
    '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril',
    '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto',
    '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre'
  };
  return `${monthNames[month]} ${year}`;
};

const FlujosCostosDirectosPage: React.FC = () => {
  const [infraPagos, setInfraPagos] = useState<any[]>([]);
  const [viviendaPagos, setViviendaPagos] = useState<any[]>([]);
  const [totals, setTotals] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [infraRes, viviendaRes, totalsRes] = await Promise.all([
          getInfraestructuraPagos(),
          getViviendaPagos(),
          api.get('/api/costo-directo/totales/'),
        ]);
        setInfraPagos(infraRes.data);
        setViviendaPagos(viviendaRes.data);
        setTotals(totalsRes.data);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Balances
  const totalMaterial = totals?.costo_total_materiales_infraestructura || 0;
  const totalManoObra = totals?.mano_de_obra_infraestructura || 0;
  const totalMaterialViviendas = totals?.costo_total_materiales_viviendas || 0;
  const totalManoObraVivienda = totals?.mano_de_obra_vivienda || 0;
  const pagosMaterial = infraPagos.filter(p => p.tipo === 'material').reduce((sum, p) => sum + p.monto, 0);
  const pagosManoObra = infraPagos.filter(p => p.tipo === 'mano_obra').reduce((sum, p) => sum + p.monto, 0);
  const pagosMaterialViviendas = viviendaPagos.filter(p => p.tipo === 'material').reduce((sum, p) => sum + p.monto, 0);
  const pagosManoObraVivienda = viviendaPagos.filter(p => p.tipo === 'mano_obra').reduce((sum, p) => sum + p.monto, 0);
  const balanceMaterial = totalMaterial - pagosMaterial;
  const balanceManoObra = totalManoObra - pagosManoObra;
  const balanceMaterialViviendas = totalMaterialViviendas - pagosMaterialViviendas;
  const balanceManoObraVivienda = totalManoObraVivienda - pagosManoObraVivienda;

  // Payments by month (39 months)
  const pagosByMonth = (arr: any[], tipo: 'material' | 'mano_obra') => {
    const monthsArr = Array(39).fill(0);
    arr.filter(p => p.tipo === tipo).forEach(p => {
      const idx = dynamicPeriods.flat().indexOf(`${p.ano}_${String(p.mes).padStart(2, '0')}`);
      if (idx >= 0) monthsArr[idx] += p.monto;
    });
    return monthsArr;
  };
  const pagosMaterialByMonth = pagosByMonth(infraPagos, 'material');
  const pagosManoObraByMonth = pagosByMonth(infraPagos, 'mano_obra');
  const pagosMaterialViviendasByMonth = pagosByMonth(viviendaPagos, 'material');
  const pagosManoObraViviendaByMonth = pagosByMonth(viviendaPagos, 'mano_obra');

  if (loading) return <Box p={4} display="flex" justifyContent="center"><Spinner size="xl" /></Box>;

  return (
    <Box p={5}>
      <Heading mb={6}>Flujo Costos Directos</Heading>
      <VStack align="flex-start" spacing={4} mb={6}>
        <Text fontWeight="bold">Material Infraestructura: <span style={{color:'#3182ce'}}>{formatCurrency(balanceMaterial)}</span></Text>
        <Text fontWeight="bold">Mano de Obra Infraestructura: <span style={{color:'#3182ce'}}>{formatCurrency(balanceManoObra)}</span></Text>
        <Text fontWeight="bold">Materiales Viviendas: <span style={{color:'#3182ce'}}>{formatCurrency(balanceMaterialViviendas)}</span></Text>
        <Text fontWeight="bold">Mano de Obra Vivienda: <span style={{color:'#3182ce'}}>{formatCurrency(balanceManoObraVivienda)}</span></Text>
      </VStack>
      <Tabs>
        <TabList>
          {dynamicPeriods.map((months, idx) => (
            <Tab key={idx}>Periodo {idx + 1}</Tab>
          ))}
        </TabList>
        <TabPanels>
          {dynamicPeriods.map((months, idx) => (
            <TabPanel key={idx}>
              <TableContainer>
                <Table size="sm" variant="simple">
                  <Thead>
                    <Tr>
                      <Th></Th>
                      {months.map(m => <Th key={m}>{formatMonth(m)}</Th>)}
                      <Th>Total Flujo Costos Directos</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    <Tr>
                      <Td>Material Infraestructura</Td>
                      {months.map((m, i) => <Td key={m} isNumeric>{pagosMaterialByMonth[dynamicPeriods.flat().indexOf(m)] ? formatCurrency(pagosMaterialByMonth[dynamicPeriods.flat().indexOf(m)]) : ''}</Td>)}
                      <Td isNumeric>{formatCurrency(pagosMaterial)}</Td>
                    </Tr>
                    <Tr>
                      <Td>Mano de Obra Infraestructura</Td>
                      {months.map((m, i) => <Td key={m} isNumeric>{pagosManoObraByMonth[dynamicPeriods.flat().indexOf(m)] ? formatCurrency(pagosManoObraByMonth[dynamicPeriods.flat().indexOf(m)]) : ''}</Td>)}
                      <Td isNumeric>{formatCurrency(pagosManoObra)}</Td>
                    </Tr>
                    <Tr>
                      <Td>Materiales Viviendas</Td>
                      {months.map((m, i) => <Td key={m} isNumeric>{pagosMaterialViviendasByMonth[dynamicPeriods.flat().indexOf(m)] ? formatCurrency(pagosMaterialViviendasByMonth[dynamicPeriods.flat().indexOf(m)]) : ''}</Td>)}
                      <Td isNumeric>{formatCurrency(pagosMaterialViviendas)}</Td>
                    </Tr>
                    <Tr>
                      <Td>Mano de Obra Vivienda</Td>
                      {months.map((m, i) => <Td key={m} isNumeric>{pagosManoObraViviendaByMonth[dynamicPeriods.flat().indexOf(m)] ? formatCurrency(pagosManoObraViviendaByMonth[dynamicPeriods.flat().indexOf(m)]) : ''}</Td>)}
                      <Td isNumeric>{formatCurrency(pagosManoObraVivienda)}</Td>
                    </Tr>
                    <Tr>
                      <Td fontWeight="bold">Total Flujo Costos Directos</Td>
                      {months.map((m, i) => {
                        const totalMonth =
                          (pagosMaterialByMonth[dynamicPeriods.flat().indexOf(m)] || 0) +
                          (pagosManoObraByMonth[dynamicPeriods.flat().indexOf(m)] || 0) +
                          (pagosMaterialViviendasByMonth[dynamicPeriods.flat().indexOf(m)] || 0) +
                          (pagosManoObraViviendaByMonth[dynamicPeriods.flat().indexOf(m)] || 0);
                        return <Td key={m} isNumeric fontWeight="bold">{totalMonth ? formatCurrency(totalMonth) : ''}</Td>;
                      })}
                      <Td isNumeric fontWeight="bold">{formatCurrency(
                        pagosMaterial + pagosManoObra + pagosMaterialViviendas + pagosManoObraVivienda
                      )}</Td>
                    </Tr>
                  </Tbody>
                </Table>
              </TableContainer>
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default FlujosCostosDirectosPage; 