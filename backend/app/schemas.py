from pydantic import BaseModel, Field, EmailStr, constr, validator
from typing import Dict, Optional, Any, List, Union
from datetime import date, datetime
from decimal import Decimal

# class ComisionPersonalBase(BaseModel): # This was commented out or removed, not defined for use
#     # This model might not be strictly necessary if personal_comisiones is just Dict[str, float]
#     # but can be useful if individual commissions have more structure later.
#     pass

# For the JSONB field `personal_comisiones`
# We expect a dictionary where keys are salesperson names (str) and values are commission amounts (float)
# Pydantic can handle Dict[str, float] directly in the main model.

class PlantillaComisionesVentasBase(BaseModel):
    fecha_venta: date
    cliente: Optional[str] = None
    producto_servicio: Optional[str] = None
    monto_venta: Optional[float] = None
    # The JSONB field will be represented as a dictionary.
    # Pydantic will automatically validate this structure.
    personal_comisiones: Optional[Dict[str, float]] = {}

class PlantillaComisionesVentasCreate(PlantillaComisionesVentasBase):
    pass

class PlantillaComisionesVentasUpdate(BaseModel):
    fecha_venta: Optional[date] = None
    cliente: Optional[str] = None
    producto_servicio: Optional[str] = None
    monto_venta: Optional[float] = None
    personal_comisiones: Optional[Dict[str, float]] = None 
    # Using generic Dict[str, Any] or Dict[str, float] for updates to allow partial updates to the JSONB
    # If you want to enforce specific structure for updates inside JSONB, more complex logic might be needed.

class PlantillaComisionesVentas(PlantillaComisionesVentasBase):
    id: int
    personal_comisiones: Optional[Dict[str, float]] = None
    entidad: Optional[str] = None
    etapa: Optional[str] = None
    inmueble: Optional[str] = None
    modelo: Optional[str] = None
    n_proceso_entrega: Optional[str] = None
    contrato_firmado_con: Optional[str] = None
    nombre_del_banco: Optional[str] = None
    identificacion: Optional[str] = None
    ingreso: Optional[str] = None
    fecha_empleo: Optional[date] = None
    tiempo_trabajando: Optional[str] = None
    profesion: Optional[str] = None
    fecha_ingreso_al: Optional[str] = None
    cotitular: Optional[str] = None
    vendedor: Optional[str] = None
    fecha_reserva: Optional[date] = None
    servicio: Optional[str] = None
    cpf: Optional[str] = None
    importe_cpf: Optional[float] = None
    fecha_ingreso_etapa: Optional[date] = None
    ultima_etapa: Optional[str] = None
    responsable: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# You might also want a model for the view `vista_plantilla_comisiones_venedores`
# if you plan to return data from it directly in a structured way, especially the TOTAL row.
# For now, we'll focus on the base table.

class VistaComisionVendedor(BaseModel):
    # This model needs to be flexible as columns are dynamic.
    # We can represent each row as a dictionary.
    # The keys will be 'fecha_venta' (or whatever you aliased it to for the TOTAL row) 
    # and the salesperson names.
    # Example: {"fecha_venta": "2023-01-15", "VendedorA": 100.0, "VendedorB": 150.0, "TOTAL_VENTA_DIA": 250.0}
    # Or for the TOTAL row: {"fecha_venta": "TOTAL", "VendedorA": 5000.0, "VendedorB": 7500.0, "TOTAL_VENTA_DIA": 12500.0}
    # Using Dict[str, Any] provides this flexibility.
    data: Dict[str, Any]

    class Config:
        from_attributes = True # Changed from orm_mode

class VistaComisionesDataResponse(BaseModel):
    data: List[Dict[str, Any]]

    class Config:
        from_attributes = True # Changed from orm_mode 

# Schemas for ProyeccionFlujoEfectivoVentas
class ProyeccionFlujoEfectivoVentasBase(BaseModel):
    actividad: str
    enero: Optional[float] = 0.0
    febrero: Optional[float] = 0.0
    marzo: Optional[float] = 0.0
    abril: Optional[float] = 0.0
    mayo: Optional[float] = 0.0
    junio: Optional[float] = 0.0
    julio: Optional[float] = 0.0
    agosto: Optional[float] = 0.0
    septiembre: Optional[float] = 0.0
    octubre: Optional[float] = 0.0
    noviembre: Optional[float] = 0.0
    diciembre: Optional[float] = 0.0
    total_anual: Optional[float] = 0.0

class ProyeccionFlujoEfectivoVentasCreate(ProyeccionFlujoEfectivoVentasBase):
    pass # Inherits all from Base, all optional with defaults allows flexibility

class ProyeccionFlujoEfectivoVentasUpdate(BaseModel):
    actividad: Optional[str] = None
    enero: Optional[float] = None
    febrero: Optional[float] = None
    marzo: Optional[float] = None
    abril: Optional[float] = None
    mayo: Optional[float] = None
    junio: Optional[float] = None
    julio: Optional[float] = None
    agosto: Optional[float] = None
    septiembre: Optional[float] = None
    octubre: Optional[float] = None
    noviembre: Optional[float] = None
    diciembre: Optional[float] = None
    total_anual: Optional[float] = None

