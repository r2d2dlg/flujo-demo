"""
QuickBooks Online API Integration
"""
import requests
import base64
from typing import List, Dict, Any, Optional
from datetime import date, datetime
from urllib.parse import urlencode
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

class QuickBooksConfig(IntegrationConfig):
    """QuickBooks specific configuration"""
    client_id: str
    client_secret: str
    redirect_uri: str
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    realm_id: str  # Company ID
    base_url: str = "https://sandbox-quickbooks.api.intuit.com"  # Use production URL in prod
    
class QuickBooksIntegration(BaseAccountingIntegration):
    """QuickBooks Online API integration"""
    
    def __init__(self, config: QuickBooksConfig):
        super().__init__(config)
        self.config: QuickBooksConfig = config
        self.session = requests.Session()
    
    async def test_connection(self) -> bool:
        """Test connection to QuickBooks API"""
        try:
            if not self.config.access_token:
                return False
            
            headers = self._get_auth_headers()
            url = f"{self.config.base_url}/v3/company/{self.config.realm_id}/companyinfo/{self.config.realm_id}"
            
            response = self.session.get(url, headers=headers)
            return response.status_code == 200
            
        except Exception as e:
            self.logger.error(f"QuickBooks connection test failed: {str(e)}")
            return False
    
    def _get_auth_headers(self) -> Dict[str, str]:
        """Get authorization headers for API requests"""
        return {
            'Authorization': f'Bearer {self.config.access_token}',
            'Accept': 'application/json'
        }
    
    async def refresh_access_token(self) -> bool:
        """Refresh the access token using refresh token"""
        try:
            if not self.config.refresh_token:
                return False
            
            auth_string = f"{self.config.client_id}:{self.config.client_secret}"
            auth_bytes = auth_string.encode('ascii')
            auth_b64 = base64.b64encode(auth_bytes).decode('ascii')
            
            headers = {
                'Authorization': f'Basic {auth_b64}',
                'Content-Type': 'application/x-www-form-urlencoded'
            }
            
            data = {
                'grant_type': 'refresh_token',
                'refresh_token': self.config.refresh_token
            }
            
            response = self.session.post(
                'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
                headers=headers,
                data=data
            )
            
            if response.status_code == 200:
                token_data = response.json()
                self.config.access_token = token_data.get('access_token')
                self.config.refresh_token = token_data.get('refresh_token')
                return True
            
            return False
            
        except Exception as e:
            self.logger.error(f"Token refresh failed: {str(e)}")
            return False
    
    async def get_accounting_entries(
        self, 
        start_date: Optional[date] = None, 
        end_date: Optional[date] = None,
        project_code: Optional[str] = None
    ) -> List[BaseAccountingEntry]:
        """Retrieve journal entries from QuickBooks"""
        try:
            headers = self._get_auth_headers()
            entries = []
            
            # Build query parameters
            query_parts = []
            if start_date:
                query_parts.append(f"TxnDate >= '{start_date.isoformat()}'")
            if end_date:
                query_parts.append(f"TxnDate <= '{end_date.isoformat()}'")
            
            where_clause = " AND ".join(query_parts) if query_parts else ""
            query = f"SELECT * FROM JournalEntry"
            if where_clause:
                query += f" WHERE {where_clause}"
            
            url = f"{self.config.base_url}/v3/company/{self.config.realm_id}/query"
            params = {'query': query}
            
            response = self.session.get(url, headers=headers, params=params)
            
            if response.status_code == 200:
                data = response.json()
                journal_entries = data.get('QueryResponse', {}).get('JournalEntry', [])
                
                for entry in journal_entries:
                    for line in entry.get('Line', []):
                        if line.get('DetailType') == 'JournalEntryLineDetail':
                            detail = line.get('JournalEntryLineDetail', {})
                            account_ref = detail.get('AccountRef', {})
                            
                            # Determine debit/credit amounts
                            posting_type = detail.get('PostingType')
                            amount = float(line.get('Amount', 0))
                            
                            debit_amount = amount if posting_type == 'Debit' else None
                            credit_amount = amount if posting_type == 'Credit' else None
                            
                            accounting_entry = BaseAccountingEntry(
                                external_id=f"qb_{entry.get('Id')}_{line.get('Id')}",
                                account_code=account_ref.get('value'),
                                account_name=account_ref.get('name'),
                                entry_date=datetime.strptime(entry.get('TxnDate'), '%Y-%m-%d').date(),
                                reference=entry.get('DocNumber'),
                                description=line.get('Description', entry.get('PrivateNote', '')),
                                debit_amount=debit_amount,
                                credit_amount=credit_amount,
                                project_code=project_code  # QuickBooks uses Classes for projects
                            )
                            entries.append(accounting_entry)
            
            return entries
            
        except Exception as e:
            self.logger.error(f"Error retrieving QuickBooks entries: {str(e)}")
            return []
    
    async def get_customers(self) -> List[BaseCustomer]:
        """Retrieve customers from QuickBooks"""
        try:
            headers = self._get_auth_headers()
            url = f"{self.config.base_url}/v3/company/{self.config.realm_id}/query"
            params = {'query': "SELECT * FROM Customer"}
            
            response = self.session.get(url, headers=headers, params=params)
            customers = []
            
            if response.status_code == 200:
                data = response.json()
                qb_customers = data.get('QueryResponse', {}).get('Customer', [])
                
                for customer in qb_customers:
                    customer_obj = BaseCustomer(
                        external_id=f"qb_{customer.get('Id')}",
                        name=customer.get('Name', ''),
                        email=customer.get('PrimaryEmailAddr', {}).get('Address'),
                        phone=customer.get('PrimaryPhone', {}).get('FreeFormNumber'),
                        tax_id=customer.get('ResaleNum'),
                        credit_limit=customer.get('CreditLimit', {}).get('value')
                    )
                    customers.append(customer_obj)
            
            return customers
            
        except Exception as e:
            self.logger.error(f"Error retrieving QuickBooks customers: {str(e)}")
            return []
    
    async def get_vendors(self) -> List[BaseVendor]:
        """Retrieve vendors from QuickBooks"""
        try:
            headers = self._get_auth_headers()
            url = f"{self.config.base_url}/v3/company/{self.config.realm_id}/query"
            params = {'query': "SELECT * FROM Vendor"}
            
            response = self.session.get(url, headers=headers, params=params)
            vendors = []
            
            if response.status_code == 200:
                data = response.json()
                qb_vendors = data.get('QueryResponse', {}).get('Vendor', [])
                
                for vendor in qb_vendors:
                    vendor_obj = BaseVendor(
                        external_id=f"qb_{vendor.get('Id')}",
                        name=vendor.get('Name', ''),
                        email=vendor.get('PrimaryEmailAddr', {}).get('Address'),
                        phone=vendor.get('PrimaryPhone', {}).get('FreeFormNumber'),
                        tax_id=vendor.get('Vendor1099')
                    )
                    vendors.append(vendor_obj)
            
            return vendors
            
        except Exception as e:
            self.logger.error(f"Error retrieving QuickBooks vendors: {str(e)}")
            return []
    
    async def get_projects(self) -> List[BaseProject]:
        """Retrieve classes (projects) from QuickBooks"""
        try:
            headers = self._get_auth_headers()
            url = f"{self.config.base_url}/v3/company/{self.config.realm_id}/query"
            params = {'query': "SELECT * FROM Class"}
            
            response = self.session.get(url, headers=headers, params=params)
            projects = []
            
            if response.status_code == 200:
                data = response.json()
                qb_classes = data.get('QueryResponse', {}).get('Class', [])
                
                for cls in qb_classes:
                    project_obj = BaseProject(
                        external_id=f"qb_{cls.get('Id')}",
                        name=cls.get('Name', ''),
                        code=cls.get('Name', ''),
                        description=cls.get('Name', ''),
                        status='Active' if cls.get('Active') else 'Inactive'
                    )
                    projects.append(project_obj)
            
            return projects
            
        except Exception as e:
            self.logger.error(f"Error retrieving QuickBooks projects: {str(e)}")
            return []
    
    async def _process_accounting_entries(self, entries: List[BaseAccountingEntry]) -> SyncResult:
        """Process and store accounting entries in local database"""
        # This would integrate with your existing database models
        # For now, return a mock result
        return SyncResult(
            status=IntegrationStatus.SUCCESS,
            total_records=len(entries),
            successful_records=len(entries),
            failed_records=0
        ) 