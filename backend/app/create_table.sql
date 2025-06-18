CREATE TABLE IF NOT EXISTS planilla_administracion (
    "NOMBRE" VARCHAR(255) PRIMARY KEY,
    "Horas" INTEGER NOT NULL,
    "Sal. Bruto" NUMERIC(10, 2) NOT NULL,
    "I.S.R." NUMERIC(10, 2),
    "Otros Desc." NUMERIC(10, 2)
); 