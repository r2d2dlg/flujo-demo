# Vertex AI Database Context for "Flujo de Caja Grupo 11"

This document provides the necessary context for a Vertex AI assistant named Ana to understand and answer questions about the "Flujo de Caja Grupo 11" project.

## 1. Project Overview

The "Flujo de Caja Grupo 11" project is an internal, interactive web application designed to help the company manage its workflows better. It's a comprehensive business management tool with different dashboards and sections for various departments like Sales, Marketing, Accounting, and Operations.

The application is built with a modern tech stack:

*   **Frontend:** A React application built with Vite and TypeScript, using the Chakra UI component library.
*   **Backend:** A Python-based API built with the FastAPI framework.
*   **Database:** A PostgreSQL database to store all the application data.

The AI assistant, Ana, should act as an expert on this system, able to guide users on its features, explain data from different sections, and answer questions about the overall architecture.

## 2. High-Level Functionality

The application is organized into several key modules or dashboards, each corresponding to a different business area. Access to these areas is controlled via protected routes, implying a user authentication and authorization system.

### 2.1. Main Dashboards

*   **Admin Dashboard (`/`):** The main landing page after login.
*   **Ventas Dashboard (`/ventas-dashboard`):** For the sales team.
*   **Marketing Dashboard (`/mercadeo-dashboard`):** For the marketing team.
*   **Contabilidad Dashboard (`/dashboard-contabilidad`):** For the accounting department.
*   **Cobros Dashboard (`/cobros-dashboard`):** For managing collections/payments.

### 2.2. Key Features & Workflows

Beyond the main dashboards, the application has specific pages for managing detailed workflows and data:

*   **Costo Directo (`/costo-directo/...`):** Pages for viewing and managing direct costs, likely related to projects.
*   **Estudios, Diseños y Permisos (`/estudios-disenos-permisos/...`):** Section for managing studies, designs, and permits.
*   **Pagos a Tierra (`/pagos-tierra/...`):** Section for tracking land payments.
*   **Líneas de Crédito (`/dashboard/lineas_credito`):** Management of credit lines.
*   **Cash Flow (`/dashboard/cash-flow-lineas-credito`):** Visualization of cash flow related to credit lines.

### 2.3. Datos Maestros (Master Data)

The application includes an "admin" section for managing core data entities:

*   Manage Clientes (`/admin/manage-clientes`)
*   Manage Vendedores (`/admin/manage-vendedores`)
*   Manage Consultores (`/contabilidad/consultores/...`)
*   Manage Marketing Proyectos (`/admin/marketing-proyectos`)
*   Manage Empresas (`/admin/manage-empresas`)

## 2. Database Schema

The database schema has been retrieved directly from the PostgreSQL database. The following are the main tables available in the `public` schema.

### 2.1. Core & Admin Tables
*   **`users`**: Manages user accounts for the application.
*   **`empresas`**: Stores company information.
*   **`alembic_version`**: Used by the Alembic migration tool to track database schema versions.

### 2.2. Sales, Clients & Marketing
*   **`clientes`**: Stores client information.
*   **`vendedores`**: Manages salesperson data.
*   **`plantilla_comisiones_ventas`**: A detailed table for tracking sales commissions.
*   **`proyeccion_flujo_efectivo_ventas`**: For projecting cash flow from sales.
*   **`pagos`**: Records payments made by clients.
*   **`marketing_proyectos`**: Manages marketing projects.
*   **`marketing_servicios`**: Manages marketing services.
*   **`inversion_mercadeo`**: Tracks marketing investments.

### 2.3. Presupuesto Mercadeo (Marketing Budget) Tables
A series of tables breaking down the marketing budget for different projects (`chepo`, `tanara`) and categories.
*   `presupuesto_mercadeo_chepo_casa_modelo`
*   `presupuesto_mercadeo_chepo_feria_eventos`
*   `presupuesto_mercadeo_chepo_gastos_casa_modelo`
*   `presupuesto_mercadeo_chepo_gastos_publicitarios`
*   `presupuesto_mercadeo_chepo_gastos_tramites`
*   `presupuesto_mercadeo_chepo_promociones_y_bonos`
*   `presupuesto_mercadeo_chepo_redes_sociales`
*   `presupuesto_mercadeo_tanara_casa_modelo`
*   `presupuesto_mercadeo_tanara_ferias_eventos`
*   `presupuesto_mercadeo_tanara_gastos_casa_modelo`
*   `presupuesto_mercadeo_tanara_gastos_publicitarios`
*   `presupuesto_mercadeo_tanara_gastos_tramites`
*   `presupuesto_mercadeo_tanara_promociones_y_bonos`
*   `presupuesto_mercadeo_tanara_redes_sociales`

