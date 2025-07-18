import logging
from logging.handlers import RotatingFileHandler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Configure logging
log_formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
log_file = 'backend.log'

# Set up a rotating file handler
file_handler = RotatingFileHandler(log_file, maxBytes=1024*1024*5, backupCount=2) # 5 MB per file, 2 backups
file_handler.setFormatter(log_formatter)
file_handler.setLevel(logging.INFO)

# Get the root logger
logger = logging.getLogger()
logger.setLevel(logging.INFO)
logger.addHandler(file_handler)

# Also log to console
console_handler = logging.StreamHandler()
console_handler.setFormatter(log_formatter)
logger.addHandler(console_handler)


# Set the environment variable for Google Application Credentials
# This MUST be done before any library that uses it is imported
# credentials_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'martamaria', 'credentials', 'credentials.json'))
# os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = credentials_path

# Load environment variables from the .env file in the martamaria directory
# dotenv_path = os.path.join(os.path.dirname(__file__), '..', '..', 'martamaria', '.env')
# load_dotenv(dotenv_path=dotenv_path)

from .database import engine, Base

# Import all routers with consistent aliases
from .routers.auth_router import router as auth_router
from .routers.users import router as users_router
from .routers.projects import router as projects_router
from .routers.ventas import router as ventas_router
from .routers.contabilidad import router as contabilidad_router
from .routers.miscelaneos import router as miscelaneos_router
from .routers.saldo_proveedores import router as saldo_proveedores_router
from .routers.estado_cuenta_proveedores import router as estado_cuenta_proveedores_router
from .routers.vendedores import router as vendedores_router
from .routers.proyeccion_ventas import router as proyeccion_ventas_router
from .routers.lineas_de_credito import router as lineas_de_credito_router
from .routers.pagos import router as pagos_router
from .routers.clientes import router as clientes_router
from .routers.payroll import router as payroll_router
from .routers.consultores import router as consultores_router
from .routers.costo_directo import router as costo_directo_router
from .routers.costo_x_vivienda import router as costo_x_vivienda_router
from .routers.estudios_permisos import router as estudios_permisos_router
from .routers.comisiones_ventas import router as comisiones_ventas_router
from .routers.pagos_tierra import router as pagos_tierra_router
from .routers.gastos_equipo import router as gastos_equipo_router
from .routers.tables import router as tables_router, marketing_router as marketing_summary_router
from .routers.marketing import router as marketing_router
from .routers.contabilidad_flujo_general import router as contabilidad_flujo_general_router
from .routers.marketing_projects import router as marketing_projects_router
from .routers.flujo_caja_maestro import router as flujo_caja_maestro_router
from .routers.admin import router as admin_router
from .routers.scenario_projects import router as scenario_projects_router
from .routers.project_credit_lines import router as project_credit_lines_router
from .routers.construction_quotes import router as construction_quotes_router
from .routers.takeoffs import router as takeoffs_router
from .routers.construction_tracking import router as construction_tracking_router
from .routers.bid_import import router as bid_import_router
from .routers.excel_upload import router as excel_upload_router
from .routers.integrations import router as integrations_router
# from .routers.marta import router as marta_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Financial Dashboard API",
    description="API for the financial dashboard application.",
    version="1.0.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include all routers correctly
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(projects_router)
app.include_router(ventas_router)
app.include_router(contabilidad_router)
app.include_router(miscelaneos_router)
app.include_router(saldo_proveedores_router)
app.include_router(estado_cuenta_proveedores_router)
app.include_router(vendedores_router)
app.include_router(proyeccion_ventas_router)
app.include_router(lineas_de_credito_router)
app.include_router(pagos_router)
app.include_router(clientes_router)
app.include_router(payroll_router, prefix="/api")
app.include_router(consultores_router, prefix="/api/consultores")
app.include_router(costo_directo_router, prefix="/api/costo-directo")
app.include_router(costo_x_vivienda_router)
app.include_router(estudios_permisos_router)
app.include_router(comisiones_ventas_router, prefix="/api/comisiones-ventas")
app.include_router(pagos_tierra_router)
app.include_router(gastos_equipo_router)
app.include_router(tables_router)
app.include_router(marketing_summary_router)
app.include_router(marketing_router, prefix="/api")
app.include_router(contabilidad_flujo_general_router, prefix="/api/contabilidad/flujo-general", tags=["Contabilidad Flujo General"])
app.include_router(marketing_projects_router)
app.include_router(flujo_caja_maestro_router)
app.include_router(admin_router)
app.include_router(scenario_projects_router)
app.include_router(project_credit_lines_router, prefix="/api", tags=["Project Credit Lines"])
app.include_router(construction_quotes_router, tags=["Construction Quotes"])
app.include_router(takeoffs_router, tags=["Construction Takeoffs"])
app.include_router(construction_tracking_router, tags=["Construction Project Tracking"])
app.include_router(bid_import_router, tags=["Bid Import"])
app.include_router(excel_upload_router, tags=["Excel Upload"])
app.include_router(integrations_router, tags=["Accounting Integrations"])
# app.include_router(marta_router, prefix="/api", tags=["AI Assistant"])


@app.get("/")
def read_root():
    return {"message": "Welcome to the Financial Dashboard API"}

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Backend is running"}