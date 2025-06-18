# backend/app/models.py
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Text, Numeric, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import text
from .database import Base
from datetime import datetime, date

# --- User and Auth ---
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    department = Column(String, nullable=True)

# --- Sales and Commissions ---
class PlantillaComisiones(Base):
    """
    Represents the plantilla_comisiones_template table.
    The monthly 'amount_YYYY_MM' columns are dynamic and not mapped by the ORM.
    """
    __tablename__ = "plantilla_comisiones_template"
    id = Column(Integer, primary_key=True, index=True)
    concepto = Column(String, nullable=False)  # Commission concept/description
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Vendedor(Base):
    __tablename__ = "vendedores"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True, nullable=False)

# --- Dynamic Cash Flow / Budget Tables ---
# These models define only the STATIC columns.
# The 'amount_YYYY_MM' columns will be created and queried dynamically.

class ProyeccionFlujoEfectivoVentas(Base):
    """
    Represents the proyeccion_flujo_efectivo_ventas table.
    The monthly columns are dynamic and not mapped by the ORM.
    """
    __tablename__ = "proyeccion_flujo_efectivo_ventas"
    id = Column(Integer, primary_key=True, index=True)
    actividad = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class EstudiosPermisosTable(Base):
    """
    Represents the estudios_disenos_permisos table.
    The monthly 'amount_YYYY_MM' columns are dynamic and not mapped by the ORM.
    """
    __tablename__ = 'estudios_disenos_permisos'
    id = Column(Integer, primary_key=True, index=True)
    actividad = Column(String(255), nullable=False)
    created_at = Column(DateTime, server_default=text('CURRENT_TIMESTAMP'))
    updated_at = Column(DateTime, server_default=text('CURRENT_TIMESTAMP'), onupdate=text('CURRENT_TIMESTAMP'))

class PagosTierraTable(Base):
    """
    Represents the pagos_tierra table.
    The monthly 'amount_YYYY_MM' columns are dynamic and not mapped by the ORM.
    """
    __tablename__ = 'pagos_tierra'
    id = Column(Integer, primary_key=True, index=True)
    actividad = Column(String(255), nullable=False)
    created_at = Column(DateTime, server_default=text('CURRENT_TIMESTAMP'))
    updated_at = Column(DateTime, server_default=text('CURRENT_TIMESTAMP'), onupdate=text('CURRENT_TIMESTAMP'))


# --- Accounting and Costs ---
class LedgerEntryDB(Base):
    __tablename__ = "ledger_entries"
    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(String, index=True, nullable=True)
    account_description = Column(String, nullable=True)
    entry_date = Column(Date, index=True)
    reference = Column(String, nullable=True)
    journal = Column(String, nullable=True)
    transaction_description = Column(String, index=True)
    debit_amount = Column(Numeric(10, 2), nullable=True)
    credit_amount = Column(Numeric(10, 2), nullable=True)
    balance = Column(Numeric(10, 2), nullable=True)
    project_name = Column(String, index=True, nullable=True)

class AdministrativeCostDB(Base):
    __tablename__ = "administrative_costs"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    account_id = Column(Text, index=True, nullable=True)
    account_description = Column(Text, nullable=True)
    entry_date = Column(Date, index=True, nullable=False)
    reference = Column(Text, nullable=True)
    journal = Column(Text, nullable=True)
    transaction_description = Column(Text, index=True, nullable=False)
    debit_amount = Column(Numeric(12, 2), nullable=True)
    credit_amount = Column(Numeric(12, 2), nullable=True)
    balance = Column(Numeric(12, 2), nullable=True)

class CostoDirectoTable(Base):
    __tablename__ = "costo_directo"
    id = Column(Integer, primary_key=True, index=True)
    actividad = Column(String, nullable=False)
    infraestructura = Column(Numeric(12, 2), default=0.00)
    materiales = Column(Numeric(12, 2), default=0.00)
    mo = Column(Numeric(12, 2), default=0.00)
    equipos = Column(Numeric(12, 2), default=0.00)
    total = Column(Numeric(12, 2))
    proyecto = Column(String, nullable=False, default="General")

class CostoXVivienda(Base):
    __tablename__ = "costo_x_vivienda"
    id = Column(Integer, primary_key=True, index=True)
    viviendas = Column(Integer)
    materiales = Column(Numeric(12, 2))
    mo = Column(Numeric(12, 2))
    otros = Column(Numeric(12, 2))
    proyecto = Column(String, nullable=False, default="General")

