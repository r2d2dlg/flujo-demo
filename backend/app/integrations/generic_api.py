"""
Generic API Integration for various accounting systems
Supports systems like Xero, Sage, ODOO, ContPAQ, Aspel, and custom APIs
"""
import requests
from typing import List, Dict, Any, Optional, Callable
from datetime import date, datetime
import json

from .base import (
    BaseAccountingIntegration, 
    BaseAccountingEntry, 
    BaseCustomer, 
    BaseVendor, 
    BaseProject,
    SyncResult,
    IntegrationStatus,
    IntegrationConfig
)

class GenericAPIConfig(IntegrationConfig):
    """Generic API configuration"""
    base_url: str
    api_version: Optional[str] = None
    auth_type: str = "bearer"  # bearer, basic, api_key, oauth2
    
    # Authentication parameters
    api_key: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    access_token: Optional[str] = None
    client_id: Optional[str] = None
    client_secret: Optional[str] = None
    
    # API endpoints configuration
    endpoints: Dict[str, str] = {
        "entries": "/api/v1/journal-entries",
        "customers": "/api/v1/customers",
        "vendors": "/api/v1/vendors",
        "projects": "/api/v1/projects",
        "test": "/api/v1/status"
    }
    
    # Field mappings for different systems
    field_mappings: Dict[str, Dict[str, str]] = {
        "entries": {
            "external_id": "id",
            "account_code": "account_code",
            "account_name": "account_name",
            "entry_date": "date",
            "reference": "reference",
            "description": "description",
            "debit_amount": "debit",
            "credit_amount": "credit",
            "project_code": "project_id"
        },
        "customers": {
            "external_id": "id",
            "name": "name",
            "email": "email",
            "phone": "phone",
            "address": "address",
            "tax_id": "tax_id"
        },
        "vendors": {
            "external_id": "id",
            "name": "name",
            "email": "email",
            "phone": "phone",
            "address": "address",
            "tax_id": "tax_id"
        },
        "projects": {
            "external_id": "id",
            "name": "name",
            "code": "code",
            "description": "description",
            "start_date": "start_date",
            "end_date": "end_date",
            "budget": "budget",
            "status": "status"
        }
    }
    
    # Custom data transformers
    date_format: str = "%Y-%m-%d"
    currency_field: Optional[str] = None
    
