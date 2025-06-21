#!/usr/bin/env python3
"""
Script to create sample quote templates and assemblies for the construction quotation system.
Run this after the database tables have been created.
"""

import os
import sys
from decimal import Decimal
from datetime import datetime

# Add the parent directory to the path so we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.database import engine
from backend.app.models import (
    QuoteTemplate, 
    ConstructionAssembly, 
    AssemblyComponent, 
    CostItem
)
from sqlalchemy.orm import sessionmaker

Session = sessionmaker(bind=engine)

def create_sample_cost_items(session):
    """Create sample cost items for assemblies"""
    print("Creating sample cost items...")
    
    cost_items = [
        # Wall assembly components
        {
            "item_code": "BLK-15-STD",
            "description": "Bloque de concreto 15cm estándar",
            "item_type": "MATERIAL",
            "category": "MAMPOSTERIA",
            "subcategory": "BLOQUES",
            "unit_of_measure": "c/u",
            "base_cost": Decimal("1.25"),
            "currency": "USD",
            "waste_factor": Decimal("0.05"),
            "panama_city_factor": Decimal("1.0"),
            "colon_factor": Decimal("0.95"),
            "chiriqui_factor": Decimal("0.90"),
            "interior_factor": Decimal("0.85")
        },
        {
            "item_code": "CEM-MORT-STD",
            "description": "Mortero de cemento para repello",
            "item_type": "MATERIAL", 
            "category": "CEMENTOS",
            "subcategory": "MORTEROS",
            "unit_of_measure": "m2",
            "base_cost": Decimal("3.50"),
            "currency": "USD",
            "waste_factor": Decimal("0.10"),
            "panama_city_factor": Decimal("1.0"),
            "colon_factor": Decimal("0.95"),
            "chiriqui_factor": Decimal("0.90"),
            "interior_factor": Decimal("0.85")
        },
        {
            "item_code": "PAINT-INT-STD",
            "description": "Pintura interior estándar",
            "item_type": "MATERIAL",
            "category": "PINTURAS",
            "subcategory": "INTERIOR",
            "unit_of_measure": "m2",
            "base_cost": Decimal("2.75"),
            "currency": "USD",
            "waste_factor": Decimal("0.08"),
            "panama_city_factor": Decimal("1.0"),
            "colon_factor": Decimal("0.95"),
            "chiriqui_factor": Decimal("0.90"),
            "interior_factor": Decimal("0.85")
        },
        {
            "item_code": "LAB-MASON",
            "description": "Mano de obra albañil",
            "item_type": "LABOR",
            "category": "MANO_OBRA",
            "subcategory": "ALBANILERIA",
            "unit_of_measure": "m2",
            "base_cost": Decimal("12.00"),
            "currency": "USD",
            "waste_factor": Decimal("0.00"),
            "panama_city_factor": Decimal("1.0"),
            "colon_factor": Decimal("0.90"),
            "chiriqui_factor": Decimal("0.85"),
            "interior_factor": Decimal("0.80")
        },
        
        # Door assembly components
        {
            "item_code": "DOOR-WD-STD",
            "description": "Puerta de madera estándar",
            "item_type": "MATERIAL",
            "category": "CARPINTERIA",
            "subcategory": "PUERTAS",
            "unit_of_measure": "c/u",
            "base_cost": Decimal("85.00"),
            "currency": "USD",
            "waste_factor": Decimal("0.02"),
            "panama_city_factor": Decimal("1.0"),
            "colon_factor": Decimal("0.95"),
            "chiriqui_factor": Decimal("0.90"),
            "interior_factor": Decimal("0.85")
        },
        {
            "item_code": "DOOR-FRM-WD",
            "description": "Marco de madera para puerta",
            "item_type": "MATERIAL",
            "category": "CARPINTERIA",
            "subcategory": "MARCOS",
            "unit_of_measure": "c/u",
            "base_cost": Decimal("25.00"),
            "currency": "USD",
            "waste_factor": Decimal("0.05"),
            "panama_city_factor": Decimal("1.0"),
            "colon_factor": Decimal("0.95"),
            "chiriqui_factor": Decimal("0.90"),
            "interior_factor": Decimal("0.85")
        },
        {
            "item_code": "DOOR-HDW-STD",
            "description": "Herrajes estándar para puerta",
            "item_type": "MATERIAL",
            "category": "HERRAJES",
            "subcategory": "PUERTAS",
            "unit_of_measure": "set",
            "base_cost": Decimal("15.00"),
            "currency": "USD",
            "waste_factor": Decimal("0.02"),
            "panama_city_factor": Decimal("1.0"),
            "colon_factor": Decimal("0.95"),
            "chiriqui_factor": Decimal("0.90"),
            "interior_factor": Decimal("0.85")
        },
        {
            "item_code": "LAB-CARP",
            "description": "Mano de obra carpintero",
            "item_type": "LABOR",
            "category": "MANO_OBRA",
            "subcategory": "CARPINTERIA",
            "unit_of_measure": "c/u",
            "base_cost": Decimal("35.00"),
            "currency": "USD",
            "waste_factor": Decimal("0.00"),
            "panama_city_factor": Decimal("1.0"),
            "colon_factor": Decimal("0.90"),
            "chiriqui_factor": Decimal("0.85"),
            "interior_factor": Decimal("0.80")
        },
        
        # Roof assembly components
        {
            "item_code": "ZINC-CORR",
            "description": "Zinc corrugado calibre 26",
            "item_type": "MATERIAL",
            "category": "CUBIERTAS",
            "subcategory": "ZINC",
            "unit_of_measure": "m2",
            "base_cost": Decimal("8.50"),
            "currency": "USD",
            "waste_factor": Decimal("0.10"),
            "panama_city_factor": Decimal("1.0"),
            "colon_factor": Decimal("0.95"),
            "chiriqui_factor": Decimal("0.90"),
            "interior_factor": Decimal("0.85")
        },
        {
            "item_code": "WOOD-STRUCT",
            "description": "Estructura de madera para techo",
            "item_type": "MATERIAL",
            "category": "ESTRUCTURA",
            "subcategory": "MADERA",
            "unit_of_measure": "m2",
            "base_cost": Decimal("15.00"),
            "currency": "USD",
            "waste_factor": Decimal("0.08"),
            "panama_city_factor": Decimal("1.0"),
            "colon_factor": Decimal("0.95"),
            "chiriqui_factor": Decimal("0.90"),
            "interior_factor": Decimal("0.85")
        },
        {
            "item_code": "ROOF-ACC",
            "description": "Accesorios para cubierta (tornillos, gomas)",
            "item_type": "MATERIAL",
            "category": "HERRAJES",
            "subcategory": "CUBIERTAS",
            "unit_of_measure": "m2",
            "base_cost": Decimal("2.25"),
            "currency": "USD",
            "waste_factor": Decimal("0.05"),
            "panama_city_factor": Decimal("1.0"),
            "colon_factor": Decimal("0.95"),
            "chiriqui_factor": Decimal("0.90"),
            "interior_factor": Decimal("0.85")
        },
        {
            "item_code": "LAB-ROOF",
            "description": "Mano de obra techador",
            "item_type": "LABOR",
            "category": "MANO_OBRA",
            "subcategory": "CUBIERTAS",
            "unit_of_measure": "m2",
            "base_cost": Decimal("8.00"),
            "currency": "USD",
            "waste_factor": Decimal("0.00"),
            "panama_city_factor": Decimal("1.0"),
            "colon_factor": Decimal("0.90"),
            "chiriqui_factor": Decimal("0.85"),
            "interior_factor": Decimal("0.80")
        }
    ]
    
    created_items = {}
    for item_data in cost_items:
        existing = session.query(CostItem).filter(CostItem.item_code == item_data["item_code"]).first()
        if not existing:
            cost_item = CostItem(
                **item_data,
                is_active=True,
                is_custom=False,
                created_by="system",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            session.add(cost_item)
            session.flush()  # Get the ID
            created_items[item_data["item_code"]] = cost_item.id
            print(f"  Created cost item: {item_data['item_code']}")
        else:
            created_items[item_data["item_code"]] = existing.id
            print(f"  Cost item already exists: {item_data['item_code']}")
    
    return created_items

def create_assembly_components(session, cost_item_ids):
    """Create assembly components linking assemblies to cost items"""
    print("Creating assembly components...")
    
    # Get assemblies
    wall_assembly = session.query(ConstructionAssembly).filter(
        ConstructionAssembly.assembly_code == "ASM-WALL-001"
    ).first()
    
    door_assembly = session.query(ConstructionAssembly).filter(
        ConstructionAssembly.assembly_code == "ASM-DOOR-001"
    ).first()
    
    roof_assembly = session.query(ConstructionAssembly).filter(
        ConstructionAssembly.assembly_code == "ASM-ROOF-001"
    ).first()
    
    if not all([wall_assembly, door_assembly, roof_assembly]):
        print("  Error: Not all assemblies found!")
        return
    
    # Wall assembly components
    wall_components = [
        {
            "assembly_id": wall_assembly.id,
            "cost_item_id": cost_item_ids["BLK-15-STD"],
            "quantity_formula": "{height} * {thickness} * 8",  # blocks per m2
            "base_quantity": Decimal("8.0"),
            "productivity_factor": Decimal("1.0"),
            "sequence_order": 1,
            "is_optional": False
        },
        {
            "assembly_id": wall_assembly.id,
            "cost_item_id": cost_item_ids["CEM-MORT-STD"],
            "quantity_formula": "2.0",  # both sides
            "base_quantity": Decimal("2.0"),
            "productivity_factor": Decimal("1.0"),
            "sequence_order": 2,
            "is_optional": False
        },
        {
            "assembly_id": wall_assembly.id,
            "cost_item_id": cost_item_ids["PAINT-INT-STD"],
            "quantity_formula": "2.0 * (1 - {openings_factor})",  # both sides minus openings
            "base_quantity": Decimal("2.0"),
            "productivity_factor": Decimal("1.0"),
            "sequence_order": 3,
            "is_optional": False
        },
        {
            "assembly_id": wall_assembly.id,
            "cost_item_id": cost_item_ids["LAB-MASON"],
            "quantity_formula": "1.0",
            "base_quantity": Decimal("1.0"),
            "productivity_factor": Decimal("1.2"),  # 20% extra time
            "sequence_order": 4,
            "is_optional": False
        }
    ]
    
    # Door assembly components
    door_components = [
        {
            "assembly_id": door_assembly.id,
            "cost_item_id": cost_item_ids["DOOR-WD-STD"],
            "quantity_formula": "1.0",
            "base_quantity": Decimal("1.0"),
            "productivity_factor": Decimal("1.0"),
            "sequence_order": 1,
            "is_optional": False
        },
        {
            "assembly_id": door_assembly.id,
            "cost_item_id": cost_item_ids["DOOR-FRM-WD"],
            "quantity_formula": "1.0",
            "base_quantity": Decimal("1.0"),
            "productivity_factor": Decimal("1.0"),
            "sequence_order": 2,
            "is_optional": False
        },
        {
            "assembly_id": door_assembly.id,
            "cost_item_id": cost_item_ids["DOOR-HDW-STD"],
            "quantity_formula": "1.0",
            "base_quantity": Decimal("1.0"),
            "productivity_factor": Decimal("1.0"),
            "sequence_order": 3,
            "is_optional": False
        },
        {
            "assembly_id": door_assembly.id,
            "cost_item_id": cost_item_ids["LAB-CARP"],
            "quantity_formula": "1.0",
            "base_quantity": Decimal("1.0"),
            "productivity_factor": Decimal("1.1"),
            "sequence_order": 4,
            "is_optional": False
        }
    ]
    
    # Roof assembly components
    roof_components = [
        {
            "assembly_id": roof_assembly.id,
            "cost_item_id": cost_item_ids["ZINC-CORR"],
            "quantity_formula": "1.0",
            "base_quantity": Decimal("1.0"),
            "productivity_factor": Decimal("1.0"),
            "sequence_order": 1,
            "is_optional": False
        },
        {
            "assembly_id": roof_assembly.id,
            "cost_item_id": cost_item_ids["WOOD-STRUCT"],
            "quantity_formula": "1.0",
            "base_quantity": Decimal("1.0"),
            "productivity_factor": Decimal("1.0"),
            "sequence_order": 2,
            "is_optional": False
        },
        {
            "assembly_id": roof_assembly.id,
            "cost_item_id": cost_item_ids["ROOF-ACC"],
            "quantity_formula": "1.0",
            "base_quantity": Decimal("1.0"),
            "productivity_factor": Decimal("1.0"),
            "sequence_order": 3,
            "is_optional": False
        },
        {
            "assembly_id": roof_assembly.id,
            "cost_item_id": cost_item_ids["LAB-ROOF"],
            "quantity_formula": "1.0",
            "base_quantity": Decimal("1.0"),
            "productivity_factor": Decimal("1.0"),
            "sequence_order": 4,
            "is_optional": False
        }
    ]
    
    all_components = wall_components + door_components + roof_components
    
    for comp_data in all_components:
        existing = session.query(AssemblyComponent).filter(
            AssemblyComponent.assembly_id == comp_data["assembly_id"],
            AssemblyComponent.cost_item_id == comp_data["cost_item_id"]
        ).first()
        
        if not existing:
            component = AssemblyComponent(**comp_data)
            session.add(component)
            print(f"  Created component for assembly {comp_data['assembly_id']}")
        else:
            print(f"  Component already exists for assembly {comp_data['assembly_id']}")

def create_sample_templates():
    """Create sample quote templates"""
    print("Creating sample quote templates...")
    
    templates = [
        {
            "template_name": "Casa Residencial Estándar",
            "project_type": "RESIDENTIAL",
            "template_sections": {
                "Preliminares": {
                    "description": "Trabajos preliminares y preparación del sitio",
                    "items": [
                        {
                            "description": "Limpieza y nivelación del terreno",
                            "quantity": 1,
                            "unit": "global",
                            "unit_cost": 500.00,
                            "type": "LABOR"
                        },
                        {
                            "description": "Replanteo y trazado",
                            "quantity": 1,
                            "unit": "global", 
                            "unit_cost": 300.00,
                            "type": "LABOR"
                        }
                    ]
                },
                "Cimentación": {
                    "description": "Fundaciones y estructura de soporte",
                    "items": [
                        {
                            "description": "Excavación para fundaciones",
                            "quantity": 25,
                            "unit": "m3",
                            "unit_cost": 15.00,
                            "type": "LABOR"
                        },
                        {
                            "description": "Concreto para fundaciones",
                            "quantity": 20,
                            "unit": "m3",
                            "unit_cost": 120.00,
                            "type": "MATERIAL"
                        },
                        {
                            "description": "Acero de refuerzo",
                            "quantity": 1500,
                            "unit": "kg",
                            "unit_cost": 0.85,
                            "type": "MATERIAL"
                        }
                    ]
                },
                "Estructura": {
                    "description": "Columnas, vigas y losa",
                    "items": [
                        {
                            "description": "Columnas de concreto",
                            "quantity": 15,
                            "unit": "c/u",
                            "unit_cost": 180.00,
                            "type": "MATERIAL"
                        },
                        {
                            "description": "Vigas de concreto",
                            "quantity": 80,
                            "unit": "ml",
                            "unit_cost": 25.00,
                            "type": "MATERIAL"
                        },
                        {
                            "description": "Losa de concreto",
                            "quantity": 120,
                            "unit": "m2",
                            "unit_cost": 45.00,
                            "type": "MATERIAL"
                        }
                    ]
                },
                "Mampostería": {
                    "description": "Muros y divisiones",
                    "items": [
                        {
                            "description": "Muro de bloque + repello + pintura",
                            "quantity": 200,
                            "unit": "m2",
                            "unit_cost": 28.50,
                            "type": "MATERIAL"
                        }
                    ]
                },
                "Cubierta": {
                    "description": "Techo y estructura de cubierta",
                    "items": [
                        {
                            "description": "Cubierta de zinc acanalado",
                            "quantity": 130,
                            "unit": "m2",
                            "unit_cost": 35.00,
                            "type": "MATERIAL"
                        }
                    ]
                },
                "Acabados": {
                    "description": "Pisos, puertas, ventanas y acabados finales",
                    "items": [
                        {
                            "description": "Piso de cerámica",
                            "quantity": 100,
                            "unit": "m2",
                            "unit_cost": 18.00,
                            "type": "MATERIAL"
                        },
                        {
                            "description": "Puerta interior completa",
                            "quantity": 6,
                            "unit": "c/u",
                            "unit_cost": 165.00,
                            "type": "MATERIAL"
                        },
                        {
                            "description": "Ventanas de aluminio",
                            "quantity": 8,
                            "unit": "c/u",
                            "unit_cost": 120.00,
                            "type": "MATERIAL"
                        }
                    ]
                },
                "Instalaciones": {
                    "description": "Instalaciones eléctricas, sanitarias y otras",
                    "items": [
                        {
                            "description": "Instalación eléctrica completa",
                            "quantity": 1,
                            "unit": "global",
                            "unit_cost": 2500.00,
                            "type": "SUBCONTRACT"
                        },
                        {
                            "description": "Instalación sanitaria completa",
                            "quantity": 1,
                            "unit": "global",
                            "unit_cost": 2000.00,
                            "type": "SUBCONTRACT"
                        }
                    ]
                }
            },
            "default_overhead": Decimal("18.00"),
            "default_profit": Decimal("12.00"),
            "default_contingency": Decimal("8.00")
        },
        {
            "template_name": "Edificio Comercial",
            "project_type": "COMMERCIAL",
            "template_sections": {
                "Preliminares": {
                    "description": "Trabajos preliminares y preparación",
                    "items": [
                        {
                            "description": "Demoliciones y limpieza",
                            "quantity": 1,
                            "unit": "global",
                            "unit_cost": 2000.00,
                            "type": "LABOR"
                        },
                        {
                            "description": "Movimiento de tierra",
                            "quantity": 1,
                            "unit": "global",
                            "unit_cost": 3500.00,
                            "type": "EQUIPMENT"
                        }
                    ]
                },
                "Estructura": {
                    "description": "Estructura principal del edificio",
                    "items": [
                        {
                            "description": "Estructura de concreto reforzado",
                            "quantity": 500,
                            "unit": "m2",
                            "unit_cost": 85.00,
                            "type": "MATERIAL"
                        },
                        {
                            "description": "Estructura metálica",
                            "quantity": 200,
                            "unit": "m2",
                            "unit_cost": 120.00,
                            "type": "MATERIAL"
                        }
                    ]
                },
                "Fachada": {
                    "description": "Fachada y cerramiento exterior",
                    "items": [
                        {
                            "description": "Muro cortina de aluminio",
                            "quantity": 300,
                            "unit": "m2",
                            "unit_cost": 180.00,
                            "type": "MATERIAL"
                        },
                        {
                            "description": "Acabado exterior",
                            "quantity": 400,
                            "unit": "m2",
                            "unit_cost": 45.00,
                            "type": "MATERIAL"
                        }
                    ]
                },
                "Instalaciones MEP": {
                    "description": "Instalaciones mecánicas, eléctricas y sanitarias",
                    "items": [
                        {
                            "description": "Sistema eléctrico comercial",
                            "quantity": 1,
                            "unit": "global",
                            "unit_cost": 25000.00,
                            "type": "SUBCONTRACT"
                        },
                        {
                            "description": "Sistema de aire acondicionado",
                            "quantity": 1,
                            "unit": "global",
                            "unit_cost": 35000.00,
                            "type": "SUBCONTRACT"
                        },
                        {
                            "description": "Sistema sanitario",
                            "quantity": 1,
                            "unit": "global",
                            "unit_cost": 15000.00,
                            "type": "SUBCONTRACT"
                        }
                    ]
                }
            },
            "default_overhead": Decimal("15.00"),
            "default_profit": Decimal("10.00"),
            "default_contingency": Decimal("5.00")
        },
        {
            "template_name": "Nave Industrial",
            "project_type": "INDUSTRIAL",
            "template_sections": {
                "Preparación": {
                    "description": "Preparación del sitio industrial",
                    "items": [
                        {
                            "description": "Nivelación y compactación",
                            "quantity": 1,
                            "unit": "global",
                            "unit_cost": 5000.00,
                            "type": "EQUIPMENT"
                        }
                    ]
                },
                "Estructura": {
                    "description": "Estructura metálica industrial",
                    "items": [
                        {
                            "description": "Estructura metálica principal",
                            "quantity": 800,
                            "unit": "m2",
                            "unit_cost": 95.00,
                            "type": "MATERIAL"
                        },
                        {
                            "description": "Cubierta metálica",
                            "quantity": 1000,
                            "unit": "m2",
                            "unit_cost": 25.00,
                            "type": "MATERIAL"
                        }
                    ]
                },
                "Cerramientos": {
                    "description": "Muros y cerramientos laterales",
                    "items": [
                        {
                            "description": "Panel metálico para fachada",
                            "quantity": 600,
                            "unit": "m2",
                            "unit_cost": 35.00,
                            "type": "MATERIAL"
                        }
                    ]
                },
                "Instalaciones": {
                    "description": "Instalaciones industriales",
                    "items": [
                        {
                            "description": "Instalación eléctrica industrial",
                            "quantity": 1,
                            "unit": "global",
                            "unit_cost": 40000.00,
                            "type": "SUBCONTRACT"
                        }
                    ]
                }
            },
            "default_overhead": Decimal("12.00"),
            "default_profit": Decimal("8.00"),
            "default_contingency": Decimal("6.00")
        }
    ]
    
    session = Session()
    try:
        for template_data in templates:
            existing = session.query(QuoteTemplate).filter(
                QuoteTemplate.template_name == template_data["template_name"]
            ).first()
            
            if not existing:
                template = QuoteTemplate(
                    **template_data,
                    usage_count=0,
                    is_active=True,
                    is_system_template=True,
                    created_by="system",
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                session.add(template)
                print(f"  Created template: {template_data['template_name']}")
            else:
                print(f"  Template already exists: {template_data['template_name']}")
        
        session.commit()
        print("✅ Sample templates created successfully!")
        
    except Exception as e:
        session.rollback()
        print(f"❌ Error creating templates: {e}")
        raise
    finally:
        session.close()

def create_sample_assemblies():
    """Create sample construction assemblies"""
    print("Creating sample construction assemblies...")
    
    assemblies = [
        {
            "assembly_code": "ASM-WALL-001",
            "assembly_name": "Muro de Bloque + Repello + Pintura",
            "description": "Muro completo de bloque de concreto con repello y pintura a ambos lados",
            "assembly_type": "STRUCTURAL",
            "system_category": "WALLS",
            "unit_of_measure": "m2",
            "parameters_schema": {
                "height": {
                    "type": "number",
                    "unit": "m",
                    "default": 2.5,
                    "description": "Altura del muro"
                },
                "thickness": {
                    "type": "number", 
                    "unit": "m",
                    "default": 0.15,
                    "description": "Espesor del muro"
                },
                "openings_factor": {
                    "type": "number",
                    "unit": "%",
                    "default": 0.1,
                    "description": "Factor de descuento por aberturas"
                }
            },
            "default_parameters": {
                "height": 2.5,
                "thickness": 0.15,
                "openings_factor": 0.1
            },
            "is_parametric": True
        },
        {
            "assembly_code": "ASM-DOOR-001",
            "assembly_name": "Puerta Interior Completa",
            "description": "Puerta interior con marco, herrajes y acabados",
            "assembly_type": "ARCHITECTURAL",
            "system_category": "DOORS",
            "unit_of_measure": "c/u",
            "parameters_schema": {
                "width": {
                    "type": "number",
                    "unit": "m", 
                    "default": 0.9,
                    "description": "Ancho de la puerta"
                },
                "height": {
                    "type": "number",
                    "unit": "m",
                    "default": 2.1,
                    "description": "Alto de la puerta"
                },
                "material_grade": {
                    "type": "select",
                    "default": "standard",
                    "options": ["standard", "premium"],
                    "description": "Calidad del material"
                }
            },
            "default_parameters": {
                "width": 0.9,
                "height": 2.1,
                "material_grade": "standard"
            },
            "is_parametric": True
        },
        {
            "assembly_code": "ASM-ROOF-001",
            "assembly_name": "Cubierta de Zinc Acanalado",
            "description": "Cubierta completa con estructura, zinc y accesorios",
            "assembly_type": "STRUCTURAL",
            "system_category": "ROOFING",
            "unit_of_measure": "m2",
            "parameters_schema": {
                "slope": {
                    "type": "number",
                    "unit": "grados",
                    "default": 30,
                    "description": "Pendiente del techo"
                },
                "wind_load": {
                    "type": "select",
                    "default": "medium",
                    "options": ["low", "medium", "high"],
                    "description": "Carga de viento"
                }
            },
            "default_parameters": {
                "slope": 30,
                "wind_load": "medium"
            },
            "is_parametric": True
        }
    ]
    
    session = Session()
    try:
        for assembly_data in assemblies:
            existing = session.query(ConstructionAssembly).filter(
                ConstructionAssembly.assembly_code == assembly_data["assembly_code"]
            ).first()
            
            if not existing:
                assembly = ConstructionAssembly(
                    **assembly_data,
                    usage_count=0,
                    is_active=True,
                    is_custom=False,
                    created_by="system",
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                session.add(assembly)
                print(f"  Created assembly: {assembly_data['assembly_code']}")
            else:
                print(f"  Assembly already exists: {assembly_data['assembly_code']}")
        
        session.commit()
        print("✅ Sample assemblies created successfully!")
        
    except Exception as e:
        session.rollback()
        print(f"❌ Error creating assemblies: {e}")
        raise
    finally:
        session.close()

def main():
    """Main function to create all sample data"""
    print("🚀 Creating sample templates and assemblies...")
    
    session = Session()
    try:
        # Create cost items first
        cost_item_ids = create_sample_cost_items(session)
        
        # Create assemblies (if they don't exist)
        create_sample_assemblies()
        
        # Create assembly components
        create_assembly_components(session, cost_item_ids)
        
        # Create templates
        create_sample_templates()
        
        session.commit()
        print("🎉 All sample data created successfully!")
        
    except Exception as e:
        session.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        session.close()

if __name__ == "__main__":
    main() 