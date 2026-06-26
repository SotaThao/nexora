import json
import os
import re

log_path = r"C:\Users\AD\.gemini\antigravity\brain\77869023-31eb-4f32-aa34-75ba830db87b\.system_generated\tasks\task-2293.log"

if not os.path.exists(log_path):
    print("Schema log not found!")
    exit(1)

with open(log_path, "r", encoding="utf-8") as f:
    content = f.read()

# Let's search for mentions of textStyleId, styleId, textStyle, text_style, style in tool schemas
matches = []
for m in re.finditer(r'"(textStyleId|styleId|textStyle|style)"', content, re.IGNORECASE):
    start = max(0, m.start() - 200)
    end = min(len(content), m.end() + 500)
    matches.append(content[start:end])

print(f"Total matches found: {len(matches)}")
for i, match in enumerate(matches[:5]):
    print(f"Match {i+1}:")
    print(match)
    print("=" * 40)