class GenericAPIIntegration(BaseAccountingIntegration):
    """Generic API integration for various accounting systems"""
    
    def __init__(self, config: GenericAPIConfig):
        super().__init__(config)
        self.config: GenericAPIConfig = config
        self.session = requests.Session()
        self._setup_authentication()
    
    def _setup_authentication(self):
        """Setup authentication headers based on auth type"""
        if self.config.auth_type == "bearer" and self.config.access_token:
            self.session.headers.update({
                'Authorization': f'Bearer {self.config.access_token}'
            })
        elif self.config.auth_type == "basic" and self.config.username and self.config.password:
            self.session.auth = (self.config.username, self.config.password)
        elif self.config.auth_type == "api_key" and self.config.api_key:
            self.session.headers.update({
                'X-API-Key': self.config.api_key
            })
        
        # Common headers
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
    
    def _build_url(self, endpoint_key: str) -> str:
        """Build full URL for an endpoint"""
        endpoint = self.config.endpoints.get(endpoint_key, "")
        base_url = self.config.base_url.rstrip('/')
        
        if self.config.api_version:
            return f"{base_url}/{self.config.api_version.strip('/')}{endpoint}"
        else:
            return f"{base_url}{endpoint}"
    
    def _map_fields(self, data: Dict[str, Any], mapping_key: str) -> Dict[str, Any]:
        """Map fields from external system to internal format"""
        mapping = self.config.field_mappings.get(mapping_key, {})
        mapped_data = {}
        
        for internal_field, external_field in mapping.items():
            if external_field in data:
                value = data[external_field]
                
                # Handle date fields
                if internal_field.endswith('_date') and isinstance(value, str):
                    try:
                        value = datetime.strptime(value, self.config.date_format).date()
                    except:
                        value = None
                
                mapped_data[internal_field] = value
        
        return mapped_data
    
    async def test_connection(self) -> bool:
        """Test connection to the API"""
        try:
            url = self._build_url("test")
            response = self.session.get(url, timeout=10)
            return response.status_code in [200, 201, 204]
            
        except Exception as e:
            self.logger.error(f"API connection test failed: {str(e)}")
            return False
    
    async def get_accounting_entries(
        self, 
        start_date: Optional[date] = None, 
        end_date: Optional[date] = None,
        project_code: Optional[str] = None
    ) -> List[BaseAccountingEntry]:
        """Retrieve accounting entries from the API"""
        try:
            url = self._build_url("entries")
            params = {}
            
            if start_date:
                params['start_date'] = start_date.strftime(self.config.date_format)
            if end_date:
                params['end_date'] = end_date.strftime(self.config.date_format)
            if project_code:
                params['project_code'] = project_code
            
            response = self.session.get(url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                entries_data = data if isinstance(data, list) else data.get('data', [])
                
                entries = []
                for entry_data in entries_data:
                    mapped_data = self._map_fields(entry_data, "entries")
                    
                    entry = BaseAccountingEntry(
                        external_id=str(mapped_data.get('external_id', '')),
                        account_code=mapped_data.get('account_code'),
                        account_name=mapped_data.get('account_name'),
                        entry_date=mapped_data.get('entry_date', date.today()),
                        reference=mapped_data.get('reference'),
                        description=mapped_data.get('description', ''),
                        debit_amount=mapped_data.get('debit_amount'),
                        credit_amount=mapped_data.get('credit_amount'),
                        project_code=mapped_data.get('project_code'),
                        currency=self.config.currency_field or "USD"
                    )
                    entries.append(entry)
                
                return entries
            else:
                self.logger.error(f"API request failed with status {response.status_code}: {response.text}")
                return []
                
        except Exception as e:
            self.logger.error(f"Error retrieving entries from API: {str(e)}")
            return []
    
    async def get_customers(self) -> List[BaseCustomer]:
        """Retrieve customers from the API"""
        try:
            url = self._build_url("customers")
            response = self.session.get(url)
            
            if response.status_code == 200:
                data = response.json()
                customers_data = data if isinstance(data, list) else data.get('data', [])
                
                customers = []
                for customer_data in customers_data:
                    mapped_data = self._map_fields(customer_data, "customers")
                    
                    customer = BaseCustomer(
                        external_id=str(mapped_data.get('external_id', '')),
                        name=mapped_data.get('name', ''),
                        email=mapped_data.get('email'),
                        phone=mapped_data.get('phone'),
                        address=mapped_data.get('address'),
                        tax_id=mapped_data.get('tax_id')
                    )
                    customers.append(customer)
                
                return customers
            else:
                return []
                
        except Exception as e:
            self.logger.error(f"Error retrieving customers from API: {str(e)}")
            return []
    
    async def get_vendors(self) -> List[BaseVendor]:
        """Retrieve vendors from the API"""
        try:
            url = self._build_url("vendors")
            response = self.session.get(url)
            
            if response.status_code == 200:
                data = response.json()
                vendors_data = data if isinstance(data, list) else data.get('data', [])
                
                vendors = []
                for vendor_data in vendors_data:
                    mapped_data = self._map_fields(vendor_data, "vendors")
                    
                    vendor = BaseVendor(
                        external_id=str(mapped_data.get('external_id', '')),
                        name=mapped_data.get('name', ''),
                        email=mapped_data.get('email'),
                        phone=mapped_data.get('phone'),
                        address=mapped_data.get('address'),
                        tax_id=mapped_data.get('tax_id')
                    )
                    vendors.append(vendor)
                
                return vendors
            else:
                return []
                
        except Exception as e:
            self.logger.error(f"Error retrieving vendors from API: {str(e)}")
            return []
    
    async def get_projects(self) -> List[BaseProject]:
        """Retrieve projects from the API"""
        try:
            url = self._build_url("projects")
            response = self.session.get(url)
            
            if response.status_code == 200:
                data = response.json()
                projects_data = data if isinstance(data, list) else data.get('data', [])
                
                projects = []
                for project_data in projects_data:
                    mapped_data = self._map_fields(project_data, "projects")
                    
                    project = BaseProject(
                        external_id=str(mapped_data.get('external_id', '')),
                        name=mapped_data.get('name', ''),
                        code=mapped_data.get('code'),
                        description=mapped_data.get('description'),
                        start_date=mapped_data.get('start_date'),
                        end_date=mapped_data.get('end_date'),
                        budget=mapped_data.get('budget'),
                        status=mapped_data.get('status')
                    )
                    projects.append(project)
                
                return projects
            else:
                return []
                
        except Exception as e:
            self.logger.error(f"Error retrieving projects from API: {str(e)}")
            return []
    
    async def _process_accounting_entries(self, entries: List[BaseAccountingEntry]) -> SyncResult:
        """Process and store accounting entries in local database"""
        # This would integrate with your existing database models
        return SyncResult(
            status=IntegrationStatus.SUCCESS,
            total_records=len(entries),
            successful_records=len(entries),
            failed_records=0
        ) 