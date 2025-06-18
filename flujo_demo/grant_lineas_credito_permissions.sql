-- Grant necessary permissions for the lineas_credito feature
-- This assumes the application user is 'postgres', as per the default in database.py

-- Grant permissions on the lineas_credito table
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.lineas_credito TO "postgres";

-- Grant usage on the sequence for the primary key if it's not automatically handled
-- The sequence name is typically <table_name>_<id_column>_seq
GRANT USAGE, SELECT ON SEQUENCE public.lineas_credito_id_seq TO "postgres";

-- Grant permissions on the linea_credito_usos table
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.linea_credito_usos TO "postgres";

-- Grant usage on the sequence for its primary key
GRANT USAGE, SELECT ON SEQUENCE public.linea_credito_usos_id_seq TO "postgres";

-- If you are using a different user, replace '"postgres"' with your application's database user, ensuring it is quoted. 