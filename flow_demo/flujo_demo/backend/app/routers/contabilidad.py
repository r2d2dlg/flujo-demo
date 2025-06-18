from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, Path
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
import pandas as pd
from datetime import datetime, date
import gzip
import json
import os
import logging
from io import BytesIO
from decimal import Decimal
from sqlalchemy import func, extract, text # For date extraction and aggregation

from ..auth import require_role, get_db # Assuming get_db is here from main.py
from .. import schemas # Import your Pydantic schemas
from .. import models # Import your SQLAlchemy models
from .. import crud # Assuming crud.py might be used later
from ..database import get_db, SessionLocal # Ensure SessionLocal is available if needed directly
from ..models import LedgerEntryDB, AdministrativeCostDB # Added AdministrativeCostDB
from ..schemas import LedgerEntry, AdministrativeCost, AdministrativeCostCreate # Added AdministrativeCost

router = APIRouter(
    prefix="/api",
    tags=["contabilidad"]
)

# Define a directory for backups
BACKUP_DIR = "backups/ledger_backups"
# Ensure the backup directory exists
os.makedirs(BACKUP_DIR, exist_ok=True)

# Helper function for backing up data (was previously in utils)
def backup_data_to_jsonl_gz(data: List[dict], file_path: str):
    """Backs up a list of dictionaries to a gzipped JSONL file."""
    try:
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with gzip.open(file_path, 'wt', encoding='utf-8') as gz_file:
            for item in data:
                gz_file.write(json.dumps(item) + '\n')
        logging.info(f"Successfully backed up {len(data)} items to {file_path}")
    except Exception as e:
        logging.error(f"Error backing up data to {file_path}: {e}", exc_info=True)
        # Depending on desired behavior, you might re-raise or handle

# Expected columns from the Excel file (adjust as necessary based on the Excel structure)
# These should map to the CSV columns you originally provided for the ingestion script.
EXPECTED_COLUMNS_EXCEL = {
    'Date': 'entry_date',
    'Reference': 'reference',
    'Trans Description': 'transaction_description',
    'Debit Amt': 'debit_amount',
    'Credit Amt': 'credit_amount',
    'Balance': 'balance',
    'Account ID': 'account_id',
    'Jrnl': 'journal'
}

# Expected columns for the Administrative Costs Excel/CSV upload
# Based on CSV: Account ID,,Date,Reference,Jrnl,Trans Description,Debit Amt,Credit Amt,Balance
# We will assume the uploaded Excel/CSV for admin costs will have a similar structure where data starts effectively after some header rows.
EXPECTED_COLUMNS_ADMIN_COSTS_EXCEL = {
    "Date": "entry_date",
    "Reference": "reference",
    "Trans Description": "transaction_description",
    "Debit Amt": "debit_amount",
    "Credit Amt": "credit_amount",
    "Balance": "balance",
    "Account ID": "account_id",
    "Jrnl": "journal",
    # "Account Description" is often separate or implied by Account ID for these files
}

