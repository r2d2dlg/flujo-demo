import requests
import json

def insert_pagos_tierra_data():
    # Data to insert
    data = {
        "descripcion": "Pagos a tierra",
        "enero": 0,
        "febrero": 0,
        "marzo": 0,
        "abril": 0,
        "mayo": 0,
        "junio": 6000,
        "julio": 6000,
        "agosto": 6000,
        "septiembre": 6000,
        "octubre": 6000,
        "noviembre": 6000,
        "diciembre": 6000
    }

    try:
        # Make POST request to the API endpoint
        response = requests.post(
            "http://localhost:8000/api/pagos_tierra/",
            json=data
        )
        
        # Check if request was successful
        if response.status_code == 200:
            print("Successfully inserted pagos_tierra data")
            print("Response:", json.dumps(response.json(), indent=2))
        else:
            print(f"Error inserting data. Status code: {response.status_code}")
            print("Response:", response.text)
            
    except Exception as e:
        print(f"Error making request: {e}")

if __name__ == "__main__":
    insert_pagos_tierra_data() 