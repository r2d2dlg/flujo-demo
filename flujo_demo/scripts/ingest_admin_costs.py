import csv
import os
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import execute_values
from datetime import datetime
import pandas as pd
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Load environment variables from .env file
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")

# Define expected column headers from the CSV (after the initial metadata rows)
# Based on CSV: Account ID,,Date,Reference,Jrnl,Trans Description,Debit Amt,Credit Amt,Balance
# Row 5 headers:
CSV_COLUMNS = {
    "Account ID": "account_id",
    "Date": "entry_date",
    "Reference": "reference",
    "Jrnl": "journal",
    "Trans Description": "transaction_description",
    "Debit Amt": "debit_amount",
    "Credit Amt": "credit_amount",
    "Balance": "balance",
    # "Account Description" is handled separately as it appears on the next row in the header block
}

def parse_date_csv(date_str):
    """Parses a date string from CSV, attempting multiple formats."""
    if not date_str or pd.isna(date_str):
        return None
    formats_to_try = [
        "%m/%d/%y",  # e.g., "1/1/24"
        "%Y-%m-%d %H:%M:%S", # From pandas to_datetime default
        "%m/%d/%Y", # e.g., "01/01/2024"
        # Add other common formats if needed
    ]
    for fmt in formats_to_try:
        try:
            return datetime.strptime(str(date_str).split(' ')[0], fmt).date()
        except (ValueError, TypeError):
            continue
    logging.warning(f"Could not parse date: {date_str} with attempted formats.")
    return None

def clean_numeric_value(value_str):
    """Cleans and converts a numeric string value (handles commas, N/A, empty)."""
    if value_str is None or pd.isna(value_str) or str(value_str).strip() == "" or str(value_str).lower() == 'n/a':
        return None
    # Remove commas and parentheses (often used for negative numbers in accounting)
    cleaned_value = str(value_str).replace(",", "").replace("(", "-").replace(")", "")
    try:
        return float(cleaned_value)
    except ValueError:
        logging.warning(f"Could not convert numeric value: {value_str}")
        return None

