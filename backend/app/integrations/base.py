"""
Base classes and interfaces for accounting system integrations
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional, Union
from datetime import datetime, date
from enum import Enum
from pydantic import BaseModel, Field
import logging

logger = logging.getLogger(__name__)

class IntegrationStatus(str, Enum):
    """Status of integration operations"""
    SUCCESS = "success"
    PARTIAL = "partial"
    FAILED = "failed"
    PENDING = "pending"

class SyncDirection(str, Enum):
    """Direction of data synchronization"""
    IMPORT = "import"  # From external system to our system
    EXPORT = "export"  # From our system to external system
    BIDIRECTIONAL = "bidirectional"

class AccountingSystemType(str, Enum):
    """Supported accounting systems"""
    SAP = "sap"
    QUICKBOOKS = "quickbooks"
    XERO = "xero"
    ODOO = "odoo"
    SAGE = "sage"
    CONTPAQ = "contpaq"
    ASPEL = "aspel"
    GENERIC_API = "generic_api"

# Base data models
class BaseAccountingEntry(BaseModel):
    """Base model for accounting entries from external systems"""
    external_id: str = Field(..., description="ID in the external system")
    account_code: Optional[str] = Field(None, description="Account code/number")
    account_name: Optional[str] = Field(None, description="Account description")
    entry_date: date = Field(..., description="Date of the accounting entry")
    reference: Optional[str] = Field(None, description="Transaction reference")
    description: str = Field(..., description="Transaction description")
    debit_amount: Optional[float] = Field(None, description="Debit amount")
    credit_amount: Optional[float] = Field(None, description="Credit amount")
    currency: str = Field(default="USD", description="Currency code")
    project_code: Optional[str] = Field(None, description="Project identifier")
    department: Optional[str] = Field(None, description="Department/cost center")
    created_at: Optional[datetime] = Field(None, description="Creation timestamp in external system")
    updated_at: Optional[datetime] = Field(None, description="Last update timestamp in external system")

class BaseCustomer(BaseModel):
    """Base model for customer data from external systems"""
    external_id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    tax_id: Optional[str] = None
    credit_limit: Optional[float] = None
    payment_terms: Optional[str] = None

class BaseVendor(BaseModel):
    """Base model for vendor/supplier data from external systems"""
    external_id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    tax_id: Optional[str] = None
    payment_terms: Optional[str] = None

class BaseProject(BaseModel):
    """Base model for project data from external systems"""
    external_id: str
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget: Optional[float] = None
    status: Optional[str] = None

class SyncResult(BaseModel):
    """Result of a synchronization operation"""
    status: IntegrationStatus
    total_records: int
    successful_records: int
    failed_records: int
    errors: List[str] = []
    warnings: List[str] = []
    sync_timestamp: datetime = Field(default_factory=datetime.now)
    execution_time_seconds: Optional[float] = None

class IntegrationConfig(BaseModel):
    """Base configuration for integrations"""
    system_type: AccountingSystemType
    name: str
    enabled: bool = True
    sync_direction: SyncDirection = SyncDirection.IMPORT
    auto_sync: bool = False
    sync_frequency_hours: Optional[int] = None
    last_sync: Optional[datetime] = None
    connection_params: Dict[str, Any] = {}

class BaseAccountingIntegration(ABC):
    """Abstract base class for all accounting system integrations"""
    
    def __init__(self, config: IntegrationConfig):
        self.config = config
        self.logger = logging.getLogger(f"{self.__class__.__module__}.{self.__class__.__name__}")
        self._connection = None
    
    @abstractmethod
    async def test_connection(self) -> bool:
        """Test connection to the external accounting system"""
        pass
    
    @abstractmethod
    async def get_accounting_entries(
        self, 
        start_date: Optional[date] = None, 
        end_date: Optional[date] = None,
        project_code: Optional[str] = None
    ) -> List[BaseAccountingEntry]:
        """Retrieve accounting entries from external system"""
        pass
    
    @abstractmethod
    async def get_customers(self) -> List[BaseCustomer]:
        """Retrieve customer data from external system"""
        pass
    
    @abstractmethod
    async def get_vendors(self) -> List[BaseVendor]:
        """Retrieve vendor data from external system"""
        pass
    
    @abstractmethod
    async def get_projects(self) -> List[BaseProject]:
        """Retrieve project data from external system"""
        pass
    
    async def sync_accounting_entries(
        self, 
        start_date: Optional[date] = None, 
        end_date: Optional[date] = None
    ) -> SyncResult:
        """Synchronize accounting entries with local database"""
        start_time = datetime.now()
        
        try:
            # Get entries from external system
            entries = await self.get_accounting_entries(start_date, end_date)
            
            # Process and store entries
            result = await self._process_accounting_entries(entries)
            
            # Calculate execution time
            execution_time = (datetime.now() - start_time).total_seconds()
            result.execution_time_seconds = execution_time
            
            # Update last sync timestamp
            self.config.last_sync = datetime.now()
            
            return result
            
        except Exception as e:
            self.logger.error(f"Error during sync: {str(e)}", exc_info=True)
            return SyncResult(
                status=IntegrationStatus.FAILED,
                total_records=0,
                successful_records=0,
                failed_records=0,
                errors=[str(e)],
                execution_time_seconds=(datetime.now() - start_time).total_seconds()
            )
    
    @abstractmethod
    async def _process_accounting_entries(self, entries: List[BaseAccountingEntry]) -> SyncResult:
        """Process and store accounting entries in local database"""
        pass
    
    async def get_integration_status(self) -> Dict[str, Any]:
        """Get current status of the integration"""
        connection_ok = await self.test_connection()
        
        return {
            "system_type": self.config.system_type,
            "name": self.config.name,
            "enabled": self.config.enabled,
            "connection_status": "connected" if connection_ok else "disconnected",
            "last_sync": self.config.last_sync,
            "auto_sync": self.config.auto_sync,
            "sync_frequency_hours": self.config.sync_frequency_hours
        } 