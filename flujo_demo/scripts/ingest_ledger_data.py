import csv
import psycopg2
from datetime import datetime
import re # For cleaning numeric strings
import os # To access environment variables
from dotenv import load_dotenv, find_dotenv # To load .env file

# --- Load .env file explicitly and override existing OS vars ---
# Construct the path to the .env file (assuming it's in the parent directory of this script)
# script_dir = os.path.dirname(__file__) # Gets the directory of the current script
# project_root = os.path.dirname(script_dir) # Assumes .env is one level up
# dotenv_path = os.path.join(project_root, '.env')

# Simpler: find_dotenv() automatically locates the .env file by searching upwards
dotenv_path = find_dotenv()

if dotenv_path:
    print(f"Loading .env file from: {dotenv_path}")
    load_dotenv(dotenv_path=dotenv_path, override=True)
else:
    print("Warning: .env file not found. Using system environment variables or defaults.")

# --- Debug: Print DB_USER immediately after trying to load .env ---
print(f"DB_USER after load_dotenv: {os.getenv('DB_USER')}") 

# --- Database Connection Parameters (Loaded from environment variables) ---
DB_HOST = os.getenv("DB_HOST", "34.174.189.231")
DB_NAME = os.getenv("DB_NAME", "grupo11flujo")
DB_USER = os.getenv("DB_USER") # Will now use the overridden value if .env was loaded
DB_PASSWORD = os.getenv("DB_PASSWORD")

# --- CSV File Path ---
CSV_FILE_PATH = "Excel/Contabilidad/CTA 190 CONTRUCCIN EN PROCESO IVE2.csv" # Relative to project root

def parse_amount(amount_str):
    if not amount_str:
        return None
    cleaned_str = amount_str.replace(",", "")
    if cleaned_str.startswith("(") and cleaned_str.endswith(")"):
        cleaned_str = "-" + cleaned_str[1:-1]
    try:
        return float(cleaned_str)
    except ValueError:
        print(f"Warning: Could not parse amount '{amount_str}'")
        return None

