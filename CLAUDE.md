# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Flujo Demo is a comprehensive financial management system for real estate projects in Panama. It combines scenario modeling, cash flow analysis, and operational management for construction and development companies.

### Core Functionality
- **Scenario Projects**: Complete financial modeling for real estate development
- **Cash Flow Management**: Centralized income and expense control through "Flujo de Caja Maestro"
- **Credit Lines**: Financing management and usage tracking
- **Sales Projections**: Multi-scenario sales simulations
- **Construction Tracking**: Project management and cost monitoring
- **Marketing Budget**: Campaign analysis and budget allocation

## Architecture

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript, Vite build system
- **UI Library**: Chakra UI as primary component library
- **State Management**: React Context for authentication
- **Routing**: React Router DOM v7
- **API Client**: Axios for HTTP requests
- **Charts**: Recharts for data visualization

### Backend (FastAPI + Python)
- **Framework**: FastAPI with SQLAlchemy ORM
- **Database**: PostgreSQL with Alembic migrations
- **Authentication**: JWT tokens with python-jose
- **AI Integration**: Langchain + Google Vertex AI (Marta assistant)
- **File Processing**: pandas + openpyxl for Excel operations

### Database Design
- Dynamic monthly columns in budget tables (e.g., `amount_2024_01`, `amount_2024_02`)
- Scenario-based project modeling with financial projections
- Complex view system for consolidated reporting
- Multi-project financial tracking

## Common Development Commands

### Frontend Development
```bash
cd frontend
npm install                    # Install dependencies
npm run dev                   # Development server (localhost:5173)
npm run build                 # Production build
npm run build-with-types      # Build with TypeScript compilation
npm run lint                  # ESLint code checking
npm run preview               # Preview production build
```

### Backend Development
```bash
cd backend
pip install -r requirements.txt    # Install dependencies
uvicorn app.main:app --reload      # Development server (localhost:8000)
alembic upgrade head               # Run database migrations
alembic revision --autogenerate -m "description"  # Create new migration
```

### Database Operations
```bash
# Run SQL migrations
alembic upgrade head

# Create new migration
cd backend
alembic revision --autogenerate -m "migration description"

# Reset database (development only)
alembic downgrade base
alembic upgrade head
```

### Testing and Quality
```bash
# Frontend
cd frontend
npm run lint                  # Check TypeScript/React code

# Backend - No automated tests currently configured
# Manual testing via FastAPI docs at /docs endpoint
```

## Deployment

### Local Development
1. Start PostgreSQL database
2. Set environment variables in backend/.env:
   ```
   DATABASE_URL=postgresql+psycopg2://user:pass@localhost:5432/dbname
   SECRET_KEY=your_secret_key
   ALGORITHM=HS256
   ```
3. Run backend: `cd backend && uvicorn app.main:app --reload`
4. Run frontend: `cd frontend && npm run dev`

### Production (Google Cloud)
- **Platform**: Google Cloud Run + Cloud SQL PostgreSQL
- **CI/CD**: Automated deployment via Cloud Build (`cloudbuild.yaml`)
- **Containers**: Docker images stored in Google Container Registry
- **Environment**: Production URLs configured in build process

## Code Conventions

### Frontend (from .cursor/rules)
- **Components**: PascalCase.tsx (e.g., `DataTable.tsx`)
- **Hooks**: camelCase.ts (e.g., `useMarketingConsolidado.ts`)
- **Types**: PascalCase.types.ts
- **Import Order**: React → External → Internal → Relative
- **TypeScript**: Strict mode enabled with full type checking

### Backend
- **Models**: PascalCase classes (e.g., `class User`, `class ScenarioProject`)
- **Files**: snake_case.py (e.g., `crud_sales_projections.py`)
- **Routes**: snake_case endpoints (e.g., `/api/scenario-projects`)
- **Type Hints**: Required for all function parameters and returns
- **Docstrings**: Required for all public functions and classes

### Database
- **Tables**: snake_case naming (e.g., `scenario_projects`, `sales_projections`)
- **Columns**: snake_case with descriptive names
- **Dynamic Columns**: Monthly amounts as `amount_YYYY_MM` (e.g., `amount_2024_01`)

## Key File Locations

### Frontend Structure
- `src/pages/`: Main application pages
- `src/components/`: Reusable UI components
- `src/api/`: API client functions
- `src/types/`: TypeScript type definitions
- `src/utils/`: Utility functions and formatters

### Backend Structure
- `app/main.py`: FastAPI application entry point
- `app/models.py`: SQLAlchemy database models
- `app/schemas.py`: Pydantic request/response schemas
- `app/routers/`: API endpoint handlers organized by feature
- `app/crud_*.py`: Database operations for each model
- `alembic/versions/`: Database migration files

### Configuration
- `backend/requirements.txt`: Python dependencies
- `frontend/package.json`: Node.js dependencies
- `cloudbuild.yaml`: Google Cloud deployment configuration
- `DEPLOYMENT.md`: Detailed deployment instructions

## Database Schema Notes

### Dynamic Monthly Columns
Many tables use dynamic monthly columns for budget tracking:
- Pattern: `amount_YYYY_MM` (e.g., `amount_2024_01`, `amount_2024_02`)
- These columns are created/queried dynamically, not defined in ORM models
- Use SQL queries for operations involving these columns

### Key Models
- `ScenarioProject`: Financial modeling scenarios
- `ProjectUnit`: Individual units within projects
- `SalesProjection`: Sales forecasting data
- `FlujoCajaMaestro`: Master cash flow entries
- `LineaCredito`: Credit line management

### Views and Aggregations
The system heavily uses PostgreSQL views for:
- Consolidated project reporting
- Monthly budget summaries
- Cross-project financial analysis
- Commission calculations

## AI Assistant Integration

The system includes "Marta" - an AI assistant powered by Google Vertex AI:
- Located in `app/routers/marta.py` (currently commented out)
- Uses Langchain for document processing and RAG
- Integrates with project financial data for analysis
- Vector embeddings with FAISS for document search