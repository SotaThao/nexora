import json
import os

log_path = r"C:\Users\AD\.gemini\antigravity\brain\77869023-31eb-4f32-aa34-75ba830db87b\.system_generated\tasks\task-2293.log"

if not os.path.exists(log_path):
    print("Schema log not found!")
    exit(1)

with open(log_path, "r", encoding="utf-8") as f:
    content = f.read()

pos = content.find('"name": "nodes_addText"')
if pos != -1:
    print("--- nodes_addText Definition ---")
    print(content[pos - 100 : pos + 1200])
else:
    print("nodes_addText not found")
