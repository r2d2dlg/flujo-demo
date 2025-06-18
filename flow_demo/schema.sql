-- Drop existing tables if they exist
DROP TABLE IF EXISTS gastos_fijos_operativos CASCADE;
DROP TABLE IF EXISTS empresas CASCADE;
DROP VIEW IF EXISTS vista_gastos_totales CASCADE;

-- Create empresas table (stores company information)
CREATE TABLE empresas (
    id SERIAL PRIMARY KEY,
    nombre_empresa VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create gastos_fijos_operativos table (stores fixed operational expenses)
CREATE TABLE gastos_fijos_operativos (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER REFERENCES empresas(id) NOT NULL,
    concepto VARCHAR(255) NOT NULL,
    detalle_pgo TEXT,
    enero NUMERIC(15,2),
    febrero NUMERIC(15,2),
    marzo NUMERIC(15,2),
    abril NUMERIC(15,2),
    mayo NUMERIC(15,2),
    junio NUMERIC(15,2),
    julio NUMERIC(15,2),
    agosto NUMERIC(15,2),
    septiembre NUMERIC(15,2),
    octubre NUMERIC(15,2),
    noviembre NUMERIC(15,2),
    diciembre NUMERIC(15,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create view for total expenses
CREATE VIEW vista_gastos_totales AS
SELECT 
    e.nombre_empresa,
    g.concepto,
    g.detalle_pgo,
    g.enero,
    g.febrero,
    g.marzo,
    g.abril,
    g.mayo,
    g.junio,
    g.julio,
    g.agosto,
    g.septiembre,
    g.octubre,
    g.noviembre,
    g.diciembre,
    COALESCE(g.enero, 0) + 
    COALESCE(g.febrero, 0) + 
    COALESCE(g.marzo, 0) + 
    COALESCE(g.abril, 0) + 
    COALESCE(g.mayo, 0) + 
    COALESCE(g.junio, 0) + 
    COALESCE(g.julio, 0) + 
    COALESCE(g.agosto, 0) + 
    COALESCE(g.septiembre, 0) + 
    COALESCE(g.octubre, 0) + 
    COALESCE(g.noviembre, 0) + 
    COALESCE(g.diciembre, 0) AS total
FROM 
    gastos_fijos_operativos g
JOIN 
    empresas e ON g.empresa_id = e.id;

-- Create indexes for better performance
CREATE INDEX idx_gastos_empresa_id ON gastos_fijos_operativos(empresa_id);
CREATE INDEX idx_gastos_concepto ON gastos_fijos_operativos(concepto); 