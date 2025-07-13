# backend/app/models.py
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Text, Numeric, ForeignKey, Boolean, Index
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
    email = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String, nullable=False)
    department = Column(String, nullable=True)
    role = Column(String, default="user", nullable=False)  # user, admin
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

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

class GastosEquipoTable(Base):
    """
    Represents the gastos_equipo table.
    The monthly 'amount_YYYY_MM' columns are dynamic and not mapped by the ORM.
    """
    __tablename__ = 'gastos_equipo'
    id = Column(Integer, primary_key=True, index=True)
    concepto = Column(String(255), nullable=False)
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
    """
    Represents the miscelaneos table.
    The monthly 'amount_YYYY_MM' columns are dynamic and not mapped by the ORM.
    """
    __tablename__ = 'miscelaneos'
    id = Column(Integer, primary_key=True, index=True)
    concepto = Column(String(255), nullable=False)
    created_at = Column(DateTime, server_default=text('CURRENT_TIMESTAMP'))
    updated_at = Column(DateTime, server_default=text('CURRENT_TIMESTAMP'), onupdate=text('CURRENT_TIMESTAMP'))


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


# --- Project-Specific Credit Lines ---
class LineaCreditoProyecto(Base):
    """
    Líneas de crédito específicas para proyectos de escenario.
    Hereda toda la funcionalidad de las líneas tradicionales pero está vinculada a un proyecto específico.
    """
    __tablename__ = "lineas_credito_proyecto"
    
    id = Column(Integer, primary_key=True, index=True)
    scenario_project_id = Column(Integer, ForeignKey("scenario_projects.id", ondelete="CASCADE"), nullable=False)
    
    # Información básica (similar a LineaCredito)
    nombre = Column(String(255), nullable=False)
    fecha_inicio = Column(Date, nullable=False)
    monto_total_linea = Column(Numeric(15, 2), nullable=False)
    monto_disponible = Column(Numeric(15, 2), nullable=False)
    fecha_fin = Column(Date, nullable=False)
    interest_rate = Column(Numeric(5, 2), nullable=True)
    tipo_linea = Column(String(50), default="LINEA_CREDITO", nullable=False)
    cargos_apertura = Column(Numeric(15, 2), nullable=True)
    
    # Campos específicos para diferentes tipos de línea
    plazo_meses = Column(Integer, nullable=True)
    periodicidad_pago = Column(String(20), nullable=True)
    valor_activo = Column(Numeric(15, 2), nullable=True)
    valor_residual = Column(Numeric(15, 2), nullable=True)
    porcentaje_financiamiento = Column(Numeric(5, 2), nullable=True)
    garantia_tipo = Column(String(100), nullable=True)
    garantia_descripcion = Column(Text, nullable=True)
    limite_sobregiro = Column(Numeric(15, 2), nullable=True)
    moneda = Column(String(10), default="USD", nullable=False)
    
    # Campos para carta de crédito
    beneficiario = Column(String(255), nullable=True)
    banco_emisor = Column(String(255), nullable=True)
    documento_respaldo = Column(String(255), nullable=True)
    
    # Estado y control
    estado = Column(String(20), default="ACTIVA", nullable=False)  # ACTIVA, INACTIVA, CERRADA
    es_simulacion = Column(Boolean, default=True, nullable=False)  # True para proyectos en DRAFT
    
    # Metadatos
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    project = relationship("ScenarioProject", back_populates="credit_lines")
    usos = relationship("LineaCreditoProyectoUso", back_populates="linea_credito", cascade="all, delete-orphan")


