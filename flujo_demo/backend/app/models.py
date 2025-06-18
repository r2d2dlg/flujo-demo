# backend/app/models.py
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Text, Numeric, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import text
from .database import Base
from datetime import datetime

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
    es_revolvente = Column(Boolean, default=False, nullable=True)
    cargos_apertura = Column(Numeric(15, 2), nullable=True)
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

