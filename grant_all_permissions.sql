-- This script grants all necessary CRUD permissions to the application user.
-- The user is assumed to be 'postgres' based on the default configuration.
-- If you use a different user, please replace '"postgres"' accordingly.

-- Grant permissions for the 'clientes' table
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.clientes TO "postgres";
GRANT USAGE, SELECT ON SEQUENCE public.clientes_id_seq TO "postgres";

-- Grant permissions for the 'lineas_credito' table
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.lineas_credito TO "postgres";
GRANT USAGE, SELECT ON SEQUENCE public.lineas_credito_id_seq TO "postgres";

-- Grant permissions for the 'linea_credito_usos' table
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.linea_credito_usos TO "postgres";
GRANT USAGE, SELECT ON SEQUENCE public.linea_credito_usos_id_seq TO "postgres";

-- Grant permissions for the 'pagos' table
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.pagos TO "postgres";
GRANT USAGE, SELECT ON SEQUENCE public.pagos_id_seq TO "postgres";

-- Grant permissions for other potentially related tables
-- Add any other tables your application interacts with here to be thorough.
-- Example: GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.another_table TO "postgres";
-- Example: GRANT USAGE, SELECT ON SEQUENCE public.another_table_id_seq TO "postgres";

-- Note: Double quotes are used around "postgres" because it can be a reserved keyword. 