class LineaCreditoProyectoUso(Base):
    """
    Usos de líneas de crédito específicas de proyecto
    """
    __tablename__ = "linea_credito_proyecto_usos"
    
    id = Column(Integer, primary_key=True, index=True)
    linea_credito_proyecto_id = Column(Integer, ForeignKey("lineas_credito_proyecto.id", ondelete="CASCADE"), nullable=False)
    
    # Información del uso
    fecha_uso = Column(Date, nullable=False)
    monto_usado = Column(Numeric(15, 2), nullable=False)
    tipo_transaccion = Column(String(50), nullable=False)  # DRAWDOWN, PAYMENT, INTEREST_PAYMENT
    descripcion = Column(Text, nullable=True)
    cargo_transaccion = Column(Numeric(15, 2), nullable=True)
    
    # Vinculación con costos del proyecto
    scenario_cost_item_id = Column(Integer, ForeignKey("scenario_cost_items.id"), nullable=True)
    project_unit_id = Column(Integer, ForeignKey('project_units.id', ondelete='SET NULL'), nullable=True)
    
    # Estado
    es_simulacion = Column(Boolean, default=True, nullable=False)
    
    # Metadatos
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    linea_credito = relationship("LineaCreditoProyecto", back_populates="usos")
    cost_item = relationship("ScenarioCostItem")


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
    status = Column(String(50), default="PLANNING", nullable=False)  # PLANNING, DRAFT, UNDER_REVIEW, APPROVED, ACTIVE, COMPLETED, ARCHIVED
    
    # Project timeline - Critical for cash flow modeling
    start_date = Column(Date, nullable=True)  # Fecha de inicio del proyecto
    end_date = Column(Date, nullable=True)    # Fecha de finalización del proyecto
    
    # New delivery period fields
    delivery_start_date = Column(Date, nullable=True)
    delivery_end_date = Column(Date, nullable=True)

    # Características básicas del proyecto
    total_area_m2 = Column(Numeric(15, 2), nullable=True)  # Área total del terreno
    buildable_area_m2 = Column(Numeric(15, 2), nullable=True)  # Área construible
    total_units = Column(Integer, nullable=True)  # Total de unidades a construir
    avg_unit_size_m2 = Column(Numeric(10, 2), nullable=True)  # Tamaño promedio por unidad
    
    # Precios y parámetros de venta
    target_price_per_m2 = Column(Numeric(10, 2), nullable=True)  # Precio objetivo por m²
    expected_sales_period_months = Column(Integer, nullable=True)  # To be deprecated
    
    # Parámetros financieros
    discount_rate = Column(Numeric(7, 4), default=0.12, nullable=False)  # Tasa de descuento para DCF
    inflation_rate = Column(Numeric(7, 4), default=0.03, nullable=False)  # Tasa de inflación
    contingency_percentage = Column(Numeric(7, 4), default=0.10, nullable=False)  # % de contingencia

    # New field for payment distribution configuration
    payment_distribution_config = Column(JSONB, nullable=True)

    # Metadatos
    created_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    cost_items = relationship("ScenarioCostItem", back_populates="project", cascade="all, delete-orphan")
    cash_flows = relationship("ScenarioCashFlow", back_populates="project", cascade="all, delete-orphan")
    sensitivity_analyses = relationship("SensitivityAnalysis", back_populates="project", cascade="all, delete-orphan")
    credit_lines = relationship("LineaCreditoProyecto", back_populates="project", cascade="all, delete-orphan", overlaps="project")
    units = relationship("ProjectUnit", back_populates="project", cascade="all, delete-orphan")
    stages = relationship("ProjectStage", back_populates="project", cascade="all, delete-orphan")

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

    def to_dict(self):
        """Converts the SQLAlchemy model instance to a dictionary."""
        return {
            "id": self.id,
            "scenario_project_id": self.scenario_project_id,
            "year": self.year,
            "month": self.month,
            "period_label": self.period_label,
            "ingresos_ventas": float(self.ingresos_ventas) if self.ingresos_ventas is not None else 0.0,
            "ingresos_otros": float(self.ingresos_otros) if self.ingresos_otros is not None else 0.0,
            "total_ingresos": float(self.total_ingresos) if self.total_ingresos is not None else 0.0,
            "costos_terreno": float(self.costos_terreno) if self.costos_terreno is not None else 0.0,
            "costos_duros": float(self.costos_duros) if self.costos_duros is not None else 0.0,
            "costos_blandos": float(self.costos_blandos) if self.costos_blandos is not None else 0.0,
            "costos_financiacion": float(self.costos_financiacion) if self.costos_financiacion is not None else 0.0,
            "costos_marketing": float(self.costos_marketing) if self.costos_marketing is not None else 0.0,
            "otros_egresos": float(self.otros_egresos) if self.otros_egresos is not None else 0.0,
            "total_egresos": float(self.total_egresos) if self.total_egresos is not None else 0.0,
            "flujo_neto": float(self.flujo_neto) if self.flujo_neto is not None else 0.0,
            "flujo_acumulado": float(self.flujo_acumulado) if self.flujo_acumulado is not None else 0.0,
            "flujo_descontado": float(self.flujo_descontado) if self.flujo_descontado is not None else 0.0,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

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
    profit_margin_pct = Column(Numeric(8, 2), nullable=True)
    
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


# --- Construction Quotation System Models ---
class ConstructionProject(Base):
    """
    Proyectos de construcción para el sistema de cotización.
    Similar a ScenarioProject pero enfocado en licitaciones y construcción.
    """
    __tablename__ = "construction_projects"
    
    id = Column(Integer, primary_key=True, index=True)
    project_name = Column(String(255), nullable=False, index=True)
    client_name = Column(String(255), nullable=False)
    client_contact = Column(String(255), nullable=True)
    client_email = Column(String(255), nullable=True)
    client_phone = Column(String(50), nullable=True)
    
    # Project details
    project_type = Column(String(100), nullable=True)  # Residencial, Comercial, Industrial, etc.
    location = Column(String(255), nullable=True)
    site_address = Column(Text, nullable=True)
    
    # Project scope and specifications
    description = Column(Text, nullable=True)
    scope_of_work = Column(Text, nullable=True)
    special_requirements = Column(Text, nullable=True)
    
    # Timeline
    bid_deadline = Column(DateTime, nullable=True)
    project_start_date = Column(Date, nullable=True)
    project_duration_days = Column(Integer, nullable=True)
    
    # Project metrics
    total_area_m2 = Column(Numeric(15, 2), nullable=True)
    total_floors = Column(Integer, nullable=True)
    total_units = Column(Integer, nullable=True)  # For residential projects
    
    # Cost factors
    location_cost_factor = Column(Numeric(5, 4), default=1.0000, nullable=False)  # Regional cost adjustment
    complexity_factor = Column(Numeric(5, 4), default=1.0000, nullable=False)  # Project complexity multiplier
    
    # Status and control
    status = Column(String(50), default="BIDDING", nullable=False)  
    # BIDDING, QUOTED, AWARDED, REJECTED, COMPLETED
    priority = Column(String(20), default="MEDIUM", nullable=False)  # HIGH, MEDIUM, LOW
    
    # Award information (when project is won)
    award_amount = Column(Numeric(15, 2), nullable=True)  # Final awarded amount
    award_date = Column(DateTime, nullable=True)  # Date project was awarded
    contract_duration_days = Column(Integer, nullable=True)  # Contract duration
    award_notes = Column(Text, nullable=True)  # Additional award information
    estimated_completion_date = Column(Date, nullable=True)  # When construction should complete
    
    # Documents and attachments
    plans_uploaded = Column(Boolean, default=False)
    specifications_received = Column(Boolean, default=False)
    site_visit_completed = Column(Boolean, default=False)
    
    # Metadata
    created_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    quotes = relationship("ConstructionQuote", back_populates="project", cascade="all, delete-orphan")
    takeoffs = relationship("ProjectTakeoff", back_populates="project", cascade="all, delete-orphan")
    cost_items = relationship("ConstructionCostItem", back_populates="project", cascade="all, delete-orphan")


class ConstructionCostItem(Base):
    """
    Items de costo para tracking específico de proyectos de construcción.
    Se crean cuando un proyecto es adjudicado y se transfieren desde la cotización ganadora.
    """
    __tablename__ = "construction_cost_items"
    
    id = Column(Integer, primary_key=True, index=True)
    construction_project_id = Column(Integer, ForeignKey("construction_projects.id", ondelete="CASCADE"), nullable=False)
    
    # Información del item de costo
    categoria = Column(String(100), nullable=False)  # CONSTRUCCION, MATERIALES, MANO_OBRA, etc.
    subcategoria = Column(String(150), nullable=False)  # GENERAL, ESTRUCTURAL, ACABADOS, etc.
    partida_costo = Column(String(255), nullable=False)  # Descripción del item
    base_costo = Column(String(100), nullable=False)  # Descripción base del costo
    
    # Montos proyectados vs reales
    monto_proyectado = Column(Numeric(15, 2), nullable=True)  # Monto de la cotización original
    monto_real = Column(Numeric(15, 2), nullable=True)  # Monto real gastado
    
    # Detalles de cantidad y costo unitario
    unit_cost = Column(Numeric(15, 2), nullable=True)  # Costo por unidad
    quantity = Column(Numeric(15, 2), nullable=True)  # Cantidad
    unit_of_measure = Column(String(20), nullable=True)  # Unidad de medida
    
    # Referencias a cotización original
    source_quote_id = Column(Integer, ForeignKey("construction_quotes.id"), nullable=True)
    source_line_item_id = Column(Integer, ForeignKey("quote_line_items.id"), nullable=True)
    
    # Control y estado
    is_active = Column(Boolean, default=True)
    status = Column(String(50), default="PLANNED", nullable=False)  # PLANNED, IN_PROGRESS, COMPLETED, CANCELLED
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    project = relationship("ConstructionProject", back_populates="cost_items")
    source_quote = relationship("ConstructionQuote")
    source_line_item = relationship("QuoteLineItem")


class CostItem(Base):
    """
    Items de costo base: materiales, mano de obra, equipos, subcontratos
    """
    __tablename__ = "cost_items"
    
    id = Column(Integer, primary_key=True, index=True)
    item_code = Column(String(50), unique=True, nullable=False)  # e.g., "MAT-001", "LAB-CARP-01"
    description = Column(Text, nullable=False)
    
    # Categorization
    item_type = Column(String(50), nullable=False)  # MATERIAL, LABOR, EQUIPMENT, SUBCONTRACT, OTHER
    category = Column(String(100), nullable=False)  # e.g., "Concrete", "Carpentry", "Electrical"
    subcategory = Column(String(100), nullable=True)
    
    # Cost and measurement
    unit_of_measure = Column(String(20), nullable=False)  # m2, m3, ml, c/u, hr, kg, etc.
    base_cost = Column(Numeric(15, 4), nullable=False)
    currency = Column(String(10), default="USD", nullable=False)
    
    # Additional cost factors
    waste_factor = Column(Numeric(5, 4), default=0.0500, nullable=False)  # 5% waste default
    labor_factor = Column(Numeric(5, 4), nullable=True)  # Hours per unit if material
    
    # Supplier information
    preferred_supplier = Column(String(255), nullable=True)
    supplier_contact = Column(String(255), nullable=True)
    last_price_update = Column(DateTime, nullable=True)
    
    # Regional variations
    panama_city_factor = Column(Numeric(5, 4), default=1.0000)
    colon_factor = Column(Numeric(5, 4), default=0.9500)
    chiriqui_factor = Column(Numeric(5, 4), default=0.9000)
    interior_factor = Column(Numeric(5, 4), default=0.8500)
    
    # Control
    is_active = Column(Boolean, default=True)
    is_custom = Column(Boolean, default=False)  # User-created vs system items
    created_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ConstructionAssembly(Base):
    """
    Ensamblajes de construcción: grupos de items que forman un sistema completo
    Ejemplo: "Muro de Bloque + Repello + Pintura" o "Puerta Interior Completa"
    """
    __tablename__ = "construction_assemblies"
    
    id = Column(Integer, primary_key=True, index=True)
    assembly_code = Column(String(50), unique=True, nullable=False)
    assembly_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Categorization
    assembly_type = Column(String(100), nullable=False)  # STRUCTURAL, ARCHITECTURAL, MEP, FINISHES
    system_category = Column(String(100), nullable=False)  # WALLS, DOORS, WINDOWS, ROOFING, etc.
    
    # Unit and measurement
    unit_of_measure = Column(String(20), nullable=False)  # m2, ml, c/u, etc.
    
    # Assembly parameters (for parametric assemblies)
    parameters_schema = Column(JSONB, nullable=True)  # Stores parameter definitions
    default_parameters = Column(JSONB, nullable=True)  # Default parameter values
    
    # Usage tracking
    usage_count = Column(Integer, default=0)
    last_used = Column(DateTime, nullable=True)
    
    # Control
    is_active = Column(Boolean, default=True)
    is_parametric = Column(Boolean, default=False)
    is_custom = Column(Boolean, default=False)
    created_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    components = relationship("AssemblyComponent", back_populates="assembly", cascade="all, delete-orphan")


class AssemblyComponent(Base):
    """
    Componentes que forman un ensamblaje
    """
    __tablename__ = "assembly_components"
    
    id = Column(Integer, primary_key=True, index=True)
    assembly_id = Column(Integer, ForeignKey("construction_assemblies.id", ondelete="CASCADE"), nullable=False)
    cost_item_id = Column(Integer, ForeignKey("cost_items.id"), nullable=False)
    
    # Quantity calculation
    quantity_formula = Column(String(500), nullable=False)  # e.g., "area * 1.05", "perimeter / 0.6"
    base_quantity = Column(Numeric(15, 4), nullable=True)  # Fixed quantity if not formula-based
    
    # Component factors
    waste_factor_override = Column(Numeric(5, 4), nullable=True)
    productivity_factor = Column(Numeric(5, 4), default=1.0000)  # Labor productivity adjustment
    
    # Parameter dependencies
    parameter_dependencies = Column(JSONB, nullable=True)  # Which parameters affect this component
    
    # Control
    is_optional = Column(Boolean, default=False)
    sequence_order = Column(Integer, default=1)
    
    # Relationships
    assembly = relationship("ConstructionAssembly", back_populates="components")
    cost_item = relationship("CostItem")


class ConstructionQuote(Base):
    """
    Cotizaciones de construcción
    """
    __tablename__ = "construction_quotes"
    
    id = Column(Integer, primary_key=True, index=True) 
    construction_project_id = Column(Integer, ForeignKey("construction_projects.id", ondelete="CASCADE"), nullable=False)
    
    # Quote identification
    quote_number = Column(String(50), unique=True, nullable=False)
    quote_name = Column(String(255), nullable=False)
    version = Column(Integer, default=1, nullable=False)
    
    # Quote details
    description = Column(Text, nullable=True)
    validity_days = Column(Integer, default=30, nullable=False)
    quote_date = Column(Date, default=date.today)
    expiry_date = Column(Date, nullable=True)
    
    # Cost calculations
    total_direct_costs = Column(Numeric(15, 2), default=0.00)
    total_material_costs = Column(Numeric(15, 2), default=0.00) 
    total_labor_costs = Column(Numeric(15, 2), default=0.00)
    total_equipment_costs = Column(Numeric(15, 2), default=0.00)
    total_subcontract_costs = Column(Numeric(15, 2), default=0.00)
    
    # Indirect costs and margins
    overhead_percentage = Column(Numeric(5, 2), default=15.00)
    overhead_amount = Column(Numeric(15, 2), default=0.00)
    profit_margin_percentage = Column(Numeric(5, 2), default=10.00)
    profit_margin_amount = Column(Numeric(15, 2), default=0.00)
    contingency_percentage = Column(Numeric(5, 2), default=5.00)
    contingency_amount = Column(Numeric(15, 2), default=0.00)
    
    # Taxes
    itbms_percentage = Column(Numeric(5, 2), default=7.00)  # Panama's ITBMS
    itbms_amount = Column(Numeric(15, 2), default=0.00)
    
    # Final amounts
    subtotal = Column(Numeric(15, 2), default=0.00)
    total_quote_amount = Column(Numeric(15, 2), default=0.00)
    
    # Payment terms
    payment_terms = Column(Text, nullable=True)
    payment_schedule = Column(JSONB, nullable=True)  # Array of payment milestones
    
    # Status and workflow
    status = Column(String(50), default="DRAFT", nullable=False)
    # DRAFT, SUBMITTED, UNDER_REVIEW, AWARDED, REJECTED, EXPIRED
    submitted_date = Column(DateTime, nullable=True)
    decision_date = Column(DateTime, nullable=True)
    
    # Competitive analysis
    estimated_competitors = Column(Integer, nullable=True)
    market_position = Column(String(50), nullable=True)  # AGGRESSIVE, COMPETITIVE, CONSERVATIVE
    
    # Metadata
    created_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    project = relationship("ConstructionProject", back_populates="quotes")
    line_items = relationship("QuoteLineItem", back_populates="quote", cascade="all, delete-orphan")


class QuoteLineItem(Base):
    """
    Líneas de cotización: cada item o ensamblaje cotizado
    """
    __tablename__ = "quote_line_items"
    
    id = Column(Integer, primary_key=True, index=True)
    construction_quote_id = Column(Integer, ForeignKey("construction_quotes.id", ondelete="CASCADE"), nullable=False)
    
    # Item identification  
    line_number = Column(Integer, nullable=False)
    item_description = Column(Text, nullable=False)
    
    # Reference to cost database
    cost_item_id = Column(Integer, ForeignKey("cost_items.id"), nullable=True)
    assembly_id = Column(Integer, ForeignKey("construction_assemblies.id"), nullable=True) 
    
    # Quantities and measurements
    quantity = Column(Numeric(15, 4), nullable=False)
    unit_of_measure = Column(String(20), nullable=False)
    
    # Costs
    unit_cost = Column(Numeric(15, 4), nullable=False)
    total_cost = Column(Numeric(15, 2), nullable=False)
    
    # Cost breakdown (for assemblies)
    material_cost = Column(Numeric(15, 2), default=0.00)
    labor_cost = Column(Numeric(15, 2), default=0.00)
    equipment_cost = Column(Numeric(15, 2), default=0.00)
    subcontract_cost = Column(Numeric(15, 2), default=0.00)
    
    # Applied factors
    waste_factor_applied = Column(Numeric(5, 4), default=0.0000)
    location_factor_applied = Column(Numeric(5, 4), default=1.0000)
    complexity_factor_applied = Column(Numeric(5, 4), default=1.0000)
    
    # Assembly parameters (if applicable)
    assembly_parameters = Column(JSONB, nullable=True)
    
    # Grouping and organization
    section = Column(String(100), nullable=True)  # e.g., "Structural", "Architectural"
    work_category = Column(String(100), nullable=True)
    
    # Budget tracking
    budget_code = Column(String(50), nullable=True)  # For integration with accounting systems
    
    # Control
    is_alternative = Column(Boolean, default=False)
    is_optional = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    
    # Relationships
    quote = relationship("ConstructionQuote", back_populates="line_items")
    cost_item = relationship("CostItem")
    assembly = relationship("ConstructionAssembly")


class ProjectTakeoff(Base):
    """
    Cubicaciones de proyecto: mediciones de cantidades desde planos
    """
    __tablename__ = "project_takeoffs"
    
    id = Column(Integer, primary_key=True, index=True)
    construction_project_id = Column(Integer, ForeignKey("construction_projects.id", ondelete="CASCADE"), nullable=False)
    
    # Takeoff identification
    takeoff_name = Column(String(255), nullable=False)
    plan_reference = Column(String(255), nullable=True)  # Plan sheet reference
    discipline = Column(String(50), nullable=True)  # ARCHITECTURAL, STRUCTURAL, MEP
    
    # Measurement details
    measurement_type = Column(String(50), nullable=False)  # COUNT, LINEAR, AREA, VOLUME
    measured_quantity = Column(Numeric(15, 4), nullable=False)
    unit_of_measure = Column(String(20), nullable=False)
    
    # Measurement metadata
    measurement_method = Column(String(50), nullable=True)  # MANUAL, DIGITAL, BIM_EXTRACT
    scale_factor = Column(String(50), nullable=True)  # Plan scale used
    
    # Geometric data (for digital takeoffs)
    coordinates_data = Column(JSONB, nullable=True)  # Measurement coordinates/paths
    area_polygon = Column(JSONB, nullable=True)  # For area measurements
    
    # Quality control
    verified = Column(Boolean, default=False)
    verified_by = Column(String(100), nullable=True)
    verification_date = Column(DateTime, nullable=True)
    
    # Metadata
    notes = Column(Text, nullable=True)
    created_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    project = relationship("ConstructionProject", back_populates="takeoffs")


class QuoteTemplate(Base):
    """
    Plantillas de cotización para diferentes tipos de proyecto
    """
    __tablename__ = "quote_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    template_name = Column(String(255), nullable=False)
    project_type = Column(String(100), nullable=False)  # RESIDENTIAL, COMMERCIAL, INDUSTRIAL
    
    # Template structure
    template_sections = Column(JSONB, nullable=False)  # Predefined sections and items
    default_assemblies = Column(JSONB, nullable=True)  # Common assemblies for this type
    
    # Default factors and percentages
    default_overhead = Column(Numeric(5, 2), default=15.00)
    default_profit = Column(Numeric(5, 2), default=10.00) 
    default_contingency = Column(Numeric(5, 2), default=5.00)
    
    # Usage and control
    usage_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    is_system_template = Column(Boolean, default=False)
    
    # Metadata
    created_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ProjectUnit(Base):
    """
    Unidades individuales de un proyecto de escenario.
    Permite definir metrajes específicos para cada unidad y planificar ventas unitarias.
    """
    __tablename__ = "project_units"
    
    id = Column(Integer, primary_key=True, index=True)
    scenario_project_id = Column(Integer, ForeignKey("scenario_projects.id", ondelete="CASCADE"), nullable=False)
    
    # Identificación de la unidad
    unit_number = Column(String(50), nullable=False)  # Ej: "A-101", "Casa 1", "Lote 15"
    unit_type = Column(String(50), nullable=False)  # APARTAMENTO, CASA, LOTE, OFICINA, LOCAL
    
    # Metrajes específicos
    construction_area_m2 = Column(Numeric(10, 2), nullable=True)  # Área de construcción
    land_area_m2 = Column(Numeric(10, 2), nullable=True)  # Área de terreno (para casas/lotes)
    total_area_m2 = Column(Numeric(10, 2), nullable=True)  # Área total (construcción + terreno)
    
    # Características específicas
    bedrooms = Column(Integer, nullable=True)
    bathrooms = Column(Numeric(3, 1), nullable=True)  # Permite 2.5 baños
    parking_spaces = Column(Integer, nullable=True)
    floor_level = Column(Integer, nullable=True)  # Para apartamentos
    
    # Precios específicos de la unidad
    target_price_total = Column(Numeric(15, 2), nullable=True)  # Precio total objetivo
    price_per_m2_construction = Column(Numeric(10, 2), nullable=True)  # Precio por m² construcción
    price_per_m2_land = Column(Numeric(10, 2), nullable=True)  # Precio por m² terreno
    
    # Estado de la unidad
    status = Column(String(50), default="AVAILABLE", nullable=False)  
    # AVAILABLE, RESERVED, SOLD, CONSTRUCTION, DELIVERED
    
    # Información de venta (cuando aplique)
    reserved_date = Column(Date, nullable=True)
    sold_date = Column(Date, nullable=True)
    delivery_date = Column(Date, nullable=True)
    buyer_name = Column(String(255), nullable=True)
    sale_price = Column(Numeric(15, 2), nullable=True)  # Precio real de venta
    
    # Planificación de ventas (para simulaciones)
    planned_sale_month = Column(Integer, nullable=True)  # Mes planificado de venta (1-based desde inicio proyecto)
    sales_priority = Column(Integer, default=1, nullable=False)  # 1=alta, 2=media, 3=baja
    
    # Observaciones y notas
    description = Column(Text, nullable=True)
    special_features = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    
    # Control
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    project = relationship("ScenarioProject", back_populates="units")
    
    # Índices únicos
    __table_args__ = (
        Index('ix_project_unit_number', 'scenario_project_id', 'unit_number', unique=True),
    )


class UnitSalesSimulation(Base):
    """
    Simulaciones de ventas por unidades específicas.
    Reemplaza el sistema de porcentajes por planificación unitaria.
    """
    __tablename__ = "unit_sales_simulations"
    
    id = Column(Integer, primary_key=True, index=True)
    scenario_project_id = Column(Integer, ForeignKey("scenario_projects.id", ondelete="CASCADE"), nullable=False)
    
    # Información de la simulación
    simulation_name = Column(String(255), nullable=False)  # "Optimista", "Realista", "Conservador"
    description = Column(Text, nullable=True)
    
    # Configuración de ventas por unidades
    units_sales_schedule = Column(JSONB, nullable=False)  # {"unit_id": month_to_sell, ...}
    
    # Métricas calculadas
    total_revenue = Column(Numeric(15, 2), nullable=True)
    total_units_to_sell = Column(Integer, nullable=True)
    sales_period_months = Column(Integer, nullable=True)
    average_monthly_sales = Column(Numeric(5, 2), nullable=True)
    
    # Resultados financieros
    npv = Column(Numeric(15, 2), nullable=True)
    irr = Column(Numeric(7, 4), nullable=True)
    payback_months = Column(Integer, nullable=True)
    max_capital_exposure = Column(Numeric(15, 2), nullable=True)
    
    # Control
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    project = relationship("ScenarioProject")


class ProjectStage(Base):
    """
    Etapas de desarrollo de un proyecto de escenario.
    Permite dividir el proyecto en fases con fechas específicas y traslapes flexibles.
    """
    __tablename__ = "project_stages"
    
    id = Column(Integer, primary_key=True, index=True)
    scenario_project_id = Column(Integer, ForeignKey("scenario_projects.id", ondelete="CASCADE"), nullable=False)
    
    # Información de la etapa
    stage_name = Column(String(255), nullable=False)  # Nombre personalizable de la etapa
    stage_type = Column(String(100), nullable=False)  # Tipo predefinido de etapa
    description = Column(Text, nullable=True)
    
    # Orden y jerarquía
    stage_order = Column(Integer, nullable=False)  # Orden de la etapa (1, 2, 3, ...)
    parent_stage_id = Column(Integer, ForeignKey("project_stages.id"), nullable=True)  # Para sub-etapas
    
    # Fechas planificadas
    planned_start_date = Column(Date, nullable=False)
    planned_end_date = Column(Date, nullable=False)
    planned_duration_days = Column(Integer, nullable=True)  # Calculado automáticamente
    
    # Fechas reales (para seguimiento)
    actual_start_date = Column(Date, nullable=True)
    actual_end_date = Column(Date, nullable=True)
    actual_duration_days = Column(Integer, nullable=True)
    
    # Estado de la etapa
    status = Column(String(50), default="PLANNED", nullable=False)
    # PLANNED, IN_PROGRESS, COMPLETED, DELAYED, CANCELLED, ON_HOLD
    
    # Progreso
    progress_percentage = Column(Numeric(5, 2), default=0.00, nullable=False)  # 0.00 - 100.00
    
    # Configuración de traslapes
    allows_overlap = Column(Boolean, default=True, nullable=False)  # Si permite traslape con otras etapas
    min_overlap_days = Column(Integer, default=0)  # Días mínimos de traslape
    max_overlap_days = Column(Integer, nullable=True)  # Días máximos de traslape
    
    # Dependencias
    dependencies = Column(JSONB, nullable=True)  # Lista de IDs de etapas que deben completarse antes
    
    # Recursos y costos asociados
    estimated_cost = Column(Numeric(15, 2), nullable=True)
    actual_cost = Column(Numeric(15, 2), nullable=True)
    
    # Personal y recursos requeridos
    required_personnel = Column(JSONB, nullable=True)  # {"architects": 2, "engineers": 1, "workers": 10}
    required_equipment = Column(JSONB, nullable=True)  # Lista de equipos necesarios
    
    # Hitos y deliverables
    milestones = Column(JSONB, nullable=True)  # Lista de hitos importantes
    deliverables = Column(JSONB, nullable=True)  # Lista de entregables
    
    # Riesgos y contingencias
    risk_level = Column(String(20), default="MEDIUM", nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    contingency_days = Column(Integer, default=0)  # Días de contingencia planificados
    risk_notes = Column(Text, nullable=True)
    
    # Metadatos
    created_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    project = relationship("ScenarioProject", back_populates="stages")
    parent_stage = relationship("ProjectStage", remote_side=[id], backref="sub_stages")
    
    # Índices
    __table_args__ = (
        Index('idx_project_stage_order', 'scenario_project_id', 'stage_order'),
        Index('idx_project_stage_dates', 'scenario_project_id', 'planned_start_date', 'planned_end_date'),
    )

class SalesProjection(Base):
    __tablename__ = 'sales_projections'
    id = Column(Integer, primary_key=True, index=True)
    scenario_project_id = Column(Integer, ForeignKey('scenario_projects.id'), nullable=False)
    scenario_name = Column(String, nullable=False)
    monthly_revenue = Column(JSONB, nullable=False)  # e.g., [{"month": 1, "revenue": 10000}, ...]
    payment_flows = Column(JSONB, nullable=True)  # Detailed payment flows for analysis
    is_active = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    project = relationship("ScenarioProject", foreign_keys=[scenario_project_id])

