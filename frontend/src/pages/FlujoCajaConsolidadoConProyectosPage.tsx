import React, { useEffect, useState, useMemo } from 'react';
import { Box, Heading, Text, Table, Thead, Tbody, Tr, Th, Td, TableContainer, Spinner, Tabs, TabList, TabPanels, Tab, TabPanel, HStack, useToast } from '@chakra-ui/react';
import { api, getInfraestructuraPagos, getViviendaPagos, marketingSummaryApi, proyeccionVentas, lineasCreditoApi } from '../api/api';
import apiClient from '../api/api';

interface ScenarioProjectsData {
  consolidated_cash_flow: {
    total_ingresos_by_month: number[];
    total_egresos_by_month: number[];
  };
}

// Helper to generate dynamic periods: 3 months before + current + 36 months forward, grouped by 12
function generateDynamicPeriods() {
  const MONTHS_ES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const now = new Date();
  const months: string[] = [];
  // Previous 3 months
  for (let i = 3; i > 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${date.getFullYear()}_${String(date.getMonth() + 1).padStart(2, '0')}`);
  }
  // Current + next 36 months
  for (let i = 0; i < 37; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    months.push(`${date.getFullYear()}_${String(date.getMonth() + 1).padStart(2, '0')}`);
  }
  // Group by 12
  const periods = [];
  for (let i = 0; i < months.length; i += 12) {
    periods.push({
      label: `${formatMonth(months[i])} - ${formatMonth(months[Math.min(i+11, months.length-1)])}`,
      months: months.slice(i, i+12)
    });
  }
  return periods;
}

const formatMonth = (monthKey: string) => {
  const [year, month] = monthKey.split('_');
  const monthNames: { [key: string]: string } = {
    '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril',
    '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto',
    '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre'
  };
  return `${monthNames[month]} ${year}`;
};

const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return '$ 0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const ROW_LABELS = [
  { key: 'pagos_tierra', label: 'Pagos a Terreno' },
  { key: 'estudios_permisos', label: 'Estudios, Diseños y Permisos' }
];

const FlujoCajaConsolidadoConProyectosPage: React.FC = () => {
  const [pagosTierra, setPagosTierra] = useState<any[]>([]);
  const [estudiosPermisos, setEstudiosPermisos] = useState<any[]>([]);
  const [infraPagos, setInfraPagos] = useState<any[]>([]);
  const [viviendaPagos, setViviendaPagos] = useState<any[]>([]);
  const [planillasVariables, setPlanillasVariables] = useState<any[]>([]);
  const [planillasAdmin, setPlanillasAdmin] = useState<any[]>([]);
  const [totals, setTotals] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const [marketingTotalsByMonth, setMarketingTotalsByMonth] = useState<number[]>([]);
  const [marketingTotal, setMarketingTotal] = useState<number>(0);
  const [commissionTotalsByMonth, setCommissionTotalsByMonth] = useState<number[]>([]);
  const [commissionTotal, setCommissionTotal] = useState<number>(0);
  const [serviciosProfesionalesByMonth, setServiciosProfesionalesByMonth] = useState<number[]>([]);
  const [serviciosProfesionalesTotal, setServiciosProfesionalesTotal] = useState<number>(0);
  const [interesesBancariosByMonth, setInteresesBancariosByMonth] = useState<number[]>([]);
  const [interesesBancariosTotal, setInteresesBancariosTotal] = useState<number>(0);
  const [cargosBancariosByMonth, setCargosBancariosByMonth] = useState<number[]>([]);
  const [cargosBancariosTotal, setCargosBancariosTotal] = useState<number>(0);
  const [ingresosCreditLines, setIngresosCreditLines] = useState<any[]>([]);
  const [ingresosTotalsByMonth, setIngresosTotalsByMonth] = useState<number[]>([]);
  const [ingresosTotal, setIngresosTotal] = useState<number>(0);
  const [ingresosPorVentasByMonth, setIngresosPorVentasByMonth] = useState<number[]>([]);
  const [ingresosPorVentasTotal, setIngresosPorVentasTotal] = useState<number>(0);
  const [scenarioProjectsData, setScenarioProjectsData] = useState<ScenarioProjectsData | null>(null);

  const periods = useMemo(() => generateDynamicPeriods(), []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [
          pagosRes, 
          estudiosRes, 
          infraRes, 
          viviendaRes, 
          totalsRes, 
          planillasVarRes, 
          planillasAdminRes, 
          marketingRes, 
          commissionRes, 
          serviciosProfesionalesRes, 
          financialCostsRes, 
          ingresosRes, 
          ingresosPorVentasRes,
          scenarioProjectsRes
        ] = await Promise.all([
          api.get('/api/pagos_tierra/view'),
          api.get('/api/estudios_disenos_permisos/view'),
          getInfraestructuraPagos(),
          getViviendaPagos(),
          api.get('/api/costo-directo/totales/'),
          api.get('/api/payroll/flujo/planilla-variable-consolidado'),
          api.get('/api/payroll/flujo/planilla-administrativa-consolidado'),
          marketingSummaryApi.getConsolidatedCashFlow(),
          proyeccionVentas.getVentasCashflowProjection(),
          api.get('/api/payroll/flujo/planilla-servicio-profesionales'),
          lineasCreditoApi.getFinancialCostsCashflow(),
          lineasCreditoApi.getIngresosCashflow(),
          apiClient.contabilidadFlujoGeneralApi.getIngresosPorVentasCashflow(),
          api.get('/api/scenario-projects/consolidated/cash-flow-impact'),
        ]);
        setPagosTierra(pagosRes.data || []);
        setEstudiosPermisos(estudiosRes.data || []);
        setInfraPagos(infraRes.data);
        setViviendaPagos(viviendaRes.data);
        setTotals(totalsRes.data);
        setPlanillasVariables(planillasVarRes.data || []);
        setPlanillasAdmin(planillasAdminRes.data || []);
        setScenarioProjectsData(scenarioProjectsRes.data);
        
        // Calculate marketing totals by month and total
        const periodsMonths = periods.flatMap(p => p.months);
        const marketingData = marketingRes.data || {};
        const marketingRows = marketingData.data || [];
        
        // Find the TOTAL row from the consolidated marketing data
        const totalRow = marketingRows.find(row => row.actividad === 'TOTAL');
        
        if (totalRow) {
          const monthTotals = periodsMonths.map(monthKey => Number(totalRow[monthKey]) || 0);
          setMarketingTotalsByMonth(monthTotals);
          setMarketingTotal(monthTotals.reduce((a, b) => a + b, 0));
        } else {
          // Fallback: sum all rows if no TOTAL row found
          const monthTotals = periodsMonths.map(monthKey =>
            marketingRows.reduce((sum, row) => sum + (Number(row[monthKey]) || 0), 0)
          );
          setMarketingTotalsByMonth(monthTotals);
          setMarketingTotal(monthTotals.reduce((a, b) => a + b, 0));
        }

        // Calculate commission totals by month and total from grand_total_monthly
        const commissionData = commissionRes.data || {};
        const grandTotalMonthly = commissionData.grand_total_monthly || [];
        
        if (grandTotalMonthly.length > 0) {
          // The commission data should have 39 months, same as our periods
          const commissionMonthTotals = grandTotalMonthly.map((val: number) => val || 0);
          setCommissionTotalsByMonth(commissionMonthTotals);
          setCommissionTotal(commissionMonthTotals.reduce((a: number, b: number) => a + b, 0));
        } else {
          // Fallback: all zeros
          const commissionMonthTotals = Array(periodsMonths.length).fill(0);
          setCommissionTotalsByMonth(commissionMonthTotals);
          setCommissionTotal(0);
        }

        // Calculate servicios profesionales totals by month and total
        const serviciosProfesionalesData = serviciosProfesionalesRes.data || [];
        
        if (serviciosProfesionalesData.length > 0) {
          // Map the servicios profesionales data to our periods structure
          const serviciosProfesionalesMonthTotals = periodsMonths.map(monthKey => {
            const monthData = serviciosProfesionalesData.find((item: any) => item.month === monthKey);
            return monthData ? (monthData.monto || 0) : 0;
          });
          setServiciosProfesionalesByMonth(serviciosProfesionalesMonthTotals);
          setServiciosProfesionalesTotal(serviciosProfesionalesMonthTotals.reduce((a: number, b: number) => a + b, 0));
        } else {
          // Fallback: all zeros
          const serviciosProfesionalesMonthTotals = Array(periodsMonths.length).fill(0);
          setServiciosProfesionalesByMonth(serviciosProfesionalesMonthTotals);
          setServiciosProfesionalesTotal(0);
        }

        // Calculate financial costs totals by month and total
        const financialCostsData = financialCostsRes.data || {};
        
        if (financialCostsData.intereses_bancarios && financialCostsData.cargos_bancarios) {
          // The financial costs data should have 39 months, same as our periods
          const interesesMonthTotals = financialCostsData.intereses_bancarios.map((val: number) => val || 0);
          const cargosMonthTotals = financialCostsData.cargos_bancarios.map((val: number) => val || 0);
          
          setInteresesBancariosByMonth(interesesMonthTotals);
          setInteresesBancariosTotal(financialCostsData.total_intereses || 0);
          setCargosBancariosByMonth(cargosMonthTotals);
          setCargosBancariosTotal(financialCostsData.total_cargos || 0);
        } else {
          // Fallback: all zeros
          const zeroMonthTotals = Array(periodsMonths.length).fill(0);
          setInteresesBancariosByMonth(zeroMonthTotals);
          setInteresesBancariosTotal(0);
          setCargosBancariosByMonth(zeroMonthTotals);
          setCargosBancariosTotal(0);
        }

        // Calculate ingresos (credit lines drawdowns) totals by month and total
        const ingresosData = ingresosRes.data || {};
        
        if (ingresosData.credit_lines && ingresosData.totals_by_month) {
          // The ingresos data should have 39 months, same as our periods
          const ingresosMonthTotals = ingresosData.totals_by_month.map((val: number) => val || 0);
          
          setIngresosCreditLines(ingresosData.credit_lines || []);
          setIngresosTotalsByMonth(ingresosMonthTotals);
          setIngresosTotal(ingresosMonthTotals.reduce((a: number, b: number) => a + b, 0));
        } else {
          // Fallback: all zeros
          const zeroMonthTotals = Array(periodsMonths.length).fill(0);
          setIngresosCreditLines([]);
          setIngresosTotalsByMonth(zeroMonthTotals);
          setIngresosTotal(0);
        }

        // Calculate ingresos por ventas (sales revenue - company portion of payments) totals by month and total
        const ingresosPorVentasData = ingresosPorVentasRes.data || [];
        
        if (ingresosPorVentasData.length > 0) {
          // Map the sales revenue data to our periods structure
          const ingresosPorVentasMonthTotals = periodsMonths.map(monthKey => {
            const monthData = ingresosPorVentasData.find((item: any) => item.month === monthKey);
            return monthData ? (monthData.monto || 0) : 0;
          });
          setIngresosPorVentasByMonth(ingresosPorVentasMonthTotals);
          setIngresosPorVentasTotal(ingresosPorVentasMonthTotals.reduce((a: number, b: number) => a + b, 0));
        } else {
          // Fallback: all zeros
          const ingresosPorVentasMonthTotals = Array(periodsMonths.length).fill(0);
          setIngresosPorVentasByMonth(ingresosPorVentasMonthTotals);
          setIngresosPorVentasTotal(0);
        }
      } catch (err: any) {
        console.error("Error fetching or processing data:", err);
        setError('No se pudieron cargar los datos');
        toast({ title: 'Error', description: err.message || 'No se pudieron cargar los datos', status: 'error' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [toast, periods]);

  // Helper to sum all rows for a given month in a dataset
  const sumByMonth = (data: any[], months: string[]) => {
    return months.map(month =>
      data.reduce((acc, row) => acc + (typeof row[month] === 'number' ? row[month] : 0), 0)
    );
  };

  // Helper to sum all months for a dataset
  const sumTotal = (data: any[], months: string[]) => {
    return data.reduce((acc, row) => acc + months.reduce((macc, m) => macc + (typeof row[m] === 'number' ? row[m] : 0), 0), 0);
  };

  // Payments by month (39 months)
  const pagosTierraByMonth = useMemo(() => sumByMonth(pagosTierra, periods.flatMap(p => p.months)), [pagosTierra, periods]);
  const estudiosPermisosByMonth = useMemo(() => sumByMonth(estudiosPermisos, periods.flatMap(p => p.months)), [estudiosPermisos, periods]);
  const infraPagosByMonth = useMemo(() => sumByMonth(infraPagos, periods.flatMap(p => p.months)), [infraPagos, periods]);
  const viviendaPagosByMonth = useMemo(() => sumByMonth(viviendaPagos, periods.flatMap(p => p.months)), [viviendaPagos, periods]);
  const planillasVarByMonth = useMemo(() => sumByMonth(planillasVariables, periods.flatMap(p => p.months)), [planillasVariables, periods]);
  const planillasAdminByMonth = useMemo(() => sumByMonth(planillasAdmin, periods.flatMap(p => p.months)), [planillasAdmin, periods]);

  // Totals
  const totalPagosTierra = useMemo(() => sumTotal(pagosTierra, periods.flatMap(p => p.months)), [pagosTierra, periods]);
  const totalEstudiosPermisos = useMemo(() => sumTotal(estudiosPermisos, periods.flatMap(p => p.months)), [estudiosPermisos, periods]);
  const totalInfraPagos = useMemo(() => sumTotal(infraPagos, periods.flatMap(p => p.months)), [infraPagos, periods]);
  const totalViviendaPagos = useMemo(() => sumTotal(viviendaPagos, periods.flatMap(p => p.months)), [viviendaPagos, periods]);
  const totalPlanillasVar = useMemo(() => sumTotal(planillasVariables, periods.flatMap(p => p.months)), [planillasVariables, periods]);
  const totalPlanillasAdmin = useMemo(() => sumTotal(planillasAdmin, periods.flatMap(p => p.months)), [planillasAdmin, periods]);

  // Main table rows
  const tableRows = useMemo(() => [
    { label: 'INGRESOS POR VENTAS', data: ingresosPorVentasByMonth, total: ingresosPorVentasTotal, isPositive: true },
    { label: 'INGRESOS POR LÍNEAS DE CRÉDITO', data: ingresosTotalsByMonth, total: ingresosTotal, isPositive: true },
    { 
      label: 'Ingresos de Proyectos en Escenario', 
      data: scenarioProjectsData?.consolidated_cash_flow?.total_ingresos_by_month || Array(39).fill(0), 
      total: scenarioProjectsData?.consolidated_cash_flow?.total_ingresos_by_month?.reduce((a, b) => a + b, 0) || 0,
      isPositive: true 
    },
    { label: 'Marketing', data: marketingTotalsByMonth, total: marketingTotal, isPositive: false },
    { label: 'Comisiones de Ventas', data: commissionTotalsByMonth, total: commissionTotal, isPositive: false },
    { label: 'Costo Directo - Proyectos Infraestructura', data: infraPagosByMonth, total: totalInfraPagos, isPositive: false },
    { label: 'Costo Directo - Proyectos Vivienda', data: viviendaPagosByMonth, total: totalViviendaPagos, isPositive: false },
    { label: 'Planillas Variables', data: planillasVarByMonth, total: totalPlanillasVar, isPositive: false },
    { label: 'Planillas Administrativas', data: planillasAdminByMonth, total: totalPlanillasAdmin, isPositive: false },
    { label: 'Servicios Profesionales', data: serviciosProfesionalesByMonth, total: serviciosProfesionalesTotal, isPositive: false },
    ...ROW_LABELS.map(row => ({
      label: row.label,
      data: row.key === 'pagos_tierra' ? pagosTierraByMonth : estudiosPermisosByMonth,
      total: row.key === 'pagos_tierra' ? totalPagosTierra : totalEstudiosPermisos,
      isPositive: false
    })),
    { label: 'Intereses Bancarios', data: interesesBancariosByMonth, total: interesesBancariosTotal, isPositive: false },
    { label: 'Cargos Bancarios', data: cargosBancariosByMonth, total: cargosBancariosTotal, isPositive: false },
    { 
      label: 'Egresos de Proyectos en Escenario', 
      data: scenarioProjectsData?.consolidated_cash_flow?.total_egresos_by_month || Array(39).fill(0), 
      total: scenarioProjectsData?.consolidated_cash_flow?.total_egresos_by_month?.reduce((a, b) => a + b, 0) || 0,
      isPositive: false 
    },
  ], [
    pagosTierraByMonth, estudiosPermisosByMonth, infraPagosByMonth, viviendaPagosByMonth,
    totalPagosTierra, totalEstudiosPermisos, totalInfraPagos, totalViviendaPagos,
    planillasVarByMonth, totalPlanillasVar, planillasAdminByMonth, totalPlanillasAdmin,
    marketingTotalsByMonth, marketingTotal, commissionTotalsByMonth, commissionTotal,
    serviciosProfesionalesByMonth, serviciosProfesionalesTotal,
    interesesBancariosByMonth, interesesBancariosTotal, cargosBancariosByMonth, cargosBancariosTotal,
    ingresosTotalsByMonth, ingresosTotal, ingresosPorVentasByMonth, ingresosPorVentasTotal,
    scenarioProjectsData
  ]);

  const totalIngresosByMonth = useMemo(() => {
    return periods.flatMap(p => p.months).map((_, i) =>
      tableRows
        .filter(row => row.isPositive)
        .reduce((sum, row) => sum + row.data[i], 0)
    );
  }, [tableRows, periods]);

  const totalEgresosByMonth = useMemo(() => {
    return periods.flatMap(p => p.months).map((_, i) =>
      tableRows
        .filter(row => !row.isPositive)
        .reduce((sum, row) => sum + row.data[i], 0)
    );
  }, [tableRows, periods]);

  const totalFlujoNetoByMonth = useMemo(() => {
    return totalIngresosByMonth.map((ingreso, i) => ingreso - totalEgresosByMonth[i]);
  }, [totalIngresosByMonth, totalEgresosByMonth]);

  const totalIngresosGeneral = useMemo(() => totalIngresosByMonth.reduce((sum, val) => sum + val, 0), [totalIngresosByMonth]);
  const totalEgresosGeneral = useMemo(() => totalEgresosByMonth.reduce((sum, val) => sum + val, 0), [totalEgresosByMonth]);
  const totalFlujoNetoGeneral = useMemo(() => totalFlujoNetoByMonth.reduce((sum, val) => sum + val, 0), [totalFlujoNetoByMonth]);

  const saldoAcumulado = useMemo(() => {
    const acumulado = [];
    let saldo = 0;
    for (const flujo of totalFlujoNetoByMonth) {
      saldo += flujo;
      acumulado.push(saldo);
    }
    return acumulado;
  }, [totalFlujoNetoByMonth]);

  if (isLoading) {
    return (
      <Box p={5} display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Spinner size="xl" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={5} display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Text color="red.500" fontSize="xl">{error}</Text>
      </Box>
    );
  }

  return (
    <Box p={5}>
      <Heading as="h1" size="xl" mb={5}>Flujo de Caja Consolidado con Proyectos</Heading>
      <Tabs isFitted variant="enclosed">
        <TabList mb="1em">
          {periods.map((period, index) => (
            <Tab key={index}>{period.label}</Tab>
          ))}
        </TabList>
        <TabPanels>
          {periods.map((period, periodIndex) => (
            <TabPanel key={periodIndex} p={0}>
              <TableContainer>
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Categoría</Th>
                      {period.months.map(month => (
                        <Th key={month} isNumeric>{formatMonth(month)}</Th>
                      ))}
                      <Th isNumeric>Total</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {/* INGRESOS */}
                    <Tr fontWeight="bold" bg="gray.100">
                      <Td>INGRESOS</Td>
                      {period.months.map((_, i) => {
                        const monthIndex = periodIndex * 12 + i;
                        return <Td key={i} isNumeric>{formatCurrency(totalIngresosByMonth[monthIndex])}</Td>;
                      })}
                      <Td isNumeric>{formatCurrency(totalIngresosGeneral)}</Td>
                    </Tr>
                    {tableRows.filter(row => row.isPositive).map(row => (
                      <Tr key={row.label}>
                        <Td pl={8}>{row.label}</Td>
                        {period.months.map((_, i) => {
                          const monthIndex = periodIndex * 12 + i;
                          return <Td key={i} isNumeric>{formatCurrency(row.data[monthIndex])}</Td>;
                        })}
                        <Td isNumeric>{formatCurrency(row.total)}</Td>
                      </Tr>
                    ))}

                    {/* EGRESOS */}
                    <Tr fontWeight="bold" bg="gray.100">
                      <Td>EGRESOS</Td>
                      {period.months.map((_, i) => {
                        const monthIndex = periodIndex * 12 + i;
                        return <Td key={i} isNumeric>{formatCurrency(totalEgresosByMonth[monthIndex])}</Td>;
                      })}
                      <Td isNumeric>{formatCurrency(totalEgresosGeneral)}</Td>
                    </Tr>
                    {tableRows.filter(row => !row.isPositive).map(row => (
                      <Tr key={row.label}>
                        <Td pl={8}>{row.label}</Td>
                        {period.months.map((_, i) => {
                          const monthIndex = periodIndex * 12 + i;
                          return <Td key={i} isNumeric>{formatCurrency(row.data[monthIndex])}</Td>;
                        })}
                        <Td isNumeric>{formatCurrency(row.total)}</Td>
                      </Tr>
                    ))}
                    
                    {/* FLUJO NETO */}
                    <Tr fontWeight="bold" bg="blue.100">
                      <Td>FLUJO NETO DEL PERIODO</Td>
                      {period.months.map((_, i) => {
                        const monthIndex = periodIndex * 12 + i;
                        return <Td key={i} isNumeric>{formatCurrency(totalFlujoNetoByMonth[monthIndex])}</Td>;
                      })}
                      <Td isNumeric>{formatCurrency(totalFlujoNetoGeneral)}</Td>
                    </Tr>
                    
                    {/* SALDO ACUMULADO */}
                    <Tr fontWeight="bold" bg="green.100">
                      <Td>SALDO ACUMULADO</Td>
                      {period.months.map((_, i) => {
                        const monthIndex = periodIndex * 12 + i;
                        return <Td key={i} isNumeric>{formatCurrency(saldoAcumulado[monthIndex])}</Td>;
                      })}
                      <Td isNumeric>{formatCurrency(saldoAcumulado[saldoAcumulado.length - 1])}</Td>
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

export default FlujoCajaConsolidadoConProyectosPage; 