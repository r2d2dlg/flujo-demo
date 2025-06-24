"""
Integration Manager - Centralized service for managing all accounting integrations
"""
import asyncio
from typing import Dict, List, Optional, Type, Any
from datetime import datetime, date
import logging
from sqlalchemy.orm import Session

from .base import (
    BaseAccountingIntegration,
    IntegrationConfig,
    AccountingSystemType,
    SyncResult,
    IntegrationStatus
)
from .quickbooks import QuickBooksIntegration, QuickBooksConfig
from .sap import SAPIntegration, SAPConfig
from .generic_api import GenericAPIIntegration, GenericAPIConfig

logger = logging.getLogger(__name__)

class IntegrationManager:
    """Manages all accounting system integrations"""
    
    def __init__(self):
        self.integrations: Dict[str, BaseAccountingIntegration] = {}
        self.configs: Dict[str, IntegrationConfig] = {}
        
        # Registry of available integration types
        self.integration_registry: Dict[AccountingSystemType, Type[BaseAccountingIntegration]] = {
            AccountingSystemType.QUICKBOOKS: QuickBooksIntegration,
            AccountingSystemType.SAP: SAPIntegration,
            AccountingSystemType.XERO: GenericAPIIntegration,
            AccountingSystemType.ODOO: GenericAPIIntegration,
            AccountingSystemType.SAGE: GenericAPIIntegration,
            AccountingSystemType.CONTPAQ: GenericAPIIntegration,
            AccountingSystemType.ASPEL: GenericAPIIntegration,
            AccountingSystemType.GENERIC_API: GenericAPIIntegration,
        }
        
        self.config_registry: Dict[AccountingSystemType, Type[IntegrationConfig]] = {
            AccountingSystemType.QUICKBOOKS: QuickBooksConfig,
            AccountingSystemType.SAP: SAPConfig,
            AccountingSystemType.XERO: GenericAPIConfig,
            AccountingSystemType.ODOO: GenericAPIConfig,
            AccountingSystemType.SAGE: GenericAPIConfig,
            AccountingSystemType.CONTPAQ: GenericAPIConfig,
            AccountingSystemType.ASPEL: GenericAPIConfig,
            AccountingSystemType.GENERIC_API: GenericAPIConfig,
        }
    
    def register_integration(self, integration_id: str, config: IntegrationConfig) -> bool:
        """Register a new integration"""
        try:
            # Get the appropriate integration class
            integration_class = self.integration_registry.get(config.system_type)
            if not integration_class:
                logger.error(f"Unsupported system type: {config.system_type}")
                return False
            
            # Create and store the integration
            integration = integration_class(config)
            self.integrations[integration_id] = integration
            self.configs[integration_id] = config
            
            logger.info(f"Registered integration: {integration_id} ({config.system_type})")
            return True
            
        except Exception as e:
            logger.error(f"Error registering integration {integration_id}: {str(e)}")
            return False
    
    def unregister_integration(self, integration_id: str) -> bool:
        """Unregister an integration"""
        try:
            if integration_id in self.integrations:
                del self.integrations[integration_id]
                del self.configs[integration_id]
                logger.info(f"Unregistered integration: {integration_id}")
                return True
            return False
        except Exception as e:
            logger.error(f"Error unregistering integration {integration_id}: {str(e)}")
            return False
    
    def get_integration(self, integration_id: str) -> Optional[BaseAccountingIntegration]:
        """Get an integration by ID"""
        return self.integrations.get(integration_id)
    
    def list_integrations(self) -> List[Dict[str, Any]]:
        """List all registered integrations"""
        integrations_info = []
        for integration_id, config in self.configs.items():
            integrations_info.append({
                "id": integration_id,
                "name": config.name,
                "system_type": config.system_type,
                "enabled": config.enabled,
                "last_sync": config.last_sync,
                "auto_sync": config.auto_sync
            })
        return integrations_info
    
    async def test_connection(self, integration_id: str) -> bool:
        """Test connection for a specific integration"""
        integration = self.get_integration(integration_id)
        if not integration:
            return False
        
        return await integration.test_connection()
    
    async def test_all_connections(self) -> Dict[str, bool]:
        """Test connections for all integrations"""
        results = {}
        for integration_id in self.integrations.keys():
            results[integration_id] = await self.test_connection(integration_id)
        return results
    
    async def sync_integration(
        self, 
        integration_id: str, 
        start_date: Optional[date] = None, 
        end_date: Optional[date] = None
    ) -> Optional[SyncResult]:
        """Sync data for a specific integration"""
        integration = self.get_integration(integration_id)
        if not integration or not integration.config.enabled:
            return None
        
        try:
            return await integration.sync_accounting_entries(start_date, end_date)
        except Exception as e:
            logger.error(f"Error syncing integration {integration_id}: {str(e)}")
            return SyncResult(
                status=IntegrationStatus.FAILED,
                total_records=0,
                successful_records=0,
                failed_records=0,
                errors=[str(e)]
            )
    
    async def sync_all_integrations(
        self, 
        start_date: Optional[date] = None, 
        end_date: Optional[date] = None
    ) -> Dict[str, SyncResult]:
        """Sync data for all enabled integrations"""
        sync_tasks = []
        integration_ids = []
        
        for integration_id, integration in self.integrations.items():
            if integration.config.enabled:
                sync_tasks.append(self.sync_integration(integration_id, start_date, end_date))
                integration_ids.append(integration_id)
        
        if not sync_tasks:
            return {}
        
        # Run all syncs in parallel
        results = await asyncio.gather(*sync_tasks, return_exceptions=True)
        
        # Combine results
        sync_results = {}
        for i, result in enumerate(results):
            integration_id = integration_ids[i]
            if isinstance(result, Exception):
                sync_results[integration_id] = SyncResult(
                    status=IntegrationStatus.FAILED,
                    total_records=0,
                    successful_records=0,
                    failed_records=0,
                    errors=[str(result)]
                )
            else:
                sync_results[integration_id] = result
        
        return sync_results
    
    async def get_integration_status(self, integration_id: str) -> Optional[Dict[str, Any]]:
        """Get status of a specific integration"""
        integration = self.get_integration(integration_id)
        if not integration:
            return None
        
        return await integration.get_integration_status()
    
    async def get_all_integration_statuses(self) -> Dict[str, Dict[str, Any]]:
        """Get status of all integrations"""
        statuses = {}
        for integration_id in self.integrations.keys():
            status = await self.get_integration_status(integration_id)
            if status:
                statuses[integration_id] = status
        return statuses
    
    def get_supported_systems(self) -> List[Dict[str, str]]:
        """Get list of supported accounting systems"""
        return [
            {"type": system_type.value, "name": system_type.value.replace("_", " ").title()}
            for system_type in AccountingSystemType
        ]
    
    def create_default_config(self, system_type: AccountingSystemType, name: str) -> Optional[IntegrationConfig]:
        """Create a default configuration for a system type"""
        config_class = self.config_registry.get(system_type)
        if not config_class:
            return None
        
        base_config = {
            "system_type": system_type,
            "name": name,
            "enabled": False
        }
        
        # Add system-specific defaults
        if system_type == AccountingSystemType.QUICKBOOKS:
            base_config.update({
                "client_id": "",
                "client_secret": "",
                "redirect_uri": "",
                "realm_id": "",
                "base_url": "https://sandbox-quickbooks.api.intuit.com"
            })
        elif system_type == AccountingSystemType.SAP:
            base_config.update({
                "server_host": "",
                "server_port": 8000,
                "client": "100",
                "username": "",
                "password": "",
                "language": "EN",
                "use_odata": True,
                "odata_base_url": ""
            })
        else:  # Generic API systems
            base_config.update({
                "base_url": "",
                "auth_type": "bearer",
                "endpoints": {
                    "entries": "/api/v1/journal-entries",
                    "customers": "/api/v1/customers",
                    "vendors": "/api/v1/vendors",
                    "projects": "/api/v1/projects",
                    "test": "/api/v1/status"
                }
            })
        
        return config_class(**base_config)

# Global instance
integration_manager = IntegrationManager() 