class MiscelaneosTable(Base):
    __tablename__ = 'miscelaneos_miscelaneos'
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    concepto = Column(Text, nullable=False, unique=True)
    monto = Column(Numeric(15, 2), default=0.00)


# --- Clients and Payments ---
class Cliente(Base):
    __tablename__ = "clientes"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True, unique=True, nullable=False)
    ruc = Column(String, index=True, unique=True, nullable=True)
    email = Column(String, index=True, unique=True, nullable=True)
    telefono = Column(String, nullable=True)
    numero_cedula = Column(String, index=True, unique=True, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Pago(Base):
    __tablename__ = "pagos"
    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), index=True, nullable=False)
    proyecto_keyword = Column(String, index=True, nullable=True)
    monto = Column(Numeric(15, 2), nullable=False)
    fecha_pago = Column(Date, nullable=False, index=True)
    metodo_pago = Column(String, nullable=False)
    referencia = Column(String, nullable=True)
    notas = Column(Text, nullable=True)
    origen_pago = Column(String, nullable=True)
    monto_abono_linea_credito = Column(Numeric(15, 2), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    cliente = relationship("Cliente")


# --- Credit Lines ---
class LineaCredito(Base):
    __tablename__ = "lineas_credito"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(255), nullable=False)
    fecha_inicio = Column(Date, nullable=False)
    monto_total_linea = Column(Numeric(15, 2), nullable=False)
    monto_disponible = Column(Numeric(15, 2), nullable=False)
    fecha_fin = Column(Date, nullable=False)
    interest_rate = Column(Numeric(5, 2), nullable=True)
    es_revolvente = Column(Boolean, default=False, nullable=True)  # Deprecated, kept for backward compatibility
    tipo_linea = Column(String(50), default="LINEA_CREDITO", nullable=False)  # New field for different credit line types
    cargos_apertura = Column(Numeric(15, 2), nullable=True)
    
    # Campos específicos para diferentes tipos de línea
    plazo_meses = Column(Integer, nullable=True)  # Para préstamos a término fijo
    periodicidad_pago = Column(String(20), nullable=True)  # MENSUAL, TRIMESTRAL, SEMESTRAL, ANUAL
    valor_activo = Column(Numeric(15, 2), nullable=True)  # Para leasing: valor del activo
    valor_residual = Column(Numeric(15, 2), nullable=True)  # Para leasing: valor residual
    porcentaje_financiamiento = Column(Numeric(5, 2), nullable=True)  # Para factoring: % sobre facturas
    garantia_tipo = Column(String(100), nullable=True)  # Tipo de garantía (hipotecaria, vehicular, etc.)
    garantia_descripcion = Column(Text, nullable=True)  # Descripción de la garantía
    limite_sobregiro = Column(Numeric(15, 2), nullable=True)  # Para sobregiros
    moneda = Column(String(10), default="USD", nullable=False)  # Moneda de la línea
    
    # Campos para carta de crédito
    beneficiario = Column(String(255), nullable=True)  # Para carta de crédito
    banco_emisor = Column(String(255), nullable=True)  # Banco emisor
    documento_respaldo = Column(String(255), nullable=True)  # Tipo de documento que respalda
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    usos = relationship("LineaCreditoUso", back_populates="linea_credito", cascade="all, delete-orphan")

