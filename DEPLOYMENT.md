# 🚀 Deployment Guide - Google Cloud

Este documento te guía paso a paso para desplegar la aplicación Flujo Demo en Google Cloud Platform.

## 📋 Requisitos Previos

### 1. Instalación de Google Cloud CLI

**Windows:**
1. Descarga el instalador: https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe
2. Ejecuta el instalador y sigue las instrucciones
3. Reinicia la terminal/PowerShell

**macOS:**
```bash
brew install --cask google-cloud-sdk
```

**Linux:**
```bash
curl https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-cli-latest-linux-x86_64.tar.gz | tar -xz
./google-cloud-sdk/install.sh
```

### 2. Configuración Inicial

```bash
# Inicializar gcloud
gcloud init

# Autenticarse
gcloud auth login

# Establecer el proyecto
gcloud config set project hazel-pillar-451015-q8
```

## 🏗️ Arquitectura del Deployment

La aplicación se desplegará con:

- **Frontend**: React app en Cloud Run (contenedor nginx)
- **Backend**: FastAPI en Cloud Run 
- **Base de Datos**: Cloud SQL (PostgreSQL)
- **CI/CD**: Cloud Build
- **Contenedores**: Container Registry

## 🚀 Deployment Automático

### Opción 1: Script Automático (Recomendado)

```bash
# Hacer el script ejecutable
chmod +x deploy.sh

# Ejecutar deployment
./deploy.sh
```

### Opción 2: Deployment Manual

#### Paso 1: Habilitar APIs
```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable sql-component.googleapis.com
gcloud services enable sqladmin.googleapis.com
```

#### Paso 2: Crear Cloud SQL
```bash
# Crear instancia de base de datos
gcloud sql instances create flujo-db \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region=us-central1 \
    --storage-auto-increase

# Crear base de datos
gcloud sql databases create flujo_demo --instance=flujo-db

# Crear usuario
gcloud sql users create flujo_user --instance=flujo-db
gcloud sql users set-password flujo_user --instance=flujo-db --password=YOUR_SECURE_PASSWORD
```

#### Paso 3: Build y Deploy
```bash
# Deploy usando Cloud Build
gcloud builds submit --config cloudbuild.yaml
```

## 🔧 Configuración Post-Deployment

### 1. Variables de Entorno

Actualiza las variables en Cloud Run:

**Backend:**
```bash
gcloud run services update flujo-backend \
    --set-env-vars="DATABASE_URL=postgresql://flujo_user:PASSWORD@/flujo_demo?host=/cloudsql/hazel-pillar-451015-q8:us-central1:flujo-db" \
    --set-env-vars="SECRET_KEY=tu-clave-secreta-de-32-caracteres" \
    --set-env-vars="ENVIRONMENT=production" \
    --region=us-central1
```

### 2. Configurar Base de Datos

```bash
# Conectar a la base de datos
gcloud sql connect flujo-db --user=flujo_user --database=flujo_demo

# Ejecutar migraciones (dentro de la conexión SQL)
# Aquí ejecutarías tus scripts de migración
```

### 3. Configurar CORS (Backend)

Asegúrate de que el backend permita requests desde el frontend:

```python
# En app/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://flujo-frontend-*.run.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 🔒 Configuración de Seguridad

### 1. Generar Clave Secreta
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 2. Configurar IAM
```bash
# Crear service account para la aplicación
gcloud iam service-accounts create flujo-app \
    --display-name="Flujo Application Service Account"

# Asignar permisos mínimos necesarios
gcloud projects add-iam-policy-binding hazel-pillar-451015-q8 \
    --member="serviceAccount:flujo-app@hazel-pillar-451015-q8.iam.gserviceaccount.com" \
    --role="roles/cloudsql.client"
```

### 3. Configurar Cloud SQL Proxy (si es necesario)
```bash
# Para conexiones privadas
gcloud sql instances patch flujo-db --no-assign-ip
```

## 📊 Monitoreo y Logs

### Ver Logs
```bash
# Logs del backend
gcloud logs tail "resource.type=cloud_run_revision AND resource.labels.service_name=flujo-backend"

# Logs del frontend  
gcloud logs tail "resource.type=cloud_run_revision AND resource.labels.service_name=flujo-frontend"
```

### Métricas
- Ve a Cloud Console > Cloud Run > [tu servicio] > Metrics

## 🔄 CI/CD Automático

### Configurar Trigger de Cloud Build

1. Ve a Cloud Console > Cloud Build > Triggers
2. Conecta tu repositorio de GitHub
3. Crea un trigger que use `cloudbuild.yaml`

### GitHub Actions (Alternativa)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Google Cloud
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: google-github-actions/setup-gcloud@v0
        with:
          service_account_key: ${{ secrets.GCP_SA_KEY }}
          project_id: hazel-pillar-451015-q8
      - run: gcloud builds submit --config cloudbuild.yaml
```

## 🐛 Troubleshooting

### Problemas Comunes

**Error: "Service account does not exist"**
```bash
gcloud iam service-accounts create cloudbuild
```

**Error: "Permission denied"**
```bash
gcloud auth application-default login
```

**Error de conexión a la base de datos**
- Verifica que Cloud SQL esté en la misma región
- Confirma las credenciales de la base de datos
- Revisa la configuración del Cloud SQL Proxy

**Frontend no puede conectar al backend**
- Verifica la configuración de CORS
- Confirma que las URLs están correctas
- Revisa los logs de Cloud Run

## 📞 Soporte

- **Google Cloud Console**: https://console.cloud.google.com
- **Documentación**: https://cloud.google.com/docs
- **Soporte**: https://cloud.google.com/support

## 💰 Estimación de Costos

Con tráfico bajo-medio:
- **Cloud Run**: ~$5-20/mes
- **Cloud SQL**: ~$10-25/mes  
- **Build & Storage**: ~$2-5/mes
- **Total estimado**: ~$17-50/mes

Para producción, considera:
- Aumentar tier de Cloud SQL
- Configurar auto-scaling
- Implementar CDN para archivos estáticos 