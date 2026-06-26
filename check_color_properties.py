import json
import os
import re

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
            attrs_block = content[properties_pos : properties_pos + 12000]
            # Search for color or text
            color_matches = [line.strip() for line in attrs_block.split("\n") if "color" in line.lower()]
            print("Lines with 'color':")
            for line in color_matches:
                print("  ", line)
else:
    print("nodes_setAttributes not found")
