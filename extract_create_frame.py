import json
import os

log_path = r"C:\Users\AD\.gemini\antigravity\brain\77869023-31eb-4f32-aa34-75ba830db87b\.system_generated\tasks\task-2293.log"

if not os.path.exists(log_path):
    print("Schema log not found!")
    exit(1)

with open(log_path, "r", encoding="utf-8") as f:
    content = f.read()

# Let's extract nodes_createFrame (more characters)
pos_cf = content.find('"name": "nodes_createFrame"')
if pos_cf != -1:
    print("--- nodes_createFrame (Full) ---")
    print(content[pos_cf - 100 : pos_cf + 3000])

# Let's extract nodes_setAttributes
pos_sa = content.find('"name": "nodes_setAttributes"')
if pos_sa != -1:
    print("\n--- nodes_setAttributes (Full) ---")
    print(content[pos_sa - 100 : pos_sa + 3000])
