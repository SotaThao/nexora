import json
import os

log_path = r"C:\Users\AD\.gemini\antigravity\brain\77869023-31eb-4f32-aa34-75ba830db87b\.system_generated\tasks\task-2432.log"

if not os.path.exists(log_path):
    print("Log not found!")
    exit(1)

with open(log_path, "r", encoding="utf-8") as f:
    for line in f:
        if "RECEIVED:" in line:
            # Let's print the line or part of it
            # It could contain the JSON response
            print(line[:300] + "...")
            if '"id": 2' in line or '"id": 3' in line:
                print("Full response:")
                print(line)
                print("="*50)
