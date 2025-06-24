import requests
import json

# Get project ID
with open('project_id.txt', 'r') as f:
    project_id = int(f.read().strip())

print(f'Working with project ID: {project_id}')

# Realistic cost items for a 30-story luxury residential tower in Panama
cost_items = [
    # TERRENO
    {
        'categoria': 'Terreno',
        'subcategoria': 'Adquisición',
        'partida_costo': 'Precio de Compra del Lote - Punta Pacifica',
        'base_costo': 'Monto Fijo',
        'monto_proyectado': 4200000.00,
        'unit_cost': None,
        'quantity': None,
        'start_month': 1,
        'duration_months': 1,
        'notes': 'Lote de 2,800 m² en zona premium de Punta Pacifica'
    },
    {
        'categoria': 'Terreno',
        'subcategoria': 'Costos de Cierre',
        'partida_costo': 'Honorarios Legales y Notariales',
        'base_costo': 'Monto Fijo',
        'monto_proyectado': 85000.00,
        'start_month': 1,
        'duration_months': 2,
        'notes': 'Traspaso de escrituras, permisos municipales iniciales'
    },
    
    # COSTOS DUROS - ESTRUCTURA
    {
        'categoria': 'Costos Duros',
        'subcategoria': 'Preparación del Sitio',
        'partida_costo': 'Excavación y Cimentación Profunda',
        'base_costo': 'por m³',
        'monto_proyectado': 850000.00,
        'unit_cost': 45.00,
        'quantity': 18888.89,
        'start_month': 3,
        'duration_months': 4,
        'notes': 'Pilotes y excavación para torre de 30 pisos'
    },
    {
        'categoria': 'Costos Duros',
        'subcategoria': 'Construcción',
        'partida_costo': 'Estructura de Concreto Armado',
        'base_costo': 'por m²',
        'monto_proyectado': 7400000.00,
        'unit_cost': 400.00,
        'quantity': 18500.00,
        'start_month': 7,
        'duration_months': 18,
        'notes': 'Estructura completa 30 pisos, concreto de alta resistencia'
    },
    {
        'categoria': 'Costos Duros',
        'subcategoria': 'Fachada',
        'partida_costo': 'Fachada de Vidrio y Aluminio',
        'base_costo': 'por m²',
        'monto_proyectado': 1680000.00,
        'unit_cost': 280.00,
        'quantity': 6000.00,
        'start_month': 15,
        'duration_months': 8,
        'notes': 'Fachada premium con vidrio doble y marcos de aluminio'
    },
    
    # ACABADOS
    {
        'categoria': 'Costos Duros',
        'subcategoria': 'Acabados',
        'partida_costo': 'Acabados de Lujo en Apartamentos',
        'base_costo': 'por m²',
        'monto_proyectado': 5400000.00,
        'unit_cost': 300.00,
        'quantity': 18000.00,
        'start_month': 20,
        'duration_months': 10,
        'notes': 'Pisos de mármol, cocinas europeas, baños premium'
    },
    {
        'categoria': 'Costos Duros',
        'subcategoria': 'Acabados',
        'partida_costo': 'Áreas Comunes y Amenidades',
        'base_costo': 'Monto Fijo',
        'monto_proyectado': 1200000.00,
        'start_month': 22,
        'duration_months': 8,
        'notes': 'Lobby, piscina infinita, gimnasio, spa, salón de eventos'
    },
    
    # SISTEMAS
    {
        'categoria': 'Costos Duros',
        'subcategoria': 'Sistemas',
        'partida_costo': 'Sistema Eléctrico Completo',
        'base_costo': 'por unidad',
        'monto_proyectado': 1440000.00,
        'unit_cost': 6000.00,
        'quantity': 240.00,
        'start_month': 18,
        'duration_months': 12,
        'notes': 'Instalación eléctrica completa, plantas de emergencia'
    },
    {
        'categoria': 'Costos Duros',
        'subcategoria': 'Sistemas',
        'partida_costo': 'Sistema de Plomería y Agua',
        'base_costo': 'por unidad',
        'monto_proyectado': 960000.00,
        'unit_cost': 4000.00,
        'quantity': 240.00,
        'start_month': 18,
        'duration_months': 10,
        'notes': 'Plomería, sistemas de agua potable y residuales'
    },
    {
        'categoria': 'Costos Duros',
        'subcategoria': 'Sistemas',
        'partida_costo': 'Sistema HVAC Central',
        'base_costo': 'por unidad',
        'monto_proyectado': 1200000.00,
        'unit_cost': 5000.00,
        'quantity': 240.00,
        'start_month': 20,
        'duration_months': 8,
        'notes': 'Aire acondicionado central, ventilación mecánica'
    },
    {
        'categoria': 'Costos Duros',
        'subcategoria': 'Sistemas',
        'partida_costo': 'Ascensores de Alta Velocidad',
        'base_costo': 'Monto Fijo',
        'monto_proyectado': 480000.00,
        'start_month': 24,
        'duration_months': 4,
        'notes': '6 ascensores de alta velocidad para 30 pisos'
    },
    
    # COSTOS BLANDOS
    {
        'categoria': 'Costos Blandos',
        'subcategoria': 'Honorarios Profesionales',
        'partida_costo': 'Arquitecto Principal',
        'base_costo': '% Costos Duros',
        'monto_proyectado': 450000.00,
        'percentage_of_base': 0.025,
        'base_reference': 'COSTOS_DUROS',
        'start_month': 1,
        'duration_months': 30,
        'notes': 'Honorarios arquitecto 2.5% de costos duros'
    },
    {
        'categoria': 'Costos Blandos',
        'subcategoria': 'Honorarios Profesionales',
        'partida_costo': 'Ingeniero Estructural',
        'base_costo': 'Monto Fijo',
        'monto_proyectado': 280000.00,
        'start_month': 2,
        'duration_months': 24,
        'notes': 'Diseño estructural para torre de 30 pisos'
    },
    {
        'categoria': 'Costos Blandos',
        'subcategoria': 'Permisos y Tasas',
        'partida_costo': 'Permiso de Construcción Municipal',
        'base_costo': 'Calculado',
        'monto_proyectado': 125000.00,
        'start_month': 2,
        'duration_months': 3,
        'notes': 'Permisos municipales para construcción de altura'
    },
    {
        'categoria': 'Costos Blandos',
        'subcategoria': 'Permisos y Tasas',
        'partida_costo': 'Estudio de Impacto Ambiental',
        'base_costo': 'Monto Fijo',
        'monto_proyectado': 45000.00,
        'start_month': 1,
        'duration_months': 4,
        'notes': 'EIA requerido para proyecto de altura'
    },
    {
        'categoria': 'Costos Blandos',
        'subcategoria': 'Marketing y Ventas',
        'partida_costo': 'Campaña de Marketing Digital',
        'base_costo': 'Monto Fijo Mensual',
        'monto_proyectado': 540000.00,
        'unit_cost': 15000.00,
        'quantity': 36.00,
        'start_month': 6,
        'duration_months': 36,
        'notes': 'Marketing digital, publicidad, sala de ventas'
    },
    {
        'categoria': 'Costos Blandos',
        'subcategoria': 'Marketing y Ventas',
        'partida_costo': 'Comisiones de Corredores',
        'base_costo': '% Ingresos por Venta',
        'monto_proyectado': 2304000.00,
        'percentage_of_base': 0.03,
        'base_reference': 'INGRESOS_VENTAS',
        'start_month': 12,
        'duration_months': 36,
        'notes': '3% de comisión sobre ventas totales'
    },
    
    # FINANCIACIÓN
    {
        'categoria': 'Financiación',
        'subcategoria': 'Intereses del Préstamo',
        'partida_costo': 'Intereses Préstamo Construcción',
        'base_costo': 'Calculado',
        'monto_proyectado': 1350000.00,
        'start_month': 3,
        'duration_months': 30,
        'notes': 'Intereses sobre préstamo de construcción'
    },
    {
        'categoria': 'Financiación',
        'subcategoria': 'Comisiones del Préstamo',
        'partida_costo': 'Comisiones Bancarias',
        'base_costo': '% Monto del Préstamo',
        'monto_proyectado': 450000.00,
        'percentage_of_base': 0.015,
        'base_reference': 'MONTO_PRESTAMO',
        'start_month': 3,
        'duration_months': 1,
        'notes': '1.5% comisión sobre préstamo de $30M'
    },
    
    # CONTINGENCIA
    {
        'categoria': 'Contingencia',
        'subcategoria': 'Imprevistos',
        'partida_costo': 'Reserva para Imprevistos',
        'base_costo': '% Costos Totales',
        'monto_proyectado': 1800000.00,
        'percentage_of_base': 0.08,
        'base_reference': 'COSTOS_TOTALES',
        'start_month': 1,
        'duration_months': 36,
        'notes': '8% de contingencia sobre costos totales'
    }
]

