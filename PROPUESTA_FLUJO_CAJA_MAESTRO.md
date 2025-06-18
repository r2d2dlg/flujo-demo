# Propuesta: Sistema de Flujo de Caja Maestro

## 🎯 Objetivo
Crear una tabla maestra centralizada que maneje todos los flujos de caja de la empresa, reemplazando el sistema actual fragmentado de múltiples tablas.

## 📊 Análisis del Estado Actual

### Tablas Actuales Identificadas:
- `proyeccion_flujo_efectivo_ventas` - Proyecciones de ventas
- `pagos_tierra` - Pagos de terrenos
- `infraestructura_pagos` - Pagos de infraestructura  
- `vivienda_pagos` - Pagos de viviendas
- `proyecto_variable_payroll` - Nómina variable
- `pagos` - Pagos generales
- `lineas_credito` - Líneas de crédito (ingresos/egresos)
- Múltiples tablas de marketing
- Tablas de costos directos
- Tablas de estudios y permisos

### Problemas Actuales:
1. **Fragmentación**: Datos dispersos en múltiples tablas
2. **Inconsistencia**: Diferentes formatos y estructuras
3. **Mantenimiento**: Difícil sincronización entre tablas
4. **Reporting**: Complicado consolidar información
5. **Performance**: Múltiples JOINs para reportes consolidados

## 🏗️ Diseño de la Tabla Maestra

### Estructura Propuesta: `flujo_caja_maestro`

```sql
CREATE TABLE flujo_caja_maestro (
    -- Identificación
    id SERIAL PRIMARY KEY,
    
    -- Clasificación jerárquica
    categoria_principal VARCHAR(50) NOT NULL,     -- 'INGRESOS', 'EGRESOS'
    categoria_secundaria VARCHAR(100) NOT NULL,   -- 'Ventas', 'Marketing', 'Nómina', etc.
    subcategoria VARCHAR(100),                    -- Detalle específico
    concepto VARCHAR(255) NOT NULL,               -- Descripción del item
    
    -- Dimensiones de negocio
    proyecto VARCHAR(100),                        -- Proyecto específico (si aplica)
    centro_costo VARCHAR(100),                    -- Centro de costo
    area_responsable VARCHAR(100),                -- Área responsable
    
    -- Datos temporales
    fecha_registro DATE NOT NULL DEFAULT CURRENT_DATE,
    periodo_inicio DATE NOT NULL,                 -- Inicio del período de impacto
    periodo_fin DATE,                            -- Fin del período (NULL para eventos únicos)
    
    -- Datos financieros
    moneda VARCHAR(3) NOT NULL DEFAULT 'USD',
    monto_base NUMERIC(15,2) NOT NULL,           -- Monto base del concepto
    
    -- Distribución temporal (JSON para flexibilidad)
    distribucion_mensual JSONB,                  -- {"2024_01": 1000, "2024_02": 1500, ...}
    
    -- Metadatos
    tipo_registro VARCHAR(20) NOT NULL,          -- 'REAL', 'PROYECTADO', 'PRESUPUESTADO'
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO', -- 'ACTIVO', 'INACTIVO', 'CANCELADO'
    origen_dato VARCHAR(50),                     -- Sistema/tabla de origen
    referencia_externa VARCHAR(100),             -- ID en sistema origen
    
    -- Campos de control
    usuario_creacion VARCHAR(100),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_modificacion VARCHAR(100),
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Índices para performance
    CONSTRAINT chk_categoria_principal CHECK (categoria_principal IN ('INGRESOS', 'EGRESOS')),
    CONSTRAINT chk_tipo_registro CHECK (tipo_registro IN ('REAL', 'PROYECTADO', 'PRESUPUESTADO')),
    CONSTRAINT chk_estado CHECK (estado IN ('ACTIVO', 'INACTIVO', 'CANCELADO'))
);

-- Índices optimizados
CREATE INDEX idx_flujo_caja_categoria ON flujo_caja_maestro(categoria_principal, categoria_secundaria);
CREATE INDEX idx_flujo_caja_proyecto ON flujo_caja_maestro(proyecto);
CREATE INDEX idx_flujo_caja_periodo ON flujo_caja_maestro(periodo_inicio, periodo_fin);
CREATE INDEX idx_flujo_caja_tipo ON flujo_caja_maestro(tipo_registro);
CREATE INDEX idx_flujo_caja_estado ON flujo_caja_maestro(estado);
CREATE INDEX idx_flujo_caja_fecha ON flujo_caja_maestro(fecha_registro);
CREATE INDEX idx_flujo_caja_distribucion ON flujo_caja_maestro USING GIN(distribucion_mensual);
```

## 📋 Categorización Estándar

### Categorías Principales:
- **INGRESOS**
- **EGRESOS**

