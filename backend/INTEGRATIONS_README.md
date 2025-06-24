# Sistema de Integraciones Contables

## Descripción General

El sistema de integraciones contables permite conectar tu aplicación de gestión financiera con sistemas de contabilidad externos como SAP, QuickBooks, Xero, ODOO, ContPAQ, Aspel y otros sistemas ERP/contables mediante APIs.

## Características Principales

- **Múltiples Sistemas**: Soporte para SAP, QuickBooks, Xero, ODOO, Sage, ContPAQ, Aspel y APIs genéricas
- **Sincronización Bidireccional**: Importar y exportar datos entre sistemas
- **Configuración Flexible**: Mapeo de campos personalizable para cada sistema
- **Sincronización Automática**: Programación de sincronizaciones periódicas
- **Monitoreo en Tiempo Real**: Estado de conexiones y resultados de sincronización
- **API REST Completa**: Endpoints para gestión completa de integraciones

## Arquitectura

### Componentes Principales

1. **Base Classes** (`integrations/base.py`)
   - Clases abstractas y modelos base
   - Definición de interfaces comunes
   - Modelos de datos estandarizados

2. **Integration Manager** (`integrations/manager.py`)
   - Gestión centralizada de todas las integraciones
   - Registro y configuración de integraciones
   - Coordinación de sincronizaciones

3. **System-Specific Integrations**
   - QuickBooks (`integrations/quickbooks.py`)
   - SAP (`integrations/sap.py`)
   - Generic API (`integrations/generic_api.py`)

4. **API Router** (`routers/integrations.py`)
   - Endpoints REST para gestión de integraciones
   - Documentación automática con FastAPI

## Sistemas Soportados

### 1. QuickBooks Online
- **Protocolo**: OAuth 2.0 + REST API
- **Capacidades**: Asientos contables, clientes, proveedores, proyectos (clases)
- **Configuración**: Client ID, Client Secret, Realm ID, tokens

### 2. SAP
- **Protocolos**: OData Services, RFC (opcional)
- **Capacidades**: GL entries, maestros de clientes/proveedores, proyectos WBS
- **Configuración**: Host, puerto, cliente, credenciales, URL OData

### 3. Xero
- **Protocolo**: OAuth 2.0 + REST API
- **Configuración**: Via Generic API con endpoints específicos

### 4. ODOO
- **Protocolo**: XML-RPC / REST API
- **Configuración**: Via Generic API con autenticación personalizada

### 5. ContPAQ / Aspel
- **Protocolo**: APIs propietarias
- **Configuración**: Via Generic API con mapeo específico

### 6. Generic API
- **Protocolo**: REST API configurable
- **Autenticación**: Bearer Token, Basic Auth, API Key
- **Mapeo**: Campos configurables por sistema

## Configuración

### Ejemplo QuickBooks
```json
{
  "system_type": "quickbooks",
  "name": "QuickBooks Principal",
  "enabled": true,
  "client_id": "tu_client_id",
  "client_secret": "tu_client_secret",
  "redirect_uri": "https://tu-app.com/callback",
  "realm_id": "company_id",
  "base_url": "https://sandbox-quickbooks.api.intuit.com"
}
```

### Ejemplo SAP
```json
{
  "system_type": "sap",
  "name": "SAP Producción",
  "enabled": true,
  "server_host": "sap-server.company.com",
  "server_port": 8000,
  "client": "100",
  "username": "usuario_sap",
  "password": "password",
  "use_odata": true,
  "odata_base_url": "https://sap-server.company.com:8000/sap/opu/odata/sap/ZFI_ACCOUNTING_SRV"
}
```

### Ejemplo API Genérica (Xero)
```json
{
  "system_type": "xero",
  "name": "Xero Contabilidad",
  "enabled": true,
  "base_url": "https://api.xero.com",
  "api_version": "api.xro/2.0",
  "auth_type": "bearer",
  "access_token": "tu_access_token",
  "endpoints": {
    "entries": "/JournalLines",
    "customers": "/Contacts?where=IsCustomer==true",
    "vendors": "/Contacts?where=IsSupplier==true",
    "projects": "/Projects",
    "test": "/Organisation"
  },
  "field_mappings": {
    "entries": {
      "external_id": "JournalLineID",
      "account_code": "AccountCode",
      "account_name": "AccountName",
      "entry_date": "Date",
      "description": "Description",
      "debit_amount": "DebitAmount",
      "credit_amount": "CreditAmount"
    }
  }
}
```

## API Endpoints

### Gestión de Integraciones
- `GET /api/integrations/` - Listar integraciones
- `POST /api/integrations/` - Crear integración
- `PUT /api/integrations/{id}` - Actualizar integración
- `DELETE /api/integrations/{id}` - Eliminar integración

### Estado y Conexiones
- `GET /api/integrations/status` - Estado de todas las integraciones
- `GET /api/integrations/{id}/status` - Estado de una integración
- `POST /api/integrations/{id}/test-connection` - Probar conexión
- `POST /api/integrations/test-connections` - Probar todas las conexiones