def ingest_data(csv_file_path):
    """
    Reads data from a CSV file, transforms it, and inserts it into the administrative_costs table.
    The CSV has headers starting on row 5. 'Account Description' for a given 'Account ID' is on row 6, column 2.
    """
    conn = None
    try:
        conn = psycopg2.connect(
            dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD, host=DB_HOST, port=DB_PORT
        )
        cur = conn.cursor()
        logging.info("Successfully connected to the database.")

        # Read the CSV, skipping initial metadata rows, header is on row 5 (0-indexed 4)
        try:
            df = pd.read_csv(csv_file_path, header=4, encoding='utf-8', keep_default_na=True, na_values=['NaN', 'N/A', ''])
            logging.info(f"Successfully read CSV: {csv_file_path}. Columns found: {df.columns.tolist()}")
        except Exception as e:
            logging.error(f"Error reading CSV file with pandas: {e}")
            # Try with 'latin1' encoding if utf-8 fails, as sometimes these files have mixed encodings
            try:
                df = pd.read_csv(csv_file_path, header=4, encoding='latin1', keep_default_na=True, na_values=['NaN', 'N/A', ''])
                logging.info(f"Successfully read CSV with latin1 encoding. Columns found: {df.columns.tolist()}")
            except Exception as e_latin1:
                logging.error(f"Error reading CSV file with pandas (latin1 attempt): {e_latin1}")
                return False


        # Rename columns to match database schema
        df.rename(columns=CSV_COLUMNS, inplace=True)
        
        # The "Account Description" is on the row immediately following the header row (row 6 of CSV, which is index 0 of the *data* read by pandas if header=4)
        # and in the second column.
        # However, the main data entries don't repeat Account ID and Account Description on every line.
        # We need to forward-fill these.
        # The first row after headers (row 6 in CSV, index 0 in df) contains the initial Account Description for the Account ID in header
        
        # Let's find the actual first 'Account ID' value which is typically in cell A5 (0-indexed) in the raw CSV
        # We need to read it before pandas processing if it's not part of the main data table.
        # For this CSV, "Account ID" is in the first column of the header row (row 5).
        # "Account Description" is in the second column of the *next* row (row 6).

        # For simplicity, let's assume 'account_id' column from header row (row 5) is correctly parsed by pandas.
        # The first row of the dataframe (df.iloc[0]) *might* contain the account description in an unnamed column
        # or the relevant "Account ID" might be static for the whole file.

        # From the CSV sample:
        # Row 5: Account ID,,Date,Reference,Jrnl,Trans Description,Debit Amt,Credit Amt,Balance
        # Row 6: ,Account Description,,,,,,
        # Row 7: 190-1,,1/1/24,,,Beginning Balance,,,, (Data starts)
        # So, Account ID '190-1' is linked to 'COSTOS ADMINISTRATIVOS'
        
        # Pandas read_csv with header=4 will make row 5 the header.
        # df.columns will be ['Account ID', 'Unnamed: 1', 'Date', 'Reference', 'Jrnl', 'Trans Description', 'Debit Amt', 'Credit Amt', 'Balance', ...]
        # The data lines start from what was row 7 in the CSV.
        # 'Account ID' in these data lines (e.g. '190-1') should be used.
        # The 'Account Description' (e.g. 'COSTOS ADMINISTRATIVOS') is trickier as it's not in a clear column for data rows.
        # It seems the 'Account Description' (e.g. "COSTOS ADMINISTRATIVOS" for "190-1") is associated with the Account ID for the block.
        # For this specific CSV, it appears all entries fall under one main "Account ID" and "Account Description"
        # indicated at the top of the data section.
        
        # Let's extract the account_id and description from the rows just below the header if possible.
        # We need to re-read the CSV for this small part as pandas might have skipped it or misinterpeterd.
        
        temp_df_for_header_details = pd.read_csv(csv_file_path, header=None, skiprows=5, nrows=2, encoding='latin1')
        # Row 0 of temp_df_for_header_details is CSV Row 6
        # Row 1 of temp_df_for_header_details is CSV Row 7
        
        # Account ID is from CSV Row 7, Column 0. It's the first actual data row's Account ID.
        # For this specific CSV, 'Account ID' column in main df should be used.
        # The *description* for that account ID is in CSV Row 6, Column 1.
        # However, this is for the *first* account ID mentioned.
        
        # Let's assume for this specific CSV, "COSTOS ADMINISTRATIVOS" is the relevant description for all entries,
        # as it's a "CTA COSTOS ADMINISTRATIVOS" file.
        # A more robust solution would map Account IDs to their descriptions if they change within the file.
        # For now, we'll use a fixed description or try to extract the primary one.
        
        # From the CSV file inspection, row 6, second column (index 1) has "COSTOS ADMINISTRATIVOS"
        # This is the description for the account "190-1" which appears to be the main account for this file.
        
        # Simpler approach for THIS specific CSV:
        # The Account ID appears to be '190-1' for most relevant entries.
        # The Account Description is 'COSTOS ADMINISTRATIVOS'.
        # We will make sure these are correctly picked up or defaulted.
        
        # Let's extract the first Account ID and its corresponding description
        # Read a few lines to get to the account description more reliably
        raw_lines = []
        with open(csv_file_path, 'r', encoding='latin1') as f:
            for i, line in enumerate(f):
                if i >= 4 and i <= 8: # header row + next 4 lines (CSV rows 5 to 9)
                    raw_lines.append(line.strip().split(','))
        
        file_account_id = None
        file_account_description = None

        if len(raw_lines) > 0:
            # Try to get Account ID from the first data row (raw_lines[2] which is CSV row 7, first column)
            if len(raw_lines) > 2 and len(raw_lines[2]) > 0:
                potential_aid = raw_lines[2][0].strip()
                if potential_aid and potential_aid != "": # Ensure it's not an empty string
                    file_account_id = potential_aid
                    logging.info(f"Extracted potential Account ID: {file_account_id} from CSV row 7, column 1.")

            # Try to get Account Description by looking in the second column of rows after header
            # Expected on CSV row 8 (raw_lines[3]), second column (index 1)
            if file_account_id: # Only look for description if we found an account ID
                for i in range(1, len(raw_lines)): # Start from raw_lines[1] (CSV row 6)
                    if len(raw_lines[i]) > 1:
                        potential_desc = raw_lines[i][1].strip()
                        if potential_desc and potential_desc.lower() not in ["", "account description"]:
                            file_account_description = potential_desc
                            logging.info(f"Extracted Account Description: '{file_account_description}' from CSV row {i+5}, column 2.")
                            break # Found the first good one
            
            if file_account_id and not file_account_description:
                logging.warning(f"Found Account ID {file_account_id} but no clear Account Description in early rows. Check CSV structure.")
            elif not file_account_id:
                logging.warning("Could not extract a primary Account ID from the expected rows (CSV row 7, col 1).")
        else:
            logging.warning("Could not read header/initial data rows from CSV to extract Account ID/Description.")

        records_to_insert = []
        for index, row in df.iterrows():
            # Skip rows that are likely headers or summary lines like "Beginning Balance" or "Current Period Change"
            if row.get('transaction_description') in ["Beginning Balance", "Current Period Change"]:
                logging.info(f"Skipping summary row: {row.get('transaction_description')}")
                continue
            if pd.isna(row.get('entry_date')) and pd.isna(row.get('transaction_description')):
                 logging.info(f"Skipping probably empty or malformed row: {index}")
                 continue

            entry_date = parse_date_csv(row.get('entry_date'))
            if not entry_date:
                logging.warning(f"Skipping row {index+5} due to unparseable date: {row.get('entry_date')}")
                continue
            if not row.get('transaction_description') or pd.isna(row.get('transaction_description')):
                logging.warning(f"Skipping row {index+5} due to missing transaction description.")
                continue
            
            account_id_val = row.get('account_id') if pd.notna(row.get('account_id')) else file_account_id
            
            # If the row's account_id is the same as the main file_account_id, use the file_account_description.
            # This is a simplification; a multi-account CSV would need a lookup.
            account_description_val = file_account_description if account_id_val == file_account_id else None
            if not account_id_val: # If still no account ID, skip.
                logging.warning(f"Skipping row {index+5} due to missing account ID.")
                continue

            record = (
                account_id_val,
                account_description_val, # Use the extracted description
                entry_date,
                row.get('reference'),
                row.get('journal'),
                row.get('transaction_description'),
                clean_numeric_value(row.get('debit_amount')),
                clean_numeric_value(row.get('credit_amount')),
                clean_numeric_value(row.get('balance'))
            )
            records_to_insert.append(record)

        if not records_to_insert:
            logging.info("No valid records found to insert.")
            return False

        insert_query = """
            INSERT INTO administrative_costs (
                account_id, account_description, entry_date, reference, journal,
                transaction_description, debit_amount, credit_amount, balance
            ) VALUES %s;
        """
        
        execute_values(cur, insert_query, records_to_insert)
        conn.commit()
        logging.info(f"Successfully inserted {len(records_to_insert)} records into administrative_costs.")
        
        cur.close()
        return True

    except psycopg2.Error as e:
        logging.error(f"Database error: {e}")
        if conn:
            conn.rollback()
        return False
    except pd.errors.EmptyDataError:
        logging.error(f"CSV file is empty or header not found correctly: {csv_file_path}")
        return False
    except Exception as e:
        logging.error(f"An unexpected error occurred: {e}")
        if conn:
            conn.rollback()
        return False
    finally:
        if conn:
            conn.close()
            logging.info("Database connection closed.")

