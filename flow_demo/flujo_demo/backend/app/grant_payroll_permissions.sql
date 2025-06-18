-- Grant permissions for all payroll tables
GRANT SELECT, INSERT, UPDATE, DELETE ON planilla_administracion TO arturodlg;
GRANT SELECT, INSERT, UPDATE, DELETE ON planilla_fija_construccion TO arturodlg;
GRANT SELECT, INSERT, UPDATE, DELETE ON planilla_gerencial TO arturodlg;
GRANT SELECT, INSERT, UPDATE, DELETE ON planilla_servicio_profesionales TO arturodlg;
GRANT SELECT, INSERT, UPDATE, DELETE ON planilla_variable_construccion TO arturodlg;

-- Grant schema usage if not already granted
GRANT USAGE ON SCHEMA public TO arturodlg; 