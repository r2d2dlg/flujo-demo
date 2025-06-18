# backend/app/scripts/fix_orphan_abonos.py

import sys
import os
from sqlalchemy.orm import Session
from decimal import Decimal
import re

# Add the project root to the Python path to allow for absolute imports
# This is a common pattern for standalone scripts in a larger project
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.insert(0, project_root)

from app.database import SessionLocal
from app.models import LineaCreditoUso, LineaCredito, Pago

def fix_orphan_abonos_by_description():
    """
    Finds and corrects orphaned 'ABONO_COBRO_CLIENTE' transactions
    by parsing the payment ID from the description text. This is a more
    robust way to find orphans created before the pago_id column was in use.
    """
    db: Session = SessionLocal()
    print("Starting robust process to fix orphaned credit line payments by description...")

    try:
        # Find all abonos that could potentially be orphans
        potential_orphans = db.query(LineaCreditoUso).filter(
            LineaCreditoUso.tipo_transaccion == 'ABONO_COBRO_CLIENTE'
        ).all()

        if not potential_orphans:
            print("No 'ABONO_COBRO_CLIENTE' transactions found.")
            return

        print(f"Found {len(potential_orphans)} potential orphans. Checking for corresponding payments...")
        
        corrected_count = 0

        for uso in potential_orphans:
            # Extract pago_id from description, e.g., "Abono del 90.0% del pago ID 123 ..."
            match = re.search(r"pago ID (\d+)", uso.descripcion)
            if not match:
                continue

            pago_id_from_desc = int(match.group(1))

            # Check if the payment still exists
            corresponding_pago = db.query(Pago).filter(Pago.id == pago_id_from_desc).first()

            # If the payment does NOT exist, it's a true orphan
            if not corresponding_pago:
                corrected_count += 1
                print(f"Found orphan usage ID: {uso.id} (linked to non-existent Pago ID: {pago_id_from_desc})")

                linea_credito = db.query(LineaCredito).filter(LineaCredito.id == uso.linea_credito_id).first()

                if not linea_credito:
                    print(f"  - WARNING: Corresponding credit line (ID: {uso.linea_credito_id}) not found. Deleting orphan usage record anyway.")
                    db.delete(uso)
                    continue

                monto_a_reversar = uso.monto_usado  # This amount is negative
                print(f"  - Current available balance: {linea_credito.monto_disponible}")
                print(f"  - Amount to reverse: {monto_a_reversar}")

                # Reversing the transaction
                new_balance = linea_credito.monto_disponible - monto_a_reversar
                print(f"  - New calculated balance: {new_balance}")

                linea_credito.monto_disponible = new_balance
                db.add(linea_credito)
                
                # Delete the orphaned usage record
                db.delete(uso)
                print(f"  - Corrected balance for credit line ID: {linea_credito.id}. Deleted orphan usage record ID: {uso.id}")

        if corrected_count > 0:
            print(f"Committing {corrected_count} correction(s) to the database...")
            db.commit()
            print("Process completed successfully.")
        else:
            print("No true orphans found by description. Database appears consistent.")

    except Exception as e:
        print(f"An error occurred: {e}")
        print("Rolling back transaction.")
        db.rollback()
    finally:
        db.close()
        print("Database session closed.")

if __name__ == "__main__":
    fix_orphan_abonos_by_description() 