def parse_date_excel(date_val, excel_row_num_for_logging):
    if pd.isna(date_val) or date_val == '':
        # This case should ideally be caught by the initial pd.isna() check in the main loop
        # print(f"DEBUG parse_date_excel (Excel row {excel_row_num_for_logging}): Received NA or empty: '{date_val}'")
        return None

    if isinstance(date_val, (datetime.datetime, pd.Timestamp)):
        # print(f"DEBUG parse_date_excel (Excel row {excel_row_num_for_logging}): Received datetime/timestamp: {date_val}. Extracting date part.")
        return date_val.date()
    if isinstance(date_val, datetime.date):
        # print(f"DEBUG parse_date_excel (Excel row {excel_row_num_for_logging}): Received date object: {date_val}.")
        return date_val

    if isinstance(date_val, (int, float)): # Could be Excel serial date
        try:
            # Origin '1899-12-30' is standard for Excel on Windows
            parsed_dt = pd.to_datetime(date_val, unit='D', origin='1899-12-30')
            # print(f"DEBUG parse_date_excel (Excel row {excel_row_num_for_logging}): Parsed Excel serial number {date_val} to {parsed_dt.date()}")
            return parsed_dt.date()
        except Exception as e_serial:
            print(f"DEBUG parse_date_excel (Excel row {excel_row_num_for_logging}): Failed to parse numeric '{date_val}' (type: {type(date_val)}) as Excel serial date: {e_serial}")
            # Fall through to string parsing if it was, for example, a float that represents a non-date number.
            pass # Fall through to try string parsing

    if isinstance(date_val, str):
        try:
            # pd.to_datetime is quite versatile
            dt_object = pd.to_datetime(date_val).date()
            # print(f"DEBUG parse_date_excel (Excel row {excel_row_num_for_logging}): Parsed string '{date_val}' with pd.to_datetime to {dt_object}")
            return dt_object
        except Exception as e_str_pandas:
            # print(f"DEBUG parse_date_excel (Excel row {excel_row_num_for_logging}): pd.to_datetime failed for string '{date_val}': {e_str_pandas}. Trying custom formats.")
            custom_formats = ["%m/%d/%Y", "%d/%m/%Y", "%Y-%m-%d", "%d-%b-%Y", "%m-%d-%Y", "%Y/%m/%d"] # Common formats
            for fmt in custom_formats:
                try:
                    dt_object = datetime.datetime.strptime(date_val, fmt).date()
                    # print(f"DEBUG parse_date_excel (Excel row {excel_row_num_for_logging}): Parsed string '{date_val}' with custom format '{fmt}' to {dt_object}")
                    return dt_object
                except ValueError:
                    continue # Try next format
            print(f"DEBUG parse_date_excel (Excel row {excel_row_num_for_logging}): String '{date_val}' exhausted all custom formats and pd.to_datetime.")
            return None

    print(f"DEBUG parse_date_excel (Excel row {excel_row_num_for_logging}): Received unhandled type '{type(date_val)}' for value '{date_val}'")
    return None

def parse_float_excel(val):
    if pd.isna(val) or val == '':
        return None
    try:
        return float(str(val).replace(',', '')) # Handle numbers formatted as strings with commas
    except ValueError:
        return None

@router.get("/dashboard")
def get_contabilidad_dashboard(user=Depends(require_role("Contabilidad"))):
    # TODO: Query contabilidad tables
    return {"msg": "Contabilidad dashboard data"}