### Sincronización
- `POST /api/integrations/{id}/sync` - Sincronizar una integración
- `POST /api/integrations/sync` - Sincronizar todas las integraciones

### Datos
- `GET /api/integrations/{id}/entries` - Obtener asientos contables
- `GET /api/integrations/{id}/customers` - Obtener clientes
- `GET /api/integrations/{id}/vendors` - Obtener proveedores
- `GET /api/integrations/{id}/projects` - Obtener proyectos

### Configuración
- `GET /api/integrations/systems` - Sistemas soportados
- `GET /api/integrations/config/template/{system_type}` - Template de configuración

## Uso Práctico

### 1. Crear una Integración QuickBooks

```python
# Via API
import requests

config_data = {
    "client_id": "tu_client_id",
    "client_secret": "tu_client_secret",
    "redirect_uri": "https://tu-app.com/callback",
    "realm_id": "company_id",
    "base_url": "https://sandbox-quickbooks.api.intuit.com"
}

response = requests.post("/api/integrations/", json={
    "integration_id": "quickbooks-main",
    "system_type": "quickbooks",
    "name": "QuickBooks Principal",
    "enabled": True,
    "config_data": config_data
})
```

### 2. Sincronizar Datos

```python
# Sincronizar asientos del último mes
from datetime import date, timedelta

start_date = date.today() - timedelta(days=30)
end_date = date.today()

response = requests.post("/api/integrations/quickbooks-main/sync", json={
    "start_date": start_date.isoformat(),
    "end_date": end_date.isoformat()
})

result = response.json()
print(f"Sincronizados: {result['successful_records']} registros")
```

### 3. Obtener Datos en Tiempo Real

```python
# Obtener clientes de QuickBooks
response = requests.get("/api/integrations/quickbooks-main/customers")
customers = response.json()

for customer in customers:
    print(f"Cliente: {customer['name']} - Email: {customer['email']}")
```

## Extensibilidad

### Agregar un Nuevo Sistema

1. **Crear Integración Específica**:
```python
# integrations/mi_sistema.py
from .base import BaseAccountingIntegration, IntegrationConfig

class MiSistemaConfig(IntegrationConfig):
    api_url: str
    api_key: str

class MiSistemaIntegration(BaseAccountingIntegration):
    async def get_accounting_entries(self, start_date, end_date, project_code):
        # Implementar lógica específica
        pass
```

2. **Registrar en Manager**:
```python
# integrations/manager.py
from .mi_sistema import MiSistemaIntegration, MiSistemaConfig

self.integration_registry[AccountingSystemType.MI_SISTEMA] = MiSistemaIntegration
self.config_registry[AccountingSystemType.MI_SISTEMA] = MiSistemaConfig
```

## Seguridad

### Mejores Prácticas

1. **Credenciales**:
   - Usar variables de entorno para credenciales sensibles
   - Implementar rotación de tokens automática
   - Cifrar credenciales en base de datos

2. **Conexiones**:
   - Usar HTTPS para todas las conexiones
   - Validar certificados SSL
   - Implementar timeouts apropiados

3. **Datos**:
   - Validar todos los datos de entrada
   - Sanitizar datos antes de almacenar
   - Implementar logging de auditoría

## Monitoreo y Logging

### Métricas Importantes

- Estado de conexiones por sistema
- Frecuencia y éxito de sincronizaciones
- Tiempo de respuesta de APIs externas
- Volumen de datos sincronizados
- Errores y excepciones

### Logs Estructurados

```python
logger.info("Integration sync started", extra={
    "integration_id": "quickbooks-main",
    "start_date": "2024-01-01",
    "end_date": "2024-01-31"
})

logger.error("Sync failed", extra={
    "integration_id": "sap-prod",
    "error": str(e),
    "records_processed": 150
})
```

## Troubleshooting

### Problemas Comunes

1. **Error de Conexión**:
   - Verificar credenciales
   - Comprobar conectividad de red
   - Validar URLs y endpoints

2. **Token Expirado**:
   - Implementar refresh automático
   - Verificar configuración OAuth

3. **Mapeo de Campos**:
   - Revisar field_mappings
   - Validar estructura de datos

4. **Performance**:
   - Implementar paginación
   - Usar filtros de fecha
   - Procesar en lotes

## Roadmap

### Funcionalidades Futuras

- [ ] Webhooks para sincronización en tiempo real
- [ ] Interface gráfica para mapeo de campos
- [ ] Soporte para más sistemas (NetSuite, Dynamics, etc.)
- [ ] Transformaciones de datos avanzadas
- [ ] Dashboard de monitoreo en tiempo real
- [ ] API de notificaciones
- [ ] Backup y recovery automático

## Soporte

Para soporte técnico o preguntas sobre implementación:

1. Revisar logs de aplicación
2. Consultar documentación de APIs externas
3. Verificar configuración de red y firewall
4. Contactar al equipo de desarrollo

---

**Nota**: Este sistema está diseñado para ser extensible y mantenible. Sigue los principios SOLID y patrones de diseño establecidos para facilitar futuras mejoras y mantenimiento. 