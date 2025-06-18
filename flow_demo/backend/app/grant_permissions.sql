-- Grant all permissions on planilla_administracion table
GRANT SELECT, INSERT, UPDATE, DELETE ON planilla_administracion TO arturodlg;

-- If there are sequences associated with the table (for auto-incrementing IDs), grant usage
-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO arturodlg;

-- Grant permissions to use the schema
GRANT USAGE ON SCHEMA public TO arturodlg; 