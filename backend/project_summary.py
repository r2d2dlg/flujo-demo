import requests

# Get project ID
with open('project_id.txt', 'r') as f:
    project_id = int(f.read().strip())

# Get project details
response = requests.get(f'http://localhost:8000/api/scenario-projects/{project_id}')
if response.status_code == 200:
    project = response.json()
    print('=' * 60)
    print('          PH VISTA HERMOSA PROJECT SUMMARY')
    print('=' * 60)
    print()
    print(f'Project ID: {project["id"]}')
    print(f'Name: {project["name"]}')
    print(f'Location: {project["location"]}')
    print(f'Status: {project["status"]}')
    print(f'Description: {project["description"]}')
    print()
    print('=== PROJECT SPECIFICATIONS ===')
    print(f'Total Land Area: {float(project["total_area_m2"]):,.0f} m²')
    print(f'Buildable Area: {float(project["buildable_area_m2"]):,.0f} m²')
    print(f'Total Units: {project["total_units"]}')
    print(f'Average Unit Size: {project["avg_unit_size_m2"]} m²')
    print(f'Target Price per m²: ${float(project["target_price_per_m2"]):,.0f}')
    print(f'Expected Sales Period: {project["expected_sales_period_months"]} months')
    print()
    print('=== FINANCIAL PARAMETERS ===')
    print(f'Discount Rate: {project["discount_rate"]*100:.1f}%')
    print(f'Inflation Rate: {project["inflation_rate"]*100:.1f}%')
    print(f'Contingency: {project["contingency_percentage"]*100:.1f}%')
    
    # Get cost items
    cost_items = project.get('cost_items', [])
    print(f'\n=== COST BREAKDOWN ({len(cost_items)} items) ===')
    
    categories = {}
    total_cost = 0
    for item in cost_items:
        cat = item['categoria']
        amount = float(item['monto_proyectado'] or 0)
        categories[cat] = categories.get(cat, 0) + amount
        total_cost += amount
    
    for cat, amount in sorted(categories.items(), key=lambda x: x[1], reverse=True):
        pct = (amount/total_cost)*100 if total_cost > 0 else 0
        print(f'{cat}: ${amount:,.0f} ({pct:.1f}%)')
    
    print(f'\nTOTAL PROJECT COST: ${total_cost:,.0f}')
    
    # Revenue calculation
    estimated_revenue = project['total_units'] * project['avg_unit_size_m2'] * project['target_price_per_m2']
    print(f'ESTIMATED REVENUE: ${estimated_revenue:,.0f}')
    print(f'ESTIMATED PROFIT: ${estimated_revenue - total_cost:,.0f}')
    print(f'PROFIT MARGIN: {((estimated_revenue - total_cost)/estimated_revenue)*100:.1f}%')
    
    # Get units summary
    units_response = requests.get(f'http://localhost:8000/api/scenario-projects/{project_id}/units')
    if units_response.status_code == 200:
        units = units_response.json()
        print(f'\n=== UNITS SUMMARY ({len(units)} units created) ===')
        
        unit_types = {}
        total_sellable_area = 0
        total_sales_value = 0
        
        for unit in units:
            unit_type = unit['unit_type']
            if unit_type not in unit_types:
                unit_types[unit_type] = {
                    'count': 0, 
                    'total_area': 0, 
                    'total_value': 0,
                    'avg_price_m2': 0
                }
            
            unit_types[unit_type]['count'] += 1
            unit_types[unit_type]['total_area'] += unit['area_m2']
            unit_types[unit_type]['total_value'] += unit['target_price_total']
            unit_types[unit_type]['avg_price_m2'] += unit['target_price_per_m2']
            
            total_sellable_area += unit['area_m2']
            total_sales_value += unit['target_price_total']
        
        print('Unit Type Distribution:')
        for unit_type, stats in unit_types.items():
            avg_area = stats['total_area'] / stats['count']
            avg_price = stats['avg_price_m2'] / stats['count']
            avg_unit_value = stats['total_value'] / stats['count']
            print(f'  {unit_type}: {stats["count"]:2d} units | {avg_area:3.0f}m² | ${avg_price:4,.0f}/m² | ${avg_unit_value:7,.0f}/unit')
        
        print(f'\nActual Project Totals:')
        print(f'  Total Units: {len(units)}')
        print(f'  Total Sellable Area: {total_sellable_area:,.0f} m²')
        print(f'  Total Sales Value: ${total_sales_value:,.0f}')
        print(f'  Average Price/m²: ${total_sales_value/total_sellable_area:,.0f}')
        print(f'  Average Unit Price: ${total_sales_value/len(units):,.0f}')
        
        # Updated profit calculation with actual sales values
        actual_profit = total_sales_value - total_cost
        actual_margin = (actual_profit/total_sales_value)*100
        print(f'\n=== UPDATED FINANCIAL PROJECTION ===')
        print(f'Total Investment: ${total_cost:,.0f}')
        print(f'Total Sales Value: ${total_sales_value:,.0f}')
        print(f'Projected Profit: ${actual_profit:,.0f}')
        print(f'Profit Margin: {actual_margin:.1f}%')
        print(f'ROI: {(actual_profit/total_cost)*100:.1f}%')
        
        # Sales pace analysis
        monthly_sales_target = len(units) / project['expected_sales_period_months']
        monthly_revenue_target = total_sales_value / project['expected_sales_period_months']
        print(f'\n=== SALES TARGETS ===')
        print(f'Target Sales Pace: {monthly_sales_target:.1f} units/month')
        print(f'Target Monthly Revenue: ${monthly_revenue_target:,.0f}')
        print(f'Break-even Units: {int((total_cost / (total_sales_value/len(units))))} units')
        
    print('\n' + '=' * 60)
    print('Project created successfully with realistic sample data!')
    print('You can now view it at: http://localhost:5173/admin/scenario-projects')
    print('=' * 60)
    
else:
    print(f'Error getting project: {response.status_code}')
    print(response.text) 