# Add cost items in batches
batch_size = 5
total_added = 0

for i in range(0, len(cost_items), batch_size):
    batch = cost_items[i:i+batch_size]
    print(f'\nAdding batch {i//batch_size + 1} ({len(batch)} items)...')
    
    for item in batch:
        try:
            # Add the scenario_project_id to the item
            item['scenario_project_id'] = project_id
            response = requests.post(f'http://localhost:8000/api/scenario-projects/{project_id}/cost-items', json=item)
            if response.status_code == 200:
                print(f'✓ Added: {item["partida_costo"]}')
                total_added += 1
            else:
                print(f'✗ Failed: {item["partida_costo"]} - Status: {response.status_code}')
                print(f'  Response: {response.text[:200]}...')
        except Exception as e:
            print(f'Error adding {item["partida_costo"]}: {e}')

print(f'\n=== SUMMARY ===')
print(f'Total cost items added: {total_added}/{len(cost_items)}')
print(f'Project ID: {project_id}')

# Calculate total project cost
total_cost = sum(item['monto_proyectado'] for item in cost_items)
print(f'Total estimated project cost: ${total_cost:,.2f}')
print(f'Cost per unit: ${total_cost/240:,.2f}')
print(f'Cost per m²: ${total_cost/18500:,.2f}') 