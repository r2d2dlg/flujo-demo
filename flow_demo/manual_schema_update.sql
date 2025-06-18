-- Manual Schema Update for Grupo 11 Flujo
-- This script addresses issues with alembic migrations.

-- Add the 'pago_id' column to 'linea_credito_usos' if it doesn't already exist.
-- This is the primary goal of the migration we were trying to generate.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'linea_credito_usos' 
                   AND column_name = 'pago_id') THEN
        ALTER TABLE public.linea_credito_usos ADD COLUMN pago_id INTEGER;
        ALTER TABLE public.linea_credito_usos ADD CONSTRAINT fk_linea_credito_usos_pago_id FOREIGN KEY (pago_id) REFERENCES public.pagos(id) ON DELETE SET NULL;
        CREATE INDEX ix_linea_credito_usos_pago_id ON public.linea_credito_usos (pago_id);
    END IF;
END $$;

-- The following commands are taken from the migrations that were failing.
-- They create tables and views related to 'presupuesto_gastos_fijos'.
-- The DO $$ blocks prevent errors if these objects already exist.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'presupuesto_gastos_fijos_operativos') THEN
        CREATE TABLE public.presupuesto_gastos_fijos_operativos (
            id SERIAL PRIMARY KEY,
            "CONCEPTO" VARCHAR(255) NOT NULL,
            "ENERO" NUMERIC(15, 2) NOT NULL DEFAULT 0,
            "FEBRERO" NUMERIC(15, 2) NOT NULL DEFAULT 0,
            "MARZO" NUMERIC(15, 2) NOT NULL DEFAULT 0,
            "ABRIL" NUMERIC(15, 2) NOT NULL DEFAULT 0,
            "MAYO" NUMERIC(15, 2) NOT NULL DEFAULT 0,
            "JUNIO" NUMERIC(15, 2) NOT NULL DEFAULT 0,
            "JULIO" NUMERIC(15, 2) NOT NULL DEFAULT 0,
            "AGOSTO" NUMERIC(15, 2) NOT NULL DEFAULT 0,
            "SEPTIEMBRE" NUMERIC(15, 2) NOT NULL DEFAULT 0,
            "OCTUBRE" NUMERIC(15, 2) NOT NULL DEFAULT 0,
            "NOVIEMBRE" NUMERIC(15, 2) NOT NULL DEFAULT 0,
            "DICIEMBRE" NUMERIC(15, 2) NOT NULL DEFAULT 0,
            created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
            updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'v_presupuesto_gastos_fijos_operativos') THEN
        CREATE VIEW public.v_presupuesto_gastos_fijos_operativos AS
        SELECT
            "CONCEPTO",
            "ENERO",
            "FEBRERO",
            "MARZO",
            "ABRIL",
            "MAYO",
            "JUNIO",
            "JULIO",
            "AGOSTO",
            "SEPTIEMBRE",
            "OCTUBRE",
            "NOVIEMBRE",
            "DICIEMBRE",
            (
                "ENERO" + "FEBRERO" + "MARZO" + "ABRIL" + "MAYO" + "JUNIO" +
                "JULIO" + "AGOSTO" + "SEPTIEMBRE" + "OCTUBRE" + "NOVIEMBRE" + "DICIEMBRE"
            ) AS "TOTAL"
        FROM presupuesto_gastos_fijos_operativos;
    END IF;
END $$;

-- After running this script, you may want to stamp alembic to the latest version
-- to prevent it from trying to run these migrations again.
-- Example: alembic stamp head 