class LineaCreditoUso(Base):
    __tablename__ = "linea_credito_usos"
    id = Column(Integer, primary_key=True, index=True)
    linea_credito_id = Column(Integer, ForeignKey("lineas_credito.id", ondelete="CASCADE"), nullable=False)
    pago_id = Column(Integer, ForeignKey("pagos.id", ondelete="SET NULL"), nullable=True, index=True)
    fecha_uso = Column(Date, nullable=False)
    monto_usado = Column(Numeric(15, 2), nullable=False)
    tipo_transaccion = Column(String(50), nullable=False)
    descripcion = Column(Text, nullable=True)
    cargo_transaccion = Column(Numeric(15,2), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    linea_credito = relationship("LineaCredito", back_populates="usos")
    pago = relationship("Pago")


# --- Suppliers ---
class EstadoCuentaProveedores(Base):
    __tablename__ = 'estado_cuenta_proveedores'
    id = Column(Integer, primary_key=True, index=True)
    proveedor = Column(String(255), nullable=False)
    empresa_credito = Column(String(255))
    dias_0_30 = Column(Numeric(15, 2))
    dias_30_60 = Column(Numeric(15, 2))
    dias_61_90 = Column(Numeric(15, 2))
    dias_91_mas = Column(Numeric(15, 2))

class SaldoProveedores(Base):
    __tablename__ = 'saldo_proveedores_de_material_cc_favor_'
    id = Column(Integer, primary_key=True, index=True)
    proveedor = Column(String(255), nullable=False)
    saldo_a_favor = Column(Numeric(15, 2))


# --- Payroll and Consultants ---
class PlanillaAdministracion(Base):
    __tablename__ = "planilla_administracion"
    nombre = Column("NOMBRE", String(255), primary_key=True, index=True)
    horas = Column("Horas", Integer, nullable=False)
    sal_bruto = Column("Sal. Bruto", Numeric(10, 2), nullable=False)
    i_s_r = Column("I.S.R.", Numeric(10, 2))
    otros_desc = Column("Otros Desc.", Numeric(10, 2))

class PlanillaFijaConstruccion(Base):
    __tablename__ = "planilla_fija_construccion"
    nombre = Column("NOMBRE", String(255), primary_key=True, index=True)
    rata_x_h = Column("RATA_X_H", Numeric(10, 4), nullable=False)
    horas_regulares = Column("HORAS_REGULARES", Numeric(10, 2), nullable=False)
    actividad = Column("ACTIVIDAD", String(255))
    horas_ext_1_25 = Column("HORAS_EXT_1_25", Numeric(10, 2))
    horas_ext_1_5 = Column("HORAS_EXT_1_5", Numeric(10, 2))
    horas_ext_2_0 = Column("HORAS_EXT_2_0", Numeric(10, 2))
    i_renta = Column("I_RENTA", Numeric(10, 2))

class PlanillaGerencial(Base):
    __tablename__ = "planilla_gerencial"
    nombre = Column("NOMBRE", String(255), primary_key=True, index=True)
    salario = Column("SALARIO", Numeric(10, 2))

class PlanillaServicioProfesionales(Base):
    __tablename__ = "planilla_servicio_profesionales"
    nombre = Column("NOMBRE", String(255), primary_key=True, index=True)
    salario_quincenal = Column("SALARIO QUINCENAL", Numeric(10, 2))
    hras_xtras = Column("HRAS. XTRAS", Numeric(10, 2))
    otros_salarios = Column("OTROS SALARIOS", Numeric(10, 2))
    descuentos = Column("DESCUENTOS", Numeric(10, 2))
    observaciones = Column("OBSERVACIONES", String(255))

class PlanillaVariableConstruccion(Base):
    __tablename__ = "planilla_variable_construccion"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column("NOMBRE", String(255), unique=True, index=True, nullable=False)
    rata_x_h = Column("RATA_X_H", Numeric(10, 4), nullable=False)
    horas_regulares = Column("HORAS_REGULARES", Numeric(10, 2), nullable=False)
    actividad = Column("ACTIVIDAD", String(255))
    horas_ext_1_25 = Column("HORAS_EXT_1_25", Numeric(10, 2))
    horas_ext_1_5 = Column("HORAS_EXT_1_5", Numeric(10, 2))
    horas_ext_2_0 = Column("HORAS_EXT_2_0", Numeric(10, 2))
    i_renta = Column("I_RENTA", Numeric(10, 2))
    proyecto = Column(String, nullable=False, default="Chepo")

class NombresConsultores(Base):
    __tablename__ = "nombres_consultores"
    nombre = Column(String(255), primary_key=True)

class CostoConsultores(Base):
    __tablename__ = "costo_consultores"
    consultor = Column(String(255), ForeignKey('nombres_consultores.nombre'), primary_key=True)
    fecha = Column(Date, primary_key=True)
    costo = Column(Numeric(10, 2))

class InfraestructuraPago(Base):
    __tablename__ = "infraestructura_pagos"
    id = Column(Integer, primary_key=True, index=True)
    proyecto = Column(String, nullable=False)
    tipo = Column(String, nullable=False)  # 'material' or 'mano_obra'
    monto = Column(Numeric(15, 2), nullable=False)
    mes = Column(Integer, nullable=False)  # 1-12
    detalles = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class ViviendaPago(Base):
    __tablename__ = "vivienda_pagos"
    id = Column(Integer, primary_key=True, index=True)
    proyecto = Column(String, nullable=False)
    tipo = Column(String, nullable=False)  # 'material' or 'mano_obra'
    monto = Column(Numeric(15, 2), nullable=False)
    mes = Column(Integer, nullable=False)  # 1-12
    detalles = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class ProyectoVariablePayroll(Base):
    __tablename__ = "proyecto_variable_payroll"
    id = Column(Integer, primary_key=True, index=True)
    proyecto = Column(String, nullable=False)
    start_month = Column(String, nullable=False)  # e.g. '2024_07'
    end_month = Column(String, nullable=False)    # e.g. '2025_06'
    is_active = Column(Boolean, default=True)

class Proyecto(Base):
    __tablename__ = "proyectos"
    id = Column(Integer, primary_key=True, index=True)
    keyword = Column(String, unique=True, nullable=False, index=True)  # e.g. 'chepo', 'tanara'
    display_name = Column(String, nullable=False)  # e.g. 'Proyecto Chepo'
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class GastoCategorizado(Base):
    __tablename__ = "gastos_categorizados"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    date = Column(Date, nullable=True)
    reference = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    debit = Column(Numeric(15, 2), nullable=True)
    credit = Column(Numeric(15, 2), nullable=True)
    category = Column(String(255), nullable=True)

# --- Flujo de Caja Maestro ---
class FlujoCajaMaestro(Base):
    """
    Tabla maestra centralizada para todos los flujos de caja de la empresa.
    Reemplaza el sistema fragmentado de múltiples tablas de flujo.
    """
    __tablename__ = "flujo_caja_maestro"
    
    # Identificación
    id = Column(Integer, primary_key=True, index=True)
    
    # Clasificación jerárquica
    categoria_principal = Column(String(50), nullable=False)     # 'INGRESOS', 'EGRESOS'
    categoria_secundaria = Column(String(100), nullable=False)   # 'Ventas', 'Marketing', 'Nómina', etc.
    subcategoria = Column(String(100))                          # Detalle específico
    concepto = Column(String(255), nullable=False)              # Descripción del item
    
    # Dimensiones de negocio
    proyecto = Column(String(100))                              # Proyecto específico (si aplica)
    centro_costo = Column(String(100))                          # Centro de costo
    area_responsable = Column(String(100))                      # Área responsable
    
    # Datos temporales
    fecha_registro = Column(Date, nullable=False, default=date.today)
    periodo_inicio = Column(Date, nullable=False)               # Inicio del período de impacto
    periodo_fin = Column(Date)                                  # Fin del período (NULL para eventos únicos)
    
    # Datos financieros
    moneda = Column(String(3), nullable=False, default='USD')
    monto_base = Column(Numeric(15, 2), nullable=False)         # Monto base del concepto
    
    # Distribución temporal (JSON para flexibilidad)
    distribucion_mensual = Column(JSONB)                        # {"2024_01": 1000, "2024_02": 1500, ...}
    
    # Metadatos
    tipo_registro = Column(String(20), nullable=False)          # 'REAL', 'PROYECTADO', 'PRESUPUESTADO'
    estado = Column(String(20), nullable=False, default='ACTIVO') # 'ACTIVO', 'INACTIVO', 'CANCELADO'
    origen_dato = Column(String(50))                            # Sistema/tabla de origen
    referencia_externa = Column(String(100))                    # ID en sistema origen
    
    # Campos de control
    usuario_creacion = Column(String(100))
    fecha_creacion = Column(DateTime, default=datetime.utcnow)
    usuario_modificacion = Column(String(100))
    fecha_modificacion = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# --- Scenario Project Models for Financial Modeling ---
class ScenarioProject(Base):
    """
    Proyectos de escenarios para modelado financiero de desarrollo inmobiliario.
    Cada proyecto permite construir modelos financieros completos con FCF, DCF, y análisis de viabilidad.
    """
    __tablename__ = "scenario_projects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    location = Column(String(255), nullable=True)  # Ubicación en Panamá
    status = Column(String(50), default="DRAFT", nullable=False)  # DRAFT, ACTIVE, COMPLETED, ARCHIVED
    
    # Características básicas del proyecto
    total_area_m2 = Column(Numeric(15, 2), nullable=True)  # Área total del terreno
    buildable_area_m2 = Column(Numeric(15, 2), nullable=True)  # Área construible
    total_units = Column(Integer, nullable=True)  # Total de unidades a construir
    avg_unit_size_m2 = Column(Numeric(10, 2), nullable=True)  # Tamaño promedio por unidad
    
    # Precios y parámetros de venta
    target_price_per_m2 = Column(Numeric(10, 2), nullable=True)  # Precio objetivo por m²
    expected_sales_period_months = Column(Integer, nullable=True)  # Período de ventas esperado
    
    # Parámetros financieros
    discount_rate = Column(Numeric(7, 4), default=0.12, nullable=False)  # Tasa de descuento para DCF
    inflation_rate = Column(Numeric(7, 4), default=0.03, nullable=False)  # Tasa de inflación
    contingency_percentage = Column(Numeric(7, 4), default=0.10, nullable=False)  # % de contingencia
    
    # Metadatos
    created_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    cost_items = relationship("ScenarioCostItem", back_populates="project", cascade="all, delete-orphan")
    cash_flows = relationship("ScenarioCashFlow", back_populates="project", cascade="all, delete-orphan")
    sensitivity_analyses = relationship("SensitivityAnalysis", back_populates="project", cascade="all, delete-orphan")

class CostCategory(Base):
    """
    Categorías de costos predefinidas para proyectos inmobiliarios en Panamá
    """
    __tablename__ = "cost_categories"
    
    id = Column(Integer, primary_key=True, index=True)
    categoria = Column(String(100), nullable=False)  # Terreno, Costos Duros, Costos Blandos, etc.
    subcategoria = Column(String(150), nullable=False)  # Adquisición, Construcción, etc.
    partida_costo = Column(String(255), nullable=False)  # Precio de Compra del Lote, etc.
    base_costo = Column(String(100), nullable=False)  # Monto Fijo, por m², por unidad, etc.
    
    # Parámetros para cálculo automático
    applies_to = Column(String(50), nullable=True)  # TERRENO, CONSTRUCCION, UNIT, TOTAL
    calculation_formula = Column(Text, nullable=True)  # Fórmula para cálculo automático
    
    # Control
    is_active = Column(Boolean, default=True)
    country_code = Column(String(3), default="PAN", nullable=False)  # Para localización
    created_at = Column(DateTime, default=datetime.utcnow)

class ScenarioCostItem(Base):
    """
    Items de costo específicos para cada proyecto de escenario
    """
    __tablename__ = "scenario_cost_items"
    
    id = Column(Integer, primary_key=True, index=True)
    scenario_project_id = Column(Integer, ForeignKey("scenario_projects.id", ondelete="CASCADE"), nullable=False)
    cost_category_id = Column(Integer, ForeignKey("cost_categories.id"), nullable=True)
    
    # Información del item de costo
    categoria = Column(String(100), nullable=False)
    subcategoria = Column(String(150), nullable=False)
    partida_costo = Column(String(255), nullable=False)
    base_costo = Column(String(100), nullable=False)
    
    # Montos
    monto_proyectado = Column(Numeric(15, 2), nullable=True)
    monto_real = Column(Numeric(15, 2), nullable=True)
    
    # Parámetros para cálculos dinámicos
    unit_cost = Column(Numeric(15, 2), nullable=True)  # Costo por unidad base
    quantity = Column(Numeric(15, 2), nullable=True)  # Cantidad
    percentage_of_base = Column(Numeric(7, 4), nullable=True)  # % sobre otra base
    base_reference = Column(String(100), nullable=True)  # Referencia para % (e.g., "COSTOS_DUROS")
    
    # Timing
    start_month = Column(Integer, nullable=True)  # Mes de inicio (1-based)
    duration_months = Column(Integer, nullable=True)  # Duración en meses
    
    # Control
    is_active = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    project = relationship("ScenarioProject", back_populates="cost_items")
    category = relationship("CostCategory")

class ScenarioCashFlow(Base):
    """
    Flujo de caja mensual para proyectos de escenario
    """
    __tablename__ = "scenario_cash_flows"
    
    id = Column(Integer, primary_key=True, index=True)
    scenario_project_id = Column(Integer, ForeignKey("scenario_projects.id", ondelete="CASCADE"), nullable=False)
    
    # Período
    year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False)  # 1-12
    period_label = Column(String(20), nullable=False)  # YYYY-MM
    
    # Flujos de efectivo
    ingresos_ventas = Column(Numeric(15, 2), default=0.00)
    ingresos_otros = Column(Numeric(15, 2), default=0.00)
    total_ingresos = Column(Numeric(15, 2), default=0.00)
    
    # Egresos por categoría
    costos_terreno = Column(Numeric(15, 2), default=0.00)
    costos_duros = Column(Numeric(15, 2), default=0.00)
    costos_blandos = Column(Numeric(15, 2), default=0.00)
    costos_financiacion = Column(Numeric(15, 2), default=0.00)
    costos_marketing = Column(Numeric(15, 2), default=0.00)
    otros_egresos = Column(Numeric(15, 2), default=0.00)
    total_egresos = Column(Numeric(15, 2), default=0.00)
    
    # Métricas calculadas
    flujo_neto = Column(Numeric(15, 2), default=0.00)
    flujo_acumulado = Column(Numeric(15, 2), default=0.00)
    flujo_descontado = Column(Numeric(15, 2), default=0.00)  # Para NPV
    
    # Control
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    project = relationship("ScenarioProject", back_populates="cash_flows")

