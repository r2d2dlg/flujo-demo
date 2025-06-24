"""
FastAPI router for accounting system integrations
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from typing import List, Dict, Any, Optional
from datetime import date, datetime
from pydantic import BaseModel, Field
import logging

from ..integrations.manager import integration_manager
from ..integrations.base import (
    IntegrationConfig, 
    AccountingSystemType, 
    SyncResult, 
    SyncDirection,
    BaseAccountingEntry,
    BaseCustomer,
    BaseVendor,
    BaseProject
)
from ..integrations.quickbooks import QuickBooksConfig
from ..integrations.sap import SAPConfig
from ..integrations.generic_api import GenericAPIConfig

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/integrations", tags=["Accounting Integrations"])

# Request/Response models
class IntegrationCreateRequest(BaseModel):
    integration_id: str = Field(..., description="Unique identifier for the integration")
    system_type: AccountingSystemType
    name: str
    enabled: bool = False
    config_data: Dict[str, Any] = Field(..., description="System-specific configuration")

class IntegrationUpdateRequest(BaseModel):
    name: Optional[str] = None
    enabled: Optional[bool] = None
    config_data: Optional[Dict[str, Any]] = None

class SyncRequest(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    integration_ids: Optional[List[str]] = None

class IntegrationResponse(BaseModel):
    id: str
    name: str
    system_type: str
    enabled: bool
    last_sync: Optional[datetime] = None
    auto_sync: bool

class SyncResultResponse(BaseModel):
    status: str
    total_records: int
    successful_records: int
    failed_records: int
    errors: List[str]
    warnings: List[str]
    sync_timestamp: datetime
    execution_time_seconds: Optional[float] = None

class ConnectionTestResponse(BaseModel):
    integration_id: str
    connected: bool
    message: Optional[str] = None

@router.get("/systems", response_model=List[Dict[str, str]])
async def get_supported_systems():
    """Get list of supported accounting systems"""
    return integration_manager.get_supported_systems()

@router.get("/", response_model=List[IntegrationResponse])
async def list_integrations():
    """List all registered integrations"""
    integrations = integration_manager.list_integrations()
    return [IntegrationResponse(**integration) for integration in integrations]

@router.post("/", response_model=Dict[str, str])
async def create_integration(request: IntegrationCreateRequest):
    """Create a new integration"""
    try:
        # Create appropriate config based on system type
        if request.system_type == AccountingSystemType.QUICKBOOKS:
            config = QuickBooksConfig(
                system_type=request.system_type,
                name=request.name,
                enabled=request.enabled,
                **request.config_data
            )
        elif request.system_type == AccountingSystemType.SAP:
            config = SAPConfig(
                system_type=request.system_type,
                name=request.name,
                enabled=request.enabled,
                **request.config_data
            )
        else:
            config = GenericAPIConfig(
                system_type=request.system_type,
                name=request.name,
                enabled=request.enabled,
                **request.config_data
            )
        
        success = integration_manager.register_integration(request.integration_id, config)
        
        if success:
            return {"message": f"Integration {request.integration_id} created successfully"}
        else:
            raise HTTPException(status_code=400, detail="Failed to create integration")
            
    except Exception as e:
        logger.error(f"Error creating integration: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{integration_id}/status")
async def get_integration_status(integration_id: str):
    """Get status of a specific integration"""
    status = await integration_manager.get_integration_status(integration_id)
    if not status:
        raise HTTPException(status_code=404, detail="Integration not found")
    return status

@router.get("/status")
async def get_all_integration_statuses():
    """Get status of all integrations"""
    return await integration_manager.get_all_integration_statuses()

@router.post("/{integration_id}/test-connection", response_model=ConnectionTestResponse)
async def test_integration_connection(integration_id: str):
    """Test connection for a specific integration"""
    integration = integration_manager.get_integration(integration_id)
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    try:
        connected = await integration_manager.test_connection(integration_id)
        return ConnectionTestResponse(
            integration_id=integration_id,
            connected=connected,
            message="Connection successful" if connected else "Connection failed"
        )
    except Exception as e:
        return ConnectionTestResponse(
            integration_id=integration_id,
            connected=False,
            message=str(e)
        )

@router.post("/test-connections")
async def test_all_connections():
    """Test connections for all integrations"""
    results = await integration_manager.test_all_connections()
    return {
        integration_id: ConnectionTestResponse(
            integration_id=integration_id,
            connected=connected,
            message="Connection successful" if connected else "Connection failed"
        )
        for integration_id, connected in results.items()
    }

@router.post("/{integration_id}/sync", response_model=SyncResultResponse)
async def sync_integration(integration_id: str, request: SyncRequest = Body(default=SyncRequest())):
    """Synchronize data for a specific integration"""
    result = await integration_manager.sync_integration(
        integration_id, 
        request.start_date, 
        request.end_date
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="Integration not found or disabled")
    
    return SyncResultResponse(**result.dict())

@router.post("/sync", response_model=Dict[str, SyncResultResponse])
async def sync_all_integrations(request: SyncRequest = Body(default=SyncRequest())):
    """Synchronize data for all enabled integrations"""
    if request.integration_ids:
        # Sync specific integrations
        results = {}
        for integration_id in request.integration_ids:
            result = await integration_manager.sync_integration(
                integration_id, 
                request.start_date, 
                request.end_date
            )
            if result:
                results[integration_id] = SyncResultResponse(**result.dict())
        return results
    else:
        # Sync all integrations
        results = await integration_manager.sync_all_integrations(
            request.start_date, 
            request.end_date
        )
        return {
            integration_id: SyncResultResponse(**result.dict())
            for integration_id, result in results.items()
        }

@router.delete("/{integration_id}")
async def delete_integration(integration_id: str):
    """Delete an integration"""
    success = integration_manager.unregister_integration(integration_id)
    if success:
        return {"message": f"Integration {integration_id} deleted successfully"}
    else:
        raise HTTPException(status_code=404, detail="Integration not found")

@router.put("/{integration_id}")
async def update_integration(integration_id: str, request: IntegrationUpdateRequest):
    """Update an integration configuration"""
    integration = integration_manager.get_integration(integration_id)
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    try:
        # Update configuration
        if request.name:
            integration.config.name = request.name
        if request.enabled is not None:
            integration.config.enabled = request.enabled
        if request.config_data:
            # Update connection parameters
            integration.config.connection_params.update(request.config_data)
        
        return {"message": f"Integration {integration_id} updated successfully"}
        
    except Exception as e:
        logger.error(f"Error updating integration: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{integration_id}/entries", response_model=List[BaseAccountingEntry])
async def get_integration_entries(
    integration_id: str,
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    project_code: Optional[str] = Query(None)
):
    """Get accounting entries from a specific integration"""
    integration = integration_manager.get_integration(integration_id)
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    try:
        entries = await integration.get_accounting_entries(start_date, end_date, project_code)
        return entries
    except Exception as e:
        logger.error(f"Error retrieving entries: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{integration_id}/customers", response_model=List[BaseCustomer])
async def get_integration_customers(integration_id: str):
    """Get customers from a specific integration"""
    integration = integration_manager.get_integration(integration_id)
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    try:
        customers = await integration.get_customers()
        return customers
    except Exception as e:
        logger.error(f"Error retrieving customers: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{integration_id}/vendors", response_model=List[BaseVendor])
async def get_integration_vendors(integration_id: str):
    """Get vendors from a specific integration"""
    integration = integration_manager.get_integration(integration_id)
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    try:
        vendors = await integration.get_vendors()
        return vendors
    except Exception as e:
        logger.error(f"Error retrieving vendors: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{integration_id}/projects", response_model=List[BaseProject])
async def get_integration_projects(integration_id: str):
    """Get projects from a specific integration"""
    integration = integration_manager.get_integration(integration_id)
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    try:
        projects = await integration.get_projects()
        return projects
    except Exception as e:
        logger.error(f"Error retrieving projects: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{integration_id}/config/template")
async def get_integration_config_template(integration_id: str):
    """Get configuration template for a specific system type"""
    integration = integration_manager.get_integration(integration_id)
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    system_type = integration.config.system_type
    template = integration_manager.create_default_config(system_type, "Template")
    
    if template:
        return template.dict()
    else:
        raise HTTPException(status_code=400, detail="Unable to create template for this system type")

@router.get("/config/template/{system_type}")
async def get_system_config_template(system_type: AccountingSystemType):
    """Get configuration template for a system type"""
    template = integration_manager.create_default_config(system_type, "New Integration")
    
    if template:
        return template.dict()
    else:
        raise HTTPException(status_code=400, detail="Unable to create template for this system type") 