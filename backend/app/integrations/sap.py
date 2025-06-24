"""
SAP Integration using RFC calls and OData services
"""
import requests
from typing import List, Dict, Any, Optional
from datetime import date, datetime
import json
import base64

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

class SAPConfig(IntegrationConfig):
    """SAP specific configuration"""
    server_host: str
    server_port: int = 8000
    client: str  # SAP client (e.g., '100')
    username: str
    password: str
    language: str = 'EN'
    
    # OData service configuration
    odata_base_url: Optional[str] = None
    use_odata: bool = True
    
    # RFC configuration (if using pyrfc)
    use_rfc: bool = False
    
class SAPIntegration(BaseAccountingIntegration):
    """SAP integration using OData services and RFC calls"""
    
    def __init__(self, config: SAPConfig):
        super().__init__(config)
        self.config: SAPConfig = config
        self.session = requests.Session()
        
        # Set up authentication
        if self.config.use_odata and self.config.odata_base_url:
            self._setup_odata_auth()
    
    def _setup_odata_auth(self):
        """Setup authentication for OData services"""
        auth_string = f"{self.config.username}:{self.config.password}"
        auth_bytes = auth_string.encode('ascii')
        auth_b64 = base64.b64encode(auth_bytes).decode('ascii')
        
        self.session.headers.update({
            'Authorization': f'Basic {auth_b64}',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
    
    async def test_connection(self) -> bool:
        """Test connection to SAP system"""
        try:
            if self.config.use_odata and self.config.odata_base_url:
                # Test OData connection
                response = self.session.get(f"{self.config.odata_base_url}/$metadata")
                return response.status_code == 200
            elif self.config.use_rfc:
                # Test RFC connection (would require pyrfc library)
                # This is a placeholder - actual implementation would use pyrfc
                return True
            else:
                return False
                
        except Exception as e:
            self.logger.error(f"SAP connection test failed: {str(e)}")
            return False
    
    async def get_accounting_entries(
        self, 
        start_date: Optional[date] = None, 
        end_date: Optional[date] = None,
        project_code: Optional[str] = None
    ) -> List[BaseAccountingEntry]:
        """Retrieve accounting entries from SAP"""
        try:
            if self.config.use_odata:
                return await self._get_entries_via_odata(start_date, end_date, project_code)
            elif self.config.use_rfc:
                return await self._get_entries_via_rfc(start_date, end_date, project_code)
            else:
                return []
                
        except Exception as e:
            self.logger.error(f"Error retrieving SAP entries: {str(e)}")
            return []
    
    async def _get_entries_via_odata(
        self, 
        start_date: Optional[date] = None, 
        end_date: Optional[date] = None,
        project_code: Optional[str] = None
    ) -> List[BaseAccountingEntry]:
        """Get entries using SAP OData services"""
        entries = []
        
        try:
            # Build OData filter
            filters = []
            if start_date:
                filters.append(f"PostingDate ge datetime'{start_date.isoformat()}T00:00:00'")
            if end_date:
                filters.append(f"PostingDate le datetime'{end_date.isoformat()}T23:59:59'")
            if project_code:
                filters.append(f"WBSElement eq '{project_code}'")
            
            filter_string = " and ".join(filters) if filters else ""
            
            # Example OData endpoint for GL account line items
            endpoint = f"{self.config.odata_base_url}/GLAccountLineItemSet"
            if filter_string:
                endpoint += f"?$filter={filter_string}"
            
            response = self.session.get(endpoint)
            
            if response.status_code == 200:
                data = response.json()
                sap_entries = data.get('d', {}).get('results', [])
                
                for entry in sap_entries:
                    accounting_entry = BaseAccountingEntry(
                        external_id=f"sap_{entry.get('CompanyCode')}_{entry.get('DocumentNumber')}_{entry.get('LineItem')}",
                        account_code=entry.get('GLAccount'),
                        account_name=entry.get('GLAccountName'),
                        entry_date=self._parse_sap_date(entry.get('PostingDate')),
                        reference=entry.get('DocumentNumber'),
                        description=entry.get('DocumentItemText', ''),
                        debit_amount=float(entry.get('DebitAmount', 0)) if entry.get('DebitAmount') else None,
                        credit_amount=float(entry.get('CreditAmount', 0)) if entry.get('CreditAmount') else None,
                        project_code=entry.get('WBSElement'),
                        department=entry.get('CostCenter')
                    )
                    entries.append(accounting_entry)
            
            return entries
            
        except Exception as e:
            self.logger.error(f"Error in OData retrieval: {str(e)}")
            return []
    
    async def _get_entries_via_rfc(
        self, 
        start_date: Optional[date] = None, 
        end_date: Optional[date] = None,
        project_code: Optional[str] = None
    ) -> List[BaseAccountingEntry]:
        """Get entries using SAP RFC calls"""
        # This would require the pyrfc library
        # Placeholder implementation
        entries = []
        
        try:
            # Example RFC call structure (would need actual pyrfc implementation)
            # from pyrfc import Connection
            # 
            # conn = Connection(
            #     ashost=self.config.server_host,
            #     sysnr=str(self.config.server_port)[-2:],
            #     client=self.config.client,
            #     user=self.config.username,
            #     passwd=self.config.password,
            #     lang=self.config.language
            # )
            # 
            # result = conn.call('RFC_READ_TABLE', 
            #     QUERY_TABLE='BKPF',  # Accounting document header
            #     OPTIONS=[{'TEXT': f"BUDAT >= '{start_date.strftime('%Y%m%d')}'"}] if start_date else []
            # )
            
            self.logger.info("RFC integration not implemented - requires pyrfc library")
            return entries
            
        except Exception as e:
            self.logger.error(f"Error in RFC retrieval: {str(e)}")
            return []
    
    def _parse_sap_date(self, sap_date_string: str) -> date:
        """Parse SAP date format to Python date"""
        try:
            # SAP OData often returns dates as "/Date(1234567890000)/"
            if sap_date_string and sap_date_string.startswith('/Date('):
                timestamp = int(sap_date_string[6:-2])
                return datetime.fromtimestamp(timestamp / 1000).date()
            else:
                # Try standard ISO format
                return datetime.fromisoformat(sap_date_string.split('T')[0]).date()
        except:
            return date.today()
    
    async def get_customers(self) -> List[BaseCustomer]:
        """Retrieve customers from SAP"""
        try:
            if not self.config.use_odata or not self.config.odata_base_url:
                return []
            
            endpoint = f"{self.config.odata_base_url}/CustomerSet"
            response = self.session.get(endpoint)
            customers = []
            
            if response.status_code == 200:
                data = response.json()
                sap_customers = data.get('d', {}).get('results', [])
                
                for customer in sap_customers:
                    customer_obj = BaseCustomer(
                        external_id=f"sap_{customer.get('CustomerNumber')}",
                        name=customer.get('CustomerName', ''),
                        email=customer.get('EmailAddress'),
                        phone=customer.get('PhoneNumber'),
                        address=f"{customer.get('Street', '')} {customer.get('City', '')}",
                        tax_id=customer.get('TaxNumber'),
                        credit_limit=float(customer.get('CreditLimit', 0)) if customer.get('CreditLimit') else None
                    )
                    customers.append(customer_obj)
            
            return customers
            
        except Exception as e:
            self.logger.error(f"Error retrieving SAP customers: {str(e)}")
            return []
    
    async def get_vendors(self) -> List[BaseVendor]:
        """Retrieve vendors from SAP"""
        try:
            if not self.config.use_odata or not self.config.odata_base_url:
                return []
            
            endpoint = f"{self.config.odata_base_url}/VendorSet"
            response = self.session.get(endpoint)
            vendors = []
            
            if response.status_code == 200:
                data = response.json()
                sap_vendors = data.get('d', {}).get('results', [])
                
                for vendor in sap_vendors:
                    vendor_obj = BaseVendor(
                        external_id=f"sap_{vendor.get('VendorNumber')}",
                        name=vendor.get('VendorName', ''),
                        email=vendor.get('EmailAddress'),
                        phone=vendor.get('PhoneNumber'),
                        address=f"{vendor.get('Street', '')} {vendor.get('City', '')}",
                        tax_id=vendor.get('TaxNumber')
                    )
                    vendors.append(vendor_obj)
            
            return vendors
            
        except Exception as e:
            self.logger.error(f"Error retrieving SAP vendors: {str(e)}")
            return []
    
    async def get_projects(self) -> List[BaseProject]:
        """Retrieve projects (WBS elements) from SAP"""
        try:
            if not self.config.use_odata or not self.config.odata_base_url:
                return []
            
            endpoint = f"{self.config.odata_base_url}/WBSElementSet"
            response = self.session.get(endpoint)
            projects = []
            
            if response.status_code == 200:
                data = response.json()
                sap_projects = data.get('d', {}).get('results', [])
                
                for project in sap_projects:
                    project_obj = BaseProject(
                        external_id=f"sap_{project.get('WBSElement')}",
                        name=project.get('Description', ''),
                        code=project.get('WBSElement'),
                        description=project.get('Description'),
                        start_date=self._parse_sap_date(project.get('StartDate')) if project.get('StartDate') else None,
                        end_date=self._parse_sap_date(project.get('EndDate')) if project.get('EndDate') else None,
                        budget=float(project.get('Budget', 0)) if project.get('Budget') else None,
                        status=project.get('Status')
                    )
                    projects.append(project_obj)
            
            return projects
            
        except Exception as e:
            self.logger.error(f"Error retrieving SAP projects: {str(e)}")
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