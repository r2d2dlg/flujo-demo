from sqlalchemy import create_engine, text

engine = create_engine('postgresql://postgres:40MGDY9l0~hxJ`%u@34.174.189.231:5432/grupo11flujo')

# List of dictionaries for each row (only relevant columns)
data = [
    {"detalle_pgo": "Alquiler oficina Adm.", "corriente": 1300.00, "marzo": None, "febrero": None, "enero": None, "mas_de_120": 1300.00, "monto_fijo": None, "fecha_venc": "13 c/mes", "no_cliente": "Praderas", "forma_pgo": "Ck Cristhian Beltran o Bleysi Moran"},
    {"detalle_pgo": "Internet/Telef. Adm.", "corriente": 0.00, "marzo": None, "febrero": None, "enero": None, "mas_de_120": None, "monto_fijo": None, "fecha_venc": "14 c/mes", "no_cliente": "92591296", "forma_pgo": "ACH Plataforma"},
    {"detalle_pgo": "Internet/Telef. Adm.", "corriente": 0.00, "marzo": 257.04, "febrero": None, "enero": None, "mas_de_120": None, "monto_fijo": None, "fecha_venc": "12/cmes", "no_cliente": "33-125691-0000-7", "forma_pgo": "Ck pago en efectivo"},
    {"detalle_pgo": "Coorporativo gerencia/vtas.", "corriente": 0.00, "marzo": 2006.97, "febrero": None, "enero": None, "mas_de_120": None, "monto_fijo": None, "fecha_venc": "4 c/mes", "no_cliente": "33-533562-0000", "forma_pgo": "Ck pago en efectivo"},
    {"detalle_pgo": "Luz Obra Villas", "corriente": 0.00, "marzo": None, "febrero": None, "enero": None, "mas_de_120": None, "monto_fijo": None, "fecha_venc": "26 c/mes", "no_cliente": "21218185", "forma_pgo": "ACH Plataforma"},
    {"detalle_pgo": "Luz Obra Villas", "corriente": 0.00, "marzo": None, "febrero": -25.72, "enero": None, "mas_de_120": None, "monto_fijo": None, "fecha_venc": None, "no_cliente": "21350567", "forma_pgo": "ACH Plataforma"},
    {"detalle_pgo": "Luz Obra Rivieras", "corriente": 0.00, "marzo": None, "febrero": None, "enero": None, "mas_de_120": None, "monto_fijo": None, "fecha_venc": None, "no_cliente": "21359853", "forma_pgo": "ACH Plataforma"},
    {"detalle_pgo": "Casa Modelo Villas", "corriente": 0.00, "marzo": None, "febrero": -29.82, "enero": None, "mas_de_120": None, "monto_fijo": None, "fecha_venc": "24c/mes", "no_cliente": "21295830", "forma_pgo": "ACH Plataforma"},
    {"detalle_pgo": "Alquiler serv electrico Riv. Este Cattan", "corriente": 0.00, "marzo": None, "febrero": None, "enero": None, "mas_de_120": None, "monto_fijo": None, "fecha_venc": "26 c/mes", "no_cliente": "525094", "forma_pgo": "ACH Plataforma"},
    {"detalle_pgo": "Administracion", "corriente": 0.00, "marzo": None, "febrero": None, "enero": None, "mas_de_120": None, "monto_fijo": None, "fecha_venc": "13 c/mes", "no_cliente": "5008301003", "forma_pgo": "ACH Plataforma"},
    {"detalle_pgo": "Letra Vehiculo Lexus Hibrido", "corriente": 1034.14, "marzo": None, "febrero": None, "enero": 150.00, "mas_de_120": 1034.14, "monto_fijo": None, "fecha_venc": "25 c/mes", "no_cliente": "1900079593", "forma_pgo": "Aliado Leasing, S.A., banco aliado, cte., 0015100053366"},
    {"detalle_pgo": "Letra Vehiculo Lexus Platinium", "corriente": 1460.68, "marzo": None, "febrero": None, "enero": None, "mas_de_120": 1460.68, "monto_fijo": None, "fecha_venc": "23 c/mes", "no_cliente": "1900092590", "forma_pgo": "Aliado Leasing, S.A., banco aliado, cte., 0015100053366"},
    {"detalle_pgo": "Letra Vehiculo Nissan Rojo", "corriente": 437.34, "marzo": None, "febrero": None, "enero": None, "mas_de_120": 437.34, "monto_fijo": None, "fecha_venc": "23 c/mes", "no_cliente": "1900092603", "forma_pgo": "Aliado Leasing, S.A., banco aliado, cte., 0015100053366"},
    {"detalle_pgo": "Viatico Mensual", "corriente": 0.00, "marzo": None, "febrero": None, "enero": None, "mas_de_120": 130.00, "monto_fijo": None, "fecha_venc": "Mensual", "no_cliente": None, "forma_pgo": "Bleysi Moran, bco. gral, ahorro, 0472992596039"},
    {"detalle_pgo": "Serv. Prof. Cont. G. Leg.", "corriente": 0.00, "marzo": None, "febrero": 4325.00, "enero": None, "mas_de_120": 4300.00, "monto_fijo": None, "fecha_venc": "Mensual", "no_cliente": None, "forma_pgo": "Rosa Esturain, bco. gral, ahorro, 0420011088248"},
    {"detalle_pgo": "Serv. Prof. Cont. G. Leg.", "corriente": 0.00, "marzo": None, "febrero": 4325.00, "enero": None, "mas_de_120": 1400.00, "monto_fijo": None, "fecha_venc": "Mensual", "no_cliente": None, "forma_pgo": "Rosa Esturain, bco. gral, ahorro, 0420011088248"},
    {"detalle_pgo": "Serv. Prof. Cont. G. Leg.", "corriente": 0.00, "marzo": None, "febrero": 850.00, "enero": None, "mas_de_120": None, "monto_fijo": None, "fecha_venc": "Honorarios", "no_cliente": None, "forma_pgo": "Rosa Esturain, bco. gral, ahorro, 0420011088248"},
    {"detalle_pgo": "LE servidor, chat bot, whatsapp, CRM", "corriente": 749.00, "marzo": None, "febrero": None, "enero": None, "mas_de_120": 749.00, "monto_fijo": None, "fecha_venc": "Mensual", "no_cliente": None, "forma_pgo": "Oscar Hernandez, Banistmo, ahorro, 0105938030"},
    {"detalle_pgo": "Google Workspace dominio correos", "corriente": 440.00, "marzo": None, "febrero": None, "enero": None, "mas_de_120": 396.00, "monto_fijo": None, "fecha_venc": "Mensual", "no_cliente": None, "forma_pgo": "Elo Systems, bco. gral., ahorro, 0049130003731"},
    {"detalle_pgo": "Alquiler dominio correo impresora", "corriente": 0.00, "marzo": None, "febrero": None, "enero": None, "mas_de_120": 10.00, "monto_fijo": None, "fecha_venc": "Mensual", "no_cliente": None, "forma_pgo": "Pablo Perez, bco gral, ahorro, 0428014588244"},
    {"detalle_pgo": "Manejo de Redes, campañas, diseñoRiuPO 11", "corriente": 950.00, "marzo": None, "febrero": None, "enero": None, "mas_de_120": 750.00, "monto_fijo": None, "fecha_venc": "Mensual", "no_cliente": None, "forma_pgo": "Angel Cedillo, bco gral, ahorro, 0472982130819"},
    {"detalle_pgo": "Manejo de Redes, campañas, diseño Eleven", "corriente": 800.00, "marzo": None, "febrero": None, "enero": None, "mas_de_120": 0.00, "monto_fijo": None, "fecha_venc": "Mensual", "no_cliente": None, "forma_pgo": "Angel Cedillo, bco gral, ahorro, 0472982130819"},
    {"detalle_pgo": "Agua Obra", "corriente": 17.80, "marzo": None, "febrero": None, "enero": None, "mas_de_120": 17.80, "monto_fijo": None, "fecha_venc": "Mensual", "no_cliente": "887835", "forma_pgo": "pago efectivo agencia IDAAN chepo"},
    {"detalle_pgo": "Impuestos serv. Imec", "corriente": 25.00, "marzo": 26.62, "febrero": 26.84, "enero": 27.25, "mas_de_120": 1795.17, "monto_fijo": 0.00, "fecha_venc": "Mensual", "no_cliente": "02-2015-8887", "forma_pgo": "pendiente arreglo de pago municipio"},
    {"detalle_pgo": "Impuestos Praderas", "corriente": 25.00, "marzo": 27.00, "febrero": 32.67, "enero": 32.94, "mas_de_120": 106.48, "monto_fijo": 25.00, "fecha_venc": "Mensual", "no_cliente": "02-2019-2287", "forma_pgo": "pago TC plataforma municipio"},
    {"detalle_pgo": "Impuestos Rivieras de la Providencia", "corriente": 27.00, "marzo": 27.00, "febrero": 27.00, "enero": None, "mas_de_120": 27.00, "monto_fijo": None, "fecha_venc": "Mensual", "no_cliente": None, "forma_pgo": "pendiente arreglo de pago municipio"},
    {"detalle_pgo": "Impuestos Inv. Villas del Este", "corriente": 27.00, "marzo": 27.00, "febrero": 27.00, "enero": None, "mas_de_120": 81.00, "monto_fijo": None, "fecha_venc": "Mensual", "no_cliente": None, "forma_pgo": "pago TC plataforma municipio"},
    {"detalle_pgo": "Impresiones y Scaners", "corriente": 0.00, "marzo": 0.00, "febrero": 0.00, "enero": 0.00, "mas_de_120": 3449.18, "monto_fijo": None, "fecha_venc": "Consumo", "no_cliente": None, "forma_pgo": "Triconsa, bco. general, corriente, 0317010185332"},
    {"detalle_pgo": "Impresora", "corriente": 106.20, "marzo": 106.20, "febrero": 106.20, "enero": None, "mas_de_120": 106.90, "monto_fijo": None, "fecha_venc": "Mensual", "no_cliente": None, "forma_pgo": "Digitaliza, S.A., global bank, corriente, 4510121884"},
    {"detalle_pgo": "Impresiones y copias", "corriente": 69.84, "marzo": 62.26, "febrero": 62.26, "enero": None, "mas_de_120": None, "monto_fijo": None, "fecha_venc": "Mensual", "no_cliente": None, "forma_pgo": "CDP Digital, bco gral, corriente, 0395010400920"},
    {"detalle_pgo": "Proyecto Sta. Rosa", "corriente": 320.00, "marzo": None, "febrero": None, "enero": None, "mas_de_120": None, "monto_fijo": None, "fecha_venc": "Mensual", "no_cliente": None, "forma_pgo": "Ana Cardenas, bco. gral, ahorro, 0439575129846"},
    {"detalle_pgo": "Deducciones imec", "corriente": 1156.59, "marzo": None, "febrero": None, "enero": None, "mas_de_120": None, "monto_fijo": None, "fecha_venc": "Mensual", "no_cliente": "87-370-10437", "forma_pgo": "Ck Certificado Caja de Seguro Social Panama"},
    {"detalle_pgo": "Deducciones Praderas", "corriente": 1540.64, "marzo": None, "febrero": None, "enero": None, "mas_de_120": None, "monto_fijo": None, "fecha_venc": "Mensual", "no_cliente": "87-640-12335", "forma_pgo": "Ck Certificado Caja de Seguro Social Panama"},
    {"detalle_pgo": "Planilla Imec y Serv. Profesionales", "corriente": 6111.84, "marzo": None, "febrero": None, "enero": None, "mas_de_120": None, "monto_fijo": None, "fecha_venc": "05-20 c/mes", "no_cliente": None, "forma_pgo": "ACHS"},
    {"detalle_pgo": "Planilla Imec y Serv. Profesionales", "corriente": 20202.76, "marzo": None, "febrero": None, "enero": None, "mas_de_120": None, "monto_fijo": None, "fecha_venc": "05-20 c/mes", "no_cliente": None, "forma_pgo": "ACHS"},
    {"detalle_pgo": "Fabreka Delgado, Noriega", "corriente": 22000.00, "marzo": None, "febrero": None, "enero": None, "mas_de_120": 14000.00, "monto_fijo": None, "fecha_venc": "05-20 c/mes", "no_cliente": None, "forma_pgo": "ACHS"},
    {"detalle_pgo": "Praderas y Serv. Profesionales", "corriente": 17415.12, "marzo": None, "febrero": None, "enero": None, "mas_de_120": None, "monto_fijo": None, "fecha_venc": "05-20 c/mes", "no_cliente": None, "forma_pgo": "ACHS"},
    {"detalle_pgo": "", "corriente": None, "marzo": None, "febrero": None, "enero": None, "mas_de_120": 3000.00, "monto_fijo": None, "fecha_venc": None, "no_cliente": None, "forma_pgo": None},
    {"detalle_pgo": "", "corriente": None, "marzo": None, "febrero": None, "enero": None, "mas_de_120": 175.55, "monto_fijo": None, "fecha_venc": None, "no_cliente": None, "forma_pgo": None},
    {"detalle_pgo": "", "corriente": None, "marzo": None, "febrero": None, "enero": None, "mas_de_120": 100.00, "monto_fijo": None, "fecha_venc": None, "no_cliente": None, "forma_pgo": None},
    {"detalle_pgo": "", "corriente": None, "marzo": None, "febrero": None, "enero": None, "mas_de_120": 270.00, "monto_fijo": None, "fecha_venc": None, "no_cliente": None, "forma_pgo": None},
    {"detalle_pgo": "Utiles de oficina", "corriente": None, "marzo": None, "febrero": 162.86, "enero": None, "mas_de_120": None, "monto_fijo": None, "fecha_venc": None, "no_cliente": None, "forma_pgo": "LIEA, S.A., bco. general, ahorros, 0497984443229"},
    {"detalle_pgo": "Servicio seguridad proyecto", "corriente": 2707.10, "marzo": 2621.50, "febrero": 2621.50, "enero": 2621.50, "mas_de_120": 1658.58, "monto_fijo": None, "fecha_venc": None, "no_cliente": None, "forma_pgo": "Extreme Security, banistmo, corriente, 0001010223399"},
]

insert_sql = text("""
INSERT INTO presupuesto_gastos_fijos_operativos (
    detalle_pgo, corriente, marzo, febrero, enero, mas_de_120, monto_fijo, fecha_venc, no_cliente, forma_pgo
) VALUES (
    :detalle_pgo, :corriente, :marzo, :febrero, :enero, :mas_de_120, :monto_fijo, :fecha_venc, :no_cliente, :forma_pgo
)
""")

with engine.connect() as conn:
    for row in data:
        conn.execute(insert_sql, row)
    conn.commit()

print("Sample data inserted!") 