if __name__ == "__main__":
    # Ensure the path is relative to this script's location or use an absolute path
    # Path to the CSV relative to the project root: Excel/Contabilidad/CTA COSTOS ADMINISTRATIVOS IVE2.csv
    # This script is in scripts/, so .csv is in ../Excel/Contabilidad/
    csv_file = os.path.join(os.path.dirname(__file__), "..", "Excel", "Contabilidad", "CTA COSTOS ADMINISTRATIVOS IVE2.csv")
    
    # First, ensure the .env file is found and variables are loaded
    if not all([DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT]):
        logging.error("Database environment variables are not fully set. Please check your .env file and its path.")
        logging.error(f"dotenv_path used: {os.path.join(os.path.dirname(__file__), '..', '.env')}")
        logging.error(f"DB_NAME loaded: {'Yes' if DB_NAME else 'No'}")
        logging.error(f"DB_USER loaded: {'Yes' if DB_USER else 'No'}")
        # Avoid logging password
        logging.error(f"DB_HOST loaded: {'Yes' if DB_HOST else 'No'}")
        logging.error(f"DB_PORT loaded: {'Yes' if DB_PORT else 'No'}")
    else:
        logging.info("Database environment variables loaded successfully.")
        
        # Optional: Clear the table before ingesting for a fresh start (be careful with this in production)
        # conn_temp = psycopg2.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD, host=DB_HOST, port=DB_PORT)
        # cur_temp = conn_temp.cursor()
        # cur_temp.execute("DELETE FROM administrative_costs;")
        # conn_temp.commit()
        # cur_temp.close()
        # conn_temp.close()
        # logging.info("Cleared existing data from administrative_costs table.")

        if ingest_data(csv_file):
            logging.info("Data ingestion completed successfully.")
        else:
            logging.info("Data ingestion failed.") 