class SensitivityAnalysis(Base):
    """
    Análisis de sensibilidad para proyectos de escenario
    """
    __tablename__ = "sensitivity_analyses"
    
    id = Column(Integer, primary_key=True, index=True)
    scenario_project_id = Column(Integer, ForeignKey("scenario_projects.id", ondelete="CASCADE"), nullable=False)
    
    # Configuración del análisis
    analysis_name = Column(String(255), nullable=False)
    variable_type = Column(String(100), nullable=False)  # PRICE_PER_M2, UNIT_SIZE, CONSTRUCTION_COST, etc.
    base_value = Column(Numeric(15, 2), nullable=False)
    
    # Rangos de análisis
    min_variation_pct = Column(Numeric(5, 2), default=-30.00)  # -30%
    max_variation_pct = Column(Numeric(5, 2), default=30.00)   # +30%
    steps = Column(Integer, default=13)  # Número de pasos en el análisis
    
    # Resultados (JSONB para flexibilidad)
    results = Column(JSONB, nullable=True)  # Resultados del análisis
    
    # Métricas de salida
    base_npv = Column(Numeric(15, 2), nullable=True)
    base_irr = Column(Numeric(7, 4), nullable=True)
    base_payback_months = Column(Integer, nullable=True)
    
    # Control
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    project = relationship("ScenarioProject", back_populates="sensitivity_analyses")