### Categorías Secundarias de INGRESOS:
- `Ventas_Proyectos`
- `Lineas_Credito`
- `Otros_Ingresos`
- `Ingresos_Financieros`

### Categorías Secundarias de EGRESOS:
- `Costos_Directos`
  - Subcategorías: `Materiales`, `Mano_Obra`, `Equipos`, `Infraestructura`
- `Gastos_Operativos`
  - Subcategorías: `Nomina_Administrativa`, `Nomina_Variable`, `Marketing`, `Servicios_Profesionales`
- `Gastos_Financieros`
  - Subcategorías: `Intereses_Bancarios`, `Cargos_Bancarios`, `Comisiones`
- `Inversiones`
  - Subcategorías: `Pagos_Tierra`, `Estudios_Permisos`, `Infraestructura`, `Viviendas`

## 🔄 Funciones de Utilidad

### 1. Función para Distribuir Montos por Períodos

```sql
CREATE OR REPLACE FUNCTION distribuir_monto_temporal(
    p_monto NUMERIC,
    p_fecha_inicio DATE,
    p_fecha_fin DATE,
    p_tipo_distribucion VARCHAR -- 'UNIFORME', 'PERSONALIZADA', 'INICIO', 'FIN'
) RETURNS JSONB AS $$
DECLARE
    resultado JSONB := '{}';
    fecha_actual DATE;
    meses_total INTEGER;
    monto_mensual NUMERIC;
    periodo_key VARCHAR;
BEGIN
    IF p_tipo_distribucion = 'INICIO' THEN
        periodo_key := TO_CHAR(p_fecha_inicio, 'YYYY_MM');
        resultado := jsonb_build_object(periodo_key, p_monto);
    ELSIF p_tipo_distribucion = 'FIN' THEN
        periodo_key := TO_CHAR(COALESCE(p_fecha_fin, p_fecha_inicio), 'YYYY_MM');
        resultado := jsonb_build_object(periodo_key, p_monto);
    ELSIF p_tipo_distribucion = 'UNIFORME' AND p_fecha_fin IS NOT NULL THEN
        meses_total := EXTRACT(YEAR FROM AGE(p_fecha_fin, p_fecha_inicio)) * 12 + 
                      EXTRACT(MONTH FROM AGE(p_fecha_fin, p_fecha_inicio)) + 1;
        monto_mensual := p_monto / meses_total;
        
        fecha_actual := DATE_TRUNC('month', p_fecha_inicio);
        WHILE fecha_actual <= p_fecha_fin LOOP
            periodo_key := TO_CHAR(fecha_actual, 'YYYY_MM');
            resultado := resultado || jsonb_build_object(periodo_key, monto_mensual);
            fecha_actual := fecha_actual + INTERVAL '1 month';
        END LOOP;
    ELSE
        -- Por defecto, poner todo en el mes de inicio
        periodo_key := TO_CHAR(p_fecha_inicio, 'YYYY_MM');
        resultado := jsonb_build_object(periodo_key, p_monto);
    END IF;
    
    RETURN resultado;
END;
$$ LANGUAGE plpgsql;
```

### 2. Vista Dinámica para Reportes (3 meses antes + 60 meses después)

```sql
CREATE OR REPLACE VIEW v_flujo_caja_dinamico AS
WITH periodos AS (
    SELECT 
        TO_CHAR(fecha, 'YYYY_MM') as periodo_key,
        fecha,
        EXTRACT(YEAR FROM fecha) as año,
        EXTRACT(MONTH FROM fecha) as mes
    FROM generate_series(
        DATE_TRUNC('month', CURRENT_DATE - INTERVAL '3 months'),
        DATE_TRUNC('month', CURRENT_DATE + INTERVAL '60 months'),
        INTERVAL '1 month'
    ) as fecha
),
flujo_expandido AS (
    SELECT 
        f.*,
        p.periodo_key,
        p.fecha as periodo_fecha,
        COALESCE((f.distribucion_mensual->>p.periodo_key)::NUMERIC, 0) as monto_periodo
    FROM flujo_caja_maestro f
    CROSS JOIN periodos p
    WHERE f.estado = 'ACTIVO'
)
SELECT 
    categoria_principal,
    categoria_secundaria,
    subcategoria,
    concepto,
    proyecto,
    centro_costo,
    area_responsable,
    tipo_registro,
    moneda,
    periodo_key,
    periodo_fecha,
    SUM(monto_periodo) as monto
FROM flujo_expandido
WHERE monto_periodo != 0
GROUP BY 1,2,3,4,5,6,7,8,9,10,11
ORDER BY categoria_principal DESC, categoria_secundaria, periodo_fecha;
```

## 🔧 API y Backend

### Modelo SQLAlchemy

