import json
import os
import re

log_path = r"C:\Users\AD\.gemini\antigravity\brain\77869023-31eb-4f32-aa34-75ba830db87b\.system_generated\tasks\task-2293.log"

if not os.path.exists(log_path):
    print("Log file not found!")
    exit(1)

with open(log_path, "r", encoding="utf-8") as f:
    content = f.read()

# Let's search for "name": "..." in the log file
tool_names = re.findall(r'"name"\s*:\s*"([^"]+)"', content)

# Also let's see if we can parse the JSON inside the log if it's there
# Let's clean up the tool names
tool_names = sorted(list(set(tool_names)))
print(f"Total tool names in log: {len(tool_names)}")
for name in tool_names:
    print("  ", name)
