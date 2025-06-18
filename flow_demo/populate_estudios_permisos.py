import requests
import json

# Data from the image
data = [
    {
        "actividad": "Diseño Oliver Abonos",
        "amount_2024_05": 5000,
        "amount_2024_06": 5000,
        "amount_2024_07": 5000,
        "amount_2024_08": 5000,
        "amount_2024_09": 5000,
        "amount_2024_10": 5000,
        "amount_2024_11": 5000,
        "amount_2024_12": 5000
    },
    {
        "actividad": "Estudios",
        "amount_2024_05": 0,
        "amount_2024_06": 0,
        "amount_2024_07": 0,
        "amount_2024_08": 0,
        "amount_2024_09": 0,
        "amount_2024_10": 0,
        "amount_2024_11": 0,
        "amount_2024_12": 0
    },
    {
        "actividad": "Permiso construccion",
        "amount_2024_05": 5000
    },
    {
        "actividad": "Permiso ocupacion",
        "amount_2024_05": 5000,
        "amount_2024_07": 5000
    }
]

# API endpoint
url = "http://localhost:8000/api/estudios_disenos_permisos/"

# Insert each record
for item in data:
    try:
        response = requests.post(url, json=item)
        if response.status_code == 200:
            print(f"Successfully inserted {item['actividad']}")
            print(f"Response: {json.dumps(response.json(), indent=2)}")
        else:
            print(f"Failed to insert {item['actividad']}")
            print(f"Status code: {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error inserting {item['actividad']}: {str(e)}") 