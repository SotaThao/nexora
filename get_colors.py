import json
import os
import re

log_path = r"C:\Users\AD\.gemini\antigravity\brain\77869023-31eb-4f32-aa34-75ba830db87b\.system_generated\tasks\task-2432.log"

if not os.path.exists(log_path):
    print("Log not found!")
    exit(1)

with open(log_path, "r", encoding="utf-8") as f:
    content = f.read()

results_start = content.find("RESULTS:")
if results_start != -1:
    results_text = content[results_start + 8 :].strip()
    json_start = results_text.find("{")
    json_end = results_text.rfind("}")
    if json_start != -1 and json_end != -1:
        json_str = results_text[json_start : json_end + 1]
        try:
            data = json.loads(json_str)
            colors = data.get("colors", [])
            print(f"Colors list ({len(colors)} items):")
            for c in colors:
                print(f"  ID: {c.get('id')} | Name: {c.get('name')} | Light: {c.get('light')}")
        except Exception as e:
            print("Error parsing JSON:", e)
else:
    # Let's search for "colors" in the text directly
    print("RESULTS block not found, searching text directly:")
    matches = re.findall(r'"colors"\s*:\s*(\[[^\]]+\])', content)
    for m in matches:
        print(m[:500])