class ProjectFinancialMetrics(Base):
    """
    Métricas financieras calculadas para proyectos de escenario
    """
    __tablename__ = "project_financial_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    scenario_project_id = Column(Integer, ForeignKey("scenario_projects.id", ondelete="CASCADE"), nullable=False, unique=True)
    
    # Métricas de rentabilidad
    total_investment = Column(Numeric(15, 2), nullable=True)
    total_revenue = Column(Numeric(15, 2), nullable=True)
    total_profit = Column(Numeric(15, 2), nullable=True)
    profit_margin_pct = Column(Numeric(5, 2), nullable=True)
    
    # Métricas DCF
    npv = Column(Numeric(15, 2), nullable=True)  # Valor Presente Neto
    irr = Column(Numeric(7, 4), nullable=True)   # Tasa Interna de Retorno
    payback_months = Column(Integer, nullable=True)  # Período de recuperación
    profitability_index = Column(Numeric(7, 4), nullable=True)  # Índice de rentabilidad
    
    # Métricas por unidad
    cost_per_unit = Column(Numeric(15, 2), nullable=True)
    revenue_per_unit = Column(Numeric(15, 2), nullable=True)
    profit_per_unit = Column(Numeric(15, 2), nullable=True)
    
    # Métricas por m²
    cost_per_m2 = Column(Numeric(10, 2), nullable=True)
    revenue_per_m2 = Column(Numeric(10, 2), nullable=True)
    profit_per_m2 = Column(Numeric(10, 2), nullable=True)
    
    # Análisis de riesgo
    break_even_units = Column(Integer, nullable=True)
    break_even_price_per_m2 = Column(Numeric(10, 2), nullable=True)
    max_drawdown = Column(Numeric(15, 2), nullable=True)  # Máximo flujo negativo acumulado
    
    # Timestamps
    calculated_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relación
    project = relationship("ScenarioProject")

