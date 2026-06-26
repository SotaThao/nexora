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
            attrs_block = content[properties_pos : properties_pos + 12000]
            print("textStyleId found?", "textStyleId" in attrs_block)
            print("textStyle found?", "textStyle" in attrs_block)
            print("fontStyle found?", "fontStyle" in attrs_block)
            
            # Print lines containing style
            for line in attrs_block.split("\n"):
                if "style" in line.lower() or "font" in line.lower():
                    print("  ", line.strip())
else:
    print("nodes_setAttributes not found")
