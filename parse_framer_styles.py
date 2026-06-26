import json
import os

log_path = r"C:\Users\AD\.gemini\antigravity\brain\77869023-31eb-4f32-aa34-75ba830db87b\.system_generated\tasks\task-2432.log"

if not os.path.exists(log_path):
    print("Log not found!")
    exit(1)

with open(log_path, "r", encoding="utf-8") as f:
    content = f.read()

# Let's locate the RESULTS block
results_start = content.find("RESULTS:")
if results_start != -1:
    results_text = content[results_start + 8 :].strip()
    try:
        # The JSON might be followed by other logs, let's parse as much as possible
        # Or let's search for "colors" and "textStyles" keys using regex
        import re
        # Let's find the first '{' and the last '}' of the JSON block
        json_start = results_text.find("{")
        json_end = results_text.rfind("}")
        if json_start != -1 and json_end != -1:
            json_str = results_text[json_start : json_end + 1]
            data = json.loads(json_str)
            
            print("--- Colors in Project ---")
            colors = data.get("colors", [])
            for c in colors:
                print(f"  {c.get('name')} (ID: {c.get('id')}) - Light: {c.get('light')}, Dark: {c.get('dark')}")
                
            print("\n--- Font Families in Text Styles ---")
            styles = data.get("textStyles", [])
            fonts = set()
            for s in styles:
                fonts.add(s.get("fontFamily"))
                print(f"  {s.get('name')} (ID: {s.get('id')}) - Font: {s.get('fontFamily')}, Weight: {s.get('fontWeight')}, Color: {s.get('color', {}).get('name')}")
            print(f"\nUnique Fonts: {fonts}")
    except Exception as e:
        print("Parsing error:", e)
else:
    print("RESULTS: block not found in log")
