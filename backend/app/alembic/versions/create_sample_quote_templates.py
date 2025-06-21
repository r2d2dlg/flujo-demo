"""Create sample quote templates

Revision ID: create_sample_templates
Revises: create_construction_quotation_tables
Create Date: 2024-01-21 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import json

# revision identifiers, used by Alembic.
revision = 'create_sample_templates'
down_revision = 'create_construction_quotation_tables'
branch_labels = None
depends_on = None


def upgrade():
    # Create sample templates
    
    # 1. Residential Construction Template
    residential_template = {
        "template_name": "Casa Residencial Estándar",
        "project_type": "RESIDENTIAL",
        "template_sections": {
            "Preparación del Terreno": {
                "description": "Trabajos preliminares y preparación",
                "items": [
                    {
                        "description": "Limpieza y descapote del terreno",
                        "quantity": 1,
                        "unit": "GLB",
                        "unit_cost": 2500.00,
                        "type": "LABOR"
                    },
                    {
                        "description": "Excavación para fundaciones",
                        "quantity": 50,
                        "unit": "m3",
                        "unit_cost": 35.00,
                        "type": "EQUIPMENT"
                    },
                    {
                        "description": "Relleno y compactación",
                        "quantity": 30,
                        "unit": "m3",
                        "unit_cost": 25.00,
                        "type": "MATERIAL"
                    }
                ]
            },
            "Estructura": {
                "description": "Trabajos estructurales",
                "items": [
                    {
                        "description": "Concreto para fundaciones f'c=210 kg/cm²",
                        "quantity": 25,
                        "unit": "m3",
                        "unit_cost": 185.00,
                        "type": "MATERIAL"
                    },
                    {
                        "description": "Acero de refuerzo #4",
                        "quantity": 2500,
                        "unit": "kg",
                        "unit_cost": 1.85,
                        "type": "MATERIAL"
                    },
                    {
                        "description": "Mano de obra estructural",
                        "quantity": 200,
                        "unit": "hr",
                        "unit_cost": 15.00,
                        "type": "LABOR"
                    }
                ]
            },
            "Mampostería": {
                "description": "Paredes y divisiones",
                "items": [
                    {
                        "description": "Bloque de concreto 15x20x40 cm",
                        "quantity": 800,
                        "unit": "UN",
                        "unit_cost": 1.25,
                        "type": "MATERIAL"
                    },
                    {
                        "description": "Mortero para pega",
                        "quantity": 15,
                        "unit": "m3",
                        "unit_cost": 95.00,
                        "type": "MATERIAL"
                    },
                    {
                        "description": "Mano de obra mampostería",
                        "quantity": 120,
                        "unit": "hr",
                        "unit_cost": 12.00,
                        "type": "LABOR"
                    }
                ]
            },
            "Acabados": {
                "description": "Acabados finales",
                "items": [
                    {
                        "description": "Repello interior",
                        "quantity": 180,
                        "unit": "m2",
                        "unit_cost": 8.50,
                        "type": "LABOR"
                    },
                    {
                        "description": "Pintura interior",
                        "quantity": 180,
                        "unit": "m2",
                        "unit_cost": 6.75,
                        "type": "MATERIAL"
                    },
                    {
                        "description": "Cerámica en baños",
                        "quantity": 35,
                        "unit": "m2",
                        "unit_cost": 25.00,
                        "type": "MATERIAL"
                    }
                ]
            }
        },
        "default_overhead": 18.00,
        "default_profit": 12.00,
        "default_contingency": 8.00,
        "is_system_template": True
    }
    
    # 2. Commercial Building Template
    commercial_template = {
        "template_name": "Edificio Comercial",
        "project_type": "COMMERCIAL",
        "template_sections": {
            "Cimentación": {
                "description": "Fundaciones comerciales",
                "items": [
                    {
                        "description": "Excavación mecanizada",
                        "quantity": 150,
                        "unit": "m3",
                        "unit_cost": 45.00,
                        "type": "EQUIPMENT"
                    },
                    {
                        "description": "Concreto ciclópeo",
                        "quantity": 80,
                        "unit": "m3",
                        "unit_cost": 165.00,
                        "type": "MATERIAL"
                    },
                    {
                        "description": "Zapatas de concreto armado",
                        "quantity": 45,
                        "unit": "m3",
                        "unit_cost": 220.00,
                        "type": "MATERIAL"
                    }
                ]
            },
            "Estructura Metálica": {
                "description": "Estructura principal",
                "items": [
                    {
                        "description": "Columnas metálicas",
                        "quantity": 8500,
                        "unit": "kg",
                        "unit_cost": 3.25,
                        "type": "MATERIAL"
                    },
                    {
                        "description": "Vigas metálicas",
                        "quantity": 6200,
                        "unit": "kg",
                        "unit_cost": 3.15,
                        "type": "MATERIAL"
                    },
                    {
                        "description": "Montaje estructura metálica",
                        "quantity": 1,
                        "unit": "GLB",
                        "unit_cost": 25000.00,
                        "type": "SUBCONTRACT"
                    }
                ]
            },
            "Fachada": {
                "description": "Cerramiento exterior",
                "items": [
                    {
                        "description": "Muro cortina de aluminio",
                        "quantity": 350,
                        "unit": "m2",
                        "unit_cost": 185.00,
                        "type": "SUBCONTRACT"
                    },
                    {
                        "description": "Vidrio templado 6mm",
                        "quantity": 280,
                        "unit": "m2",
                        "unit_cost": 45.00,
                        "type": "MATERIAL"
                    }
                ]
            },
            "Instalaciones": {
                "description": "MEP - Mecánicas, Eléctricas, Plomería",
                "items": [
                    {
                        "description": "Sistema eléctrico completo",
                        "quantity": 1,
                        "unit": "GLB",
                        "unit_cost": 35000.00,
                        "type": "SUBCONTRACT"
                    },
                    {
                        "description": "Sistema de plomería",
                        "quantity": 1,
                        "unit": "GLB",
                        "unit_cost": 18000.00,
                        "type": "SUBCONTRACT"
                    },
                    {
                        "description": "Sistema HVAC",
                        "quantity": 1,
                        "unit": "GLB",
                        "unit_cost": 42000.00,
                        "type": "SUBCONTRACT"
                    }
                ]
            }
        },
        "default_overhead": 15.00,
        "default_profit": 10.00,
        "default_contingency": 5.00,
        "is_system_template": True
    }
    
    # 3. Industrial Template
    industrial_template = {
        "template_name": "Nave Industrial",
        "project_type": "INDUSTRIAL",
        "template_sections": {
            "Movimiento de Tierra": {
                "description": "Preparación terreno industrial",
                "items": [
                    {
                        "description": "Excavación masiva",
                        "quantity": 2500,
                        "unit": "m3",
                        "unit_cost": 8.50,
                        "type": "EQUIPMENT"
                    },
                    {
                        "description": "Relleno controlado",
                        "quantity": 1800,
                        "unit": "m3",
                        "unit_cost": 12.00,
                        "type": "EQUIPMENT"
                    },
                    {
                        "description": "Compactación al 95% Proctor",
                        "quantity": 3500,
                        "unit": "m2",
                        "unit_cost": 3.25,
                        "type": "EQUIPMENT"
                    }
                ]
            },
            "Cimentación Industrial": {
                "description": "Fundaciones para cargas pesadas",
                "items": [
                    {
                        "description": "Concreto f'c=280 kg/cm²",
                        "quantity": 180,
                        "unit": "m3",
                        "unit_cost": 195.00,
                        "type": "MATERIAL"
                    },
                    {
                        "description": "Acero de refuerzo #5 y #6",
                        "quantity": 8500,
                        "unit": "kg",
                        "unit_cost": 1.95,
                        "type": "MATERIAL"
                    }
                ]
            },
            "Estructura Pre-fabricada": {
                "description": "Estructura principal nave",
                "items": [
                    {
                        "description": "Marcos pre-fabricados",
                        "quantity": 12,
                        "unit": "UN",
                        "unit_cost": 8500.00,
                        "type": "SUBCONTRACT"
                    },
                    {
                        "description": "Correas metálicas",
                        "quantity": 2800,
                        "unit": "ml",
                        "unit_cost": 25.00,
                        "type": "MATERIAL"
                    },
                    {
                        "description": "Cubierta metálica",
                        "quantity": 1200,
                        "unit": "m2",
                        "unit_cost": 35.00,
                        "type": "MATERIAL"
                    }
                ]
            },
            "Pisos Industriales": {
                "description": "Pisos para uso industrial",
                "items": [
                    {
                        "description": "Concreto f'c=210 kg/cm² e=15cm",
                        "quantity": 1200,
                        "unit": "m2",
                        "unit_cost": 28.00,
                        "type": "MATERIAL"
                    },
                    {
                        "description": "Endurecedor de superficie",
                        "quantity": 1200,
                        "unit": "m2",
                        "unit_cost": 8.50,
                        "type": "MATERIAL"
                    }
                ]
            }
        },
        "default_overhead": 12.00,
        "default_profit": 8.00,
        "default_contingency": 6.00,
        "is_system_template": True
    }
    
    # Insert templates
    connection = op.get_bind()
    
    templates = [residential_template, commercial_template, industrial_template]
    
    for template in templates:
        connection.execute(
            sa.text("""
                INSERT INTO quote_templates 
                (template_name, project_type, template_sections, default_overhead, 
                 default_profit, default_contingency, is_system_template, usage_count, 
                 is_active, created_by, created_at, updated_at)
                VALUES 
                (:template_name, :project_type, :template_sections, :default_overhead,
                 :default_profit, :default_contingency, :is_system_template, 0,
                 true, 'system', NOW(), NOW())
            """),
            {
                'template_name': template['template_name'],
                'project_type': template['project_type'],
                'template_sections': json.dumps(template['template_sections']),
                'default_overhead': template['default_overhead'],
                'default_profit': template['default_profit'],
                'default_contingency': template['default_contingency'],
                'is_system_template': template['is_system_template']
            }
        )


def downgrade():
    # Remove sample templates
    connection = op.get_bind()
    connection.execute(
        sa.text("DELETE FROM quote_templates WHERE is_system_template = true")
    ) 