@router.get("/ledger-entries", response_model=List[schemas.LedgerEntry])
def get_ledger_entries(
    project_name: Optional[str] = Query(None, description="Filter ledger entries by project name"),
    start_date: Optional[date] = Query(None, description="Start date for filtering entries (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="End date for filtering entries (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """
    Retrieve ledger entries, optionally filtered by project name and date range.
    """
    try:
        query = db.query(models.LedgerEntryDB)

        if project_name:
            query = query.filter(models.LedgerEntryDB.project_name == project_name)
        
        if start_date:
            query = query.filter(models.LedgerEntryDB.entry_date >= start_date)
        
        if end_date:
            query = query.filter(models.LedgerEntryDB.entry_date <= end_date)
        
        # Optional: Add ordering, e.g., by date and then ID
        query = query.order_by(models.LedgerEntryDB.entry_date.desc(), models.LedgerEntryDB.id.desc())
        
        ledger_entries_db = query.all()
        
        print(f"DEBUG: Backend found {len(ledger_entries_db)} entries for project_name='{project_name}', start_date='{start_date}', end_date='{end_date}'")
        
        return ledger_entries_db

    except Exception as e:
        print(f"Error fetching ledger entries: {e}") # Log the error for debugging
        # Consider more specific exception handling if needed
        raise HTTPException(
            status_code=500, 
            detail=f"Error interno del servidor al obtener asientos contables: {str(e)}"
        ) 

@router.post("/upload-replace-ledger")
async def upload_replace_ledger(
    project_name: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    # user: dict = Depends(require_role(["Contabilidad", "Admin"])) # Optional: protect with roles
):
    if not project_name:
        raise HTTPException(status_code=400, detail="Project name is required.")

    # Step 1: Backup current data for the project
    try:
        current_entries_db = db.query(models.LedgerEntryDB).filter(models.LedgerEntryDB.project_name == project_name).all()
        
        if current_entries_db:
            backup_file_name = f"{project_name.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jsonl.gz"
            backup_file_path = os.path.join(BACKUP_DIR, backup_file_name)
            
            with gzip.open(backup_file_path, 'wt', encoding='utf-8') as gz_file:
                for entry_db in current_entries_db:
                    # Convert SQLAlchemy model to Pydantic model then to dict for JSON serialization
                    entry_schema = schemas.LedgerEntry.from_orm(entry_db)
                    # Use model_dump(mode='json') for proper serialization of date/datetime objects
                    gz_file.write(json.dumps(entry_schema.model_dump(mode='json')) + '\n')
            print(f"Backed up {len(current_entries_db)} entries for project '{project_name}' to {backup_file_path}")
        else:
            print(f"No existing entries found for project '{project_name}' to back up.")

    except Exception as e:
        print(f"Error during backup for project '{project_name}': {e}")
        raise HTTPException(status_code=500, detail=f"Error during data backup: {str(e)}")

    # Step 2: Delete existing entries for the project from the database
    try:
        deleted_rows = db.query(models.LedgerEntryDB).filter(models.LedgerEntryDB.project_name == project_name).delete(synchronize_session=False)
        db.commit()
        print(f"Deleted {deleted_rows} existing entries for project '{project_name}'.")
    except Exception as e:
        db.rollback()
        print(f"Error deleting entries for project '{project_name}': {e}")
        raise HTTPException(status_code=500, detail=f"Error deleting existing data: {str(e)}")

    # Step 3: Process new Excel file and insert data
    try:
        # Read Excel file into pandas DataFrame
        # Use a context manager for the file to ensure it's closed
        with file.file as f:
            # Step 1: Read Excel without parse_dates first to inspect columns
            # User specified that headers are on Excel row 5, which is header=4 for 0-indexed pandas
            df_initial_read = pd.read_excel(f, header=4)
        
        print(f"DEBUG: Initial DataFrame columns from Excel (using header=4): {df_initial_read.columns.tolist()}")

        # Check if 'Date' column exists based on what we expect
        expected_date_column_name = 'Date' # This is what we expect based on user's image

        if expected_date_column_name not in df_initial_read.columns:
            print(f"ERROR: The expected date column '{expected_date_column_name}' was NOT FOUND in the Excel columns: {df_initial_read.columns.tolist()}")
            # Attempt to find a case-insensitive match or a match with stripped whitespace as a fallback
            found_alternative = False
            for col in df_initial_read.columns:
                if isinstance(col, str) and col.strip().lower() == expected_date_column_name.lower():
                    print(f"INFO: Found a potential alternative date column: '{col}'. Will attempt to use this.")
                    expected_date_column_name = col # Use the actual found column name
                    found_alternative = True
                    break
            if not found_alternative:
                 raise HTTPException(status_code=400, detail=f"El archivo Excel no contiene la columna de fecha esperada ('{expected_date_column_name}'). Columnas encontradas: {df_initial_read.columns.tolist()}")

        # Step 2: If we are here, we have a date column name (either 'Date' or an alternative)
        # Re-read or use existing df, now focusing on using the identified date column for parsing.
        # For simplicity, we can work with df_initial_read, but ensure type consistency for date column later.
        df = df_initial_read
        
        # Now, attempt to convert the identified date column to datetime objects
        # This replaces the direct parse_dates in read_excel
        try:
            df[expected_date_column_name] = pd.to_datetime(df[expected_date_column_name], errors='coerce')
            print(f"DEBUG: Successfully converted column '{expected_date_column_name}' to datetime (with NaT for errors).")
        except Exception as e_conversion:
            print(f"ERROR: Failed to convert column '{expected_date_column_name}' to datetime: {e_conversion}. Will proceed with row-by-row parsing.")
            # If this broad conversion fails, parse_date_excel will handle it row by row
            pass


        print(f"DEBUG: DataFrame shape (rows, cols): {df.shape}")
        if not df.empty and expected_date_column_name in df.columns:
            print(f"DEBUG: First few (up to 5) '{expected_date_column_name}' column raw values from DataFrame after manual to_datetime conversion:")
            for i, val in enumerate(df[expected_date_column_name].head()):
                 print(f"  df index {i}: Raw '{expected_date_column_name}' val='{val}', type='{type(val)}', pd.isna='{pd.isna(val)}'")


        new_entries_to_add = []
        for index, row in df.iterrows():
            excel_row_num_approx = index + 2 # For logging, assuming header is row 1

            raw_date_val_from_df = row.get(expected_date_column_name) # Use the identified date column
            
            print(f"DEBUG Processing df_index {index} (Excel_row ~{excel_row_num_approx}): Raw '{expected_date_column_name}' from df='{raw_date_val_from_df}', Type='{type(raw_date_val_from_df)}', pd.isna='{pd.isna(raw_date_val_from_df)}'")

            if expected_date_column_name not in df.columns: 
                print(f"CRITICAL_ERROR: '{expected_date_column_name}' column somehow not in DataFrame at df_index {index}. This shouldn't happen.")
                continue

            if pd.isna(raw_date_val_from_df): # Check for NaT or NaN
                 print(f"INFO Skipping df_index {index} (Excel_row ~{excel_row_num_approx}) due to '{expected_date_column_name}' field being NA/NaT (missing or unparseable). Value: '{raw_date_val_from_df}'")
                 continue
            
            parsed_date = parse_date_excel(raw_date_val_from_df, excel_row_num_approx)

            # Map other columns using EXPECTED_COLUMNS_EXCEL, but ensure the date is handled by 'expected_date_column_name'
            entry_data = {
                'project_name': project_name,
                'entry_date': parsed_date,
                'reference': str(row.get(EXPECTED_COLUMNS_EXCEL.get('Reference', 'Reference'), '')).strip() if pd.notna(row.get(EXPECTED_COLUMNS_EXCEL.get('Reference', 'Reference'))) else None,
                'transaction_description': str(row.get(EXPECTED_COLUMNS_EXCEL.get('Trans Description', 'Trans Description'), '')).strip(),
                'debit_amount': parse_float_excel(row.get(EXPECTED_COLUMNS_EXCEL.get('Debit Amt', 'Debit Amt'))),
                'credit_amount': parse_float_excel(row.get(EXPECTED_COLUMNS_EXCEL.get('Credit Amt', 'Credit Amt'))),
                'balance': parse_float_excel(row.get(EXPECTED_COLUMNS_EXCEL.get('Balance', 'Balance'))),
                'account_id': str(row.get(EXPECTED_COLUMNS_EXCEL.get('Account ID', 'Account ID'), '')).strip() if pd.notna(row.get(EXPECTED_COLUMNS_EXCEL.get('Account ID', 'Account ID'))) else None,
                'account_description': None, 
                'journal': str(row.get(EXPECTED_COLUMNS_EXCEL.get('Jrnl', 'Jrnl'), '')).strip() if pd.notna(row.get(EXPECTED_COLUMNS_EXCEL.get('Jrnl', 'Jrnl'))) else None
            }
            # Adjust the row.get calls to use the original Excel column names as defined in EXPECTED_COLUMNS_EXCEL keys
            # The date column is handled separately via expected_date_column_name

            # Corrected data mapping:
            current_excel_date_key = None
            for k, v in EXPECTED_COLUMNS_EXCEL.items():
                if v == 'entry_date':
                    current_excel_date_key = k
                    break
            
            entry_data = {
                'project_name': project_name,
                'entry_date': parsed_date, # Already handled
            }

            for excel_col_name, db_col_name in EXPECTED_COLUMNS_EXCEL.items():
                if db_col_name == 'entry_date': # Skip, already handled by parsed_date using expected_date_column_name
                    continue 
                
                raw_val = row.get(excel_col_name)

                if db_col_name in ['debit_amount', 'credit_amount', 'balance']:
                    entry_data[db_col_name] = parse_float_excel(raw_val)
                elif db_col_name == 'account_description': # Explicitly set to None as per earlier logic
                     entry_data[db_col_name] = None
                else: # For reference, transaction_description, account_id, journal
                    entry_data[db_col_name] = str(raw_val).strip() if pd.notna(raw_val) else None


            if not entry_data.get('entry_date'): # Check .get() for safety, though parsed_date should exist
                print(f"INFO Skipping df_index {index} (Excel_row ~{excel_row_num_approx}) due to 'entry_date' being None after full parsing. Original df Date value: '{raw_date_val_from_df}'")
                continue
            
            if not entry_data['transaction_description']:
                 print(f"INFO Skipping df_index {index} (Excel_row ~{excel_row_num_approx}) due to missing 'Trans Description'. Value: '{row.get('Trans Description')}'")
                 continue

            try:
                new_entry_db = models.LedgerEntryDB(**entry_data)
                new_entries_to_add.append(new_entry_db)
            except Exception as e_model:
                print(f"ERROR Creating LedgerEntryDB model for df_index {index} (Excel_row ~{excel_row_num_approx}): {e_model}. Data: {entry_data}")
                continue


        if not new_entries_to_add:
            print("No valid entries found in the uploaded Excel file.")
            # No need to raise an error here, could be an empty file or all rows invalid
            # The deletion of old entries would have already happened.
            db.commit() # ensure deletion commit even if no new entries
            return {"message": "Proceso completado. No se encontraron asientos válidos en el archivo subido. Los datos anteriores del proyecto han sido eliminados."}

        db.add_all(new_entries_to_add)
        db.commit()
        print(f"Successfully added {len(new_entries_to_add)} new ledger entries for project '{project_name}' from Excel file.")
        return {"message": f"Libro mayor reemplazado exitosamente. {len(current_entries_db) if current_entries_db else 0} asientos archivados, {deleted_rows} eliminados, {len(new_entries_to_add)} nuevos asientos agregados."}

    except Exception as e:
        db.rollback()
        print(f"Error processing Excel file for project '{project_name}': {e}")
        # Consider if you need to restore backup here, though that's complex
        raise HTTPException(status_code=500, detail=f"Error processing Excel file: {str(e)}") 

# Helper to convert model instance to schema, handling date/Decimal
def convert_admin_cost_db_to_schema(db_entry: AdministrativeCostDB) -> AdministrativeCost:
    return AdministrativeCost.model_validate(db_entry)

@router.get("/administrative-costs", response_model=List[AdministrativeCost])
async def get_administrative_costs(db: Session = Depends(get_db)):
    """Retrieve all administrative cost entries."""
    try:
        admin_costs_db = db.query(AdministrativeCostDB).order_by(AdministrativeCostDB.entry_date.desc()).all()
        # Convert to Pydantic models for response
        admin_costs_schema = [convert_admin_cost_db_to_schema(entry) for entry in admin_costs_db]
        return admin_costs_schema
    except Exception as e:
        logging.error(f"Error fetching administrative costs: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error while fetching administrative costs: {str(e)}")

@router.get("/administrative-costs/monthly-summary", response_model=schemas.AdministrativeCostsMonthlySummary)
async def get_administrative_costs_monthly_summary(db: Session = Depends(get_db)):
    """
    Returns the total administrative costs per month (YYYY_MM), summing debit_amount for each month.
    """
    try:
        # Query all admin costs
        admin_costs = db.query(AdministrativeCostDB).all()
        monthly_totals = {}
        for entry in admin_costs:
            if entry.entry_date and entry.debit_amount:
                month_key = f"{entry.entry_date.year}_{entry.entry_date.month:02d}"
                monthly_totals[month_key] = monthly_totals.get(month_key, 0) + float(entry.debit_amount)
        # Sort months
        sorted_months = sorted(monthly_totals.keys())
        # Convert values to Decimal for schema
        totals_by_month = {k: Decimal(str(v)) for k, v in monthly_totals.items()}
        return schemas.AdministrativeCostsMonthlySummary(months=sorted_months, totals_by_month=totals_by_month)
    except Exception as e:
        logging.error(f"Error aggregating administrative costs monthly: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error while aggregating administrative costs: {str(e)}")

def process_uploaded_admin_costs_file(file_contents: bytes, db: Session, filename: str) -> List[schemas.AdministrativeCostCreate]:
    """
    Processes an uploaded Excel/CSV file for administrative costs.
    Extracts Account ID and Description, parses rows, and returns a list of AdministrativeCostCreate objects.
    Similar to process_uploaded_ledger_file but tailored for admin costs structure.
    """
    processed_entries = []
    try:
        # Determine file type and read accordingly
        if filename.endswith('.xlsx') or filename.endswith('.xls'):
            df = pd.read_excel(BytesIO(file_contents), header=4) # Assuming header is on row 5 (0-indexed 4)
        elif filename.endswith('.csv'):
            # For CSV, attempt UTF-8 then latin1, common for these files
            try:
                df = pd.read_csv(BytesIO(file_contents), header=4, encoding='utf-8', keep_default_na=True, na_values=['NaN', 'N/A', ''])
            except UnicodeDecodeError:
                df = pd.read_csv(BytesIO(file_contents), header=4, encoding='latin1', keep_default_na=True, na_values=['NaN', 'N/A', ''])
        else:
            raise ValueError("Unsupported file type. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.")

        logging.info(f"Successfully read uploaded admin costs file: {filename}. Columns found: {df.columns.tolist()}")

        # Rename columns based on EXPECTED_COLUMNS_ADMIN_COSTS_EXCEL
        df.rename(columns=EXPECTED_COLUMNS_ADMIN_COSTS_EXCEL, inplace=True)
        
        # Attempt to extract a global Account ID and Description for this file
        # This logic is simplified from the standalone ingest script and assumes a similar structure
        # where Account ID and Description might be found in the initial rows parsed by pandas' header logic.
        # For Excel, pandas might put these in 'Unnamed:X' columns if they are not aligned with the main table.
        # This part will need careful testing with actual admin cost Excel files.

        # A simpler approach for admin costs: assume Account ID might be in a column,
        # and Account Description could be fixed or derived.
        # For the 'CTA COSTOS ADMINISTRATIVOS IVE2.csv', it was '190-1' and 'COSTOS ADMINISTRATIVOS'
        
        # Placeholder: In a real scenario, more robust extraction for Account ID / Description from df is needed
        # For now, we'll make them optional and expect them to be in the row data if present.
        # Or, if all admin costs are for a fixed Account ID/Desc, that can be hardcoded or configured.

        file_account_id = "190-1" # Default or common ID for admin costs, adjust as needed
        file_account_description = "COSTOS ADMINISTRATIVOS" # Default or common description, adjust

        logging.info(f"Using default Account ID: {file_account_id}, Description: {file_account_description} for admin_costs upload.")

        for index, row in df.iterrows():
            excel_row_num = index + 5 # header=4 means data starts at df row 0, which is Excel row 5

            entry_date_val = row.get('entry_date')
            transaction_description_val = row.get('transaction_description')

            if pd.isna(entry_date_val) and pd.isna(transaction_description_val):
                logging.info(f"Skipping empty or header-like row {excel_row_num} in uploaded admin costs file.")
                continue
            if transaction_description_val in ["Beginning Balance", "Current Period Change"]:
                logging.info(f"Skipping summary row: {transaction_description_val} at Excel row {excel_row_num}")
                continue

            entry_date = parse_date_excel(entry_date_val, excel_row_num_for_logging=excel_row_num)
            if not entry_date:
                logging.warning(f"Skipping row {excel_row_num} in uploaded admin costs file due to unparseable date: {entry_date_val}")
                continue
            
            if not transaction_description_val or pd.isna(transaction_description_val):
                logging.warning(f"Skipping row {excel_row_num} in uploaded admin costs file due to missing transaction description.")
                continue
            
            account_id_from_row = row.get('account_id')
            
            current_account_id = str(account_id_from_row) if pd.notna(account_id_from_row) and str(account_id_from_row).strip() else file_account_id
            current_account_description = file_account_description # Simplified for admin costs

            debit_amount_raw = row.get('debit_amount')
            credit_amount_raw = row.get('credit_amount')
            balance_raw = row.get('balance')

            # Clean numeric values (handle potential non-numeric types before Decimal conversion)
            debit_amount = Decimal(str(debit_amount_raw).replace(',','')) if pd.notna(debit_amount_raw) and str(debit_amount_raw).strip() != "" else None
            credit_amount = Decimal(str(credit_amount_raw).replace(',','')) if pd.notna(credit_amount_raw) and str(credit_amount_raw).strip() != "" else None
            balance = Decimal(str(balance_raw).replace(',','')) if pd.notna(balance_raw) and str(balance_raw).strip() != "" else None
            
            entry_data = schemas.AdministrativeCostCreate(
                account_id=current_account_id,
                account_description=current_account_description,
                entry_date=entry_date,
                reference=str(row.get('reference', '')) if pd.notna(row.get('reference')) else None,
                journal=str(row.get('journal', '')) if pd.notna(row.get('journal')) else None,
                transaction_description=str(transaction_description_val),
                debit_amount=debit_amount,
                credit_amount=credit_amount,
                balance=balance
            )
            processed_entries.append(entry_data)

    except pd.errors.EmptyDataError:
        logging.warning(f"Uploaded admin costs file {filename} is empty or header not found correctly.")
        # No HTTPException here, let the caller handle empty list
    except ValueError as ve: # Catches unsupported file type or Decimal conversion errors
        logging.error(f"ValueError during processing admin costs file {filename}: {ve}")
        raise HTTPException(status_code=400, detail=str(ve)) # Bad request
    except Exception as e:
        logging.error(f"Unexpected error processing admin costs file {filename}: {e}", exc_info=True)
        # Re-raise as HTTPException to be caught by FastAPI error handling
        raise HTTPException(status_code=500, detail=f"Error processing admin costs file: {str(e)}")

    logging.info(f"Processed {len(processed_entries)} entries from uploaded admin costs file {filename}")
    return processed_entries


@router.post("/upload-replace-admin-costs", response_model=schemas.Msg)
async def upload_replace_admin_costs(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Uploads an Excel/CSV file for administrative costs.
    1. Backs up all existing administrative cost entries.
    2. Deletes all existing administrative cost entries.
    3. Processes the new file and inserts the entries.
    """
    backup_dir = os.path.join("backups", "admin_costs_backups")
    os.makedirs(backup_dir, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file_name = f"admin_costs_backup_{timestamp}.jsonl.gz"
    backup_file_path = os.path.join(backup_dir, backup_file_name)

    try:
        # 1. Backup existing data
        existing_entries_db = db.query(models.AdministrativeCostDB).all()
        if existing_entries_db:
            entries_to_backup = [schemas.AdministrativeCost.model_validate(entry).model_dump(mode='json') for entry in existing_entries_db]
            backup_data_to_jsonl_gz(entries_to_backup, backup_file_path)
            logging.info(f"Successfully backed up {len(existing_entries_db)} admin cost entries to {backup_file_path}")
        else:
            logging.info("No existing admin cost entries to back up.")

        # 2. Delete existing data for all admin costs (no project filter here)
        num_deleted = db.query(models.AdministrativeCostDB).delete()
        logging.info(f"Deleted {num_deleted} existing admin cost entries.")

        # 3. Process new file
        file_contents = await file.read()
        new_entries_data = process_uploaded_admin_costs_file(file_contents, db, file.filename)

        if not new_entries_data:
            # Commit deletions even if new file is empty or invalid, as per "truncate and replace"
            db.commit()
            logging.warning(f"No valid entries found in uploaded admin costs file: {file.filename}. Table remains empty after backup and delete.")
            return schemas.Msg(message="Admin costs table cleared. No new valid entries found in the uploaded file.")

        # 4. Add new entries to DB
        db_entries = [models.AdministrativeCostDB(**entry.model_dump()) for entry in new_entries_data]
        db.add_all(db_entries)
        
        db.commit() # Commit deletions and additions together
        logging.info(f"Successfully processed and inserted {len(db_entries)} new admin cost entries from {file.filename}.")
        return schemas.Msg(message=f"Successfully uploaded and replaced administrative costs. {len(db_entries)} new entries added.")

    except HTTPException as he: # Re-raise HTTPExceptions from process_uploaded_admin_costs_file
        db.rollback()
        raise he
    except Exception as e:
        db.rollback()
        logging.error(f"Error in upload_replace_admin_costs endpoint: {e}", exc_info=True)
        # Consider if you need to restore backup here, though that's complex
        raise HTTPException(status_code=500, detail=f"Error processing administrative costs file: {str(e)}")
    finally:
        await file.close() 

# Define the response model for project cash flow items
class ProjectCashFlowItem(schemas.BaseModel):
    category: str # This will be the account_description
    # subcategory: Optional[str] = None # Could be added if a finer grain is needed
    months: Dict[str, Decimal] # YYYY-MM: net_amount

    class Config:
        from_attributes = True

@router.get("/project-cash-flow", response_model=List[ProjectCashFlowItem])
async def get_project_cash_flow(
    project_name: str = Query(..., description="The name of the project to fetch cash flow for"),
    db: Session = Depends(get_db)
):
    """
    Generates a monthly cash flow summary for a given project based on ledger entries.
    Each item represents an account_description, with monthly net amounts.
    Net amount = sum(credit_amount) - sum(debit_amount) for that account_description in that month.
    """
    if not project_name:
        raise HTTPException(status_code=400, detail="Project name is required.")

    try:
        # Query to get sum of credits and debits per account_description per month
        # for the specified project.
        # We need to group by year, month, and account_description.
        monthly_data = (
            db.query(
                models.LedgerEntryDB.account_description,
                extract('year', models.LedgerEntryDB.entry_date).label('year'),
                extract('month', models.LedgerEntryDB.entry_date).label('month'),
                func.sum(models.LedgerEntryDB.credit_amount).label('total_credits'),
                func.sum(models.LedgerEntryDB.debit_amount).label('total_debits')
            )
            .filter(models.LedgerEntryDB.project_name == project_name)
            .group_by(
                models.LedgerEntryDB.account_description,
                extract('year', models.LedgerEntryDB.entry_date),
                extract('month', models.LedgerEntryDB.entry_date)
            )
            .order_by(
                extract('year', models.LedgerEntryDB.entry_date),
                extract('month', models.LedgerEntryDB.entry_date),
                models.LedgerEntryDB.account_description
            )
            .all()
        )

        # Process the data into the desired response format
        cash_flow_summary = {}
        for row in monthly_data:
            account_desc, year, month, total_credits, total_debits = row
            year = int(year) if year else 0
            month = int(month) if month else 0
            
            if not account_desc: # Skip entries with no account description for categorization
                continue

            # Ensure amounts are Decimal and handle None
            total_credits = total_credits or Decimal(0)
            total_debits = total_debits or Decimal(0)

            net_amount = total_credits - total_debits
            month_key = f"{year:04d}-{month:02d}"

            if account_desc not in cash_flow_summary:
                cash_flow_summary[account_desc] = {
                    "category": account_desc,
                    "months": {}
                }
            cash_flow_summary[account_desc]["months"][month_key] = net_amount
        
        return list(cash_flow_summary.values())

    except Exception as e:
        logging.error(f"Error generating project cash flow for '{project_name}': {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error while generating cash flow: {str(e)}")

@router.get("/distinct-project-names", response_model=List[str])
async def get_distinct_project_names(
    db: Session = Depends(get_db)
):
    """
    Retrieves a list of distinct project names from the ledger entries.
    """
    try:
        distinct_projects = db.query(models.LedgerEntryDB.project_name).distinct().all()
        return [project[0] for project in distinct_projects if project[0] is not None]
    except Exception as e:
        print(f"Error fetching distinct project names: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor al obtener nombres de proyectos.")

@router.get("/cashflow/combined/mercadeo")
def get_combined_cash_flow(db: Session = Depends(get_db)):
    """
    This endpoint retrieves cash flow data from all project-related views,
    combines them, and returns a single consolidated cash flow statement.
    """
    try:
        combined_data = crud.get_combined_marketing_cashflow(db)
        
        if not combined_data:
            return []
            
        return combined_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/marketing-summary-views", response_model=List[str])
def list_marketing_summary_views(db: Session = Depends(get_db)):
    """
    List all marketing summary views (vista_presupuesto_mercadeo_%_resumen)
    """
    try:
        result = db.execute(text("""
            SELECT table_name
            FROM information_schema.views
            WHERE table_schema = 'public'
            AND table_name LIKE 'vista_presupuesto_mercadeo_%_resumen'
            ORDER BY table_name
        """))
        views = [row[0] for row in result.fetchall()]
        return views
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing summary views: {str(e)}")

 