```python
class FlujoCajaMaestro(Base):
    __tablename__ = "flujo_caja_maestro"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Clasificación
    categoria_principal = Column(String(50), nullable=False)
    categoria_secundaria = Column(String(100), nullable=False)
    subcategoria = Column(String(100))
    concepto = Column(String(255), nullable=False)
    
    # Dimensiones
    proyecto = Column(String(100))
    centro_costo = Column(String(100))
    area_responsable = Column(String(100))
    
    # Temporales
    fecha_registro = Column(Date, nullable=False, default=date.today)
    periodo_inicio = Column(Date, nullable=False)
    periodo_fin = Column(Date)
    
    # Financieros
    moneda = Column(String(3), nullable=False, default='USD')
    monto_base = Column(Numeric(15, 2), nullable=False)
    distribucion_mensual = Column(JSON)
    
    # Metadatos
    tipo_registro = Column(String(20), nullable=False)
    estado = Column(String(20), nullable=False, default='ACTIVO')
    origen_dato = Column(String(50))
    referencia_externa = Column(String(100))
    
    # Control
    usuario_creacion = Column(String(100))
    fecha_creacion = Column(DateTime, default=datetime.utcnow)
    usuario_modificacion = Column(String(100))
    fecha_modificacion = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

### Endpoints Principales

```python
@router.get("/flujo-caja/consolidado")
def get_flujo_consolidado(
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    categoria: Optional[str] = None,
    proyecto: Optional[str] = None,
    tipo_registro: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Obtener flujo de caja consolidado con filtros"""
    
@router.post("/flujo-caja/")
def create_flujo_item(item: FlujoCajaCreate, db: Session = Depends(get_db)):
    """Crear nuevo item de flujo de caja"""
    
@router.put("/flujo-caja/{item_id}/distribucion")
def update_distribucion(
    item_id: int, 
    distribucion: Dict[str, float], 
    db: Session = Depends(get_db)
):
    """Actualizar distribución mensual de un item"""
```

## 🎨 Frontend - Componente Universal

### Componente Principal: `FlujoCajaMaestroPage.tsx`

```typescript
interface FlujoCajaItem {
  id: number;
  categoria_principal: 'INGRESOS' | 'EGRESOS';
  categoria_secundaria: string;
  subcategoria?: string;
  concepto: string;
  proyecto?: string;
  monto_base: number;
  distribucion_mensual: Record<string, number>;
  tipo_registro: 'REAL' | 'PROYECTADO' | 'PRESUPUESTADO';
  estado: 'ACTIVO' | 'INACTIVO' | 'CANCELADO';
}

// Componente con tabs dinámicos: 3 meses antes + 60 meses después
// Agrupados en períodos de 12 meses como en la página actual
```

## 📊 Migración de Datos

### Estrategia de Migración

1. **Fase 1**: Crear tabla maestra y funciones
2. **Fase 2**: Migrar datos existentes con scripts de transformación
3. **Fase 3**: Crear vistas de compatibilidad para APIs existentes
4. **Fase 4**: Actualizar frontend gradualmente
5. **Fase 5**: Deprecar tablas antiguas

### Script de Migración Ejemplo

```python
def migrate_marketing_data():
    """Migrar datos de marketing a tabla maestra"""
    marketing_data = get_marketing_budget_data()
    
    for item in marketing_data:
        flujo_item = FlujoCajaMaestro(
            categoria_principal='EGRESOS',
            categoria_secundaria='Gastos_Operativos',
            subcategoria='Marketing',
            concepto=item['descripcion'],
            proyecto=item.get('proyecto'),
            monto_base=item['monto'],
            periodo_inicio=item['fecha_prevista'],
            distribucion_mensual=calculate_distribution(item),
            tipo_registro='PRESUPUESTADO',
            origen_dato='marketing_budget',
            referencia_externa=str(item['id'])
        )
        db.add(flujo_item)
```

## ✅ Ventajas del Sistema Propuesto

1. **Centralización**: Un solo lugar para todos los flujos
2. **Flexibilidad**: Estructura adaptable a nuevos requerimientos
3. **Performance**: Consultas optimizadas con índices apropiados
4. **Escalabilidad**: Soporta crecimiento futuro
5. **Consistencia**: Formato estándar para todos los datos
6. **Trazabilidad**: Historial completo de cambios
7. **Reportes**: Facilita generación de reportes consolidados
8. **Mantenimiento**: Reducción significativa de complejidad

## 🚀 Próximos Pasos

1. **Validar propuesta** con stakeholders
2. **Crear tabla maestra** y funciones
3. **Desarrollar APIs** básicas
4. **Crear componente frontend** universal
5. **Migrar datos** de una tabla a la vez
6. **Probar y validar** con datos reales
7. **Desplegar gradualmente** por módulos

¿Te parece viable esta propuesta? ¿Hay algún aspecto específico que te gustaría modificar o profundizar? 