def parse_date_flexible(date_str):
    if not date_str:
        return None
    for fmt in ("%m/%d/%y", "%m/%d/%Y", "%-m/%d/%y", "%m/%-d/%y", "%-m/%-d/%y",
                "%-m/%d/%Y", "%m/%-d/%Y", "%-m/%-d/%Y"):
        try:
            # Correctly return datetime object for strftime, or strftime result directly
            return datetime.strptime(date_str, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    print(f"Warning: Could not parse date '{date_str}' using known formats.")
    return None

def is_likely_transaction_row(row, min_cols=7):
    if len(row) < min_cols:
        return False
    
    date_str = row[2].strip() if len(row) > 2 else ""
    if not parse_date_flexible(date_str):
        return False

    debit_str = row[6].strip() if len(row) > 6 else ""
    credit_str = row[7].strip() if len(row) > 7 else ""
    balance_str = row[8].strip() if len(row) > 8 else ""

    if debit_str or credit_str or balance_str:
        return True
        
    trans_desc_candidate = row[5].strip() if len(row) > 5 else ""
    if "Beginning Balance" in trans_desc_candidate and balance_str:
        return True
        
    return False

def main():
    conn = None
    cur = None
    inserted_rows = 0
    skipped_rows = 0
    
    default_account_id = "190" 
    default_account_description = "CONSTRUCCION EN PROCESO" 

    current_account_id = default_account_id
    current_account_description = default_account_description

    try:
        # --- Print effective DB connection parameters for debugging ---
        print(f"Attempting to connect with:")
        print(f"  DB_HOST: {DB_HOST}")
        print(f"  DB_NAME: {DB_NAME}")
        print(f"  DB_USER: {DB_USER}")
        # Be cautious if DB_PASSWORD prints an actual password in shared logs
        print(f"  DB_PASSWORD is set: {True if DB_PASSWORD else False}") 
        
        conn = psycopg2.connect(host=DB_HOST, dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD, port="5432")
        cur = conn.cursor()

        # print("WARNING: Clearing existing data from ledger_entries table.")
        # cur.execute("TRUNCATE TABLE ledger_entries RESTART IDENTITY;") # Use TRUNCATE for faster clearing if needed
        # print("ledger_entries table cleared.")

        with open(CSV_FILE_PATH, 'r', encoding='utf-8-sig') as csvfile:
            csv_reader = csv.reader(csvfile)
            
            row_num = 0
            header_found_and_skipped = False

            for row in csv_reader:
                row_num += 1
                if not row or all(s.strip() == "" for s in row):
                    skipped_rows += 1
                    continue

                if not header_found_and_skipped:
                    if any(kw in cell for cell in row[:5] for kw in ["Account ID", "Date", "Reference", "Trans Description"]): # Check first few cells
                        if "Account ID" in row[0] and "Date" in row[2] and "Reference" in row[3]:
                            print(f"Main header row identified and skipped at line {row_num}: {str(row[:5])[:100]}...") # Limit print length
                            header_found_and_skipped = True
                            skipped_rows +=1
                            continue
                    print(f"Skipping potential header/meta-data line {row_num}: {str(row[:5])[:100]}...")
                    skipped_rows +=1
                    continue
                
                if len(row) > 5 and "Current Period Change" in row[5]:
                    print(f"Skipping summary line {row_num}: {row[5]}")
                    skipped_rows +=1
                    continue
                
                row_account_id_candidate = row[0].strip()
                row_account_desc_candidate = row[1].strip()

                if row_account_id_candidate and row_account_id_candidate.isdigit(): # Simple check if it's an account ID
                    current_account_id = row_account_id_candidate
                    if row_account_desc_candidate:
                        current_account_description = row_account_desc_candidate
                elif row_account_desc_candidate and not (len(row) > 2 and parse_date_flexible(row[2].strip())):
                    # If col 1 has text, and col 2 isn't a date, it's likely the description for the current_account_id
                    current_account_description = row_account_desc_candidate
                    if not is_likely_transaction_row(row):
                        print(f"Account description updated at line {row_num} to '{current_account_description}'. Skipping as non-transactional.")
                        skipped_rows +=1
                        continue
                
                if not is_likely_transaction_row(row):
                    # print(f"Skipping non-transactional line {row_num}: {str(row[:6])[:100]}...")
                    skipped_rows +=1
                    continue

                try:
                    entry_date_str = row[2].strip()
                    reference = row[3].strip() if len(row) > 3 else ""
                    journal = row[4].strip() if len(row) > 4 else ""
                    trans_description = row[5].strip() if len(row) > 5 else ""
                    debit_amount_str = row[6].strip() if len(row) > 6 else ""
                    credit_amount_str = row[7].strip() if len(row) > 7 else ""
                    balance_str = row[8].strip() if len(row) > 8 else ""
                    
                    entry_date = parse_date_flexible(entry_date_str)
                    if not entry_date:
                        # print(f"Skipping row {row_num} due to unparseable date: {entry_date_str}")
                        skipped_rows +=1
                        continue

                    debit_amount = parse_amount(debit_amount_str)
                    credit_amount = parse_amount(credit_amount_str)
                    balance = parse_amount(balance_str)

                    if "Beginning Balance" in trans_description and balance is None and debit_amount is None and credit_amount is None:
                        # print(f"Skipping 'Beginning Balance' line {row_num} without a monetary value: {str(row[:6])[:100]}...")
                        skipped_rows +=1
                        continue
                    
                    # Define the project name for the data being ingested
                    current_project_name = "Villas del Este" # Or make this dynamic if needed

                    sql = """
                        INSERT INTO ledger_entries (
                            account_id, account_description, entry_date, reference, journal,
                            transaction_description, debit_amount, credit_amount, balance, project_name
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                    """
                    params = (
                        current_account_id, current_account_description, entry_date, reference, journal,
                        trans_description, debit_amount, credit_amount, balance, current_project_name
                    )
                    cur.execute(sql, params)
                    inserted_rows += 1

                except IndexError as e:
                    # print(f"Skipping row {row_num} due to IndexError (malformed): {str(row)[:100]}... Error: {e}")
                    skipped_rows +=1
                    continue
                except Exception as e:
                    print(f"Error processing data in row {row_num}: {str(row)[:100]}... Error: {e}")
                    skipped_rows +=1
                    continue

            conn.commit()
            print(f"\nData ingestion complete. Inserted {inserted_rows} rows. Skipped {skipped_rows} rows.")

    except psycopg2.Error as e:
        print(f"Database error: {e}")
        if conn:
            conn.rollback()
    except FileNotFoundError:
        print(f"Error: The file {CSV_FILE_PATH} was not found. Please ensure it's in the Excel/Contabilidad/ directory relative to your project root.")
    except Exception as e:
        print(f"An unexpected error occurred during script execution: {e}")
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()
        print("Database connection closed.")

if __name__ == "__main__":
    main() 