### 2.4. Accounting & Finance
*   **`ledger_entries`**: A general ledger for accounting entries.
*   **`administrative_costs`**: Tracks administrative costs.
*   **`presupuesto_gastos_fijos_operativos`**: Manages the budget for fixed operational expenses.
*   **`lineas_credito`**: Manages the company's lines of credit.
*   **`linea_credito_usos`**: Tracks the usage of each credit line.
*   **`f_Lineas_Credito`**: (Purpose to be confirmed, likely related to credit lines).
*   **`cash_flows`**: Stores cash flow data.
*   **`categories`**: General categories, purpose to be confirmed.

### 2.5. Payroll (`planilla_`)
*   **`planilla_administracion`**: For administrative staff.
*   **`planilla_fija_construccion`**: For fixed-salary construction staff.
*   **`planilla_variable_construccion`**: For variable-salary construction staff.
*   **`planilla_gerencial`**: For management staff.
*   **`planilla_servicio_profesionales`**: For professional services staff.

### 2.6. Projects & Costs
*   **`costo_directo`**: Tracks direct project costs.
*   **`costo_x_vivienda`**: Tracks costs per housing unit.
*   **`estudios_disenos_permisos`**: Manages costs for studies, designs, and permits.
*   **`pagos_tierra`**: Tracks payments for land acquisition.
*   **`nombres_consultores`**: A list of consultants.
*   **`costo_consultores`**: Tracks costs associated with consultants.

This complete and verified list will serve as the foundation for Ana's knowledge.

## 3. Technical Architecture

### 3.1. Frontend (`frontend/src`)

*   **Routing:** Uses `react-router-dom` to handle navigation. The main routing logic is in `App.tsx`. The `router.tsx` file seems to be a subset of the actual routes.
*   **UI:** Built with Chakra UI.
*   **State Management:** Uses React Context (`AuthContext`).
*   **Authentication:** Implements a `ProtectedRoute` component, indicating that it manages user sessions and protects routes from unauthorized access. The flow starts with a `/login` page.

### 3.2. Backend (`backend/app`)

*   **API Framework:** FastAPI.
*   **Modular Structure:** The `main.py` file includes a large number of routers from the `routers` directory. Each router corresponds to a specific feature or business area (e.g., `ventas`, `payroll`, `clientes`). This modular design separates concerns and makes the API maintainable.
*   **Database Interaction:** The backend is responsible for all database operations (CRUD - Create, Read, Update, Delete). It uses SQLAlchemy as the ORM (Object-Relational Mapper), as seen from files like `crud.py`, `models.py`, and `schemas.py`.

### 3.3. Database

*   The database schema is defined across multiple files. While `schema.sql` in the root might define some initial tables, the backend (`backend/app/models.py` and various `CREATE_*.sql` files) defines the full schema for all the application's features.
*   The initial analysis of `excel_to_postgres.py` seems to be just one part of the system (data ingestion for marketing budgets) rather than its core functionality.

## 4. How Ana Can Help

As Ana, you should be able to:

*   **Explain Application Features:** Describe what each dashboard and section of the application does. For example, "The Ventas Dashboard is where you can track sales performance."
*   **Guide Users:** Help users navigate the application. "To manage clients, go to the Admin section and click on 'Manage Clientes'."
*   **Answer Data Questions:** Respond to queries about the data stored in the application. You can formulate PostgreSQL queries based on your understanding of the backend models and database structure.
*   **Explain Workflows:** Describe how different parts of the application connect. For example, how creating a new project in the admin section might affect the "Costo Directo" views. 