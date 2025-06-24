import requests
import json

# Get project ID
with open('project_id.txt', 'r') as f:
    project_id = int(f.read().strip())

print(f'Creating units for project ID: {project_id}')

# Unit configurations for PH Vista Hermosa
# 30 floors, 8 units per floor = 240 total units
# Floor distribution: 1-3 (Parking/Commercial), 4-33 (Residential)
# Unit types: 1BR, 2BR, 3BR, Penthouse

units = []
unit_counter = 1

# Floor 1-3: Parking and Commercial (not residential units)
# Floor 4-30: Regular residential floors (8 units each)
# Floor 31-33: Penthouse floors (4 units each)

for floor in range(4, 34):  # Floors 4-33 (30 residential floors)
    if floor <= 30:  # Regular floors (4-30)
        # 8 units per floor: 2x1BR, 4x2BR, 2x3BR
        floor_units = [
            # 1-bedroom units (corners with premium views)
            {'type': '1BR', 'bedrooms': 1, 'bathrooms': 1, 'area': 55, 'price_m2': 3400, 'premium': 'Corner'},
            {'type': '1BR', 'bedrooms': 1, 'bathrooms': 1, 'area': 52, 'price_m2': 3200, 'premium': None},
            
            # 2-bedroom units (standard)
            {'type': '2BR', 'bedrooms': 2, 'bathrooms': 2, 'area': 75, 'price_m2': 3200, 'premium': None},
            {'type': '2BR', 'bedrooms': 2, 'bathrooms': 2, 'area': 78, 'price_m2': 3250, 'premium': 'Balcony'},
            {'type': '2BR', 'bedrooms': 2, 'bathrooms': 2, 'area': 75, 'price_m2': 3200, 'premium': None},
            {'type': '2BR', 'bedrooms': 2, 'bathrooms': 2, 'area': 78, 'price_m2': 3250, 'premium': 'Balcony'},
            
            # 3-bedroom units (premium)
            {'type': '3BR', 'bedrooms': 3, 'bathrooms': 2.5, 'area': 105, 'price_m2': 3350, 'premium': 'Master Suite'},
            {'type': '3BR', 'bedrooms': 3, 'bathrooms': 2.5, 'area': 110, 'price_m2': 3400, 'premium': 'Corner + Master Suite'},
        ]
    else:  # Penthouse floors (31-33)
        # 4 larger units per floor
        floor_units = [
            {'type': 'PH2BR', 'bedrooms': 2, 'bathrooms': 2.5, 'area': 120, 'price_m2': 3800, 'premium': 'Penthouse'},
            {'type': 'PH3BR', 'bedrooms': 3, 'bathrooms': 3, 'area': 150, 'price_m2': 4000, 'premium': 'Penthouse + Terrace'},
            {'type': 'PH3BR', 'bedrooms': 3, 'bathrooms': 3, 'area': 150, 'price_m2': 4000, 'premium': 'Penthouse + Terrace'},
            {'type': 'PH4BR', 'bedrooms': 4, 'bathrooms': 3.5, 'area': 200, 'price_m2': 4200, 'premium': 'Penthouse Suite'},
        ]
    
    # Create units for this floor
    for i, unit_config in enumerate(floor_units):
        unit_number = f"{floor:02d}{chr(65+i)}"  # 04A, 04B, etc.
        
        # Calculate pricing with floor premium
        floor_premium = 1.0
        if floor >= 20:  # High floors get premium
            floor_premium = 1.05
        if floor >= 25:  # Very high floors
            floor_premium = 1.10
        if floor >= 31:  # Penthouse floors
            floor_premium = 1.20
        
        # Ocean view premium for certain units
        ocean_view = i in [0, 1, 6, 7]  # Corner and select units
        view_premium = 1.08 if ocean_view else 1.0
        
        final_price_m2 = unit_config['price_m2'] * floor_premium * view_premium
        total_price = unit_config['area'] * final_price_m2
        
        # Parking spaces based on unit type
        parking_spaces = 1
        if unit_config['type'].startswith('3BR') or unit_config['type'].startswith('PH'):
            parking_spaces = 2
        if unit_config['type'] == 'PH4BR':
            parking_spaces = 3
        
        # Storage included for all units
        storage_included = True
        
        # Balcony area
        balcony_area = 8.0  # Standard balcony
        if 'Balcony' in (unit_config.get('premium') or ''):
            balcony_area = 12.0
        if 'Terrace' in (unit_config.get('premium') or ''):
            balcony_area = 25.0
        if unit_config['type'] == 'PH4BR':
            balcony_area = 40.0
        
        # Create unit data
        unit_data = {
            'unit_number': unit_number,
            'unit_type': unit_config['type'],
            'floor_level': floor,
            'total_area_m2': unit_config['area'],
            'construction_area_m2': unit_config['area'],  # Same as total for apartments
            'bedrooms': unit_config['bedrooms'],
            'bathrooms': unit_config['bathrooms'],
            'parking_spaces': parking_spaces,
            'target_price_total': round(total_price, 2),
            'price_per_m2_construction': round(final_price_m2, 2),
            'status': 'AVAILABLE',
            'notes': f"Floor {floor}, {unit_config.get('premium', 'Standard')} unit" + 
                    (", Ocean View" if ocean_view else ", City View")
        }
        
        units.append(unit_data)
        unit_counter += 1

print(f'Created {len(units)} units')

# Add units in batches using bulk create endpoint
batch_size = 50
total_added = 0

for i in range(0, len(units), batch_size):
    batch = units[i:i+batch_size]
    print(f'\nAdding batch {i//batch_size + 1} ({len(batch)} units)...')
    
    try:
        # Use individual unit creation since bulk might not be available
        for unit in batch:
            response = requests.post(f'http://localhost:8000/api/scenario-projects/{project_id}/units', json=unit)
            if response.status_code == 200:
                total_added += 1
                if total_added % 20 == 0:
                    print(f'  Added {total_added} units so far...')
            else:
                print(f'✗ Failed to add unit {unit["unit_number"]}: {response.status_code}')
                print(f'  Response: {response.text[:100]}...')
                break
    except Exception as e:
        print(f'Error adding batch: {e}')
        break

print(f'\n=== UNITS SUMMARY ===')
print(f'Total units added: {total_added}/{len(units)}')

# Calculate unit statistics
unit_types = {}
total_area = 0
total_value = 0

for unit in units:
    unit_type = unit['unit_type']
    if unit_type not in unit_types:
        unit_types[unit_type] = {'count': 0, 'total_area': 0, 'avg_price_m2': 0}
    
    unit_types[unit_type]['count'] += 1
    unit_types[unit_type]['total_area'] += unit['total_area_m2']
    unit_types[unit_type]['avg_price_m2'] += unit['price_per_m2_construction']
    
    total_area += unit['total_area_m2']
    total_value += unit['target_price_total']

print(f'\nUnit Type Distribution:')
for unit_type, stats in unit_types.items():
    avg_area = stats['total_area'] / stats['count']
    avg_price = stats['avg_price_m2'] / stats['count']
    print(f'  {unit_type}: {stats["count"]} units, Avg {avg_area:.0f}m², ${avg_price:,.0f}/m²')

print(f'\nProject Totals:')
print(f'  Total Units: {len(units)}')
print(f'  Total Sellable Area: {total_area:,.0f} m²')
print(f'  Total Sales Value: ${total_value:,.0f}')
print(f'  Average Price/m²: ${total_value/total_area:,.0f}')
print(f'  Average Unit Price: ${total_value/len(units):,.0f}') 