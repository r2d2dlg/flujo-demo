import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import AuthProvider, { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import DashboardMercadeo from './pages/DashboardMercadeo';
import ProtectedRoute from './components/ProtectedRoute';
import MarketingBudget from './pages/MarketingBudget';
import ProjectTables from './pages/ProjectTables'; 
import GestionarProyeccionVentas from './pages/GestionarProyeccionVentas';
import Register from './pages/Register';
import Categories from './pages/Categories';
import CashFlows from './pages/CashFlows';
import MarketingBudgetTanara from './pages/MarketingBudgetTanara';
import MarketingTables from './pages/MarketingTables';
import TableViewer from './pages/TableViewer';
import ProjectViews from './pages/ProjectViews';
import VentasDashboard from './pages/VentasDashboard';
import GestionarTablaComisiones from './pages/GestionarTablaComisiones';
import VistaComisionesVendedores from './pages/VistaComisionesVendedores';
import MiscelaneosTablePage from './pages/MiscelaneosTablePage';
import ProveedoresPage from './pages/ProveedoresPage';
import VistaProveedoresPage from './pages/VistaProveedoresPage';
import VendedoresPage from './pages/VendedoresPage';
import ReporteMarketingPage from './pages/ReporteMarketingPage';
import PresupuestoGastosFijosOperativosPage from './pages/contabilidad/PresupuestoGastosFijosOperativosPage';
import GestionarPresupuestoGastosPage from './pages/contabilidad/GestionarPresupuestoGastosPage';
import CuentaProyectosPage from './pages/contabilidad/CuentaProyectosPage';
import EntradasDiarioProyectoPage from './pages/contabilidad/EntradasDiarioProyectoPage';
import VistaGastosFijosConTotalesPage from './pages/contabilidad/VistaGastosFijosConTotalesPage';
import VistaGastosFijosResumenPage from './pages/contabilidad/VistaGastosFijosResumenPage';
import FlujoGeneralEmpresaPage from './pages/contabilidad/FlujoGeneralEmpresaPage';
import ConsultoresTablePage from './pages/contabilidad/ConsultoresTablePage';
import ConsultoresViewPage from './pages/contabilidad/ConsultoresViewPage';
import PayrollTablesDashboardPage from './pages/payroll/PayrollTablesDashboardPage';
import PayrollViewsDashboardPage from './pages/payroll/PayrollViewsDashboardPage';
import LineasCreditoPage from './pages/LineasCreditoPage';
import CashFlowLineasCreditoPage from './pages/CashFlowLineasCreditoPage';
import PlanillaAdministracionTablePage from './pages/payroll/tables/PlanillaAdministracionTablePage';
import PlanillaFijaConstruccionTablePage from './pages/payroll/tables/PlanillaFijaConstruccionTablePage';
import PlanillaGerencialTablePage from './pages/payroll/tables/PlanillaGerencialTablePage';
import PlanillaServicioProfesionalesTablePage from './pages/payroll/tables/PlanillaServicioProfesionalesTablePage';
import PlanillaVariableConstruccionTablePage from './pages/payroll/tables/PlanillaVariableConstruccionTablePage';
import PlanillaAdministracionViewPage from './pages/payroll/views/PlanillaAdministracionViewPage';
import PlanillaFijaConstruccionViewPage from './pages/payroll/views/PlanillaFijaConstruccionViewPage';
import PlanillaGerencialViewPage from './pages/payroll/views/PlanillaGerencialViewPage';
import PlanillaServiciosProfesionalesViewPage from './pages/payroll/views/PlanillaServiciosProfesionalesViewPage';
import PlanillaVariableConstruccionViewPage from './pages/payroll/views/PlanillaVariableConstruccionViewPage';
import PlanillaTotalViewPage from './pages/payroll/views/PlanillaTotalViewPage';
import CobrosDashboard from './pages/CobrosDashboard';
import RegistrarPagoPage from './pages/cobros/RegistrarPagoPage';
import HistorialPagosPage from './pages/cobros/HistorialPagosPage';
import EstadoCuentaPage from './pages/cobros/EstadoCuentaPage';
import ReporteAntiguedadPage from './pages/cobros/ReporteAntiguedadPage';
import EstudiosPermisosTablePage from './pages/EstudiosPermisosTablePage';
import CostoDirectoTablePage from './pages/costo_directo/CostoDirectoTablePage';
import CostoDirectoViewPage from './pages/costo_directo/CostoDirectoViewPage';
import PagosTierraTablePage from './pages/PagosTierraTablePage';
import PagosTierraViewPage from './pages/PagosTierraViewPage';
import ClientesPage from './pages/ClientesPage';
import MarketingProyectosPage from './pages/MarketingProyectosPage';
import ManageEmpresasPage from './pages/admin/ManageEmpresasPage';
import AnaliticaAvanzadaPage from './pages/AnaliticaAvanzadaPage';
import CashFlowsMercadeoPage from './pages/CashFlowsMercadeoPage';
import EstudiosPermisosViewPage from './pages/EstudiosPermisosViewPage';
import EgresosPreliminaresPage from './pages/EgresosPreliminaresPage';
import FlujoCajaConsolidadoPage from './pages/FlujoCajaConsolidadoPage';
import GestionarProyectosPage from './pages/admin/GestionarProyectosPage';
import FlujosCostosDirectosPage from './pages/FlujosCostosDirectosPage';
import ProjectPayrollAssignmentsPage from './pages/ProjectPayrollAssignmentsPage';
import FlujoPlanillasFijasPage from './pages/payroll/FlujoPlanillasFijasPage';
import FlujoPlanillasVariablesPage from './pages/payroll/FlujoPlanillasVariablesPage';
import FlujoServiciosProfesionalesPage from './pages/payroll/FlujoServiciosProfesionalesPage';
import DashboardContabilidadPage from './pages/DashboardContabilidad';
import FlujoPublicidadPage from './pages/FlujoMarketingPage';
import DashboardEjecutivoGastosPage from './pages/analitica/DashboardEjecutivoGastosPage';
import AnalisisCategoriaGastosPage from './pages/analitica/AnalisisCategoriaGastosPage';
import AlertasPresupuestoPage from './pages/analitica/AlertasPresupuestoPage';
import PlanillasConsolidadoPage from './pages/analitica/PlanillasConsolidadoPage';
import PlanillasTendenciasPage from './pages/analitica/PlanillasTendenciasPage';
import FlujoCajaMaestroPage from './pages/FlujoCajaMaestroPage';
import ScenarioProjectsPage from './pages/admin/ScenarioProjectsPage';
import ScenarioProjectDetailPage from './pages/admin/ScenarioProjectDetailPage';

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { user } = useAuth();
  const isAuthenticated = !!user;

  return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={isAuthenticated ? <ProtectedRoute><AdminDashboard /></ProtectedRoute> : <Navigate to="/login" />}
        />
      <Route path="/mercadeo-dashboard" element={<ProtectedRoute><DashboardMercadeo /></ProtectedRoute>} />
      <Route path="/miscelaneos" element={<ProtectedRoute><MiscelaneosTablePage /></ProtectedRoute>} />
      <Route path="/proveedores" element={<ProtectedRoute><ProveedoresPage /></ProtectedRoute>} />
      <Route path="/vista-proveedores" element={<ProtectedRoute><VistaProveedoresPage /></ProtectedRoute>} />
      <Route path="/admin/vendedores" element={<ProtectedRoute><VendedoresPage /></ProtectedRoute>} />
        <Route
          path="/categories"
        element={<ProtectedRoute><Categories /></ProtectedRoute>}
        />
        <Route
          path="/cash-flows/:project?"
        element={<ProtectedRoute><CashFlows /></ProtectedRoute>}
        />
        <Route
          path="/cash-flows"
        element={<Navigate to="/cash-flows/chepo" replace />}
        />
        <Route path="/cash-flows/mercadeo" element={<ProtectedRoute><CashFlows /></ProtectedRoute>} />
        <Route path="/cash-flows/egresos-preliminares" element={<ProtectedRoute><EgresosPreliminaresPage /></ProtectedRoute>} />
        <Route path="/cash-flows/consolidado" element={<ProtectedRoute><FlujoCajaConsolidadoPage /></ProtectedRoute>} />
        <Route path="/cash-flows/costos-directos" element={<ProtectedRoute><FlujosCostosDirectosPage /></ProtectedRoute>} />
        <Route path="/flujo-caja-maestro" element={<ProtectedRoute><FlujoCajaMaestroPage /></ProtectedRoute>} />
        <Route path="/marketing-budget"
        element={<ProtectedRoute><MarketingBudget /></ProtectedRoute>}
        />
        <Route
          path="/marketing-budget/tablas"
        element={<ProtectedRoute><MarketingTables /></ProtectedRoute>}
        />
        <Route path="/marketing-budget-tanara"
        element={<ProtectedRoute><MarketingBudgetTanara /></ProtectedRoute>}

        />
        <Route
          path="/marketing-tables"
        element={<ProtectedRoute><MarketingTables /></ProtectedRoute>}
        />
        <Route
          path="/tables/:tableName"
        element={<ProtectedRoute><TableViewer /></ProtectedRoute>}
        />
        <Route
          path="/marketing-budget-tanara/tablas"
        element={<ProtectedRoute><MarketingTables /></ProtectedRoute>}
      />
      <Route
        path="/project-view/:pid/tables"
        element={<ProtectedRoute><ProjectTablesRouteWrapper /></ProtectedRoute>}
        />
        <Route
        path="/marketing-budget/:projectId/vistas"
        element={<ProtectedRoute><ProjectViews /></ProtectedRoute>}
        />
        <Route
        path="/marketing-budget/:projectId/tablas"
        element={<ProtectedRoute><ProjectTables /></ProtectedRoute>}
      />
      <Route path="/ventas-dashboard"
        element={<ProtectedRoute><VentasDashboard /></ProtectedRoute>}
        />
      <Route path="/ventas/gestionar-tabla-comisiones"
        element={<ProtectedRoute><GestionarTablaComisiones /></ProtectedRoute>} 
      />
      <Route path="/ventas/vista/comisiones-vendedores"
        element={<ProtectedRoute><VistaComisionesVendedores /></ProtectedRoute>}
      />
      <Route path="/ventas/gestionar-proyeccion-flujo"
        element={<ProtectedRoute><GestionarProyeccionVentas /></ProtectedRoute>}
      />
      <Route path="/ventas/vista/flujo-efectivo" element={<ProtectedRoute><GestionarProyeccionVentas /></ProtectedRoute>} />
      <Route path="/reporte-marketing" element={<ProtectedRoute><ReporteMarketingPage /></ProtectedRoute>} />
      <Route path="/presupuesto-marketing" element={<ProtectedRoute><MarketingBudget /></ProtectedRoute>} />
        <Route
          path="/project/:projectId/tablas"
        element={<ProtectedRoute><ProjectTables /></ProtectedRoute>}
        />
        <Route path="/dashboard-contabilidad" element={<ProtectedRoute><DashboardContabilidadPage /></ProtectedRoute>} />
        <Route path="/dashboard-contabilidad/presupuesto_gastos_fijos_operativos" element={<ProtectedRoute><PresupuestoGastosFijosOperativosPage /></ProtectedRoute>} />
        <Route path="/contabilidad/gestionar-presupuesto-gastos" element={<ProtectedRoute><GestionarPresupuestoGastosPage /></ProtectedRoute>} />
        <Route path="/contabilidad/cuenta-proyectos" element={<ProtectedRoute><CuentaProyectosPage /></ProtectedRoute>} />
        <Route path="/contabilidad/entradas-diario-proyecto" element={<ProtectedRoute><EntradasDiarioProyectoPage /></ProtectedRoute>} />
        <Route path="/dashboard-contabilidad/vista/gastos-fijos-con-totales" element={<ProtectedRoute><VistaGastosFijosConTotalesPage /></ProtectedRoute>} />
        <Route path="/dashboard-contabilidad/vista/gastos-fijos-resumen" element={<ProtectedRoute><VistaGastosFijosResumenPage /></ProtectedRoute>} />
        <Route path="/contabilidad/flujo-general-empresa" element={<ProtectedRoute><FlujoGeneralEmpresaPage /></ProtectedRoute>} />
        <Route path="/contabilidad/consultores/tables" element={<ProtectedRoute><ConsultoresTablePage /></ProtectedRoute>} />
        <Route path="/contabilidad/consultores/view" element={<ProtectedRoute><ConsultoresViewPage /></ProtectedRoute>} />
        <Route path="/payroll/tables-dashboard" element={<ProtectedRoute><PayrollTablesDashboardPage /></ProtectedRoute>} />
        <Route path="/payroll/views-dashboard" element={<ProtectedRoute><PayrollViewsDashboardPage /></ProtectedRoute>} />
        <Route path="/dashboard/lineas_credito" element={<ProtectedRoute><LineasCreditoPage /></ProtectedRoute>} />
        <Route path="/dashboard/cash-flow-lineas-credito" element={<ProtectedRoute><CashFlowLineasCreditoPage /></ProtectedRoute>} />
        <Route path="/payroll/tables/administracion" element={<ProtectedRoute><PlanillaAdministracionTablePage /></ProtectedRoute>} />
        <Route path="/payroll/tables/fija-construccion" element={<ProtectedRoute><PlanillaFijaConstruccionTablePage /></ProtectedRoute>} />
        <Route path="/payroll/tables/gerencial" element={<ProtectedRoute><PlanillaGerencialTablePage /></ProtectedRoute>} />
        <Route path="/payroll/tables/servicio-profesionales" element={<ProtectedRoute><PlanillaServicioProfesionalesTablePage /></ProtectedRoute>} />
        <Route path="/payroll/tables/variable-construccion" element={<ProtectedRoute><PlanillaVariableConstruccionTablePage /></ProtectedRoute>} />
        <Route path="/payroll/views/administracion" element={<ProtectedRoute><PlanillaAdministracionViewPage /></ProtectedRoute>} />
        <Route path="/payroll/views/fija-construccion" element={<ProtectedRoute><PlanillaFijaConstruccionViewPage /></ProtectedRoute>} />
        <Route path="/payroll/views/gerencial" element={<ProtectedRoute><PlanillaGerencialViewPage /></ProtectedRoute>} />
        <Route path="/payroll/views/servicio-profesionales" element={<ProtectedRoute><PlanillaServiciosProfesionalesViewPage /></ProtectedRoute>} />
        <Route path="/payroll/views/variable-construccion" element={<ProtectedRoute><PlanillaVariableConstruccionViewPage /></ProtectedRoute>} />
        <Route path="/payroll/views/total" element={<ProtectedRoute><PlanillaTotalViewPage /></ProtectedRoute>} />
        <Route path="/cobros-dashboard" element={<ProtectedRoute><CobrosDashboard /></ProtectedRoute>} />
        <Route path="/cobros/registrar-pago" element={<ProtectedRoute><RegistrarPagoPage /></ProtectedRoute>} />
        <Route path="/cobros/historial-pagos" element={<ProtectedRoute><HistorialPagosPage /></ProtectedRoute>} />
        <Route path="/cobros/estado-cuenta" element={<ProtectedRoute><EstadoCuentaPage /></ProtectedRoute>} />
        <Route path="/cobros/reporte-antiguedad" element={<ProtectedRoute><ReporteAntiguedadPage /></ProtectedRoute>} />
        <Route path="/estudios-disenos-permisos/table" element={<ProtectedRoute><EstudiosPermisosTablePage /></ProtectedRoute>} />
        <Route path="/costo-directo/table" element={<ProtectedRoute><CostoDirectoTablePage /></ProtectedRoute>} />
        <Route path="/costo-directo/view" element={<ProtectedRoute><CostoDirectoViewPage /></ProtectedRoute>} />
        <Route path="/pagos-tierra/table" element={<ProtectedRoute><PagosTierraTablePage /></ProtectedRoute>} />
        <Route path="/pagos-tierra/view" element={<ProtectedRoute><PagosTierraViewPage /></ProtectedRoute>} />
        <Route path="/admin/manage-clientes" element={<ProtectedRoute><ClientesPage /></ProtectedRoute>} />
        <Route path="/admin/marketing-proyectos" element={<ProtectedRoute><MarketingProyectosPage /></ProtectedRoute>} />
        <Route path="/admin/manage-empresas" element={<ProtectedRoute><ManageEmpresasPage /></ProtectedRoute>} />
        <Route path="/admin/gestionar-proyectos" element={<ProtectedRoute><GestionarProyectosPage /></ProtectedRoute>} />
        <Route path="/admin/scenario-projects" element={<ProtectedRoute><ScenarioProjectsPage /></ProtectedRoute>} />
        <Route path="/admin/scenario-projects/:id" element={<ProtectedRoute><ScenarioProjectDetailPage /></ProtectedRoute>} />
        <Route path="/admin/analitica-avanzada" element={<ProtectedRoute><AnaliticaAvanzadaPage /></ProtectedRoute>} />
        <Route path="/analitica/dashboard-gastos-ejecutivo" element={<ProtectedRoute><DashboardEjecutivoGastosPage /></ProtectedRoute>} />
        <Route path="/analitica/categoria-gastos" element={<ProtectedRoute><AnalisisCategoriaGastosPage /></ProtectedRoute>} />
        <Route path="/analitica/alertas-presupuesto" element={<ProtectedRoute><AlertasPresupuestoPage /></ProtectedRoute>} />
        <Route path="/analitica/planillas-consolidado" element={<ProtectedRoute><PlanillasConsolidadoPage /></ProtectedRoute>} />
        <Route path="/analitica/planillas-tendencias" element={<ProtectedRoute><PlanillasTendenciasPage /></ProtectedRoute>} />
        <Route path="/estudios-permisos/view" element={<ProtectedRoute><EstudiosPermisosViewPage /></ProtectedRoute>} />
        <Route path="/payroll/assign-project-payroll" element={<ProtectedRoute><ProjectPayrollAssignmentsPage /></ProtectedRoute>} />
        <Route path="/payroll/flujo-planillas-fijas" element={<ProtectedRoute><FlujoPlanillasFijasPage /></ProtectedRoute>} />
        <Route path="/payroll/flujo-planillas-variables" element={<ProtectedRoute><FlujoPlanillasVariablesPage /></ProtectedRoute>} />
        <Route path="/payroll/flujo-servicios-profesionales" element={<ProtectedRoute><FlujoServiciosProfesionalesPage /></ProtectedRoute>} />
        <Route path="/flujo-publicidad" element={<ProtectedRoute><FlujoPublicidadPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
  );
}

const ProjectTablesRouteWrapper = () => {
  const { pid } = useParams<{ pid: string }>();
  console.log('[App.tsx] ProjectTablesRouteWrapper rendered with pid:', pid);

  return <ProjectTables />;
};

export default App;
