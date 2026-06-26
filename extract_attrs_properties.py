import json
import os

log_path = r"C:\Users\AD\.gemini\antigravity\brain\77869023-31eb-4f32-aa34-75ba830db87b\.system_generated\tasks\task-2293.log"

if not os.path.exists(log_path):
    print("Schema log not found!")
    exit(1)

with open(log_path, "r", encoding="utf-8") as f:
    content = f.read()

pos = content.find('"name": "nodes_setAttributes"')
if pos != -1:
    attrs_pos = content.find('"attrs":', pos)
    if attrs_pos != -1:
        properties_pos = content.find('"properties":', attrs_pos)
        if properties_pos != -1:
            print("--- properties of attrs (Part 4) ---")
            print(content[properties_pos + 9000 : properties_pos + 12000])
else:
    print("nodes_setAttributes not found")
