# 🚀 Flujo Demo - Sistema de Gestión Financiera

Sistema integral de gestión financiera para proyectos inmobiliarios en Panamá, con funcionalidades avanzadas de análisis de escenarios y modelado financiero.

## ✨ Funcionalidades Principales

### 📊 **Análisis de Proyectos**
- **Proyectos de Escenario**: Modelado financiero completo para desarrollo inmobiliario
- **Análisis de Sensibilidad**: Evaluación del impacto de variables clave
- **Simulación de Ventas**: Proyecciones con múltiples escenarios
- **Métricas Financieras**: NPV, TIR, periodo de recuperación

### 💰 **Gestión Operativa**
- **Flujo de Caja Maestro**: Control centralizado de ingresos y egresos
- **Líneas de Crédito**: Gestión de financiamiento y usos
- **Costos Directos**: Tracking detallado de gastos por proyecto
- **Marketing y Ventas**: Análisis consolidado de actividades comerciales

### 🏗️ **Arquitectura de Producción**
- **Frontend**: React + TypeScript + Chakra UI
- **Backend**: FastAPI + PostgreSQL + SQLAlchemy
- **Cloud**: Google Cloud Run + Cloud SQL
- **CI/CD**: Deployment automático con Cloud Build

## 🚀 **Deployment en Google Cloud**

La aplicación está configurada para deployment automático en Google Cloud Platform:

- **Cloud Run**: Servicios containerizados escalables
- **Cloud SQL**: Base de datos PostgreSQL gestionada
- **Cloud Build**: CI/CD automático desde GitHub
- **Container Registry**: Gestión de imágenes Docker

### 📋 **URLs de Producción**
- **Frontend**: [URL será generada después del deployment]
- **Backend API**: [URL será generada después del deployment]

## 🛠️ **Tecnologías**

### Frontend
- React 18 + TypeScript
- Chakra UI para componentes
- React Router para navegación
- Recharts para visualizaciones
- Axios para API calls

### Backend
- FastAPI framework
- SQLAlchemy ORM
- PostgreSQL database
- Pydantic para validación
- Alembic para migraciones

### DevOps
- Docker containerization
- Google Cloud Run
- Cloud Build CI/CD
- nginx para serving estático

## 📖 **Documentación**

Para información detallada sobre deployment y configuración, consulta:
- `DEPLOYMENT.md` - Guía completa de deployment
- `deployment-config.env` - Variables de entorno
- `cloudbuild.yaml` - Configuración de CI/CD

---

**Versión**: Production Ready  
**Última actualización**: Diciembre 2024  
**Estado**: ✅ Desplegado en Google Cloud

## Prerequisites

- Python 3.8 or higher
- PostgreSQL database
- Required Python packages (listed in requirements.txt)

## Setup

1. Install the required packages:
```bash
pip install -r requirements.txt
```

2. Ensure your PostgreSQL database is running and accessible

3. Update the database connection parameters in `excel_to_postgres.py` if needed:
```python
DB_PARAMS = {
    'dbname': 'grupo11flujo',
    'user': 'arturodlg',
    'password': 'arturodlg',
    'host': 'localhost',
    'port': '5432'
}
```

## Usage

1. Place your Excel file in the `Excel` directory with the name `Flujo de Caja Grupo 11 2025 Abril.xlsx`

2. Run the script:
```bash
python excel_to_postgres.py
```

The script will:
- Read the Excel file
- Create separate tables for each category
- Create aggregated views for each category
- Insert the data into the corresponding tables

## Output

For each category in the Excel file, the script creates:
- A table with the category name (lowercase, spaces replaced with underscores)
- A view named `{table_name}_aggregated` that contains the sum of all values for each column

## Notes

- The script assumes the Excel file has a sheet named 'Presupuesto Mercadeo Tanara'
- Categories are identified by all-caps text in the first column
- Empty cells are treated as 0 in the database
- All monetary values are stored as DECIMAL(15,2) 

## FastAPI Backend Setup

### Local Development

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Create a `.env` file in the project root with your database and secret settings:
   ```env
   DATABASE_URL=postgresql+psycopg2://username:password@localhost:5432/your_db
   SECRET_KEY=your_secret_key
   ALGORITHM=HS256
   ```
3. Run the FastAPI server:
   ```bash
   uvicorn app.main:app --reload
   ```

### Deploying to Google Cloud Run

1. Build the Docker image:
   ```bash
   docker build -t gcr.io/YOUR_PROJECT_ID/flujo-backend .
   ```
2. Push the image to Google Container Registry:
   ```bash
   docker push gcr.io/YOUR_PROJECT_ID/flujo-backend
   ```
3. Deploy to Cloud Run:
   ```bash
   gcloud run deploy flujo-backend \
     --image gcr.io/YOUR_PROJECT_ID/flujo-backend \
     --platform managed \
     --region YOUR_REGION \
     --set-env-vars DATABASE_URL=... --set-env-vars SECRET_KEY=... --set-env-vars ALGORITHM=HS256 \
     --allow-unauthenticated
   ```

- Replace `YOUR_PROJECT_ID` and `YOUR_REGION` with your Google Cloud project and region.
- Use Google Secret Manager for production secrets if possible. 