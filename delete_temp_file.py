import os
file_to_delete = r'F:/projects/flujo_demo/New Text Document.txt'
if os.path.exists(file_to_delete):
    os.remove(file_to_delete)
    print(f"Successfully deleted {file_to_delete}")
else:
    print(f"File not found: {file_to_delete}")