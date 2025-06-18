import os
import shutil
import fileinput

# --- CONFIGURATION ---
SOURCE_DIR = "F:\projects\Grupo_11_Flujo"
DEST_DIR = "flujo_demo"
NEW_DB_URL = "postgresql://arturodlg:Oc%d}c8lIm:9c2\\S@34.174.189.231:5432/demoflujo"

# 1. Copy the project folder
if os.path.exists(DEST_DIR):
    print(f"Destination folder {DEST_DIR} already exists. Aborting.")
    exit(1)
shutil.copytree(SOURCE_DIR, DEST_DIR)
print(f"Copied {SOURCE_DIR} to {DEST_DIR}")

# 2. Remove .git, backups, and data files
for root, dirs, files in os.walk(DEST_DIR):
    if '.git' in dirs:
        shutil.rmtree(os.path.join(root, '.git'))
        print("Removed .git folder")
    if 'backups' in dirs:
        shutil.rmtree(os.path.join(root, 'backups'))
        print("Removed backups folder")
    if 'tableexport' in dirs:
        shutil.rmtree(os.path.join(root, 'tableexport'))
        print("Removed tableexport folder")
    if 'Excel' in dirs:
        shutil.rmtree(os.path.join(root, 'Excel'))
        print("Removed Excel folder")
    # Add more folders as needed

# 3. Update .env and alembic.ini
def update_file(filepath, old, new):
    if not os.path.exists(filepath):
        return
    with fileinput.FileInput(filepath, inplace=True) as file:
        for line in file:
            print(line.replace(old, new), end='')

# Update .env
env_path = os.path.join(DEST_DIR, ".env")
update_file(env_path, "grupo11flujo", "demoflujo")
update_file(env_path, "Grupo_11_Flujo", "Flujo_Demo")

# Update alembic.ini
alembic_ini_path = os.path.join(DEST_DIR, "backend", "alembic.ini")
update_file(alembic_ini_path, "grupo11flujo", "demoflujo")
update_file(alembic_ini_path, "Grupo_11_Flujo", "Flujo_Demo")
update_file(alembic_ini_path, "sqlalchemy.url =", f"sqlalchemy.url = {NEW_DB_URL}")

print("Updated .env and alembic.ini for new database.")

# 4. Run Alembic migrations
print("To initialize the new database, run:")
print(f"cd {DEST_DIR} && alembic -c backend/alembic.ini upgrade head")