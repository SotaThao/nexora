import json
import os

log_path = r"C:\Users\AD\.gemini\antigravity\brain\77869023-31eb-4f32-aa34-75ba830db87b\.system_generated\tasks\task-2432.log"

if not os.path.exists(log_path):
    print("Log not found!")
    exit(1)

with open(log_path, "r", encoding="utf-8") as f:
    content = f.read()

# Let's search for styles_listColors response
# In the log: "name": "styles_listColors" or the result of that call
# Let's search for '"colors":' in the log
idx = content.find('"colors":')
if idx != -1:
    print("--- Found colors array ---")
    print(content[idx : idx + 1000])
else:
    print("colors array not found")