class ProyeccionFlujoEfectivoVentas(ProyeccionFlujoEfectivoVentasBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 

# Schemas for Sales Cash Flow View (v_flujo_efectivo_ventas_consolidado)
class SalesCashFlowItem(BaseModel):
    actividad: str
    meses: Dict[str, Optional[float]] # YYYY-MM: value
    total_anual: Optional[float]
    grp: Optional[str] = None # For sorting/grouping 'Ingresos', 'Egresos', 'Total'
    grp_order: Optional[int] = None # For sorting within groups

class SalesCashFlowResponse(BaseModel):
    data: List[SalesCashFlowItem]
    year: int

# Schemas for Ledger Entries (Contabilidad)
class LedgerEntryBase(BaseModel):
    account_id: Optional[str] = None
    account_description: Optional[str] = None
    entry_date: date
    reference: Optional[str] = None
    journal: Optional[str] = None
    transaction_description: str
    debit_amount: Optional[Decimal] = None
    credit_amount: Optional[Decimal] = None
    balance: Optional[Decimal] = None
    project_name: Optional[str] = None

class LedgerEntryCreate(LedgerEntryBase):
    pass # For creating new entries, if needed later

class LedgerEntry(LedgerEntryBase):
    id: int # Assuming your DB table has an auto-incrementing ID
    # created_at: Optional[datetime] = None # Uncomment if you have these in your DB model
    # updated_at: Optional[datetime] = None # Uncomment if you have these in your DB model

    class Config:
        orm_mode = True # Kept for compatibility, though orm_mode is deprecated in Pydantic v2
        from_attributes = True # Pydantic v2 equivalent for orm_mode

# Pydantic models for AdministrativeCost
class AdministrativeCostBase(BaseModel):
    account_id: Optional[str] = None
    account_description: Optional[str] = None
    entry_date: date
    reference: Optional[str] = None
    journal: Optional[str] = None
    transaction_description: str
    debit_amount: Optional[Decimal] = None
    credit_amount: Optional[Decimal] = None
    balance: Optional[Decimal] = None

    class Config:
        from_attributes = True # Pydantic v2 equivalent for orm_mode

class AdministrativeCostCreate(AdministrativeCostBase):
    pass

class AdministrativeCost(AdministrativeCostBase):
    id: int

    # No need to repeat Config here if it's inherited and sufficient from Base

# Schema for simple message responses
class Msg(BaseModel):
    message: str

# If you have other schemas, they would be here 

# Schemas for Vendedor (Salesperson)
class VendedorBase(BaseModel):
    nombre: str

class VendedorCreate(VendedorBase):
    pass

class Vendedor(VendedorBase):
    id: int

    class Config:
        from_attributes = True 

# Schemas for Pago (Payment)
class PagoBase(BaseModel):
    cliente_id: int # Assuming this links to a Clientes table ID
    proyecto_keyword: Optional[str] = None
    monto: Decimal
    fecha_pago: date
    metodo_pago: str # e.g., 'transferencia', 'efectivo', 'cheque', 'tarjeta_credito', 'yappy', 'otro'
    referencia: Optional[str] = None
    notas: Optional[str] = None
    linea_credito_id_abono: Optional[int] = None # ID of the credit line to apply 90% of payment
    abono_porcentaje_linea_credito: Optional[float] = None # NEW: Percentage of monto to apply to linea_credito_id_abono
    origen_pago: Optional[str] = None # New field: CLIENTE, BANCO, OTRO

class PagoCreate(PagoBase):
    pass

class Pago(PagoBase):
    id: int
    created_at: datetime
    updated_at: datetime
    cliente_nombre: Optional[str] = None

    class Config:
        from_attributes = True 

# Schemas for Cliente (Client)
class ClienteBase(BaseModel):
    nombre: str
    ruc: Optional[str] = None
    email: Optional[str] = None
    telefono: Optional[str] = None
    numero_cedula: Optional[str] = None
    # Add other relevant client fields as needed

class ClienteCreate(ClienteBase):
    pass

class ClienteUpdate(BaseModel):
    nombre: Optional[str] = None
    ruc: Optional[str] = None
    email: Optional[str] = None
    telefono: Optional[str] = None
    numero_cedula: Optional[str] = None
    # Ensure all updatable fields are optional

class Cliente(ClienteBase):
    id: int
    created_at: datetime # Assuming you want timestamps
    updated_at: datetime # Assuming you want timestamps

    class Config:
        from_attributes = True 

# Schemas for Lineas de Credito
class LineaCreditoBase(BaseModel):
    nombre: str
    fecha_inicio: date
    monto_total_linea: float
    monto_disponible: float # This will be the CURRENT available balance
    fecha_fin: date
    interest_rate: Optional[float] = None
    es_revolvente: Optional[bool] = False  # Deprecated, kept for backward compatibility
    tipo_linea: Optional[str] = "LINEA_CREDITO"  # New field: LINEA_CREDITO, TERMINO_FIJO, LEASING_OPERATIVO, etc.
    cargos_apertura: Optional[float] = None
    
    # Campos específicos para diferentes tipos de línea
    plazo_meses: Optional[int] = None
    periodicidad_pago: Optional[str] = None  # MENSUAL, TRIMESTRAL, SEMESTRAL, ANUAL
    valor_activo: Optional[float] = None  # Para leasing
    valor_residual: Optional[float] = None  # Para leasing
    porcentaje_financiamiento: Optional[float] = None  # Para factoring
    garantia_tipo: Optional[str] = None
    garantia_descripcion: Optional[str] = None
    limite_sobregiro: Optional[float] = None
    moneda: Optional[str] = "USD"
    
    # Campos para carta de crédito
    beneficiario: Optional[str] = None
    banco_emisor: Optional[str] = None
    documento_respaldo: Optional[str] = None

class LineaCreditoCreate(LineaCreditoBase):
    # monto_disponible will be set to monto_total_linea on creation.
    pass

class LineaCredito(LineaCreditoBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True # Changed from orm_mode = True

class LineaCreditoUpdate(BaseModel):
    nombre: Optional[str] = None
    fecha_inicio: Optional[date] = None
    monto_total_linea: Optional[float] = None
    fecha_fin: Optional[date] = None
    interest_rate: Optional[float] = None
    es_revolvente: Optional[bool] = None  # Deprecated, kept for backward compatibility
    tipo_linea: Optional[str] = None  # New field for different credit line types
    cargos_apertura: Optional[float] = None
    
    # Campos específicos para diferentes tipos de línea
    plazo_meses: Optional[int] = None
    periodicidad_pago: Optional[str] = None
    valor_activo: Optional[float] = None
    valor_residual: Optional[float] = None
    porcentaje_financiamiento: Optional[float] = None
    garantia_tipo: Optional[str] = None
    garantia_descripcion: Optional[str] = None
    limite_sobregiro: Optional[float] = None
    moneda: Optional[str] = None
    beneficiario: Optional[str] = None
    banco_emisor: Optional[str] = None
    documento_respaldo: Optional[str] = None

# Schemas for Lineas de Credito Usos (Transactions)
class LineaCreditoUsoBase(BaseModel):
    linea_credito_id: Optional[int] = None # Will be set from path param or an existing LineaCredito object
    pago_id: Optional[int] = None # Link to the Pago that triggered this usage
    fecha_uso: date
    monto_usado: float # Positive for drawdown, negative for payment to the line
    tipo_transaccion: str # E.g., 'DISPOSICION', 'ABONO_CAPITAL', 'INTERES', 'ABONO_COBRO_CLIENTE'
    descripcion: Optional[str] = None
    cargo_transaccion: Optional[float] = None

class LineaCreditoUsoCreate(LineaCreditoUsoBase):
    pass

class LineaCreditoUso(LineaCreditoUsoBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True # Changed from orm_mode = True


# --- Project Credit Lines Schemas ---
class LineaCreditoProyectoBase(BaseModel):
    nombre: str
    fecha_inicio: date
    monto_total_linea: float
    fecha_fin: date
    interest_rate: Optional[float] = None
    tipo_linea: Optional[str] = "LINEA_CREDITO"
    cargos_apertura: Optional[float] = None
    
    # Campos específicos para diferentes tipos de línea
    plazo_meses: Optional[int] = None
    periodicidad_pago: Optional[str] = None
    valor_activo: Optional[float] = None
    valor_residual: Optional[float] = None
    porcentaje_financiamiento: Optional[float] = None
    garantia_tipo: Optional[str] = None
    garantia_descripcion: Optional[str] = None
    limite_sobregiro: Optional[float] = None
    moneda: Optional[str] = "USD"
    
    # Campos para carta de crédito
    beneficiario: Optional[str] = None
    banco_emisor: Optional[str] = None
    documento_respaldo: Optional[str] = None
    
    # Estado
    estado: Optional[str] = "ACTIVA"
    es_simulacion: Optional[bool] = True


class LineaCreditoProyectoCreate(LineaCreditoProyectoBase):
    # scenario_project_id will be set from path parameter, not required in body
    pass


class LineaCreditoProyectoUpdate(BaseModel):
    nombre: Optional[str] = None
    fecha_inicio: Optional[date] = None
    monto_total_linea: Optional[float] = None
    fecha_fin: Optional[date] = None
    interest_rate: Optional[float] = None
    tipo_linea: Optional[str] = None
    cargos_apertura: Optional[float] = None
    plazo_meses: Optional[int] = None
    periodicidad_pago: Optional[str] = None
    valor_activo: Optional[float] = None
    valor_residual: Optional[float] = None
    porcentaje_financiamiento: Optional[float] = None
    garantia_tipo: Optional[str] = None
    garantia_descripcion: Optional[str] = None
    limite_sobregiro: Optional[float] = None
    moneda: Optional[str] = None
    beneficiario: Optional[str] = None
    banco_emisor: Optional[str] = None
    documento_respaldo: Optional[str] = None
    estado: Optional[str] = None
    es_simulacion: Optional[bool] = None


class LineaCreditoProyecto(LineaCreditoProyectoBase):
    id: int
    scenario_project_id: int
    monto_disponible: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class LineaCreditoProyectoUsoBase(BaseModel):
    fecha_uso: date
    monto_usado: float
    tipo_transaccion: str  # DRAWDOWN, PAYMENT, INTEREST_PAYMENT
    descripcion: Optional[str] = None
    cargo_transaccion: Optional[float] = None
    scenario_cost_item_id: Optional[int] = None
    es_simulacion: bool = True


class LineaCreditoProyectoUsoCreate(LineaCreditoProyectoUsoBase):
    pass  # linea_credito_proyecto_id is obtained from path parameter


class LineaCreditoProyectoUso(LineaCreditoProyectoUsoBase):
    id: int
    linea_credito_proyecto_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 

# Schemas for FlujoGeneralEmpresa Ingresos por Cobros
class IngresoPorOrigen(BaseModel):
    origen_pago: Optional[str] = "-" # Default if origen_pago is None/empty
    total_monto: Decimal

class FlujoGeneralIngresosResponse(BaseModel):
    total_cobros_mes: Decimal
    cobros_por_origen: List[IngresoPorOrigen]
    # We can add more fields later, like total_ingresos_cliente, total_ingresos_banco etc.

    class Config:
        from_attributes = True 

# Schemas for Payroll Tables

# Schemas for PlanillaAdministracion
class PlanillaAdministracionBase(BaseModel):
    horas: int
    sal_bruto: Decimal
    i_s_r: Optional[Decimal] = None
    otros_desc: Optional[Decimal] = None

class PlanillaAdministracionCreate(PlanillaAdministracionBase):
    nombre: str

class PlanillaAdministracionUpdate(BaseModel):
    # nombre: Optional[str] = None # PK, typically not updated this way, or handled by specific endpoint if allowed
    horas: Optional[int] = None
    sal_bruto: Optional[Decimal] = None
    i_s_r: Optional[Decimal] = None
    otros_desc: Optional[Decimal] = None

class PlanillaAdministracion(PlanillaAdministracionBase):
    nombre: str
    model_config = {"from_attributes": True}

# Schemas for PlanillaFijaConstruccion
class PlanillaFijaConstruccionBase(BaseModel):
    rata_x_h: Decimal
    horas_regulares: Decimal
    actividad: Optional[str] = None
    horas_ext_1_25: Optional[Decimal] = None
    horas_ext_1_5: Optional[Decimal] = None
    horas_ext_2_0: Optional[Decimal] = None
    i_renta: Optional[Decimal] = None

class PlanillaFijaConstruccionCreate(PlanillaFijaConstruccionBase):
    nombre: str

class PlanillaFijaConstruccionUpdate(BaseModel):
    rata_x_h: Optional[Decimal] = None
    horas_regulares: Optional[Decimal] = None
    actividad: Optional[str] = None
    horas_ext_1_25: Optional[Decimal] = None
    horas_ext_1_5: Optional[Decimal] = None
    horas_ext_2_0: Optional[Decimal] = None
    i_renta: Optional[Decimal] = None

class PlanillaFijaConstruccion(PlanillaFijaConstruccionBase):
    nombre: str
    model_config = {"from_attributes": True}

# Schemas for PlanillaGerencial
class PlanillaGerencialBase(BaseModel):
    salario: Optional[Decimal] = None

class PlanillaGerencialCreate(PlanillaGerencialBase):
    nombre: str

class PlanillaGerencialUpdate(BaseModel):
    salario: Optional[Decimal] = None

class PlanillaGerencial(PlanillaGerencialBase):
    nombre: str
    model_config = {"from_attributes": True}

# Schemas for PlanillaServicioProfesionales
class PlanillaServicioProfesionalesBase(BaseModel):
    salario_quincenal: Optional[Decimal] = None
    hras_xtras: Optional[Decimal] = None
    otros_salarios: Optional[Decimal] = None
    descuentos: Optional[Decimal] = None
    observaciones: Optional[str] = None

class PlanillaServicioProfesionalesCreate(PlanillaServicioProfesionalesBase):
    nombre: str

class PlanillaServicioProfesionalesUpdate(BaseModel):
    salario_quincenal: Optional[Decimal] = None
    hras_xtras: Optional[Decimal] = None
    otros_salarios: Optional[Decimal] = None
    descuentos: Optional[Decimal] = None
    observaciones: Optional[str] = None

class PlanillaServicioProfesionales(PlanillaServicioProfesionalesBase):
    nombre: str
    model_config = {"from_attributes": True}

# Schemas for PlanillaVariableConstruccion
class PlanillaVariableConstruccionBase(BaseModel):
    rata_x_h: Decimal
    horas_regulares: Decimal
    actividad: Optional[str] = None
    horas_ext_1_25: Optional[Decimal] = None
    horas_ext_1_5: Optional[Decimal] = None
    horas_ext_2_0: Optional[Decimal] = None
    i_renta: Optional[Decimal] = None
    proyecto: str = "Chepo"

class PlanillaVariableConstruccionCreate(PlanillaVariableConstruccionBase):
    nombre: str

class PlanillaVariableConstruccionUpdate(BaseModel):
    rata_x_h: Optional[Decimal] = None
    horas_regulares: Optional[Decimal] = None
    actividad: Optional[str] = None
    horas_ext_1_25: Optional[Decimal] = None
    horas_ext_1_5: Optional[Decimal] = None
    horas_ext_2_0: Optional[Decimal] = None
    i_renta: Optional[Decimal] = None
    proyecto: Optional[str] = None

class PlanillaVariableConstruccion(PlanillaVariableConstruccionBase):
    id: int
    nombre: str
    model_config = {"from_attributes": True}

# Schemas for Payroll Views
class VPlanillaAdministracion(BaseModel):
    nombre: str = Field(alias='NOMBRE')
    horas: Optional[int] = Field(default=None, alias='Horas')
    sal_bruto: Optional[Decimal] = Field(default=None, alias='Sal. Bruto')
    s_s: Optional[Decimal] = Field(default=None, alias='S.S.')
    s_e: Optional[Decimal] = Field(default=None, alias='S.E.')
    i_s_r: Optional[Decimal] = Field(default=None, alias='I.S.R.')
    otros_desc: Optional[Decimal] = Field(default=None, alias='Otros Desc.')
    total: Optional[Decimal] = Field(default=None, alias='Total') # Field name 'total' is fine
    sal_neto: Optional[Decimal] = Field(default=None, alias='Sal. Neto')
    model_config = {"from_attributes": True, "populate_by_name": True}

class VPlanillaFijaConstruccion(BaseModel):
    nombre: str = Field(alias='NOMBRE')
    rata_x_h: Optional[Decimal] = Field(default=None, alias='RATA X H.')
    horas: Optional[Decimal] = Field(default=None, alias='HORAS')
    actividad: Optional[str] = Field(default=None, alias='ACTIVIDAD')
    ext_1_25: Optional[Decimal] = Field(default=None, alias='EXT. 1.25')
    ext_1_5: Optional[Decimal] = Field(default=None, alias='1.5') 
    ext_2_0: Optional[Decimal] = Field(default=None, alias='2.0') 
    regular: Optional[Decimal] = Field(default=None, alias='REGULAR')
    p_1_25: Optional[Decimal] = Field(default=None, alias='P 1.25')
    p_1_5: Optional[Decimal] = Field(default=None, alias='P 1.5')
    p_2_0: Optional[Decimal] = Field(default=None, alias='P2.0') 
    s_bruto: Optional[Decimal] = Field(default=None, alias='S.BRUTO')
    s_s: Optional[Decimal] = Field(default=None, alias='S.S.')
    s_e: Optional[Decimal] = Field(default=None, alias='S.E.')
    i_renta: Optional[Decimal] = Field(default=None, alias='I/RENTA') 
    total_d: Optional[Decimal] = Field(default=None, alias='TOTAL D.')
    sal_neto: Optional[Decimal] = Field(default=None, alias='SAL. NETO')
    model_config = {"from_attributes": True, "populate_by_name": True}

class VPlanillaGerencial(BaseModel):
    nombre: str = Field(alias='NOMBRE')
    salario: Optional[Decimal] = Field(default=None, alias='SALARIO')
    neto: Optional[Decimal] = Field(default=None, alias='NETO')
    observaciones: Optional[str] = Field(default=None, alias='OBSERVACIONES')
    model_config = {"from_attributes": True, "populate_by_name": True}

class VPlanillaServicioProfesionales(BaseModel):
    nombre: str = Field(alias='NOMBRE')
    salario_quincenal: Optional[Decimal] = Field(default=None, alias='SALARIO QUINCENAL')
    hras_xtras: Optional[Decimal] = Field(default=None, alias='HRAS. XTRAS')
    otros_salarios: Optional[Decimal] = Field(default=None, alias='OTROS SALARIOS')
    descuentos: Optional[Decimal] = Field(default=None, alias='DESCUENTOS')
    neto: Optional[Decimal] = Field(default=None, alias='NETO')
    observaciones: Optional[str] = Field(default=None, alias='OBSERVACIONES')
    model_config = {"from_attributes": True, "populate_by_name": True}

class VPlanillaVariableConstruccion(BaseModel): 
    nombre: str = Field(alias='NOMBRE')
    rata_x_h: Optional[Decimal] = Field(default=None, alias='RATA X H.')
    horas: Optional[Decimal] = Field(default=None, alias='HORAS')
    actividad: Optional[str] = Field(default=None, alias='ACTIVIDAD')
    ext_1_25: Optional[Decimal] = Field(default=None, alias='EXT. 1.25')
    ext_1_5: Optional[Decimal] = Field(default=None, alias='1.5')
    ext_2_0: Optional[Decimal] = Field(default=None, alias='2.0')
    regular: Optional[Decimal] = Field(default=None, alias='REGULAR')
    p_1_25: Optional[Decimal] = Field(default=None, alias='P 1.25')
    p_1_5: Optional[Decimal] = Field(default=None, alias='P 1.5')
    p_2_0: Optional[Decimal] = Field(default=None, alias='P2.0')
    s_bruto: Optional[Decimal] = Field(default=None, alias='S.BRUTO')
    s_s: Optional[Decimal] = Field(default=None, alias='S.S.')
    s_e: Optional[Decimal] = Field(default=None, alias='S.E.')
    i_renta: Optional[Decimal] = Field(default=None, alias='I/RENTA')
    total_d: Optional[Decimal] = Field(default=None, alias='TOTAL D.')
    sal_neto: Optional[Decimal] = Field(default=None, alias='SAL. NETO')
    model_config = {"from_attributes": True, "populate_by_name": True} 

# Schemas for Consultores
class NombresConsultoresBase(BaseModel):
    nombre: str

class NombresConsultoresCreate(NombresConsultoresBase):
    pass

class NombresConsultores(NombresConsultoresBase):
    model_config = {"from_attributes": True}

class CostoConsultoresBase(BaseModel):
    consultor: str
    fecha: date
    costo: Optional[Decimal] = None

class CostoConsultoresCreate(CostoConsultoresBase):
    pass

class CostoConsultoresUpdate(BaseModel):
    costo: Optional[Decimal] = None

class CostoConsultores(CostoConsultoresBase):
    model_config = {"from_attributes": True}

class VCostoConsultores(BaseModel):
    Consultor: str
    Mes: datetime
    Costo: Decimal
    model_config = {"from_attributes": True} 

class EstudiosPermisosBase(BaseModel):
    actividad: str
    # 2024
    amount_2024_01: Optional[Decimal] = None
    amount_2024_02: Optional[Decimal] = None
    amount_2024_03: Optional[Decimal] = None
    amount_2024_04: Optional[Decimal] = None
    amount_2024_05: Optional[Decimal] = None
    amount_2024_06: Optional[Decimal] = None
    amount_2024_07: Optional[Decimal] = None
    amount_2024_08: Optional[Decimal] = None
    amount_2024_09: Optional[Decimal] = None
    amount_2024_10: Optional[Decimal] = None
    amount_2024_11: Optional[Decimal] = None
    amount_2024_12: Optional[Decimal] = None
    # 2025
    amount_2025_01: Optional[Decimal] = None
    amount_2025_02: Optional[Decimal] = None
    amount_2025_03: Optional[Decimal] = None
    amount_2025_04: Optional[Decimal] = None
    amount_2025_05: Optional[Decimal] = None
    amount_2025_06: Optional[Decimal] = None
    amount_2025_07: Optional[Decimal] = None
    amount_2025_08: Optional[Decimal] = None
    amount_2025_09: Optional[Decimal] = None
    amount_2025_10: Optional[Decimal] = None
    amount_2025_11: Optional[Decimal] = None
    amount_2025_12: Optional[Decimal] = None
    # 2026
    amount_2026_01: Optional[Decimal] = None
    amount_2026_02: Optional[Decimal] = None
    amount_2026_03: Optional[Decimal] = None
    amount_2026_04: Optional[Decimal] = None
    amount_2026_05: Optional[Decimal] = None
    amount_2026_06: Optional[Decimal] = None
    amount_2026_07: Optional[Decimal] = None
    amount_2026_08: Optional[Decimal] = None
    amount_2026_09: Optional[Decimal] = None
    amount_2026_10: Optional[Decimal] = None
    amount_2026_11: Optional[Decimal] = None
    amount_2026_12: Optional[Decimal] = None
    # 2027
    amount_2027_01: Optional[Decimal] = None
    amount_2027_02: Optional[Decimal] = None
    amount_2027_03: Optional[Decimal] = None
    amount_2027_04: Optional[Decimal] = None
    amount_2027_05: Optional[Decimal] = None
    amount_2027_06: Optional[Decimal] = None
    amount_2027_07: Optional[Decimal] = None
    amount_2027_08: Optional[Decimal] = None
    amount_2027_09: Optional[Decimal] = None
    amount_2027_10: Optional[Decimal] = None
    amount_2027_11: Optional[Decimal] = None
    amount_2027_12: Optional[Decimal] = None
    # 2028
    amount_2028_01: Optional[Decimal] = None
    amount_2028_02: Optional[Decimal] = None
    amount_2028_03: Optional[Decimal] = None
    amount_2028_04: Optional[Decimal] = None
    amount_2028_05: Optional[Decimal] = None

class EstudiosPermisosCreate(EstudiosPermisosBase):
    pass

class EstudiosPermisosUpdate(EstudiosPermisosBase):
    pass

class EstudiosPermisos(EstudiosPermisosBase):
    id: int
    created_at: datetime
    updated_at: datetime
    # Year totals from view
    total_2024_2025: Optional[Decimal] = None
    total_2025_2026: Optional[Decimal] = None
    total_2026_2027: Optional[Decimal] = None
    total_2027_2028: Optional[Decimal] = None

    class Config:
        from_attributes = True 

class PagosTierraBase(BaseModel):
    actividad: str
    # 2024
    amount_2024_01: Optional[Decimal] = None
    amount_2024_02: Optional[Decimal] = None
    amount_2024_03: Optional[Decimal] = None
    amount_2024_04: Optional[Decimal] = None
    amount_2024_05: Optional[Decimal] = None
    amount_2024_06: Optional[Decimal] = None
    amount_2024_07: Optional[Decimal] = None
    amount_2024_08: Optional[Decimal] = None
    amount_2024_09: Optional[Decimal] = None
    amount_2024_10: Optional[Decimal] = None
    amount_2024_11: Optional[Decimal] = None
    amount_2024_12: Optional[Decimal] = None
    # 2025
    amount_2025_01: Optional[Decimal] = None
    amount_2025_02: Optional[Decimal] = None
    amount_2025_03: Optional[Decimal] = None
    amount_2025_04: Optional[Decimal] = None
    amount_2025_05: Optional[Decimal] = None
    amount_2025_06: Optional[Decimal] = None
    amount_2025_07: Optional[Decimal] = None
    amount_2025_08: Optional[Decimal] = None
    amount_2025_09: Optional[Decimal] = None
    amount_2025_10: Optional[Decimal] = None
    amount_2025_11: Optional[Decimal] = None
    amount_2025_12: Optional[Decimal] = None
    # 2026
    amount_2026_01: Optional[Decimal] = None
    amount_2026_02: Optional[Decimal] = None
    amount_2026_03: Optional[Decimal] = None
    amount_2026_04: Optional[Decimal] = None
    amount_2026_05: Optional[Decimal] = None
    amount_2026_06: Optional[Decimal] = None
    amount_2026_07: Optional[Decimal] = None
    amount_2026_08: Optional[Decimal] = None
    amount_2026_09: Optional[Decimal] = None
    amount_2026_10: Optional[Decimal] = None
    amount_2026_11: Optional[Decimal] = None
    amount_2026_12: Optional[Decimal] = None
    # 2027
    amount_2027_01: Optional[Decimal] = None
    amount_2027_02: Optional[Decimal] = None
    amount_2027_03: Optional[Decimal] = None
    amount_2027_04: Optional[Decimal] = None
    amount_2027_05: Optional[Decimal] = None
    amount_2027_06: Optional[Decimal] = None
    amount_2027_07: Optional[Decimal] = None
    amount_2027_08: Optional[Decimal] = None
    amount_2027_09: Optional[Decimal] = None
    amount_2027_10: Optional[Decimal] = None
    amount_2027_11: Optional[Decimal] = None
    amount_2027_12: Optional[Decimal] = None
    # 2028
    amount_2028_01: Optional[Decimal] = None
    amount_2028_02: Optional[Decimal] = None
    amount_2028_03: Optional[Decimal] = None
    amount_2028_04: Optional[Decimal] = None
    amount_2028_05: Optional[Decimal] = None

class PagosTierraCreate(PagosTierraBase):
    pass

class PagosTierraUpdate(PagosTierraBase):
    pass

class PagosTierra(PagosTierraBase):
    id: int
    created_at: datetime
    updated_at: datetime
    # Year totals from view
    total_2024_2025: Optional[Decimal] = None
    total_2025_2026: Optional[Decimal] = None
    total_2026_2027: Optional[Decimal] = None
    total_2027_2028: Optional[Decimal] = None

    class Config:
        from_attributes = True

class GastosEquipoBase(BaseModel):
    concepto: str
    # 2024
    amount_2024_01: Optional[Decimal] = None
    amount_2024_02: Optional[Decimal] = None
    amount_2024_03: Optional[Decimal] = None
    amount_2024_04: Optional[Decimal] = None
    amount_2024_05: Optional[Decimal] = None
    amount_2024_06: Optional[Decimal] = None
    amount_2024_07: Optional[Decimal] = None
    amount_2024_08: Optional[Decimal] = None
    amount_2024_09: Optional[Decimal] = None
    amount_2024_10: Optional[Decimal] = None
    amount_2024_11: Optional[Decimal] = None
    amount_2024_12: Optional[Decimal] = None
    # 2025
    amount_2025_01: Optional[Decimal] = None
    amount_2025_02: Optional[Decimal] = None
    amount_2025_03: Optional[Decimal] = None
    amount_2025_04: Optional[Decimal] = None
    amount_2025_05: Optional[Decimal] = None
    amount_2025_06: Optional[Decimal] = None
    amount_2025_07: Optional[Decimal] = None
    amount_2025_08: Optional[Decimal] = None
    amount_2025_09: Optional[Decimal] = None
    amount_2025_10: Optional[Decimal] = None
    amount_2025_11: Optional[Decimal] = None
    amount_2025_12: Optional[Decimal] = None
    # 2026
    amount_2026_01: Optional[Decimal] = None
    amount_2026_02: Optional[Decimal] = None
    amount_2026_03: Optional[Decimal] = None
    amount_2026_04: Optional[Decimal] = None
    amount_2026_05: Optional[Decimal] = None
    amount_2026_06: Optional[Decimal] = None
    amount_2026_07: Optional[Decimal] = None
    amount_2026_08: Optional[Decimal] = None
    amount_2026_09: Optional[Decimal] = None
    amount_2026_10: Optional[Decimal] = None
    amount_2026_11: Optional[Decimal] = None
    amount_2026_12: Optional[Decimal] = None
    # 2027
    amount_2027_01: Optional[Decimal] = None
    amount_2027_02: Optional[Decimal] = None
    amount_2027_03: Optional[Decimal] = None
    amount_2027_04: Optional[Decimal] = None
    amount_2027_05: Optional[Decimal] = None
    amount_2027_06: Optional[Decimal] = None
    amount_2027_07: Optional[Decimal] = None
    amount_2027_08: Optional[Decimal] = None
    amount_2027_09: Optional[Decimal] = None
    amount_2027_10: Optional[Decimal] = None
    amount_2027_11: Optional[Decimal] = None
    amount_2027_12: Optional[Decimal] = None
    # 2028
    amount_2028_01: Optional[Decimal] = None
    amount_2028_02: Optional[Decimal] = None
    amount_2028_03: Optional[Decimal] = None
    amount_2028_04: Optional[Decimal] = None
    amount_2028_05: Optional[Decimal] = None

class GastosEquipoCreate(GastosEquipoBase):
    pass

class GastosEquipoUpdate(GastosEquipoBase):
    pass

class GastosEquipo(GastosEquipoBase):
    id: int
    created_at: datetime
    updated_at: datetime
    # Year totals from view
    total_2024_2025: Optional[Decimal] = None
    total_2025_2026: Optional[Decimal] = None
    total_2026_2027: Optional[Decimal] = None
    total_2027_2028: Optional[Decimal] = None

    class Config:
        from_attributes = True 

# Schemas for CostoDirecto
class CostoDirectoBase(BaseModel):
    actividad: str
    infraestructura: float = 0
    materiales: float = 0
    mo: float = 0
    equipos: float = 0
    total: float = 0
    proyecto: str = "General"

class CostoDirectoCreate(CostoDirectoBase):
    pass

class CostoDirectoUpdate(BaseModel):
    actividad: Optional[str] = None
    infraestructura: Optional[float] = None
    materiales: Optional[float] = None
    mo: Optional[float] = None
    equipos: Optional[float] = None
    total: Optional[float] = None
    proyecto: Optional[str] = None

class CostoDirecto(CostoDirectoBase):
    id: int

    class Config:
        from_attributes = True

# Schema for the rows in the view, which don't have an ID from the SQL view
class CostoDirectoRow(CostoDirectoBase):
    class Config:
        from_attributes = True

# Schema for the totals, omitting fields that are not present in the aggregation
class CostoDirectoTotals(BaseModel):
    infraestructura: float
    materiales: float
    mo: float
    equipos: float
    total: float

    class Config:
        from_attributes = True

class CostoDirectoView(BaseModel):
    rows: List[CostoDirectoRow]
    totals: CostoDirectoTotals

# Schemas for CostoXVivienda
class CostoXViviendaBase(BaseModel):
    viviendas: Optional[int] = None
    materiales: Optional[Decimal] = None
    mo: Optional[Decimal] = None
    otros: Optional[Decimal] = None
    proyecto: str = "General"

class CostoXViviendaCreate(CostoXViviendaBase):
    pass

class CostoXViviendaUpdate(CostoXViviendaBase):
    pass

class CostoXVivienda(CostoXViviendaBase):
    id: int

    class Config:
        orm_mode = True

class CostoXViviendaView(CostoXViviendaBase):
    id: int
    total: float

    class Config:
        from_attributes = True

class CostosDirectosTotales(BaseModel):
    costo_total_materiales_infraestructura: float
    costo_total_materiales_viviendas: float
    mano_de_obra_infraestructura: float
    mano_de_obra_vivienda: float
    total: float 

class MiscelaneosBase(BaseModel):
    concepto: str
    # 2024
    amount_2024_01: Optional[Decimal] = None
    amount_2024_02: Optional[Decimal] = None
    amount_2024_03: Optional[Decimal] = None
    amount_2024_04: Optional[Decimal] = None
    amount_2024_05: Optional[Decimal] = None
    amount_2024_06: Optional[Decimal] = None
    amount_2024_07: Optional[Decimal] = None
    amount_2024_08: Optional[Decimal] = None
    amount_2024_09: Optional[Decimal] = None
    amount_2024_10: Optional[Decimal] = None
    amount_2024_11: Optional[Decimal] = None
    amount_2024_12: Optional[Decimal] = None
    # 2025
    amount_2025_01: Optional[Decimal] = None
    amount_2025_02: Optional[Decimal] = None
    amount_2025_03: Optional[Decimal] = None
    amount_2025_04: Optional[Decimal] = None
    amount_2025_05: Optional[Decimal] = None
    amount_2025_06: Optional[Decimal] = None
    amount_2025_07: Optional[Decimal] = None
    amount_2025_08: Optional[Decimal] = None
    amount_2025_09: Optional[Decimal] = None
    amount_2025_10: Optional[Decimal] = None
    amount_2025_11: Optional[Decimal] = None
    amount_2025_12: Optional[Decimal] = None
    # 2026
    amount_2026_01: Optional[Decimal] = None
    amount_2026_02: Optional[Decimal] = None
    amount_2026_03: Optional[Decimal] = None
    amount_2026_04: Optional[Decimal] = None
    amount_2026_05: Optional[Decimal] = None
    amount_2026_06: Optional[Decimal] = None
    amount_2026_07: Optional[Decimal] = None
    amount_2026_08: Optional[Decimal] = None
    amount_2026_09: Optional[Decimal] = None
    amount_2026_10: Optional[Decimal] = None
    amount_2026_11: Optional[Decimal] = None
    amount_2026_12: Optional[Decimal] = None
    # 2027
    amount_2027_01: Optional[Decimal] = None
    amount_2027_02: Optional[Decimal] = None
    amount_2027_03: Optional[Decimal] = None
    amount_2027_04: Optional[Decimal] = None
    amount_2027_05: Optional[Decimal] = None
    amount_2027_06: Optional[Decimal] = None
    amount_2027_07: Optional[Decimal] = None
    amount_2027_08: Optional[Decimal] = None
    amount_2027_09: Optional[Decimal] = None
    amount_2027_10: Optional[Decimal] = None
    amount_2027_11: Optional[Decimal] = None
    amount_2027_12: Optional[Decimal] = None
    # 2028
    amount_2028_01: Optional[Decimal] = None
    amount_2028_02: Optional[Decimal] = None
    amount_2028_03: Optional[Decimal] = None
    amount_2028_04: Optional[Decimal] = None
    amount_2028_05: Optional[Decimal] = None

class MiscelaneosCreate(MiscelaneosBase):
    pass

class MiscelaneosUpdate(MiscelaneosBase):
    pass

class Miscelaneos(MiscelaneosBase):
    id: int
    created_at: datetime
    updated_at: datetime
    # Year totals from view
    total_2024_2025: Optional[Decimal] = None
    total_2025_2026: Optional[Decimal] = None
    total_2026_2027: Optional[Decimal] = None
    total_2027_2028: Optional[Decimal] = None

    class Config:
        from_attributes = True

class EstadoCuentaProveedoresBase(BaseModel):
    proveedor: str
    empresa_credito: Optional[str] = None
    dias_0_30: Optional[float] = None
    dias_30_60: Optional[float] = None
    dias_61_90: Optional[float] = None
    dias_91_mas: Optional[float] = None

class EstadoCuentaProveedoresCreate(EstadoCuentaProveedoresBase):
    pass

class EstadoCuentaProveedoresUpdate(EstadoCuentaProveedoresBase):
    pass

class EstadoCuentaProveedores(EstadoCuentaProveedoresBase):
    id: int

    class Config:
        orm_mode = True

class EstadoCuentaProveedoresView(EstadoCuentaProveedoresBase):
    id: int
    total: float

    class Config:
        orm_mode = True

class SaldoProveedoresBase(BaseModel):
    proveedor: str
    saldo_a_favor: Optional[float] = None

class SaldoProveedoresCreate(SaldoProveedoresBase):
    pass

class SaldoProveedoresUpdate(SaldoProveedoresBase):
    pass

class SaldoProveedores(SaldoProveedoresBase):
    id: int

    class Config:
        orm_mode = True 

# Schemas for InfraestructuraPago
class InfraestructuraPagoBase(BaseModel):
    proyecto: str
    tipo: str  # 'material' or 'mano_obra'
    monto: float
    mes: int  # 1-12
    detalles: Optional[str] = None

class InfraestructuraPagoCreate(InfraestructuraPagoBase):
    pass

class InfraestructuraPagoOut(InfraestructuraPagoBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        orm_mode = True 

# Schemas for ViviendaPago
class ViviendaPagoBase(BaseModel):
    proyecto: str
    tipo: str  # 'material' or 'mano_obra'
    monto: float
    mes: int  # 1-12
    detalles: Optional[str] = None

class ViviendaPagoCreate(ViviendaPagoBase):
    pass

class ViviendaPagoOut(ViviendaPagoBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        orm_mode = True 

# Schemas for ProyectoVariablePayroll
class ProyectoVariablePayrollBase(BaseModel):
    proyecto: str
    start_month: str  # e.g. '2024_07'
    end_month: str
    is_active: bool = True

class ProyectoVariablePayrollCreate(ProyectoVariablePayrollBase):
    pass

class ProyectoVariablePayrollUpdate(BaseModel):
    start_month: Optional[str] = None
    end_month: Optional[str] = None
    is_active: Optional[bool] = None

class ProyectoVariablePayrollOut(ProyectoVariablePayrollBase):
    id: int

    class Config:
        from_attributes = True 

class AdministrativeCostsMonthlySummary(BaseModel):
    months: List[str]
    totals_by_month: Dict[str, Decimal]

    class Config:
        from_attributes = True 

class GastoCategorizadoBase(BaseModel):
    date: Optional[date] = None
    reference: Optional[str] = None
    description: Optional[str] = None
    debit: Optional[Decimal] = None
    credit: Optional[Decimal] = None
    category: Optional[str] = None

class GastoCategorizadoCreate(GastoCategorizadoBase):
    pass

class GastoCategorizado(GastoCategorizadoBase):
    id: int
    class Config:
        from_attributes = True 

# =====================================================
# SCHEMAS PARA FLUJO DE CAJA MAESTRO
# =====================================================

class FlujoCajaMaestroBase(BaseModel):
    categoria_principal: str  # 'INGRESOS', 'EGRESOS'
    categoria_secundaria: str
    subcategoria: Optional[str] = None
    concepto: str
    proyecto: Optional[str] = None
    centro_costo: Optional[str] = None
    area_responsable: Optional[str] = None
    periodo_inicio: date
    periodo_fin: Optional[date] = None
    moneda: str = 'USD'
    monto_base: Decimal
    distribucion_mensual: Optional[Dict[str, float]] = None
    tipo_registro: str  # 'REAL', 'PROYECTADO', 'PRESUPUESTADO'
    estado: str = 'ACTIVO'
    origen_dato: Optional[str] = None
    referencia_externa: Optional[str] = None
    usuario_creacion: Optional[str] = None

class FlujoCajaMaestroCreate(FlujoCajaMaestroBase):
    """Schema para crear nuevo item de flujo de caja"""
    pass

class FlujoCajaMaestroUpdate(BaseModel):
    """Schema para actualizar item de flujo de caja"""
    categoria_principal: Optional[str] = None
    categoria_secundaria: Optional[str] = None
    subcategoria: Optional[str] = None
    concepto: Optional[str] = None
    proyecto: Optional[str] = None
    centro_costo: Optional[str] = None
    area_responsable: Optional[str] = None
    periodo_inicio: Optional[date] = None
    periodo_fin: Optional[date] = None
    moneda: Optional[str] = None
    monto_base: Optional[Decimal] = None
    distribucion_mensual: Optional[Dict[str, float]] = None
    tipo_registro: Optional[str] = None
    estado: Optional[str] = None
    usuario_modificacion: Optional[str] = None

class FlujoCajaMaestro(FlujoCajaMaestroBase):
    """Schema de respuesta completo"""
    id: int
    fecha_registro: date
    fecha_creacion: datetime
    fecha_modificacion: datetime
    usuario_modificacion: Optional[str] = None

    class Config:
        from_attributes = True

class FlujoCajaConsolidadoItem(BaseModel):
    """Item individual del flujo de caja consolidado"""
    categoria_principal: str
    categoria_secundaria: str
    subcategoria: Optional[str] = None
    concepto: Optional[str] = None
    proyecto: Optional[str] = None
    tipo_registro: str
    meses: Dict[str, float]  # YYYY_MM: monto
    total: Optional[float] = None

class FlujoCajaConsolidadoResponse(BaseModel):
    """Respuesta del flujo de caja consolidado"""
    data: List[FlujoCajaConsolidadoItem]
    periodos: List[str]  # Lista de períodos YYYY_MM
    resumen: Dict[str, float]  # Totales por categoría principal

class FlujoCajaDinamicoItem(BaseModel):
    """Item del flujo dinámico con detalle por período"""
    categoria_principal: str
    categoria_secundaria: str
    subcategoria: Optional[str] = None
    concepto: str
    proyecto: Optional[str] = None
    centro_costo: Optional[str] = None
    area_responsable: Optional[str] = None
    tipo_registro: str
    moneda: str
    periodo_key: str
    periodo_fecha: date
    año: int
    mes: int
    monto: float

class FlujoCajaDinamicoResponse(BaseModel):
    """Respuesta del flujo dinámico"""
    data: List[FlujoCajaDinamicoItem]
    total_periodos: int

class DistribucionMensualRequest(BaseModel):
    """Request para actualizar distribución mensual"""
    distribucion: Dict[str, float]
    tipo_distribucion: Optional[str] = 'PERSONALIZADA'

# =====================================================
# SCHEMAS PARA CATEGORÍAS Y FILTROS
# =====================================================

class CategoriaInfo(BaseModel):
    """Información de categorías disponibles"""
    categoria_principal: str
    categoria_secundaria: str
    subcategoria: Optional[str] = None
    count: int

class FlujoCajaFiltros(BaseModel):
    """Filtros disponibles para consultas"""
    categorias_principales: List[str]
    categorias_secundarias: Dict[str, List[str]]  # principal -> [secundarias]
    subcategorias: Dict[str, List[str]]  # secundaria -> [subcategorías]
    proyectos: List[str]
    tipos_registro: List[str]
    monedas: List[str] 

# --- Scenario Project Schemas ---

class CostCategoryBase(BaseModel):
    categoria: str
    subcategoria: str
    partida_costo: str
    base_costo: str
    applies_to: Optional[str] = None
    calculation_formula: Optional[str] = None
    is_active: bool = True
    country_code: str = "PAN"

class CostCategoryCreate(CostCategoryBase):
    pass

class CostCategory(CostCategoryBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class ScenarioCostItemBase(BaseModel):
    categoria: str
    subcategoria: str
    partida_costo: str
    base_costo: str
    monto_proyectado: Optional[Decimal] = None
    monto_real: Optional[Decimal] = None
    unit_cost: Optional[Decimal] = None
    quantity: Optional[Decimal] = None
    percentage_of_base: Optional[Decimal] = None
    base_reference: Optional[str] = None
    start_month: Optional[int] = None
    duration_months: Optional[int] = None
    notes: Optional[str] = None
    is_active: bool = True

class ScenarioCostItemCreate(ScenarioCostItemBase):
    scenario_project_id: int
    cost_category_id: Optional[int] = None

class ScenarioCostItemUpdate(BaseModel):
    categoria: Optional[str] = None
    subcategoria: Optional[str] = None
    partida_costo: Optional[str] = None
    base_costo: Optional[str] = None
    monto_proyectado: Optional[Decimal] = None
    monto_real: Optional[Decimal] = None
    unit_cost: Optional[Decimal] = None
    quantity: Optional[Decimal] = None
    percentage_of_base: Optional[Decimal] = None
    base_reference: Optional[str] = None
    start_month: Optional[int] = None
    duration_months: Optional[int] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None

class ScenarioCostItem(ScenarioCostItemBase):
    id: int
    scenario_project_id: int
    cost_category_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ScenarioProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = "DRAFT"
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    delivery_start_date: Optional[date] = None
    delivery_end_date: Optional[date] = None
    total_area_m2: Optional[float] = None
    buildable_area_m2: Optional[float] = None
    total_units: Optional[int] = None
    avg_unit_size_m2: Optional[float] = None
    target_price_per_m2: Optional[float] = None
    expected_sales_period_months: Optional[int] = None # To be deprecated
    discount_rate: float = 0.12
    inflation_rate: float = 0.03
    contingency_percentage: float = 0.10
    payment_distribution_config: Optional['PaymentDistributionConfig'] = None

class ScenarioProjectCreate(ScenarioProjectBase):
    created_by: Optional[str] = None

class ScenarioProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    delivery_start_date: Optional[date] = None
    delivery_end_date: Optional[date] = None
    total_area_m2: Optional[float] = None
    buildable_area_m2: Optional[float] = None
    total_units: Optional[int] = None
    avg_unit_size_m2: Optional[float] = None
    target_price_per_m2: Optional[float] = None
    expected_sales_period_months: Optional[int] = None # To be deprecated
    discount_rate: Optional[float] = None
    inflation_rate: Optional[float] = None
    contingency_percentage: Optional[float] = None
    payment_distribution_config: Optional['PaymentDistributionConfig'] = None

class ScenarioProject(ScenarioProjectBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class ScenarioProjectWithDetails(ScenarioProject):
    cost_items: List['ScenarioCostItem'] = []
    metrics: Optional['ProjectFinancialMetrics'] = None
    units: List['ProjectUnit'] = []
    credit_lines: List['LineaCreditoProyecto'] = []
    sales_projections: List['SalesProjection'] = []
    stages: List['ProjectStage'] = []
    cash_flow: Optional[dict] = None

class ScenarioCashFlowBase(BaseModel):
    year: int
    month: int
    period_label: str
    ingresos_ventas: Decimal = Decimal('0.00')
    ingresos_otros: Decimal = Decimal('0.00')
    total_ingresos: Decimal = Decimal('0.00')
    costos_terreno: Decimal = Decimal('0.00')
    costos_duros: Decimal = Decimal('0.00')
    costos_blandos: Decimal = Decimal('0.00')
    costos_financiacion: Decimal = Decimal('0.00')
    costos_marketing: Decimal = Decimal('0.00')
    otros_egresos: Decimal = Decimal('0.00')
    total_egresos: Decimal = Decimal('0.00')
    flujo_neto: Decimal = Decimal('0.00')
    flujo_acumulado: Decimal = Decimal('0.00')
    flujo_descontado: Decimal = Decimal('0.00')

class ScenarioCashFlowCreate(ScenarioCashFlowBase):
    scenario_project_id: int

class ScenarioCashFlow(ScenarioCashFlowBase):
    id: int
    scenario_project_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ProjectFinancialMetricsBase(BaseModel):
    total_investment: Optional[Decimal] = None
    total_revenue: Optional[Decimal] = None
    total_profit: Optional[Decimal] = None
    profit_margin_pct: Optional[Decimal] = None
    npv: Optional[Decimal] = None
    irr: Optional[Decimal] = None
    payback_months: Optional[int] = None
    profitability_index: Optional[Decimal] = None
    cost_per_unit: Optional[Decimal] = None
    revenue_per_unit: Optional[Decimal] = None
    profit_per_unit: Optional[Decimal] = None
    cost_per_m2: Optional[Decimal] = None
    revenue_per_m2: Optional[Decimal] = None
    profit_per_m2: Optional[Decimal] = None
    break_even_units: Optional[int] = None
    break_even_price_per_m2: Optional[Decimal] = None
    max_drawdown: Optional[Decimal] = None

class ProjectFinancialMetrics(ProjectFinancialMetricsBase):
    id: int
    scenario_project_id: int
    calculated_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class SensitivityAnalysisBase(BaseModel):
    analysis_name: str
    variable_type: str
    base_value: Decimal
    min_variation_pct: Decimal = Decimal('-30.00')
    max_variation_pct: Decimal = Decimal('30.00')
    steps: int = 13
    results: Optional[Dict[str, Any]] = None
    base_npv: Optional[Decimal] = None
    base_irr: Optional[Decimal] = None
    base_payback_months: Optional[int] = None

class SensitivityAnalysisCreate(SensitivityAnalysisBase):
    scenario_project_id: int

class SensitivityAnalysis(SensitivityAnalysisBase):
    id: int
    scenario_project_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Response schemas for dashboard
class ScenarioProjectSummary(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    location: Optional[str] = None
    status: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    total_units: Optional[int] = None
    target_price_per_m2: Optional[Decimal] = None
    npv: Optional[Decimal] = None
    irr: Optional[Decimal] = None
    created_at: datetime
    updated_at: datetime

class ScenarioProjectsListResponse(BaseModel):
    projects: List[ScenarioProjectSummary]
    total: int

# Financial calculation request/response schemas
class FinancialCalculationRequest(BaseModel):
    scenario_project_id: int
    recalculate_cash_flow: bool = True
    recalculate_metrics: bool = True

class FinancialCalculationResponse(BaseModel):
    success: bool
    message: str
    metrics: Optional[ProjectFinancialMetrics] = None
    cash_flow_periods: Optional[int] = None

# Sensitivity analysis request
class SensitivityAnalysisRequest(BaseModel):
    variable_type: str
    min_variation_pct: Optional[Decimal] = Decimal('-30.00')
    max_variation_pct: Optional[Decimal] = Decimal('30.00')
    steps: Optional[int] = 13

# Sales Simulation Schemas
class SalesScenarioConfig(BaseModel):
    """Configuración de un escenario de ventas"""
    scenario_name: str  # 'optimista', 'realista', 'conservador'
    period_0_6_months: Decimal  # % de ventas en primeros 6 meses
    period_6_12_months: Decimal  # % de ventas en 6-12 meses
    period_12_18_months: Decimal  # % de ventas en 12-18 meses
    period_18_24_months: Decimal  # % de ventas en 18-24 meses
    period_24_plus_months: Optional[Decimal] = Decimal('0.00')  # % de ventas después de 24 meses

class SalesSimulationRequest(BaseModel):
    """Request para simular escenarios de ventas"""
    optimistic_scenario: SalesScenarioConfig
    realistic_scenario: SalesScenarioConfig
    conservative_scenario: SalesScenarioConfig

class SalesScenarioMetrics(BaseModel):
    """Métricas calculadas para un escenario de ventas"""
    scenario_name: str
    npv: Optional[Decimal] = None
    irr: Optional[Decimal] = None
    payback_months: Optional[int] = None
    max_exposure: Optional[Decimal] = None  # Máxima exposición de capital
    total_revenue: Optional[Decimal] = None
    total_profit: Optional[Decimal] = None

class SalesSimulationResponse(BaseModel):
    """Respuesta de la simulación de escenarios de ventas"""
    success: bool
    message: str
    scenarios: List[SalesScenarioMetrics]
    cash_flow_comparison: List[Dict[str, Any]]  # Datos para el gráfico de comparación
    company_impact: Dict[str, Any]  # Impacto en flujo empresarial

class CompanyLiquidityAnalysis(BaseModel):
    """Análisis de liquidez empresarial"""
    min_liquidity_required: Decimal
    recommended_credit_line: Decimal
    liquidity_risk_level: str  # 'BAJO', 'MEDIO', 'ALTO'
    critical_month: Optional[int] = None
    recommendations: List[str] 

# --- Project Units Schemas ---
class ProjectUnitBase(BaseModel):
    unit_number: str
    unit_type: str  # APARTAMENTO, CASA, LOTE, OFICINA, LOCAL
    construction_area_m2: Optional[Decimal] = None
    land_area_m2: Optional[Decimal] = None
    total_area_m2: Optional[Decimal] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[Decimal] = None
    parking_spaces: Optional[int] = None
    floor_level: Optional[int] = None
    target_price_total: Optional[Decimal] = None
    price_per_m2_construction: Optional[Decimal] = None
    price_per_m2_land: Optional[Decimal] = None
    status: str = "AVAILABLE"
    reserved_date: Optional[date] = None
    sold_date: Optional[date] = None
    delivery_date: Optional[date] = None
    buyer_name: Optional[str] = None
    sale_price: Optional[Decimal] = None
    planned_sale_month: Optional[int] = None
    sales_priority: int = 1
    description: Optional[str] = None
    special_features: Optional[str] = None
    notes: Optional[str] = None
    is_active: bool = True

class ProjectUnitCreate(ProjectUnitBase):
    scenario_project_id: int

class ProjectUnitCreateRequest(ProjectUnitBase):
    """Schema for creating units via API endpoint (scenario_project_id comes from URL)"""
    pass

class ProjectUnitUpdate(ProjectUnitBase):
    unit_number: Optional[str] = None
    unit_type: Optional[str] = None
    floor: Optional[int] = None
    status: Optional[str] = None
    is_active: Optional[bool] = None

    class Config:
        from_attributes = True

# --- Unit Sales Simulation Schemas ---
class UnitSalesSimulationBase(BaseModel):
    simulation_name: str
    description: Optional[str] = None
    units_sales_schedule: Dict[str, int]  # {"unit_id": month_to_sell}
    total_revenue: Optional[Decimal] = None
    total_units_to_sell: Optional[int] = None
    sales_period_months: Optional[int] = None
    average_monthly_sales: Optional[Decimal] = None
    npv: Optional[Decimal] = None
    irr: Optional[Decimal] = None
    payback_months: Optional[int] = None
    max_capital_exposure: Optional[Decimal] = None
    is_active: bool = True

class UnitSalesSimulationCreate(UnitSalesSimulationBase):
    scenario_project_id: int

class UnitSalesSimulation(UnitSalesSimulationBase):
    id: int
    scenario_project_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UnitSalesSimulationUpdate(UnitSalesSimulationBase):
    simulation_name: Optional[str] = None
    description: Optional[str] = None
    units_sales_schedule: Optional[Dict[str, int]] = None

    class Config:
        from_attributes = True

# --- Updated Sales Simulation Schemas ---
class UnitSalesScenarioConfig(BaseModel):
    """Configuración de un escenario de ventas por unidades"""
    scenario_name: str  # 'optimista', 'realista', 'conservador'
    units_schedule: Dict[str, int]  # {"unit_id": month_to_sell}
    description: Optional[str] = None

class PaymentDistributionConfig(BaseModel):
    """Configuración de distribución de pagos para simulación"""
    separation_payment_percentage: Decimal = Decimal('10.0')  # % del precio que va al desarrollador en separación
    separation_credit_line_percentage: Decimal = Decimal('90.0')  # % que va a línea de crédito en separación
    delivery_payment_percentage: Decimal = Decimal('10.0')  # % del precio que va al desarrollador en entrega
    delivery_credit_line_percentage: Decimal = Decimal('90.0')  # % que va a línea de crédito en entrega
    cash_payment_percentage: Decimal = Decimal('100.0')  # % que va al desarrollador si es pago en efectivo
    mortgage_usage_percentage: Decimal = Decimal('80.0')  # % de unidades que usan hipoteca

    class Config:
        json_encoders = {
            Decimal: lambda v: float(v) if v is not None else None
        }
    
class UnitSalesPaymentFlow(BaseModel):
    """Flujo de pagos específico para una unidad"""
    unit_id: int
    unit_number: str
    sale_month: int
    sale_price: Decimal
    uses_mortgage: bool
    separation_amount: Decimal
    delivery_amount: Decimal
    developer_separation: Decimal
    developer_delivery: Decimal
    credit_line_separation: Decimal
    credit_line_delivery: Decimal
    credit_line_id: Optional[int] = None

class UnitSalesSimulationRequest(BaseModel):
    """Request para simular escenarios de ventas por unidades"""
    optimistic_scenario: UnitSalesScenarioConfig
    realistic_scenario: UnitSalesScenarioConfig
    conservative_scenario: UnitSalesScenarioConfig
    payment_distribution: Optional[PaymentDistributionConfig] = None

class UnitSalesScenarioMetrics(BaseModel):
    """Métricas calculadas para un escenario de ventas por unidades"""
    scenario_name: str
    total_units_sold: int
    total_revenue: Decimal
    sales_period_months: int
    average_monthly_sales: Decimal
    npv: Optional[Decimal] = None
    irr: Optional[Decimal] = None
    payback_months: Optional[int] = None
    max_exposure: Optional[Decimal] = None
    monthly_sales_distribution: Dict[str, int]  # {"month": units_sold}
    developer_cash_flow: List[Dict[str, Any]]  # Flujo de caja del desarrollador
    credit_line_impact: List[Dict[str, Any]]  # Impacto en líneas de crédito

class UnitSalesSimulationResponse(BaseModel):
    """Respuesta de la simulación de escenarios de ventas por unidades"""
    success: bool
    message: str
    scenarios: List[UnitSalesScenarioMetrics]
    cash_flow_comparison: List[Dict[str, Any]]
    company_impact: Dict[str, Any]
    units_summary: Dict[str, Any]  # Resumen de unidades por escenario
    payment_flows: List[UnitSalesPaymentFlow]  # Detalle de flujos de pago por unidad

# Esta clase se mueve después de ProjectUnit


class ScenarioCashFlowBase(BaseModel):
    year: int
    month: int
    period_label: str
    ingresos_ventas: Decimal = Decimal('0.00')
    ingresos_otros: Decimal = Decimal('0.00')
    total_ingresos: Decimal = Decimal('0.00')
    costos_terreno: Decimal = Decimal('0.00')
    costos_duros: Decimal = Decimal('0.00')
    costos_blandos: Decimal = Decimal('0.00')
    costos_financiacion: Decimal = Decimal('0.00')
    costos_marketing: Decimal = Decimal('0.00')
    otros_egresos: Decimal = Decimal('0.00')
    total_egresos: Decimal = Decimal('0.00')
    flujo_neto: Decimal = Decimal('0.00')
    flujo_acumulado: Decimal = Decimal('0.00')
    flujo_descontado: Decimal = Decimal('0.00')

class ScenarioCashFlowCreate(ScenarioCashFlowBase):
    scenario_project_id: int

class ScenarioCashFlow(ScenarioCashFlowBase):
    id: int
    scenario_project_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True 

class ProjectUnitsBulkCreate(BaseModel):
    """Esquema para crear múltiples unidades de forma masiva"""
    quantity: int = Field(..., ge=1, le=1000, description="Cantidad de unidades a crear")
    unit_number_prefix: str = Field(..., description="Prefijo para el número de unidad (ej: 'A-', 'Casa-')")
    start_number: int = Field(1, ge=1, description="Número inicial para la secuencia")
    number_padding: int = Field(3, ge=1, le=5, description="Cantidad de dígitos para el número (padding con ceros)")
    
    # Características comunes para todas las unidades
    unit_type: str = Field(..., description="Tipo de unidad")
    construction_area_m2: Optional[Decimal] = None
    land_area_m2: Optional[Decimal] = None
    total_area_m2: Optional[Decimal] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[Decimal] = None
    parking_spaces: Optional[int] = None
    floor_level: Optional[int] = None
    
    # Configuración para múltiples pisos
    units_per_floor: Optional[int] = Field(None, description="Unidades por piso (para calcular nivel automáticamente)")
    
    # Precios comunes
    target_price_total: Optional[Decimal] = None
    price_per_m2_construction: Optional[Decimal] = None
    price_per_m2_land: Optional[Decimal] = None
    
    # Configuración común
    description: Optional[str] = None
    sales_priority: int = Field(1, ge=1, le=3, description="Prioridad de venta")

    class Config:
        json_encoders = {
            Decimal: lambda v: float(v) if v is not None else None
        }


class ProjectUnit(ProjectUnitBase):
    id: int
    scenario_project_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            Decimal: float,  # Convert Decimal to float for JSON serialization
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat()
        }


# --- Updated Project Schemas to include units ---
class ScenarioProjectWithUnits(ScenarioProject):
    cost_items: List[ScenarioCostItem] = []
    units: List[ProjectUnit] = []
    total_investment: Optional[Decimal] = None
    total_revenue: Optional[Decimal] = None
    npv: Optional[Decimal] = None
    irr: Optional[Decimal] = None

class ProjectUnitsStats(BaseModel):
    total_units: int
    sold_units: int
    available_units: int
    reserved_units: int
    total_value: float
    sold_value: float
    average_price: float

class UnitSalesSimulationBase(BaseModel):
    scenario_project_id: int
    name: str


# --- Project Stages Schemas ---

class ProjectStageBase(BaseModel):
    """Esquema base para etapas de proyecto"""
    stage_name: str
    stage_type: str
    description: Optional[str] = None
    stage_order: int
    parent_stage_id: Optional[int] = None
    
    planned_start_date: date
    planned_end_date: date
    
    status: str = "PLANNED"
    progress_percentage: Decimal = Decimal('0.00')
    
    allows_overlap: bool = True
    min_overlap_days: int = 0
    max_overlap_days: Optional[int] = None
    
    dependencies: Optional[List[int]] = None
    
    estimated_cost: Optional[Decimal] = None
    required_personnel: Optional[Dict[str, Any]] = None
    required_equipment: Optional[List[str]] = None
    
    milestones: Optional[List[Dict[str, Any]]] = None
    deliverables: Optional[List[str]] = None
    
    risk_level: str = "MEDIUM"
    contingency_days: int = 0
    risk_notes: Optional[str] = None

class ProjectStageCreate(ProjectStageBase):
    """Esquema para crear una etapa de proyecto"""
    pass

class ProjectStageUpdate(BaseModel):
    """Esquema para actualizar una etapa de proyecto"""
    stage_name: Optional[str] = None
    stage_type: Optional[str] = None
    description: Optional[str] = None
    stage_order: Optional[int] = None
    parent_stage_id: Optional[int] = None
    
    planned_start_date: Optional[date] = None
    planned_end_date: Optional[date] = None
    actual_start_date: Optional[date] = None
    actual_end_date: Optional[date] = None
    
    status: Optional[str] = None
    progress_percentage: Optional[Decimal] = None
    
    allows_overlap: Optional[bool] = None
    min_overlap_days: Optional[int] = None
    max_overlap_days: Optional[int] = None
    
    dependencies: Optional[List[int]] = None
    
    estimated_cost: Optional[Decimal] = None
    actual_cost: Optional[Decimal] = None
    required_personnel: Optional[Dict[str, Any]] = None
    required_equipment: Optional[List[str]] = None
    
    milestones: Optional[List[Dict[str, Any]]] = None
    deliverables: Optional[List[str]] = None
    
    risk_level: Optional[str] = None
    contingency_days: Optional[int] = None
    risk_notes: Optional[str] = None

class ProjectStage(ProjectStageBase):
    """Esquema completo para una etapa de proyecto"""
    id: int
    scenario_project_id: int
    
    planned_duration_days: Optional[int] = None
    actual_start_date: Optional[date] = None
    actual_end_date: Optional[date] = None
    actual_duration_days: Optional[int] = None
    actual_cost: Optional[Decimal] = None
    
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ProjectStageWithSubStages(ProjectStage):
    """Esquema de etapa con sub-etapas incluidas"""
    sub_stages: List[ProjectStage] = []

# Esquemas para templates de etapas predefinidas
class StageTemplate(BaseModel):
    """Template de etapa predefinida"""
    stage_type: str
    stage_name: str
    description: str
    typical_duration_days: int
    typical_dependencies: List[str] = []
    typical_deliverables: List[str] = []
    risk_level: str = "MEDIUM"
    required_personnel: Optional[Dict[str, Any]] = None

class ProjectStageTemplateResponse(BaseModel):
    """Respuesta con templates de etapas disponibles"""
    templates: List[StageTemplate]
    project_types: List[str] = ["RESIDENTIAL", "COMMERCIAL", "MIXED_USE"]

# Esquemas para análisis de cronograma
class StageScheduleAnalysis(BaseModel):
    """Análisis del cronograma de etapas"""
    total_project_duration_days: int
    critical_path: List[int]  # IDs de etapas en ruta crítica
    total_overlapping_days: int
    stages_with_delays: List[Dict[str, Any]]
    resource_conflicts: List[Dict[str, Any]]
    recommendations: List[str]

class ProjectTimelineResponse(BaseModel):
    """Respuesta con cronograma completo del proyecto"""
    project_id: int
    project_name: str
    total_duration_days: int
    start_date: date
    end_date: date
    stages: List[ProjectStageWithSubStages]
    schedule_analysis: StageScheduleAnalysis

# ComisionesVentas schemas
class ComisionesVentasBase(BaseModel):
    concepto: str
    # 2024
    amount_2024_01: Optional[Decimal] = None
    amount_2024_02: Optional[Decimal] = None
    amount_2024_03: Optional[Decimal] = None
    amount_2024_04: Optional[Decimal] = None
    amount_2024_05: Optional[Decimal] = None
    amount_2024_06: Optional[Decimal] = None
    amount_2024_07: Optional[Decimal] = None
    amount_2024_08: Optional[Decimal] = None
    amount_2024_09: Optional[Decimal] = None
    amount_2024_10: Optional[Decimal] = None
    amount_2024_11: Optional[Decimal] = None
    amount_2024_12: Optional[Decimal] = None
    # 2025
    amount_2025_01: Optional[Decimal] = None
    amount_2025_02: Optional[Decimal] = None
    amount_2025_03: Optional[Decimal] = None
    amount_2025_04: Optional[Decimal] = None
    amount_2025_05: Optional[Decimal] = None
    amount_2025_06: Optional[Decimal] = None
    amount_2025_07: Optional[Decimal] = None
    amount_2025_08: Optional[Decimal] = None
    amount_2025_09: Optional[Decimal] = None
    amount_2025_10: Optional[Decimal] = None
    amount_2025_11: Optional[Decimal] = None
    amount_2025_12: Optional[Decimal] = None
    # 2026
    amount_2026_01: Optional[Decimal] = None
    amount_2026_02: Optional[Decimal] = None
    amount_2026_03: Optional[Decimal] = None
    amount_2026_04: Optional[Decimal] = None
    amount_2026_05: Optional[Decimal] = None
    amount_2026_06: Optional[Decimal] = None
    amount_2026_07: Optional[Decimal] = None
    amount_2026_08: Optional[Decimal] = None
    amount_2026_09: Optional[Decimal] = None
    amount_2026_10: Optional[Decimal] = None
    amount_2026_11: Optional[Decimal] = None
    amount_2026_12: Optional[Decimal] = None
    # 2027
    amount_2027_01: Optional[Decimal] = None
    amount_2027_02: Optional[Decimal] = None
    amount_2027_03: Optional[Decimal] = None
    amount_2027_04: Optional[Decimal] = None
    amount_2027_05: Optional[Decimal] = None
    amount_2027_06: Optional[Decimal] = None
    amount_2027_07: Optional[Decimal] = None
    amount_2027_08: Optional[Decimal] = None
    amount_2027_09: Optional[Decimal] = None
    amount_2027_10: Optional[Decimal] = None
    amount_2027_11: Optional[Decimal] = None
    amount_2027_12: Optional[Decimal] = None
    # 2028
    amount_2028_01: Optional[Decimal] = None
    amount_2028_02: Optional[Decimal] = None
    amount_2028_03: Optional[Decimal] = None
    amount_2028_04: Optional[Decimal] = None
    amount_2028_05: Optional[Decimal] = None

class ComisionesVentasCreate(ComisionesVentasBase):
    pass

class ComisionesVentasUpdate(ComisionesVentasBase):
    pass

class ComisionesVentas(ComisionesVentasBase):
    id: int
    created_at: datetime
    updated_at: datetime
    # Year totals from view
    total_2024_2025: Optional[Decimal] = None
    total_2025_2026: Optional[Decimal] = None
    total_2026_2027: Optional[Decimal] = None
    total_2027_2028: Optional[Decimal] = None

    class Config:
        from_attributes = True

# --- Project Status Transition Schemas ---

class ProjectStatusTransition(BaseModel):
    """Transición de estado disponible para un proyecto"""
    target_status: str
    action: str
    label: str
    description: str
    button_color: str
    requirements: List[str]
    can_transition: bool
    validation_errors: List[str] = []

class ProjectStatusTransitionsResponse(BaseModel):
    """Respuesta con las transiciones de estado disponibles"""
    project_id: int
    current_status: str
    available_transitions: List[ProjectStatusTransition]

class ProjectTransitionResponse(BaseModel):
    """Respuesta de una transición exitosa de estado"""
    success: bool
    message: str
    project_id: int
    new_status: str
    metrics: Optional[Dict[str, Any]] = None
    baseline_items_created: Optional[int] = None
    baseline_cashflow_created: Optional[int] = None
    credit_lines_activated: Optional[int] = None
    warnings: Optional[List[str]] = None

class ProjectRejectionRequest(BaseModel):
    """Request para rechazar un proyecto"""
    reason: Optional[str] = None

# Schemas for Sales Projections
class SalesProjectionBase(BaseModel):
    scenario_name: str
    monthly_revenue: Dict[str, Any]  # JSON data with monthly revenue information
    payment_flows: Optional[List[Dict[str, Any]]] = None  # Detailed payment flows for analysis
    is_active: bool = False

class SalesProjectionCreate(SalesProjectionBase):
    scenario_project_id: int

class SalesProjectionUpdate(BaseModel):
    scenario_name: Optional[str] = None
    monthly_revenue: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

class SalesProjection(SalesProjectionBase):
    id: int
    scenario_project_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class SalesProjectionWithImpact(SalesProjection):
    """Sales projection with calculated cash flow impact"""
    cash_flow_impact: List[Dict[str, Any]] = []
    total_revenue: Optional[Decimal] = None
    npv: Optional[Decimal] = None
    irr: Optional[Decimal] = None

# After all models are defined, rebuild the forward references
ScenarioProjectWithDetails.model_rebuild()
ProjectStageWithSubStages.model_rebuild()
ScenarioProjectWithUnits.model_rebuild()