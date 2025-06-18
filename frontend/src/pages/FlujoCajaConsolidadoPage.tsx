import React, { useEffect, useState, useMemo } from 'react';
import { Box, Heading, Text, Table, Thead, Tbody, Tr, Th, Td, TableContainer, Spinner, Tabs, TabList, TabPanels, Tab, TabPanel, HStack, useToast } from '@chakra-ui/react';
import { api, getInfraestructuraPagos, getViviendaPagos, marketingSummaryApi, proyeccionVentas, lineasCreditoApi } from '../api/api';
import apiClient from '../api/api';

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

const FlujoCajaConsolidadoPage: React.FC = () => {
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

  const periods = useMemo(() => generateDynamicPeriods(), []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [pagosRes, estudiosRes, infraRes, viviendaRes, totalsRes, planillasVarRes, planillasAdminRes, marketingRes, commissionRes, serviciosProfesionalesRes, financialCostsRes, ingresosRes, ingresosPorVentasRes] = await Promise.all([
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
        ]);
        setPagosTierra(pagosRes.data || []);
        setEstudiosPermisos(estudiosRes.data || []);
        setInfraPagos(infraRes.data);
        setViviendaPagos(viviendaRes.data);
        setTotals(totalsRes.data);
        setPlanillasVariables(planillasVarRes.data || []);
        setPlanillasAdmin(planillasAdminRes.data || []);
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
  const pagosByMonth = (arr: any[], tipo: 'material' | 'mano_obra') => {
    const monthsArr = Array(periods.flatMap(p => p.months).length).fill(0);
    const allMonths = periods.flatMap(p => p.months);
    
    arr.filter(p => p.tipo === tipo).forEach(p => {
      // Since the data only has 'mes' (1-12) without year, we need to map it to the current year
      // For now, let's assume the payments are for the current year (2025)
      const currentYear = new Date().getFullYear();
      const monthKey = `${currentYear}_${String(p.mes).padStart(2, '0')}`;
      const idx = allMonths.indexOf(monthKey);
      if (idx >= 0) {
        monthsArr[idx] += p.monto;
      }
    });
    return monthsArr;
  };
  const pagosMaterialByMonth = pagosByMonth(infraPagos, 'material');
  const pagosManoObraByMonth = pagosByMonth(infraPagos, 'mano_obra');
  const pagosMaterialViviendasByMonth = pagosByMonth(viviendaPagos, 'material');
  const pagosManoObraViviendaByMonth = pagosByMonth(viviendaPagos, 'mano_obra');
  const pagosMaterial = infraPagos.filter(p => p.tipo === 'material').reduce((sum, p) => sum + p.monto, 0);
  const pagosManoObra = infraPagos.filter(p => p.tipo === 'mano_obra').reduce((sum, p) => sum + p.monto, 0);
  const pagosMaterialViviendas = viviendaPagos.filter(p => p.tipo === 'material').reduce((sum, p) => sum + p.monto, 0);
  const pagosManoObraVivienda = viviendaPagos.filter(p => p.tipo === 'mano_obra').reduce((sum, p) => sum + p.monto, 0);

  const planillaVarByMonth = useMemo(() => {
    const allMonths = periods.flatMap(p => p.months);
    const result = Array(allMonths.length).fill(0);
    if(planillasVariables.length > 0) {
      allMonths.forEach((month, idx) => {
        const monthData = planillasVariables.find(item => item.month === month);
        if (monthData) {
          result[idx] = monthData.monto;
        }
      });
    }
    return result;
  }, [planillasVariables, periods]);

  const planillaAdminByMonth = useMemo(() => {
    const allMonths = periods.flatMap(p => p.months);
    const result = Array(allMonths.length).fill(0);
    if(planillasAdmin.length > 0) {
      allMonths.forEach((month, idx) => {
        const monthData = planillasAdmin.find(item => item.month === month);
        if (monthData) {
          result[idx] = monthData.monto;
        }
      });
    }
    return result;
  }, [planillasAdmin, periods]);

  if (isLoading) {
    return (
      <Box p={5} display="flex" justifyContent="center">
        <Spinner size="xl" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={5}>
        <Text color="red.500">{error}</Text>
      </Box>
    );
  }

  return (
    <Box p={5}>
      <Heading as="h1" size="xl" mb={2}>
        Flujo de Caja Consolidado
      </Heading>
      <Text fontSize="lg" mb={8}>
        Análisis consolidado de todos los flujos de ingresos y egresos de la empresa.
      </Text>
      <Tabs>
        <TabList>
          {periods.map((period) => (
            <Tab key={period.label} fontWeight="bold">{period.label}</Tab>
          ))}
        </TabList>
        <TabPanels>
          {periods.map((period) => (
            <TabPanel key={period.label}>
              <TableContainer>
                  <Table variant="striped" size="sm">
                    <Thead>
                      <Tr>
                      <Th>Concepto</Th>
                        {period.months.map((month) => (
                          <Th key={month} isNumeric>{formatMonth(month)}</Th>
                        ))}
                        <Th isNumeric>Total</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                    {/* INGRESOS SECTION */}
                    <Tr bg="green.100">
                      <Td fontWeight="bold" fontSize="md" color="green.800">INGRESOS</Td>
                      {period.months.map((month, i) => (
                        <Td key={i} bg="green.100"></Td>
                      ))}
                      <Td bg="green.100"></Td>
                    </Tr>
                    {ingresosCreditLines.map((creditLine) => (
                      <Tr key={creditLine.id}>
                        <Td pl={6}>{creditLine.nombre}</Td>
                        {period.months.map((month, i) => {
                          const allMonths = periods.flatMap(p => p.months);
                          const monthIndex = allMonths.indexOf(month);
                          const drawdownValue = creditLine.monthly_drawdowns[monthIndex] || 0;
                          return (
                            <Td key={i} isNumeric>{drawdownValue > 0 ? formatCurrency(drawdownValue) : ''}</Td>
                          );
                        })}
                        <Td isNumeric>{formatCurrency(
                          period.months.reduce((sum, month) => {
                            const allMonths = periods.flatMap(p => p.months);
                            const monthIndex = allMonths.indexOf(month);
                            return sum + (creditLine.monthly_drawdowns[monthIndex] || 0);
                          }, 0)
                        )}</Td>
                      </Tr>
                    ))}
                    <Tr>
                      <Td pl={6}>Capital aportado por socios</Td>
                      {period.months.map((month, i) => (
                        <Td key={i} isNumeric>-</Td>
                      ))}
                      <Td isNumeric>-</Td>
                    </Tr>
                    <Tr>
                      <Td pl={6}>Ingresos por Ventas</Td>
                      {period.months.map((month, i) => {
                        const allMonths = periods.flatMap(p => p.months);
                        const monthIndex = allMonths.indexOf(month);
                        const ingresosPorVentasValue = ingresosPorVentasByMonth[monthIndex] || 0;
                        return (
                          <Td key={i} isNumeric>{ingresosPorVentasValue > 0 ? formatCurrency(ingresosPorVentasValue) : ''}</Td>
                        );
                      })}
                      <Td isNumeric>{formatCurrency(
                        period.months.reduce((sum, month) => {
                          const allMonths = periods.flatMap(p => p.months);
                          const monthIndex = allMonths.indexOf(month);
                          return sum + (ingresosPorVentasByMonth[monthIndex] || 0);
                        }, 0)
                      )}</Td>
                    </Tr>
                    <Tr>
                      <Td pl={6}>Recuperacion de Gastos Reembolsables</Td>
                      {period.months.map((month, i) => (
                        <Td key={i} isNumeric>-</Td>
                      ))}
                      <Td isNumeric>-</Td>
                    </Tr>
                    <Tr bg="green.50">
                      <Td fontWeight="bold" color="green.700">TOTAL INGRESOS</Td>
                      {period.months.map((month, i) => {
                        const allMonths = periods.flatMap(p => p.months);
                        const monthIndex = allMonths.indexOf(month);
                        const creditLineValue = ingresosTotalsByMonth[monthIndex] || 0;
                        const salesRevenueValue = ingresosPorVentasByMonth[monthIndex] || 0;
                        const totalValue = creditLineValue + salesRevenueValue;
                        return (
                          <Td key={i} isNumeric fontWeight="bold" color="green.700">
                            {totalValue > 0 ? formatCurrency(totalValue) : ''}
                          </Td>
                        );
                      })}
                      <Td isNumeric fontWeight="bold" color="green.700">{formatCurrency(
                        period.months.reduce((sum, month) => {
                          const allMonths = periods.flatMap(p => p.months);
                          const monthIndex = allMonths.indexOf(month);
                          const creditLineValue = ingresosTotalsByMonth[monthIndex] || 0;
                          const salesRevenueValue = ingresosPorVentasByMonth[monthIndex] || 0;
                          return sum + creditLineValue + salesRevenueValue;
                        }, 0)
                      )}</Td>
                    </Tr>

                    {/* EGRESOS PRELIMINARES SECTION */}
                    <Tr bg="red.100">
                      <Td fontWeight="bold" fontSize="md" color="red.800">EGRESOS PRELIMINARES</Td>
                      {period.months.map((month, i) => (
                        <Td key={i} bg="red.100"></Td>
                      ))}
                      <Td bg="red.100"></Td>
                    </Tr>
                    <Tr>
                      <Td pl={6}>Pagos a Terreno</Td>
                        {sumByMonth(pagosTierra, period.months).map((val, idx) => (
                          <Td key={period.months[idx]} isNumeric>{formatCurrency(val)}</Td>
                        ))}
                      <Td isNumeric>{formatCurrency(sumTotal(pagosTierra, period.months))}</Td>
                      </Tr>
                      <Tr>
                      <Td pl={6}>Estudios, Diseños y Permisos</Td>
                        {sumByMonth(estudiosPermisos, period.months).map((val, idx) => (
                          <Td key={period.months[idx]} isNumeric>{formatCurrency(val)}</Td>
                        ))}
                      <Td isNumeric>{formatCurrency(sumTotal(estudiosPermisos, period.months))}</Td>
                      </Tr>

                    {/* COSTOS DE CONSTRUCCION DIRECTOS SECTION */}
                    <Tr bg="orange.100">
                      <Td fontWeight="bold" fontSize="md" color="orange.800">COSTOS DE CONSTRUCCION DIRECTOS</Td>
                      {period.months.map((month, i) => (
                        <Td key={i} bg="orange.100"></Td>
                      ))}
                      <Td bg="orange.100"></Td>
                      </Tr>
                      <Tr>
                      <Td pl={6}>Material Infraestructura</Td>
                        {period.months.map((m, i) => <Td key={m} isNumeric>{pagosMaterialByMonth[periods.flatMap(p => p.months).indexOf(m)] ? formatCurrency(pagosMaterialByMonth[periods.flatMap(p => p.months).indexOf(m)]) : ''}</Td>)}
                        <Td isNumeric>{formatCurrency(pagosMaterial)}</Td>
                      </Tr>
                      <Tr>
                      <Td pl={6}>Mano de Obra Infraestructura</Td>
                        {period.months.map((m, i) => <Td key={m} isNumeric>{pagosManoObraByMonth[periods.flatMap(p => p.months).indexOf(m)] ? formatCurrency(pagosManoObraByMonth[periods.flatMap(p => p.months).indexOf(m)]) : ''}</Td>)}
                        <Td isNumeric>{formatCurrency(pagosManoObra)}</Td>
                      </Tr>
                      <Tr>
                      <Td pl={6}>Materiales Viviendas</Td>
                        {period.months.map((m, i) => <Td key={m} isNumeric>{pagosMaterialViviendasByMonth[periods.flatMap(p => p.months).indexOf(m)] ? formatCurrency(pagosMaterialViviendasByMonth[periods.flatMap(p => p.months).indexOf(m)]) : ''}</Td>)}
                        <Td isNumeric>{formatCurrency(pagosMaterialViviendas)}</Td>
                      </Tr>
                      <Tr>
                      <Td pl={6}>Mano de Obra Vivienda</Td>
                      {pagosManoObraViviendaByMonth.map((p, i) => <Td key={i} isNumeric>{formatCurrency(p)}</Td>)}
                      <Td isNumeric>{formatCurrency(pagosManoObraVivienda)}</Td>
                    </Tr>
                    <Tr>
                      <Td pl={6}>Planilla de Construccion Equipo Pesado y Otros</Td>
                      {planillaVarByMonth.map((p, i) => <Td key={i} isNumeric>{formatCurrency(p)}</Td>)}
                      <Td isNumeric>{formatCurrency(planillaVarByMonth.reduce((a, b) => a + b, 0))}</Td>
                    </Tr>

                    {/* COSTOS ADMINISTRATIVOS SECTION */}
                    <Tr bg="purple.100">
                      <Td fontWeight="bold" fontSize="md" color="purple.800">COSTOS ADMINISTRATIVOS</Td>
                      {period.months.map((month, i) => (
                        <Td key={i} bg="purple.100"></Td>
                      ))}
                      <Td bg="purple.100"></Td>
                    </Tr>
                    <Tr>
                      <Td pl={6}>Planilla Administrativa</Td>
                      {planillaAdminByMonth.map((p, i) => <Td key={i} isNumeric>{formatCurrency(p)}</Td>)}
                      <Td isNumeric>{formatCurrency(planillaAdminByMonth.reduce((a, b) => a + b, 0))}</Td>
                    </Tr>
                    <Tr>
                      <Td pl={6}>Publicidad y Mercadeo</Td>
                      {marketingTotalsByMonth.slice(0, period.months.length).map((val, i) => (
                        <Td key={i} isNumeric>{formatCurrency(val)}</Td>
                      ))}
                      <Td isNumeric>{formatCurrency(marketingTotalsByMonth.slice(0, period.months.length).reduce((a, b) => a + b, 0))}</Td>
                    </Tr>
                    <Tr>
                      <Td pl={6}>Comisiones de Ventas</Td>
                      {period.months.map((month, i) => {
                        const allMonths = periods.flatMap(p => p.months);
                        const monthIndex = allMonths.indexOf(month);
                        const commissionValue = commissionTotalsByMonth[monthIndex] || 0;
                        return (
                          <Td key={i} isNumeric>{formatCurrency(commissionValue)}</Td>
                        );
                      })}
                      <Td isNumeric>{formatCurrency(
                        period.months.reduce((sum, month) => {
                          const allMonths = periods.flatMap(p => p.months);
                          const monthIndex = allMonths.indexOf(month);
                          return sum + (commissionTotalsByMonth[monthIndex] || 0);
                        }, 0)
                      )}</Td>
                    </Tr>
                    <Tr>
                      <Td pl={6}>Servicios Profesionales y Consultorias</Td>
                      {period.months.map((month, i) => {
                        const allMonths = periods.flatMap(p => p.months);
                        const monthIndex = allMonths.indexOf(month);
                        const serviciosProfesionalesValue = serviciosProfesionalesByMonth[monthIndex] || 0;
                        return (
                          <Td key={i} isNumeric>{formatCurrency(serviciosProfesionalesValue)}</Td>
                        );
                      })}
                      <Td isNumeric>{formatCurrency(
                        period.months.reduce((sum, month) => {
                          const allMonths = periods.flatMap(p => p.months);
                          const monthIndex = allMonths.indexOf(month);
                          return sum + (serviciosProfesionalesByMonth[monthIndex] || 0);
                        }, 0)
                      )}</Td>
                    </Tr>

                    {/* COSTOS FINANCIEROS SECTION */}
                    <Tr bg="yellow.100">
                      <Td fontWeight="bold" fontSize="md" color="yellow.800">COSTOS FINANCIEROS</Td>
                      {period.months.map((month, i) => (
                        <Td key={i} bg="yellow.100"></Td>
                      ))}
                      <Td bg="yellow.100"></Td>
                    </Tr>
                    <Tr>
                      <Td pl={6}>Intereses Bancarios</Td>
                      {period.months.map((month, i) => {
                        const allMonths = periods.flatMap(p => p.months);
                        const monthIndex = allMonths.indexOf(month);
                        const interesesValue = interesesBancariosByMonth[monthIndex] || 0;
                        return (
                          <Td key={i} isNumeric>{formatCurrency(interesesValue)}</Td>
                        );
                      })}
                      <Td isNumeric>{formatCurrency(
                        period.months.reduce((sum, month) => {
                          const allMonths = periods.flatMap(p => p.months);
                          const monthIndex = allMonths.indexOf(month);
                          return sum + (interesesBancariosByMonth[monthIndex] || 0);
                        }, 0)
                      )}</Td>
                    </Tr>
                    <Tr>
                      <Td pl={6}>Cargos Bancarios</Td>
                      {period.months.map((month, i) => {
                        const allMonths = periods.flatMap(p => p.months);
                        const monthIndex = allMonths.indexOf(month);
                        const cargosValue = cargosBancariosByMonth[monthIndex] || 0;
                        return (
                          <Td key={i} isNumeric>{formatCurrency(cargosValue)}</Td>
                        );
                      })}
                      <Td isNumeric>{formatCurrency(
                        period.months.reduce((sum, month) => {
                          const allMonths = periods.flatMap(p => p.months);
                          const monthIndex = allMonths.indexOf(month);
                          return sum + (cargosBancariosByMonth[monthIndex] || 0);
                        }, 0)
                      )}</Td>
                    </Tr>

                    {/* SUBTOTAL TODOS LOS COSTOS */}
                    <Tr bg="blue.50">
                      <Td fontWeight="bold" fontSize="md" color="blue.700">SUBTOTAL TODOS LOS COSTOS</Td>
                      {period.months.map((month, i) => {
                        const allMonths = periods.flatMap(p => p.months);
                        const monthIndex = allMonths.indexOf(month);
                        
                        // Calculate subtotal for this month by adding all cost categories
                        let monthlySubtotal = 0;
                        
                        // EGRESOS PRELIMINARES
                        monthlySubtotal += sumByMonth(pagosTierra, [month])[0] || 0;
                        monthlySubtotal += sumByMonth(estudiosPermisos, [month])[0] || 0;
                        
                        // COSTOS DE CONSTRUCCION DIRECTOS
                        monthlySubtotal += pagosMaterialByMonth[monthIndex] || 0;
                        monthlySubtotal += pagosManoObraByMonth[monthIndex] || 0;
                        monthlySubtotal += pagosMaterialViviendasByMonth[monthIndex] || 0;
                        monthlySubtotal += pagosManoObraViviendaByMonth[monthIndex] || 0;
                        monthlySubtotal += planillaVarByMonth[monthIndex] || 0;
                        
                        // COSTOS ADMINISTRATIVOS
                        monthlySubtotal += planillaAdminByMonth[monthIndex] || 0;
                        monthlySubtotal += marketingTotalsByMonth[monthIndex] || 0;
                        monthlySubtotal += commissionTotalsByMonth[monthIndex] || 0;
                        monthlySubtotal += serviciosProfesionalesByMonth[monthIndex] || 0;
                        
                        // COSTOS FINANCIEROS
                        monthlySubtotal += interesesBancariosByMonth[monthIndex] || 0;
                        monthlySubtotal += cargosBancariosByMonth[monthIndex] || 0;
                        
                        return (
                          <Td key={i} fontWeight="bold" fontSize="md" color="blue.700" isNumeric>
                            {formatCurrency(monthlySubtotal)}
                          </Td>
                        );
                      })}
                      <Td fontWeight="bold" fontSize="md" color="blue.700" isNumeric>
                        {formatCurrency(
                          // Calculate total across all months for this period
                          period.months.reduce((sum, month) => {
                            const allMonths = periods.flatMap(p => p.months);
                            const monthIndex = allMonths.indexOf(month);
                            
                            let monthlySubtotal = 0;
                            
                            // EGRESOS PRELIMINARES
                            monthlySubtotal += sumByMonth(pagosTierra, [month])[0] || 0;
                            monthlySubtotal += sumByMonth(estudiosPermisos, [month])[0] || 0;
                            
                            // COSTOS DE CONSTRUCCION DIRECTOS
                            monthlySubtotal += pagosMaterialByMonth[monthIndex] || 0;
                            monthlySubtotal += pagosManoObraByMonth[monthIndex] || 0;
                            monthlySubtotal += pagosMaterialViviendasByMonth[monthIndex] || 0;
                            monthlySubtotal += pagosManoObraViviendaByMonth[monthIndex] || 0;
                            monthlySubtotal += planillaVarByMonth[monthIndex] || 0;
                            
                            // COSTOS ADMINISTRATIVOS
                            monthlySubtotal += planillaAdminByMonth[monthIndex] || 0;
                            monthlySubtotal += marketingTotalsByMonth[monthIndex] || 0;
                            monthlySubtotal += commissionTotalsByMonth[monthIndex] || 0;
                            monthlySubtotal += serviciosProfesionalesByMonth[monthIndex] || 0;
                            
                            // COSTOS FINANCIEROS
                            monthlySubtotal += interesesBancariosByMonth[monthIndex] || 0;
                            monthlySubtotal += cargosBancariosByMonth[monthIndex] || 0;
                            
                            return sum + monthlySubtotal;
                          }, 0)
                        )}
                      </Td>
                    </Tr>

                    {/* FINANCIAMIENTO BANCARIO SECTION */}
                    <Tr bg="teal.100">
                      <Td fontWeight="bold" fontSize="md" color="teal.800">FINANCIAMIENTO BANCARIO</Td>
                      {period.months.map((month, i) => (
                        <Td key={i} bg="teal.100"></Td>
                      ))}
                      <Td bg="teal.100"></Td>
                      </Tr>
                      <Tr>
                      <Td pl={6}>Utilizaciones de Linea de Credito</Td>
                      {period.months.map((month, i) => {
                        const allMonths = periods.flatMap(p => p.months);
                        const monthIndex = allMonths.indexOf(month);
                        const utilizacionesValue = ingresosTotalsByMonth[monthIndex] || 0;
                        return (
                          <Td key={i} isNumeric>{utilizacionesValue > 0 ? formatCurrency(utilizacionesValue) : ''}</Td>
                        );
                      })}
                      <Td isNumeric>{formatCurrency(
                        period.months.reduce((sum, month) => {
                          const allMonths = periods.flatMap(p => p.months);
                          const monthIndex = allMonths.indexOf(month);
                          return sum + (ingresosTotalsByMonth[monthIndex] || 0);
                        }, 0)
                      )}</Td>
                      </Tr>
                    <Tr>
                      <Td pl={6}>Abonos por cobros de hipotecas</Td>
                      {period.months.map((month, i) => (
                        <Td key={i} isNumeric>-</Td>
                      ))}
                      <Td isNumeric>-</Td>
                      </Tr>
                    <Tr>
                      <Td pl={6}>Intereses sobre saldo de linea de crédito</Td>
                      {period.months.map((month, i) => {
                        const allMonths = periods.flatMap(p => p.months);
                        const monthIndex = allMonths.indexOf(month);
                        const interesesValue = interesesBancariosByMonth[monthIndex] || 0;
                        return (
                          <Td key={i} isNumeric color="red.600">{interesesValue > 0 ? formatCurrency(interesesValue) : ''}</Td>
                        );
                      })}
                      <Td isNumeric color="red.600">{formatCurrency(
                        period.months.reduce((sum, month) => {
                          const allMonths = periods.flatMap(p => p.months);
                          const monthIndex = allMonths.indexOf(month);
                          return sum + (interesesBancariosByMonth[monthIndex] || 0);
                        }, 0)
                      )}</Td>
                    </Tr>
                    <Tr bg="blue.50">
                      <Td fontWeight="bold" color="blue.700">Balance de Linea de Credito</Td>
                      {period.months.map((month, i) => {
                        const allMonths = periods.flatMap(p => p.months);
                        const monthIndex = allMonths.indexOf(month);
                        const utilizacionesValue = ingresosTotalsByMonth[monthIndex] || 0;
                        const interesesValue = interesesBancariosByMonth[monthIndex] || 0;
                        const balanceValue = utilizacionesValue - interesesValue;
                        return (
                          <Td key={i} isNumeric fontWeight="bold" color="blue.700">
                            {balanceValue !== 0 ? formatCurrency(balanceValue) : ''}
                          </Td>
                        );
                      })}
                      <Td isNumeric fontWeight="bold" color="blue.700">{formatCurrency(
                        period.months.reduce((sum, month) => {
                          const allMonths = periods.flatMap(p => p.months);
                          const monthIndex = allMonths.indexOf(month);
                          const utilizacionesValue = ingresosTotalsByMonth[monthIndex] || 0;
                          const interesesValue = interesesBancariosByMonth[monthIndex] || 0;
                          return sum + (utilizacionesValue - interesesValue);
                        }, 0)
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

export default FlujoCajaConsolidadoPage; 